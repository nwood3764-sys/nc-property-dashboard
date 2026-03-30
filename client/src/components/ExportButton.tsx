import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";

interface ExportButtonProps {
  properties: Property[];
}

export default function ExportButton({ properties }: ExportButtonProps) {
  const handleExport = () => {
    const headers = [
      "Priority Score", "Tier", "Property Name", "Address", "City", "County", "ZIP",
      "Total Units", "Assisted Units", "Building Type", "Est. Stories", "Est. Buildings",
      "Category", "Occupancy Date", "Age (Years)",
      "FHA Number", "SOA", "Subsidized", "Section 8", "202/811",
      "Helene", "Florence", "Matthew", "Dorian", "Flood Zone",
      "Age Score", "Disaster Score", "Flood Score", "Weatherization Score",
      "LIHTC", "Data Source",
      "Organization", "Owner/Developer", "Mgmt Agent", "Mgmt Phone", "Mgmt Email"
    ];

    const rows = properties.map((p) => [
      p.total_priority_score,
      p.priority_tier,
      `"${p.property_name_clean}"`,
      `"${p.address_clean}"`,
      `"${p.city_clean}"`,
      `"${p.county_clean}"`,
      p.zip_code,
      p.total_unit_count,
      p.total_assisted_unit_count,
      `"${p.building_type}"`,
      p.est_stories,
      p.est_buildings,
      `"${p.category_clean}"`,
      p.occupancy_date,
      p.property_age_years ?? "",
      p.fha_number ?? "",
      `"${p.soa_clean ?? ""}"`,
      p.is_subsidized_ind ? "Y" : "N",
      p.is_sec8_ind ? "Y" : "N",
      p.is_202_811_ind ? "Y" : "N",
      p.helene_affected ? "Y" : "N",
      p.florence_affected ? "Y" : "N",
      p.matthew_affected ? "Y" : "N",
      p.dorian_affected ? "Y" : "N",
      p.coastal_flood_zone ? "Y" : "N",
      p.age_score,
      p.disaster_score,
      p.flood_risk_score,
      p.weatherization_score,
      p.is_lihtc ? "Y" : "N",
      p.category_clean === "LIHTC" ? "LIHTC Only" : p.is_lihtc ? "HUD + LIHTC" : "HUD Only",
      `"${(p.organization ?? "").replace(/"/g, '""')}"`,
      `"${(p.owner_company ?? "").replace(/"/g, '""')}"`,
      `"${(p.mgmt_agent ?? "").replace(/"/g, '""')}"`,
      `"${p.mgmt_phone ?? ""}"`,
      `"${p.mgmt_email ?? ""}"`,
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nc-property-priorities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5">
      <Download className="w-3.5 h-3.5" />
      Export CSV ({properties.length.toLocaleString()})
    </Button>
  );
}
