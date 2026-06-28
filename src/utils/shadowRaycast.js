import { getSunPosition } from './sun'
import { getBuildingsAroundSync } from './buildingsCache'

// ── Geometry helpers ──────────────────────────────────────────────────────────

function pointInPolygon(px, py, poly) {
  let inside = false
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]
    const [xj, yj] = poly[j]
    if (((yi > py) !== (yj > py)) &&
        (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
      inside = !inside
    }
  }
  return inside
}

// ── Shadow raycasting ─────────────────────────────────────────────────────────

/**
 * sunPosition = { altitude (degrees), azimuth (degrees from N clockwise) }
 * Returns true if the terrace is in shadow.
 */
export function isTerraceShadowed(terrace, buildings, sunPosition) {
  const { altitude, azimuth } = sunPosition

  if (altitude <= 1) return true  // below / near horizon

  const alt_rad = altitude * Math.PI / 180
  const az_rad  = azimuth  * Math.PI / 180

  // Shadow direction (opposite of sun) in local (east, north) meters
  // azimuth from N clockwise: sun_vec = (sin(az), cos(az))
  // shadow_vec = (-sin(az), -cos(az))
  const shadowPerMeter = 1 / Math.tan(alt_rad)
  const sdx = -Math.sin(az_rad) * shadowPerMeter
  const sdy = -Math.cos(az_rad) * shadowPerMeter

  const lat_to_m = 111319
  const lng_to_m = 111319 * Math.cos(terrace.lat * Math.PI / 180)

  for (const building of buildings) {
    const L = building.height

    const poly = building.polygon.map(([bLat, bLng]) => [
      (bLng - terrace.lng) * lng_to_m,
      (bLat - terrace.lat) * lat_to_m,
    ])

    // 1. Inside building footprint
    if (pointInPolygon(0, 0, poly)) return true

    // 2. Inside shadow projection of footprint
    const shadowPoly = poly.map(([x, y]) => [x + sdx * L, y + sdy * L])
    if (pointInPolygon(0, 0, shadowPoly)) return true

    // 3. Inside lateral shadow slabs (edge quads)
    for (let i = 0; i < poly.length; i++) {
      const j = (i + 1) % poly.length
      const quad = [
        poly[i],
        poly[j],
        [poly[j][0] + sdx * L, poly[j][1] + sdy * L],
        [poly[i][0] + sdx * L, poly[i][1] + sdy * L],
      ]
      if (pointInPolygon(0, 0, quad)) return true
    }
  }

  return false
}

// ── Comparison test ───────────────────────────────────────────────────────────

export function testRaycastVsCanvas(terraces, time, shadowCacheRef) {
  if (!terraces?.length) {
    console.warn('[RAYCAST] Aucune terrasse à tester')
    return
  }

  console.group(
    `%c🔭 RAYCAST (local OSM) — ${time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`,
    'font-size: 13px; font-weight: bold; color: #D4500A'
  )

  const sample = terraces.slice(0, 5)
  const sunPos = getSunPosition(time, sample[0].lat, sample[0].lng)
  console.log(`[RAYCAST] Soleil — altitude: ${sunPos.altitude.toFixed(1)}° azimuth: ${sunPos.azimuth.toFixed(1)}°`)

  let matches = 0
  let compared = 0

  sample.forEach(terrace => {
    const buildings = getBuildingsAroundSync(terrace.lat, terrace.lng, 200)
    const shadowed = buildings.length > 0
      ? isTerraceShadowed(terrace, buildings, sunPos)
      : sunPos.altitude <= 30
    const raycastLabel = shadowed ? 'shadow' : 'sunny '

    const canvasVal = shadowCacheRef.current[terrace.id]
    const canvasLabel = canvasVal === undefined ? 'N/A   ' : (canvasVal ? 'sunny ' : 'shadow')

    let match = null
    if (canvasVal !== undefined) {
      match = (!shadowed) === canvasVal
      compared++
      if (match) matches++
    }

    const matchStr = match === null ? '—' : (match ? '✅' : '❌')
    const style = match === false ? 'color:#f87171' : match === true ? 'color:#4ade80' : 'color:#94a3b8'

    console.log(
      `%c[RAYCAST] ${terrace.name.slice(0, 28).padEnd(28)} bâtiments:${String(buildings.length).padStart(3)} raycast:${raycastLabel} canvas:${canvasLabel} ${matchStr}`,
      style
    )
  })

  const pct = compared > 0 ? Math.round((matches / compared) * 100) : 0
  console.log('─'.repeat(70))
  console.log(
    `%c[RAYCAST] Concordance: ${matches}/${compared} (${pct}%)`,
    `font-weight:bold;color:${pct >= 80 ? '#4ade80' : pct >= 50 ? '#f59e0b' : '#f87171'}`
  )
  console.groupEnd()
}
