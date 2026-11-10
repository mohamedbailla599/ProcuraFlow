import React, { useState, useEffect } from 'react';
import { X, Building, Mail, Phone, MapPin, AlertCircle } from 'lucide-react';
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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validation matching FournisseurService.validateRequest
    if (!nom.trim()) {
      setErrorMessage('Le nom du fournisseur est obligatoire.');
      return;
    }
    if (!email.trim()) {
      setErrorMessage("L'adresse e-mail du fournisseur est obligatoire.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage("Veuillez saisir une adresse e-mail valide.");
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
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {isEditing ? 'Modifier le Fournisseur' : 'Nouveau Fournisseur'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing ? `ID: #${fournisseurToEdit?.id}` : 'Remplissez les informations de contact'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg p-3 flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Nom de la société / Fournisseur <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Atlas Fournitures Industrielles"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse E-mail professionnelle <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contact@atlas.example"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Numéro de téléphone
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="Ex: +212 528 84 00 00"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          {/* Adresse */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Adresse physique / Siège
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <textarea
                rows={3}
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Ex: Zone Industrielle Tassila, BP 400, Agadir"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center space-x-1.5"
            >
              {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isEditing ? 'Enregistrer les modifications' : 'Créer le fournisseur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

