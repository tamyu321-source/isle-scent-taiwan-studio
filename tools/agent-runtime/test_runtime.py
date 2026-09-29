import tempfile
import unittest
from pathlib import Path

from agent_runtime import MissionRuntime, RuntimeErrorCode


class RuntimeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.db_path = Path(self.temp.name) / "runtime.sqlite3"
        self.runtime = MissionRuntime(self.db_path)
        self.runtime.grant("operator", "payment_operator", "ledger-us")
        self.runtime.grant("reviewer", "payment_approver", "ledger-us")

    def tearDown(self):
        self.runtime.close()
        self.temp.cleanup()

    def submit(self, key="one", **changes):
        payload = dict(actor="operator", resource="ledger-us", amount=240,
                       destination="vendor:atlas", request_key=key)
        payload.update(changes)
        return self.runtime.submit(**payload)

    def assert_code(self, code, fn, *args, **kwargs):
        with self.assertRaises(RuntimeErrorCode) as caught:
            fn(*args, **kwargs)
        self.assertEqual(caught.exception.code, code)

    def test_auto_execute_and_replay_rejected(self):
        mission = self.submit()
        token = self.runtime.issue_token(mission["id"], "operator")
        effect = self.runtime.execute(mission["id"], "operator", token)
        self.assertEqual(effect["kind"], "payment_instruction_prepared")
        self.assertEqual(self.runtime.mission(mission["id"])["state"], "COMPLETED")
        self.assert_code("EXECUTION_DENIED", self.runtime.execute, mission["id"], "operator", token)
        self.assertEqual(self.runtime.db.execute("SELECT COUNT(*) FROM effects").fetchone()[0], 1)
        self.assertIn("EXECUTION_REJECTED", [e["event"] for e in self.runtime.events(mission["id"])])
        self.assertTrue(self.runtime.verify_audit()["valid"])

    def test_two_person_rule_and_resource_scope(self):
        mission = self.submit(amount=760)
        self.assertEqual(mission["state"], "PENDING_APPROVAL")
        self.assert_code("INVALID_STATE", self.runtime.issue_token, mission["id"], "operator")
        self.assert_code("SELF_APPROVAL", self.runtime.approve, mission["id"], "operator")
        self.assert_code("NO_AUTHORITY", self.runtime.approve, mission["id"], "stranger")
        self.runtime.approve(mission["id"], "reviewer")
        token = self.runtime.issue_token(mission["id"], "operator")
        self.assert_code("EXECUTION_DENIED", self.runtime.execute, mission["id"], "reviewer", token)
        self.runtime.execute(mission["id"], "operator", token)
        self.assertTrue(self.runtime.verify_audit()["valid"])

    def test_policy_and_authority_denials(self):
        for key, changes in (
            ("blocked", {"destination": "blocked:external"}),
            ("limit", {"amount": 1001}),
            ("guest", {"actor": "guest"}),
            ("other-ledger", {"resource": "ledger-eu"}),
        ):
            self.assertEqual(self.submit(key, **changes)["state"], "DENIED")
        self.assertEqual(self.runtime.db.execute("SELECT COUNT(*) FROM effects").fetchone()[0], 0)

    def test_idempotency_and_scope(self):
        mission = self.submit()
        self.assertEqual(self.submit()["id"], mission["id"])
        self.assert_code("IDEMPOTENCY_CONFLICT", self.submit, "one", amount=300)
        self.assertEqual(self.runtime.db.execute("SELECT COUNT(*) FROM missions").fetchone()[0], 1)

    def test_token_expiry_and_authority_revocation(self):
        mission = self.submit()
        token = self.runtime.issue_token(mission["id"], "operator")
        self.runtime.db.execute("UPDATE tokens SET expires_at='2000-01-01' WHERE mission_id=?", (mission["id"],))
        self.assert_code("EXECUTION_DENIED", self.runtime.execute, mission["id"], "operator", token)
        self.runtime.db.execute("UPDATE tokens SET expires_at='9999-01-01' WHERE mission_id=?", (mission["id"],))
        self.runtime.db.execute("DELETE FROM grants WHERE principal='operator'")
        self.assert_code("EXECUTION_DENIED", self.runtime.execute, mission["id"], "operator", token)

    def test_audit_detects_edit_and_survives_reopen(self):
        mission = self.submit()
        self.assertTrue(self.runtime.verify_audit()["valid"])
        self.runtime.close()
        self.runtime = MissionRuntime(self.db_path)
        self.assertTrue(self.runtime.verify_audit()["valid"])
        self.runtime.db.execute("UPDATE audit SET details='{}' WHERE mission_id=? AND event='POLICY_DECISION'", (mission["id"],))
        self.assertFalse(self.runtime.verify_audit()["valid"])


if __name__ == "__main__":
    unittest.main()
