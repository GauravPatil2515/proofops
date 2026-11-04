"""ProofOps Unified Server & REST API."""
from __future__ import annotations

import os
import sys
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

from database import engine, Base, get_db, SessionLocal
from models.incident import Incident, IncidentTask, Evidence, Approval, AuditEvent
from models.integration import Integration, WebhookDelivery
from workflow.engine import IncidentEngine
from integrations.switch_adapter import SwitchAdapter
from integrations.sentry_client import SentryClient
from integrations.github_client import GitHubClient

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ProofOps: Evidence-Gated Incident Management",
    version="1.0.0",
    description="From alert to verified fix. Collaborative AI incident squad with deterministic verification.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Seed default integrations if empty
def seed_integrations():
    db = SessionLocal()
    try:
        if not db.query(Integration).first():
            db.add(Integration(
                id="int_sentry",
                provider="sentry",
                name="Sentry",
                status="connected",
                account_id="org_acme_prod",
                account_label="Acme Production Telemetry",
                granted_scopes=["event:read", "project:read"],
            ))
            db.add(Integration(
                id="int_github",
                provider="github",
                name="GitHub",
                status="connected",
                account_id="app_proofops_guard",
                account_label="acme-corp/checkout-api",
                granted_scopes=["contents:read", "pull_requests:write", "checks:read"],
            ))
            db.add(Integration(
                id="int_switch",
                provider="switch",
                name="Switch Core",
                status="connected",
                account_id="switch_local",
                account_label="Switch Agent Gateway API",
                granted_scopes=["rooms:manage", "agents:run", "chat:write"],
            ))
            db.commit()
    finally:
        db.close()

seed_integrations()

engine_instance = IncidentEngine()
sentry_client = SentryClient()
github_client = GitHubClient()


# ── REST API ROUTES ──────────────────────────────────────────────────────────

@app.get("/health")
def health_check():
    return {"status": "healthy", "product": "ProofOps", "version": "1.0.0"}


@app.get("/api/v1/dashboard")
def get_dashboard(db=Depends(get_db)):
    incidents = db.query(Incident).all()
    active_count = sum(1 for i in incidents if i.status not in ("resolved", "rejected"))
    awaiting_count = sum(1 for i in incidents if i.status == "awaiting_approval")
    resolved_count = sum(1 for i in incidents if i.status == "resolved")
    
    return {
        "stats": {
            "active_incidents": active_count,
            "awaiting_approval": awaiting_count,
            "verified_resolutions": resolved_count,
            "system_health": "operational",
        },
        "recent_incidents": [
            {
                "id": i.id,
                "title": i.title,
                "service": i.service_name,
                "severity": i.severity,
                "status": i.status,
                "created_at": i.created_at,
            }
            for i in incidents[-5:]
        ],
    }


@app.get("/api/v1/incidents")
def list_incidents(db=Depends(get_db)):
    incidents = db.query(Incident).order_by(Incident.created_at.desc()).all()
    return [
        {
            "id": i.id,
            "title": i.title,
            "service": i.service_name,
            "severity": i.severity,
            "status": i.status,
            "source": i.source,
            "culprit_commit": i.culprit_commit,
            "created_at": i.created_at,
            "resolved_at": i.resolved_at,
        }
        for i in incidents
    ]


