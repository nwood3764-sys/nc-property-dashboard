/*
 * Organization Detail Drilldown Page
 * Design: "Civic Blueprint" — Government Modernist
 * Shows all properties for a given organization with aggregate stats,
 * a mini-map, tier breakdown, age distribution, and a full property table.
 */

import { useMemo, useState } from "react";
import { useLocation, useRoute } from "wouter";
import propertiesData from "@/data/properties.json";
import type { Property, SortField, SortDirection } from "@/lib/types";
import MetricCard from "@/components/MetricCard";
import TierBadge from "@/components/TierBadge";
import ScoreBar from "@/components/ScoreBar";
import DisasterBadges from "@/components/DisasterBadges";
import PropertyMap from "@/components/PropertyMap";
import {
  ArrowLeft,
  Building2,
  AlertTriangle,
  CloudLightning,
  Home as HomeIcon,
  MapPin,
  Calendar,
  Phone,
  Mail,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Layers,
  LayoutGrid,
  Shield,
  Users,
  Droplets,
  BadgeDollarSign,
  Briefcase,
  MapIcon,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const allProperties = propertiesData as Property[];

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return direction === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
}

const buildingTypeIcons: Record<string, string> = {
  "Group Home": "🏠",
  "Townhome": "🏘️",
  "Garden / Villa": "🏡",
  "Garden Apartment": "🏡",
  "Small Apartment": "🏢",
  "Mid-Rise Apartment": "🏢",
  "Large Apartment": "🏗️",
  "High-Rise": "🏙️",
  "Senior Housing": "🏥",
  "Nursing / Healthcare": "🏥",
  "Assisted Living": "🏥",
};

