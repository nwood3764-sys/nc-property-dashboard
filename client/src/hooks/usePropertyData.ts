import { useState, useMemo } from "react";
import propertiesData from "@/data/properties.json";
import type { Property, SortField, SortDirection, Filters } from "@/lib/types";

const allProperties = propertiesData as Property[];

const defaultFilters: Filters = {
  search: "",
  tiers: new Set<string>(),
  counties: new Set<string>(),
  disasters: new Set<string>(),
  categories: new Set<string>(),
  buildingTypes: new Set<string>(),
  subsidizedOnly: false,
  sec8Only: false,
  elderlyDisabledOnly: false,
  floodZoneOnly: false,
  lihtcOnly: false,
  dataSource: "all",
  organizations: new Set<string>(),
  ageRange: [0, 80],
  outreachStatus: "all",
};

export function usePropertyData() {
  const [sortField, setSortField] = useState<SortField>("total_priority_score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Unique values for filter dropdowns
  const uniqueCounties = useMemo(() => {
    return Array.from(new Set(allProperties.map((p) => p.county_clean))).filter(Boolean).sort();
  }, []);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(allProperties.map((p) => p.category_clean))).filter(Boolean).sort();
  }, []);

  const uniqueBuildingTypes = useMemo(() => {
    return Array.from(new Set(allProperties.map((p) => p.building_type))).filter(Boolean).sort();
  }, []);

  const uniqueOrganizations = useMemo(() => {
    const orgMap = new Map<string, number>();
    allProperties.forEach((p) => {
      const org = (p.organization || '').trim();
      if (org) orgMap.set(org, (orgMap.get(org) || 0) + 1);
    });
    return Array.from(orgMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, []);

  // Apply filters
  const filteredProperties = useMemo(() => {
    let result = allProperties;

    // Search — also search building type
    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.property_name_clean.toLowerCase().includes(q) ||
          p.address_clean.toLowerCase().includes(q) ||
          p.city_clean.toLowerCase().includes(q) ||
          p.county_clean.toLowerCase().includes(q) ||
          String(p.zip_code).includes(q) ||
          String(p.property_id).includes(q) ||
          (p.building_type && p.building_type.toLowerCase().includes(q)) ||
          (p.organization && p.organization.toLowerCase().includes(q))
      );
    }

    // Tier filter
    if (filters.tiers.size > 0) {
      result = result.filter((p) => filters.tiers.has(p.priority_tier));
    }

    // County filter
    if (filters.counties.size > 0) {
      result = result.filter((p) => filters.counties.has(p.county_clean));
    }

    // Disaster filter
    if (filters.disasters.size > 0) {
      result = result.filter((p) => {
        if (filters.disasters.has("Helene") && p.helene_affected) return true;
        if (filters.disasters.has("Florence") && p.florence_affected) return true;
        if (filters.disasters.has("Matthew") && p.matthew_affected) return true;
        if (filters.disasters.has("Dorian") && p.dorian_affected) return true;
        if (filters.disasters.has("Any") && p.any_disaster) return true;
        return false;
      });
    }

    // Category filter
    if (filters.categories.size > 0) {
      result = result.filter((p) => filters.categories.has(p.category_clean));
    }

    // Building type filter
    if (filters.buildingTypes.size > 0) {
      result = result.filter((p) => filters.buildingTypes.has(p.building_type));
    }

    // Boolean filters
    if (filters.subsidizedOnly) result = result.filter((p) => p.is_subsidized_ind);
    if (filters.sec8Only) result = result.filter((p) => p.is_sec8_ind);
    if (filters.elderlyDisabledOnly) result = result.filter((p) => p.is_202_811_ind);
    if (filters.floodZoneOnly) result = result.filter((p) => p.coastal_flood_zone);
    if (filters.lihtcOnly) result = result.filter((p) => p.is_lihtc);

    // Data source filter
    if (filters.dataSource === "hud") result = result.filter((p) => p.category_clean !== "LIHTC");
    else if (filters.dataSource === "lihtc") result = result.filter((p) => p.is_lihtc);
    else if (filters.dataSource === "both") result = result.filter((p) => p.is_lihtc && p.category_clean !== "LIHTC");

    // Organization filter
    if (filters.organizations.size > 0) {
      result = result.filter((p) => p.organization && filters.organizations.has(p.organization));
    }

    // Age range filter
    if (filters.ageRange[0] > 0 || filters.ageRange[1] < 80) {
      result = result.filter((p) => {
        if (p.property_age_years == null) return filters.ageRange[0] === 0;
        return p.property_age_years >= filters.ageRange[0] && p.property_age_years <= filters.ageRange[1];
      });
    }

    return result;
  }, [filters]);

  // Apply sorting
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties].sort((a, b) => {
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
    return sorted;
  }, [filteredProperties, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedProperties.length / pageSize);
  const paginatedProperties = sortedProperties.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

  // Summary stats for filtered data
  const stats = useMemo(() => {
    const fp = filteredProperties;
    const totalUnits = fp.reduce((s, p) => s + (p.total_unit_count || 0), 0);
    const totalAssistedUnits = fp.reduce((s, p) => s + (p.total_assisted_unit_count || 0), 0);
    return {
      total: fp.length,
      critical: fp.filter((p) => p.priority_tier === "Critical").length,
      high: fp.filter((p) => p.priority_tier === "High").length,
      medium: fp.filter((p) => p.priority_tier === "Medium").length,
      low: fp.filter((p) => p.priority_tier === "Low").length,
      disasterAffected: fp.filter((p) => p.any_disaster).length,
      subsidized: fp.filter((p) => p.is_subsidized_ind).length,
      avgScore: fp.length > 0 ? Math.round(fp.reduce((s, p) => s + p.total_priority_score, 0) / fp.length) : 0,
      floodZone: fp.filter((p) => p.coastal_flood_zone).length,
      totalUnits,
      totalAssistedUnits,
      lihtcCount: fp.filter((p) => p.is_lihtc).length,
      lihtcOnlyCount: fp.filter((p) => p.category_clean === "LIHTC").length,
      hudOnlyCount: fp.filter((p) => !p.is_lihtc).length,
      hudLihtcOverlap: fp.filter((p) => p.is_lihtc && p.category_clean !== "LIHTC").length,
      withOrg: fp.filter((p) => (p.organization || '').trim()).length,
      uniqueOrgs: new Set(fp.filter((p) => (p.organization || '').trim()).map((p) => p.organization!)).size,
    };
  }, [filteredProperties]);

  // County breakdown for chart
  const countyBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; critical: number; high: number; medium: number; low: number }>();
    filteredProperties.forEach((p) => {
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
  }, [filteredProperties]);

  // Building type breakdown for chart
  const buildingTypeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    filteredProperties.forEach((p) => {
      const bt = p.building_type || "Unknown";
      map.set(bt, (map.get(bt) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredProperties]);

  // Organization breakdown for chart (top 20)
  const orgBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; units: number; critical: number; high: number }>();
    filteredProperties.forEach((p) => {
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
  }, [filteredProperties]);

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
    setPage(1);
  };

  const updateFilter = (key: keyof Filters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(defaultFilters);
    setPage(1);
  };

  return {
    properties: paginatedProperties,
    allFiltered: sortedProperties,
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
  };
}
