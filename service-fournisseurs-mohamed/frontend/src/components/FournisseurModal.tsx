import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Fournisseur, FournisseurRequest, ApiErrorResponse } from '../types/fournisseur';

interface FournisseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FournisseurRequest) => Promise<void>;
  fournisseurToEdit?: Fournisseur | null;
}

export const FournisseurModal: React.FC<FournisseurModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fournisseurToEdit,
}) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(fournisseurToEdit);

  useEffect(() => {
    if (fournisseurToEdit) {
      setNom(fournisseurToEdit.nom);
      setEmail(fournisseurToEdit.email);
      setTelephone(fournisseurToEdit.telephone || '');
      setAdresse(fournisseurToEdit.adresse || '');
    } else {
      setNom('');
      setEmail('');
      setTelephone('');
      setAdresse('');
    }
    setErrorMessage(null);
  }, [fournisseurToEdit, isOpen]);

  // Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmailValid = email.trim() ? emailRegex.test(email.trim()) : false;
  const isNomValid = nom.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!nom.trim()) {
      setErrorMessage('Le nom du fournisseur est obligatoire.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage("L'adresse e-mail du fournisseur est obligatoire.");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Veuillez saisir une adresse e-mail valide (ex: contact@societe.com).');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        nom: nom.trim(),
        email: email.trim(),
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.message) {
        setErrorMessage(apiErr.message);
      } else if (apiErr?.status === 409) {
        setErrorMessage('Cette adresse e-mail est déjà attribuée à un autre fournisseur.');
      } else {
        setErrorMessage('Une erreur est survenue lors de l’enregistrement du fournisseur.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 id="modal-title" className="font-bold text-slate-900 text-sm">
                {isEditing ? 'Modifier la Fiche Fournisseur' : 'Nouveau Fournisseur'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {isEditing ? `Identifiant : #${fournisseurToEdit?.id}` : 'Coordonnées administratives et contractuelles'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nom */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="nom" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Raison Sociale / Nom <span className="text-rose-500">*</span>
              </label>
              {isNomValid && (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Renseigné</span>
                </span>
              )}
            </div>
            <input
              id="nom"
              type="text"
              required
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Atlas Fournitures Industrielles"
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="email" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                E-mail Professionnel <span className="text-rose-500">*</span>
              </label>
              {isEmailValid && (
                <span className="text-[10px] font-semibold text-emerald-600 flex items-center space-x-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Format valide</span>
                </span>
              )}
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ex: contact@atlas.example"
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="telephone" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Numéro de Téléphone
            </label>
            <input
              id="telephone"
              type="text"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: +212 528 84 00 00"
              className="w-full h-9 px-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
            />
          </div>

          {/* Adresse */}
          <div>
            <label htmlFor="adresse" className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Adresse Physique / Siège
            </label>
            <textarea
              id="adresse"
              rows={2}
              value={adresse}
              onChange={(e) => setAdresse(e.target.value)}
              placeholder="Ex: Zone Industrielle Tassila, Agadir, Maroc"
              className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 px-4 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-2xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isEditing ? 'Enregistrer' : 'Créer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
