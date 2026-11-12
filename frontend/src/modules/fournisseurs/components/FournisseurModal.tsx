import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  Search,
  Check,
  Star,
  Plus,
} from 'lucide-react';
import { Fournisseur, FournisseurRequest, ApiErrorResponse } from '../types/fournisseur';
import { computeSupplierRating, saveSupplierRating } from '../utils/scoring';
import { parseAddressAndCity, MOROCCAN_CITIES } from '../utils/addressParser';
import {
  MOROCCO_CITIES,
  findMoroccoCity,
} from '../../../data/moroccoCities';

export { MOROCCAN_CITIES, parseAddressAndCity };

interface FournisseurModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FournisseurRequest) => Promise<void>;
  fournisseurToEdit?: Fournisseur | null;
  customCities?: string[];
}

export const FournisseurModal: React.FC<FournisseurModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  fournisseurToEdit,
  customCities,
}) => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [customVille, setCustomVille] = useState('');
  const [rating, setRating] = useState<number>(4.5);
  const [ratingInput, setRatingInput] = useState<string>('4.5');
  const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
  const [citySearchQuery, setCitySearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const nomInputRef = useRef<HTMLInputElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  const isEditing = Boolean(fournisseurToEdit);

  useEffect(() => {
    if (fournisseurToEdit) {
      setNom(fournisseurToEdit.nom);
      setEmail(fournisseurToEdit.email);
      setTelephone(fournisseurToEdit.telephone || '');
      const parsed = parseAddressAndCity(fournisseurToEdit.adresse);
      setSelectedVille(parsed.ville);
      setCustomVille(parsed.customVille);
      setAdresse(parsed.street);
      const computed = computeSupplierRating(fournisseurToEdit);
      setRating(computed.score);
      setRatingInput(computed.score.toFixed(1));
    } else {
      setNom('');
      setEmail('');
      setTelephone('');
      setSelectedVille('');
      setCustomVille('');
      setAdresse('');
      setRating(4.5);
      setRatingInput('4.5');
    }
    setIsCityDropdownOpen(false);
    setCitySearchQuery('');
    setErrorMessage(null);
  }, [fournisseurToEdit, isOpen]);

  const handleRatingInputChange = (val: string) => {
    setRatingInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 1 && num <= 5) {
      setRating(Math.round(num * 10) / 10);
    }
  };

  const handleRatingInputBlur = () => {
    const num = parseFloat(ratingInput);
    if (isNaN(num) || num < 1) {
      setRating(1.0);
      setRatingInput('1.0');
    } else if (num > 5) {
      setRating(5.0);
      setRatingInput('5.0');
    } else {
      const clamped = Math.round(num * 10) / 10;
      setRating(clamped);
      setRatingInput(clamped.toFixed(1));
    }
  };

  // Auto-focus first field when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nomInputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  // Click outside to close city dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    if (isCityDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCityDropdownOpen]);

  // Escape key to close city dropdown or modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isCityDropdownOpen) {
          setIsCityDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCityDropdownOpen, onClose]);

  // Build comprehensive displayed cities list (Morocco catalogue + optional DB extras)
  const displayedCities = useMemo(() => {
    const list: Array<{ name: string; region?: string; isCustom?: boolean }> = MOROCCO_CITIES.map(
      (c) => ({
        name: c.name,
        region: c.region,
        isCustom: false,
      })
    );

    // If customCities were passed (from database suppliers), append any unique non-Morocco ones
    if (customCities && customCities.length > 0) {
      const knownNames = new Set(MOROCCO_CITIES.map((c) => c.name.toLowerCase()));
      customCities.forEach((city) => {
        const clean = city.trim();
        if (clean && !knownNames.has(clean.toLowerCase())) {
          list.push({
            name: clean,
            region: 'Autre localisation',
            isCustom: true,
          });
        }
      });
    }

    return list;
  }, [customCities]);

  // Filtered cities list based on search query (matching name, region or aliases)
  const filteredCities = useMemo(() => {
    const query = citySearchQuery.trim().toLowerCase();
    if (!query) return displayedCities;

    return displayedCities.filter((c) => {
      if (c.name.toLowerCase().includes(query)) return true;
      if (c.region && c.region.toLowerCase().includes(query)) return true;
      const morocco = findMoroccoCity(c.name);
      if (morocco?.aliases?.some((a) => a.toLowerCase().includes(query))) return true;
      return false;
    });
  }, [displayedCities, citySearchQuery]);

  // Live preview of combined address
  const effectiveCity = selectedVille === 'Autre' ? customVille.trim() : selectedVille.trim();
  const displayedCombined =
    adresse.trim() && effectiveCity
      ? `${adresse.trim()}, ${effectiveCity}`
      : effectiveCity || adresse.trim();

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

    const finalCity = selectedVille === 'Autre' ? customVille.trim() : selectedVille.trim();
    const streetTrimmed = adresse.trim();

    let combinedAdresse: string | null = null;
    if (streetTrimmed && finalCity) {
      combinedAdresse = `${streetTrimmed}, ${finalCity}`;
    } else if (finalCity) {
      combinedAdresse = finalCity;
    } else if (streetTrimmed) {
      combinedAdresse = streetTrimmed;
    }

    const num = parseFloat(ratingInput);
    const finalRating = !isNaN(num)
      ? Math.max(1, Math.min(5, Math.round(num * 10) / 10))
      : rating;

    setLoading(true);
    try {
      if (fournisseurToEdit?.id) {
        saveSupplierRating(fournisseurToEdit.id, finalRating);
      }
      await onSubmit({
        nom: nom.trim(),
        email: email.trim(),
        telephone: telephone.trim() || null,
        adresse: combinedAdresse,
        rating: finalRating,
      });
      onClose();
    } catch (err: unknown) {
      const apiErr = err as ApiErrorResponse;
      if (apiErr?.message) {
        setErrorMessage(apiErr.message);
      } else if (apiErr?.status === 409) {
        setErrorMessage('Cette adresse e-mail est déjà attribuée à un autre fournisseur.');
      } else {
        setErrorMessage('Une erreur est survenue lors de l\'enregistrement du fournisseur.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-fade-in-up"
        style={{ animationDuration: '150ms' }}
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50/80 to-teal-50/30 dark:from-slate-800/60 dark:to-teal-950/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-sm">
              {isEditing ? <Building className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="modal-title" className="font-bold text-slate-900 dark:text-white text-base">
                {isEditing ? 'Modifier la Fiche' : 'Nouveau Fournisseur'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isEditing ? `Identifiant : #${fournisseurToEdit?.id}` : 'Coordonnées administratives et contractuelles'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-150 active:scale-95"
            aria-label="Fermer la boîte de dialogue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 text-sm rounded-xl p-3.5 flex items-start space-x-2.5 animate-fade-in-up">
              <AlertCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
              <span className="text-xs leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Required Fields Section */}
          <div className="space-y-3.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Informations obligatoires
            </p>

            {/* Nom */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="nom" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Raison Sociale / Nom <span className="text-rose-500">*</span>
                </label>
                {isNomValid && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 animate-scale-in">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Renseigné</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Building className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  ref={nomInputRef}
                  id="nom"
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Ex: Atlas Fournitures Industrielles"
                  className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  E-mail Professionnel <span className="text-rose-500">*</span>
                </label>
                {isEmailValid && (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center space-x-0.5 animate-scale-in">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Format valide</span>
                  </span>
                )}
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ex: contact@atlas.example"
                  className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                />
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="border-t border-dashed border-slate-200 dark:border-slate-700" />

          {/* Optional Fields Section */}
          <div className="space-y-3.5">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Informations complémentaires
            </p>

            {/* Row with Numéro de Téléphone & Ville */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Téléphone */}
              <div>
                <label htmlFor="telephone" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Numéro de Téléphone
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    id="telephone"
                    type="text"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    placeholder="Ex: +212 528 84 00 00"
                    className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                  />
                </div>
              </div>

              {/* Ville Selection Dropdown */}
              <div ref={cityDropdownRef} className="relative">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="ville-select-btn" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ville
                  </label>
                  {selectedVille && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVille('');
                        setCustomVille('');
                      }}
                      className="text-[10px] text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                      title="Effacer la sélection"
                    >
                      Effacer
                    </button>
                  )}
                </div>

                {/* Trigger Button */}
                <button
                  id="ville-select-btn"
                  type="button"
                  onClick={() => setIsCityDropdownOpen((prev) => !prev)}
                  aria-haspopup="listbox"
                  aria-expanded={isCityDropdownOpen}
                  className={`w-full h-10 pl-9 pr-8 text-left text-sm rounded-lg border transition-all duration-150 flex items-center justify-between relative ${
                    isCityDropdownOpen
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white dark:bg-slate-800'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
                      selectedVille ? 'text-teal-600 dark:text-teal-400' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  />
                  <span
                    className={`truncate block ${
                      selectedVille
                        ? 'font-medium text-slate-800 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {selectedVille === 'Autre'
                      ? customVille ? `Autre : ${customVille}` : 'Autre (à préciser)'
                      : selectedVille || 'Sélectionner une ville...'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
                      isCityDropdownOpen ? 'rotate-180 text-teal-600 dark:text-teal-400' : ''
                    }`}
                  />
                </button>

                {/* Floating Popover */}
                {isCityDropdownOpen && (
                  <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-scale-in">
                    {/* Search input in dropdown */}
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-800/80">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                        <input
                          type="text"
                          autoFocus
                          value={citySearchQuery}
                          onChange={(e) => setCitySearchQuery(e.target.value)}
                          placeholder="Rechercher une ville (ex: Guelmim, Souss)..."
                          className="w-full h-8 pl-8 pr-7 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 placeholder:text-slate-400"
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              e.stopPropagation();
                              setIsCityDropdownOpen(false);
                            }
                          }}
                        />
                        {citySearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCitySearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                            title="Effacer la recherche"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1.5 px-0.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {citySearchQuery
                            ? `${filteredCities.length} résultat(s)`
                            : `Catalogue National (${displayedCities.length})`}
                        </span>
                        {selectedVille && (
                          <span className="text-[10px] text-teal-600 dark:text-teal-400 font-medium truncate max-w-[140px]">
                            Actif : {selectedVille}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Cities List */}
                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 text-xs">
                      {filteredCities.map((c) => {
                        const isSelected =
                          selectedVille.toLowerCase() === c.name.toLowerCase();
                        return (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setSelectedVille(c.name);
                              setCustomVille('');
                              setIsCityDropdownOpen(false);
                              setCitySearchQuery('');
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                              isSelected
                                ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 font-semibold'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="block truncate">{c.name}</span>
                              {c.region && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate font-normal">
                                  {c.region}
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}

                      {/* If search query doesn't match any city, offer to use it directly */}
                      {citySearchQuery.trim() &&
                        !filteredCities.some(
                          (c) => c.name.toLowerCase() === citySearchQuery.trim().toLowerCase()
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVille('Autre');
                              setCustomVille(citySearchQuery.trim());
                              setIsCityDropdownOpen(false);
                              setCitySearchQuery('');
                            }}
                            className="w-full flex items-center space-x-1.5 px-2.5 py-2 rounded-lg text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-medium transition-colors text-left cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Utiliser « {citySearchQuery.trim()} » comme ville</span>
                          </button>
                        )}

                      {/* Option Autre */}
                      <div className="border-t border-slate-100 dark:border-slate-700/80 my-1" />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVille('Autre');
                          setIsCityDropdownOpen(false);
                          setCitySearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-colors text-left cursor-pointer ${
                          selectedVille === 'Autre'
                            ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                            : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <span>Autre ville (saisir manuellement)...</span>
                        {selectedVille === 'Autre' && (
                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom city input if "Autre" is selected */}
            {selectedVille === 'Autre' && (
              <div className="animate-fade-in-up">
                <label htmlFor="custom-ville" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Préciser le nom de la ville
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-600 dark:text-teal-400 pointer-events-none" />
                  <input
                    id="custom-ville"
                    type="text"
                    autoFocus
                    value={customVille}
                    onChange={(e) => setCustomVille(e.target.value)}
                    placeholder="Ex: Taroudant, Tiznit, Settat, Guelmim..."
                    className="w-full h-10 pl-10 pr-3 text-sm bg-white dark:bg-slate-800/90 border border-teal-500/50 dark:border-teal-500/50 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
                  />
                </div>
              </div>
            )}

            {/* Adresse Physique (Rue / Zone / Bâtiment) */}
            <div>
              <label htmlFor="adresse" className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Adresse (Rue, Zone Industrielle, Bâtiment)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400 dark:text-slate-500 pointer-events-none" />
                <textarea
                  id="adresse"
                  rows={2}
                  value={adresse}
                  onChange={(e) => setAdresse(e.target.value)}
                  placeholder="Ex: Zone Industrielle Tassila, Lot 42, Bâtiment B"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none hover:border-slate-300 dark:hover:border-slate-600"
                />
              </div>
            </div>

            {/* Évaluation / Notation Fournisseur */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Évaluation Qualité / Performance
                </label>
                <span className="text-[11px] font-bold text-amber-500 flex items-center space-x-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{rating.toFixed(1)} / 5.0</span>
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {/* Clickable Stars + Saisie Manuelle */}
                <div className="flex items-center space-x-2.5">
                  {/* 5 Etoiles */}
                  <div className="flex items-center space-x-0.5">
                    {[1, 2, 3, 4, 5].map((starValue) => (
                      <button
                        key={starValue}
                        type="button"
                        onClick={() => {
                          setRating(starValue);
                          setRatingInput(starValue.toFixed(1));
                        }}
                        className="p-1 hover:scale-125 transition-transform duration-150 active:scale-95"
                        title={`Attribuer ${starValue} étoile${starValue > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            starValue <= Math.round(rating)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-300 dark:text-slate-600 hover:text-amber-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>

                  {/* Champ de saisie de note exacte */}
                  <div className="flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={ratingInput}
                      onChange={(e) => handleRatingInputChange(e.target.value)}
                      onBlur={handleRatingInputBlur}
                      placeholder="4.5"
                      className="w-12 h-7 text-center text-xs font-bold rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      title="Saisir la note exacte (ex: 4.7)"
                      aria-label="Note exacte sur 5"
                    />
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">/ 5.0</span>
                  </div>
                </div>

                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
                  {rating >= 4.5
                    ? '⭐ Recommandé (Top Tier)'
                    : rating >= 3.5
                    ? '✔ Fournisseur Conforme'
                    : '⚠ Sous surveillance'}
                </span>
              </div>
            </div>

            {/* Live Concatenation Preview */}
            {displayedCombined && (
              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 rounded-lg px-3 py-2 text-xs flex items-center space-x-2 text-slate-600 dark:text-slate-400 animate-fade-in-up">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 shrink-0">
                  Enregistré en BD :
                </span>
                <span className="truncate font-medium text-slate-800 dark:text-slate-200" title={displayedCombined}>
                  « {displayedCombined} »
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-10 px-4 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 active:scale-[0.97]"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-10 px-5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm hover:shadow-md transition-all duration-150 flex items-center space-x-2 disabled:opacity-50 active:scale-[0.97]"
            >
              {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>{isEditing ? 'Enregistrer' : 'Créer le fournisseur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
