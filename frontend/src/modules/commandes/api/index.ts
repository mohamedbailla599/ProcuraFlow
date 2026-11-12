import { Commande, CreateCommandePayload } from '../types';

const BASE_URL = '/api/commandes';

export async function getAllCommandes(): Promise<Commande[]> {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
  return res.json();
}

export async function getCommandeById(id: number): Promise<Commande> {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error(`Commande #${id} introuvable`);
  return res.json();
}

export async function getCommandesByFournisseur(fournisseurId: number): Promise<Commande[]> {
  const res = await fetch(`${BASE_URL}/fournisseur/${fournisseurId}`);
  if (!res.ok) throw new Error(`Erreur lors du filtrage par fournisseur`);
  return res.json();
}

export async function createCommande(payload: CreateCommandePayload): Promise<Commande> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Erreur lors de la création (${res.status})`);
  return res.json();
}

export async function updateCommandeStatut(id: number, statut: string): Promise<Commande> {
  const res = await fetch(`${BASE_URL}/${id}/statut?statut=${encodeURIComponent(statut)}`, {
    method: 'PUT',
  });
  if (!res.ok) throw new Error(`Erreur mise à jour statut (${res.status})`);
  return res.json();
}

export async function deleteCommande(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Erreur suppression (${res.status})`);
}