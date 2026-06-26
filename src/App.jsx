import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import OSMBuildings from './utils/osm-buildings'
import {
  getSunPosition, getSunScore, getSunLabel, getSunTimes,
  generateTimeSlots,
} from './utils/sun'
import { fetchNearbyTerraces, searchPlaces } from './utils/places'

const GOOGLE_PLACES_KEY = import.meta.env.VITE_GOOGLE_PLACES_KEY || ''
const PARIS = { lat: 48.8566, lng: 2.3522 }

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function IconSun({ size = 20, color = '#F4A460' }) {
  const c = size / 2
  const rays = [0, 45, 90, 135, 180, 225, 270, 315]
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      {rays.map(a => {
        const r = (a * Math.PI) / 180
        return (
          <line key={a}
            x1={(c + c * 0.52 * Math.cos(r)).toFixed(2)} y1={(c + c * 0.52 * Math.sin(r)).toFixed(2)}
            x2={(c + c * 0.88 * Math.cos(r)).toFixed(2)} y2={(c + c * 0.88 * Math.sin(r)).toFixed(2)}
            stroke={color} strokeWidth="1.5" strokeLinecap="round" />
        )
      })}
      <circle cx={c} cy={c} r={c * 0.38} fill={color} />
    </svg>
  )
}

function IconMoon({ size = 20, color = '#94A3B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

function IconCloud({ size = 20, color = '#94A3B8' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
    </svg>
  )
}

function IconSearch({ size = 17, color = '#7A5A42' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX({ size = 17, color = '#C4A882' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconNavigation({ size = 15, color = '#F4A460' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
}

function IconStar({ size = 13, color = '#D4500A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconShare({ size = 16, color = '#8B6030' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function IconSliders({ size = 15, color = '#C4A882' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round"
      style={{ flexShrink: 0 }}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="#241208" />
      <circle cx="15" cy="12" r="2" fill="#241208" />
      <circle cx="9" cy="18" r="2" fill="#241208" />
    </svg>
  )
}

function IconClock({ size = 16, color = '#D4500A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconHelp({ size = 14, color = '#7A5A42' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function IconMapPin({ size = 16, color = '#7A5A42' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

function IconMap({ size = 18, color = '#D4500A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function IconRoute({ size = 18, color = '#D4500A' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="6" cy="19" r="3" />
      <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
      <circle cx="18" cy="5" r="3" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}


function markerColor(sunny) {
  return sunny ? '#D4500A' : '#6B7280'
}

function SunStatusIcon({ score, size = 22 }) {
  if (score === 0) return <IconMoon size={size} color="#7A5A42" />
  const color = score >= 70 ? '#F4A460' : score >= 30 ? '#D4500A' : '#8B3A07'
  return <IconSun size={size} color={color} />
}

function StarRating({ rating }) {
  if (!rating) return <span style={{ color: '#A89060', fontSize: 12 }}>Aucune note</span>
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <IconStar size={13} color="#D4500A" />
      <span style={{ fontWeight: 700, fontSize: 13, color: '#D4500A' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const panel = {
  background: '#1C0F06',
  borderRadius: 4,
  border: '1.5px solid #3D1F0A',
}

const btnBase = {
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

// ─── TimeSlider component ─────────────────────────────────────────────────────

function TimeSlider({ time, timeSlots, onChange, onDragStart, onDragEnd }) {
  const timeValue = time.getHours() * 60 + time.getMinutes()
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 9, color: '#7A5A42', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 1 }}>Heure simulée</span>
        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#F5E6C8', letterSpacing: 2, lineHeight: 1 }}>
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 8, height: 3, borderRadius: 2, overflow: 'hidden', background: '#3D1F0A' }}>
        {timeSlots.map((slot, i) => {
          const slotMin = slot.time.getHours() * 60 + slot.time.getMinutes()
          return (
            <div key={i} style={{
              flex: 1, borderRadius: 1, transition: 'background 0.2s',
              background: slotMin <= timeValue
                ? (slot.score > 70 ? '#F4A460' : slot.score > 40 ? '#D4500A' : '#5C2E12')
                : '#3D1F0A',
            }} />
          )
        })}
      </div>
      <input type="range" min={480} max={1320} step={30} value={timeValue}
        onChange={onChange}
        onPointerDown={onDragStart}
        onPointerUp={onDragEnd}
        onTouchStart={onDragStart}
        onTouchEnd={onDragEnd}
        style={{ width: '100%', accentColor: '#F4A460', cursor: 'pointer', touchAction: 'none' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 9, color: '#5C3A22' }}>08:00</span>
        <span style={{ fontSize: 9, color: '#5C3A22' }}>22:00</span>
      </div>
    </>
  )
}

const QUARTIERS = {
  'Marais':        [48.8566, 2.3522],
  'Saint-Germain': [48.8534, 2.3338],
  'Oberkampf':     [48.8637, 2.3722],
  'Bastille':      [48.8533, 2.3692],
  'Montmartre':    [48.8867, 2.3431],
}

const timeOptions = Array.from({ length: (22 - 8) * 2 + 1 }, (_, i) => {
  const totalMin = 480 + i * 30
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
})

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const mapContainer = useRef(null)
  const map = useRef(null)
  const shadowRendererRef = useRef(null)
  const osmbRef = useRef(null)
  const shadowCacheRef = useRef({})
  const markersRef = useRef({})
  const flyingRef = useRef(false)
  const terracesRef = useRef([])
  const sheetTouchStartY = useRef(null)
  const timeRef = useRef(null)
  const shadowReadTimerRef = useRef(null)
  const geoMarkerRef = useRef(null)
  const baselineCacheRef = useRef({})
  const shadowScheduleRef = useRef({})
  const isDraggingRef = useRef(false)

  const [time, setTime] = useState(() => {
    const now = new Date()
    now.setMinutes(Math.round(now.getMinutes() / 30) * 30, 0, 0)
    return now
  })
  const [terraces, setTerraces] = useState([])
  const [selectedTerrace, setSelectedTerrace] = useState(null)
  const [filter, setFilter] = useState({ minRating: 0, type: 'all', onlyOpen: false, onlySunny: false })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
  const [showItineraireModal, setShowItineraireModal] = useState(false)
  const [sunInfo, setSunInfo] = useState(null)
  const [timeSlots, setTimeSlots] = useState([])
  const [mapCenter, setMapCenter] = useState(PARIS)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searchFocused, setSearchFocused] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const [sheetExpanded, setSheetExpanded] = useState(false)
  const [showIntro, setShowIntro] = useState(() => !localStorage.getItem('helio_intro_seen'))
  const [shadowVersion, setShadowVersion] = useState(0)
  const [sunnyUntil, setSunnyUntil] = useState(null)
  const [showPlanifier, setShowPlanifier] = useState(false)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [planifQuartier, setPlanifQuartier] = useState('')
  const [planifGeoResults, setPlanifGeoResults] = useState([])
  const [planifDebut, setPlanifDebut] = useState('17:00')
  const [planifFin, setPlanifFin] = useState('20:00')
  const [planifExposition, setPlanifExposition] = useState('soleil')
  const [planifType, setPlanifType] = useState('Tous')
  const [planifActif, setPlanifActif] = useState(false)
  const [planifResultats, setPlanifResultats] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [terraceConfirmations, setTerraceConfirmations] = useState(() => {
    try { return JSON.parse(localStorage.getItem('helio_terrace_confirmations') || '{}') }
    catch { return {} }
  })

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])

  useEffect(() => {
    let el = document.getElementById('helio-zoom-css')
    if (!el) { el = document.createElement('style'); el.id = 'helio-zoom-css'; document.head.appendChild(el) }
    el.textContent = isMobile
      ? `.leaflet-bottom.leaflet-right { bottom: calc(200px + env(safe-area-inset-bottom)) !important; right: 12px !important; }`
      : ``
  }, [isMobile])

  timeRef.current = time

  // ── Map init ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current) return

    delete L.Icon.Default.prototype._getIconUrl
    L.Icon.Default.mergeOptions({ iconUrl: '', shadowUrl: '' })

    map.current = L.map(mapContainer.current, {
      center: [48.8534, 2.3488],
      zoom: 17,
      zoomControl: false,
      wheelPxPerZoomLevel: 80,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      subdomains: 'abcd',
      maxZoom: 20,
    }).addTo(map.current)

    osmbRef.current = new OSMBuildings(map.current)
    osmbRef.current.load('https://{s}.data.osmbuildings.org/0.2/59fcc2e8/tile/{z}/{x}/{y}.json')
    if (typeof osmbRef.current.each === 'function') {
      osmbRef.current.each(function(feature) {
        feature.color = '#C8BCA0'
        feature.roofColor = '#B8AC90'
        return feature
      })
    }

    shadowRendererRef.current = {
      update: (date) => osmbRef.current.date(date),
      destroy: () => {},
    }

    L.control.zoom({ position: 'bottomright' }).addTo(map.current)

    setMapReady(true)
    loadTerraces(PARIS.lat, PARIS.lng, 800)
    setTimeout(() => scheduleShadowRead(), 1000)

    map.current.on('moveend', () => {
      if (flyingRef.current) return
      const c = map.current.getCenter()
      setMapCenter({ lat: c.lat, lng: c.lng })
      setShowSearchHere(true)
      scheduleShadowRead()
      if (osmbRef.current && typeof osmbRef.current.each === 'function') {
        osmbRef.current.each(function(feature) {
          feature.color = '#C8BCA0'
          feature.roofColor = '#B8AC90'
          return feature
        })
      }
    })

    return () => {
      if (shadowReadTimerRef.current) clearTimeout(shadowReadTimerRef.current)
      if (map.current) {
        shadowRendererRef.current?.destroy()
        shadowRendererRef.current = null
        Object.values(markersRef.current).forEach(m => m.marker.remove())
        markersRef.current = {}
        map.current.remove()
        map.current = null
      }
    }
  }, [])

  // ── Sun position update ───────────────────────────────────────────────────
  useEffect(() => {
    const pos = getSunPosition(time, mapCenter.lat, mapCenter.lng)
    const score = getSunScore(time, mapCenter.lat, mapCenter.lng)
    const label = getSunLabel(score)
    const sunTimes = getSunTimes(time, mapCenter.lat, mapCenter.lng)
    setSunInfo({ ...pos, score, ...label, ...sunTimes })
    setTimeSlots(generateTimeSlots(time, mapCenter.lat, mapCenter.lng))
  }, [time, mapCenter])

  // ── Shadow update on time change ──────────────────────────────────────────
  useEffect(() => {
    shadowCacheRef.current = {}
    if (shadowReadTimerRef.current) clearTimeout(shadowReadTimerRef.current)

    // Pendant le drag du slider : on vide le cache (fallback altitude) sans
    // re-render OSM ni lecture canvas — le vrai update arrive au pointerUp
    if (isDraggingRef.current) return

    if (!map.current || !mapContainer.current) return

    const canvas = mapContainer.current.querySelectorAll('canvas')[0]
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const getChecksum = () => {
      let sum = 0; let idx = 1
      for (let x = 0; x < canvas.width; x += 20) {
        for (let y = 0; y < canvas.height; y += 20) {
          sum += ctx.getImageData(x, y, 1, 1).data[3] * idx++
        }
      }
      return sum
    }

    const before = getChecksum()
    shadowRendererRef.current?.update(time)
    const after = getChecksum()

    const applyCanvasData = () => {
      readShadowPixels()
      Object.entries(markersRef.current).forEach(([id, { dot }]) => {
        const terrace = terracesRef.current.find(t => t.id === id)
        if (!terrace || !dot) return
        const sunny = getShadowStatus(terrace, timeRef.current)
        dot.style.background = markerColor(sunny)
        dot.style.boxShadow = sunny
          ? '0 0 0 3px rgba(212,80,10,0.2), 3px 3px 0px rgba(139,58,7,0.4)'
          : '0 2px 6px rgba(0,0,0,0.3)'
      })
    }

    if (after !== before) { applyCanvasData(); return }

    const startTime = Date.now()
    const poll = () => {
      const elapsed = Date.now() - startTime
      if (getChecksum() !== before || elapsed >= 3000) {
        applyCanvasData()
      } else {
        shadowReadTimerRef.current = setTimeout(poll, 100)
      }
    }
    shadowReadTimerRef.current = setTimeout(poll, 100)

    return () => {
      if (shadowReadTimerRef.current) { clearTimeout(shadowReadTimerRef.current); shadowReadTimerRef.current = null }
    }
  }, [time])

  const loadTerraces = useCallback(async (lat, lng, radius = 1000) => {
    setLoading(true)
    const data = await fetchNearbyTerraces(lat, lng, radius, GOOGLE_PLACES_KEY)
    setTerraces(data)
    setLoading(false)
    return data
  }, [])

  // ── Geocoded search autocomplete ──────────────────────────────────────────
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      const results = await searchPlaces(searchQuery, GOOGLE_PLACES_KEY)
      setSearchResults(results)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // ── Geocoding quartier Planifier ──────────────────────────────────────────
  useEffect(() => {
    const skip = !planifQuartier || planifQuartier.length < 2
      || QUARTIERS[planifQuartier] || planifQuartier === 'Autour de moi'
    if (skip) { setPlanifGeoResults([]); return }
    const timer = setTimeout(async () => {
      const results = await searchPlaces(planifQuartier, GOOGLE_PLACES_KEY)
      setPlanifGeoResults(results.slice(0, 4))
    }, 300)
    return () => clearTimeout(timer)
  }, [planifQuartier])

  const VENUE_TYPES = ['bar', 'pub', 'cafe', 'coffee_shop', 'restaurant', 'bakery', 'food', 'meal']

  const handleSuggestionClick = async (place) => {
    const lat = place.location?.latitude
    const lng = place.location?.longitude
    if (!lat || !lng) return

    setSearchQuery(place.displayName?.text || '')
    setSearchResults([])
    setSearchFocused(false)

    flyingRef.current = true
    map.current.flyTo([lat, lng], 16, { duration: 0.8 })
    map.current.once('moveend', () => { flyingRef.current = false })

    const data = await loadTerraces(lat, lng, 500)

    const isVenue = place.types?.some(t => VENUE_TYPES.some(v => t.includes(v)))
    if (isVenue && data) {
      const found = data.find(t => t.id === place.id)
      if (found) setSelectedTerrace(found)
    }
  }

  const getShadowStatus = useCallback((terrace, currentTime) => {
    const { altitude } = getSunPosition(currentTime, terrace.lat, terrace.lng)
    if (altitude <= 5) return false

    const cached = shadowCacheRef.current[terrace.id]
    if (cached !== undefined) return cached

    return altitude > 30
  }, [])

  const readShadowPixels = useCallback(() => {
    if (!map.current || !mapContainer.current) return
    const canvas = mapContainer.current.querySelectorAll('canvas')[0]
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const countOpaque = (x, y) => {
      let count = 0
      for (let dx = -10; dx <= 10; dx++) {
        for (let dy = -10; dy <= 10; dy++) {
          const px = x + dx; const py = y + dy
          if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue
          if (ctx.getImageData(px, py, 1, 1).data[3] > 30) count++
        }
      }
      return count
    }

    const needsBaseline = terracesRef.current.some(t => baselineCacheRef.current[t.id] === undefined)
    if (needsBaseline && osmbRef.current) {
      const noon = new Date(timeRef.current)
      noon.setHours(12, 0, 0, 0)
      osmbRef.current.date(noon)
      terracesRef.current.forEach(terrace => {
        const pt = map.current.latLngToContainerPoint([terrace.lat, terrace.lng])
        const x = Math.round(pt.x); const y = Math.round(pt.y)
        if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return
        baselineCacheRef.current[terrace.id] = countOpaque(x, y)
      })
      osmbRef.current.date(timeRef.current)
    }

    const newCache = {}
    terracesRef.current.forEach(terrace => {
      const pt = map.current.latLngToContainerPoint([terrace.lat, terrace.lng])
      const x = Math.round(pt.x); const y = Math.round(pt.y)
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return
      const opaqueCount = countOpaque(x, y)
      const baseline = baselineCacheRef.current[terrace.id] ?? 0
      newCache[terrace.id] = (opaqueCount - baseline) < 8
    })

    const totalRead = Object.keys(newCache).length
    if (totalRead > 0) {
      shadowCacheRef.current = newCache
      setShadowVersion(v => v + 1)
    }
  }, [])

  const buildShadowSchedule = useCallback(() => {
    if (!map.current || !mapContainer.current || !osmbRef.current) return
    const canvas = mapContainer.current.querySelectorAll('canvas')[0]
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })

    const countFast = (x, y) => {
      const d = ctx.getImageData(Math.max(0, x - 10), Math.max(0, y - 10), 21, 21).data
      let c = 0
      for (let i = 3; i < d.length; i += 4) if (d[i] > 30) c++
      return c
    }

    const base = new Date(timeRef.current)
    const slots = []
    for (let h = 6; h <= 22; h++) {
      for (const m of [0, 30]) {
        const slot = new Date(base)
        slot.setHours(h, m, 0, 0)
        slots.push(slot)
      }
    }

    const newSchedule = {}
    slots.forEach(slot => {
      osmbRef.current.date(slot)
      const key = slot.getHours() * 100 + slot.getMinutes()
      terracesRef.current.forEach(terrace => {
        const pt = map.current.latLngToContainerPoint([terrace.lat, terrace.lng])
        const x = Math.round(pt.x); const y = Math.round(pt.y)
        if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) return
        const opaqueCount = countFast(x, y)
        const baseline = baselineCacheRef.current[terrace.id] ?? 0
        if (!newSchedule[terrace.id]) newSchedule[terrace.id] = {}
        newSchedule[terrace.id][key] = (opaqueCount - baseline) < 8
      })
    })

    osmbRef.current.date(timeRef.current)
    shadowScheduleRef.current = newSchedule
  }, [])

  const scheduleShadowRead = useCallback((delay = 400) => {
    if (shadowReadTimerRef.current) clearTimeout(shadowReadTimerRef.current)
    shadowReadTimerRef.current = setTimeout(() => {
      readShadowPixels()
      buildShadowSchedule()
      Object.entries(markersRef.current).forEach(([id, { dot }]) => {
        const terrace = terracesRef.current.find(t => t.id === id)
        if (!terrace || !dot) return
        const sunny = getShadowStatus(terrace, timeRef.current)
        dot.style.background = markerColor(sunny)
        dot.style.boxShadow = sunny
          ? '0 0 0 3px rgba(212,80,10,0.2), 3px 3px 0px rgba(139,58,7,0.4)'
          : '0 2px 6px rgba(0,0,0,0.3)'
      })
    }, delay)
  }, [readShadowPixels, getShadowStatus, buildShadowSchedule])

  // ── SunnyUntil ────────────────────────────────────────────────────────────
  const computeSunnyUntil = useCallback((terrace, currentTime) => {
    if (!getShadowStatus(terrace, currentTime)) return null

    const schedule = shadowScheduleRef.current[terrace.id]

    const getScheduledStatus = (t, slotTime) => {
      if (schedule) {
        const key = slotTime.getHours() * 100 + slotTime.getMinutes()
        const v = schedule[key]
        if (v !== undefined) return v
      }
      return getShadowStatus(t, slotTime)
    }

    // Aligne le curseur sur le prochain créneau 30 min
    const startCursor = new Date(currentTime)
    const rem = startCursor.getMinutes() % 30
    if (rem !== 0) startCursor.setMinutes(startCursor.getMinutes() + (30 - rem), 0, 0)
    else startCursor.setSeconds(0, 0)

    let cursor = new Date(startCursor)
    let lastSunnyTime = new Date(currentTime)

    const maxTime = new Date(currentTime)
    maxTime.setHours(22, 0, 0, 0)

    while (cursor <= maxTime) {
      const sunny = getScheduledStatus(terrace, cursor)
      if (!sunny) break
      lastSunnyTime = new Date(cursor)
      cursor = new Date(cursor.getTime() + 30 * 60 * 1000)
    }

    const { altitude } = getSunPosition(maxTime, terrace.lat, terrace.lng)
    if (lastSunnyTime >= maxTime && altitude > 5) return 'coucher'

    return lastSunnyTime
  }, [getShadowStatus])

  useEffect(() => {
    if (!selectedTerrace) { setSunnyUntil(null); return }
    setSunnyUntil(computeSunnyUntil(selectedTerrace, time))
  }, [selectedTerrace, time, shadowVersion, computeSunnyUntil])

  // ── Markers ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapReady || !map.current) return

    terracesRef.current = terraces

    Object.values(markersRef.current).forEach(m => m.marker.remove())
    markersRef.current = {}

    const toDisplay = planifActif
      ? planifResultats.filter(t => t.lat && t.lng)
      : terraces.filter(t => {
          if (!t.lat || !t.lng) return false
          if (filter.minRating > 0 && (!t.rating || t.rating < filter.minRating)) return false
          if (filter.type !== 'all') {
            const filterType = filter.type.toLowerCase()
            const typeMap = {
              'bar': ['bar', 'pub', 'night_club'],
              'cafe': ['cafe', 'coffee_shop'],
              'restaurant': ['restaurant', 'food'],
            }
            const typesToCheck = typeMap[filterType] || [filterType]
            const typeMatch =
              typesToCheck.some(t2 => t.type?.toLowerCase().includes(t2)) ||
              t.types?.some(type => typesToCheck.some(t2 => type.toLowerCase().includes(t2)))
            if (!typeMatch) return false
          }
          if (filter.onlyOpen && t.isOpen === false) return false
          if (filter.onlySunny && !getShadowStatus(t, timeRef.current)) return false
          return true
        })

    toDisplay.forEach(terrace => {
      if (terrace.hasOutdoorSeating === false) return

      const sunny = planifActif ? true : getShadowStatus(terrace, timeRef.current)
      const color = markerColor(sunny)
      const isUnconfirmed = terrace.hasOutdoorSeating === null
      const dotBorder = isUnconfirmed
        ? '2.5px dashed #F5E6C8'
        : (sunny ? '3px solid #F5E6C8' : '3px solid white')
      const dotOpacity = isUnconfirmed ? '0.75' : '1'
      const sz = '22px'
      const shadowVal = sunny
        ? '0 0 0 3px rgba(212,80,10,0.2), 3px 3px 0px rgba(139,58,7,0.4)'
        : '0 2px 6px rgba(0,0,0,0.3)'

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:28px;height:28px;">
          <div class="mk-ring" style="position:absolute;top:50%;left:50%;width:28px;height:28px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid transparent;opacity:0;transition:all 0.2s ease;pointer-events:none;box-sizing:border-box;"></div>
          <div class="mk-dot" style="position:absolute;top:50%;left:50%;width:${sz};height:${sz};border-radius:50%;transform:translate(-50%,-50%);border:${dotBorder};cursor:pointer;background:${color};box-shadow:${shadowVal};opacity:${dotOpacity};transition:width 0.2s ease,height 0.2s ease,background 0.2s ease,box-shadow 0.2s ease;box-sizing:border-box;"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })

      const marker = L.marker([terrace.lat, terrace.lng], { icon })
        .addTo(map.current)
        .on('click', () => {
          const t = terracesRef.current.find(x => x.id === terrace.id)
          if (t) setSelectedTerrace(t)
        })

      const el = marker.getElement()
      if (el) {
        const inner = el.firstElementChild
        if (inner) {
          inner.style.opacity = '0'
          inner.style.transform = 'scale(0.5)'
          requestAnimationFrame(() => {
            inner.style.transition = 'opacity 0.25s ease, transform 0.25s ease'
            inner.style.opacity = '1'
            inner.style.transform = 'scale(1)'
          })
        }
      }
      const dot = el?.querySelector('.mk-dot')
      const ring = el?.querySelector('.mk-ring')
      markersRef.current[terrace.id] = { marker, dot, ring }
    })
  }, [mapReady, terraces, filter, shadowVersion, planifActif, planifResultats, isMobile])

  // ── Dot color update on time change ──────────────────────────────────────
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { dot }]) => {
      const t = terracesRef.current.find(x => x.id === id)
      if (!t) return
      const sunny = getShadowStatus(t, time)
      dot.style.background = markerColor(sunny)
      dot.style.boxShadow = sunny
        ? '0 0 0 3px rgba(212,80,10,0.2), 3px 3px 0px rgba(139,58,7,0.4)'
        : '0 1px 4px rgba(0,0,0,0.15)'
    })
  }, [time])

  // ── Selected marker style ─────────────────────────────────────────────────
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { dot, ring }]) => {
      const isSelected = selectedTerrace?.id === id
      const t = terracesRef.current.find(x => x.id === id)
      if (!t) return
      const color = markerColor(getShadowStatus(t, time))
      ring.style.borderColor = isSelected ? color : 'transparent'
      ring.style.opacity = isSelected ? '1' : '0'
      dot.style.width = isSelected ? '27px' : '22px'
      dot.style.height = isSelected ? '27px' : '22px'
    })
  }, [selectedTerrace, time])

  // ── Fly to selected ────────────────────────────────────────────────────────
  useEffect(() => {
    if (selectedTerrace && map.current) {
      flyingRef.current = true
      map.current.flyTo(
        [selectedTerrace.lat, selectedTerrace.lng],
        Math.max(map.current.getZoom(), 17),
        { duration: 0.8 }
      )
      map.current.once('moveend', () => { flyingRef.current = false })
    }
  }, [selectedTerrace])

  useEffect(() => {
    setSheetExpanded(false)
  }, [selectedTerrace])

  const handleTimeChange = (e) => {
    const total = parseInt(e.target.value)
    const d = new Date(time)
    d.setHours(Math.floor(total / 60), total % 60, 0, 0)
    setTime(d)
  }

  const handleSliderDragStart = () => {
    isDraggingRef.current = true
  }

  const handleSliderDragEnd = () => {
    isDraggingRef.current = false
    // Fire le vrai update OSM + lecture canvas maintenant que le slider est relâché
    shadowRendererRef.current?.update(timeRef.current)
    scheduleShadowRead(300)
  }

  const pillsConfig = [
    { label: 'Ouvert', active: filter.onlyOpen, onClick: () => setFilter(f => ({ ...f, onlyOpen: !f.onlyOpen })) },
    { label: '4+ étoiles', active: filter.minRating >= 4, onClick: () => setFilter(f => ({ ...f, minRating: f.minRating >= 4 ? 0 : 4 })), icon: <IconStar size={10} color={filter.minRating >= 4 ? '#F5E6C8' : '#D4500A'} /> },
    { label: 'Bar', active: filter.type === 'bar', onClick: () => setFilter(f => ({ ...f, type: f.type === 'bar' ? 'all' : 'bar' })) },
    { label: 'Café', active: filter.type === 'café', onClick: () => setFilter(f => ({ ...f, type: f.type === 'café' ? 'all' : 'café' })) },
  ]

  const selectedSunny = selectedTerrace ? getShadowStatus(selectedTerrace, time) : false
  const photoUrl = selectedTerrace?.photoRef
    ? `https://places.googleapis.com/v1/${selectedTerrace.photoRef}/media?maxHeightPx=300&maxWidthPx=600&key=${GOOGLE_PLACES_KEY}`
    : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', fontFamily: "'Space Grotesk', -apple-system, sans-serif", touchAction: 'pan-x pan-y' }}>

      {/* Map */}
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, zIndex: 0, isolation: 'isolate', touchAction: 'auto' }} />

      {/* Search bar + quick filter pills */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        zIndex: 1100, width: '100%',
      }}>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column' }}>

          {isMobile ? (
            /* ── Mobile : empilé (topbar + searchbar + pills) ── */
            <>
              <div className="topbar" style={{
                background: '#D4500A', padding: '8px 16px',
                display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 8, position: 'relative', overflow: 'hidden',
              }}>
                <div style={{ position: 'relative', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', border: '2px solid #F5E6C8' }} />
                  <div style={{ position: 'absolute', width: 17, height: 17, borderRadius: '50%', border: '1.5px solid #F5E6C8', opacity: 0.85 }} />
                  <div style={{ position: 'absolute', width: 7, height: 7, borderRadius: '50%', background: '#F5E6C8', boxShadow: '0 0 6px rgba(245,230,200,0.6)' }} />
                </div>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#F5E6C8', letterSpacing: 4, lineHeight: 1, textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>HELIO</span>
              </div>

              <div style={{ background: '#241208', borderBottom: '2px solid #3D1F0A', padding: '8px 12px', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: '#1C0F06', borderRadius: 4, padding: '6px 10px', border: '1.5px solid #3D1F0A', minWidth: 0 }}>
                    <IconSearch size={13} color="#7A5A42" />
                    <input type="text" placeholder="Rechercher..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#C4A882', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", minWidth: 0 }} />
                    {loading && <span style={{ color: '#D4500A', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>…</span>}
                  </div>
                  <button onClick={() => setFilterPanelOpen(true)} style={{ ...btnBase, background: 'transparent', border: '1.5px solid #5C2E12', borderRadius: 4, padding: '5px 8px', gap: 4, flexShrink: 0, color: '#C4A882', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1 }}>
                    <IconSliders size={13} color="#C4A882" />
                  </button>
                  <button onClick={() => setShowPlanifier(v => !v)} style={{ ...btnBase, background: '#D4500A', border: 'none', borderRadius: 4, padding: '5px 8px', gap: 4, flexShrink: 0, color: '#F5E6C8', fontFamily: "'Bebas Neue', sans-serif", fontSize: 11, letterSpacing: 1, boxShadow: '2px 2px 0px #8B3A07' }}>
                    <IconClock size={13} color="#F5E6C8" />
                  </button>
                </div>
                {searchFocused && searchResults.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#241208', borderRadius: 4, border: '1.5px solid #3D1F0A', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 1200 }}>
                    {searchResults.map((place, i) => (
                      <button key={place.id || i} onMouseDown={() => handleSuggestionClick(place)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: i > 0 ? '1px solid #3D1F0A' : 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#1C0F06' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#C4A882' }}>{place.displayName?.text}</span>
                        {place.formattedAddress && <span style={{ fontSize: 11, color: '#7A5A42', marginTop: 2 }}>{place.formattedAddress}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="pills-scroll" style={{ background: '#1C0F06', borderBottom: '2px solid #3D1F0A', padding: '5px 12px 7px', display: 'flex', flexWrap: 'nowrap', gap: 6, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
                {pillsConfig.map(({ key, label, active, onClick, icon }) => (
                  <button key={key ?? label} onClick={onClick} style={{ ...btnBase, gap: 4, background: active ? '#D4500A' : 'transparent', border: active ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A', borderRadius: 4, padding: '4px 10px', whiteSpace: 'nowrap', color: active ? '#F5E6C8' : '#7A5A42', fontSize: 10, fontWeight: active ? 600 : 400, textTransform: 'uppercase', letterSpacing: '1px' }}>{icon}{label}</button>
                ))}
                <button onClick={() => setFilter(f => ({ ...f, onlySunny: !f.onlySunny }))} style={{ ...btnBase, gap: 4, background: filter.onlySunny ? '#D4500A' : 'rgba(212,80,10,0.12)', border: filter.onlySunny ? '1.5px solid #D4500A' : '1.5px solid rgba(212,80,10,0.4)', borderRadius: 4, padding: '4px 10px', whiteSpace: 'nowrap', color: filter.onlySunny ? '#F5E6C8' : '#C4703A', fontSize: 10, fontWeight: filter.onlySunny ? 600 : 400, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <SunStatusIcon score={sunInfo?.score ?? 70} size={12} />Au soleil
                </button>
              </div>
            </>
          ) : (
            /* ── Desktop : ligne unique 44px ── */
            <>
              <div className="topbar" style={{ background: '#D4500A', padding: '6px 20px', display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, position: 'relative' }}>
                {/* Logo gauche */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ position: 'relative', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', width: 19, height: 19, borderRadius: '50%', border: '1.5px solid #F5E6C8' }} />
                    <div style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1px solid #F5E6C8', opacity: 0.85 }} />
                    <div style={{ position: 'absolute', width: 5, height: 5, borderRadius: '50%', background: '#F5E6C8' }} />
                  </div>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#F5E6C8', letterSpacing: 4, lineHeight: 1, textShadow: '2px 2px 0px rgba(0,0,0,0.2)' }}>HELIO</span>
                </div>
                {/* Recherche centre */}
                <div style={{ flex: 1, margin: '0 16px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1C0F06', borderRadius: 4, padding: '5px 10px', border: '1.5px solid #3D1F0A' }}>
                    <IconSearch size={13} color="#7A5A42" />
                    <input type="text" placeholder="Rechercher un lieu ou une terrasse..." value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onFocus={() => setSearchFocused(true)}
                      onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                      style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', color: '#C4A882', fontSize: 12, fontFamily: "'Space Grotesk', sans-serif", minWidth: 0 }} />
                    {loading && <span style={{ color: '#D4500A', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>…</span>}
                  </div>
                  {searchFocused && searchResults.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#241208', borderRadius: 4, border: '1.5px solid #3D1F0A', boxShadow: '0 4px 20px rgba(0,0,0,0.4)', overflow: 'hidden', zIndex: 1200 }}>
                      {searchResults.map((place, i) => (
                        <button key={place.id || i} onMouseDown={() => handleSuggestionClick(place)}
                          style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', padding: '10px 14px', background: 'transparent', border: 'none', borderTop: i > 0 ? '1px solid #3D1F0A' : 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#1C0F06' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#C4A882' }}>{place.displayName?.text}</span>
                          {place.formattedAddress && <span style={{ fontSize: 11, color: '#7A5A42', marginTop: 2 }}>{place.formattedAddress}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Boutons droite */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setFilterPanelOpen(true)} style={{ ...btnBase, background: 'rgba(0,0,0,0.2)', border: '1.5px solid rgba(245,230,200,0.3)', borderRadius: 4, padding: '8px 16px', gap: 6, color: '#F5E6C8', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 2 }}>
                    <IconSliders size={13} color="#F5E6C8" />FILTRES
                  </button>
                  <button onClick={() => setShowPlanifier(v => !v)} style={{ ...btnBase, background: 'rgba(0,0,0,0.3)', border: '1.5px solid #F5E6C8', borderRadius: 4, padding: '8px 16px', gap: 6, color: '#F5E6C8', fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: 2 }}>
                    <IconClock size={13} color="#F5E6C8" />PLANIFIER
                  </button>
                </div>
              </div>
              {/* Pills desktop */}
              <div className="pills-scroll" style={{ background: '#1C0F06', borderBottom: '2px solid #3D1F0A', padding: '4px 12px 5px', display: 'flex', flexWrap: 'nowrap', gap: 6, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {pillsConfig.map(({ key, label, active, onClick, icon }) => (
                  <button key={key ?? label} onClick={onClick} style={{ ...btnBase, gap: 4, background: active ? '#D4500A' : 'transparent', border: active ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A', borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', color: active ? '#F5E6C8' : '#7A5A42', fontSize: 10, fontWeight: active ? 600 : 400, textTransform: 'uppercase', letterSpacing: '1px' }}>{icon}{label}</button>
                ))}
                <button onClick={() => setFilter(f => ({ ...f, onlySunny: !f.onlySunny }))} style={{ ...btnBase, gap: 4, background: filter.onlySunny ? '#D4500A' : 'rgba(212,80,10,0.12)', border: filter.onlySunny ? '1.5px solid #D4500A' : '1.5px solid rgba(212,80,10,0.4)', borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', color: filter.onlySunny ? '#F5E6C8' : '#C4703A', fontSize: 10, fontWeight: filter.onlySunny ? 600 : 400, textTransform: 'uppercase', letterSpacing: '1px' }}>
                  <SunStatusIcon score={sunInfo?.score ?? 70} size={12} />Au soleil
                </button>
              </div>
            </>
          )}

          {/* Bandeau mode planifier actif */}
          {planifActif && (
            <div style={{
              background: '#241208', border: '1.5px solid #3D1F0A', borderRadius: 4,
              margin: '6px 10px 6px', padding: '7px 12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconClock size={13} color="#D4500A" />
                <span style={{ fontSize: 12, color: '#F4A460', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1 }}>
                  {planifQuartier || 'Paris'} · {planifExposition === 'soleil' ? 'Au soleil' : "À l'ombre"} · {planifDebut} → {planifFin}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#7A5A42', whiteSpace: 'nowrap' }}>
                {planifResultats.length} terrasse{planifResultats.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bouton "Rechercher dans cette zone" — sous la topbar */}
      <div style={{
        position: 'absolute', top: 155, left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1100,
        display: showSearchHere ? 'flex' : 'none',
      }}>
        <button
          onClick={() => {
            const c = map.current.getCenter()
            loadTerraces(c.lat, c.lng, 800)
            setShowSearchHere(false)
          }}
          style={{
            background: '#1C0F06', border: '2px solid #D4500A', borderRadius: 4,
            padding: '5px 12px', fontSize: 10,
            color: '#F5E6C8', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 1,
            cursor: 'pointer', boxShadow: '2px 2px 0px #D4500A',
            display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
          }}
        >
          ↻ RECHERCHER ICI
        </button>
      </div>

      {/* Sun widget */}
      {sunInfo && (
        <div style={{
          background: '#1C0F06',
          border: '1.5px solid #3D1F0A',
          borderRadius: 4,
          boxShadow: '3px 3px 0px #D4500A',
          position: 'absolute', top: 145, left: 12, zIndex: 1100,
          padding: isMobile ? '5px 8px' : '8px 12px',
          minWidth: isMobile ? 'auto' : 150,
        }}>
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <SunStatusIcon score={sunInfo.score} size={14} />
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#F4A460', letterSpacing: 2 }}>{sunInfo.label}</div>
            </div>
          ) : (
            <>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 8, color: '#7A5A42', marginBottom: 5, letterSpacing: 2, textTransform: 'uppercase' }}>Soleil maintenant</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <SunStatusIcon score={sunInfo.score} size={16} />
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: '#F4A460', letterSpacing: 2 }}>{sunInfo.label}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #3D1F0A', paddingTop: 6 }}>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, color: '#C4A882', letterSpacing: 1 }}>Lever {formatTime(sunInfo.sunrise)}</span>
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 9, color: '#C4A882', letterSpacing: 1 }}>Coucher {formatTime(sunInfo.sunset)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter panel overlay */}
      <div
        onClick={() => setFilterPanelOpen(false)}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 1125, opacity: filterPanelOpen ? 1 : 0,
          pointerEvents: filterPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Filter panel */}
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#1C0F06', zIndex: 1300,
        borderRadius: '4px 4px 0 0',
        borderTop: '2px solid #3D1F0A',
        maxHeight: '80vh', overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: filterPanelOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
      } : {
        position: 'absolute', top: 0, bottom: 0, right: 0,
        width: 300, background: '#1C0F06', zIndex: 1130,
        borderLeft: '2px solid #3D1F0A',
        transform: filterPanelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.5)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, color: '#F5E6C8', letterSpacing: 3 }}>Filtres</span>
            <button
              onClick={() => setFilterPanelOpen(false)}
              style={{ ...btnBase, background: '#241208', border: '1.5px solid #3D1F0A', borderRadius: 4, width: 32, height: 32 }}
            >
              <IconX size={16} color="#C4A882" />
            </button>
          </div>

          {/* Rating */}
          <div>
            <div style={{ fontSize: 11, color: '#7A5A42', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Note minimum</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 3.5, 4, 4.5].map(r => (
                <button key={r} onClick={() => setFilter(f => ({ ...f, minRating: r }))} style={{
                  ...btnBase,
                  background: filter.minRating === r ? '#D4500A' : '#241208',
                  border: filter.minRating === r ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A',
                  borderRadius: 4, padding: '6px 10px',
                  color: filter.minRating === r ? '#F5E6C8' : '#7A5A42',
                  fontSize: 12, fontWeight: 600,
                  boxShadow: filter.minRating === r ? '2px 2px 0px #8B3A07' : 'none',
                }}>
                  {r === 0 ? 'Tous' : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <div style={{ fontSize: 11, color: '#7A5A42', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['all', 'café', 'bar', 'restaurant'].map(t => (
                <button key={t} onClick={() => setFilter(f => ({ ...f, type: t }))} style={{
                  ...btnBase,
                  background: filter.type === t ? '#D4500A' : '#241208',
                  border: filter.type === t ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A',
                  borderRadius: 4, padding: '6px 12px',
                  color: filter.type === t ? '#F5E6C8' : '#7A5A42',
                  fontSize: 12, fontWeight: 600,
                  boxShadow: filter.type === t ? '2px 2px 0px #8B3A07' : 'none',
                }}>
                  {t === 'all' ? 'Tous' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Open now */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={filter.onlyOpen}
              onChange={e => setFilter(f => ({ ...f, onlyOpen: e.target.checked }))}
              style={{ accentColor: '#D4500A', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: '#C4A882', fontWeight: 500 }}>Ouvert maintenant</span>
          </label>

          {/* Reset */}
          <button
            onClick={() => { setFilter({ minRating: 0, type: 'all', onlyOpen: false, onlySunny: false }); setFilterPanelOpen(false) }}
            style={{
              ...btnBase, border: '1.5px solid #3D1F0A', borderRadius: 4, padding: '10px',
              background: 'transparent', color: '#7A5A42', fontSize: 13, fontWeight: 500, marginTop: 4,
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Floating time slider */}
      <div style={{
        ...panel,
        position: 'absolute',
        bottom: isMobile ? 20 : 30,
        left: '50%', transform: 'translateX(-50%)',
        zIndex: 1100,
        width: isMobile ? 'calc(100vw - 24px)' : 480,
        maxWidth: 480,
        borderRadius: 16,
        padding: '13px 18px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
        opacity: (selectedTerrace || planifActif) ? 0 : 1,
        pointerEvents: (selectedTerrace || planifActif) ? 'none' : 'auto',
        transition: 'opacity 0.25s ease',
      }}>
        <TimeSlider time={time} timeSlots={timeSlots} onChange={handleTimeChange} onDragStart={handleSliderDragStart} onDragEnd={handleSliderDragEnd} />
      </div>

      {/* Bottom sheet — terrace detail */}
      <div
        onTouchStart={e => { sheetTouchStartY.current = e.touches[0].clientY }}
        onTouchEnd={e => {
          if (sheetTouchStartY.current !== null) {
            const delta = sheetTouchStartY.current - e.changedTouches[0].clientY
            if (delta > 40) setSheetExpanded(true)
            if (delta < -40) setSheetExpanded(false)
            sheetTouchStartY.current = null
          }
        }}
        style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: `translateX(-50%) translateY(${selectedTerrace ? '0%' : '110%'})`,
          background: '#F5E6C8', borderRadius: '20px 20px 0 0',
          borderTop: '3px solid #D4500A',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          width: '100%', maxWidth: 480, zIndex: 1120,
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: isMobile ? '60vh' : 'none',
          overflowY: isMobile ? 'auto' : 'visible',
        }}
      >
        {selectedTerrace && (
          <>
            {/* Collapsed header */}
            <div style={{
              padding: '10px 20px 14px',
              paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14,
              position: isMobile ? 'sticky' : 'static', top: 0,
              background: '#F5E6C8', zIndex: 1,
            }}>
              {/* Drag bar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div
                  onClick={() => setSheetExpanded(v => !v)}
                  style={{ width: 36, height: 4, borderRadius: 2, background: '#C4A060', cursor: 'pointer' }}
                />
              </div>
              {/* Nom + chevron + croix */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2
                  onClick={() => setSheetExpanded(v => !v)}
                  style={{ margin: 0, fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: '#1C0F06', flex: 1, paddingRight: 8, lineHeight: 1.1, cursor: 'pointer', letterSpacing: 3 }}
                >
                  {selectedTerrace.name}
                </h2>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#A89060"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  onClick={() => setSheetExpanded(v => !v)}
                  style={{ cursor: 'pointer', flexShrink: 0, marginRight: 8 }}
                >
                  {sheetExpanded
                    ? <polyline points="6 9 12 15 18 9" />
                    : <polyline points="18 15 12 9 6 15" />
                  }
                </svg>
                <button
                  onClick={() => { setSelectedTerrace(null); setSheetExpanded(false) }}
                  style={{ border: '1.5px solid #3D1F0A', background: '#1C0F06', borderRadius: 4, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <IconX size={14} color="#C4A882" />
                </button>
              </div>
              {/* Badge soleil/ombre */}
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 4, fontSize: 13,
                  background: selectedSunny ? '#1C0F06' : '#3D2415',
                  boxShadow: selectedSunny ? '3px 3px 0px #D4500A' : 'none',
                }}>
                  {selectedSunny
                    ? <IconSun size={16} color="#F4A460" />
                    : <IconCloud size={16} color="#A89060" />
                  }
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, color: selectedSunny ? '#F4A460' : '#C4A882', letterSpacing: 1 }}>
                    {sunnyUntil === null && "À l'ombre actuellement"}
                    {sunnyUntil === 'coucher' && "Ensoleillé jusqu'au coucher"}
                    {sunnyUntil instanceof Date && (
                      `Ensoleillé jusqu'à ${sunnyUntil.getHours().toString().padStart(2, '0')}h${sunnyUntil.getMinutes().toString().padStart(2, '0')}`
                    )}
                  </span>
                </div>
              </div>
              {/* Confirmation terrasse communautaire */}
              {selectedTerrace && (() => {
                const confirmation = terraceConfirmations[selectedTerrace.id]
                const hasOutdoor = selectedTerrace.hasOutdoorSeating

                if (confirmation === 'confirmed') {
                  return (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#D4500A', fontWeight: 500 }}>
                      ✓ Terrasse confirmée par la communauté
                    </div>
                  )
                }

                if (confirmation === 'denied' || hasOutdoor === false) return null

                if (hasOutdoor === null && !confirmation) {
                  return (
                    <div style={{
                      marginTop: 10,
                      background: '#EDD9A8', border: '1.5px solid #C4A060',
                      borderRadius: 4, padding: '12px 14px',
                    }}>
                      <p style={{ fontSize: 11, color: '#6B4A2A', margin: '0 0 10px', lineHeight: 1.5 }}>
                        Nous ne pouvons pas garantir que cet établissement dispose d'une terrasse. Le savez-vous ?
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => {
                            const updated = { ...terraceConfirmations, [selectedTerrace.id]: 'confirmed' }
                            setTerraceConfirmations(updated)
                            localStorage.setItem('helio_terrace_confirmations', JSON.stringify(updated))
                          }}
                          style={{
                            flex: 1, background: '#D4500A', border: 'none',
                            borderRadius: 4, padding: '8px 0', fontSize: 14,
                            color: '#F5E6C8', cursor: 'pointer',
                            fontFamily: "'Bebas Neue', sans-serif", letterSpacing: 2,
                            boxShadow: '2px 2px 0px #8B3A07',
                          }}
                        >
                          Oui, il y en a une
                        </button>
                        <button
                          onClick={() => {
                            const updated = { ...terraceConfirmations, [selectedTerrace.id]: 'denied' }
                            setTerraceConfirmations(updated)
                            localStorage.setItem('helio_terrace_confirmations', JSON.stringify(updated))
                            setSelectedTerrace(null)
                          }}
                          style={{
                            flex: 1, background: 'transparent', border: '1.5px solid #C4A060',
                            borderRadius: 4, padding: '8px 0', fontSize: 12,
                            color: '#8B6030', cursor: 'pointer',
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          Non, pas de terrasse
                        </button>
                      </div>
                    </div>
                  )
                }

                return null
              })()}
              {/* Slider */}
              <div style={{ borderTop: '2px solid #C4A060', paddingTop: 12, marginTop: 8 }}>
                <div style={{ background: '#1C0F06', borderRadius: 4, padding: '10px 12px', border: '1.5px solid #3D1F0A' }}>
                  <TimeSlider time={time} timeSlots={timeSlots} onChange={handleTimeChange} onDragStart={handleSliderDragStart} onDragEnd={handleSliderDragEnd} />
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {sheetExpanded && (
              <div style={{ padding: '0 20px 32px' }}>
                {/* Photo */}
                {photoUrl && (
                  <img
                    src={photoUrl}
                    alt={selectedTerrace.name}
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 14, display: 'block', border: '2px solid #C4A060' }}
                  />
                )}

                {/* Note · avis · badge ouvert */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <StarRating rating={selectedTerrace.rating} />
                    {selectedTerrace.reviewCount > 0 && (
                      <span style={{ fontSize: 12, color: '#8B6030' }}>
                        · {selectedTerrace.reviewCount.toLocaleString('fr-FR')} avis
                      </span>
                    )}
                    {selectedTerrace.isOpen !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                        background: selectedTerrace.isOpen ? '#DCFCE7' : '#FEE2E2',
                        color: selectedTerrace.isOpen ? '#16A34A' : '#DC2626',
                      }}>
                        {selectedTerrace.isOpen ? 'Ouvert' : 'Fermé'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedTerrace(null) }}
                    style={{ ...btnBase, background: '#1C0F06', border: '1.5px solid #3D1F0A', borderRadius: 4, width: 30, height: 30, flexShrink: 0 }}
                  >
                    <IconX size={16} color="#C4A882" />
                  </button>
                </div>

                {/* Adresse */}
                {selectedTerrace.address && (
                  <div style={{ fontSize: 13, color: '#A07040', marginBottom: 14, borderLeft: '2px solid #D4500A', paddingLeft: 12 }}>
                    {selectedTerrace.address}
                    {selectedTerrace.type && (
                      <span style={{ color: '#C4A060' }}> · {selectedTerrace.type}</span>
                    )}
                  </div>
                )}

                {/* Itinéraire + Partager */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setShowItineraireModal(true)}
                    style={{
                      ...btnBase, flex: 1, background: '#1C0F06', borderRadius: 4,
                      padding: '14px', color: '#F5E6C8', gap: 8, border: 'none',
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3,
                      boxShadow: '4px 4px 0px #D4500A',
                    }}>
                    <IconNavigation size={15} color="#F5E6C8" />
                    Itinéraire
                  </button>
                  <button style={{
                    ...btnBase, width: 50, flexShrink: 0,
                    background: '#EDD9A8', borderRadius: 4, border: '1.5px solid #C4A060',
                  }}>
                    <IconShare size={18} color="#8B6030" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Itinéraire */}
      {showItineraireModal && selectedTerrace && (() => {
        const lat = selectedTerrace.lat
        const lng = selectedTerrace.lng
        const nom = encodeURIComponent(selectedTerrace.name)
        const cityFallback = `https://citymapper.com/trip/import?endcoord=${encodeURIComponent(`${lat},${lng}`)}&endname=${nom}`
        const options = [
          {
            icon: <IconMap size={18} color="#D4500A" />,
            label: 'APPLE PLANS',
            onTap: () => window.open(`maps://maps.apple.com/?daddr=${lat},${lng}&q=${nom}`, '_blank'),
          },
          {
            icon: <IconMapPin size={18} color="#D4500A" />,
            label: 'GOOGLE MAPS',
            onTap: () => window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank'),
          },
          {
            icon: <IconRoute size={18} color="#D4500A" />,
            label: 'CITYMAPPER',
            onTap: () => {
              window.location = `citymapper://directions?endcoord=${lat},${lng}&endname=${nom}`
              setTimeout(() => window.open(cityFallback, '_blank'), 500)
            },
          },
        ]
        return (
          <>
            <div
              onClick={() => setShowItineraireModal(false)}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1300 }}
            />
            <div style={{
              position: 'absolute', bottom: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: '100%', maxWidth: 400,
              zIndex: 1301,
              padding: '0 12px 24px',
            }}>
              <div style={{
                background: '#1C0F06', border: '1.5px solid #3D1F0A',
                borderRadius: 4, boxShadow: '4px 4px 0px #D4500A',
                overflow: 'hidden',
              }}>
                {options.map((opt, i) => (
                  <button
                    key={opt.label}
                    onClick={() => { opt.onTap(); setShowItineraireModal(false) }}
                    style={{
                      ...btnBase, width: '100%', padding: '16px 20px', gap: 14,
                      justifyContent: 'flex-start',
                      background: 'transparent',
                      borderBottom: i < options.length - 1 ? '1px solid #241208' : 'none',
                      border: 'none',
                      borderBottom: i < options.length - 1 ? '1px solid #241208' : 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#241208' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {opt.icon}
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 16, letterSpacing: 2, color: '#F5E6C8',
                    }}>{opt.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowItineraireModal(false)}
                style={{
                  ...btnBase, width: '100%', marginTop: 8,
                  background: '#1C0F06', border: '1.5px solid #3D1F0A',
                  borderRadius: 4, padding: '14px',
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: 16, letterSpacing: 2, color: '#7A5A42',
                }}
              >
                Annuler
              </button>
            </div>
          </>
        )
      })()}

      {/* Panel Planifier */}
      {showPlanifier && (
        <>
          <div
            onClick={() => setShowPlanifier(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1200 }}
          />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#1C0F06', borderRadius: 4, border: '2px solid #3D1F0A',
            boxShadow: '6px 6px 0px #D4500A',
            maxWidth: 360, width: 'calc(100% - 32px)', zIndex: 1201,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: '#241208', borderBottom: '2px solid #3D1F0A' }}>
              <IconClock size={20} color="#D4500A" />
              <span style={{ flex: 1, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: '#F5E6C8', letterSpacing: 2 }}>Planifier ma terrasse</span>
              <button
                onClick={() => setShowPlanifier(false)}
                style={{ ...btnBase, background: '#1C0F06', border: '1.5px solid #3D1F0A', borderRadius: 4, width: 28, height: 28 }}
              >
                <IconX size={14} color="#C4A882" />
              </button>
            </div>

            <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quartier */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 10, color: '#7A5A42', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Quartier</div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #3D1F0A', borderRadius: 4, padding: '8px 12px', background: '#0F0702' }}>
                      <IconMapPin size={15} color="#7A5A42" />
                      <input
                        type="text"
                        placeholder="Ex : Marais, Bastille…"
                        value={planifQuartier}
                        onChange={e => setPlanifQuartier(e.target.value)}
                        style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", color: '#C4A882', background: 'transparent' }}
                      />
                      {planifQuartier.length > 0 && (
                        <button onClick={() => { setPlanifQuartier(''); setPlanifGeoResults([]) }}
                          style={{ ...btnBase, background: 'transparent', border: 'none', padding: 0, width: 16, height: 16 }}>
                          <IconX size={12} color="#5C3A22" />
                        </button>
                      )}
                    </div>
                    {planifGeoResults.length > 0 && (
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 10,
                        background: '#241208', border: '1.5px solid #3D1F0A', borderRadius: 4,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.4)', overflow: 'hidden',
                      }}>
                        {planifGeoResults.map((place, i) => (
                          <button
                            key={place.id || i}
                            onMouseDown={() => {
                              const lat = place.location?.latitude
                              const lng = place.location?.longitude
                              const name = place.displayName?.text || planifQuartier
                              setPlanifQuartier(name)
                              setPlanifGeoResults([])
                              if (lat && lng && map.current) {
                                flyingRef.current = true
                                map.current.flyTo([lat, lng], 16, { duration: 0.8 })
                                map.current.once('moveend', () => { flyingRef.current = false })
                              }
                            }}
                            style={{
                              display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                              width: '100%', padding: '10px 14px', background: 'transparent',
                              border: 'none', borderTop: i > 0 ? '1px solid #3D1F0A' : 'none',
                              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#1C0F06' }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                          >
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#C4A882' }}>{place.displayName?.text}</span>
                            {place.formattedAddress && (
                              <span style={{ fontSize: 11, color: '#5C3A22', marginTop: 2 }}>{place.formattedAddress}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={async () => {
                      if (!navigator.geolocation) return
                      navigator.geolocation.getCurrentPosition(pos => {
                        const { latitude: lat, longitude: lng } = pos.coords
                        map.current.flyTo([lat, lng], 16)
                        setPlanifQuartier('Autour de moi')
                        if (geoMarkerRef.current) geoMarkerRef.current.remove()
                        geoMarkerRef.current = L.marker([lat, lng], {
                          icon: L.divIcon({
                            className: '',
                            html: `<div style="width:14px;height:14px;border-radius:50%;background:#3B82F6;border:3px solid white;box-shadow:0 0 0 3px rgba(59,130,246,0.3);"></div>`,
                            iconSize: [14, 14],
                            iconAnchor: [7, 7],
                          })
                        }).addTo(map.current)
                      })
                    }}
                    style={{
                      background: '#241208', border: '1.5px solid #3D1F0A',
                      borderRadius: 4, padding: '7px 10px', fontSize: 12,
                      color: '#C4A882', cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: isMobile ? '100%' : 'auto', fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <IconNavigation size={13} color="#C4A882" />
                    Autour de moi
                  </button>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.keys(QUARTIERS).map(q => (
                    <button
                      key={q}
                      onClick={() => {
                        setPlanifQuartier(q)
                        if (map.current) {
                          flyingRef.current = true
                          map.current.flyTo(QUARTIERS[q], 16, { duration: 0.8 })
                          map.current.once('moveend', () => { flyingRef.current = false })
                        }
                      }}
                      style={{
                        ...btnBase, fontSize: 11, fontWeight: 500,
                        background: planifQuartier === q ? '#D4500A' : '#241208',
                        color: planifQuartier === q ? '#F5E6C8' : '#C4A882',
                        border: planifQuartier === q ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A',
                        borderRadius: 4, padding: '4px 12px',
                        boxShadow: planifQuartier === q ? '2px 2px 0px #8B3A07' : 'none',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <div style={{ fontSize: 10, color: '#7A5A42', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Type</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Tous', 'Bar', 'Café', 'Restaurant'].map(t => (
                    <button
                      key={t}
                      onClick={() => setPlanifType(t)}
                      style={{
                        ...btnBase, fontSize: 13, fontWeight: planifType === t ? 500 : 400,
                        background: planifType === t ? '#D4500A' : '#241208',
                        color: planifType === t ? '#F5E6C8' : '#7A5A42',
                        border: planifType === t ? '1.5px solid #D4500A' : '1.5px solid #3D1F0A',
                        borderRadius: 4, padding: '4px 12px',
                        boxShadow: planifType === t ? '2px 2px 0px #8B3A07' : 'none',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plage horaire */}
              <div>
                <div style={{ fontSize: 10, color: '#7A5A42', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Plage horaire</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={planifDebut}
                    onChange={e => setPlanifDebut(e.target.value)}
                    style={{ flex: 1, border: '1.5px solid #3D1F0A', borderRadius: 4, padding: '8px 10px', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", color: '#C4A882', background: '#241208', outline: 'none' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ color: '#5C3A22', fontSize: 13 }}>→</span>
                  <select
                    value={planifFin}
                    onChange={e => setPlanifFin(e.target.value)}
                    style={{ flex: 1, border: '1.5px solid #3D1F0A', borderRadius: 4, padding: '8px 10px', fontSize: 14, fontFamily: "'Space Grotesk', sans-serif", color: '#C4A882', background: '#241208', outline: 'none' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Exposition */}
              <div>
                <div style={{ fontSize: 10, color: '#7A5A42', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Exposition</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setPlanifExposition('soleil')}
                    style={{
                      ...btnBase, flex: 2, padding: '10px', gap: 6,
                      borderRadius: 4, fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, letterSpacing: 1,
                      background: planifExposition === 'soleil' ? '#D4500A' : '#241208',
                      border: planifExposition === 'soleil' ? '2px solid #8B3A07' : '1.5px solid #3D1F0A',
                      color: planifExposition === 'soleil' ? '#F5E6C8' : '#7A5A42',
                      boxShadow: planifExposition === 'soleil' ? '2px 2px 0px #8B3A07' : 'none',
                    }}
                  >
                    ☀️ Au soleil
                  </button>
                  <button
                    onClick={() => setPlanifExposition('ombre')}
                    style={{
                      ...btnBase, flex: 1, padding: '10px',
                      borderRadius: 4,
                      background: '#241208',
                      border: '1.5px solid #3D1F0A',
                      color: '#7A5A42',
                      opacity: planifExposition === 'ombre' ? 1 : 0.6,
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    À l'ombre
                  </button>
                </div>
              </div>

              {/* Voir les terrasses */}
              <button
                onClick={async () => {
                  const [debutH, debutM] = planifDebut.split(':').map(Number)
                  const [finH, finM] = planifFin.split(':').map(Number)
                  const debutTotal = debutH * 60 + debutM
                  const finTotal = finH * 60 + finM

                  setShowPlanifier(false)

                  // Résoudre les coords de la zone cible et charger les terrasses
                  let terracesToFilter = terracesRef.current
                  if (planifQuartier && map.current) {
                    let targetCoords = null
                    if (planifQuartier === 'Autour de moi') {
                      const c = map.current.getCenter()
                      targetCoords = [c.lat, c.lng]
                    } else {
                      targetCoords = QUARTIERS[planifQuartier] || null
                      if (!targetCoords) {
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(planifQuartier + ', Paris, France')}&format=json&limit=1`
                          )
                          const geo = await res.json()
                          if (geo[0]) targetCoords = [parseFloat(geo[0].lat), parseFloat(geo[0].lon)]
                        } catch (_) {}
                      }
                    }
                    if (targetCoords) {
                      flyingRef.current = true
                      map.current.flyTo(targetCoords, 16, { duration: 0.8 })
                      map.current.once('moveend', () => { flyingRef.current = false })
                      const fresh = await loadTerraces(targetCoords[0], targetCoords[1], 800)
                      if (fresh?.length) terracesToFilter = fresh
                    }
                  }

                  const slots = []
                  for (let m = debutTotal; m <= finTotal; m += 30) {
                    const d = new Date(time)
                    d.setHours(Math.floor(m / 60), m % 60, 0, 0)
                    slots.push(d)
                  }

                  const isSunnyAtSlot = (terrace, date) => {
                    const key = date.getHours() * 100 + date.getMinutes()
                    const sched = shadowScheduleRef.current[terrace.id]
                    if (sched && sched[key] !== undefined) return sched[key]
                    const { altitude } = getSunPosition(date, terrace.lat, terrace.lng)
                    return altitude > 8
                  }
                  const typeMap = {
                    'Bar': ['bar', 'pub'],
                    'Café': ['cafe', 'coffee_shop'],
                    'Restaurant': ['restaurant'],
                  }
                  const resultats = terracesToFilter.filter(terrace => {
                    if (!terrace.lat || !terrace.lng) return false
                    if (planifType !== 'Tous') {
                      const types = typeMap[planifType] || []
                      const typeMatch =
                        types.some(t2 => terrace.type?.toLowerCase().includes(t2)) ||
                        terrace.types?.some(type => types.some(t2 => type.toLowerCase().includes(t2)))
                      if (!typeMatch) return false
                    }
                    return slots.every(slot => {
                      const sunny = isSunnyAtSlot(terrace, slot)
                      return planifExposition === 'soleil' ? sunny : !sunny
                    })
                  })
                  resultats.sort((a, b) => (b.rating || 0) - (a.rating || 0))

                  const d = new Date(time)
                  d.setHours(debutH, debutM, 0, 0)
                  setTime(d)

                  setPlanifResultats(resultats)
                  setPlanifActif(true)
                }}
                style={{
                  ...btnBase, background: '#D4500A', color: '#F5E6C8',
                  borderRadius: 4, padding: '14px', border: 'none',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 3,
                  width: '100%', boxShadow: '4px 4px 0px #8B3A07',
                }}
              >
                Voir les terrasses
              </button>
            </div>
          </div>
        </>
      )}

      {/* Résultats planifier */}
      {planifActif && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1100,
          background: '#1C0F06', borderRadius: '16px 16px 0 0',
          borderTop: '2px solid #D4500A',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3)',
          height: 180, display: 'flex', flexDirection: 'column',
        }}>
          {/* Drag bar */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#3D1F0A' }} />
          </div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: '#F5E6C8', letterSpacing: 2 }}>Terrasses disponibles</span>
            <button
              onClick={() => {
                setPlanifActif(false)
                setPlanifResultats([])
                setPlanifType('Tous')
                setSelectedTerrace(null)
                setTime(new Date())
              }}
              style={{ ...btnBase, background: '#241208', border: '1.5px solid #3D1F0A', borderRadius: 4, width: 24, height: 24 }}
            >
              <IconX size={12} color="#C4A882" />
            </button>
          </div>
          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {planifResultats.length === 0
              ? <div style={{ fontSize: 13, color: '#7A5A42', padding: '10px 16px' }}>Aucune terrasse ne correspond à ces critères.</div>
              : planifResultats.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTerrace(t)
                    if (map.current) map.current.flyTo([t.lat, t.lng], 17)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    borderBottom: '1px solid #241208', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#241208' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#F5E6C8', letterSpacing: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {t.rating && (
                        <>
                          <IconStar size={11} color="#D4500A" />
                          <span style={{ fontSize: 11, color: '#7A5A42' }}>{t.rating.toFixed(1)}</span>
                          {t.type && <span style={{ fontSize: 11, color: '#7A5A42' }}>· {t.type}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3D1F0A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Intro tooltip */}
      {showIntro && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1149 }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#1C0F06', borderRadius: 4, padding: 24,
            border: '2px solid #3D1F0A', boxShadow: '6px 6px 0px #D4500A',
            maxWidth: 320, width: 'calc(100vw - 48px)', zIndex: 1150,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <IconSun size={32} color="#D4500A" />
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, textAlign: 'center', color: '#F5E6C8', letterSpacing: 3 }}>
              Trouve ta terrasse au soleil
            </span>
            <span style={{ fontSize: 13, color: '#7A5A42', textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {'🟠 Orange = au soleil en ce moment\n⚫ Gris = à l\'ombre\nUtilise le slider pour simuler une autre heure'}
            </span>
            <button
              onClick={() => { localStorage.setItem('helio_intro_seen', '1'); setShowIntro(false) }}
              style={{
                ...btnBase, background: '#D4500A', color: '#F5E6C8', borderRadius: 4,
                padding: '12px 24px', fontFamily: "'Bebas Neue', sans-serif",
                fontSize: 18, letterSpacing: 3, width: '100%', marginTop: 4,
                boxShadow: '4px 4px 0px #8B3A07', border: 'none',
              }}
            >
              C'est parti !
            </button>
          </div>
        </>
      )}

      {/* Bouton géolocalisation — haut droite sous la topbar */}
      <button
        onClick={() => {
          if (!navigator.geolocation) return
          navigator.geolocation.getCurrentPosition(pos => {
            map.current.flyTo(
              [pos.coords.latitude, pos.coords.longitude],
              17,
              { duration: 0.8 }
            )
          })
        }}
        style={{
          position: 'absolute',
          top: isMobile ? 160 : 110,
          right: 12,
          zIndex: 1100,
          width: 36,
          height: 36,
          borderRadius: 4,
          background: '#1C0F06',
          border: '1.5px solid #3D1F0A',
          boxShadow: '2px 2px 0px #D4500A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IconNavigation size={16} color="#F4A460" />
      </button>

    </div>
  )
}
