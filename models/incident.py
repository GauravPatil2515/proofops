import time
from sqlalchemy import Column, String, Integer, Float, Text, Boolean, JSON
from database import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    service_name = Column(String(128), nullable=False, default="checkout-api")
    severity = Column(String(32), nullable=False, default="high")
    status = Column(String(64), nullable=False, default="received")  # received, triage, reproducing, fixing, verifying, awaiting_approval, approved, rejected, resolved
    source = Column(String(64), nullable=False, default="sentry")
    culprit_commit = Column(String(64), nullable=True)
    culprit_release = Column(String(64), nullable=True)
    hypothesis = Column(Text, nullable=True)
    created_at = Column(Float, default=time.time)
    updated_at = Column(Float, default=time.time, onupdate=time.time)
    resolved_at = Column(Float, nullable=True)
    metadata_json = Column(JSON, default=dict)


class IncidentTask(Base):
    __tablename__ = "incident_tasks"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), index=True, nullable=False)
    role = Column(String(64), nullable=False)  # triager, repro, fixer, verifier
    assigned_agent = Column(String(128), nullable=False)
    status = Column(String(32), default="pending")  # pending, running, completed, failed
    instructions = Column(Text, nullable=True)
    result = Column(Text, nullable=True)
    started_at = Column(Float, nullable=True)
    completed_at = Column(Float, nullable=True)


class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), index=True, nullable=False)
    repro_exit_code = Column(Integer, nullable=False)
    repro_trace = Column(Text, nullable=True)
    patch_diff = Column(Text, nullable=False)
    patch_sha256 = Column(String(64), nullable=False)
    test_exit_code = Column(Integer, nullable=False)
    test_summary = Column(Text, nullable=True)
    gate_verdict = Column(String(32), nullable=False)  # VERIFIED, REJECTED
    authorized_by = Column(String(128), default="proofops-verifier")
    attestation_json = Column(Text, nullable=True)
    dsse_envelope = Column(JSON, nullable=True)
    created_at = Column(Float, default=time.time)


class Approval(Base):
    __tablename__ = "approvals"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), index=True, nullable=False)
    patch_sha256 = Column(String(64), nullable=False)
    decision = Column(String(32), nullable=False)  # approved, rejected
    decided_by = Column(String(128), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(Float, default=time.time)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(64), primary_key=True, index=True)
    incident_id = Column(String(64), index=True, nullable=False)
    actor = Column(String(128), nullable=False)
    event_type = Column(String(64), nullable=False)
    description = Column(Text, nullable=False)
    payload = Column(JSON, default=dict)
    created_at = Column(Float, default=time.time)

