# HELIO — Guide Claude Code

## Stack technique
- React + Vite + Leaflet + CartoDB tiles
- OSM Buildings (ombres via canvas[0] avec baseline midi)
- Google Places API (New) — clé via VITE_GOOGLE_PLACES_KEY
- SunCalc pour position solaire
- Déployé sur Vercel : helio-bay.vercel.app
- Repo : github.com/junior6565/helio

## Conventions
- Pas de `npm test` — tester sur Vercel après push
- Toujours `git add -A && git commit -m "..." && git push` en fin de prompt
- isMobile = window.innerWidth < 768 (déjà déclaré en haut du composant)
- Polices : Bebas Neue (titres) + Space Grotesk (UI)
- Couleurs DA : #D4500A (orange), #1C0F06 (sombre), #F5E6C8 (crème)

## Architecture critique — NE JAMAIS TOUCHER
- readShadowPixels() : lit canvas[0] OSM Buildings zone 9x9 pixels
- baselineCacheRef : baseline des pixels à midi pour chaque terrasse
- isInShadow = (opaqueCount - baselineCacheRef[id]) >= 8
- scheduleShadowRead() : déclenché après chaque changement de time
- Ne jamais appliquer canvas.style.filter — casse la détection d'ombres
- Ne jamais modifier getShadowStatus sans tester le système shadow

## Décisions architecturales
- Pas de backend — 100% frontend
- Cache Places API dans localStorage 24h par zone GPS
- Confirmation terrasse communautaire via localStorage
- shadowVersion state force le re-render des markers après lecture canvas

## Backlog P1
- bâtiments OSM colorés (rouge/bleu) — pas de fix CSS filtre canvas
- sunnyUntil basé altitude pure — à connecter au shadow cache
- mode Planifier markers absents
- recherche établissement marker invisible

## Backlog P2
- Accessibilité (aria-labels, contraste WCAG AA, navigation clavier)
- PWA (vite-plugin-pwa, manifest, icônes 192/512px)
- Géocodage quartier libre Planifier

## Backlog P3
- Prix pinte / MisterGoodBeer
- Météo temps réel
- Favoris / auth
- Autres villes

## Format prompt optimal
FICHIER:
