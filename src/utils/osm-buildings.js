import osmbSource from 'osmbuildings/dist/OSMBuildings-Leaflet.js?raw'
// L'IIFE utilise `(function(ca){ ... })(this)` — en ESM, `this` est undefined.
// On l'exécute via new Function().call(globalThis) pour que `ca` = window.
new Function(osmbSource).call(typeof globalThis !== 'undefined' ? globalThis : window)
export default window.OSMBuildings
