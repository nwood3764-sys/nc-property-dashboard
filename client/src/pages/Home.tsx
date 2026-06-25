/*
 * Property Outreach Priority Dashboard
 * Design: "Civic Blueprint" — Government Modernist
 * Colors: Navy (#1B3A5C) primary, white canvas, tier-coded alerts
 * Typography: Space Grotesk headings, Work Sans body
 * Layout: Wide single-column, sticky header, summary → map → charts → filters → table
 */

import { usePropertyData, STATE_NAMES } from "@/hooks/usePropertyData";
import MetricCard from "@/components/MetricCard";
import FilterPanel from "@/components/FilterPanel";
import PropertyTable from "@/components/PropertyTable";
import Pagination from "@/components/Pagination";
import CountyChart from "@/components/CountyChart";
import ScoreDistribution from "@/components/ScoreDistribution";
import BuildingTypeChart from "@/components/BuildingTypeChart";
import OrgChart from "@/components/OrgChart";
import AgeVintageChart from "@/components/AgeVintageChart";
import PropertyMap from "@/components/PropertyMap";
import ExportButton from "@/components/ExportButton";
import ScoringMethodology from "@/components/ScoringMethodology";
import BulkActionBar from "@/components/BulkActionBar";
import OutreachProgressDashboard from "@/components/OutreachProgressDashboard";
import PropertyCompare from "@/components/PropertyCompare";
import { useOutreachStatus } from "@/hooks/useOutreachStatus";
import { usePropertyNotes } from "@/hooks/usePropertyNotes";
import {
  AlertTriangle,
  Building2,
  CloudLightning,
  TrendingUp,
  Shield,
  BarChart3,
  Home as HomeIcon,
  MapIcon,
  Calendar,
  Users,
  ClipboardCheck,
  Activity,
  Clock,
  Zap,
  GitCompare,
  Navigation,
  Layers,
  Globe,
  Plug,
  Filter,
  X,
} from "lucide-react";
import { useState, useCallback, useMemo, useRef } from "react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663414053285/JQD4rA2CyVu8NYLQfUVcQm/hero-nc-properties-Y7pDgfAm2FyZMqQTf4db3A.webp";
const HURRICANE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663414053285/JQD4rA2CyVu8NYLQfUVcQm/hurricane-impact-WmGfHhK8G8mV6xJCg5mTqW.webp";

// Helper to compute summary stats from a property array
function computeStats(fp: any[]) {
  const totalUnits = fp.reduce((s: number, p: any) => s + (p.total_unit_count || 0), 0);
  const totalAssistedUnits = fp.reduce((s: number, p: any) => s + (p.total_assisted_unit_count || 0), 0);
  return {
    total: fp.length,
    critical: fp.filter((p: any) => p.priority_tier === "Critical").length,
    high: fp.filter((p: any) => p.priority_tier === "High").length,
    medium: fp.filter((p: any) => p.priority_tier === "Medium").length,
    low: fp.filter((p: any) => p.priority_tier === "Low").length,
    disasterAffected: fp.filter((p: any) => p.any_disaster).length,
    subsidized: fp.filter((p: any) => p.is_subsidized_ind).length,
    avgScore: fp.length > 0 ? Math.round(fp.reduce((s: number, p: any) => s + p.total_priority_score, 0) / fp.length) : 0,
    floodZone: fp.filter((p: any) => p.coastal_flood_zone).length,
    totalUnits,
    totalAssistedUnits,
    lihtcCount: fp.filter((p: any) => p.is_lihtc).length,
    lihtcOnlyCount: fp.filter((p: any) => p.category_clean === "LIHTC").length,
    hudOnlyCount: fp.filter((p: any) => !p.is_lihtc).length,
    hudLihtcOverlap: fp.filter((p: any) => p.is_lihtc && p.category_clean !== "LIHTC").length,
    withOrg: fp.filter((p: any) => (p.organization || '').trim()).length,
    uniqueOrgs: new Set(fp.filter((p: any) => (p.organization || '').trim()).map((p: any) => p.organization!)).size,
    withContract: fp.filter((p: any) => p.contractExpiration).length,
    expiringIn5Yr: fp.filter((p: any) => p.yearsUntilExpiration != null && p.yearsUntilExpiration <= 5).length,
    withEnergyBurden: fp.filter((p: any) => p.energyBurdenPct != null).length,
    highEnergyBurden: fp.filter((p: any) => (p.energyBurdenPct ?? 0) >= 4.0).length,
    avgEnergyBurden: fp.filter((p: any) => p.energyBurdenPct != null).length > 0
      ? Math.round(fp.filter((p: any) => p.energyBurdenPct != null).reduce((s: number, p: any) => s + (p.energyBurdenPct ?? 0), 0) / fp.filter((p: any) => p.energyBurdenPct != null).length * 10) / 10
      : 0,
    avgAge: (() => {
      const withAge = fp.filter((p: any) => p.property_age_years != null);
      return withAge.length > 0 ? Math.round(withAge.reduce((s: number, p: any) => s + p.property_age_years!, 0) / withAge.length) : 0;
    })(),
    medianAge: (() => {
      const ages = fp.filter((p: any) => p.property_age_years != null).map((p: any) => p.property_age_years!).sort((a: number, b: number) => a - b);
      if (ages.length === 0) return 0;
      const mid = Math.floor(ages.length / 2);
      return ages.length % 2 !== 0 ? ages[mid] : Math.round((ages[mid - 1] + ages[mid]) / 2);
    })(),
    section9Count: fp.filter((p: any) => p.is_section9).length,
    epcEligibleCount: fp.filter((p: any) => p.is_epc_eligible).length,
    section9Units: fp.filter((p: any) => p.is_section9).reduce((s: number, p: any) => s + (p.total_unit_count || 0), 0),
  };
}

