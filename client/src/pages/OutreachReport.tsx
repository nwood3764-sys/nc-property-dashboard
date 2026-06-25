/**
 * Outreach Status Report Page
 * Full-page view showing all properties grouped by outreach status
 * with county/org breakdowns and export capability
 */

import { usePropertyData, STATE_NAMES } from "@/hooks/usePropertyData";
import { useOutreachStatus } from "@/hooks/useOutreachStatus";
import { Property } from "@/lib/types";
import {
  ArrowLeft,
  Download,
  Building2,
  MapPin,
  Users,
  Target,
  Phone,
  Loader2,
  CheckCircle2,
  Circle,
  Clock,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Link } from "wouter";

type StatusKey = "target" | "contacted" | "in_progress" | "complete" | "none";

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bgColor: string; borderColor: string; icon: React.ReactNode }> = {
  target: { label: "Target", color: "text-[oklch(0.50_0.15_310)]", bgColor: "bg-[oklch(0.96_0.04_310)]", borderColor: "border-[oklch(0.85_0.08_310)]", icon: <Target className="w-4 h-4" /> },
  contacted: { label: "Contacted", color: "text-amber-700", bgColor: "bg-amber-50", borderColor: "border-amber-200", icon: <Phone className="w-4 h-4" /> },
  in_progress: { label: "In Progress", color: "text-blue-700", bgColor: "bg-blue-50", borderColor: "border-blue-200", icon: <Loader2 className="w-4 h-4" /> },
  complete: { label: "Complete", color: "text-green-700", bgColor: "bg-green-50", borderColor: "border-green-200", icon: <CheckCircle2 className="w-4 h-4" /> },
  none: { label: "Not Started", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", icon: <Circle className="w-4 h-4" /> },
};

export default function OutreachReport() {
  const { allFiltered } = usePropertyData();
  const { getStatus, getCounts } = useOutreachStatus();
  const [activeTab, setActiveTab] = useState<StatusKey | "all">("all");
  const [selectedState, setSelectedState] = useState<string>("all");

  // Group properties by status
  const groupedByStatus = useMemo(() => {
    const groups: Record<StatusKey, Property[]> = {
      target: [],
      contacted: [],
      in_progress: [],
      complete: [],
      none: [],
    };
    allFiltered.forEach(p => {
      const status = (getStatus(p.property_id) || "none") as StatusKey;
      if (groups[status]) groups[status].push(p);
      else groups.none.push(p);
    });
    return groups;
  }, [allFiltered, getStatus]);

  // Filter by selected state
  const filteredGroups = useMemo(() => {
    if (selectedState === "all") return groupedByStatus;
    const filtered: Record<StatusKey, Property[]> = {
      target: [],
      contacted: [],
      in_progress: [],
      complete: [],
      none: [],
    };
    Object.entries(groupedByStatus).forEach(([key, props]) => {
      filtered[key as StatusKey] = props.filter(p => p.state === selectedState);
    });
    return filtered;
  }, [groupedByStatus, selectedState]);

  // Properties for the active tab
  const displayProperties = useMemo(() => {
    if (activeTab === "all") {
      return [...filteredGroups.target, ...filteredGroups.contacted, ...filteredGroups.in_progress, ...filteredGroups.complete];
    }
    return filteredGroups[activeTab];
  }, [activeTab, filteredGroups]);

  // County breakdown for active tab
  const countyBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    displayProperties.forEach(p => {
      const county = p.county_clean || "Unknown";
      counts[county] = (counts[county] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [displayProperties]);

  // Org breakdown for active tab
  const orgBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    displayProperties.forEach(p => {
      const org = p.organization || p.mgmt_agent || "Unknown";
      counts[org] = (counts[org] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1]);
  }, [displayProperties]);

  // Export CSV for current view
  const handleExport = () => {
    const headers = ["Property Name", "Address", "City", "State", "County", "Units", "Tier", "Status", "Organization", "Type"];
    const rows = displayProperties.map(p => [
      p.property_name_clean || "",
      p.address_clean || "",
      p.city_clean || "",
      p.state || "",
      p.county_clean || "",
      String(p.total_unit_count || ""),
      p.priority_tier || "",
      getStatus(p.property_id) || "none",
      p.organization || p.mgmt_agent || "",
      p.category_clean || "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const statusLabel = activeTab === "all" ? "all-active" : activeTab;
    a.download = `outreach-report-${statusLabel}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Show loading state if no data yet
  if (allFiltered.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[oklch(0.98_0.005_250)]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[oklch(0.35_0.06_250)]" />
          <p className="mt-3 text-sm text-muted-foreground">Loading outreach data...</p>
        </div>
      </div>
    );
  }

  const counts = getCounts();
  const totalActive = (counts.target || 0) + counts.contacted + counts.inProgress + counts.complete;

  return (
    <div className="min-h-screen bg-[oklch(0.98_0.005_250)]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[oklch(0.22_0.04_250)] text-white shadow-lg">
        <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Dashboard</span>
            </Link>
            <div className="h-5 w-px bg-white/20" />
            <h1 className="text-lg font-semibold font-[family-name:var(--font-heading)]">Outreach Status Report</h1>
          </div>
          <div className="flex items-center gap-3">
            {/* State filter */}
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="text-sm bg-white/10 border border-white/20 rounded px-2 py-1 text-white"
            >
              <option value="all" className="text-gray-900">All States</option>
              {Object.entries(STATE_NAMES).map(([code, name]) => (
                <option key={code} value={code} className="text-gray-900">{name}</option>
              ))}
            </select>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Export ({displayProperties.length})
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              activeTab === "all"
                ? "border-[oklch(0.35_0.06_250)] bg-[oklch(0.95_0.01_250)] shadow-md"
                : "border-gray-200 bg-white hover:border-gray-300"
            }`}
          >
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">All Active</div>
            <div className="text-2xl font-bold mt-1">{totalActive}</div>
            <div className="text-xs text-gray-500 mt-0.5">{allFiltered.length} total properties</div>
          </button>
          {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(key => {
            const config = STATUS_CONFIG[key];
            const count = key === "none"
              ? filteredGroups.none.length
              : filteredGroups[key].length;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  activeTab === key
                    ? `${config.borderColor} ${config.bgColor} shadow-md`
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className={`flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide ${config.color}`}>
                  {config.icon}
                  {config.label}
                </div>
                <div className="text-2xl font-bold mt-1">{count}</div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {count > 0 ? `${((count / allFiltered.length) * 100).toFixed(1)}%` : "—"}
                </div>
              </button>
            );
          })}
        </div>

        {/* Two-column layout: County + Org breakdowns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* County Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-[oklch(0.40_0.06_250)]" />
              <h3 className="font-semibold text-sm">By County</h3>
              <span className="text-xs text-gray-500 ml-auto">{countyBreakdown.length} counties</span>
            </div>
            {countyBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No properties in this status</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {countyBreakdown.map(([county, count]) => (
                  <div key={county} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate mr-2">{county}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[oklch(0.50_0.10_250)] rounded-full"
                          style={{ width: `${(count / countyBreakdown[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-500 font-mono text-xs w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Organization Breakdown */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[oklch(0.40_0.06_250)]" />
              <h3 className="font-semibold text-sm">By Organization</h3>
              <span className="text-xs text-gray-500 ml-auto">{orgBreakdown.length} orgs</span>
            </div>
            {orgBreakdown.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No properties in this status</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {orgBreakdown.map(([org, count]) => (
                  <div key={org} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 truncate mr-2 max-w-[200px]">{org}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[oklch(0.50_0.10_170)] rounded-full"
                          style={{ width: `${(count / orgBreakdown[0][1]) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-500 font-mono text-xs w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Property List */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[oklch(0.40_0.06_250)]" />
              <h3 className="font-semibold text-sm">
                {activeTab === "all" ? "All Active Properties" : `${STATUS_CONFIG[activeTab].label} Properties`}
              </h3>
              <span className="text-xs text-gray-500">({displayProperties.length})</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">Sorted by priority score</span>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Property</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Location</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                  <th className="text-right px-4 py-2.5 font-medium text-gray-600">Units</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Tier</th>
                  <th className="text-left px-4 py-2.5 font-medium text-gray-600">Organization</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayProperties.slice(0, 200).map(p => {
                  const status = (getStatus(p.property_id) || "none") as StatusKey;
                  const config = STATUS_CONFIG[status];
                  return (
                    <tr key={p.property_id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-medium text-gray-900 truncate max-w-[250px]">{p.property_name_clean}</div>
                        <div className="text-xs text-gray-500">{p.category_clean}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="text-gray-700">{p.city_clean}, {p.state}</div>
                        <div className="text-xs text-gray-500">{p.county_clean} County</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color} border ${config.borderColor}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-gray-700">{p.total_unit_count || "\u2014"}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                          p.priority_tier === "Critical" ? "bg-red-100 text-red-700" :
                          p.priority_tier === "High" ? "bg-amber-100 text-amber-700" :
                          p.priority_tier === "Medium" ? "bg-blue-100 text-blue-700" :
                          "bg-green-100 text-green-700"
                        }`}>
                          {p.priority_tier}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600 truncate max-w-[200px]">
                        {p.organization || p.mgmt_agent || "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {displayProperties.length > 200 && (
              <div className="px-4 py-3 text-center text-xs text-gray-500 border-t border-gray-100">
                Showing first 200 of {displayProperties.length} properties. Use Export to get the full list.
              </div>
            )}
            {displayProperties.length === 0 && (
              <div className="px-4 py-12 text-center text-gray-400">
                <Circle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No properties with this status</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
