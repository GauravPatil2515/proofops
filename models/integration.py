import time
from sqlalchemy import Column, String, Float, Text, Boolean, JSON
from database import Base


class Integration(Base):
    __tablename__ = "integrations"

    id = Column(String(64), primary_key=True, index=True)
    provider = Column(String(64), unique=True, nullable=False)  # sentry, github, switch
    name = Column(String(128), nullable=False)
    status = Column(String(32), default="connected")  # connected, needs_attention, disconnected
    account_id = Column(String(128), nullable=True)
    account_label = Column(String(128), nullable=True)
    granted_scopes = Column(JSON, default=list)
    last_synced_at = Column(Float, default=time.time)
    config_json = Column(JSON, default=dict)


class WebhookDelivery(Base):
    __tablename__ = "webhook_deliveries"

    delivery_id = Column(String(128), primary_key=True)
    provider = Column(String(64), nullable=False)
    event_type = Column(String(64), nullable=False)
    processed_at = Column(Float, default=time.time)
    status = Column(String(32), default="processed")  # processed, duplicate, rejected
    payload = Column(JSON, default=dict)

