describe('Module Fournisseurs - Tests End-to-End (E2E)', () => {
  beforeEach(() => {
    cy.visit('http://localhost:5173/fournisseurs');
  });

  it('1. Charge l\'interface et affiche la table des fournisseurs', () => {
    cy.get('table').should('be.visible');
    cy.contains('FOURNISSEUR').should('be.visible');
    cy.contains('COORDONNÉES').should('be.visible');
    cy.contains('STATUT').should('be.visible');
  });

  it('2. Permet de filtrer par statut (Tous, Actifs, Inactifs)', () => {
    cy.contains('Actifs').should('be.visible').click();
    cy.get('table').should('be.visible');
    cy.contains('Inactifs').should('be.visible').click();
    cy.get('table').should('be.visible');
    cy.contains('Tous').should('be.visible').click();
  });

  it('3. Recherche en temps réel un fournisseur par nom', () => {
    cy.get('input[placeholder*="Rechercher"]').should('be.visible').type('Atlas');
    cy.get('table').should('be.visible');
  });

  it('4. Vérifie la présence des boutons d\'actions et contrôles', () => {
    cy.get('button').should('have.length.at.least', 3);
  });
});
