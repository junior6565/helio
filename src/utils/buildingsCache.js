// Module-level cache — survives React re-renders
let buildings = null
let loadPromise = null

function processCompact(raw) {
  return raw.map(b => {
    const polygon = b.p  // already [[lat, lng], ...]
    const lats = polygon.map(p => p[0])
    const lngs = polygon.map(p => p[1])
    return {
      polygon,
      height: b.h,
      minLat: Math.min(...lats),
      maxLat: Math.max(...lats),
      minLng: Math.min(...lngs),
      maxLng: Math.max(...lngs),
    }
  })
}

export function preloadBuildings() {
  if (buildings !== null) return Promise.resolve(buildings)
  if (loadPromise) return loadPromise

  loadPromise = fetch('/paris-buildings.json')
    .then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return r.json()
    })
    .then(data => {
      buildings = processCompact(Array.isArray(data) ? data : [])
      console.log(`[Buildings] ${buildings.length} bâtiments chargés`)
      return buildings
    })
    .catch(err => {
      console.error('[Buildings] Échec chargement:', err)
      buildings = []
      loadPromise = null
      return []
    })

  return loadPromise
}

// Synchronous — returns [] if not yet loaded
export function getBuildingsAroundSync(lat, lng, radius = 200) {
  if (!buildings || buildings.length === 0) return []

  const dLat = radius / 111319
  const dLng = radius / (111319 * Math.cos(lat * Math.PI / 180))

  return buildings.filter(b =>
    b.maxLat >= lat - dLat &&
    b.minLat <= lat + dLat &&
    b.maxLng >= lng - dLng &&
    b.minLng <= lng + dLng
  )
}

export function isBuildingsLoaded() {
  return buildings !== null
}
