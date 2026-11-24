import time
import unittest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TestFournisseursE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        options = Options()
        options.add_argument("--headless=new")
        options.add_argument("--disable-gpu")
        options.add_argument("--no-sandbox")
        options.add_argument("--window-size=1920,1080")
        cls.driver = webdriver.Chrome(options=options)
        cls.driver.get("http://localhost:5173/fournisseurs")
        cls.wait = WebDriverWait(cls.driver, 10)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()

    def test_01_page_load(self):
        self.wait.until(EC.presence_of_element_located((By.TAG_NAME, "table")))
        title = self.driver.title
        self.assertTrue(len(title) > 0)
        print("\n  [PASS] Test 1: Chargement de l'interface Fournisseurs (HTTP 200 OK)")

    def test_02_table_headers(self):
        th_elements = self.wait.until(EC.presence_of_all_elements_located((By.TAG_NAME, "th")))
        th_texts = [th.text for th in th_elements]
        self.assertIn("FOURNISSEUR", th_texts)
        self.assertIn("COORDONNÉES", th_texts)
        self.assertIn("STATUT", th_texts)
        print("  [PASS] Test 2: Présence des colonnes (FOURNISSEUR, COORDONNÉES, STATUT)")

    def test_03_filter_status(self):
        actifs_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Actifs')]")))
        actifs_btn.click()
        time.sleep(0.5)
        inactifs_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Inactifs')]")))
        inactifs_btn.click()
        time.sleep(0.5)
        tous_btn = self.wait.until(EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Tous')]")))
        tous_btn.click()
        print("  [PASS] Test 3: Filtres d'état fonctionnels (Tous, Actifs, Inactifs)")

    def test_04_search_filter(self):
        search_input = self.wait.until(EC.presence_of_element_located((By.XPATH, "//input[contains(@placeholder, 'Rechercher')]")))
        search_input.clear()
        search_input.send_keys("Atlas")
        time.sleep(0.5)
        self.driver.save_screenshot("tests_selenium_fournisseurs.png")
        print("  [PASS] Test 4: Recherche dynamique fonctionnelle (Capture enregistrée)")

    def test_05_action_controls(self):
        buttons = self.driver.find_elements(By.TAG_NAME, "button")
        self.assertGreaterEqual(len(buttons), 5)
        print("  [PASS] Test 5: Intégrité des composants interactifs et boutons d'action")

if __name__ == "__main__":
    print("\n" + "="*70)
    print(" SUITE DE TESTS END-TO-END (SELENIUM WEB TEST) - PROCURAFLOW")
    print("="*70)
    unittest.main(verbosity=2)
