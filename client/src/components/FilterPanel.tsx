import { Search, X, Filter, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Filters } from "@/lib/types";
import { useState } from "react";

interface FilterPanelProps {
  filters: Filters;
  updateFilter: (key: keyof Filters, value: any) => void;
  resetFilters: () => void;
  uniqueCounties: string[];
  uniqueCategories: string[];
  uniqueBuildingTypes: string[];
  resultCount: number;
}

export default function FilterPanel({
  filters,
  updateFilter,
  resetFilters,
  uniqueCounties,
  uniqueCategories,
  uniqueBuildingTypes,
  resultCount,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const tiers = ["Critical", "High", "Medium", "Low"];
  const disasters = ["Helene", "Florence", "Matthew", "Dorian"];

  const toggleTier = (tier: string) => {
    const next = new Set(filters.tiers);
    if (next.has(tier)) next.delete(tier);
    else next.add(tier);
    updateFilter("tiers", next);
  };

  const toggleDisaster = (d: string) => {
    const next = new Set(filters.disasters);
    if (next.has(d)) next.delete(d);
    else next.add(d);
    updateFilter("disasters", next);
  };

  const tierColors: Record<string, string> = {
    Critical: "bg-[oklch(0.50_0.20_25)] text-white",
    High: "bg-[oklch(0.65_0.17_60)] text-[oklch(0.20_0.10_60)]",
    Medium: "bg-[oklch(0.55_0.15_240)] text-white",
    Low: "bg-[oklch(0.50_0.15_155)] text-white",
  };

  const tierColorsInactive: Record<string, string> = {
    Critical: "border-[oklch(0.50_0.20_25)] text-[oklch(0.50_0.20_25)]",
    High: "border-[oklch(0.60_0.17_60)] text-[oklch(0.50_0.15_60)]",
    Medium: "border-[oklch(0.55_0.15_240)] text-[oklch(0.55_0.15_240)]",
    Low: "border-[oklch(0.45_0.15_155)] text-[oklch(0.45_0.15_155)]",
  };

  const hasActiveFilters =
    filters.search ||
    filters.tiers.size > 0 ||
    filters.counties.size > 0 ||
    filters.disasters.size > 0 ||
    filters.categories.size > 0 ||
    filters.buildingTypes.size > 0 ||
    filters.subsidizedOnly ||
    filters.sec8Only ||
    filters.elderlyDisabledOnly ||
    filters.floodZoneOnly;

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm">
      {/* Search + Toggle */}
      <div className="p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, address, city, county, ZIP, or building type..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="gap-1.5"
          >
            <Filter className="w-3.5 h-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 w-2 h-2 rounded-full bg-[oklch(0.50_0.20_25)]" />
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1 text-muted-foreground">
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          )}
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {resultCount.toLocaleString()} properties
          </span>
        </div>
      </div>

      {/* Tier quick-filters (always visible) */}
      <div className="px-4 pb-3 flex flex-wrap gap-2">
        {tiers.map((tier) => {
          const active = filters.tiers.has(tier);
          return (
            <button
              key={tier}
              onClick={() => toggleTier(tier)}
              className={`px-3 py-1 text-xs font-semibold rounded-sm border transition-colors ${
                active ? tierColors[tier] + " border-transparent" : tierColorsInactive[tier] + " bg-transparent"
              }`}
            >
              {tier}
            </button>
          );
        })}
      </div>

      {/* Expanded filters */}
      {expanded && (
        <div className="border-t border-border px-4 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Hurricane filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Hurricane / Disaster
            </label>
            <div className="space-y-1.5">
              {disasters.map((d) => (
                <label key={d} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox
                    checked={filters.disasters.has(d)}
                    onCheckedChange={() => toggleDisaster(d)}
                  />
                  {d === "Helene" ? "Helene (2024)" :
                   d === "Florence" ? "Florence (2018)" :
                   d === "Matthew" ? "Matthew (2016)" : "Dorian (2019)"}
                </label>
              ))}
            </div>
          </div>

          {/* County filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              County
            </label>
            <Select
              value={filters.counties.size === 1 ? Array.from(filters.counties)[0] : "all"}
              onValueChange={(val) => {
                if (val === "all") updateFilter("counties", new Set<string>());
                else updateFilter("counties", new Set([val]));
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All counties" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All counties</SelectItem>
                {uniqueCounties.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Building Type filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Building Type
            </label>
            <Select
              value={filters.buildingTypes.size === 1 ? Array.from(filters.buildingTypes)[0] : "all"}
              onValueChange={(val) => {
                if (val === "all") updateFilter("buildingTypes", new Set<string>());
                else updateFilter("buildingTypes", new Set([val]));
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {uniqueBuildingTypes.map((bt) => (
                  <SelectItem key={bt} value={bt}>{bt}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category filter */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Property Category
            </label>
            <Select
              value={filters.categories.size === 1 ? Array.from(filters.categories)[0] : "all"}
              onValueChange={(val) => {
                if (val === "all") updateFilter("categories", new Set<string>());
                else updateFilter("categories", new Set([val]));
              }}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {uniqueCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Boolean filters */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
              Property Flags
            </label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.subsidizedOnly}
                  onCheckedChange={(v) => updateFilter("subsidizedOnly", !!v)}
                />
                Subsidized
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.sec8Only}
                  onCheckedChange={(v) => updateFilter("sec8Only", !!v)}
                />
                Section 8
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.elderlyDisabledOnly}
                  onCheckedChange={(v) => updateFilter("elderlyDisabledOnly", !!v)}
                />
                202/811 Elderly/Disabled
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox
                  checked={filters.floodZoneOnly}
                  onCheckedChange={(v) => updateFilter("floodZoneOnly", !!v)}
                />
                Coastal Flood Zone
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
