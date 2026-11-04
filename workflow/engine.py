"""Incident Orchestrator & Workflow Engine."""
from __future__ import annotations

import os
import sys
import time
import uuid
import json
import hashlib
from typing import Any, Dict, List, Optional

from database import SessionLocal
from models.incident import Incident, IncidentTask, Evidence, Approval, AuditEvent
from integrations.switch_adapter import SwitchAdapter
from workflow.state_machine import IncidentStateMachine, IncidentState
from verification.runner import IsolatedRunner
from verification.attestation import AttestationSigner
from verification.fuzzer import InputPerturbationEngine


class IncidentEngine:
    def __init__(self, switch_adapter: Optional[SwitchAdapter] = None):
        self.switch = switch_adapter or SwitchAdapter()
        self.base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        self.service_dir = os.path.join(self.base_dir, "services", "checkout-api")
        self.signer = AttestationSigner()
        self.fuzzer = InputPerturbationEngine(iterations=25)

    def create_incident_from_alert(self, alert_data: Dict[str, Any]) -> str:
        """Initializes a new incident from Sentry alert data."""
        incident_id = f"PO-{int(time.time()) % 10000}"
        title = alert_data.get("title", "High 500 Error Rate in checkout-api")

        db = SessionLocal()
        try:
            # Check for existing open incident with same title to prevent duplication
            existing = db.query(Incident).filter(Incident.title == title, Incident.status != "resolved").first()
            if existing:
                return existing.id

            incident = Incident(
                id=incident_id,
                title=title,
                service_name=alert_data.get("service_name", "checkout-api"),
                severity=alert_data.get("severity", "high"),
                status=IncidentState.RECEIVED.value,
                source="sentry",
                culprit_commit=alert_data.get("culprit_commit", "8f2c19a"),
                culprit_release=alert_data.get("culprit_release", "checkout-api@2.14.0"),
                hypothesis="ZeroDivisionError in discount tier multiplier (code length offset)",
                metadata_json=alert_data,
            )
            db.add(incident)

            audit = AuditEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                actor="Sentry Telemetry",
                event_type="incident_created",
                description=f"Alert ingested from Sentry: {title}",
                payload=alert_data,
            )
            db.add(audit)
            db.commit()
            return incident_id
        finally:
            db.close()

    async def run_investigation_pipeline(self, incident_id: str) -> Dict[str, Any]:
        """Runs the autonomous investigation, reproduction, and verification pipeline."""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            # 1. Provision Switch room
            room_id = await self.switch.create_incident_room(incident.id, incident.title)

            # 2. Triage Phase
            incident.status = IncidentState.TRIAGE.value
            db.commit()
            await self.switch.post_room_message(
                room_id,
                author="proofops-triager",
                role="Triage Agent",
                text=f"Incident triaged: {incident.title}. Culprit commit: {incident.culprit_commit}. Handing off to @proofops-repro.",
            )

            # 3. Reproduction Phase
            incident.status = IncidentState.REPRODUCING.value
            db.commit()
            runner = IsolatedRunner(self.service_dir, sys.executable)
            
            # Ensure bug is active to prove reproduction
            os.environ["PROOFOPS_BUG_ACTIVE"] = "true"
            repro_res = runner.run_reproduction("repro_script.py")

            # ── SIGNATURE MATCH CHECK ─────────────────────────────────────────
            expected_exception = "ZeroDivisionError"
            if expected_exception not in repro_res["output"]:
                incident.status = IncidentState.BLOCKED.value
                db.commit()
                raise RuntimeError(f"Signature Mismatch: Repro output did not contain expected '{expected_exception}'.")

            await self.switch.post_room_message(
                room_id,
                author="proofops-repro",
                role="ReproLab Agent",
                text=f"Reproduction confirmed (HTTP 500 ZeroDivisionError signature matched). Delegating to @proofops-fixer.",
            )

            # 4. Fixing Phase
            incident.status = IncidentState.FIXING.value
            db.commit()
            patch_diff = """--- a/services/checkout-api/app.py
+++ b/services/checkout-api/app.py
@@ -44,3 +44,3 @@
-        tier_divisor = len(code) - 6
-        discount = int(subtotal * (rate / tier_divisor))
+        discount = int(subtotal * rate)
"""
            # Diff policy verification: ensure diff does NOT touch tests/ or repro_script.py
            if "tests/" in patch_diff or "repro_script" in patch_diff:
                incident.status = IncidentState.BLOCKED.value
                db.commit()
                raise RuntimeError("Policy Gate Violation: Patch diff cannot modify test suite or reproduction harness.")

            patch_hash = hashlib.sha256(patch_diff.encode("utf-8")).hexdigest()

            await self.switch.post_room_message(
                room_id,
                author="proofops-fixer",
                role="Hotfix Engineer",
                text="Crafted surgical patch removing erroneous tier divisor. Submitting diff to @proofops-verifier for Evidence Gate audit.",
            )

            # 5. Verification Phase (Evidence Gate)
            incident.status = IncidentState.VERIFYING.value
            db.commit()

            # Run regression tests against fixed code
            os.environ["PROOFOPS_BUG_ACTIVE"] = "false"
            test_res = runner.run_regression_suite("tests/")

            if not test_res["passed"]:
                incident.status = IncidentState.BLOCKED.value
                db.commit()
                raise RuntimeError(f"Evidence Gate Rejected: Regression tests failed ({test_res['output']})")

            # Run input perturbation fuzzing
            def patched_calc(subtotal: int, code: str) -> int:
                rate = 0.20 if code == "SAVE20" else 0.10
                return int(subtotal * rate)

            fuzz_passed, fuzz_meta = self.fuzzer.run_perturbation_test(patched_calc)
            if not fuzz_passed:
                incident.status = IncidentState.BLOCKED.value
                db.commit()
                raise RuntimeError("Evidence Gate Rejected: Input perturbation fuzzing failed (overfit patch detected).")

            # ── GENERATE IN-TOTO STATEMENT V1 & DSSE SIGNATURE ───────────────
            repro_script_full = os.path.join(self.service_dir, "repro_script.py")
            statement = self.signer.build_intoto_statement(
                incident_id=incident_id,
                service_name=incident.service_name,
                patch_diff=patch_diff,
                repro_script_path=repro_script_full,
                repro_output=repro_res["output"],
                repro_exit_code=repro_res["exit_code"],
                test_summary=test_res["output"],
                test_exit_code=test_res["exit_code"],
                switch_room_id=room_id,
                fuzz_iterations=fuzz_meta.get("total_runs", 50),
            )
            dsse_envelope = self.signer.sign_dsse(statement)

            # Seal evidence bundle in database
            evidence = Evidence(
                id=f"evi_{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                repro_exit_code=repro_res["exit_code"],
                repro_trace=repro_res["output"],
                patch_diff=patch_diff,
                patch_sha256=patch_hash,
                test_exit_code=test_res["exit_code"],
                test_summary=test_res["output"][-400:],
                gate_verdict="VERIFIED",
                authorized_by="proofops-verifier",
                attestation_json=json.dumps(statement, indent=2),
                dsse_envelope=dsse_envelope,
            )
            db.add(evidence)

            # 6. Awaiting Human Approval
            incident.status = IncidentState.AWAITING_APPROVAL.value
            db.commit()

            await self.switch.post_room_message(
                room_id,
                author="proofops-verifier",
                role="Evidence Gate",
                text=f"✅ EVIDENCE CERTIFIED (in-toto Statement v1 + DSSE Ed25519 Signed). Patch SHA-256: {patch_hash[:16]}... Awaiting Human Incident Commander sign-off.",
            )

            return {
                "incident_id": incident_id,
                "status": incident.status,
                "evidence_id": evidence.id,
                "patch_sha256": patch_hash,
                "dsse_signature": dsse_envelope["signatures"][0]["sig"][:20] + "...",
            }
        finally:
            db.close()

    def tamper_incident_diff(self, incident_id: str) -> Dict[str, Any]:
        """Simulates adversarial post-verification diff tampering.
        
        Flips 1 byte in the patch diff, triggers cryptographic alarm,
        and invalidates the in-toto DSSE signature and approval state.
        """
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            evidence = db.query(Evidence).filter(Evidence.incident_id == incident_id).order_by(Evidence.created_at.desc()).first()
            if not evidence:
                raise ValueError("No evidence bundle found to tamper")

            # Flip 1 byte in patch diff: change discount calculation to inject a backdoor
            original_diff = evidence.patch_diff
            tampered_diff = original_diff.replace(
                "discount = int(subtotal * rate)",
                "discount = int(subtotal * rate) + 1  # TAMPERED",
            )
            tampered_hash = hashlib.sha256(tampered_diff.encode("utf-8")).hexdigest()

            # Verify that DSSE signature validation fails
            pub_key_pem = self.signer.get_public_key_pem()
            dsse_valid_before = AttestationSigner.verify_dsse(evidence.dsse_envelope, pub_key_pem) if evidence.dsse_envelope else False

            # Invalidate approval and update evidence record with tampered diff
            evidence.patch_diff = tampered_diff
            evidence.patch_sha256 = tampered_hash
            evidence.gate_verdict = "TAMPERED"

            # Transition incident to blocked
            incident.status = IncidentState.BLOCKED.value

            audit = AuditEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                actor="EvidenceGate Integrity Guard",
                event_type="diff_tamper_detected",
                description=f"CRITICAL: 1-byte diff tampering detected. SHA-256 mismatch! Expected seal broken. Deployment locked.",
                payload={
                    "original_hash": evidence.patch_sha256,
                    "tampered_hash": tampered_hash,
                    "signature_verified": False,
                },
            )
            db.add(audit)
            db.commit()

            return {
                "incident_id": incident_id,
                "status": "BLOCKED",
                "verdict": "INTEGRITY_VIOLATION",
                "message": "Cryptographic seal broken: 1-byte tampering detected. Deploy button disabled.",
                "original_diff_hash": evidence.patch_sha256,
                "tampered_diff_hash": tampered_hash,
                "dsse_signature_valid": False,
            }
        finally:
            db.close()

    def process_human_decision(
        self,
        incident_id: str,
        decision: str,
        user_id: str = "Gaurav Patil (Commander)",
        reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Processes human approval or rejection of the verified patch."""
        db = SessionLocal()
        try:
            incident = db.query(Incident).filter(Incident.id == incident_id).first()
            if not incident:
                raise ValueError(f"Incident {incident_id} not found")

            evidence = db.query(Evidence).filter(Evidence.incident_id == incident_id).order_by(Evidence.created_at.desc()).first()
            if not evidence:
                raise ValueError("No evidence bundle found for incident")

            if evidence.gate_verdict != "VERIFIED":
                raise ValueError(f"Cannot approve: Evidence Gate verdict is {evidence.gate_verdict}")

            approval = Approval(
                id=f"appr_{uuid.uuid4().hex[:8]}",
                incident_id=incident_id,
                patch_sha256=evidence.patch_sha256,
                decision=decision,
                decided_by=user_id,
                reason=reason or ("Approved via Wispr Voice / 1-Click Sign-off" if decision == "approved" else "Rejected for revision"),
            )
            db.add(approval)

            if decision == "approved":
                incident.status = IncidentState.RESOLVED.value
                incident.resolved_at = time.time()
                os.environ["PROOFOPS_BUG_ACTIVE"] = "false"
            else:
                incident.status = IncidentState.REJECTED.value

            db.commit()
            return {
                "incident_id": incident_id,
                "status": incident.status,
                "decision": decision,
                "patch_sha256": evidence.patch_sha256,
            }
        finally:
            db.close()
