/*
 * PropertyMap — Interactive Google Map with clustered markers for NC properties
 * Design: Civic Blueprint — tier-colored markers, cluster aggregation
 * Uses the built-in MapView component with Google Maps proxy
 */

/// <reference types="@types/google.maps" />

import { MapView } from "@/components/Map";
import type { Property } from "@/lib/types";
import { useRef, useEffect, useState, useCallback } from "react";
import { MapPin, Layers, X } from "lucide-react";

interface PropertyMapProps {
  properties: Property[];
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

interface ClusterGroup {
  lat: number;
  lng: number;
  properties: Property[];
  tiers: Record<string, number>;
}

function clusterProperties(properties: Property[], zoom: number): ClusterGroup[] {
  // Grid-based clustering — cell size decreases as zoom increases
  const cellSize = 180 / Math.pow(2, zoom); // degrees per cell
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

export default function PropertyMap({ properties }: PropertyMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<ClusterGroup | null>(null);
  const [currentZoom, setCurrentZoom] = useState(NC_ZOOM);
  const [isMapReady, setIsMapReady] = useState(false);

  const geoProperties = properties.filter((p) => p.lat != null && p.lng != null);

  const clearMarkers = useCallback(() => {
    for (const m of markersRef.current) {
      m.map = null;
    }
    markersRef.current = [];
  }, []);

  const renderMarkers = useCallback(
    (zoom: number) => {
      if (!mapRef.current || !isMapReady) return;
      clearMarkers();

      const clusters = clusterProperties(geoProperties, zoom);

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
          } else if (zoom < 14) {
            mapRef.current?.setZoom(zoom + 2);
            mapRef.current?.panTo({ lat: cluster.lat, lng: cluster.lng });
          } else {
            setSelectedCluster(cluster);
          }
        });

        markersRef.current.push(marker);
      }
    },
    [geoProperties, clearMarkers, isMapReady]
  );

  // Re-render markers when properties or zoom changes
  useEffect(() => {
    renderMarkers(currentZoom);
  }, [renderMarkers, currentZoom]);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      setIsMapReady(true);

      map.addListener("zoom_changed", () => {
        const z = map.getZoom();
        if (z != null) setCurrentZoom(z);
      });
    },
    []
  );

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      {/* Map Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[oklch(0.30_0.06_250)]" />
          <h3 className="font-[Space_Grotesk] font-semibold text-sm">
            Property Locations
          </h3>
          <span className="text-xs text-muted-foreground">
            {geoProperties.length} mapped
          </span>
        </div>
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

      {/* Map */}
      <div className="relative">
        <MapView
          className="h-[480px]"
          initialCenter={NC_CENTER}
          initialZoom={NC_ZOOM}
          onMapReady={handleMapReady}
        />

        {/* Info Panel */}
        {selectedCluster && (
          <div className="absolute top-3 right-3 w-72 max-h-[420px] bg-white border border-border rounded-sm shadow-lg overflow-hidden z-10">
            <div className="px-3 py-2 bg-[oklch(0.22_0.06_250)] text-white flex items-center justify-between">
              <span className="text-xs font-semibold">
                {selectedCluster.properties.length === 1
                  ? selectedCluster.properties[0].property_name_clean
                  : `${selectedCluster.properties.length} Properties`}
              </span>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[370px]">
              {selectedCluster.properties.slice(0, 20).map((p) => (
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
                    Google Maps
                  </a>
                </div>
              ))}
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
