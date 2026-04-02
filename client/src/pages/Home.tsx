/*
 * NC Property Outreach Priority Dashboard
 * Design: "Civic Blueprint" — Government Modernist
 * Colors: Navy (#1B3A5C) primary, white canvas, tier-coded alerts
 * Typography: Space Grotesk headings, Work Sans body
 * Layout: Wide single-column, sticky header, summary → map → charts → filters → table
 */

import { usePropertyData } from "@/hooks/usePropertyData";
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
  StickyNote,
  Flame,
  Plug,
  Navigation,
  Layers,
} from "lucide-react";
import { useState, useCallback, useMemo, useRef, useEffect } from "react";

const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663414053285/JQD4rA2CyVu8NYLQfUVcQm/hero-nc-properties-Y7pDgfAm2FyZMqQTf4db3A.webp";
const HURRICANE_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310519663414053285/JQD4rA2CyVu8NYLQfUVcQm/hurricane-impact-WmGfHhK8G8mV6xJCg5mTqW.webp";

export default function Home() {
  const {
    properties,
    allFiltered,
    stats,
    countyBreakdown,
    buildingTypeBreakdown,
    orgBreakdown,
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
  const outreachCounts = getCounts();
  const { getNote, setNote, getNotesCount } = usePropertyNotes();

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
  const [nearbyIds, setNearbyIds] = useState<Map<number, number>>(new Map()); // propertyId -> distance
  const [highlightId, setHighlightId] = useState<number | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  // Map sync state — filters table to match map viewport or cluster selection
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

  // When nearby mode is active, show only nearby properties in the table (sorted by distance)
  const nearbyProperties = useMemo(() => {
    if (!nearbyMode || nearbyIds.size === 0) return null;
    return allFiltered
      .filter(p => nearbyIds.has(p.property_id))
      .sort((a, b) => (nearbyIds.get(a.property_id) ?? 999) - (nearbyIds.get(b.property_id) ?? 999));
  }, [nearbyMode, nearbyIds, allFiltered]);

  // Map bounds change handler — called when map pans/zooms
  const handleBoundsChange = useCallback((ids: number[]) => {
    setVisiblePropertyIds(new Set(ids));
  }, []);

  // Cluster click handler — called when a cluster marker is clicked
  const handleClusterSelect = useCallback((ids: number[]) => {
    if (ids.length === 0) {
      setClusterPropertyIds(null);
    } else {
      setClusterPropertyIds(new Set(ids));
    }
  }, []);

  // Properties filtered by map viewport when sync is enabled
  const boundsFilteredProperties = useMemo(() => {
    if (!mapSyncEnabled || !visiblePropertyIds) return null;
    return allFiltered.filter(p => visiblePropertyIds.has(p.property_id));
  }, [mapSyncEnabled, visiblePropertyIds, allFiltered]);

  // Properties filtered by cluster selection
  const clusterFilteredProperties = useMemo(() => {
    if (!clusterPropertyIds) return null;
    return allFiltered.filter(p => clusterPropertyIds.has(p.property_id));
  }, [clusterPropertyIds, allFiltered]);

  // The properties to show in the table — priority: nearby > cluster > bounds sync > normal paginated
  const tableProperties = nearbyMode && nearbyProperties
    ? nearbyProperties
    : clusterFilteredProperties
      ? clusterFilteredProperties
      : mapSyncEnabled && boundsFilteredProperties
        ? boundsFilteredProperties
        : properties;

  // Whether any map-based filter is active (for hiding pagination)
  const isMapFiltered = nearbyMode || !!clusterFilteredProperties || (mapSyncEnabled && !!boundsFilteredProperties);

  const handlePropertyClickFromMap = useCallback((propertyId: number) => {
    setHighlightId(propertyId);
    // Scroll to the table and the specific row
    setTimeout(() => {
      const row = document.querySelector(`tr[data-property-id="${propertyId}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      } else if (tableRef.current) {
        tableRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 100);
    // Clear highlight after 3 seconds
    setTimeout(() => setHighlightId(null), 3000);
  }, []);

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
                NC Property Outreach Dashboard
              </h1>
              <p className="text-xs text-white/60">
                Weatherization, Electrification & Disaster Recovery Prioritization
              </p>
            </div>
          </div>
          <ExportButton properties={allFiltered} getOutreachStatus={getStatus} />
        </div>
      </header>

      {/* Hero Banner */}
      <div className="relative h-40 md:h-52 overflow-hidden">
        <img
          src={HERO_IMG}
          alt="North Carolina properties landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[oklch(0.22_0.06_250)]/80 to-[oklch(0.22_0.06_250)]/40" />
        <div className="absolute inset-0 flex items-center">
          <div className="container">
            <h2 className="font-[Space_Grotesk] text-2xl md:text-3xl font-bold text-white max-w-xl leading-tight">
              Prioritizing {stats.total.toLocaleString()} North Carolina Properties
            </h2>
            <p className="text-sm text-white/80 mt-2 max-w-lg">
              Identifying older HUD-assisted and LIHTC properties most in need of weatherization upgrades,
              electrification retrofits, and hurricane/flood damage recovery.
            </p>
          </div>
        </div>
      </div>

      <main className="container py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <MetricCard
            label="Total Properties"
            value={stats.total}
            icon={<Building2 className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
          />
          <MetricCard
            label="Total Units"
            value={stats.totalUnits}
            icon={<HomeIcon className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`${stats.totalAssistedUnits.toLocaleString()} assisted`}
          />
          <MetricCard
            label="Critical Priority"
            value={stats.critical}
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.20 25)"
            sub={`${stats.high} High`}
          />
          <MetricCard
            label="Disaster-Affected"
            value={stats.disasterAffected}
            icon={<CloudLightning className="w-5 h-5 text-white" />}
            accent="oklch(0.55 0.15 240)"
            sub={`${Math.round((stats.disasterAffected / stats.total) * 100)}% of total`}
          />
          <MetricCard
            label="Subsidized"
            value={stats.subsidized}
            icon={<Shield className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.15 155)"
            sub={`${Math.round((stats.subsidized / stats.total) * 100)}% of total`}
          />
          <MetricCard
            label="LIHTC Properties"
            value={stats.lihtcCount}
            icon={<TrendingUp className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.15 140)"
            sub={`${stats.lihtcOnlyCount} LIHTC-only / ${stats.hudLihtcOverlap} overlap`}
          />
          <MetricCard
            label="Organizations"
            value={stats.uniqueOrgs}
            icon={<Users className="w-5 h-5 text-white" />}
            accent="oklch(0.45 0.12 280)"
            sub={`${stats.withOrg.toLocaleString()} with org data`}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            label="With Contract Data"
            value={stats.withContract}
            icon={<Clock className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.15 280)"
            sub={`${stats.expiringIn5Yr} expiring within 5yr`}
          />
          <MetricCard
            label="High Energy Burden"
            value={stats.highEnergyBurden}
            icon={<Zap className="w-5 h-5 text-white" />}
            accent="oklch(0.55 0.18 40)"
            sub={`Avg ${stats.avgEnergyBurden}% of income`}
          />
          <MetricCard
            label="With Energy Data"
            value={stats.withEnergyBurden}
            icon={<Zap className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`${Math.round((stats.withEnergyBurden / stats.total) * 100)}% coverage`}
          />
          <MetricCard
            label="Avg Property Age"
            value={`${stats.avgAge}yr`}
            icon={<Calendar className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`Median ${stats.medianAge}yr`}
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
              {outreachCounts.complete + outreachCounts.contacted + outreachCounts.inProgress} of {stats.total.toLocaleString()} touched
            </span>
          </div>
          {showProgress && (
            <OutreachProgressDashboard
              properties={allFiltered}
              getOutreachStatus={getStatus}
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
              Filtered: {allFiltered.length.toLocaleString()} properties
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
                  title={mapSyncEnabled ? 'Click to stop syncing table with map' : 'Click to sync table with map viewport'}
                >
                  <Layers className="w-3.5 h-3.5" />
                  {mapSyncEnabled ? 'Map Sync On' : 'Sync Table with Map'}
                </button>
                {mapSyncEnabled && (
                  <span className="text-xs text-muted-foreground">
                    Pan or zoom the map to filter the table below
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

        {/* Disaster Context Banner */}
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
                FEMA Disaster Declarations
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

        {/* Age Vintage Chart — always visible as a key metric */}
        <AgeVintageChart properties={allFiltered} />

        {/* Scoring Methodology */}
        <ScoringMethodology />

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

        {/* Additional Charts */}
        {showCharts && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CountyChart data={countyBreakdown} />
              <ScoreDistribution properties={allFiltered} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BuildingTypeChart data={buildingTypeBreakdown} />
              <div className="bg-white border border-border rounded-sm shadow-sm p-4">
                <h3 className="font-[Space_Grotesk] text-sm font-bold text-foreground mb-3">
                  Top Organizations by Property Count
                </h3>
                <OrgChart data={orgBreakdown} />
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
          resultCount={allFiltered.length}
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
          totalFiltered={allFiltered.length}
        />

        {/* Map Filter Banners */}
        {nearbyMode && nearbyProperties && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-sm">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Showing {nearbyProperties.length} nearby {nearbyProperties.length === 1 ? 'property' : 'properties'}
            </span>
            <span className="text-xs text-blue-600">
              sorted by distance from your location
            </span>
            <span className="ml-auto text-xs text-blue-500">
              Turn off My Location on the map to see all properties
            </span>
          </div>
        )}
        {!nearbyMode && clusterFilteredProperties && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-sm">
            <Layers className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Showing {clusterFilteredProperties.length} {clusterFilteredProperties.length === 1 ? 'property' : 'properties'} from selected cluster
            </span>
            <button
              onClick={() => setClusterPropertyIds(null)}
              className="ml-auto text-xs font-medium text-amber-700 hover:text-amber-900 underline"
            >
              Clear cluster filter
            </button>
          </div>
        )}
        {!nearbyMode && !clusterFilteredProperties && mapSyncEnabled && boundsFilteredProperties && (
          <div className="flex items-center gap-3 px-4 py-2.5 bg-[oklch(0.96_0.01_250)] border border-[oklch(0.85_0.03_250)] rounded-sm">
            <Layers className="w-4 h-4 text-[oklch(0.40_0.06_250)]" />
            <span className="text-sm font-medium text-[oklch(0.25_0.06_250)]">
              Showing {boundsFilteredProperties.length} {boundsFilteredProperties.length === 1 ? 'property' : 'properties'} in map view
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
            sortField={nearbyMode ? sortField : sortField}
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
              Data sources: HUD Active Portfolio Property Data, HUD LIHTC Database, HUD Multifamily Contracts, DOE LEAD Energy Burden Data. Disaster data: FEMA disaster declarations (DR-4827, DR-4393, DR-4285, DR-4465).
            </p>
            <p>
              Last updated: March 2026
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
