import unittest
from uuid import uuid4

from fastapi.testclient import TestClient

from agent_runtime.api import app


class ApiTests(unittest.TestCase):
    def test_http_mission_lifecycle(self):
        client = TestClient(app)
        principal = "operator-" + uuid4().hex[:8]
        resource = "ledger-test-" + uuid4().hex[:8]
        payload = {"resource": resource, "amount": 120,
                   "destination": "vendor:test", "request_key": uuid4().hex}
        self.assertEqual(client.post("/missions", json=payload).status_code, 400)
        grant = client.post("/demo/grants", params={"principal": principal,
                            "role": "payment_operator", "resource": resource})
        self.assertEqual(grant.status_code, 200)
        headers = {"X-Demo-Principal": principal}
        created = client.post("/missions", json=payload, headers=headers)
        self.assertEqual(created.status_code, 200, created.text)
        mission_id = created.json()["id"]
        issued = client.post(f"/missions/{mission_id}/token", json={}, headers=headers)
        self.assertEqual(issued.status_code, 200, issued.text)
        body = {"token": issued.json()["token"]}
        first = client.post(f"/missions/{mission_id}/execute", json=body, headers=headers)
        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(first.json()["kind"], "payment_instruction_prepared")
        replay = client.post(f"/missions/{mission_id}/execute", json=body, headers=headers)
        self.assertEqual(replay.status_code, 409)
        self.assertEqual(replay.json()["detail"]["code"], "EXECUTION_DENIED")
        audit = client.get(f"/missions/{mission_id}/audit")
        self.assertTrue(audit.json()["chain"]["valid"])
        self.assertIn("EXECUTION_REJECTED", [event["event"] for event in audit.json()["events"]])


if __name__ == "__main__":
    unittest.main()