// Helper to compute county breakdown from a property array
function computeCountyBreakdown(fp: any[]) {
  const map = new Map<string, { total: number; critical: number; high: number; medium: number; low: number }>();
  fp.forEach((p: any) => {
    const c = p.county_clean || "Unknown";
    if (!map.has(c)) map.set(c, { total: 0, critical: 0, high: 0, medium: 0, low: 0 });
    const entry = map.get(c)!;
    entry.total++;
    if (p.priority_tier === "Critical") entry.critical++;
    else if (p.priority_tier === "High") entry.high++;
    else if (p.priority_tier === "Medium") entry.medium++;
    else entry.low++;
  });
  return Array.from(map.entries())
    .map(([county, data]) => ({ county, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
}

// Helper to compute building type breakdown
function computeBuildingTypeBreakdown(fp: any[]) {
  const map = new Map<string, number>();
  fp.forEach((p: any) => {
    const bt = p.building_type || "Unknown";
    map.set(bt, (map.get(bt) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count);
}

// Helper to compute org breakdown
function computeOrgBreakdown(fp: any[]) {
  const map = new Map<string, { total: number; units: number; critical: number; high: number }>();
  fp.forEach((p: any) => {
    const org = (p.organization || '').trim();
    if (!org) return;
    if (!map.has(org)) map.set(org, { total: 0, units: 0, critical: 0, high: 0 });
    const entry = map.get(org)!;
    entry.total++;
    entry.units += p.total_unit_count || 0;
    if (p.priority_tier === 'Critical') entry.critical++;
    else if (p.priority_tier === 'High') entry.high++;
  });
  return Array.from(map.entries())
    .map(([org, data]) => ({ org, ...data }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 20);
}

// Build a label for the selected states
function stateLabel(selectedStates: Set<string>, allStates: string[]): string {
  if (selectedStates.size === 0 || selectedStates.size === allStates.length) {
    return allStates.map(s => s).join(", ");
  }
  return Array.from(selectedStates).join(", ");
}

function stateFullLabel(selectedStates: Set<string>, allStates: string[]): string {
  const active = selectedStates.size === 0 || selectedStates.size === allStates.length
    ? allStates
    : Array.from(selectedStates);
  return active.map(s => STATE_NAMES[s] || s).join(", ");
}

export default function Home() {
  const {
    properties,
    allFiltered,
    stats: baseStats,
    countyBreakdown: baseCountyBreakdown,
    buildingTypeBreakdown: baseBuildingTypeBreakdown,
    orgBreakdown: baseOrgBreakdown,
    sortField,
    sortDirection,
    handleSort,
    filters,
    updateFilter,
    resetFilters,
    page,
    setPage,
    totalPages,
    pageSize,
    uniqueStates,
    selectedStates,
    isNCVisible,
    uniqueCounties,
    uniqueCategories,
    uniqueBuildingTypes,
    uniqueOrganizations,
    uniqueElectricUtilities,
    uniqueHeatingTypes,
  } = usePropertyData();

  const [showMap, setShowMap] = useState(true);
  const [showCharts, setShowCharts] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const { getStatus, setStatus, setBulkStatus, getCounts } = useOutreachStatus();
  const { getNote, setNote, getNotesCount } = usePropertyNotes();

  // Whether NC is the ONLY selected state (for NC-exclusive elements)
  const isNCOnly = selectedStates.size === 1 && selectedStates.has("NC");
  // Whether NC is included at all (for showing disaster data alongside other states)
  const showDisasterElements = isNCVisible;

  // Comparison state
  const [compareIds, setCompareIds] = useState<Set<number>>(new Set());
  const [showCompare, setShowCompare] = useState(false);

  const handleToggleCompare = useCallback((id: number) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 4) next.add(id);
      return next;
    });
  }, []);

  const compareProperties = useMemo(
    () => allFiltered.filter((p) => compareIds.has(p.property_id)),
    [allFiltered, compareIds]
  );

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredIds = useMemo(() => allFiltered.map((p) => p.property_id), [allFiltered]);

  const handleToggleSelect = useCallback((id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    setSelectedIds(new Set(filteredIds));
  }, [filteredIds]);

  const handleDeselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const handleBulkUpdate = useCallback(
    (ids: number[], status: any) => {
      setBulkStatus(ids, status);
    },
    [setBulkStatus]
  );

  // Nearby mode state — syncs map GPS with the property table
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyIds, setNearbyIds] = useState<Map<number, number>>(new Map());
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Map sync state — filters entire dashboard to match map viewport or cluster selection
  const [mapSyncEnabled, setMapSyncEnabled] = useState(false);
  const [visiblePropertyIds, setVisiblePropertyIds] = useState<Set<number> | null>(null);
  const [clusterPropertyIds, setClusterPropertyIds] = useState<Set<number> | null>(null);

  const handleNearbyChange = useCallback((isActive: boolean, nearby: { propertyId: number; distance: number }[]) => {
    setNearbyMode(isActive);
    if (isActive) {
      const map = new Map<number, number>();
      nearby.forEach(n => map.set(n.propertyId, n.distance));
      setNearbyIds(map);
    } else {
      setNearbyIds(new Map());
      setHighlightId(null);
    }
  }, []);

  // Map bounds change handler
  const handleBoundsChange = useCallback((ids: number[]) => {
    setVisiblePropertyIds(new Set(ids));
  }, []);

  // Cluster click handler
  const handleClusterSelect = useCallback((ids: number[]) => {
    if (ids.length === 0) {
      setClusterPropertyIds(null);
    } else {
      setClusterPropertyIds(new Set(ids));
    }
  }, []);

  // Outreach status filter — applied here because it depends on getStatus from useOutreachStatus
  const statusFilteredProperties = useMemo(() => {
    if (!filters.outreachStatus || filters.outreachStatus === "all") return allFiltered;
    return allFiltered.filter(p => getStatus(p.property_id) === filters.outreachStatus);
  }, [allFiltered, filters.outreachStatus, getStatus]);

  // ===== CORE: displayProperties is the single source of truth for the entire dashboard =====
  // Priority: nearby > cluster > bounds sync > all filtered
  const displayProperties = useMemo(() => {
    // Nearby mode — show only nearby properties
    if (nearbyMode && nearbyIds.size > 0) {
      return statusFilteredProperties
        .filter(p => nearbyIds.has(p.property_id))
        .sort((a, b) => (nearbyIds.get(a.property_id) ?? 999) - (nearbyIds.get(b.property_id) ?? 999));
    }
    // Cluster filter — show only properties from clicked cluster
    if (clusterPropertyIds) {
      return statusFilteredProperties.filter(p => clusterPropertyIds.has(p.property_id));
    }
    // Map bounds sync — show only properties visible in map viewport
    if (mapSyncEnabled && visiblePropertyIds) {
      return statusFilteredProperties.filter(p => visiblePropertyIds.has(p.property_id));
    }
    // Default — all filtered properties
    return statusFilteredProperties;
  }, [nearbyMode, nearbyIds, clusterPropertyIds, mapSyncEnabled, visiblePropertyIds, statusFilteredProperties]);

  // Whether any map-based filter is active
  const isMapFiltered = nearbyMode || !!clusterPropertyIds || (mapSyncEnabled && !!visiblePropertyIds);

  // Whether any filter (map or status) requires recomputing stats/charts from displayProperties
  const needsRecompute = isMapFiltered || (filters.outreachStatus && filters.outreachStatus !== "all");

  // Recompute stats from displayProperties when map or status filter is active, otherwise use base stats
  const displayStats = useMemo(() => {
    if (!needsRecompute) return baseStats;
    return computeStats(displayProperties);
  }, [needsRecompute, displayProperties, baseStats]);

  // Recompute chart breakdowns from displayProperties when map or status filter is active
  const displayCountyBreakdown = useMemo(() => {
    if (!needsRecompute) return baseCountyBreakdown;
    return computeCountyBreakdown(displayProperties);
  }, [needsRecompute, displayProperties, baseCountyBreakdown]);

  const displayBuildingTypeBreakdown = useMemo(() => {
    if (!needsRecompute) return baseBuildingTypeBreakdown;
    return computeBuildingTypeBreakdown(displayProperties);
  }, [needsRecompute, displayProperties, baseBuildingTypeBreakdown]);

  const displayOrgBreakdown = useMemo(() => {
    if (!needsRecompute) return baseOrgBreakdown;
    return computeOrgBreakdown(displayProperties);
  }, [needsRecompute, displayProperties, baseOrgBreakdown]);

  // Outreach counts scoped to display properties
  const outreachCounts = useMemo(() => {
    const isStatusFiltered = filters.outreachStatus && filters.outreachStatus !== "all";
    if (!isMapFiltered && !isStatusFiltered) return getCounts();
    const counts = { target: 0, contacted: 0, inProgress: 0, complete: 0, total: 0 };
    displayProperties.forEach(p => {
      const status = getStatus(p.property_id);
      if (status === "target") { counts.target++; counts.total++; }
      else if (status === "contacted") { counts.contacted++; counts.total++; }
      else if (status === "in_progress") { counts.inProgress++; counts.total++; }
      else if (status === "complete") { counts.complete++; counts.total++; }
    });
    return counts;
  }, [isMapFiltered, displayProperties, getStatus, getCounts, filters.outreachStatus]);

  // Table properties — when map/status filtered, show all display properties (no pagination)
  // When not filtered, use normal paginated properties
  const isStatusFiltered = filters.outreachStatus && filters.outreachStatus !== "all";
  const tableProperties = (isMapFiltered || isStatusFiltered) ? displayProperties : properties;

  const handlePropertyClickFromMap = useCallback((propertyId: number) => {
    setHighlightId(propertyId);
    setTimeout(() => {
      const row = document.querySelector(`tr[data-property-id="${propertyId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    setTimeout(() => setHighlightId(null), 3000);
  }, []);

  // Label for the current map filter mode
  const mapFilterLabel = nearbyMode
    ? `Showing ${displayProperties.length} nearby properties`
    : clusterPropertyIds
      ? `Showing ${displayProperties.length} properties from cluster`
      : mapSyncEnabled && visiblePropertyIds
        ? `Showing ${displayProperties.length} properties in map view`
        : null;

  // Dynamic title based on selected states
  const headerTitle = useMemo(() => {
    const active = filters.states.size === 0 ? uniqueStates : Array.from(filters.states);
    if (active.length === 1) {
      return `${STATE_NAMES[active[0]] || active[0]} Property Outreach Dashboard`;
    }
    return "Multi-State Property Outreach Dashboard";
  }, [filters.states, uniqueStates]);

  const heroTitle = useMemo(() => {
    const active = filters.states.size === 0 ? uniqueStates : Array.from(filters.states);
    if (active.length === 1) {
      return `Prioritizing ${displayStats.total.toLocaleString()} ${STATE_NAMES[active[0]] || active[0]} Properties`;
    }
    return `Prioritizing ${displayStats.total.toLocaleString()} Properties Across ${active.length} States`;
  }, [filters.states, uniqueStates, displayStats.total]);

  const heroSubtitle = useMemo(() => {
    if (isNCOnly) {
      return "Identifying older HUD-assisted and LIHTC properties most in need of weatherization upgrades, electrification retrofits, and hurricane/flood damage recovery.";
    }
    return "Identifying older HUD-assisted and LIHTC properties most in need of weatherization upgrades and electrification retrofits.";
  }, [isNCOnly]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-[oklch(0.22_0.06_250)] text-white">
        <div className="container py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-white/10 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-[Space_Grotesk] text-lg font-bold leading-tight">
                {headerTitle}
              </h1>
              <p className="text-xs text-white/60">
                Weatherization, Electrification{isNCOnly ? " & Disaster Recovery" : ""} Prioritization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* State Selector */}
            <div className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-white/60" />
              {uniqueStates.map((st) => {
                const isActive = filters.states.size === 0 || filters.states.has(st);
                return (
                  <button
                    key={st}
                    onClick={() => {
                      const next = new Set(filters.states);
                      if (next.size === 0) {
                        // Currently showing all — select only this state
                        uniqueStates.forEach(s => { if (s !== st) next.add(s); });
                        // Actually, let's toggle to show only this state
                        updateFilter("states", new Set([st]));
                        return;
                      }
                      if (next.has(st)) {
                        next.delete(st);
                        if (next.size === 0) {
                          // Don't allow empty — show all
                          updateFilter("states", new Set<string>());
                          return;
                        }
                      } else {
                        next.add(st);
                        if (next.size === uniqueStates.length) {
                          // All selected — reset to show all
                          updateFilter("states", new Set<string>());
                          return;
                        }
                      }
                      updateFilter("states", next);
                    }}
                    className={`px-2.5 py-1 text-xs font-semibold rounded-sm transition-colors ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60"
                    }`}
                    title={STATE_NAMES[st] || st}
                  >
                    {st}
                  </button>
                );
              })}
            </div>
            <ExportButton properties={displayProperties} getOutreachStatus={getStatus} />
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-40 md:h-52 overflow-hidden">
        <img
          src={HERO_IMG}
          alt="Properties landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.22_0.06_250)]/80 to-[oklch(0.22_0.06_250)]/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <h2 className="font-[Space_Grotesk] text-2xl md:text-3xl font-bold text-white max-w-xl leading-tight">
              {heroTitle}
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-lg">
              {heroSubtitle}
            </p>
            {isMapFiltered && (
              <p className="text-xs text-white/60 mt-1">
                {mapFilterLabel} (of {allFiltered.length.toLocaleString()} total filtered)
              </p>
            )}
          </div>
        </div>
      </div>

      <main className="container py-6 space-y-6">
        {/* Map Filter Active Banner */}
        {isMapFiltered && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-sm">
            <Layers className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Dashboard filtered: {mapFilterLabel}
            </span>
            <span className="text-xs text-blue-600">
              All tiles, charts, and table below reflect this selection
            </span>
            {!nearbyMode && (
              <button
                onClick={() => {
                  setClusterPropertyIds(null);
                  setMapSyncEnabled(false);
                }}
                className="ml-auto text-xs font-medium text-blue-700 hover:text-blue-900 underline"
              >
                Clear map filter
              </button>
            )}
          </div>
        )}

        {/* Metric Cards */}
        <div className={`grid grid-cols-2 md:grid-cols-4 ${showDisasterElements ? "lg:grid-cols-8" : "lg:grid-cols-7"} gap-3`}>
          <MetricCard
            label="Total Properties"
            value={displayStats.total}
            icon={<Building2 className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
          />
          <MetricCard
            label="Total Units"
            value={displayStats.totalUnits}
            icon={<HomeIcon className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`${displayStats.totalAssistedUnits.toLocaleString()} assisted`}
          />
          <MetricCard
            label="Critical Priority"
            value={displayStats.critical}
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.20 25)"
            sub={`${displayStats.high} High`}
          />
          {/* Disaster-Affected tile — NC only */}
          {showDisasterElements && (
            <MetricCard
              label="Disaster-Affected"
              value={displayStats.disasterAffected}
              icon={<CloudLightning className="w-5 h-5 text-white" />}
              accent="oklch(0.55 0.15 240)"
              sub={`${displayStats.total > 0 ? Math.round((displayStats.disasterAffected / displayStats.total) * 100) : 0}% of total`}
            />
          )}
          <MetricCard
            label="Subsidized"
            value={displayStats.subsidized}
            icon={<Shield className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.15 155)"
            sub={`${displayStats.total > 0 ? Math.round((displayStats.subsidized / displayStats.total) * 100) : 0}% of total`}
          />
          <MetricCard
            label="LIHTC Properties"
            value={displayStats.lihtcCount}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.15 140)"
            sub={`${displayStats.lihtcOnlyCount} LIHTC-only / ${displayStats.hudLihtcOverlap} overlap`}
          />
          <MetricCard
            label="Organizations"
            value={displayStats.uniqueOrgs}
            icon={<Users className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.12 280)"
            sub={`${displayStats.withOrg.toLocaleString()} with org data`}
          />
          <MetricCard
            label="Outreach Progress"
            value={outreachCounts.complete}
            icon={<ClipboardCheck className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.15 155)"
            sub={`${outreachCounts.contacted} contacted / ${outreachCounts.inProgress} in progress`}
          />
        </div>

        {/* Second row: Contract & Energy metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <MetricCard
            label="With Contract Data"
            value={displayStats.withContract}
            icon={<Clock className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.15 280)"
            sub={`${displayStats.expiringIn5Yr} expiring within 5yr`}
          />
          <MetricCard
            label="High Energy Burden"
            value={displayStats.highEnergyBurden}
            icon={<Zap className="w-5 h-5 text-white" />}
            accent="oklch(0.55 0.18 40)"
            sub={`Avg ${displayStats.avgEnergyBurden}% of income`}
          />
          <MetricCard
            label="With Energy Data"
            value={displayStats.withEnergyBurden}
            icon={<Zap className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`${displayStats.total > 0 ? Math.round((displayStats.withEnergyBurden / displayStats.total) * 100) : 0}% coverage`}
          />
          <MetricCard
            label="Avg Property Age"
            value={`${displayStats.avgAge}yr`}
            icon={<Calendar className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`Median ${displayStats.medianAge}yr`}
          />
          <MetricCard
            label="Section 9 / EPC"
            value={displayStats.section9Count}
            icon={<Plug className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.18 180)"
            sub={`${displayStats.epcEligibleCount} EPC-eligible / ${displayStats.section9Units.toLocaleString()} units`}
          />
        </div>

        {/* Outreach Progress Dashboard Toggle */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowProgress(!showProgress)}
              className="flex items-center gap-2 text-sm font-medium text-[oklch(0.30_0.06_250)] hover:text-[oklch(0.40_0.06_250)] transition-colors"
            >
              <Activity className="w-4 h-4" />
              {showProgress ? "Hide Outreach Progress" : "Show Outreach Progress"}
            </button>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {outreachCounts.complete + outreachCounts.contacted + outreachCounts.inProgress} of {displayStats.total.toLocaleString()} touched
            </span>
          </div>
          {(showProgress || isStatusFiltered) && (
            <OutreachProgressDashboard
              properties={statusFilteredProperties}
              getOutreachStatus={getStatus}
              onStatusSelect={(status) => updateFilter("outreachStatus", status)}
              activeStatusFilter={filters.outreachStatus}
            />
          )}
        </div>

        {/* Map Section */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setShowMap(!showMap)}
              className="flex items-center gap-2 text-sm font-medium text-[oklch(0.30_0.06_250)] hover:text-[oklch(0.40_0.06_250)] transition-colors"
            >
              <MapIcon className="w-4 h-4" />
              {showMap ? "Hide Map" : "Show Map"}
            </button>
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">
              {isMapFiltered
                ? `${displayProperties.length.toLocaleString()} of ${allFiltered.length.toLocaleString()} properties`
                : `Filtered: ${allFiltered.length.toLocaleString()} properties`
              }
            </span>
          </div>
          {showMap && (
            <>
              {/* Map Sync Toggle */}
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setMapSyncEnabled(!mapSyncEnabled);
                    if (mapSyncEnabled) {
                      setClusterPropertyIds(null);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-sm border transition-colors ${
                    mapSyncEnabled
                      ? 'bg-[oklch(0.30_0.06_250)] text-white border-[oklch(0.30_0.06_250)]'
                      : 'bg-white text-[oklch(0.30_0.06_250)] border-border hover:bg-muted/50'
                  }`}
                  title={mapSyncEnabled ? 'Click to stop syncing dashboard with map' : 'Click to sync entire dashboard with map viewport'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {mapSyncEnabled ? 'Dashboard Sync On' : 'Sync Dashboard with Map'}
                </button>
                {mapSyncEnabled && (
                  <span className="text-xs text-muted-foreground">
                    Pan or zoom the map — tiles, charts, and table update live
                  </span>
                )}
                {clusterPropertyIds && (
                  <button
                    onClick={() => setClusterPropertyIds(null)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-sm bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                  >
                    Clear Cluster Filter
                  </button>
                )}
              </div>
              {/* Map always receives ALL filtered properties so all markers are visible */}
              <PropertyMap
                properties={allFiltered}
                onNearbyChange={handleNearbyChange}
                onPropertyClick={handlePropertyClickFromMap}
                onBoundsChange={handleBoundsChange}
                onClusterSelect={handleClusterSelect}
              />
            </>
          )}
        </div>

        {/* Disaster Context Banner — NC only */}
        {showDisasterElements && (
          <div className="relative rounded-sm overflow-hidden border border-border">
            <img
              src={HURRICANE_IMG}
              alt="Hurricane damage to housing"
              className="w-full h-32 md:h-40 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.15_0.02_250)]/90 via-[oklch(0.15_0.02_250)]/70 to-transparent" />
            <div className="absolute inset-0 flex items-center">
              <div className="px-6 max-w-xl">
                <h3 className="font-[Space_Grotesk] text-white font-bold text-base md:text-lg">
                  FEMA Disaster Declarations (North Carolina)
                </h3>
                <p className="text-white/80 text-xs md:text-sm mt-1 leading-relaxed">
                  NC has been impacted by 4 major hurricanes since 2016. Properties in declared disaster
                  counties receive elevated priority scores — especially those hit by multiple events.
                </p>
                <div className="flex gap-4 mt-2 text-xs text-white/70">
                  <span>Helene 2024: 39 counties</span>
                  <span>Florence 2018: 30 counties</span>
                  <span>Matthew 2016: 28 counties</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Age Vintage Chart — uses displayProperties */}
        <AgeVintageChart properties={displayProperties} />

        {/* Scoring Methodology */}
        <ScoringMethodology showDisaster={showDisasterElements} />

        {/* Charts Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex items-center gap-2 text-sm font-medium text-[oklch(0.30_0.06_250)] hover:text-[oklch(0.40_0.06_250)] transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            {showCharts ? "Hide Additional Charts" : "Show Additional Charts"}
          </button>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Additional Charts — all use displayProperties-scoped breakdowns */}
        {showCharts && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CountyChart data={displayCountyBreakdown} />
              <ScoreDistribution properties={displayProperties} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BuildingTypeChart data={displayBuildingTypeBreakdown} />
              <div className="bg-white border border-border rounded-sm shadow-sm p-4">
                <h3 className="font-[Space_Grotesk] text-sm font-bold text-foreground mb-3">
                  Top Organizations by Property Count
                </h3>
                <OrgChart data={displayOrgBreakdown} />
              </div>
            </div>
          </>
        )}

        {/* Filters */}
        <FilterPanel
          filters={filters}
          updateFilter={updateFilter}
          resetFilters={resetFilters}
          uniqueCounties={uniqueCounties}
          uniqueCategories={uniqueCategories}
          uniqueBuildingTypes={uniqueBuildingTypes}
          uniqueOrganizations={uniqueOrganizations}
          uniqueElectricUtilities={uniqueElectricUtilities}
          uniqueHeatingTypes={uniqueHeatingTypes}
          resultCount={displayProperties.length}
          showDisasterFilters={showDisasterElements}
        />

        {/* Compare Bar */}
        {compareIds.size > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[oklch(0.94_0.02_250)] border border-[oklch(0.80_0.04_250)] rounded-sm">
            <GitCompare className="w-4 h-4 text-[oklch(0.35_0.06_250)]" />
            <span className="text-sm font-medium text-[oklch(0.30_0.06_250)]">
              {compareIds.size} selected for comparison
            </span>
            <button
              onClick={() => setShowCompare(true)}
              disabled={compareIds.size < 2}
              className="ml-2 px-3 py-1 text-xs font-semibold rounded-sm bg-[oklch(0.30_0.06_250)] text-white hover:bg-[oklch(0.25_0.06_250)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Compare ({compareIds.size})
            </button>
            <button
              onClick={() => setCompareIds(new Set())}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedIds={selectedIds}
          filteredIds={filteredIds}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkUpdate={handleBulkUpdate}
          totalFiltered={displayProperties.length}
        />

        {/* Status Filter Banner */}
        {filters.outreachStatus && filters.outreachStatus !== "all" && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[oklch(0.96_0.02_280)] border border-[oklch(0.85_0.05_280)] rounded-sm">
            <Filter className="w-4 h-4 text-[oklch(0.40_0.10_280)]" />
            <span className="text-sm font-medium text-[oklch(0.25_0.08_280)]">
              Filtered to: <span className="font-bold capitalize">{filters.outreachStatus === "in_progress" ? "In Progress" : filters.outreachStatus === "none" ? "Not Started" : filters.outreachStatus}</span>
            </span>
            <span className="text-xs text-[oklch(0.45_0.06_280)]">
              {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'}
            </span>
            <button
              onClick={() => updateFilter("outreachStatus", "all")}
              className="ml-auto flex items-center gap-1 text-xs font-medium text-[oklch(0.40_0.08_280)] hover:text-[oklch(0.30_0.10_280)] transition-colors"
            >
              <X className="w-3 h-3" />
              Clear status filter
            </button>
          </div>
        )}

        {/* Map Filter Context Banners */}
        {nearbyMode && displayProperties.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-sm">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Showing {displayProperties.length} nearby {displayProperties.length === 1 ? 'property' : 'properties'}
            </span>
            <span className="text-xs text-blue-600">
              sorted by distance from your location
            </span>
            <span className="ml-auto text-xs text-blue-500">
              Turn off My Location on the map to see all properties
            </span>
          </div>
        )}
        {!nearbyMode && clusterPropertyIds && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-sm">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Showing {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'} from selected cluster
            </span>
            <button
              onClick={() => setClusterPropertyIds(null)}
              className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Clear cluster filter
            </button>
          </div>
        )}
        {!nearbyMode && !clusterPropertyIds && mapSyncEnabled && visiblePropertyIds && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[oklch(0.96_0.01_250)] border border-[oklch(0.85_0.03_250)] rounded-sm">
            <Layers className="w-4 h-4 text-[oklch(0.40_0.06_250)]" />
            <span className="text-sm font-medium text-[oklch(0.25_0.06_250)]">
              Showing {displayProperties.length} {displayProperties.length === 1 ? 'property' : 'properties'} in map view
            </span>
            <span className="text-xs text-[oklch(0.45_0.04_250)]">
              Pan or zoom the map to update
            </span>
          </div>
        )}

        {/* Property Table */}
        <div ref={tableRef}>
          <PropertyTable
            properties={tableProperties}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
            getOutreachStatus={getStatus}
            setOutreachStatus={setStatus}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            getNote={getNote}
            setNote={setNote}
            compareIds={compareIds}
            onToggleCompare={handleToggleCompare}
            highlightId={highlightId}
            showDisasterColumn={showDisasterElements}
          />
        </div>

        {/* Comparison Modal */}
        {showCompare && compareProperties.length >= 2 && (
          <PropertyCompare
            properties={compareProperties}
            onRemove={(id) => {
              setCompareIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                if (next.size < 2) setShowCompare(false);
                return next;
              });
            }}
            onClose={() => setShowCompare(false)}
            getOutreachStatus={getStatus}
            getNote={getNote}
          />
        )}

        {/* Pagination — hidden when any map-based filter is active */}
        {!isMapFiltered && (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalItems={allFiltered.length}
            pageSize={pageSize}
          />
        )}

        {/* Footer */}
        <footer className="border-t border-border pt-4 pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-muted-foreground">
            <p>
              Data sources: HUD Active Portfolio Property Data, HUD LIHTC Database, HUD Multifamily Contracts, DOE LEAD Energy Burden Data.{isNCOnly ? " Disaster data: FEMA disaster declarations (DR-4827, DR-4393, DR-4285, DR-4465)." : ""}
            </p>
            <p>
              Last updated: April 2026
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
