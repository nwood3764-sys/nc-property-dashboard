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
} from "lucide-react";
import { useState } from "react";

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
  } = usePropertyData();

  const [showMap, setShowMap] = useState(true);
  const [showCharts, setShowCharts] = useState(false);

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
          <ExportButton properties={allFiltered} />
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
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
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
          {showMap && <PropertyMap properties={allFiltered} />}
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
          resultCount={allFiltered.length}
        />

        {/* Property Table */}
        <PropertyTable
          properties={properties}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          totalItems={allFiltered.length}
          pageSize={pageSize}
        />

        {/* Footer */}
        <footer className="border-t border-border pt-4 pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-muted-foreground">
            <p>
              Data sources: HUD Active Portfolio Property Data & HUD LIHTC Database. Disaster data: FEMA disaster declarations (DR-4827, DR-4393, DR-4285, DR-4465).
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
