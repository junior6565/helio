const PASS = (msg) => console.log(`%c[TEST PASS] ${msg}`, 'color: #22c55e; font-weight: bold')
const FAIL = (msg) => console.error(`[TEST FAIL] ${msg}`)
const INFO = (msg) => console.log(`%c[TEST INFO] ${msg}`, 'color: #94a3b8')

const TEST_TERRACES = [
  { id: 'test-marais',        lat: 48.8566, lng: 2.3522, name: 'Le Marais' },
  { id: 'test-st-germain',    lat: 48.8534, lng: 2.3338, name: 'Saint-Germain' },
  { id: 'test-bastille',      lat: 48.8533, lng: 2.3692, name: 'Bastille' },
]

export function runShadowTests(shadowCacheRef, baselineCacheRef, getShadowStatus) {
  console.group('%c🔍 HELIO Shadow System Tests', 'font-size: 14px; font-weight: bold; color: #D4500A')
  let passed = 0
  let failed = 0

  // ── T1 : baselineCacheRef contient des entrées ────────────────────────────
  const baselineKeys = Object.keys(baselineCacheRef.current || {})
  if (baselineKeys.length > 0) {
    PASS(`T1 — baselineCacheRef rempli : ${baselineKeys.length} terrasse(s)`)
    passed++
    INFO(`  Exemple : id=${baselineKeys[0]} → baseline=${baselineCacheRef.current[baselineKeys[0]]} pixels`)
  } else {
    FAIL('T1 — baselineCacheRef vide (aucune terrasse chargée ou baseline non encore calculée)')
    failed++
  }

  // ── T2 : shadowCacheRef contient des entrées ──────────────────────────────
  const shadowKeys = Object.keys(shadowCacheRef.current || {})
  if (shadowKeys.length > 0) {
    PASS(`T2 — shadowCacheRef rempli : ${shadowKeys.length} terrasse(s)`)
    passed++
    const sunnyCount = Object.values(shadowCacheRef.current).filter(Boolean).length
    INFO(`  ${sunnyCount}/${shadowKeys.length} terrasses au soleil en ce moment`)
  } else {
    FAIL('T2 — shadowCacheRef vide (lecture canvas pas encore effectuée)')
    failed++
  }

  // ── T3 : valeurs de baseline plausibles (> 0 et < 441) ───────────────────
  if (baselineKeys.length > 0) {
    const baselines = Object.values(baselineCacheRef.current)
    const allPlausible = baselines.every(b => b >= 0 && b <= 441)
    const hasVariance = baselines.some(b => b > 0)
    if (allPlausible && hasVariance) {
      const min = Math.min(...baselines)
      const max = Math.max(...baselines)
      PASS(`T3 — Baselines plausibles (min=${min}, max=${max} / 441 pixels)`)
      passed++
    } else if (!allPlausible) {
      FAIL(`T3 — Baseline hors plage 0-441 détectée`)
      failed++
    } else {
      FAIL(`T3 — Toutes les baselines à 0 (bâtiments OSM non chargés ?)`)
      failed++
    }
  } else {
    INFO('T3 — Ignoré (T1 échoué)')
  }

  // ── T4 : getShadowStatus retourne boolean pour les terrasses connues ──────
  if (typeof getShadowStatus === 'function' && shadowKeys.length > 0) {
    const now = new Date()
    const testTerrace = { id: shadowKeys[0], lat: 48.8566, lng: 2.3522 }
    const result = getShadowStatus(testTerrace, now)
    if (typeof result === 'boolean') {
      PASS(`T4 — getShadowStatus retourne boolean : terrasse[${shadowKeys[0]}] → ${result ? 'ensoleillée' : 'à l'ombre'}`)
      passed++
    } else {
      FAIL(`T4 — getShadowStatus retourne ${typeof result} au lieu de boolean`)
      failed++
    }
  } else {
    FAIL('T4 — getShadowStatus non fourni ou shadowCache vide')
    failed++
  }

  // ── T5 : logique isInShadow cohérente avec les valeurs actuelles ──────────
  if (baselineKeys.length > 0 && shadowKeys.length > 0) {
    const coherent = shadowKeys.every(id => {
      const shadowResult = shadowCacheRef.current[id]
      return typeof shadowResult === 'boolean'
    })
    if (coherent) {
      PASS('T5 — Toutes les valeurs shadowCache sont des booléens valides')
      passed++
    } else {
      FAIL('T5 — shadowCache contient des valeurs non-booléennes')
      failed++
    }
  } else {
    INFO('T5 — Ignoré (données insuffisantes)')
  }

  // ── T6 : vérification cohérence midi vs maintenant ────────────────────────
  if (baselineKeys.length > 0 && shadowKeys.length > 0) {
    const now = new Date()
    const hour = now.getHours()
    if (hour >= 12 && hour <= 16) {
      const sunnyCount = Object.values(shadowCacheRef.current).filter(Boolean).length
      const total = shadowKeys.length
      if (sunnyCount > 0) {
        PASS(`T6 — Cohérence horaire : ${sunnyCount}/${total} terrasses au soleil entre 12h-16h (attendu : >0)`)
        passed++
      } else {
        FAIL(`T6 — 0/${total} terrasses au soleil entre 12h-16h — système shadow peut-être défaillant`)
        failed++
      }
    } else {
      INFO(`T6 — Ignoré (heure=${hour}h, test valide uniquement entre 12h et 16h)`)
    }
  } else {
    INFO('T6 — Ignoré (données insuffisantes)')
  }

  // ── Résumé ────────────────────────────────────────────────────────────────
  console.log('─'.repeat(50))
  const total = passed + failed
  if (failed === 0) {
    console.log(`%c✅ ${passed}/${total} tests réussis`, 'color: #22c55e; font-size: 13px; font-weight: bold')
  } else {
    console.log(`%c⚠️  ${passed}/${total} réussis, ${failed} échoués`, 'color: #f59e0b; font-size: 13px; font-weight: bold')
  }
  console.groupEnd()

  return { passed, failed, total }
}
