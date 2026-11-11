import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import L from '../utils/leafletSetup';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import {
  MapPin,
  Globe,
  AlertTriangle,
  Crosshair,
  Edit3,
  X,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Fournisseur } from '../types/fournisseur';
import { SupplierOrderStats, formatMAD } from '../utils/orderStats';
import { computeSupplierRating } from '../utils/scoring';
import {
  resolveSupplierLocation,
  getExactCoordinatesCache,
  geocodeSingleSupplierAddress,
  ResolvedLocation,
} from '../utils/geoLocation';

interface FournisseurMapProps {
  fournisseurs: Fournisseur[];
  loading: boolean;
  isDarkMode: boolean;
  orderStats?: Record<number, SupplierOrderStats>;
  onEdit: (fournisseur: Fournisseur) => void;
  onViewCommandes: (fournisseur: Fournisseur) => void;
  onNotify?: (type: 'success' | 'error', text: string) => void;
}

type TileStyleMode = 'auto' | 'osm' | 'carto-voyager' | 'carto-dark';

const MOROCCO_CENTER: [number, number] = [31.7917, -7.0926];
const MOROCCO_ZOOM = 6;

const TILE_PROVIDERS = {
  osm: {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  'carto-voyager': {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
  },
  'carto-dark': {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    maxZoom: 19,
  },
};

export const FournisseurMap: React.FC<FournisseurMapProps> = ({
  fournisseurs,
  loading,
  isDarkMode,
  orderStats,
  onEdit,
  onViewCommandes,
  onNotify,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const lastBoundsKeyRef = useRef<string>('');
  const skipNextFitRef = useRef<boolean>(false);

  // Keep parent callbacks in refs so re-renders (e.g. toast open/close) never rebuild markers or reset zoom
  const onEditRef = useRef(onEdit);
  const onViewCommandesRef = useRef(onViewCommandes);
  const onNotifyRef = useRef(onNotify);
  const orderStatsRef = useRef(orderStats);

  onEditRef.current = onEdit;
  onViewCommandesRef.current = onViewCommandes;
  onNotifyRef.current = onNotify;
  orderStatsRef.current = orderStats;

  const [tileMode, setTileMode] = useState<TileStyleMode>('auto');
  const [exactCache, setExactCache] = useState(() => getExactCoordinatesCache());
  const [showUnlocalizedPanel, setShowUnlocalizedPanel] = useState(false);
  const [geocodingId, setGeocodingId] = useState<number | null>(null);
  const geocodingIdRef = useRef<number | null>(null);
  geocodingIdRef.current = geocodingId;

  // Resolve locations for all visible suppliers
  const resolvedLocations = useMemo<ResolvedLocation[]>(() => {
    return fournisseurs.map((f) => resolveSupplierLocation(f, exactCache));
  }, [fournisseurs, exactCache]);

  const exactLocations = useMemo(
    () => resolvedLocations.filter((l) => l.precision === 'exact'),
    [resolvedLocations]
  );
  const cityLocations = useMemo(
    () => resolvedLocations.filter((l) => l.precision === 'city_approximate'),
    [resolvedLocations]
  );
  const localizedLocations = useMemo(
    () => resolvedLocations.filter((l) => l.precision !== 'unlocalized' && l.lat !== undefined && l.lng !== undefined),
    [resolvedLocations]
  );
  const unlocalizedLocations = useMemo(
    () => resolvedLocations.filter((l) => l.precision === 'unlocalized'),
    [resolvedLocations]
  );

  // Handle single user-triggered Nominatim lookup
  const handleGeocodeSingle = useCallback(async (fournisseur: Fournisseur) => {
    if (geocodingIdRef.current !== null) {
      onNotifyRef.current?.('error', 'Une recherche OpenStreetMap est déjà en cours...');
      return;
    }
    if (!fournisseur.adresse?.trim()) {
      onNotifyRef.current?.('error', 'Veuillez d’abord renseigner une adresse pour ce fournisseur.');
      return;
    }
    setGeocodingId(fournisseur.id);
    try {
      const res = await geocodeSingleSupplierAddress(fournisseur);
      if (res) {
        skipNextFitRef.current = true;
        setExactCache(getExactCoordinatesCache());
        onNotifyRef.current?.(
          'success',
          `Position exacte enregistrée pour ${fournisseur.nom} (${res.lat.toFixed(4)}, ${res.lng.toFixed(4)}).`
        );
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([res.lat, res.lng], 14, { animate: true });
        }
      } else {
        onNotifyRef.current?.(
          'error',
          `Adresse introuvable sur OpenStreetMap pour "${fournisseur.nom}". Conservation de la localisation par ville ou modifiez l’adresse.`
        );
      }
    } catch (err: any) {
      onNotifyRef.current?.('error', err?.message || 'Erreur lors du géocodage OpenStreetMap.');
    } finally {
      setGeocodingId(null);
    }
  }, []);

  // Initialize Leaflet Map once
  useEffect(() => {
    const containerEl = mapContainerRef.current;
    if (!containerEl || mapInstanceRef.current) return;

    const map = L.map(containerEl, {
      center: MOROCCO_CENTER,
      zoom: MOROCCO_ZOOM,
      zoomControl: false, // Placed bottomright below
      minZoom: 2,
      maxZoom: 19,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initialize MarkerCluster group with Spiderfy enabled for overlapping city centroids
    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 42,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let sizeClass = 'w-9 h-9 text-xs';
        if (count >= 10 && count < 50) sizeClass = 'w-10 h-10 text-xs';
        else if (count >= 50) sizeClass = 'w-12 h-12 text-sm';

        return L.divIcon({
          html: `
            <div class="flex items-center justify-center ${sizeClass} rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-white font-bold shadow-lg ring-4 ring-teal-500/25 border-2 border-white dark:border-slate-900 transition-transform hover:scale-110">
              ${count}
            </div>
          `,
          className: 'procura-cluster-icon',
          iconSize: L.point(40, 40),
        });
      },
    });

    map.addLayer(clusterGroup);

    mapInstanceRef.current = map;
    clusterGroupRef.current = clusterGroup;

    // Keep Leaflet viewport synchronized with container resizes / drawer toggles
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(containerEl);
    }

    // Force resize calculation after mount
    const mountTimer = setTimeout(() => {
      map.invalidateSize();
    }, 150);

    return () => {
      clearTimeout(mountTimer);
      resizeObserver?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
      clusterGroupRef.current = null;
      tileLayerRef.current = null;
    };
  }, []);

  // Recalculate container size when side drawer toggles
  useEffect(() => {
    const t = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 100);
    return () => clearTimeout(t);
  }, [showUnlocalizedPanel]);

  // Update Tile Layer whenever tileMode or isDarkMode changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const effectiveKey: keyof typeof TILE_PROVIDERS =
      tileMode === 'auto' ? (isDarkMode ? 'carto-dark' : 'osm') : tileMode;

    const provider = TILE_PROVIDERS[effectiveKey];
    const layer = L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom,
    });

    layer.addTo(map);
    tileLayerRef.current = layer;
  }, [tileMode, isDarkMode]);

  // Build Safe Interactive Popup DOM Element dynamically on open
  const createPopupElement = useCallback(
    (loc: ResolvedLocation) => {
      const f = loc.fournisseur;
      const stats = orderStatsRef.current?.[f.id];
      const rating = computeSupplierRating(f);

      const container = document.createElement('div');
      container.className = 'p-3.5 text-slate-800 dark:text-slate-100 space-y-2.5';

      // Header row
      const header = document.createElement('div');
      header.className = 'flex items-start justify-between gap-2 pr-4';

      const titleWrap = document.createElement('div');
      const title = document.createElement('h4');
      title.className = 'font-bold text-sm leading-snug text-slate-900 dark:text-white';
      title.textContent = f.nom;

      const idSub = document.createElement('span');
      idSub.className = 'text-[11px] font-mono text-slate-400 dark:text-slate-500';
      idSub.textContent = `ID #${f.id} • ${rating.score.toFixed(1)} ★`;

      titleWrap.appendChild(title);
      titleWrap.appendChild(idSub);

      const statusPill = document.createElement('span');
      statusPill.className = f.actif
        ? 'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
        : 'shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700';
      statusPill.textContent = f.actif ? 'Actif' : 'Inactif';

      header.appendChild(titleWrap);
      header.appendChild(statusPill);
      container.appendChild(header);

      // Precision badge
      const precisionBadge = document.createElement('div');
      if (loc.precision === 'exact') {
        precisionBadge.className =
          'inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80';
        precisionBadge.textContent = `✓ ${loc.sourceLabel}`;
      } else {
        precisionBadge.className =
          'inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/80';
        precisionBadge.textContent = `ⓘ ${loc.sourceLabel}`;
      }
      container.appendChild(precisionBadge);

      // Address & Contact
      const details = document.createElement('div');
      details.className = 'text-xs text-slate-600 dark:text-slate-300 space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800';

      const addrEl = document.createElement('div');
      addrEl.className = 'leading-relaxed';
      addrEl.textContent = f.adresse || 'Adresse non renseignée';
      details.appendChild(addrEl);

      if (stats && stats.activeOrders > 0) {
        const statsEl = document.createElement('div');
        statsEl.className = 'font-semibold text-teal-700 dark:text-teal-400 pt-0.5';
        statsEl.textContent = `${stats.activeOrders} cde(s) • ${formatMAD(stats.totalOrderedAmount)}`;
        details.appendChild(statsEl);
      }
      container.appendChild(details);

      // Action buttons
      const actions = document.createElement('div');
      actions.className = 'flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800';

      const btnOrders = document.createElement('button');
      btnOrders.type = 'button';
      btnOrders.className =
        'flex-1 px-2.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-semibold transition-colors cursor-pointer';
      btnOrders.textContent = 'Dossier Commandes';
      btnOrders.addEventListener('click', () => onViewCommandesRef.current(f));

      const btnEdit = document.createElement('button');
      btnEdit.type = 'button';
      btnEdit.className =
        'px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition-colors cursor-pointer';
      btnEdit.textContent = 'Modifier';
      btnEdit.addEventListener('click', () => onEditRef.current(f));

      actions.appendChild(btnOrders);
      actions.appendChild(btnEdit);
      container.appendChild(actions);

      // Optional single-supplier exact lookup button if currently city-approximate
      if (loc.precision === 'city_approximate' && f.adresse) {
        const geocodeRow = document.createElement('div');
        geocodeRow.className = 'pt-1';

        const btnGeo = document.createElement('button');
        btnGeo.type = 'button';
        btnGeo.className =
          'w-full px-2 py-1 rounded-md text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50/70 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/70 dark:border-sky-800/70 transition-colors cursor-pointer';
        btnGeo.textContent = '⌖ Rechercher position GPS exacte (OSM)';
        btnGeo.addEventListener('click', () => {
          btnGeo.disabled = true;
          btnGeo.textContent = 'Recherche en cours...';
          handleGeocodeSingle(f);
        });

        geocodeRow.appendChild(btnGeo);
        container.appendChild(geocodeRow);
      }

      return container;
    },
    [handleGeocodeSingle]
  );

  // Sync Markers & Clusters when resolved locations update
  useEffect(() => {
    const clusterGroup = clusterGroupRef.current;
    const map = mapInstanceRef.current;
    if (!clusterGroup || !map) return;

    clusterGroup.clearLayers();

    const bounds = L.latLngBounds([]);

    localizedLocations.forEach((loc) => {
      if (loc.lat === undefined || loc.lng === undefined) return;
      const f = loc.fournisseur;
      const isExact = loc.precision === 'exact';

      // Visual distinction:
      // Exact = Emerald/Teal solid ring
      // City Approximate = Sky/Amber dashed outer ring
      // Inactive = Slate muted
      const bgColor = !f.actif
        ? 'bg-slate-500'
        : isExact
        ? 'bg-teal-600'
        : 'bg-sky-600';

      const ringStyle = isExact
        ? 'border-2 border-white dark:border-slate-900 ring-2 ring-teal-500/40'
        : 'border-2 border-dashed border-white dark:border-slate-900 ring-2 ring-sky-400/50';

      const iconHtml = `
        <div class="relative flex items-center justify-center w-8 h-8 rounded-full ${bgColor} ${ringStyle} text-white shadow-md transition-transform hover:scale-110">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          ${
            isExact
              ? '<span class="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white"></span>'
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'procura-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      const marker = L.marker([loc.lat, loc.lng], { icon });
      marker.bindTooltip(
        `${f.nom} (${isExact ? 'Exact' : `~${loc.cityName || 'Ville'}`})`,
        { direction: 'top', offset: [0, -14] }
      );

      marker.bindPopup(() => createPopupElement(loc), {
        className: 'procura-popup',
        maxWidth: 310,
      });

      clusterGroup.addLayer(marker);
      bounds.extend([loc.lat, loc.lng]);
    });

    const boundsKey = localizedLocations
      .map((l) => `${l.fournisseur.id}:${l.lat}:${l.lng}:${l.precision}`)
      .join('|');

    if (skipNextFitRef.current) {
      skipNextFitRef.current = false;
      lastBoundsKeyRef.current = boundsKey;
      return;
    }

    if (boundsKey !== lastBoundsKeyRef.current) {
      lastBoundsKeyRef.current = boundsKey;
      if (bounds.isValid() && localizedLocations.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
      } else {
        map.setView(MOROCCO_CENTER, MOROCCO_ZOOM);
      }
    }
  }, [localizedLocations, createPopupElement]);

  // Quick camera actions
  const handleCenterMorocco = () => {
    mapInstanceRef.current?.setView(MOROCCO_CENTER, MOROCCO_ZOOM, { animate: true });
  };

  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map || localizedLocations.length === 0) return;
    const bounds = L.latLngBounds([]);
    localizedLocations.forEach((l) => {
      if (l.lat !== undefined && l.lng !== undefined) {
        bounds.extend([l.lat, l.lng]);
      }
    });
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12, animate: true });
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in-up">
      {/* Top Map Control & Legend Header */}
      <div className="px-4 sm:px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Precision Legend & Counts */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800/80 text-emerald-700 dark:text-emerald-300 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600 ring-2 ring-emerald-400/50 inline-block" />
            <span>Position exacte ({exactLocations.length})</span>
          </div>

          <div
            title="Positionnée sur le centroïde réel de la ville mentionnée dans l'adresse"
            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 font-semibold cursor-help"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-sky-600 border border-dashed border-white inline-block" />
            <span>Approx. par ville ({cityLocations.length})</span>
          </div>

          {unlocalizedLocations.length > 0 && (
            <button
              type="button"
              onClick={() => setShowUnlocalizedPanel((prev) => !prev)}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                showUnlocalizedPanel
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200/80 dark:border-amber-800/80 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Non localisés ({unlocalizedLocations.length})</span>
            </button>
          )}
        </div>

        {/* Right: Quick Nav & Map Theme Switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={handleCenterMorocco}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-2xs transition-colors"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Maroc</span>
          </button>

          <button
            type="button"
            onClick={handleFitAll}
            disabled={localizedLocations.length === 0}
            className="inline-flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold shadow-2xs transition-colors disabled:opacity-40"
          >
            <Globe className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Tout voir</span>
          </button>

          {/* Tile Layer Selector */}
          <div className="inline-flex items-center space-x-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTileMode('auto')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                tileMode === 'auto'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => setTileMode('osm')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                tileMode === 'osm'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              OSM
            </button>
            <button
              type="button"
              onClick={() => setTileMode('carto-dark')}
              className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${
                tileMode === 'carto-dark'
                  ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sombre
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Area + Optional Unlocalized Drawer */}
      <div className="relative flex flex-col lg:flex-row h-[580px]">
        {/* Interactive Leaflet Container */}
        <div className="relative flex-1 h-full">
          <div ref={mapContainerRef} className="w-full h-full" />

          {loading && (
            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-[1px] z-20 flex items-center justify-center">
              <div className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 flex items-center space-x-2 text-xs font-semibold">
                <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
                <span>Chargement de la carte...</span>
              </div>
            </div>
          )}

          {localizedLocations.length === 0 && !loading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-xl bg-white/95 dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 shadow-md text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center space-x-2">
              <Info className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Aucun fournisseur filtré ne possède une ville ou des coordonnées reconnues.</span>
            </div>
          )}
        </div>

        {/* Unlocalized Suppliers Side Drawer */}
        {showUnlocalizedPanel && unlocalizedLocations.length > 0 && (
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/95 flex flex-col h-64 lg:h-full z-20">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sans localisation ({unlocalizedLocations.length})</span>
                </h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Aucune coordonnée inventée : complétez l'adresse ou tentez le géocodage OSM.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUnlocalizedPanel(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {unlocalizedLocations.map(({ fournisseur: f }) => (
                <div
                  key={f.id}
                  className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {f.nom}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {f.adresse || 'Adresse absente'}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">#{f.id}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onEdit(f)}
                      className="flex-1 inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition-colors"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Éditer adresse</span>
                    </button>

                    {f.adresse && (
                      <button
                        type="button"
                        disabled={geocodingId === f.id}
                        onClick={() => handleGeocodeSingle(f)}
                        title="Rechercher l'adresse exacte via OpenStreetMap"
                        className="inline-flex items-center justify-center space-x-1 px-2 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200/80 dark:border-sky-800/80 text-[11px] font-semibold text-sky-700 dark:text-sky-300 transition-colors disabled:opacity-50"
                      >
                        <Crosshair className={`w-3 h-3 ${geocodingId === f.id ? 'animate-spin' : ''}`} />
                        <span>OSM</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
