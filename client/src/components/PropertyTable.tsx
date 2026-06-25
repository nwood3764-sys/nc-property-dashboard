import { ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronUp, Droplets, Shield, Home as HomeIcon, Users, Building, Layers, LayoutGrid, MapPin, BadgeDollarSign, Briefcase, ExternalLink, Zap, Clock, Globe, Search as SearchIcon, Flame, Plug, GitCompare } from "lucide-react";
import PropertyNoteEditor from "./PropertyNoteEditor";
import { useLocation } from "wouter";
import TierBadge from "./TierBadge";
import ScoreBar from "./ScoreBar";
import DisasterBadges from "./DisasterBadges";
import OutreachBadge from "./OutreachBadge";
import type { Property, SortField, SortDirection } from "@/lib/types";
import type { OutreachStatus } from "@/hooks/useOutreachStatus";
import { useState } from "react";

interface PropertyTableProps {
  properties: Property[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  getOutreachStatus: (id: number) => OutreachStatus;
  setOutreachStatus: (id: number, status: OutreachStatus) => void;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  getNote?: (id: number) => { text: string; updatedAt: string } | null;
  setNote?: (id: number, text: string) => void;
  compareIds?: Set<number>;
  onToggleCompare?: (id: number) => void;
  highlightId?: number | null;
  showDisasterColumn?: boolean;
}

function SortIcon({ field, currentField, direction }: { field: SortField; currentField: SortField; direction: SortDirection }) {
  if (field !== currentField) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
  return direction === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
}

const buildingTypeIcons: Record<string, string> = {
  "Group Home": "\u{1F3E0}",
  "Townhome": "\u{1F3D8}\uFE0F",
  "Garden / Villa": "\u{1F3E1}",
  "Garden Apartment": "\u{1F3E1}",
  "Small Apartment": "\u{1F3E2}",
  "Mid-Rise Apartment": "\u{1F3E2}",
  "Large Apartment": "\u{1F3D7}\uFE0F",
  "High-Rise": "\u{1F3D9}\uFE0F",
  "Senior Housing": "\u{1F3E5}",
  "Nursing / Healthcare": "\u{1F3E5}",
  "Assisted Living": "\u{1F3E5}",
};

function ExpandedRow({ property, getNote, setNote }: { property: Property; getNote?: (id: number) => { text: string; updatedAt: string } | null; setNote?: (id: number, text: string) => void }) {
  const p = property;
  return (
    <tr>
      <td colSpan={16} className="bg-muted/30 px-6 py-4 border-b border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 text-sm">
          {/* Property Details */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Property Details</h4>
            <div className="space-y-1">
              <p><span className="text-muted-foreground">Address:</span> {p.address_clean}</p>
              <p><span className="text-muted-foreground">City:</span> {p.city_clean}</p>
              <p><span className="text-muted-foreground">County:</span> {p.county_clean}</p>
              <p><span className="text-muted-foreground">ZIP:</span> {p.zip_code}</p>
              <p><span className="text-muted-foreground">Category:</span> {p.category_clean}</p>
              {p.fha_number && <p><span className="text-muted-foreground">FHA #:</span> {p.fha_number}</p>}
              {p.soa_clean && <p><span className="text-muted-foreground">SOA:</span> {p.soa_clean}</p>}
              {p.occupancy_date && <p><span className="text-muted-foreground">Occupancy Date:</span> {p.occupancy_date}</p>}
              {p.property_age_years != null && <p><span className="text-muted-foreground">Age:</span> {p.property_age_years} years</p>}
              {p.is_lihtc && (
                <p className="flex items-center gap-1">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm bg-[oklch(0.90_0.08_140)] text-[oklch(0.30_0.10_140)] text-xs font-semibold">
                    <BadgeDollarSign className="w-3 h-3" /> LIHTC
                  </span>
                  {p.lihtc_compliance && <span className="text-xs text-muted-foreground ml-1">{p.lihtc_compliance}</span>}
                </p>
              )}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address_clean}, ${p.city_clean}, ${p.state || 'NC'} ${p.zip_code}`)}`}
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
              {p.organization && (
                <>
                  <div className="mt-3 pt-2 border-t border-border/50">
                    <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-1">Owner / Management</h4>
                  </div>
                  <p><span className="text-muted-foreground">Organization:</span> <a href={`/org/${encodeURIComponent(p.organization!)}`} onClick={(e) => e.stopPropagation()} className="font-medium text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)] hover:underline transition-colors">{p.organization}</a></p>
                  {p.mgmt_agent && p.mgmt_agent !== p.organization && (
                    <p><span className="text-muted-foreground">Mgmt Agent:</span> <span className="font-medium">{p.mgmt_agent}</span></p>
                  )}
                  {p.owner_company && p.owner_company !== p.organization && (
                    <p><span className="text-muted-foreground">Owner/Developer:</span> <span className="font-medium">{p.owner_company}</span></p>
                  )}
                  {p.mgmt_phone && <p><span className="text-muted-foreground">Phone:</span> {p.mgmt_phone}</p>}
                  {p.mgmt_email && <p><span className="text-muted-foreground">Email:</span> {p.mgmt_email}</p>}
                </>
              )}
            </div>
          </div>

          {/* Flags */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Program Flags</h4>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_subsidized_ind ? "bg-[oklch(0.50_0.20_25)]" : "bg-gray-300"}`} />
                <span className={p.is_subsidized_ind ? "font-medium" : "text-muted-foreground"}>Subsidized</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_sec8_ind ? "bg-[oklch(0.50_0.20_25)]" : "bg-gray-300"}`} />
                <span className={p.is_sec8_ind ? "font-medium" : "text-muted-foreground"}>Section 8</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_202_811_ind ? "bg-[oklch(0.50_0.20_25)]" : "bg-gray-300"}`} />
                <span className={p.is_202_811_ind ? "font-medium" : "text-muted-foreground"}>202/811 Elderly/Disabled</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_nursing_home_ind ? "bg-[oklch(0.55_0.15_240)]" : "bg-gray-300"}`} />
                <span className={p.is_nursing_home_ind ? "font-medium" : "text-muted-foreground"}>Nursing Home</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_assisted_living_ind ? "bg-[oklch(0.55_0.15_240)]" : "bg-gray-300"}`} />
                <span className={p.is_assisted_living_ind ? "font-medium" : "text-muted-foreground"}>Assisted Living</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.coastal_flood_zone ? "bg-[oklch(0.55_0.15_240)]" : "bg-gray-300"}`} />
                <span className={p.coastal_flood_zone ? "font-medium" : "text-muted-foreground"}>Coastal Flood Zone</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${p.is_lihtc ? "bg-[oklch(0.50_0.15_140)]" : "bg-gray-300"}`} />
                <span className={p.is_lihtc ? "font-medium" : "text-muted-foreground"}>LIHTC</span>
              </div>
            </div>
          </div>

          {/* Utilities & Heating */}
          <div>
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Utilities & Heating</h4>
            <div className="space-y-1">
              {p.electricUtility && (
                <p className="flex items-center gap-1">
                  <Plug className="w-3 h-3 text-amber-600" />
                  <span className="text-muted-foreground">Electric:</span>
                  <span className="font-medium text-xs">{p.electricUtility}</span>
                </p>
              )}
              {p.electricRate != null && (
                <p className="ml-4"><span className="text-muted-foreground">Rate:</span> <span className="font-medium">{(p.electricRate * 100).toFixed(1)}¢/kWh</span></p>
              )}
              {p.gasUtility && (
                <p className="flex items-center gap-1">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span className="text-muted-foreground">Gas:</span>
                  <span className="font-medium text-xs">{p.gasUtility}</span>
                </p>
              )}
              {!p.hasGasService && (
                <p className="text-xs text-muted-foreground italic">No gas service available</p>
              )}
              {p.heatingSystemEstimate && (
                <p className="mt-1">
                  <span className="text-muted-foreground">Heating (Est.):</span>
                  <span className="font-medium ml-1 px-1.5 py-0.5 rounded-sm bg-orange-50 text-orange-800 text-xs">{p.heatingSystemEstimate}</span>
                </p>
              )}
            </div>
          </div>

          {/* Contract, Energy & Links */}
          <div>
            {/* Contract Expiration */}
            {p.contractExpiration && (
              <div className="mb-3">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Contract Info</h4>
                <div className="space-y-1">
                  <p><span className="text-muted-foreground">Contract #:</span> <span className="font-medium">{p.contractNumber}</span></p>
                  <p><span className="text-muted-foreground">Expires:</span> <span className={`font-medium ${p.yearsUntilExpiration != null && p.yearsUntilExpiration <= 5 ? 'text-[oklch(0.50_0.20_25)]' : ''}`}>{p.contractExpiration}</span></p>
                  {p.yearsUntilExpiration != null && (
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className={`font-semibold text-xs ${p.yearsUntilExpiration <= 2 ? 'text-[oklch(0.50_0.20_25)]' : p.yearsUntilExpiration <= 5 ? 'text-[oklch(0.60_0.17_60)]' : 'text-muted-foreground'}`}>
                        {p.yearsUntilExpiration > 0 ? `${p.yearsUntilExpiration} years remaining` : 'Expired'}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            )}
            {/* Energy Burden */}
            {p.energyBurdenPct != null && (
              <div className="mb-3">
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Energy Burden</h4>
                <div className="space-y-1">
                  <p className="flex items-center gap-1">
                    <Zap className={`w-3.5 h-3.5 ${p.energyBurdenPct >= 4 ? 'text-[oklch(0.50_0.20_25)]' : 'text-[oklch(0.60_0.17_60)]'}`} />
                    <span className={`font-semibold ${p.energyBurdenPct >= 4 ? 'text-[oklch(0.50_0.20_25)]' : ''}`}>{p.energyBurdenPct}%</span>
                    <span className="text-xs text-muted-foreground">of income (county avg)</span>
                  </p>
                  {p.avgMonthlyEnergy != null && (
                    <p><span className="text-muted-foreground">Avg Monthly Energy:</span> <span className="font-medium">${p.avgMonthlyEnergy}</span></p>
                  )}
                  {p.energyBurdenPct >= 4 && (
                    <p className="text-xs text-[oklch(0.50_0.20_25)] font-medium mt-1">High energy burden county</p>
                  )}
                </div>
              </div>
            )}
            {/* Profile Links */}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Research Links</h4>
              <div className="flex flex-wrap gap-1.5">
                {p.nhpdLink && (
                  <a href={p.nhpdLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-sm bg-[oklch(0.94_0.01_250)] text-[oklch(0.35_0.06_250)] hover:bg-[oklch(0.90_0.02_250)] transition-colors">
                    <Globe className="w-3 h-3" /> NHPD
                  </a>
                )}
                {p.affordableHousingLink && (
                  <a href={p.affordableHousingLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-sm bg-[oklch(0.94_0.01_250)] text-[oklch(0.35_0.06_250)] hover:bg-[oklch(0.90_0.02_250)] transition-colors">
                    <HomeIcon className="w-3 h-3" /> AffordableHousing
                  </a>
                )}
                {p.hudProfileLink && (
                  <a href={p.hudProfileLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-sm bg-[oklch(0.94_0.01_250)] text-[oklch(0.35_0.06_250)] hover:bg-[oklch(0.90_0.02_250)] transition-colors">
                    <Building className="w-3 h-3" /> HUD REAC
                  </a>
                )}
                {p.nchfaLink && (
                  <a href={p.nchfaLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-sm bg-[oklch(0.94_0.01_250)] text-[oklch(0.35_0.06_250)] hover:bg-[oklch(0.90_0.02_250)] transition-colors">
                    <Shield className="w-3 h-3" /> NCHFA
                  </a>
                )}
                {p.googleSearchLink && (
                  <a href={p.googleSearchLink} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-sm bg-[oklch(0.90_0.08_60)] text-[oklch(0.35_0.12_60)] hover:bg-[oklch(0.85_0.10_60)] transition-colors">
                    <SearchIcon className="w-3 h-3" /> Find Website
                  </a>
                )}
              </div>
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
        {/* Notes section — full width below the grid */}
        {setNote && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <PropertyNoteEditor propertyId={p.property_id} note={getNote?.(p.property_id) ?? null} onSave={setNote} />
          </div>
        )}
      </td>
    </tr>
  );
}

export default function PropertyTable({ properties, sortField, sortDirection, onSort, getOutreachStatus, setOutreachStatus, selectedIds, onToggleSelect, getNote, setNote, compareIds, onToggleCompare, highlightId, showDisasterColumn = true }: PropertyTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const tierRowClass: Record<string, string> = {
    Critical: "row-critical",
    High: "row-high",
    Medium: "row-medium",
    Low: "row-low",
  };

  const hasSelection = selectedIds !== undefined && onToggleSelect !== undefined;

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[oklch(0.22_0.06_250)] text-white">
              {hasSelection && (
                <th className="text-center px-2 py-3 w-8">
                  <span className="sr-only">Select</span>
                </th>
              )}
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider w-8"></th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("total_priority_score")}
              >
                <span className="flex items-center gap-1">
                  Score <SortIcon field="total_priority_score" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Tier</th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("property_name_clean")}
              >
                <span className="flex items-center gap-1">
                  Property <SortIcon field="property_name_clean" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("county_clean")}
              >
                <span className="flex items-center gap-1">
                  County <SortIcon field="county_clean" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("total_unit_count")}
              >
                <span className="flex items-center gap-1">
                  Units <SortIcon field="total_unit_count" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Type</th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("property_age_years")}
              >
                <span className="flex items-center gap-1">
                  Age <SortIcon field="property_age_years" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              {showDisasterColumn && <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Disasters</th>}
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Structure</th>
              <th
                className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => onSort("organization")}
              >
                <span className="flex items-center gap-1">
                  Org <SortIcon field="organization" currentField={sortField} direction={sortDirection} />
                </span>
              </th>
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Flags</th>
              <th className="text-left px-3 py-3 font-semibold text-xs uppercase tracking-wider">Status</th>
              {compareIds !== undefined && (
                <th className="text-center px-2 py-3 font-semibold text-xs uppercase tracking-wider w-10">
                  <GitCompare className="w-3.5 h-3.5 mx-auto" />
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {properties.map((p) => (
              <>
                <tr
                  key={p.property_id}
                  data-property-id={p.property_id}
                  className={`border-b border-border hover:bg-muted/40 transition-colors cursor-pointer ${tierRowClass[p.priority_tier]} ${hasSelection && selectedIds.has(p.property_id) ? "bg-[oklch(0.95_0.02_240)]" : ""} ${highlightId === p.property_id ? "ring-2 ring-blue-400 ring-inset bg-blue-50/60" : ""}`}
                  onClick={() => setExpandedId(expandedId === p.property_id ? null : p.property_id)}
                >
                  {hasSelection && (
                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.property_id)}
                        onChange={() => onToggleSelect(p.property_id)}
                        className="w-4 h-4 rounded border-border text-[oklch(0.40_0.06_250)] focus:ring-[oklch(0.40_0.06_250)] cursor-pointer"
                      />
                    </td>
                  )}
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
                      <p className="text-xs text-muted-foreground truncate">{p.city_clean}, {p.state || 'NC'} {p.zip_code}</p>
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
                      <span>{buildingTypeIcons[p.building_type] || "\u{1F3E2}"}</span>
                      {p.building_type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-sm tabular-nums">
                    {p.property_age_years != null ? `${p.property_age_years}yr` : "\u2014"}
                  </td>
                  {showDisasterColumn && (
                    <td className="px-3 py-3">
                      <DisasterBadges property={p} />
                    </td>
                  )}
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                      <span className="flex items-center gap-0.5" title="Estimated stories">
                        <Layers className="w-3 h-3" />
                        {p.est_stories}F
                      </span>
                      <span className="flex items-center gap-0.5" title="Estimated buildings">
                        <LayoutGrid className="w-3 h-3" />
                        {p.est_buildings}B
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {p.organization ? (
                      <div className="max-w-[160px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setLocation(`/org/${encodeURIComponent(p.organization!)}`);
                          }}
                          className="text-xs font-medium text-[oklch(0.40_0.06_250)] hover:text-[oklch(0.30_0.06_250)] hover:underline truncate block max-w-full text-left transition-colors"
                          title={`View all properties for ${p.organization}`}
                        >
                          {p.organization}
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">{"\u2014"}</span>
                    )}
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
                      {p.is_section9 && (
                        <span title="Section 9 Public Housing" className="w-5 h-5 rounded-sm bg-[oklch(0.88_0.06_180)] flex items-center justify-center">
                          <Building className="w-3 h-3 text-[oklch(0.35_0.15_180)]" />
                        </span>
                      )}
                      {p.is_epc_eligible && (
                        <span title="EPC Eligible" className="w-5 h-5 rounded-sm bg-[oklch(0.88_0.08_130)] flex items-center justify-center">
                          <Plug className="w-3 h-3 text-[oklch(0.35_0.12_130)]" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <OutreachBadge
                      status={getOutreachStatus(p.property_id)}
                      onChange={(s) => setOutreachStatus(p.property_id, s)}
                    />
                  </td>
                  {compareIds !== undefined && onToggleCompare && (
                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleCompare(p.property_id)}
                        disabled={!compareIds.has(p.property_id) && compareIds.size >= 4}
                        className={`w-6 h-6 rounded-sm flex items-center justify-center transition-colors ${
                          compareIds.has(p.property_id)
                            ? "bg-[oklch(0.40_0.06_250)] text-white"
                            : "bg-muted text-muted-foreground hover:bg-[oklch(0.85_0.02_250)] disabled:opacity-30 disabled:cursor-not-allowed"
                        }`}
                        title={compareIds.has(p.property_id) ? "Remove from comparison" : "Add to comparison (max 4)"}
                      >
                        <GitCompare className="w-3 h-3" />
                      </button>
                    </td>
                  )}
                </tr>
                {expandedId === p.property_id && (
                  <ExpandedRow key={`exp-${p.property_id}`} property={p} getNote={getNote} setNote={setNote} />
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
