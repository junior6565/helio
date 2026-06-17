import SunCalc from 'suncalc'

export function getSunPosition(date, lat, lng) {
  const pos = SunCalc.getPosition(date, lat, lng)
  return {
    azimuth: pos.azimuth * (180 / Math.PI) + 180,
    altitude: pos.altitude * (180 / Math.PI),
    isAboveHorizon: pos.altitude > 0
  }
}

export function getSunTimes(date, lat, lng) {
  const times = SunCalc.getTimes(date, lat, lng)
  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    solarNoon: times.solarNoon
  }
}

export function getShadowDirection(sunAzimuth) {
  return (sunAzimuth + 180) % 360
}

export function getShadowLength(sunAltitude) {
  if (sunAltitude <= 0) return 0
  return 1 / Math.tan(sunAltitude * Math.PI / 180)
}

export function getSunScore(date, lat, lng) {
  const { altitude, isAboveHorizon } = getSunPosition(date, lat, lng)
  if (!isAboveHorizon) return 0
  if (altitude < 5) return 10
  if (altitude < 15) return 60
  if (altitude < 45) return 100
  if (altitude < 60) return 80
  return 60
}

export function getSunLabel(score) {
  if (score === 0) return { label: 'Soleil couché', color: '#64748b' }
  if (score < 30) return { label: 'Lumière rasante', color: '#f97316' }
  if (score < 70) return { label: 'Ensoleillé', color: '#eab308' }
  return { label: 'Plein soleil', color: '#f59e0b' }
}

export function generateTimeSlots(date, lat, lng) {
  const slots = []
  for (let hour = 8; hour <= 22; hour++) {
    for (let min = 0; min < 60; min += 30) {
      const slotDate = new Date(date)
      slotDate.setHours(hour, min, 0, 0)
      const score = getSunScore(slotDate, lat, lng)
      slots.push({
        time: slotDate,
        label: `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        score,
        isGolden: score >= 80
      })
    }
  }
  return slots
}
