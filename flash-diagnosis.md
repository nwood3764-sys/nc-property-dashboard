# Map Flashing Root Cause Analysis

## The Problem
When clicking "My Location", the map flashes/re-renders.

## Root Cause
The flash is caused by a **cascade of state updates** that trigger re-renders of the PropertyMap component:

1. User clicks "My Location" → GPS fires → `setUserLocation()` in PropertyMap
2. The `useEffect` watching `[userLocation, radiusMiles, geoProperties.length]` fires → computes nearby properties → calls `onNearbyChange()`
3. `onNearbyChange` in Home.tsx calls `setNearbyMode(true)` and `setNearbyIds(new Map(...))` → Home re-renders
4. Home re-render passes a **new `allFiltered` array reference** to PropertyMap (since `allFiltered` is computed via useMemo but its dependencies may change)
5. PropertyMap receives new props → `geoProperties` is recomputed (it's derived from `properties` filter) → `renderMarkers` useCallback has `geoProperties` as a dependency → new function identity → the `useEffect([renderMarkers, currentZoom])` fires → **clears all markers and re-creates them**

Additionally:
- The `geoProperties` array is recomputed on every render: `const geoProperties = properties.filter(...)` — this is NOT memoized
- The `onNearbyChange` callback dependency on `geoProperties.length` means any recomputation triggers the nearby effect again

## Fix Plan
1. **Memoize `geoProperties`** in PropertyMap to prevent unnecessary recalculation
2. **Memoize `allFiltered`** reference stability — it's already useMemo'd in usePropertyData, so this should be stable
3. **Use `React.memo`** on PropertyMap to prevent re-renders when props haven't actually changed
4. **Stabilize the `onNearbyChange` effect** — use a ref for the callback to avoid re-triggering
5. **Prevent marker re-render** when only location state changes, not the property data
