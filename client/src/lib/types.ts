export interface Property {
  property_id: number;
  property_name_clean: string;
  address_clean: string;
  city_clean: string;
  county_clean: string;
  zip_code: string;
  total_unit_count: number;
  total_assisted_unit_count: number;
  category_clean: string;
  occupancy_date: string;
  property_age_years: number | null;
  fha_number: number | null;
  soa_clean: string | null;
  is_subsidized_ind: boolean;
  is_sec8_ind: boolean;
  is_202_811_ind: boolean;
  is_nursing_home_ind: boolean;
  is_assisted_living_ind: boolean;
  is_board_and_care_ind: boolean;
  helene_affected: boolean;
  florence_affected: boolean;
  matthew_affected: boolean;
  dorian_affected: boolean;
  any_disaster: boolean;
  coastal_flood_zone: boolean;
  age_score: number;
  disaster_score: number;
  flood_risk_score: number;
  weatherization_score: number;
  total_priority_score: number;
  priority_tier: "Critical" | "High" | "Medium" | "Low";
  building_type: string;
  est_stories: number;
  est_buildings: number;
  lat: number | null;
  lng: number | null;
  is_lihtc?: boolean;
  lihtc_compliance?: string;
}

export type SortField =
  | "total_priority_score"
  | "property_name_clean"
  | "county_clean"
  | "city_clean"
  | "property_age_years"
  | "disaster_score"
  | "weatherization_score"
  | "total_unit_count"
  | "est_stories"
  | "est_buildings";

export type SortDirection = "asc" | "desc";

export interface Filters {
  search: string;
  tiers: Set<string>;
  counties: Set<string>;
  disasters: Set<string>;
  categories: Set<string>;
  buildingTypes: Set<string>;
  subsidizedOnly: boolean;
  sec8Only: boolean;
  elderlyDisabledOnly: boolean;
  floodZoneOnly: boolean;
  lihtcOnly: boolean;
  dataSource: string;
}
