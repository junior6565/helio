const PLACES_BASE = 'https://places.googleapis.com/v1/places:searchNearby'

const FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.primaryTypeDisplayName',
  'places.formattedAddress',
  'places.regularOpeningHours',
  'places.photos',
  'places.outdoorSeating',
].join(',')

const ALL_TYPES = ['restaurant', 'bar', 'pub', 'cafe', 'coffee_shop', 'bakery']

function getSubCenters(lat, lng, radiusMeters) {
  const offset = radiusMeters * 0.0000045
  return [
    { lat, lng },                                 // centre
    { lat: lat + offset, lng },                   // nord
    { lat: lat - offset, lng },                   // sud
    { lat, lng: lng + offset },                   // est
    { lat, lng: lng - offset },                   // ouest
    { lat: lat + offset, lng: lng + offset },     // nord-est
    { lat: lat + offset, lng: lng - offset },     // nord-ouest
    { lat: lat - offset, lng: lng + offset },     // sud-est
    { lat: lat - offset, lng: lng - offset },     // sud-ouest
  ]
}

async function fetchGroup(types, lat, lng, radiusMeters, apiKey) {
  const res = await fetch(PLACES_BASE, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 20,
      locationRestriction: {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      },
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    console.error(`Places API error (${types.join('/')}) response:`, errorText)
    throw new Error(`Places API error: ${res.status}`)
  }

  const data = await res.json()
  return data.places || []
}

function distanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
    Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) *
    Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function mapPlace(p) {
  return {
    id: p.id,
    name: p.displayName?.text || 'Établissement',
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    rating: p.rating || null,
    reviewCount: p.userRatingCount || 0,
    type: p.primaryTypeDisplayName?.text || 'Restaurant',
    types: p.types || [],
    address: p.formattedAddress || '',
    hasOutdoorSeating: p.outdoorSeating ?? null,
    photoRef: p.photos?.[0]?.name || null,
    photos: p.photos || [],
    isOpen: p.regularOpeningHours?.openNow ?? null,
  }
}

const SEARCH_TEXT_FIELD_MASK = [
  'places.id', 'places.displayName', 'places.location',
  'places.formattedAddress', 'places.types',
].join(',')

export async function searchPlaces(query, apiKey) {
  if (!query || query.length < 2 || !apiKey) return []
  try {
    const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': SEARCH_TEXT_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query + ' Paris',
        locationBias: {
          circle: { center: { latitude: 48.8566, longitude: 2.3522 }, radius: 20000 },
        },
        maxResultCount: 5,
        languageCode: 'fr',
      }),
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.places || []
  } catch {
    return []
  }
}

export async function fetchNearbyTerraces(lat, lng, radiusMeters = 1000, apiKey) {
  if (!apiKey) {
    return getMockTerraces(lat, lng)
  }

  const cacheKey = `helio_places_${Math.round(lat * 100) / 100}_${Math.round(lng * 100) / 100}`
  try {
    const cached = localStorage.getItem(cacheKey)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return data
      }
    }
  } catch {}

  try {
    const subCenters = getSubCenters(lat, lng, radiusMeters)
    const subRadius = radiusMeters / 2

    const requests = subCenters.map((center, subIdx) => ({ center, subIdx }))

    const results = await Promise.allSettled(
      requests.map(({ center }) =>
        fetchGroup(ALL_TYPES, center.lat, center.lng, subRadius, apiKey)
      )
    )

    const allRaw = []
    for (let i = 0; i < results.length; i++) {
      if (results[i].status !== 'fulfilled') continue
      allRaw.push(...results[i].value)
    }

    const seen = new Set()
    const deduped = []
    for (const place of allRaw) {
      if (seen.has(place.id)) continue
      seen.add(place.id)
      deduped.push(mapPlace(place))
      if (deduped.length >= 500) break
    }

    const filtered = deduped.filter(p => distanceMeters(lat, lng, p.lat, p.lng) <= radiusMeters)

    try {
      localStorage.setItem(cacheKey, JSON.stringify({ data: filtered, timestamp: Date.now() }))
    } catch {}

    return filtered
  } catch (err) {
    console.error('Places API failed, using mock data:', err)
    return getMockTerraces(lat, lng)
  }
}

export function getMockTerraces(lat = 48.8566, lng = 2.3522) {
  const offset = () => (Math.random() - 0.5) * 0.008
  return [
    { id: '1', name: 'Café de la Paix', lat: lat + offset(), lng: lng + offset(), rating: 4.3, reviewCount: 1240, type: 'Café', address: '5 Place de l\'Opéra, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '2', name: 'Le Marché des Enfants Rouges', lat: lat + offset(), lng: lng + offset(), rating: 4.5, reviewCount: 890, type: 'Restaurant', address: '39 Rue de Bretagne, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '3', name: 'Café Charlot', lat: lat + offset(), lng: lng + offset(), rating: 4.1, reviewCount: 567, type: 'Café', address: '38 Rue de Bretagne, Paris', hasOutdoorSeating: true, isOpen: false },
    { id: '4', name: 'Le Perchoir Marais', lat: lat + offset(), lng: lng + offset(), rating: 4.4, reviewCount: 2103, type: 'Bar', address: '33 Rue de la Verrerie, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '5', name: 'Brasserie Lola', lat: lat + offset(), lng: lng + offset(), rating: 3.9, reviewCount: 340, type: 'Brasserie', address: '12 Rue Oberkampf, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '6', name: 'Café Pinson', lat: lat + offset(), lng: lng + offset(), rating: 4.2, reviewCount: 780, type: 'Café', address: '6 Rue du Forez, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '7', name: 'La Fontaine de Belleville', lat: lat + offset(), lng: lng + offset(), rating: 4.6, reviewCount: 1890, type: 'Café', address: '31-33 Rue Juliette Dodu, Paris', hasOutdoorSeating: true, isOpen: true },
    { id: '8', name: 'Septime', lat: lat + offset(), lng: lng + offset(), rating: 4.7, reviewCount: 3240, type: 'Restaurant', address: '80 Rue de Charonne, Paris', hasOutdoorSeating: false, isOpen: true },
  ]
}
