import L from 'leaflet';

// Leaflet.markercluster UMD plugin expects global L to attach L.MarkerClusterGroup.
// Assigning L on globalThis/window here ensures reliable execution across Vite dev and Rollup production bundles.
if (typeof globalThis !== 'undefined' && !(globalThis as any).L) {
  (globalThis as any).L = L;
}
if (typeof window !== 'undefined' && !(window as any).L) {
  (window as any).L = L;
}

export default L;

