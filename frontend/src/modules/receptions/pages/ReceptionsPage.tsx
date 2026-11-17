import { useEffect, useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { Badge, Button, Card, EmptyState, ErrorState, LoadingState, Modal, PageHeader } from '../../../components/ui';
import { list } from '../api';
import { ReceptionForm } from '../components/ReceptionForm';
import type { Reception } from '../types';

const pageSize = 10;
const date = (value: string | null) => value ? new Date(value).toLocaleString('fr-FR') : '—';

export function ReceptionsPage() {
  const [rows, setRows] = useState<Reception[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, refresh] = useState(0);
  const [order, setOrder] = useState('');
  const [page, setPage] = useState(1);
  const [detail, setDetail] = useState<Reception | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    list(controller.signal).then(setRows)
      .catch(e => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [revision]);

  const filtered = rows.filter(row => !order || String(row.commandeId) === order.trim());
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);

  return <div className="w-full max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 pt-4 pb-10 space-y-5">
    <PageHeader title="Réceptions" description="Consultez les livraisons et enregistrez les quantités reçues par commande."
      actions={<Button icon={<Plus size={16}/>} onClick={() => setCreating(true)}>Nouvelle réception</Button>}/>
    <Card className="p-4 sm:p-6 space-y-4">
      <label className="block text-sm font-medium">Filtrer par commande
        <input type="search" inputMode="numeric" placeholder="Numéro de commande" value={order}
          onChange={e => { setOrder(e.target.value); setPage(1); }}
          className="block mt-1 w-full sm:max-w-xs rounded-lg border border-slate-300 bg-transparent px-3 py-2 dark:border-slate-700"/>
      </label>
      {loading ? <LoadingState message="Chargement des réceptions…"/> : error ?
        <ErrorState message={error} onRetry={() => refresh(v => v + 1)}/> : !filtered.length ?
        <EmptyState icon={<Truck/>} title={order ? 'Aucune réception pour cette commande' : 'Aucune réception enregistrée'}/> :
        <>
          <div className="overflow-x-auto"><table className="w-full text-sm text-left">
            <thead className="text-slate-500"><tr>{['Réception','Commande','Date','Conformité',''].map(h => <th key={h} className="p-3">{h}</th>)}</tr></thead>
            <tbody>{filtered.slice((current-1)*pageSize, current*pageSize).map(row =>
              <tr key={row.id} className="border-t border-slate-200 dark:border-slate-700">
                <td className="p-3 font-semibold">#{row.id}</td><td className="p-3">#{row.commandeId}</td>
                <td className="p-3">{date(row.dateReception)}</td>
                <td className="p-3"><Badge variant={row.statutReception === 'CONFORME' ? 'success' : 'warning'}>{row.statutReception ?? 'Non renseigné'}</Badge></td>
                <td className="p-3"><Button variant="outline" size="sm" onClick={() => setDetail(row)}>Détail</Button></td>
              </tr>)}</tbody>
          </table></div>
          {pages > 1 && <div className="flex items-center justify-end gap-3 text-sm">
            <Button variant="outline" disabled={current===1} onClick={() => setPage(current-1)}>Précédent</Button>
            {current} / {pages}
            <Button variant="outline" disabled={current===pages} onClick={() => setPage(current+1)}>Suivant</Button>
          </div>}
        </>}
    </Card>
    {creating && <ReceptionForm close={() => setCreating(false)} saved={r => {
      setCreating(false); setPage(1); setOrder(''); setDetail(r); refresh(v => v+1);
    }}/>}
    {detail && <Modal isOpen onClose={() => setDetail(null)} title={`Réception #${detail.id}`}
      description={`Commande #${detail.commandeId} · ${date(detail.dateReception)}`}>
      <div className="space-y-4 text-sm">
        <p>Conformité · {detail.statutReception ?? 'Non renseignée'}</p>
        {detail.remarques && <p>{detail.remarques}</p>}
        {detail.lignes.length ? <ul className="divide-y dark:divide-slate-700">{detail.lignes.map(l =>
          <li key={l.id} className="py-3"><strong>Ligne de commande #{l.ligneCommandeId}</strong>
            <p>{l.quantiteRecue} unité(s) reçue(s)</p>{l.remarques && <p>{l.remarques}</p>}
          </li>)}</ul> : <p>Cette réception historique ne contient pas de lignes détaillées.</p>}
      </div>
    </Modal>}
  </div>;
}
