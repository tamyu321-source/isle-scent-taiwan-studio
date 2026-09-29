"""Generate checked-in website evidence by running the actual Python runtime."""

import json
from pathlib import Path

from .runtime import MissionRuntime, RuntimeErrorCode


def generate(output: Path) -> None:
    runtime = MissionRuntime()
    runtime.grant("agent-ops", "payment_operator", "ledger-us")
    runtime.grant("reviewer-lee", "payment_approver", "ledger-us")
    cases = []

    def capture(key, title, amount, destination, actor="agent-ops", approve=False, replay=False):
        mission = runtime.submit(actor=actor, resource="ledger-us", amount=amount,
                                 destination=destination, request_key=key)
        checks = []
        if approve and mission["state"] == "PENDING_APPROVAL":
            runtime.approve(mission["id"], "reviewer-lee")
            checks.append("獨立覆核者批准")
        if runtime.mission(mission["id"])["state"] == "READY":
            token = runtime.issue_token(mission["id"], actor)
            runtime.execute(mission["id"], actor, token)
            checks.append("單次授權執行")
            if replay:
                try:
                    runtime.execute(mission["id"], actor, token)
                except RuntimeErrorCode as exc:
                    checks.append("重放拒絕：" + exc.code)
        final = runtime.mission(mission["id"])
        cases.append({"key": key, "title": title, "amount": amount, "destination": destination,
                      "state": final["state"], "checks": checks,
                      "events": [{"seq": e["seq"], "event": e["event"], "actor": e["actor"],
                                  "details": e["details"], "hash": e["event_hash"][:12]}
                                 for e in runtime.events(mission["id"])]})

    capture("within-limit", "限額內自動準備", 240, "vendor:atlas")
    capture("two-person", "高額任務雙人覆核", 760, "vendor:north", approve=True)
    capture("no-authority", "沒有資源權限", 240, "vendor:atlas", actor="agent-guest")
    capture("blocked-destination", "策略拒絕目標", 80, "blocked:external")
    capture("replay", "執行憑證重放", 120, "vendor:atlas", replay=True)
    result = {"schema": 1, "source": "Python MissionRuntime generated; synthetic data",
              "policy": {"auto_limit": 500, "review_limit": 1000},
              "cases": cases, "chain": runtime.verify_audit()}
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    runtime.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, required=True)
    generate(parser.parse_args().output)
