import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Property } from "@/lib/types";
import type { OutreachStatus } from "@/hooks/useOutreachStatus";

const statusLabels: Record<OutreachStatus, string> = {
  none: "Not Started",
  target: "Target",
  contacted: "Contacted",
  in_progress: "In Progress",
  complete: "Complete",
};

interface ExportButtonProps {
  properties: Property[];
  getOutreachStatus?: (id: number) => OutreachStatus;
}

export default function ExportButton({ properties, getOutreachStatus }: ExportButtonProps) {
  const handleExport = () => {
    const headers = [
      "Priority Score", "Tier", "State", "Property Name", "Address", "City", "County", "ZIP",
      "Total Units", "Assisted Units", "Building Type", "Est. Stories", "Est. Buildings",
      "Category", "Occupancy Date", "Age (Years)",
      "FHA Number", "SOA", "Subsidized", "Section 8", "202/811",
      "Helene", "Florence", "Matthew", "Dorian", "Flood Zone",
      "Age Score", "Disaster Score", "Flood Score", "Weatherization Score",
      "LIHTC", "Data Source",
      "Organization", "Owner/Developer", "Mgmt Agent", "Mgmt Phone", "Mgmt Email",
      "Contract #", "Contract Expiration", "Years Until Expiration",
      "Energy Burden %", "Avg Monthly Energy $",
      "Electric Utility", "Electric Rate ($/kWh)", "Gas Utility", "Has Gas Service",
      "Heating System (Est.)",
      "Section 9", "EPC Eligible", "RAD Converted", "PHA Name", "PHA Code",
      "Building Count", "Avg Utility Allowance", "Contact Email", "Contact Phone",
      "NHPD Link", "AffordableHousing Link", "HUD Profile Link", "NCHFA Link", "Google Search Link",
      "Outreach Status"
    ];

    const rows = properties.map((p) => [
      p.total_priority_score,
      p.priority_tier,
      p.state || 'NC',
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
      `"${p.contractNumber ?? ""}"`,
      `"${p.contractExpiration ?? ""}"`,
      p.yearsUntilExpiration ?? "",
      p.energyBurdenPct ?? "",
      p.avgMonthlyEnergy ?? "",
      `"${(p.electricUtility ?? "").replace(/"/g, '""')}"`,
      p.electricRate ?? "",
      `"${(p.gasUtility ?? "").replace(/"/g, '""')}"`,
      p.hasGasService ? "Y" : "N",
      `"${(p.heatingSystemEstimate ?? "").replace(/"/g, '""')}"`,
      p.is_section9 ? "Y" : "N",
      p.is_epc_eligible ? "Y" : "N",
      p.is_rad_converted ? "Y" : "N",
      `"${(p.pha_name ?? "").replace(/"/g, '""')}"`,
      `"${p.pha_code ?? ""}"`,
      p.building_count ?? "",
      p.avg_utility_allowance ?? "",
      `"${p.contact_email ?? ""}"`,
      `"${p.contact_phone ?? ""}"`,
      `"${p.nhpdLink ?? ""}"`,
      `"${p.affordableHousingLink ?? ""}"`,
      `"${p.hudProfileLink ?? ""}"`,
      `"${p.nchfaLink ?? ""}"`,
      `"${p.googleSearchLink ?? ""}"`,
      getOutreachStatus ? statusLabels[getOutreachStatus(p.property_id)] : "Not Started",
    ]);

    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `property-priorities-${new Date().toISOString().slice(0, 10)}.csv`;
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
