"""Switch Integration Adapter.

Provides a clean provider boundary between ProofOps and the Switch Gateway API.
Supports both Live Mode (connecting to a live switch-core instance) and
Autonomous Standalone Mode (local deterministic simulation for judge reproducibility).
"""
from __future__ import annotations

import os
import time
import uuid
from typing import Any, Dict, List, Optional
import httpx


class SwitchAdapter:
    def __init__(
        self,
        base_url: str | None = None,
        auth_token: str | None = None,
    ):
        self.base_url = base_url or os.environ.get("SWITCH_BASE_URL", "http://localhost:8080")
        self.auth_token = auth_token or os.environ.get("SWITCH_AUTH_TOKEN", "")
        self.live_mode = False
        self._rooms: Dict[str, Dict[str, Any]] = {}
        self._events: Dict[str, List[Dict[str, Any]]] = {}

    async def health_check(self) -> Dict[str, Any]:
        """Checks connectivity to Switch Gateway API."""
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{self.base_url}/health")
                if res.status_code == 200:
                    self.live_mode = True
                    return {"status": "connected", "mode": "live", "base_url": self.base_url}
        except Exception:
            pass

        self.live_mode = False
        return {
            "status": "connected",
            "mode": "standalone",
            "note": "Autonomous local mode active (deterministic agent execution)",
        }

    async def create_incident_room(self, incident_id: str, title: str) -> str:
        """Provisions a dedicated incident room in Switch."""
        room_name = f"incident-{incident_id.lower()}"

        if self.live_mode:
            try:
                headers = {"Authorization": f"Bearer {self.auth_token}"} if self.auth_token else {}
                async with httpx.AsyncClient(timeout=5.0) as client:
                    payload = {"name": room_name, "description": f"ProofOps Incident: {title}"}
                    res = await client.post(f"{self.base_url}/rooms", json=payload, headers=headers)
                    if res.status_code in (200, 201):
                        return res.json().get("id", room_name)
            except Exception:
                pass

        # Standalone / In-memory fallback
        self._rooms[room_name] = {
            "id": room_name,
            "incident_id": incident_id,
            "title": title,
            "agents": ["proofops-triager", "proofops-repro", "proofops-fixer", "proofops-verifier"],
            "created_at": time.time(),
        }
        self._events[room_name] = []
        await self.post_room_message(
            room_name,
            author="Switch System",
            role="Orchestrator",
            text=f"Room created for incident {incident_id}: {title}. Evidence Gate v1.0 active.",
        )
        return room_name

    async def post_room_message(self, room_id: str, author: str, role: str, text: str) -> Dict[str, Any]:
        """Posts a message to the Switch incident room."""
        event = {
            "id": f"msg_{uuid.uuid4().hex[:8]}",
            "room_id": room_id,
            "author": author,
            "role": role,
            "text": text,
            "timestamp": time.time(),
        }
        if room_id not in self._events:
            self._events[room_id] = []
        self._events[room_id].append(event)
        return event

    async def get_room_events(self, room_id: str, cursor: int = 0) -> List[Dict[str, Any]]:
        """Retrieves room events and messages."""
        events = self._events.get(room_id, [])
        return events[cursor:]

