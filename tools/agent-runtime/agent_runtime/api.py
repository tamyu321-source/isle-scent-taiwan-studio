"""Optional FastAPI adapter for local exploration; caller identity is demo-only."""

from pathlib import Path

from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

from .runtime import MissionRuntime, RuntimeErrorCode

app = FastAPI(title="Authority / Agent Runtime Prototype", version="0.1.0")
runtime = MissionRuntime(Path(__file__).resolve().parents[1] / "demo.sqlite3")


class MissionInput(BaseModel):
    resource: str
    amount: int = Field(gt=0)
    destination: str
    request_key: str


class TokenInput(BaseModel):
    seconds: int = Field(default=120, ge=1, le=300)


class ExecuteInput(BaseModel):
    token: str


def _principal(value: str | None) -> str:
    if not value:
        raise HTTPException(400, "X-Demo-Principal is required")
    return value


def _call(fn, *args, **kwargs):
    try:
        return fn(*args, **kwargs)
    except RuntimeErrorCode as exc:
        raise HTTPException(409 if exc.code != "NOT_FOUND" else 404,
                            {"code": exc.code, "message": str(exc)}) from exc


@app.post("/demo/grants")
def grant(principal: str, role: str, resource: str):
    _call(runtime.grant, principal, role, resource)
    return {"granted": True, "warning": "Demo identity is not authenticated"}


@app.post("/missions")
def submit(payload: MissionInput, x_demo_principal: str | None = Header(default=None)):
    return _call(runtime.submit, actor=_principal(x_demo_principal), **payload.model_dump())


@app.post("/missions/{mission_id}/approve")
def approve(mission_id: str, x_demo_principal: str | None = Header(default=None)):
    return _call(runtime.approve, mission_id, _principal(x_demo_principal))


@app.post("/missions/{mission_id}/token")
def token(mission_id: str, payload: TokenInput, x_demo_principal: str | None = Header(default=None)):
    return {"token": _call(runtime.issue_token, mission_id, _principal(x_demo_principal), seconds=payload.seconds)}


@app.post("/missions/{mission_id}/execute")
def execute(mission_id: str, payload: ExecuteInput, x_demo_principal: str | None = Header(default=None)):
    return _call(runtime.execute, mission_id, _principal(x_demo_principal), payload.token)


@app.get("/missions/{mission_id}")
def mission(mission_id: str):
    return _call(runtime.mission, mission_id)


@app.get("/missions/{mission_id}/audit")
def mission_audit(mission_id: str):
    return {"events": runtime.events(mission_id), "chain": runtime.verify_audit()}
