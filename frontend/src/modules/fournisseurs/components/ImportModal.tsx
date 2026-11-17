import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Upload,
  UploadCloud,
  FileSpreadsheet,
  FileText,
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  Trash2,
  RefreshCw,
  ArrowRight,
  Filter,
  Check,
  Star,
  Building2,
} from 'lucide-react';
import { Fournisseur, FournisseurRequest } from '../types/fournisseur';
import {
  ParsedImportRow,
  ImportValidationResult,
  parseCSV,
  parseExcel,
  validateImportData,
  generateCSVTemplate,
} from '../utils/importer';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingFournisseurs: Fournisseur[];
  onImportSuccess: (importedCount: number) => void;
  onSaveSupplier: (payload: FournisseurRequest) => Promise<any>;
}

type TabFilter = 'all' | 'valid' | 'invalid';

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  existingFournisseurs,
  onImportSuccess,
  onSaveSupplier,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; currentName: string }>({
    current: 0,
    total: 0,
    currentName: '',
  });
  const [importSummary, setImportSummary] = useState<{
    successCount: number;
    failedCount: number;
    failedErrors: { name: string; error: string }[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFile(null);
      setIsDragging(false);
      setIsLoadingFile(false);
      setValidationResult(null);
      setActiveTab('all');
      setIsImporting(false);
      setImportSummary(null);
    }
  }, [isOpen]);

  // Handle keyboard Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isImporting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isImporting, onClose]);

  // Process incoming file (CSV or Excel)
  const processFile = useCallback(
    async (uploadedFile: File) => {
      setIsLoadingFile(true);
      setFile(uploadedFile);
      setImportSummary(null);

      try {
        const fileName = uploadedFile.name.toLowerCase();
        let rawMatrix: string[][] = [];

        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
          const buffer = await uploadedFile.arrayBuffer();
          rawMatrix = await parseExcel(buffer);
        } else {
          // CSV, TSV, TXT
          const text = await uploadedFile.text();
          rawMatrix = parseCSV(text);
        }

        const result = validateImportData(rawMatrix, existingFournisseurs);
        setValidationResult(result);
        if (result.validCount === 0 && result.errorCount > 0) {
          setActiveTab('invalid');
        } else {
          setActiveTab('all');
        }
      } catch (err) {
        console.error('Erreur lors du traitement du fichier:', err);
        alert("Impossible de lire le fichier. Assurez-vous qu'il s'agit d'un fichier CSV ou Excel valide.");
        setFile(null);
        setValidationResult(null);
      } finally {
        setIsLoadingFile(false);
      }
    },
    [existingFournisseurs]
  );

  // Drag & drop listeners
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const csvContent = generateCSVTemplate();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_import_fournisseurs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Toggle selection for a single row
  const handleToggleRow = (tempId: string) => {
    if (!validationResult) return;
    setValidationResult({
      ...validationResult,
      rows: validationResult.rows.map((r) =>
        r.tempId === tempId ? { ...r, selected: !r.selected } : r
      ),
    });
  };

  // Bulk selection toggles
  const handleSelectAllValid = () => {
    if (!validationResult) return;
    setValidationResult({
      ...validationResult,
      rows: validationResult.rows.map((r) => ({ ...r, selected: r.isValid })),
    });
  };

  const handleSelectAll = () => {
    if (!validationResult) return;
    const allSelected = validationResult.rows.every((r) => r.selected);
    setValidationResult({
      ...validationResult,
      rows: validationResult.rows.map((r) => ({ ...r, selected: !allSelected })),
    });
  };

  // Remove a row from the preview table
  const handleDeleteRow = (tempId: string) => {
    if (!validationResult) return;
    const updatedRows = validationResult.rows.filter((r) => r.tempId !== tempId);
    setValidationResult({
      rows: updatedRows,
      totalRows: updatedRows.length,
      validCount: updatedRows.filter((r) => r.isValid).length,
      duplicateCount: updatedRows.filter((r) => r.isDuplicateExisting || r.isDuplicateInFile).length,
      errorCount: updatedRows.filter((r) => !r.isValid).length,
    });
  };

  // Filtered rows for active tab
  const displayedRows = useMemo(() => {
    if (!validationResult) return [];
    if (activeTab === 'valid') return validationResult.rows.filter((r) => r.isValid);
    if (activeTab === 'invalid') return validationResult.rows.filter((r) => !r.isValid);
    return validationResult.rows;
  }, [validationResult, activeTab]);

  const selectedCount = useMemo(() => {
    return validationResult ? validationResult.rows.filter((r) => r.selected).length : 0;
  }, [validationResult]);

  // Execute import of selected rows
  const handleExecuteImport = async () => {
    if (!validationResult) return;
    const toImport = validationResult.rows.filter((r) => r.selected && r.isValid);
    if (toImport.length === 0) return;

    setIsImporting(true);
    setProgress({ current: 0, total: toImport.length, currentName: '' });

    let successCount = 0;
    let failedCount = 0;
    const failedErrors: { name: string; error: string }[] = [];

    for (let i = 0; i < toImport.length; i++) {
      const row = toImport[i];
      setProgress({
        current: i + 1,
        total: toImport.length,
        currentName: row.nom,
      });

      try {
        const payload: FournisseurRequest = {
          nom: row.nom,
          email: row.email,
          telephone: row.telephone || null,
          adresse: row.adresse || null,
          rating: row.rating,
        };
        await onSaveSupplier(payload);
        successCount++;
      } catch (err: any) {
        console.error(`Échec d'import pour ${row.nom}:`, err);
        failedCount++;
        failedErrors.push({
          name: row.nom,
          error: err?.message || 'Erreur inconnue lors de la création',
        });
      }
    }

    setIsImporting(false);
    setImportSummary({
      successCount,
      failedCount,
      failedErrors,
    });

    if (successCount > 0) {
      onImportSuccess(successCount);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={() => {
          if (!isImporting) onClose();
        }}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-10 animate-scale-up">
        {/* Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                Importation de Fournisseurs
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                  CSV / Excel
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Intégrez massivement des fournisseurs avec contrôle d'intégrité et détection automatique des doublons.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              title="Télécharger le fichier modèle CSV"
              className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Modèle CSV</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isImporting}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Step 1: No file loaded -> Dropzone */}
          {!validationResult && !importSummary && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 sm:p-14 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/30 scale-[1.01]'
                    : 'border-slate-300 dark:border-slate-700 hover:border-teal-400 dark:hover:border-teal-500 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls,.tsv,.txt"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-teal-100 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shadow-inner">
                  {isLoadingFile ? (
                    <RefreshCw className="w-8 h-8 animate-spin" />
                  ) : (
                    <UploadCloud className="w-8 h-8" />
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isLoadingFile ? 'Analyse du fichier en cours...' : 'Déposez votre fichier ici ou parcourez vos dossiers'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
                  Prend en charge les fichiers <strong>CSV</strong> (séparateur virgule, point-virgule ou tabulation) et <strong>Excel (.xlsx, .xls)</strong>.
                </p>

                <div className="mt-6 flex items-center justify-center gap-2.5 flex-wrap">
                  <span className="px-3 py-1 text-2xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    .CSV
                  </span>
                  <span className="px-3 py-1 text-2xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    .XLSX
                  </span>
                  <span className="px-3 py-1 text-2xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    .XLS
                  </span>
                  <span className="px-3 py-1 text-2xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    .TSV
                  </span>
                </div>
              </div>

              {/* Tips & Template Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Colonnes reconnues automatiquement
                    </h4>
                    <p className="text-2xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      <strong>nom</strong> (obligatoire), <strong>email</strong> (obligatoire & unique), <strong>telephone</strong>, <strong>adresse</strong>, <strong>note</strong> (optionnelle, 1.0 à 5.0).
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/80 rounded-lg transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Télécharger le modèle</span>
                </button>
              </div>
            </div>
          )}

          {/* Step 2: File loaded & validated -> Preview Table */}
          {validationResult && !importSummary && (
            <div className="flex-1 min-h-0 flex flex-col p-6 space-y-4">
              {/* Top Controls (Non-scrolling) */}
              <div className="shrink-0 space-y-4">
                {/* File Info Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {file?.name}
                    </span>
                    <span className="text-2xs text-slate-400 dark:text-slate-500 shrink-0">
                      ({file ? (file.size / 1024).toFixed(1) : 0} Ko)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setValidationResult(null);
                    }}
                    disabled={isImporting}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline font-semibold flex items-center space-x-1.5 disabled:opacity-40"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Changer de fichier</span>
                  </button>
                </div>

                {/* Compact Summary Metric Strip */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Total Détecté
                      </span>
                      <div className="flex items-baseline space-x-2 mt-0.5">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {validationResult.totalRows}
                        </span>
                        <span className="text-2xs text-slate-500 dark:text-slate-400">
                          lignes analysées
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-slate-200/60 dark:bg-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
                      <FileText className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        Prêtes à Importer
                      </span>
                      <div className="flex items-baseline space-x-2 mt-0.5">
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                          {validationResult.validCount}
                        </span>
                        <span className="text-2xs text-emerald-600/90 dark:text-emerald-400/90">
                          conformes et uniques
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="px-4 py-3 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-2xs font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                        Doublons / Erreurs
                      </span>
                      <div className="flex items-baseline space-x-2 mt-0.5">
                        <span className="text-xl font-black text-rose-700 dark:text-rose-300">
                          {validationResult.errorCount}
                        </span>
                        <span className="text-2xs text-rose-600/90 dark:text-rose-400/90">
                          lignes non importables
                        </span>
                      </div>
                    </div>
                    <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Tabs & Bulk Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  {/* Tabs */}
                  <div className="inline-flex items-center space-x-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800 self-start">
                    <button
                      type="button"
                      onClick={() => setActiveTab('all')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === 'all'
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Toutes ({validationResult.totalRows})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('valid')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === 'valid'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Valides ({validationResult.validCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('invalid')}
                      className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        activeTab === 'invalid'
                          ? 'bg-rose-600 text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Doublons & Erreurs ({validationResult.errorCount})
                    </button>
                  </div>

                  {/* Bulk selection buttons */}
                  <div className="flex items-center space-x-3 text-xs">
                    <button
                      type="button"
                      onClick={handleSelectAllValid}
                      className="text-teal-700 dark:text-teal-400 hover:underline font-semibold"
                    >
                      Sélectionner valides
                    </button>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-slate-600 dark:text-slate-400 hover:underline font-medium"
                    >
                      Inverser la sélection
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Table Container (Only vertical scroll, zero horizontal cutoff) */}
              <div className="flex-1 min-h-[240px] border border-slate-200 dark:border-slate-800 rounded-xl overflow-y-auto overflow-x-hidden shadow-2xs bg-white dark:bg-slate-900">
                <table className="w-full table-fixed text-left border-collapse text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 font-semibold z-10 shadow-2xs">
                    <tr>
                      <th className="py-3 px-3 w-11 text-center">
                        <input
                          type="checkbox"
                          checked={
                            displayedRows.length > 0 &&
                            displayedRows.every((r) => r.selected)
                          }
                          onChange={() => {
                            const allChecked = displayedRows.every((r) => r.selected);
                            setValidationResult({
                              ...validationResult,
                              rows: validationResult.rows.map((r) =>
                                displayedRows.some((dr) => dr.tempId === r.tempId)
                                  ? { ...r, selected: !allChecked }
                                  : r
                              ),
                            });
                          }}
                          className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600"
                        />
                      </th>
                      <th className="py-3 px-3 w-[23%] font-semibold">Fournisseur</th>
                      <th className="py-3 px-3 w-[23%] font-semibold">E-mail</th>
                      <th className="py-3 px-3 w-[14%] font-semibold hidden md:table-cell">Téléphone</th>
                      <th className="py-3 px-3 w-[17%] font-semibold hidden lg:table-cell">Adresse</th>
                      <th className="py-3 px-2 w-16 font-semibold text-center">Note</th>
                      <th className="py-3 px-3 w-36 font-semibold text-right">Statut</th>
                      <th className="py-3 px-2 w-11 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {displayedRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                          Aucune ligne dans cette vue.
                        </td>
                      </tr>
                    ) : (
                      displayedRows.map((row) => (
                        <tr
                          key={row.tempId}
                          className={`transition-colors ${
                            !row.isValid
                              ? 'bg-rose-50/40 dark:bg-rose-950/20'
                              : row.selected
                              ? 'bg-teal-50/20 dark:bg-teal-950/10'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <td className="py-3 px-3 text-center align-middle">
                            <input
                              type="checkbox"
                              checked={row.selected}
                              disabled={!row.isValid}
                              onChange={() => handleToggleRow(row.tempId)}
                              className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 disabled:opacity-30 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div
                              title={row.nom}
                              className="font-semibold text-slate-900 dark:text-white truncate"
                            >
                              {row.nom || <span className="italic text-rose-500">Nom vide</span>}
                            </div>
                            {!row.isValid && row.errors.length > 0 && (
                              <div className="text-[10px] text-rose-600 dark:text-rose-400 truncate mt-0.5 font-medium" title={row.errors.join(' • ')}>
                                {row.errors[0]}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 align-middle">
                            <div
                              title={row.email}
                              className="font-mono text-2xs text-slate-600 dark:text-slate-300 truncate"
                            >
                              {row.email || <span className="italic text-rose-500">Email manquant</span>}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden md:table-cell align-middle">
                            <div title={row.telephone} className="truncate whitespace-nowrap">
                              {row.telephone || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-500 dark:text-slate-400 hidden lg:table-cell align-middle">
                            <div title={row.adresse} className="truncate">
                              {row.adresse || '—'}
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center align-middle">
                            {row.rating ? (
                              <span className="inline-flex items-center space-x-0.5 text-2xs font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                                <span>{row.rating.toFixed(1)}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right align-middle">
                            {row.isValid ? (
                              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
                                <Check className="w-3 h-3 shrink-0" />
                                <span>Prêt</span>
                              </span>
                            ) : row.isDuplicateExisting ? (
                              <span
                                title={row.errors.join(' • ')}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-help whitespace-nowrap"
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Doublon base</span>
                              </span>
                            ) : row.isDuplicateInFile ? (
                              <span
                                title={row.errors.join(' • ')}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 cursor-help whitespace-nowrap"
                              >
                                <AlertTriangle className="w-3 h-3 shrink-0" />
                                <span>Doublon fichier</span>
                              </span>
                            ) : (
                              <span
                                title={row.errors.join(' • ')}
                                className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-2xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 cursor-help whitespace-nowrap"
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>Erreur</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-center align-middle">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.tempId)}
                              title="Supprimer de l'import"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Live import progress bar */}
              {isImporting && (
                <div className="shrink-0 p-4 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-teal-800 dark:text-teal-200">
                    <span className="flex items-center space-x-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
                      <span>Importation en cours de "{progress.currentName}"...</span>
                    </span>
                    <span>
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-teal-200/60 dark:bg-teal-900 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-200"
                      style={{
                        width: `${Math.round((progress.current / Math.max(progress.total, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Final Import Summary */}
          {importSummary && (
            <div className="flex-1 overflow-y-auto p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Importation terminée avec succès !
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <strong>{importSummary.successCount}</strong> fournisseur(s) ont été créés et ajoutés au catalogue.
                </p>
                {importSummary.failedCount > 0 && (
                  <p className="text-xs text-rose-500 mt-1">
                    {importSummary.failedCount} fournisseur(s) n'ont pas pu être importés.
                  </p>
                )}
              </div>

              {importSummary.failedErrors.length > 0 && (
                <div className="max-w-md mx-auto text-left p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-2xs space-y-1.5">
                  <div className="font-semibold text-rose-700">Détails des échecs :</div>
                  {importSummary.failedErrors.map((f, i) => (
                    <div key={i} className="text-rose-600">
                      • {f.name} : {f.error}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/80 dark:bg-slate-900/80">
          <div>
            {validationResult && !importSummary && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                <strong>{selectedCount}</strong> ligne(s) sélectionnée(s) sur {validationResult.validCount} valide(s)
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            {importSummary ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                Fermer
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isImporting}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors disabled:opacity-40"
                >
                  Annuler
                </button>
                {validationResult && (
                  <button
                    type="button"
                    onClick={handleExecuteImport}
                    disabled={selectedCount === 0 || isImporting}
                    className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm hover:shadow-md flex items-center space-x-1.5 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Import en cours...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Importer {selectedCount} fournisseur(s)</span>
                      </>
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
