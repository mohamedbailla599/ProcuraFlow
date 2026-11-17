"""End-to-end checks against running Réceptions and Commandes services on a disposable database."""
import json
import os
import unittest
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

COMMANDES = os.environ.get("TEST_COMMANDES_URL", "http://localhost:8082") + "/api/commandes"
RECEPTIONS = os.environ.get("TEST_RECEPTIONS_URL", "http://localhost:8083") + "/api/receptions"


def http(url, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    request = Request(url, data=data, headers={"Content-Type": "application/json"})
    try:
        response = urlopen(request, timeout=15)
    except HTTPError as error:
        response = error
    with response:
        body = response.read()
        return response.status, json.loads(body) if body else None


class RegistrationTest(unittest.TestCase):
    def setUp(self):
        status, order = http(COMMANDES, {
            "fournisseurId": 1, "statut": "EXPEDIEE", "montantTotal": 100,
            "lignesCommande": [{"designation": "Article test", "quantite": 10, "prixUnitaire": 10}]
        })
        self.assertIn(status, [200, 201], order)
        self.order_id = order["id"]
        self.line_id = order["lignesCommande"][0]["id"]

    def payload(self, quantity):
        return {"commandeId": self.order_id, "cleCreation": str(uuid4()),
                "lignes": [{"ligneCommandeId": self.line_id, "quantiteRecue": quantity}]}

    def test_partial_retry_and_balance(self):
        payload = self.payload(6)
        status, receipt = http(RECEPTIONS, payload)
        self.assertEqual(status, 201, receipt)
        self.assertEqual(http(RECEPTIONS, payload), (200, receipt))
        payload["lignes"][0]["quantiteRecue"] = 3
        self.assertEqual(http(RECEPTIONS, payload)[0], 409)
        self.assertEqual(http(RECEPTIONS + "/" + str(receipt["id"])), (200, receipt))
        status, balances = http(f"{RECEPTIONS}/commandes/{self.order_id}/soldes")
        self.assertEqual((status, balances[0]["restante"]), (200, 4))
        self.assertEqual(http(RECEPTIONS, self.payload(5))[0], 409)
        self.assertEqual(http(RECEPTIONS, self.payload(4))[0], 201)

    def test_invalid_is_atomic(self):
        payload = self.payload(1)
        payload["lignes"].append(dict(payload["lignes"][0]))
        self.assertEqual(http(RECEPTIONS, payload)[0], 400)
        payload["lignes"][1]["ligneCommandeId"] = 999999999
        self.assertEqual(http(RECEPTIONS, payload)[0], 400)
        self.assertEqual(http(RECEPTIONS, self.payload(0))[0], 400)
        self.assertEqual(http(f"{RECEPTIONS}?commandeId={self.order_id}"), (200, []))

    def test_competing_deliveries(self):
        with ThreadPoolExecutor(2) as pool:
            results = list(pool.map(lambda _: http(RECEPTIONS, self.payload(6))[0], range(2)))
        self.assertEqual(sorted(results), [201, 409])


if __name__ == "__main__":
    unittest.main()

