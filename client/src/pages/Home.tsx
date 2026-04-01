/*
 * NC Property Outreach Priority Dashboard
 * Design: "Civic Blueprint" — Government Modernist
 * Colors: Navy (#1B3A5C) primary, white canvas, tier-coded alerts
 * Typography: Space Grotesk headings, Work Sans body
 * Layout: Wide single-column, sticky header, summary → map → charts → filters → table
 */

import { usePropertyData } from "@/hooks/usePropertyData";
import { useTeamAssignments } from "@/hooks/useTeamAssignments";
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
import TeamPanel from "@/components/TeamPanel";
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
} from "lucide-react";
import { useState, useCallback, useMemo } from "react";

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

  // Team assignments
  const {
    team,
    assignments,
    addMember,
    removeMember,
    assignProperty,
    bulkAssign,
    getAssignedMember,
    getWorkload,
    totalAssigned,
  } = useTeamAssignments();

  // Apply assignedTo filter on top of the already-filtered data
  const assignmentFiltered = useMemo(() => {
    if (filters.assignedTo === "all") return allFiltered;
    if (filters.assignedTo === "unassigned") {
      return allFiltered.filter((p) => !assignments[String(p.property_id)]);
    }
    // Filter to specific team member
    return allFiltered.filter((p) => assignments[String(p.property_id)] === filters.assignedTo);
  }, [allFiltered, filters.assignedTo, assignments]);

  // Paginate the assignment-filtered data
  const assignmentFilteredPage = useMemo(() => {
    const start = (page - 1) * pageSize;
    return assignmentFiltered.slice(start, start + pageSize);
  }, [assignmentFiltered, page, pageSize]);

  const assignmentTotalPages = Math.ceil(assignmentFiltered.length / pageSize);

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
    () => assignmentFiltered.filter((p) => compareIds.has(p.property_id)),
    [assignmentFiltered, compareIds]
  );

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const filteredIds = useMemo(() => assignmentFiltered.map((p) => p.property_id), [assignmentFiltered]);

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

  const handleBulkAssign = useCallback(
    (ids: number[], memberId: string | null) => {
      bulkAssign(ids, memberId);
    },
    [bulkAssign]
  );

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
          <ExportButton properties={assignmentFiltered} getOutreachStatus={getStatus} getAssignedMember={getAssignedMember} />
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

        {/* Team Panel */}
        <TeamPanel
          team={team}
          workload={getWorkload}
          totalAssigned={totalAssigned}
          totalProperties={assignmentFiltered.length}
          onAddMember={addMember}
          onRemoveMember={removeMember}
        />

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
              properties={assignmentFiltered}
              getOutreachStatus={getStatus}
              team={team}
              getAssignedMember={getAssignedMember}
              workload={getWorkload}
              totalAssigned={totalAssigned}
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
              Filtered: {assignmentFiltered.length.toLocaleString()} properties
            </span>
          </div>
          {showMap && <PropertyMap properties={assignmentFiltered} />}
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
        <AgeVintageChart properties={assignmentFiltered} />

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
              <ScoreDistribution properties={assignmentFiltered} />
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
          resultCount={assignmentFiltered.length}
          team={team}
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
          totalFiltered={assignmentFiltered.length}
          team={team}
          onBulkAssign={handleBulkAssign}
        />

        {/* Property Table */}
        <PropertyTable
          properties={assignmentFilteredPage}
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
          team={team}
          getAssignedMember={getAssignedMember}
          onAssignProperty={assignProperty}
        />

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

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={assignmentTotalPages}
          onPageChange={setPage}
          totalItems={assignmentFiltered.length}
          pageSize={pageSize}
        />

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
