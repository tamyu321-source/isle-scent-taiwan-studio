"""SQLite-backed mission, authority, policy, token and audit primitives.

This is a portfolio prototype. Principals are supplied by the caller; a real
deployment must authenticate them before calling this module.
"""

from __future__ import annotations

import hashlib
import json
import secrets
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
from pathlib import Path


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _stamp(value: datetime) -> str:
    return value.isoformat(timespec="microseconds")


def _canonical(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


class RuntimeErrorCode(Exception):
    def __init__(self, code: str, message: str):
        super().__init__(message)
        self.code = code


class MissionRuntime:
    def __init__(self, database: str | Path = ":memory:"):
        self._lock = threading.RLock()
        self.db = sqlite3.connect(str(database), isolation_level=None, check_same_thread=False, timeout=10)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA foreign_keys = ON")
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS grants (
                principal TEXT NOT NULL, role TEXT NOT NULL, resource TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                PRIMARY KEY (principal, role, resource)
            );
            CREATE TABLE IF NOT EXISTS missions (
                id TEXT PRIMARY KEY, request_key TEXT NOT NULL UNIQUE,
                actor TEXT NOT NULL, resource TEXT NOT NULL, amount INTEGER NOT NULL,
                destination TEXT NOT NULL, state TEXT NOT NULL,
                approver TEXT, created_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS tokens (
                token_hash TEXT PRIMARY KEY, mission_id TEXT NOT NULL UNIQUE,
                actor TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT,
                FOREIGN KEY (mission_id) REFERENCES missions(id)
            );
            CREATE TABLE IF NOT EXISTS effects (
                mission_id TEXT PRIMARY KEY, effect TEXT NOT NULL, created_at TEXT NOT NULL,
                FOREIGN KEY (mission_id) REFERENCES missions(id)
            );
            CREATE TABLE IF NOT EXISTS audit (
                seq INTEGER PRIMARY KEY AUTOINCREMENT, at TEXT NOT NULL,
                mission_id TEXT NOT NULL, actor TEXT NOT NULL, event TEXT NOT NULL,
                details TEXT NOT NULL, prev_hash TEXT NOT NULL, event_hash TEXT NOT NULL
            );
        """)

    def close(self) -> None:
        self.db.close()

    @contextmanager
    def _transaction(self):
        with self._lock:
            self.db.execute("BEGIN IMMEDIATE")
            try:
                yield
                self.db.execute("COMMIT")
            except BaseException:
                self.db.execute("ROLLBACK")
                raise

    def _event(self, mission_id: str, actor: str, event: str, details: dict) -> None:
        row = self.db.execute("SELECT event_hash FROM audit ORDER BY seq DESC LIMIT 1").fetchone()
        previous = row["event_hash"] if row else "0" * 64
        body = {"at": _stamp(_now()), "mission_id": mission_id, "actor": actor,
                "event": event, "details": details, "prev_hash": previous}
        digest = hashlib.sha256(_canonical(body).encode("utf-8")).hexdigest()
        self.db.execute(
            "INSERT INTO audit(at, mission_id, actor, event, details, prev_hash, event_hash) "
            "VALUES(?, ?, ?, ?, ?, ?, ?)",
            (body["at"], mission_id, actor, event, _canonical(details), previous, digest),
        )

    def grant(self, principal: str, role: str, resource: str, *, hours: int = 24) -> None:
        if role not in {"payment_operator", "payment_approver"} or hours < 1:
            raise RuntimeErrorCode("INVALID_GRANT", "Unsupported role or expiry")
        with self._transaction():
            self.db.execute(
                "INSERT INTO grants VALUES(?, ?, ?, ?) ON CONFLICT(principal, role, resource) "
                "DO UPDATE SET expires_at=excluded.expires_at",
                (principal, role, resource, _stamp(_now() + timedelta(hours=hours))),
            )
            self._event("authority", principal, "GRANT_CREATED", {"role": role, "resource": resource})

    def _has_role(self, principal: str, role: str, resource: str) -> bool:
        return self.db.execute(
            "SELECT 1 FROM grants WHERE principal=? AND role=? AND resource=? AND expires_at>?",
            (principal, role, resource, _stamp(_now())),
        ).fetchone() is not None

    def submit(self, *, actor: str, resource: str, amount: int, destination: str,
               request_key: str) -> dict:
        if not actor or not resource or not destination or not request_key or amount <= 0:
            raise RuntimeErrorCode("INVALID_REQUEST", "Required fields and a positive amount are needed")
        with self._transaction():
            existing = self.db.execute("SELECT * FROM missions WHERE request_key=?", (request_key,)).fetchone()
            if existing:
                if (existing["actor"], existing["resource"], existing["amount"], existing["destination"]) != (actor, resource, amount, destination):
                    raise RuntimeErrorCode("IDEMPOTENCY_CONFLICT", "Request key has different content")
                return dict(existing)
            mission_id = "mis_" + secrets.token_hex(6)
            if not self._has_role(actor, "payment_operator", resource):
                state, reason = "DENIED", "NO_AUTHORITY"
            elif destination.startswith("blocked:"):
                state, reason = "DENIED", "BLOCKED_DESTINATION"
            elif amount > 1000:
                state, reason = "DENIED", "POLICY_LIMIT"
            elif amount > 500:
                state, reason = "PENDING_APPROVAL", "TWO_PERSON_REVIEW"
            else:
                state, reason = "READY", "WITHIN_LIMIT"
            self.db.execute(
                "INSERT INTO missions VALUES(?, ?, ?, ?, ?, ?, ?, NULL, ?)",
                (mission_id, request_key, actor, resource, amount, destination, state, _stamp(_now())),
            )
            self._event(mission_id, actor, "MISSION_SUBMITTED", {"resource": resource, "amount": amount, "destination": destination})
            self._event(mission_id, "policy", "POLICY_DECISION", {"state": state, "reason": reason})
            return dict(self.db.execute("SELECT * FROM missions WHERE id=?", (mission_id,)).fetchone())

    def approve(self, mission_id: str, approver: str) -> dict:
        error = None
        with self._transaction():
            mission = self._mission(mission_id)
            if mission["state"] != "PENDING_APPROVAL":
                raise RuntimeErrorCode("INVALID_STATE", "Mission is not awaiting approval")
            if approver == mission["actor"]:
                self._event(mission_id, approver, "APPROVAL_REJECTED", {"reason": "SELF_APPROVAL"})
                error = RuntimeErrorCode("SELF_APPROVAL", "A separate approver is required")
            elif not self._has_role(approver, "payment_approver", mission["resource"]):
                self._event(mission_id, approver, "APPROVAL_REJECTED", {"reason": "NO_AUTHORITY"})
                error = RuntimeErrorCode("NO_AUTHORITY", "Approver lacks resource authority")
            else:
                self.db.execute("UPDATE missions SET state='READY', approver=? WHERE id=?", (approver, mission_id))
                self._event(mission_id, approver, "MISSION_APPROVED", {"resource": mission["resource"]})
                result = dict(self._mission(mission_id))
        if error:
            raise error
        return result

    def issue_token(self, mission_id: str, actor: str, *, seconds: int = 120) -> str:
        if seconds < 1 or seconds > 300:
            raise RuntimeErrorCode("INVALID_TTL", "Token lifetime must be 1 to 300 seconds")
        error = None
        token = None
        with self._transaction():
            mission = self._mission(mission_id)
            if mission["state"] != "READY" or mission["actor"] != actor:
                self._event(mission_id, actor, "TOKEN_REJECTED", {"reason": "INVALID_STATE"})
                error = RuntimeErrorCode("INVALID_STATE", "Mission is not ready for this actor")
            elif not self._has_role(actor, "payment_operator", mission["resource"]):
                self._event(mission_id, actor, "TOKEN_REJECTED", {"reason": "NO_AUTHORITY"})
                error = RuntimeErrorCode("NO_AUTHORITY", "Operator authority expired")
            elif self.db.execute("SELECT 1 FROM tokens WHERE mission_id=?", (mission_id,)).fetchone():
                self._event(mission_id, actor, "TOKEN_REJECTED", {"reason": "TOKEN_EXISTS"})
                error = RuntimeErrorCode("TOKEN_EXISTS", "A token has already been issued")
            else:
                token = secrets.token_urlsafe(32)
                self.db.execute("INSERT INTO tokens VALUES(?, ?, ?, ?, NULL)",
                                (hashlib.sha256(token.encode()).hexdigest(), mission_id, actor,
                                 _stamp(_now() + timedelta(seconds=seconds))))
                self._event(mission_id, actor, "TOKEN_ISSUED", {"ttl_seconds": seconds})
        if error:
            raise error
        assert token is not None
        return token

    def execute(self, mission_id: str, actor: str, token: str) -> dict:
        error = None
        with self._transaction():
            mission = self._mission(mission_id)
            secret_hash = hashlib.sha256(token.encode()).hexdigest()
            auth = self.db.execute("SELECT * FROM tokens WHERE mission_id=? AND token_hash=?",
                                   (mission_id, secret_hash)).fetchone()
            if (mission["state"] != "READY" or not auth or auth["actor"] != actor
                    or auth["used_at"] or auth["expires_at"] <= _stamp(_now())
                    or not self._has_role(actor, "payment_operator", mission["resource"])):
                self._event(mission_id, actor, "EXECUTION_REJECTED", {"reason": "TOKEN_AUTHORITY_OR_STATE"})
                error = RuntimeErrorCode("EXECUTION_DENIED", "Token, authority or mission state is invalid")
            # Recheck policy at execution; no external transfer occurs in this demo.
            elif mission["amount"] > 1000 or mission["destination"].startswith("blocked:") or (mission["amount"] > 500 and not mission["approver"]):
                self._event(mission_id, actor, "EXECUTION_REJECTED", {"reason": "POLICY_DENIED"})
                error = RuntimeErrorCode("POLICY_DENIED", "Mission no longer satisfies policy")
            else:
                effect = {"kind": "payment_instruction_prepared", "amount": mission["amount"],
                          "destination": mission["destination"], "reference": mission_id}
                self.db.execute("INSERT INTO effects VALUES(?, ?, ?)", (mission_id, _canonical(effect), _stamp(_now())))
                self.db.execute("UPDATE tokens SET used_at=? WHERE token_hash=?", (_stamp(_now()), secret_hash))
                self.db.execute("UPDATE missions SET state='COMPLETED' WHERE id=?", (mission_id,))
                self._event(mission_id, actor, "EXECUTION_COMPLETED", {"effect": effect})
        if error:
            raise error
        return effect

    def _mission(self, mission_id: str) -> sqlite3.Row:
        row = self.db.execute("SELECT * FROM missions WHERE id=?", (mission_id,)).fetchone()
        if row is None:
            raise RuntimeErrorCode("NOT_FOUND", "Unknown mission")
        return row

    def mission(self, mission_id: str) -> dict:
        with self._lock:
            return dict(self._mission(mission_id))

    def events(self, mission_id: str | None = None) -> list[dict]:
        sql = "SELECT * FROM audit" + (" WHERE mission_id=?" if mission_id else "") + " ORDER BY seq"
        with self._lock:
            return [{**dict(row), "details": json.loads(row["details"])} for row in
                    self.db.execute(sql, (mission_id,) if mission_id else ())]

    def verify_audit(self) -> dict:
        previous = "0" * 64
        count = 0
        with self._lock:
            for row in self.db.execute("SELECT * FROM audit ORDER BY seq"):
                body = {key: row[key] for key in ("at", "mission_id", "actor", "event", "prev_hash")}
                try:
                    body["details"] = json.loads(row["details"])
                except json.JSONDecodeError:
                    return {"valid": False, "checked": count, "failed_seq": row["seq"]}
                digest = hashlib.sha256(_canonical(body).encode("utf-8")).hexdigest()
                if row["prev_hash"] != previous or row["event_hash"] != digest:
                    return {"valid": False, "checked": count, "failed_seq": row["seq"]}
                previous = digest
                count += 1
        return {"valid": True, "checked": count, "head": previous}
