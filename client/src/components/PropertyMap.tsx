/*
 * PropertyMap — Interactive Google Map with clustered markers for NC properties
 * Design: Civic Blueprint — tier-colored markers, cluster aggregation
 * Features: GPS "My Location" with nearby property detection for field work
 * Uses the built-in MapView component with Google Maps proxy
 */

/// <reference types="@types/google.maps" />

import { MapView } from "@/components/Map";
import type { Property } from "@/lib/types";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { MapPin, Layers, X, Navigation, Loader2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

interface NearbyPropertyInfo {
  propertyId: number;
  distance: number;
}

interface PropertyMapProps {
  properties: Property[];
  onNearbyChange?: (isActive: boolean, nearbyIds: NearbyPropertyInfo[]) => void;
  onPropertyClick?: (propertyId: number) => void;
  onBoundsChange?: (visiblePropertyIds: number[]) => void;
  onClusterSelect?: (propertyIds: number[]) => void;
}

const TIER_COLORS: Record<string, string> = {
  Critical: "#C53030",
  High: "#D69E2E",
  Medium: "#3182CE",
  Low: "#38A169",
};

const TIER_Z: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

// NC center
const NC_CENTER = { lat: 35.55, lng: -79.39 };
const NC_ZOOM = 7;

// Radius options in miles
const RADIUS_OPTIONS = [0.5, 1, 2, 5, 10, 25];

// Haversine distance in miles
function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function createMarkerContent(tier: string, count?: number): HTMLElement {
  const div = document.createElement("div");
  const color = TIER_COLORS[tier] || "#666";
  const size = count ? Math.min(14 + Math.log2(count) * 4, 32) : 10;

  div.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: 2px solid white;
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: transform 0.15s;
  `;
  div.onmouseenter = () => { div.style.transform = "scale(1.3)"; };
  div.onmouseleave = () => { div.style.transform = "scale(1)"; };
  return div;
}

function createNearbyMarkerContent(tier: string): HTMLElement {
  const div = document.createElement("div");
  const color = TIER_COLORS[tier] || "#666";
  // Larger pulsing marker for nearby properties
  div.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 0 0 3px ${color}44, 0 2px 8px rgba(0,0,0,0.4);
    cursor: pointer;
    transition: transform 0.15s;
    animation: nearbyPulse 2s ease-in-out infinite;
  `;
  div.onmouseenter = () => { div.style.transform = "scale(1.4)"; };
  div.onmouseleave = () => { div.style.transform = "scale(1)"; };
  return div;
}

function createClusterContent(count: number, tiers: Record<string, number>): HTMLElement {
  const div = document.createElement("div");
  const dominant = Object.entries(tiers).sort((a, b) => b[1] - a[1])[0]?.[0] || "Medium";
  const color = TIER_COLORS[dominant] || "#666";
  const size = Math.min(28 + Math.log2(count) * 8, 56);

  div.style.cssText = `
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    background: ${color};
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: ${Math.max(10, size / 3.5)}px;
    font-family: 'Space Grotesk', sans-serif;
    cursor: pointer;
    transition: transform 0.15s;
  `;
  div.textContent = count > 999 ? `${(count / 1000).toFixed(1)}k` : String(count);
  div.onmouseenter = () => { div.style.transform = "scale(1.15)"; };
  div.onmouseleave = () => { div.style.transform = "scale(1)"; };
  return div;
}

function createUserLocationMarker(): HTMLElement {
  const outer = document.createElement("div");
  outer.style.cssText = `
    width: 40px;
    height: 40px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Pulsing ring
  const ring = document.createElement("div");
  ring.style.cssText = `
    position: absolute;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(59, 130, 246, 0.15);
    border: 2px solid rgba(59, 130, 246, 0.3);
    animation: locationPulse 2s ease-in-out infinite;
  `;
  outer.appendChild(ring);

  // Center dot
  const dot = document.createElement("div");
  dot.style.cssText = `
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #3B82F6;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
    z-index: 1;
  `;
  outer.appendChild(dot);

  return outer;
}

interface ClusterGroup {
  lat: number;
  lng: number;
  properties: Property[];
  tiers: Record<string, number>;
}

function clusterProperties(properties: Property[], zoom: number): ClusterGroup[] {
  const cellSize = 180 / Math.pow(2, zoom);
  const grid: Record<string, ClusterGroup> = {};

  for (const p of properties) {
    if (p.lat == null || p.lng == null) continue;
    const cellX = Math.floor(p.lng / cellSize);
    const cellY = Math.floor(p.lat / cellSize);
    const key = `${cellX},${cellY}`;

    if (!grid[key]) {
      grid[key] = { lat: 0, lng: 0, properties: [], tiers: {} };
    }
    grid[key].properties.push(p);
    grid[key].lat += p.lat;
    grid[key].lng += p.lng;
    grid[key].tiers[p.priority_tier] = (grid[key].tiers[p.priority_tier] || 0) + 1;
  }

  return Object.values(grid).map((g) => ({
    ...g,
    lat: g.lat / g.properties.length,
    lng: g.lng / g.properties.length,
  }));
}

interface NearbyProperty extends Property {
  distance: number; // miles
}

type LocationState = "idle" | "loading" | "active" | "error";

export default function PropertyMap({ properties, onNearbyChange, onPropertyClick, onBoundsChange, onClusterSelect }: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const userMarkerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);
  const nearbyMarkersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const watchIdRef = useRef<number | null>(null);

  // Store callbacks in refs to avoid re-triggering effects when parent re-renders
  const onNearbyChangeRef = useRef(onNearbyChange);
  onNearbyChangeRef.current = onNearbyChange;
  const onPropertyClickRef = useRef(onPropertyClick);
  onPropertyClickRef.current = onPropertyClick;
  const onBoundsChangeRef = useRef(onBoundsChange);
  onBoundsChangeRef.current = onBoundsChange;
  const onClusterSelectRef = useRef(onClusterSelect);
  onClusterSelectRef.current = onClusterSelect;

  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(NC_ZOOM);
  const [isMapReady, setIsMapReady] = useState(false);

  // GPS / Location state
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusMiles, setRadiusMiles] = useState(5);
  const [nearbyProperties, setNearbyProperties] = useState<NearbyProperty[]>([]);
  const [showNearbyPanel, setShowNearbyPanel] = useState(true);

  const geoProperties = useMemo(
    () => properties.filter((p) => p.lat != null && p.lng != null),
    [properties]
  );

  // Compute nearby properties when location or radius changes
  // Use geoProperties.length as dep (not the array itself) to avoid re-running when parent re-renders with same data
  const geoPropsLengthRef = useRef(geoProperties.length);
  geoPropsLengthRef.current = geoProperties.length;
  const geoPropsRef = useRef(geoProperties);
  geoPropsRef.current = geoProperties;

  // Report visible properties within map bounds to parent
  const reportVisibleProperties = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    if (!bounds) return;
    const visibleIds: number[] = [];
    for (const p of geoPropsRef.current) {
      if (p.lat != null && p.lng != null && bounds.contains({ lat: p.lat, lng: p.lng })) {
        visibleIds.push(p.property_id);
      }
    }
    onBoundsChangeRef.current?.(visibleIds);
  }, []);

  useEffect(() => {
    if (!userLocation) {
      setNearbyProperties([]);
      onNearbyChangeRef.current?.(false, []);
      return;
    }
    const nearby: NearbyProperty[] = [];
    for (const p of geoPropsRef.current) {
      if (p.lat == null || p.lng == null) continue;
      const dist = haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng);
      if (dist <= radiusMiles) {
        nearby.push({ ...p, distance: dist });
      }
    }
    nearby.sort((a, b) => a.distance - b.distance);
    setNearbyProperties(nearby);
    onNearbyChangeRef.current?.(true, nearby.map(p => ({ propertyId: p.property_id, distance: p.distance })));
  }, [userLocation, radiusMiles]);

  // Draw/update radius circle on map
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !userLocation) {
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }
      return;
    }

    const radiusMeters = radiusMiles * 1609.34;

    if (radiusCircleRef.current) {
      radiusCircleRef.current.setCenter(userLocation);
      radiusCircleRef.current.setRadius(radiusMeters);
    } else {
      radiusCircleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: userLocation,
        radius: radiusMeters,
        fillColor: "#3B82F6",
        fillOpacity: 0.08,
        strokeColor: "#3B82F6",
        strokeOpacity: 0.35,
        strokeWeight: 2,
      });
    }
  }, [userLocation, radiusMiles, isMapReady]);

  // Place/update user location marker
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.map = null;
        userMarkerRef.current = null;
      }
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.position = userLocation;
    } else {
      userMarkerRef.current = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: userLocation,
        content: createUserLocationMarker(),
        zIndex: 100,
        title: "Your Location",
      });
    }
  }, [userLocation, isMapReady]);

  // Render nearby property markers (separate from cluster markers)
  useEffect(() => {
    // Clear old nearby markers
    for (const m of nearbyMarkersRef.current) {
      m.map = null;
    }
    nearbyMarkersRef.current = [];

    if (!mapRef.current || !isMapReady || !userLocation || nearbyProperties.length === 0) return;

    // Only show individual nearby markers when zoomed in enough
    if (currentZoom < 11) return;

    for (const p of nearbyProperties.slice(0, 100)) {
      if (p.lat == null || p.lng == null) continue;
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map: mapRef.current,
        position: { lat: p.lat, lng: p.lng },
        content: createNearbyMarkerContent(p.priority_tier),
        zIndex: 50 + (TIER_Z[p.priority_tier] || 1),
        title: `${p.property_name_clean} (${p.distance.toFixed(1)} mi)`,
      });

      marker.addListener("click", () => {
        setSelectedCluster({
          lat: p.lat!,
          lng: p.lng!,
          properties: [p],
          tiers: { [p.priority_tier]: 1 },
        });
      });

      nearbyMarkersRef.current.push(marker);
    }
  }, [nearbyProperties, currentZoom, isMapReady, userLocation]);

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) {
      m.map = null;
    }
    markersRef.current = [];
  }, []);

  // Track property count to only re-render markers when the actual data changes
  const prevGeoCountRef = useRef(0);

  const renderMarkers = useCallback(
    (zoom: number) => {
      if (!mapRef.current || !isMapReady) return;
      clearMarkers();

      const clusters = clusterProperties(geoPropsRef.current, zoom);

      for (const cluster of clusters) {
        const isSingle = cluster.properties.length === 1;
        const content = isSingle
          ? createMarkerContent(cluster.properties[0].priority_tier)
          : createClusterContent(cluster.properties.length, cluster.tiers);

        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: mapRef.current,
          position: { lat: cluster.lat, lng: cluster.lng },
          content,
          zIndex: isSingle
            ? TIER_Z[cluster.properties[0].priority_tier] || 1
            : 10 + cluster.properties.length,
          title: isSingle
            ? `${cluster.properties[0].property_name_clean} (Score: ${cluster.properties[0].total_priority_score})`
            : `${cluster.properties.length} properties`,
        });

        marker.addListener("click", () => {
          if (isSingle) {
            setSelectedCluster(cluster);
            onClusterSelectRef.current?.(cluster.properties.map(p => p.property_id));
          } else if (zoom < 14) {
            mapRef.current?.setZoom(zoom + 2);
            mapRef.current?.panTo({ lat: cluster.lat, lng: cluster.lng });
          } else {
            setSelectedCluster(cluster);
            onClusterSelectRef.current?.(cluster.properties.map(p => p.property_id));
          }
        });

        markersRef.current.push(marker);
      }
    },
    [clearMarkers, isMapReady]
  );

  // Re-render markers when zoom changes or when property data actually changes
  useEffect(() => {
    const currentCount = geoProperties.length;
    renderMarkers(currentZoom);
    prevGeoCountRef.current = currentCount;
  }, [renderMarkers, currentZoom, geoProperties]);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setIsMapReady(true);

      map.addListener("zoom_changed", () => {
        const z = map.getZoom();
        if (z != null) setCurrentZoom(z);
      });

      // Report visible properties when map stops moving (idle = after pan/zoom)
      map.addListener("idle", () => {
        reportVisibleProperties();
      });
    },
    [reportVisibleProperties]
  );

  // GPS functions
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationState("error");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationState("loading");
    setLocationError(null);

    // First get a quick position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationState("active");

        // Pan and zoom to user location
        if (mapRef.current) {
          mapRef.current.panTo(loc);
          mapRef.current.setZoom(13);
        }
      },
      (err) => {
        setLocationState("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setLocationError("Location permission denied. Please enable location access in your browser settings.");
            break;
          case err.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable. Please check your device's GPS.");
            break;
          case err.TIMEOUT:
            setLocationError("Location request timed out. Please try again.");
            break;
          default:
            setLocationError("An unknown error occurred while getting your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 30000,
      }
    );

    // Then start watching for updates
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const loc = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(loc);
        setLocationState("active");
      },
      () => {
        // Silently ignore watch errors if we already have a position
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      }
    );
    watchIdRef.current = id;
  }, []);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    // Clean up map elements
    if (userMarkerRef.current) {
      userMarkerRef.current.map = null;
      userMarkerRef.current = null;
    }
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }
    for (const m of nearbyMarkersRef.current) {
      m.map = null;
    }
    nearbyMarkersRef.current = [];

    setUserLocation(null);
    setNearbyProperties([]);
    setLocationState("idle");
    setLocationError(null);
    onNearbyChangeRef.current?.(false, []);

    // Reset map view
    if (mapRef.current) {
      mapRef.current.panTo(NC_CENTER);
      mapRef.current.setZoom(NC_ZOOM);
    }
  }, []);

  const recenterOnUser = useCallback(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(13);
    }
  }, [userLocation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      {/* Inject animation keyframes */}
      <style>{`
        @keyframes locationPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        @keyframes nearbyPulse {
          0%, 100% { box-shadow: 0 0 0 2px currentColor, 0 2px 8px rgba(0,0,0,0.4); }
          50% { box-shadow: 0 0 0 4px currentColor, 0 2px 12px rgba(0,0,0,0.5); }
        }
      `}</style>

      {/* Map Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[oklch(0.30_0.06_250)]" />
          <h3 className="font-[Space_Grotesk] font-semibold text-sm">
            Property Locations
          </h3>
          <span className="text-xs text-muted-foreground">
            {geoProperties.length} mapped
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* My Location Button */}
          {locationState === "idle" && (
            <button
              onClick={startLocationTracking}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm
                bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
              title="Use GPS to find properties near you"
            >
              <Navigation className="w-3.5 h-3.5" />
              My Location
            </button>
          )}
          {locationState === "loading" && (
            <button
              disabled
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm
                bg-blue-50 text-blue-500 border border-blue-200 opacity-75"
            >
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Locating...
            </button>
          )}
          {locationState === "active" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={recenterOnUser}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm
                  bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Re-center map on your location"
              >
                <Navigation className="w-3.5 h-3.5" />
                My Location
              </button>
              {/* Radius selector */}
              <select
                value={radiusMiles}
                onChange={(e) => setRadiusMiles(Number(e.target.value))}
                className="text-xs border border-blue-200 rounded-sm px-2 py-1.5 bg-white text-blue-700
                  focus:outline-none focus:ring-1 focus:ring-blue-400"
                title="Search radius"
              >
                {RADIUS_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r} mi
                  </option>
                ))}
              </select>
              <button
                onClick={stopLocationTracking}
                className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                title="Stop location tracking"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {locationState === "error" && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={startLocationTracking}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm
                  bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
                title={locationError || "Try again"}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Retry
              </button>
              <button
                onClick={() => { setLocationState("idle"); setLocationError(null); }}
                className="p-1.5 text-xs rounded-sm text-gray-500 hover:text-gray-700"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 text-xs">
            {(["Critical", "High", "Medium", "Low"] as const).map((tier) => (
              <div key={tier} className="flex items-center gap-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: TIER_COLORS[tier] }}
                />
                <span className="text-muted-foreground">{tier}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {locationError && locationState === "error" && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {locationError}
        </div>
      )}

      {/* Map */}
      <div className="relative">
        <MapView
          className="h-[480px]"
          initialCenter={NC_CENTER}
          initialZoom={NC_ZOOM}
          onMapReady={handleMapReady}
        />

        {/* Nearby Properties Panel (overlay on map) */}
        {locationState === "active" && nearbyProperties.length > 0 && (
          <div className="absolute top-3 left-3 w-80 max-h-[440px] bg-white border border-border rounded-sm shadow-lg overflow-hidden z-10">
            <div
              className="px-3 py-2 bg-blue-600 text-white flex items-center justify-between cursor-pointer"
              onClick={() => setShowNearbyPanel(!showNearbyPanel)}
            >
              <div className="flex items-center gap-2">
                <Navigation className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  {nearbyProperties.length} Nearby Properties
                </span>
                <span className="text-[10px] text-blue-200">
                  within {radiusMiles} mi
                </span>
              </div>
              <div className="flex items-center gap-1">
                {showNearbyPanel ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            {showNearbyPanel && (
              <>
                {/* Tier summary */}
                <div className="px-3 py-1.5 bg-blue-50 border-b border-blue-100 flex items-center gap-3 text-[10px]">
                  {(["Critical", "High", "Medium", "Low"] as const).map((tier) => {
                    const count = nearbyProperties.filter(
                      (p) => p.priority_tier === tier
                    ).length;
                    if (count === 0) return null;
                    return (
                      <div key={tier} className="flex items-center gap-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: TIER_COLORS[tier] }}
                        />
                        <span className="font-medium">{count}</span>
                        <span className="text-muted-foreground">{tier}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Property list */}
                <div className="overflow-y-auto max-h-[340px]">
                  {nearbyProperties.slice(0, 50).map((p) => (
                    <div
                      key={p.property_id}
                      className="px-3 py-2 border-b border-border last:border-b-0 hover:bg-blue-50/50 cursor-pointer"
                      onClick={() => {
                        if (p.lat != null && p.lng != null && mapRef.current) {
                          mapRef.current.panTo({ lat: p.lat, lng: p.lng });
                          mapRef.current.setZoom(16);
                          setSelectedCluster({
                            lat: p.lat,
                            lng: p.lng,
                            properties: [p],
                            tiers: { [p.priority_tier]: 1 },
                          });
                        }
                        onPropertyClickRef.current?.(p.property_id);
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {p.property_name_clean}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {p.address_clean}, {p.city_clean}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-sm">
                            {p.distance.toFixed(1)} mi
                          </span>
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white"
                            style={{ background: TIER_COLORS[p.priority_tier] }}
                          >
                            {p.total_priority_score}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                        <span>{p.total_unit_count} units</span>
                        <span>{p.building_type}</span>
                        <span>{p.county_clean} Co.</span>
                      </div>
                    </div>
                  ))}
                  {nearbyProperties.length > 50 && (
                    <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                      +{nearbyProperties.length - 50} more properties
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Active location badge (when no nearby properties) */}
        {locationState === "active" && nearbyProperties.length === 0 && (
          <div className="absolute top-3 left-3 bg-white border border-blue-200 rounded-sm shadow-md px-3 py-2 z-10">
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Navigation className="w-3.5 h-3.5" />
              <span className="font-medium">No properties within {radiusMiles} mi</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Try increasing the search radius
            </p>
          </div>
        )}

        {/* Info Panel (right side) */}
        {selectedCluster && (
          <div className="absolute top-3 right-3 w-72 max-h-[420px] bg-white border border-border rounded-sm shadow-lg overflow-hidden z-10">
            <div className="px-3 py-2 bg-[oklch(0.22_0.06_250)] text-white flex items-center justify-between">
              <span className="text-xs font-semibold">
                {selectedCluster.properties.length === 1
                  ? selectedCluster.properties[0].property_name_clean
                  : `${selectedCluster.properties.length} Properties`}
              </span>
              <button
                onClick={() => { setSelectedCluster(null); onClusterSelectRef.current?.([]); }}
                className="text-white/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[370px]">
              {selectedCluster.properties.slice(0, 20).map((p) => {
                // Show distance if user location is active
                const dist =
                  userLocation && p.lat != null && p.lng != null
                    ? haversineDistance(userLocation.lat, userLocation.lng, p.lat, p.lng)
                    : null;

                return (
                  <div
                    key={p.property_id}
                    className="px-3 py-2 border-b border-border last:border-b-0 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          {p.property_name_clean}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {p.address_clean}, {p.city_clean}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {dist !== null && (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-sm">
                            {dist.toFixed(1)} mi
                          </span>
                        )}
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-sm text-white"
                          style={{ background: TIER_COLORS[p.priority_tier] }}
                        >
                          {p.total_priority_score}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                      <span>{p.total_unit_count} units</span>
                      <span>{p.building_type}</span>
                      {p.property_age_years != null && (
                        <span>{Math.round(p.property_age_years)} yr</span>
                      )}
                    </div>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address_clean}, ${p.city_clean}, NC ${p.zip_code}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-1 text-[10px] text-[oklch(0.55_0.15_240)] hover:underline"
                    >
                      <MapPin className="w-2.5 h-2.5" />
                      Directions
                    </a>
                  </div>
                );
              })}
              {selectedCluster.properties.length > 20 && (
                <div className="px-3 py-2 text-[10px] text-muted-foreground text-center">
                  +{selectedCluster.properties.length - 20} more properties
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
