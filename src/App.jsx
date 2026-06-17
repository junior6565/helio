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

function IconSun({ size = 20, color = '#F59E0B' }) {
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

function IconSearch({ size = 17, color = '#9CA3AF' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function IconX({ size = 17, color = '#6B7280' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function IconNavigation({ size = 15, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  )
}

function IconStar({ size = 13, color = '#F59E0B' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconShare({ size = 16, color = '#374151' }) {
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

function IconSliders({ size = 15, color = '#374151' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round"
      style={{ flexShrink: 0 }}>
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
      <circle cx="9" cy="6" r="2" fill="white" />
      <circle cx="15" cy="12" r="2" fill="white" />
      <circle cx="9" cy="18" r="2" fill="white" />
    </svg>
  )
}

function IconClock({ size = 16, color = '#374151' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

function IconHelp({ size = 14, color = '#9CA3AF' }) {
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

function IconMapPin({ size = 16, color = '#374151' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0 }}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date) {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}


function getSunnyUntil(time, lat, lng) {
  const check = new Date(time)
  for (let i = 0; i < 96; i++) {
    check.setMinutes(check.getMinutes() + 15)
    const { altitude } = getSunPosition(check, lat, lng)
    if (altitude <= 8) {
      const shadowTime = new Date(check.getTime() - 15 * 60000)
      const soon = shadowTime.getTime() - time.getTime() < 30 * 60000
      return { time: shadowTime, soon }
    }
  }
  return null
}

function markerColor(sunny) {
  return sunny ? '#E8A020' : '#94A3B8'
}

function SunStatusIcon({ score }) {
  if (score === 0) return <IconMoon size={22} color="#64748B" />
  const color = score >= 70 ? '#E8A020' : score >= 30 ? '#F07828' : '#F97316'
  return <IconSun size={22} color={color} />
}

function StarRating({ rating }) {
  if (!rating) return <span style={{ color: '#9CA3AF', fontSize: 12 }}>Aucune note</span>
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
      <IconStar size={13} color="#F59E0B" />
      <span style={{ fontWeight: 600, fontSize: 13, color: '#1C1C1E' }}>{rating.toFixed(1)}</span>
    </span>
  )
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const panel = {
  background: '#FFFFFF',
  borderRadius: 12,
  border: '1px solid #E5E7EB',
  boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
}

const btnBase = {
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

// ─── TimeSlider component (reused floating + in bottom sheet) ─────────────────

function TimeSlider({ time, timeSlots, onChange }) {
  const timeValue = time.getHours() * 60 + time.getMinutes()
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>Heure simulée</span>
        <span style={{ fontSize: 20, fontWeight: 700, color: '#1C1C1E', letterSpacing: -0.5 }}>
          {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 1, marginBottom: 8, height: 5, borderRadius: 3, overflow: 'hidden' }}>
        {timeSlots.map((slot, i) => {
          const slotMin = slot.time.getHours() * 60 + slot.time.getMinutes()
          return (
            <div key={i} style={{
              flex: 1, borderRadius: 1, transition: 'background 0.2s',
              background: slotMin <= timeValue
                ? (slot.score > 70 ? '#F59E0B' : slot.score > 40 ? '#FB923C' : '#CBD5E1')
                : '#F3F4F6',
            }} />
          )
        })}
      </div>
      <input type="range" min={480} max={1320} step={30} value={timeValue} onChange={onChange}
        style={{ width: '100%', accentColor: '#F59E0B', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>08:00</span>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>22:00</span>
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

  const [time, setTime] = useState(() => {
    const now = new Date()
    now.setMinutes(Math.round(now.getMinutes() / 30) * 30, 0, 0)
    return now
  })
  const [terraces, setTerraces] = useState([])
  const [selectedTerrace, setSelectedTerrace] = useState(null)
  const [filter, setFilter] = useState({ minRating: 0, type: 'all', onlyOpen: false, onlySunny: false })
  const [filterPanelOpen, setFilterPanelOpen] = useState(false)
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
  const [showPlanifier, setShowPlanifier] = useState(false)
  const [showSearchHere, setShowSearchHere] = useState(false)
  const [planifQuartier, setPlanifQuartier] = useState('')
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
      center: [PARIS.lat, PARIS.lng],
      zoom: 16,
      zoomControl: false,
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

    const osmbStyle = document.createElement('style')
    osmbStyle.textContent = '.osmb { filter: saturate(0) brightness(1.1); }'
    document.head.appendChild(osmbStyle)

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

  // ── Sun position + shadow update ──────────────────────────────────────────
  useEffect(() => {
    const pos = getSunPosition(time, mapCenter.lat, mapCenter.lng)
    const score = getSunScore(time, mapCenter.lat, mapCenter.lng)
    const label = getSunLabel(score)
    const sunTimes = getSunTimes(time, mapCenter.lat, mapCenter.lng)
    setSunInfo({ ...pos, score, ...label, ...sunTimes })
    setTimeSlots(generateTimeSlots(time, mapCenter.lat, mapCenter.lng))
    shadowRendererRef.current?.update(time)
    scheduleShadowRead()
  }, [time, mapCenter])

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
    const canvases = mapContainer.current.querySelectorAll('canvas')
    const canvas = canvases[0]
    if (!canvas || canvas.width === 0) return
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    const newCache = {}
    let ombreCount = 0
    terracesRef.current.forEach(terrace => {
      const pt = map.current.latLngToContainerPoint([terrace.lat, terrace.lng])
      const x = Math.round(pt.x)
      const y = Math.round(pt.y)
      if (x < 0 || y < 0 || x > canvas.width || y > canvas.height) return
      let opaqueCount = 0
      for (let dx = -4; dx <= 4; dx++) {
        for (let dy = -4; dy <= 4; dy++) {
          const px = x + dx
          const py = y + dy
          if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue
          const p = ctx.getImageData(px, py, 1, 1).data
          if (p[3] > 0) opaqueCount++
        }
      }
      const isInShadow = opaqueCount >= 5
      if (isInShadow) ombreCount++
      newCache[terrace.id] = !isInShadow
    })
    if (ombreCount > 0) {
      shadowCacheRef.current = newCache
      setShadowVersion(v => v + 1)
    }
  }, [])

  const scheduleShadowRead = useCallback(() => {
    if (shadowReadTimerRef.current) clearTimeout(shadowReadTimerRef.current)

    let attempts = 0

    const tryRead = () => {
      attempts++
      const canvases = mapContainer.current?.querySelectorAll('canvas')
      const canvas = canvases?.[0]
      if (!canvas) return
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      let pixelCount = 0
      for (let x = 0; x < canvas.width; x += 30) {
        for (let y = 0; y < canvas.height; y += 30) {
          const p = ctx.getImageData(x, y, 1, 1).data
          if (p[3] > 0) pixelCount++
        }
      }
      if (pixelCount > 0 || attempts >= 10) {
        readShadowPixels()
      } else {
        shadowReadTimerRef.current = setTimeout(tryRead, 300)
      }
    }

    shadowReadTimerRef.current = setTimeout(tryRead, 500)
  }, [readShadowPixels])

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
      const dotBorder = isUnconfirmed ? '2px dashed #ffffff' : '2px solid #ffffff'
      const dotOpacity = isUnconfirmed ? '0.75' : '1'
      const sz = isMobile ? '28px' : '20px'

      const icon = L.divIcon({
        className: '',
        html: `<div style="position:relative;width:36px;height:36px;">
          <div class="mk-ring" style="position:absolute;top:50%;left:50%;width:36px;height:36px;border-radius:50%;transform:translate(-50%,-50%);border:2px solid transparent;opacity:0;transition:all 0.2s ease;pointer-events:none;box-sizing:border-box;"></div>
          <div class="mk-dot" style="position:absolute;top:50%;left:50%;width:${sz};height:${sz};border-radius:50%;transform:translate(-50%,-50%);border:${dotBorder};cursor:pointer;background:${color};box-shadow:${sunny ? '0 2px 8px rgba(0,0,0,0.28)' : '0 1px 4px rgba(0,0,0,0.15)'};opacity:${dotOpacity};transition:width 0.2s ease,height 0.2s ease,background 0.2s ease,box-shadow 0.2s ease;box-sizing:border-box;"></div>
        </div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
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

  // ── Dot color update on time change (sans recréer le DOM) ────────────────
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, { dot }]) => {
      const t = terracesRef.current.find(x => x.id === id)
      if (!t) return
      const sunny = getShadowStatus(t, time)
      const color = markerColor(sunny)
      dot.style.background = color
      dot.style.boxShadow = sunny ? '0 2px 8px rgba(0,0,0,0.28)' : '0 1px 4px rgba(0,0,0,0.15)'
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
      dot.style.width = isSelected ? '25px' : '20px'
      dot.style.height = isSelected ? '25px' : '20px'
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
      map.current.once('moveend', () => {
        flyingRef.current = false
      })
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

  const selectedSunny = selectedTerrace ? getShadowStatus(selectedTerrace, time) : false
  const sunnyUntil = (selectedTerrace && selectedSunny)
    ? getSunnyUntil(time, selectedTerrace.lat, selectedTerrace.lng)
    : null
  const photoUrl = selectedTerrace?.photoRef
    ? `https://places.googleapis.com/v1/${selectedTerrace.photoRef}/media?maxHeightPx=300&maxWidthPx=600&key=${GOOGLE_PLACES_KEY}`
    : null


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative', fontFamily: "'Space Grotesk', -apple-system, sans-serif" }}>

      {/* Map — isolation:isolate contient les z-index Leaflet (jusqu'à 800) */}
      <div ref={mapContainer} style={{ position: 'absolute', inset: 0, zIndex: 0, isolation: 'isolate' }} />

      {/* Search bar + quick filter pills */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 'calc(100vw - 24px)', maxWidth: 540, zIndex: 1100,
      }}>
        <div style={{ ...panel, display: 'flex', flexDirection: 'column' }}>
          {/* Bandeau orange helio */}
          <div style={{
            background: '#E8940A',
            padding: isMobile ? '8px 14px' : '10px 14px',
            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
            borderRadius: '14px 14px 0 0',
          }}>
            <div style={{ position: 'relative', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <div style={{ position: 'absolute', width: 16, height: 16, borderRadius: '50%', border: '1.5px solid white' }} />
              <div style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', border: '1.5px solid white' }} />
              <div style={{ position: 'absolute', width: 4, height: 4, borderRadius: '50%', background: 'white' }} />
            </div>
            <span style={{ fontFamily: "'Syne', sans-serif", fontSize: isMobile ? 16 : 17, fontWeight: 700, color: 'white', letterSpacing: '-0.5px' }}>helio</span>
          </div>

          {/* Ligne recherche + boutons */}
          <div style={{ position: 'relative' }}>
            <div style={{ padding: '7px 10px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, background: '#F9F9F9', borderRadius: 20, padding: '7px 14px', border: '0.5px solid #E8D8B0', minWidth: 0 }}>
                <IconSearch size={14} color="#9CA3AF" />
                <input
                  type="text"
                  placeholder={isMobile ? 'Rechercher...' : 'Rechercher un lieu ou une terrasse...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                  style={{
                    flex: 1, border: 'none', outline: 'none', background: 'transparent',
                    color: '#1C1C1E', fontSize: 12, fontFamily: 'inherit', minWidth: 0,
                  }}
                />
                {loading && <span style={{ color: '#F59E0B', fontSize: 11, fontWeight: 500, flexShrink: 0 }}>…</span>}
              </div>
              <button
                onClick={() => setFilterPanelOpen(true)}
                style={{
                  ...btnBase, background: '#F9F9F9', border: '0.5px solid #E5E7EB',
                  borderRadius: 20, padding: isMobile ? '7px 8px' : '7px 10px', gap: 4, flexShrink: 0,
                  color: '#374151', fontSize: 11,
                }}
              >
                <IconSliders size={13} color="#374151" />
                {!isMobile && 'Filtres'}
              </button>
              <button
                onClick={() => setShowPlanifier(v => !v)}
                style={{
                  ...btnBase, background: '#E8940A', border: 'none',
                  borderRadius: 20, padding: isMobile ? '7px 8px' : '7px 10px', gap: 4, flexShrink: 0,
                  color: '#fff', fontSize: 11, fontWeight: 500,
                }}
              >
                <IconClock size={13} color="#fff" />
                {!isMobile && 'Planifier'}
              </button>
            </div>

            {/* Autocomplete dropdown */}
            {searchFocused && searchResults.length > 0 && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                background: '#fff', borderRadius: 12,
                border: '1px solid #E5E7EB', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                overflow: 'hidden', zIndex: 1150,
              }}>
                {searchResults.map((place, i) => (
                  <button
                    key={place.id || i}
                    onMouseDown={() => handleSuggestionClick(place)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      width: '100%', padding: '10px 14px',
                      background: 'transparent', border: 'none',
                      borderTop: i > 0 ? '1px solid #F3F4F6' : 'none',
                      cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1C1C1E' }}>
                      {place.displayName?.text}
                    </span>
                    {place.formattedAddress && (
                      <span style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                        {place.formattedAddress}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Niveau 2 : pills */}
          <div className="pills-scroll" style={{
            borderTop: '0.5px solid #F3F4F6', padding: '6px 12px 8px',
            display: 'flex', flexWrap: 'nowrap', gap: 6, overflowX: 'auto',
            scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch',
            paddingBottom: 2,
          }}>
            {[
              { label: 'Ouvert maintenant', active: filter.onlyOpen, onClick: () => setFilter(f => ({ ...f, onlyOpen: !f.onlyOpen })) },
              { label: '4+ étoiles', active: filter.minRating >= 4, onClick: () => setFilter(f => ({ ...f, minRating: f.minRating >= 4 ? 0 : 4 })), icon: <IconStar size={11} color={filter.minRating >= 4 ? '#8B6914' : '#F59E0B'} /> },
              { label: 'Bar', active: filter.type === 'bar', onClick: () => setFilter(f => ({ ...f, type: f.type === 'bar' ? 'all' : 'bar' })) },
              { label: 'Café', active: filter.type === 'café', onClick: () => setFilter(f => ({ ...f, type: f.type === 'café' ? 'all' : 'café' })) },
              { label: '☀️ Au soleil', active: filter.onlySunny, onClick: () => setFilter(f => ({ ...f, onlySunny: !f.onlySunny })) },
            ].map(({ label, active, onClick, icon }) => (
              <button key={label} onClick={onClick} style={{
                ...btnBase, gap: 4,
                background: active ? '#FFF7E6' : 'transparent',
                border: active ? '1.5px solid #E8940A' : '1.5px solid #E5E7EB',
                borderRadius: 20, padding: '5px 12px', whiteSpace: 'nowrap',
                color: active ? '#8B6914' : '#374151',
                fontSize: 12, fontWeight: active ? 600 : 400,
              }}>
                {icon}{label}
              </button>
            ))}
          </div>

          {/* Bandeau mode planifier */}
          {planifActif && (
            <div style={{
              background: '#FFF7E6', borderRadius: 8, margin: '6px 10px 0',
              padding: '7px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <IconClock size={13} color="#E8940A" />
                <span style={{ fontSize: 12, color: '#8B6914', fontWeight: 500 }}>
                  {planifQuartier || 'Paris'} · {planifExposition === 'soleil' ? 'Au soleil' : "À l'ombre"} · {planifDebut} → {planifFin}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#8B6914', whiteSpace: 'nowrap' }}>
                {planifResultats.length} terrasse{planifResultats.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Bouton flottant "Rechercher dans cette zone" */}
      {showSearchHere && (
        <div style={{
          position: 'absolute',
          top: isMobile ? 140 : 150,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1100,
        }}>
          <button
            onClick={() => {
              const c = map.current.getCenter()
              loadTerraces(c.lat, c.lng, 800)
              setShowSearchHere(false)
            }}
            style={{
              background: 'white', border: '1px solid #E8D8B0', borderRadius: 20,
              padding: '7px 18px', fontSize: 12, color: '#374151',
              fontFamily: "'Space Grotesk', sans-serif", fontWeight: 500,
              cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
              display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
            }}
          >
            <IconSearch size={12} color="#E8940A" />
            Rechercher dans cette zone
          </button>
        </div>
      )}

      {/* Sun widget — top left */}
      {sunInfo && (
        <div style={{
          background: 'rgba(255,251,242,0.92)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 16,
          border: '0.5px solid rgba(232,148,10,0.2)',
          boxShadow: 'none',
          position: 'absolute', top: 114, left: 12, zIndex: 1100,
          padding: isMobile ? '8px 10px' : '10px 14px',
          minWidth: isMobile ? 'auto' : 170,
        }}>
          <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 500 }}>Soleil maintenant</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 0 : 6 }}>
            <SunStatusIcon score={sunInfo.score} />
            <div>
              <div style={{ fontWeight: 600, fontSize: 13, color: sunInfo.color }}>{sunInfo.label}</div>
            </div>
          </div>
          {!isMobile && (
            <>
              <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, fontWeight: 500, marginTop: 6 }}>
                24°C · Dégagé
              </div>
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#9CA3AF', borderTop: '1px solid #F3F4F6', paddingTop: 8 }}>
                <span>Lever {formatTime(sunInfo.sunrise)}</span>
                <span>Coucher {formatTime(sunInfo.sunset)}</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Filter panel overlay */}
      <div
        onClick={() => setFilterPanelOpen(false)}
        style={{
          position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
          zIndex: 1125, opacity: filterPanelOpen ? 1 : 0,
          pointerEvents: filterPanelOpen ? 'auto' : 'none',
          transition: 'opacity 0.25s ease',
        }}
      />

      {/* Filter panel — bottom sheet on mobile, slides from right on desktop */}
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: '#fff', zIndex: 1300,
        borderRadius: '16px 16px 0 0',
        maxHeight: '80vh', overflowY: 'auto',
        paddingBottom: 'env(safe-area-inset-bottom)',
        transform: filterPanelOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '0 -4px 28px rgba(0,0,0,0.14)',
      } : {
        position: 'absolute', top: 0, bottom: 0, right: 0,
        width: 300, background: '#fff', zIndex: 1130,
        transform: filterPanelOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.14)',
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>Filtres</span>
            <button
              onClick={() => setFilterPanelOpen(false)}
              style={{ ...btnBase, background: '#F3F4F6', borderRadius: '50%', width: 32, height: 32 }}
            >
              <IconX size={16} />
            </button>
          </div>

          {/* Rating */}
          <div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 600 }}>Note minimum</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[0, 3.5, 4, 4.5].map(r => (
                <button key={r} onClick={() => setFilter(f => ({ ...f, minRating: r }))} style={{
                  ...btnBase,
                  background: filter.minRating === r ? '#E8940A' : '#F9FAFB',
                  border: filter.minRating === r ? 'none' : '0.5px solid #E5E7EB',
                  borderRadius: 8, padding: '6px 10px',
                  color: filter.minRating === r ? '#fff' : '#374151',
                  fontSize: 12, fontWeight: 600,
                }}>
                  {r === 0 ? 'Tous' : `${r}+`}
                </button>
              ))}
            </div>
          </div>

          {/* Type */}
          <div>
            <div style={{ fontSize: 13, color: '#374151', marginBottom: 8, fontWeight: 600 }}>Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {['all', 'café', 'bar', 'restaurant'].map(t => (
                <button key={t} onClick={() => setFilter(f => ({ ...f, type: t }))} style={{
                  ...btnBase,
                  background: filter.type === t ? '#E8940A' : '#F9FAFB',
                  border: filter.type === t ? 'none' : '0.5px solid #E5E7EB',
                  borderRadius: 8, padding: '6px 12px',
                  color: filter.type === t ? '#fff' : '#374151',
                  fontSize: 12, fontWeight: 600,
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
              style={{ accentColor: '#F59E0B', width: 16, height: 16 }} />
            <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Ouvert maintenant</span>
          </label>

          {/* Reset */}
          <button
            onClick={() => { setFilter({ minRating: 0, type: 'all', onlyOpen: false, onlySunny: false }); setFilterPanelOpen(false) }}
            style={{
              ...btnBase, border: '1px solid #E5E7EB', borderRadius: 8, padding: '10px',
              background: '#F9FAFB', color: '#374151', fontSize: 13, fontWeight: 500, marginTop: 4,
            }}
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Floating time slider */}
      <div style={{
        ...panel,
        position: 'absolute', bottom: isMobile ? 'calc(20px + env(safe-area-inset-bottom))' : 20, left: '50%', transform: 'translateX(-50%)',
        padding: '13px 18px', zIndex: 1100,
        maxWidth: 480, width: 'calc(100vw - 24px)',
        opacity: (selectedTerrace || planifActif) ? 0 : 1,
        pointerEvents: (selectedTerrace || planifActif) ? 'none' : 'auto',
        transition: 'opacity 0.25s ease',
      }}>
        <TimeSlider time={time} timeSlots={timeSlots} onChange={handleTimeChange} />
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
          background: '#FFFFFF', borderRadius: '20px 20px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.10)',
          width: '100%', maxWidth: 480, zIndex: 1120,
          transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          maxHeight: isMobile ? '60vh' : 'none',
          overflowY: isMobile ? 'auto' : 'visible',
        }}
      >
        {selectedTerrace && (
          <>
            {/* Collapsed header — always visible */}
            <div style={{
              padding: '10px 20px 14px',
              paddingBottom: isMobile ? 'calc(14px + env(safe-area-inset-bottom))' : 14,
              position: isMobile ? 'sticky' : 'static', top: 0,
              background: '#fff', zIndex: 1,
            }}>
              {/* Ligne 1 : drag bar */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <div
                  onClick={() => setSheetExpanded(v => !v)}
                  style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB', cursor: 'pointer' }}
                />
              </div>
              {/* Ligne 2 : nom + chevron + croix */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <h2
                  onClick={() => setSheetExpanded(v => !v)}
                  style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1C1C1E', flex: 1, paddingRight: 8, lineHeight: 1.25, cursor: 'pointer', fontFamily: "'Syne', sans-serif", letterSpacing: '-0.5px' }}
                >
                  {selectedTerrace.name}
                </h2>
                <svg
                  width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6B7280"
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
                  style={{ border: 'none', background: '#F3F4F6', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                >
                  <IconX size={14} />
                </button>
              </div>
              {/* Ligne 3 : badge soleil */}
              <div style={{ marginBottom: 12 }}>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  padding: '8px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                  background: selectedSunny ? 'linear-gradient(135deg, #FFF7E6 0%, #FEF0D0 100%)' : '#F3F4F6',
                  border: selectedSunny ? '1.5px solid #E8940A' : '1.5px solid #D1D5DB',
                }}>
                  {selectedSunny
                    ? <IconSun size={16} color="#F59E0B" />
                    : <IconCloud size={16} color="#9CA3AF" />
                  }
                  <span style={{ fontSize: 14, fontWeight: 700, color: selectedSunny ? '#92400E' : '#6B7280' }}>
                    {selectedSunny
                      ? (sunnyUntil ? (sunnyUntil.soon ? "À l'ombre bientôt" : `Ensoleillé jusqu'à ${formatTime(sunnyUntil.time)}`) : 'Ensoleillé toute la soirée')
                      : "À l'ombre actuellement"
                    }
                  </span>
                </div>
              </div>
              {/* Confirmation terrasse communautaire */}
              {selectedTerrace && (() => {
                const confirmation = terraceConfirmations[selectedTerrace.id]
                const hasOutdoor = selectedTerrace.hasOutdoorSeating

                if (confirmation === 'confirmed') {
                  return (
                    <div style={{ marginTop: 8, fontSize: 11, color: '#E8940A', fontWeight: 500 }}>
                      ✓ Terrasse confirmée par la communauté
                    </div>
                  )
                }

                if (confirmation === 'denied' || hasOutdoor === false) return null

                if (hasOutdoor === null && !confirmation) {
                  return (
                    <div style={{
                      marginTop: 10,
                      background: '#FFFBF2', border: '1px solid #E8D8B0',
                      borderRadius: 12, padding: '12px 14px',
                    }}>
                      <p style={{ fontSize: 12, color: '#6B7280', margin: '0 0 10px', lineHeight: 1.5 }}>
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
                            flex: 1, background: '#E8940A', border: 'none',
                            borderRadius: 20, padding: '8px 0', fontSize: 12,
                            color: 'white', fontWeight: 500, cursor: 'pointer',
                            fontFamily: "'Space Grotesk', sans-serif",
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
                            flex: 1, background: 'white', border: '1px solid #E5E7EB',
                            borderRadius: 20, padding: '8px 0', fontSize: 12,
                            color: '#6B7280', cursor: 'pointer',
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
              {/* Ligne 4 : slider */}
              <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 12 }}>
                <TimeSlider time={time} timeSlots={timeSlots} onChange={handleTimeChange} />
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
                    style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: 10, marginBottom: 14, display: 'block' }}
                  />
                )}

                {/* ⭐ · avis · badge ouvert + close */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <StarRating rating={selectedTerrace.rating} />
                    {selectedTerrace.reviewCount > 0 && (
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        · {selectedTerrace.reviewCount.toLocaleString('fr-FR')} avis
                      </span>
                    )}
                    {selectedTerrace.isOpen !== null && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                        background: selectedTerrace.isOpen ? '#DCFCE7' : '#FEE2E2',
                        color: selectedTerrace.isOpen ? '#16A34A' : '#DC2626',
                      }}>
                        {selectedTerrace.isOpen ? 'Ouvert' : 'Fermé'}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setSelectedTerrace(null) }}
                    style={{ ...btnBase, background: '#F3F4F6', borderRadius: '50%', width: 30, height: 30, flexShrink: 0 }}
                  >
                    <IconX size={16} />
                  </button>
                </div>

                {/* Adresse · type */}
                {selectedTerrace.address && (
                  <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 14 }}>
                    {selectedTerrace.address}
                    {selectedTerrace.type && (
                      <span style={{ color: '#9CA3AF' }}> · {selectedTerrace.type}</span>
                    )}
                  </div>
                )}

                {/* Itinéraire + Partager */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  <button style={{
                    ...btnBase, flex: 1, background: '#1C1C1E', borderRadius: 10,
                    padding: '13px', color: '#fff', fontSize: 14, fontWeight: 600, gap: 8,
                  }}>
                    <IconNavigation size={15} color="#fff" />
                    Itinéraire
                  </button>
                  <button style={{
                    ...btnBase, width: 50, flexShrink: 0,
                    background: '#F3F4F6', borderRadius: 10, border: '1px solid #E5E7EB',
                  }}>
                    <IconShare size={18} color="#374151" />
                  </button>
                </div>

              </div>
            )}
          </>
        )}
      </div>

      {/* Panel Planifier */}
      {showPlanifier && (
        <>
          <div
            onClick={() => setShowPlanifier(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1200 }}
          />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#fff', borderRadius: 16, border: '0.5px solid #E8D8B0',
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxWidth: 360, width: 'calc(100% - 32px)', zIndex: 1201,
            overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 16px 12px' }}>
              <IconClock size={20} color="#E8940A" />
              <span style={{ flex: 1, fontSize: 16, fontWeight: 700, color: '#1C1C1E' }}>Planifier ma terrasse</span>
              <button
                onClick={() => setShowPlanifier(false)}
                style={{ ...btnBase, background: '#F3F4F6', borderRadius: '50%', width: 28, height: 28 }}
              >
                <IconX size={14} />
              </button>
            </div>

            <div style={{ padding: '0 16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Quartier */}
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Quartier</div>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 12px' }}>
                    <IconMapPin size={15} color="#9CA3AF" />
                    <input
                      type="text"
                      placeholder="Ex : Marais, Bastille…"
                      value={planifQuartier}
                      onChange={e => setPlanifQuartier(e.target.value)}
                      style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, fontFamily: 'inherit', color: '#1C1C1E', background: 'transparent' }}
                    />
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
                      background: '#F9F9F9', border: '0.5px solid #E5E7EB',
                      borderRadius: 8, padding: '7px 10px', fontSize: 12,
                      color: '#374151', cursor: 'pointer', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      width: isMobile ? '100%' : 'auto',
                    }}
                  >
                    <IconNavigation size={13} color="#374151" />
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
                        ...btnBase, fontSize: 12, fontWeight: 500,
                        background: planifQuartier === q ? '#E8940A' : '#F3F4F6',
                        color: planifQuartier === q ? '#fff' : '#374151',
                        borderRadius: 20, padding: '4px 12px', border: 'none',
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Type */}
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Type</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['Tous', 'Bar', 'Café', 'Restaurant'].map(t => (
                    <button
                      key={t}
                      onClick={() => setPlanifType(t)}
                      style={{
                        ...btnBase, fontSize: 13, fontWeight: planifType === t ? 500 : 400,
                        background: planifType === t ? '#FFF7E6' : '#F9F9F9',
                        color: planifType === t ? '#8B6914' : '#374151',
                        border: planifType === t ? '0.5px solid #E8940A' : '0.5px solid #E5E7EB',
                        borderRadius: 20, padding: '4px 12px',
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Plage horaire */}
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Plage horaire</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <select
                    value={planifDebut}
                    onChange={e => setPlanifDebut(e.target.value)}
                    style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', color: '#1C1C1E', background: '#fff', outline: 'none' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span style={{ color: '#9CA3AF', fontSize: 13 }}>→</span>
                  <select
                    value={planifFin}
                    onChange={e => setPlanifFin(e.target.value)}
                    style={{ flex: 1, border: '1px solid #E5E7EB', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontFamily: 'inherit', color: '#1C1C1E', background: '#fff', outline: 'none' }}
                  >
                    {timeOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Exposition */}
              <div>
                <div style={{ fontSize: 12, color: '#6B7280', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Exposition</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => setPlanifExposition('soleil')}
                    style={{
                      ...btnBase, flex: 2, padding: '10px', gap: 6,
                      borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: planifExposition === 'soleil' ? '#FFF7E6' : '#F9F9F9',
                      border: planifExposition === 'soleil' ? '2px solid #E8940A' : '2px solid transparent',
                      color: planifExposition === 'soleil' ? '#E8940A' : '#374151',
                    }}
                  >
                    ☀️ Au soleil
                  </button>
                  <button
                    onClick={() => setPlanifExposition('ombre')}
                    style={{
                      ...btnBase, flex: 1, padding: '10px',
                      borderRadius: 8, fontSize: 13, fontWeight: 600,
                      background: '#F9F9F9',
                      border: planifExposition === 'ombre' ? '2px solid #94A3B8' : '2px solid transparent',
                      color: '#374151',
                      opacity: planifExposition === 'ombre' ? 1 : 0.6,
                    }}
                  >
                    À l'ombre
                  </button>
                </div>
              </div>

              {/* Bouton Voir les terrasses */}
              <button
                onClick={() => {
                  const [debutH, debutM] = planifDebut.split(':').map(Number)
                  const [finH, finM] = planifFin.split(':').map(Number)
                  const debutTotal = debutH * 60 + debutM
                  const finTotal = finH * 60 + finM

                  const slots = []
                  for (let m = debutTotal; m <= finTotal; m += 30) {
                    const d = new Date(time)
                    d.setHours(Math.floor(m / 60), m % 60, 0, 0)
                    slots.push(d)
                  }

                  const isSunnyAtSlot = (terrace, date) => {
                    const { altitude } = getSunPosition(date, terrace.lat, terrace.lng)
                    return altitude > 8
                  }
                  const typeMap = {
                    'Bar': ['bar', 'pub'],
                    'Café': ['cafe', 'coffee_shop'],
                    'Restaurant': ['restaurant'],
                  }
                  const resultats = terracesRef.current.filter(terrace => {
                    if (!terrace.lat || !terrace.lng) return false
                    if (planifType !== 'Tous') {
                      const types = typeMap[planifType] || []
                      if (!terrace.types?.some(t => types.includes(t))) return false
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

                  if (planifQuartier && map.current) {
                    if (planifQuartier === 'Autour de moi') {
                      const center = map.current.getCenter()
                      map.current.flyTo([center.lat, center.lng], 16, { duration: 0 })
                    } else {
                      const coords = QUARTIERS[planifQuartier]
                      if (coords) {
                        flyingRef.current = true
                        map.current.flyTo(coords, 16, { duration: 0.8 })
                        map.current.once('moveend', () => { flyingRef.current = false })
                      }
                    }
                  }
                  setShowPlanifier(false)
                }}
                style={{
                  ...btnBase, background: '#E8940A', color: '#fff',
                  borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 600,
                  width: '100%',
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
          background: '#fff', borderRadius: '20px 20px 0 0',
          borderTop: '0.5px solid #E8D8B0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.10)',
          height: 180, display: 'flex', flexDirection: 'column',
        }}>
          {/* Drag bar */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E5E7EB' }} />
          </div>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 8px' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1C1C1E', fontFamily: "'Syne', sans-serif" }}>Terrasses disponibles</span>
            <button
              onClick={() => {
                setPlanifActif(false)
                setPlanifResultats([])
                setPlanifType('Tous')
                setTime(new Date())
              }}
              style={{ ...btnBase, background: '#F3F4F6', borderRadius: '50%', width: 24, height: 24 }}
            >
              <IconX size={12} />
            </button>
          </div>
          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {planifResultats.length === 0
              ? <div style={{ fontSize: 13, color: '#9CA3AF', padding: '10px 16px' }}>Aucune terrasse ne correspond à ces critères.</div>
              : planifResultats.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTerrace(t)
                    if (map.current) map.current.flyTo([t.lat, t.lng], 17)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '10px 16px',
                    borderBottom: '0.5px solid #F9F9F9', cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#FAFAFA' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: '#1C1C1E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Syne', sans-serif" }}>{t.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      {t.rating && (
                        <>
                          <IconStar size={11} color="#E8940A" />
                          <span style={{ fontSize: 12, color: '#6B7280' }}>{t.rating.toFixed(1)}</span>
                          {t.type && <span style={{ fontSize: 12, color: '#6B7280' }}>· {t.type}</span>}
                        </>
                      )}
                    </div>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {/* Intro tooltip — premier chargement */}
      {showIntro && (
        <>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1149 }} />
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: '#fff', borderRadius: 16, padding: 24,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            maxWidth: 320, width: 'calc(100vw - 48px)', zIndex: 1150,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          }}>
            <IconSun size={32} color="#F59E0B" />
            <span style={{ fontSize: 20, fontWeight: 700, textAlign: 'center', color: '#1C1C1E' }}>
              Trouve ta terrasse au soleil
            </span>
            <span style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {'🟠 Orange = au soleil en ce moment\n⚫ Gris = à l\'ombre\nUtilise le slider pour simuler une autre heure'}
            </span>
            <button
              onClick={() => { localStorage.setItem('helio_intro_seen', '1'); setShowIntro(false) }}
              style={{
                ...btnBase, background: '#F59E0B', color: '#fff', borderRadius: 10,
                padding: '12px 24px', fontWeight: 600, fontSize: 15, width: '100%', marginTop: 4,
              }}
            >
              C'est parti !
            </button>
          </div>
        </>
      )}

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
          bottom: isMobile ? 120 : 100,
          right: 12,
          zIndex: 1100,
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'white',
          border: '0.5px solid #E8D8B0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <IconNavigation size={16} color="#E8940A" />
      </button>

    </div>
  )
}