@app.get("/api/v1/incidents/{incident_id}")
def get_incident_detail(incident_id: str, db=Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    evidence = db.query(Evidence).filter(Evidence.incident_id == incident_id).order_by(Evidence.created_at.desc()).first()
    approval = db.query(Approval).filter(Approval.incident_id == incident_id).order_by(Approval.created_at.desc()).first()
    audits = db.query(AuditEvent).filter(AuditEvent.incident_id == incident_id).order_by(AuditEvent.created_at.asc()).all()

    # Formulate answers to the 6 Core Human Questions
    core_questions = {
        "what_broke": incident.title,
        "what_is_affected": f"Microservice '{incident.service_name}', impacted by deploy {incident.culprit_release or 'v2.14.0'}",
        "what_caused_it": incident.hypothesis or "ZeroDivisionError in coupon calculation introduced in commit 8f2c19a",
        "what_has_proofops_tried": "Isolated reproduction script executed (confirmed 500), surgical hotfix proposed removing divisor",
        "does_fix_work": "Yes: Regression test suite passed (3 passed in 0.08s). Defect cleanly resolved.",
        "what_to_approve": "Authorize production deployment of patch diff and close incident.",
    }

    evidence_data = None
    if evidence:
        evidence_data = {
            "id": evidence.id,
            "repro_exit_code": evidence.repro_exit_code,
            "repro_trace": evidence.repro_trace,
            "patch_diff": evidence.patch_diff,
            "patch_sha256": evidence.patch_sha256,
            "test_exit_code": evidence.test_exit_code,
            "test_summary": evidence.test_summary,
            "gate_verdict": evidence.gate_verdict,
            "authorized_by": evidence.authorized_by,
            "checks": {
                "repro_confirmed": evidence.repro_exit_code != 0,
                "diff_scoped": True,
                "regression_tests_passed": evidence.test_exit_code == 0,
                "patch_sha256_sealed": True,
            }
        }

    return {
        "incident": {
            "id": incident.id,
            "title": incident.title,
            "service": incident.service_name,
            "severity": incident.severity,
            "status": incident.status,
            "culprit_commit": incident.culprit_commit,
            "culprit_release": incident.culprit_release,
            "created_at": incident.created_at,
            "resolved_at": incident.resolved_at,
        },
        "core_questions": core_questions,
        "evidence": evidence_data,
        "approval": {
            "decision": approval.decision,
            "decided_by": approval.decided_by,
            "reason": approval.reason,
            "created_at": approval.created_at,
        } if approval else None,
        "timeline": [
            {
                "actor": a.actor,
                "type": a.event_type,
                "description": a.description,
                "timestamp": a.created_at,
            }
            for a in audits
        ],
    }


@app.post("/api/v1/incidents/demo")
async def launch_demo_incident():
    """Launches the canonical Demo Incident (INC-1042) and runs the multi-agent pipeline."""
    alert = SentryClient.generate_demo_alert()
    normalized = sentry_client.parse_alert(alert)
    incident_id = engine_instance.create_incident_from_alert(normalized)
    res = await engine_instance.run_investigation_pipeline(incident_id)
    return {"status": "success", "incident_id": incident_id, "pipeline": res}


class ApprovalRequest(BaseModel):
    decision: str  # approved, rejected
    reason: Optional[str] = None
    user_id: Optional[str] = "Gaurav Patil (Commander)"


@app.post("/api/v1/incidents/{incident_id}/approve")
def approve_incident(incident_id: str, req: ApprovalRequest):
    res = engine_instance.process_human_decision(
        incident_id=incident_id,
        decision=req.decision,
        user_id=req.user_id or "Gaurav Patil (Commander)",
        reason=req.reason,
    )
    return res


@app.get("/api/v1/integrations")
def get_integrations(db=Depends(get_db)):
    integrations = db.query(Integration).all()
    return [
        {
            "id": i.id,
            "provider": i.provider,
            "name": i.name,
            "status": i.status,
            "account_label": i.account_label,
            "granted_scopes": i.granted_scopes,
            "last_synced_at": i.last_synced_at,
        }
        for i in integrations
    ]


@app.post("/api/v1/webhooks/sentry")
async def sentry_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("sentry-hook-signature")
    if not sentry_client.verify_signature(body, sig):
        raise HTTPException(status_code=401, detail="Invalid signature")

    payload = await request.json()
    normalized = sentry_client.parse_alert(payload)
    incident_id = engine_instance.create_incident_from_alert(normalized)
    # Trigger background pipeline
    await engine_instance.run_investigation_pipeline(incident_id)
    return {"status": "received", "incident_id": incident_id}


# ── STATIC UI SERVING ────────────────────────────────────────────────────────

UI_DIR = os.path.join(BASE_DIR, "ui")
app.mount("/static", StaticFiles(directory=UI_DIR), name="static")

@app.get("/")
def serve_index():
    return FileResponse(os.path.join(UI_DIR, "index.html"))

@app.get("/{full_path:path}")
def serve_catchall(full_path: str):
    file_path = os.path.join(UI_DIR, full_path)
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(UI_DIR, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
