import React, { useState, useEffect } from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 transition-all">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header with gradient banner */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 via-teal-50/20 to-white">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-teal-500/20">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base tracking-tight">
                {isEditing ? 'Modifier la Fiche Fournisseur' : 'Créer un Nouveau Fournisseur'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isEditing ? `Identifiant unique : #${fournisseurToEdit?.id}` : 'Renseignez les coordonnées contractuelles'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200/90 text-rose-800 text-xs rounded-2xl p-4 flex items-start space-x-2.5 shadow-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="font-bold">Attention : </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Nom */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Raison Sociale / Nom <span className="text-rose-500">*</span>
              </label>
              {isNomValid && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Valide</span>
                </span>
              )}
            </div>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Atlas Fournitures Industrielles"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Adresse E-mail Professionnelle <span className="text-rose-500">*</span>
              </label>
              {isEmailValid && (
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Format valide</span>
                </span>
              )}
            </div>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contact@atlas.example"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">L'e-mail doit être unique dans la base de données.</p>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Numéro de téléphone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +212 528 84 00 00"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium"
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse physique / Siège social
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <textarea
                rows={3}
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Zone Industrielle Tassila, Agadir, Maroc"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-teal-500/25 focus:border-teal-500 transition-all font-medium resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4.5 py-2.5 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 rounded-xl shadow-md shadow-teal-600/20 hover:shadow-teal-600/35 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              <span>{isEditing ? 'Enregistrer les modifications' : 'Créer le fournisseur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
