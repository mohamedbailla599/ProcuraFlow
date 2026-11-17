import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, Modal } from '../../../components/ui';
import { getAllCommandes } from '../../commandes/api';
import type { Commande } from '../../commandes/types';
import { creer, soldes } from '../api';
import type { Reception, Solde } from '../types';

const input = 'block w-full mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 dark:bg-slate-900 dark:border-slate-700';

export function ReceptionForm({ close, saved }: { close: () => void; saved: (r: Reception) => void }) {
  const [orders, setOrders] = useState<Commande[]>([]);
  const [order, setOrder] = useState('');
  const [lines, setLines] = useState<Solde[]>([]);
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const retry = useRef({ signature: '', key: '' });

  useEffect(() => {
    let active = true;
    getAllCommandes().then(data => {
      if (active) setOrders(data.filter(c => ['VALIDEE', 'EXPEDIEE'].includes(c.statut)));
    }).catch(e => { if (active) setError(e.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!order) return;
    const controller = new AbortController();
    soldes(Number(order), controller.signal).then(setLines)
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [order]);

  const selected = lines.map(l => ({
    ligneCommandeId: l.ligneCommandeId, quantiteRecue: Number(quantities[l.ligneCommandeId] || 0)
  })).filter(l => l.quantiteRecue > 0);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!selected.length || saving) return;
    const payload = { commandeId: Number(order), lignes: selected, remarques: note.trim() };
    const signature = JSON.stringify(payload);
    if (signature !== retry.current.signature) retry.current = { signature, key: crypto.randomUUID() };
    setSaving(true);
    setError('');
    try { saved(await creer({ ...payload, cleCreation: retry.current.key })); }
    catch (e) { setError((e as Error).message); setSaving(false); }
  }

  return <Modal isOpen onClose={() => { if (!saving) close(); }} title="Nouvelle réception" maxWidth="2xl">
    <form onSubmit={submit} className="space-y-5 text-sm text-slate-800 dark:text-slate-100">
      <fieldset disabled={saving} className="space-y-4">
        <label className="block font-medium">Commande
          <select className={input} required value={order} onChange={e => {
            setOrder(e.target.value); setLines([]); setQuantities({}); setError(''); setLoading(Boolean(e.target.value));
          }}>
            <option value="">Sélectionner une commande</option>
            {orders.map(c => <option key={c.id} value={c.id}>Commande #{c.id} · {c.statut}</option>)}
          </select>
        </label>
        {loading && <p role="status">Chargement…</p>}
        {!loading && !error && orders.length === 0 && <p>Aucune commande validée ou expédiée.</p>}
        {order && !loading && !error && lines.every(l => !l.restante) && <p>Cette commande est entièrement réceptionnée.</p>}
        {lines.map(l => <label key={l.ligneCommandeId} className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 dark:bg-slate-800 p-3">
          <span><strong>{l.designation}</strong><br/>Reste {l.restante} sur {l.quantiteCommandee}</span>
          <input aria-label={`Quantité reçue pour ${l.designation}`} className={input + ' max-w-24'}
            type="number" min="0" max={l.restante} step="1" disabled={!l.restante} placeholder="0"
            value={quantities[l.ligneCommandeId] ?? ''} onChange={e => setQuantities({...quantities, [l.ligneCommandeId]: e.target.value})}/>
        </label>)}
        <label className="block">Remarques <textarea className={input} rows={2} value={note} onChange={e => setNote(e.target.value)}/></label>
      </fieldset>
      {error && <p role="alert" className="text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={saving} onClick={close}>Annuler</Button>
        <Button type="submit" disabled={!selected.length || loading || saving} loading={saving}>Enregistrer</Button>
      </div>
    </form>
  </Modal>;
}
