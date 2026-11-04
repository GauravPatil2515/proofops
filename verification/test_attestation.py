"""Unit tests for in-toto Statement v1 & DSSE Attestation Engine."""
import json
import base64
import pytest
from verification.attestation import AttestationSigner


def test_attestation_lifecycle_and_dsse_verification():
    signer = AttestationSigner()
    pub_key_pem = signer.get_public_key_pem()

    diff = "--- a/app.py\n+++ b/app.py\n@@ -1 +1 @@\n-discount = 0\n+discount = 1\n"
    statement = signer.build_intoto_statement(
        incident_id="PO-TEST-1",
        service_name="checkout-api",
        patch_diff=diff,
        repro_script_path="services/checkout-api/repro_script.py",
        repro_output="ZeroDivisionError reproduced",
        repro_exit_code=1,
        test_summary="3 passed in 0.05s",
        test_exit_code=0,
        switch_room_id="room_test_101",
    )

    assert statement["_type"] == "https://in-toto.io/Statement/v1"
    assert statement["predicateType"] == "https://proofops.dev/attestation/evidence/v1"
    assert statement["predicate"]["repro"]["signature_verified"] is True

    # Sign with DSSE
    envelope = signer.sign_dsse(statement)
    assert envelope["payloadType"] == "application/vnd.in-toto+json"
    assert len(envelope["signatures"]) == 1

    # Verify signature passes
    assert AttestationSigner.verify_dsse(envelope, pub_key_pem) is True

    # Tamper test: Alter 1 byte in payload
    tampered_envelope = json.loads(json.dumps(envelope))
    raw_payload = base64.b64decode(tampered_envelope["payload"]).decode("utf-8")
    tampered_payload = raw_payload.replace("checkout-api", "malicious-api")
    tampered_envelope["payload"] = base64.b64encode(tampered_payload.encode("utf-8")).decode("ascii")

    # Verify signature FAILS on tampered payload
    assert AttestationSigner.verify_dsse(tampered_envelope, pub_key_pem) is False