function ExpandedRow({ property }: { property: Property }) {
  const p = property;
  return (
    <tr>
      <td colSpan={10} className="bg-muted/30 px-6 py-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          {/* Property Details */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Property Details</h4>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Address:</span> {p.address_clean}</p>
              <p><span className="text-muted-foreground">City:</span> {p.city_clean}</p>
              <p><span className="text-muted-foreground">County:</span> {p.county_clean}</p>
              <p><span className="text-muted-foreground">ZIP:</span> {p.zip_code}</p>
              <p><span className="text-muted-foreground">Category:</span> {p.category_clean}</p>
              {p.occupancy_date && <p><span className="text-muted-foreground">Occupancy Date:</span> {p.occupancy_date}</p>}
              {p.property_age_years != null && <p><span className="text-muted-foreground">Age:</span> {p.property_age_years} years</p>}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address_clean}, ${p.city_clean}, NC ${p.zip_code}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-semibold rounded-sm bg-[oklch(0.55_0.15_240)] text-white hover:bg-[oklch(0.48_0.15_240)] transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                View on Google Maps
              </a>
            </div>
          </div>

          {/* Building Info */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Building Info</h4>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Building Type:</span> <span className="font-medium">{p.building_type}</span></p>
              <p><span className="text-muted-foreground">Total Units:</span> <span className="font-medium">{p.total_unit_count}</span></p>
              <p><span className="text-muted-foreground">Assisted Units:</span> <span className="font-medium">{p.total_assisted_unit_count}</span></p>
              <p><span className="text-muted-foreground">Est. Stories:</span> <span className="font-medium">{p.est_stories}</span></p>
              <p><span className="text-muted-foreground">Est. Buildings:</span> <span className="font-medium">{p.est_buildings}</span></p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Score Breakdown</h4>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">Age Score</span>
                  <span className="font-semibold">{p.age_score}/30</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[oklch(0.40_0.06_250)]" style={{ width: `${(p.age_score / 30) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">Disaster Score</span>
                  <span className="font-semibold">{p.disaster_score}/35</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[oklch(0.50_0.20_25)]" style={{ width: `${(p.disaster_score / 35) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">Flood Risk Score</span>
                  <span className="font-semibold">{p.flood_risk_score}/10</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[oklch(0.55_0.15_240)]" style={{ width: `${(p.flood_risk_score / 10) * 100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-muted-foreground">Weatherization Score</span>
                  <span className="font-semibold">{p.weatherization_score}/25</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-[oklch(0.45_0.15_155)]" style={{ width: `${(p.weatherization_score / 25) * 100}%` }} />
                </div>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex justify-between text-sm font-bold">
                  <span>Total Priority Score</span>
                  <span>{p.total_priority_score}/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
}

export default function OrgDetail() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/org/:orgName");
  const orgName = params?.orgName ? decodeURIComponent(params.orgName) : "";

  const [sortField, setSortField] = useState<SortField>("total_priority_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showMap, setShowMap] = useState(true);

  // Get all properties for this org
  const orgProperties = useMemo(() => {
    return allProperties.filter((p) => p.organization === orgName);
  }, [orgName]);

  // Sorted properties
  const sortedProperties = useMemo(() => {
    return [...orgProperties].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      if (aVal == null) aVal = sortDirection === "asc" ? Infinity : -Infinity;
      if (bVal == null) bVal = sortDirection === "asc" ? Infinity : -Infinity;
      if (typeof aVal === "string") {
        const cmp = aVal.localeCompare(bVal as string);
        return sortDirection === "asc" ? cmp : -cmp;
      }
      return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    });
  }, [orgProperties, sortField, sortDirection]);

  // Aggregate stats
  const stats = useMemo(() => {
    const props = orgProperties;
    const totalUnits = props.reduce((s, p) => s + (p.total_unit_count || 0), 0);
    const totalAssisted = props.reduce((s, p) => s + (p.total_assisted_unit_count || 0), 0);
    const ages = props.filter((p) => p.property_age_years != null).map((p) => p.property_age_years!);
    const avgAge = ages.length > 0 ? Math.round(ages.reduce((s, a) => s + a, 0) / ages.length) : null;
    const avgScore = props.length > 0 ? Math.round(props.reduce((s, p) => s + p.total_priority_score, 0) / props.length) : 0;
    const critical = props.filter((p) => p.priority_tier === "Critical").length;
    const high = props.filter((p) => p.priority_tier === "High").length;
    const medium = props.filter((p) => p.priority_tier === "Medium").length;
    const low = props.filter((p) => p.priority_tier === "Low").length;
    const disasterAffected = props.filter((p) => p.any_disaster).length;
    const uniqueCounties = new Set(props.map((p) => p.county_clean).filter(Boolean));
    const lihtcCount = props.filter((p) => p.is_lihtc).length;

    // Contact info from first property with data
    const withContact = props.find((p) => p.mgmt_phone || p.mgmt_email);
    const mgmtPhone = withContact?.mgmt_phone || null;
    const mgmtEmail = withContact?.mgmt_email || null;
    const mgmtAgent = props.find((p) => p.mgmt_agent)?.mgmt_agent || null;
    const ownerCompany = props.find((p) => p.owner_company)?.owner_company || null;

    return {
      total: props.length,
      totalUnits,
      totalAssisted,
      avgAge,
      avgScore,
      critical,
      high,
      medium,
      low,
      disasterAffected,
      uniqueCounties: Array.from(uniqueCounties).sort(),
      lihtcCount,
      mgmtPhone,
      mgmtEmail,
      mgmtAgent,
      ownerCompany,
    };
  }, [orgProperties]);

  // Tier breakdown for visual bar
  const tierData = useMemo(() => {
    const total = orgProperties.length || 1;
    return [
      { tier: "Critical", count: stats.critical, pct: Math.round((stats.critical / total) * 100), color: "oklch(0.50 0.20 25)" },
      { tier: "High", count: stats.high, pct: Math.round((stats.high / total) * 100), color: "oklch(0.60 0.17 60)" },
      { tier: "Medium", count: stats.medium, pct: Math.round((stats.medium / total) * 100), color: "oklch(0.55 0.15 240)" },
      { tier: "Low", count: stats.low, pct: Math.round((stats.low / total) * 100), color: "oklch(0.45 0.15 155)" },
    ];
  }, [orgProperties, stats]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const tierRowClass: Record<string, string> = {
    Critical: "row-critical",
    High: "row-high",
    Medium: "row-medium",
    Low: "row-low",
  };

  if (!orgName || orgProperties.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-[oklch(0.22_0.06_250)] text-white">
          <div className="container py-3 flex items-center gap-3">
            <button onClick={() => setLocation("/")} className="flex items-center gap-2 text-sm hover:text-white/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </button>
          </div>
        </header>
        <main className="container py-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="font-[Space_Grotesk] text-xl font-bold text-foreground mb-2">Organization Not Found</h2>
          <p className="text-muted-foreground mb-6">No properties found for this organization.</p>
          <button
            onClick={() => setLocation("/")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[oklch(0.30_0.06_250)] text-white rounded-sm text-sm font-medium hover:bg-[oklch(0.35_0.06_250)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Dashboard
          </button>
        </main>
      </div>
    );
  }

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
                Organization Detail
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)]"
                onClick={() => setLocation("/")}
              >
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium">{orgName}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Org Header */}
        <div className="bg-white border border-border rounded-sm shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-sm bg-[oklch(0.94_0.01_250)] flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />
                </div>
                <div>
                  <h2 className="font-[Space_Grotesk] text-xl font-bold text-foreground">{orgName}</h2>
                  <p className="text-sm text-muted-foreground">
                    {stats.total} properties across {stats.uniqueCounties.length} {stats.uniqueCounties.length === 1 ? "county" : "counties"}
                  </p>
                </div>
              </div>

              {/* Contact info */}
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                {stats.ownerCompany && stats.ownerCompany !== orgName && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5" />
                    Owner: <span className="font-medium text-foreground">{stats.ownerCompany}</span>
                  </span>
                )}
                {stats.mgmtAgent && stats.mgmtAgent !== orgName && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    Mgmt: <span className="font-medium text-foreground">{stats.mgmtAgent}</span>
                  </span>
                )}
                {stats.mgmtPhone && (
                  <a href={`tel:${stats.mgmtPhone}`} className="flex items-center gap-1.5 text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)] transition-colors">
                    <Phone className="w-3.5 h-3.5" />
                    {stats.mgmtPhone}
                  </a>
                )}
                {stats.mgmtEmail && (
                  <a href={`mailto:${stats.mgmtEmail}`} className="flex items-center gap-1.5 text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)] transition-colors">
                    <Mail className="w-3.5 h-3.5" />
                    {stats.mgmtEmail}
                  </a>
                )}
              </div>

              {/* Counties */}
              {stats.uniqueCounties.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {stats.uniqueCounties.map((c) => (
                    <span key={c} className="text-xs px-2 py-0.5 rounded-sm bg-muted text-muted-foreground font-medium">
                      {c}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Tier breakdown bar */}
            <div className="w-full md:w-64 shrink-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Priority Breakdown</p>
              <div className="flex h-6 rounded-sm overflow-hidden">
                {tierData.map((t) =>
                  t.count > 0 ? (
                    <div
                      key={t.tier}
                      className="flex items-center justify-center text-white text-[10px] font-bold"
                      style={{ width: `${t.pct}%`, backgroundColor: t.color, minWidth: t.count > 0 ? "20px" : "0" }}
                      title={`${t.tier}: ${t.count} (${t.pct}%)`}
                    >
                      {t.pct >= 10 ? t.count : ""}
                    </div>
                  ) : null
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                {tierData.map((t) => (
                  <span key={t.tier}>
                    <span className="inline-block w-2 h-2 rounded-full mr-0.5" style={{ backgroundColor: t.color }} />
                    {t.tier} {t.count}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <MetricCard
            label="Properties"
            value={stats.total}
            icon={<Building2 className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
          />
          <MetricCard
            label="Total Units"
            value={stats.totalUnits}
            icon={<HomeIcon className="w-5 h-5 text-[oklch(0.30_0.06_250)]" />}
            accent="oklch(0.94 0.01 250)"
            sub={`${stats.totalAssisted.toLocaleString()} assisted`}
          />
          <MetricCard
            label="Avg Priority Score"
            value={stats.avgScore}
            icon={<AlertTriangle className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.20 25)"
            sub="out of 100"
          />
          <MetricCard
            label="Avg Age"
            value={stats.avgAge ?? "N/A"}
            icon={<Calendar className="w-5 h-5 text-white" />}
            accent="oklch(0.55 0.15 240)"
            sub="years"
          />
          <MetricCard
            label="Disaster-Affected"
            value={stats.disasterAffected}
            icon={<CloudLightning className="w-5 h-5 text-white" />}
            accent="oklch(0.55 0.15 240)"
            sub={stats.total > 0 ? `${Math.round((stats.disasterAffected / stats.total) * 100)}% of portfolio` : ""}
          />
          <MetricCard
            label="LIHTC"
            value={stats.lihtcCount}
            icon={<BadgeDollarSign className="w-5 h-5 text-white" />}
            accent="oklch(0.50 0.15 140)"
            sub={stats.total > 0 ? `${Math.round((stats.lihtcCount / stats.total) * 100)}% of portfolio` : ""}
          />
        </div>

        {/* Map */}
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
          </div>
          {showMap && <PropertyMap properties={orgProperties} />}
        </div>

        {/* Property Table */}
        <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <h3 className="font-[Space_Grotesk] text-sm font-bold text-foreground">
              All Properties ({sortedProperties.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[oklch(0.22_0.06_250)] text-white">
                  <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-8"></th>
                  <th
                    className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("total_priority_score")}
                  >
                    <span className="flex items-center gap-1">
                      Score <SortIcon field="total_priority_score" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Tier</th>
                  <th
                    className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("property_name_clean")}
                  >
                    <span className="flex items-center gap-1">
                      Property <SortIcon field="property_name_clean" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                  <th
                    className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("county_clean")}
                  >
                    <span className="flex items-center gap-1">
                      County <SortIcon field="county_clean" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                  <th
                    className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("total_unit_count")}
                  >
                    <span className="flex items-center gap-1">
                      Units <SortIcon field="total_unit_count" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Type</th>
                  <th
                    className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleSort("property_age_years")}
                  >
                    <span className="flex items-center gap-1">
                      Age <SortIcon field="property_age_years" currentField={sortField} direction={sortDirection} />
                    </span>
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Disasters</th>
                  <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Flags</th>
                </tr>
              </thead>
              <tbody>
                {sortedProperties.map((p) => (
                  <>
                    <tr
                      key={p.property_id}
                      className={`border-b border-border hover:bg-muted/40 transition-colors cursor-pointer ${tierRowClass[p.priority_tier]}`}
                      onClick={() => setExpandedId(expandedId === p.property_id ? null : p.property_id)}
                    >
                      <td className="px-2 py-3 text-center">
                        {expandedId === p.property_id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <ScoreBar score={p.total_priority_score} tier={p.priority_tier} />
                      </td>
                      <td className="px-3 py-3">
                        <TierBadge tier={p.priority_tier} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="max-w-[220px]">
                          <p className="font-medium text-foreground truncate">{p.property_name_clean}</p>
                          <p className="text-xs text-muted-foreground truncate">{p.city_clean}, NC {p.zip_code}</p>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm">{p.county_clean}</td>
                      <td className="px-3 py-3">
                        <div className="text-sm tabular-nums">
                          <span className="font-semibold">{p.total_unit_count}</span>
                          {p.total_assisted_unit_count > 0 && (
                            <span className="text-xs text-muted-foreground ml-1">
                              ({p.total_assisted_unit_count} assisted)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-sm bg-muted text-foreground whitespace-nowrap">
                          <span>{buildingTypeIcons[p.building_type] || "🏢"}</span>
                          {p.building_type}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm tabular-nums">
                        {p.property_age_years != null ? `${p.property_age_years}yr` : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <DisasterBadges property={p} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex gap-1.5">
                          {p.is_subsidized_ind && (
                            <span title="Subsidized" className="w-5 h-5 rounded-sm bg-[oklch(0.94_0.01_250)] flex items-center justify-center">
                              <HomeIcon className="w-3 h-3 text-[oklch(0.40_0.06_250)]" />
                            </span>
                          )}
                          {p.is_sec8_ind && (
                            <span title="Section 8" className="w-5 h-5 rounded-sm bg-[oklch(0.94_0.01_250)] flex items-center justify-center">
                              <Shield className="w-3 h-3 text-[oklch(0.40_0.06_250)]" />
                            </span>
                          )}
                          {p.is_202_811_ind && (
                            <span title="202/811 Elderly/Disabled" className="w-5 h-5 rounded-sm bg-[oklch(0.94_0.01_250)] flex items-center justify-center">
                              <Users className="w-3 h-3 text-[oklch(0.40_0.06_250)]" />
                            </span>
                          )}
                          {p.coastal_flood_zone && (
                            <span title="Coastal Flood Zone" className="w-5 h-5 rounded-sm bg-[oklch(0.90_0.03_240)] flex items-center justify-center">
                              <Droplets className="w-3 h-3 text-[oklch(0.45_0.15_240)]" />
                            </span>
                          )}
                          {p.is_lihtc && (
                            <span title="LIHTC" className="w-5 h-5 rounded-sm bg-[oklch(0.90_0.08_140)] flex items-center justify-center">
                              <BadgeDollarSign className="w-3 h-3 text-[oklch(0.35_0.12_140)]" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === p.property_id && (
                      <ExpandedRow key={`exp-${p.property_id}`} property={p} />
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-4 pb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-muted-foreground">
            <button
              onClick={() => setLocation("/")}
              className="flex items-center gap-1.5 text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)] transition-colors font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>
            <p>Data sources: HUD Active Portfolio & HUD LIHTC Database</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
