/*
 * PropertyCompare — side-by-side comparison view for 2-4 selected properties
 * Design: Civic Blueprint — clean table layout with tier-colored headers
 */
import { X, ExternalLink, MapPin } from "lucide-react";
import type { Property } from "@/lib/types";

interface Props {
  properties: Property[];
  onRemove: (id: number) => void;
  onClose: () => void;
  getOutreachStatus?: (id: number) => string;
  getNote?: (id: number) => { text: string; updatedAt: string } | null;
}

const tierColors: Record<string, string> = {
  Critical: "bg-red-700 text-white",
  High: "bg-amber-600 text-white",
  Medium: "bg-sky-700 text-white",
  Low: "bg-emerald-700 text-white",
};

function Row({ label, values, highlight }: { label: string; values: (string | number | null | undefined)[]; highlight?: boolean }) {
  return (
    <tr className={highlight ? "bg-slate-50" : ""}>
      <td className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-200 whitespace-nowrap w-44">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="px-4 py-2 text-sm text-slate-800 border-r border-slate-200 last:border-r-0">
          {v ?? <span className="text-slate-300">—</span>}
        </td>
      ))}
    </tr>
  );
}

export default function PropertyCompare({ properties, onRemove, onClose, getOutreachStatus, getNote }: Props) {
  if (properties.length === 0) return null;

  const mapsUrl = (p: Property) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${p.address_clean}, ${p.city_clean}, ${p.state || 'NC'} ${p.zip_code}`)}`;

  // Show disaster sections only if any compared property is from NC
  const hasNCProperty = properties.some(p => (p.state || 'NC') === 'NC');

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Property Comparison</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="px-4 py-3 bg-slate-100 border-r border-slate-200 w-44"></th>
                {properties.map((p) => (
                  <th key={p.property_id} className="px-4 py-3 bg-slate-100 border-r border-slate-200 last:border-r-0 min-w-[220px]">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 text-xs font-bold rounded mb-1 ${tierColors[p.priority_tier]}`}>
                          {p.priority_tier}
                        </span>
                        <div className="text-sm font-bold text-slate-800 leading-tight">{p.property_name_clean}</div>
                        <div className="text-xs text-slate-500">{p.city_clean}, {p.state || 'NC'} &middot; {p.county_clean} Co.</div>
                      </div>
                      <button onClick={() => onRemove(p.property_id)} className="p-0.5 hover:bg-slate-200 rounded shrink-0">
                        <X className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <Row label="State" values={properties.map((p) => p.state || 'NC')} />
              <Row label="Priority Score" values={properties.map((p) => `${p.total_priority_score} / 100`)} highlight />
              <Row label="Property Age" values={properties.map((p) => p.property_age_years != null ? `${p.property_age_years} years` : null)} />
              <Row label="Total Units" values={properties.map((p) => p.total_unit_count)} highlight />
              <Row label="Assisted Units" values={properties.map((p) => p.total_assisted_unit_count)} />
              <Row label="Building Type" values={properties.map((p) => p.building_type)} highlight />
              <Row label="Stories / Buildings" values={properties.map((p) => `${p.est_stories}F / ${p.est_buildings}B`)} />
              <Row label="Address" values={properties.map((p) => p.address_clean)} highlight />
              <Row label="ZIP Code" values={properties.map((p) => p.zip_code)} />

              {/* Scoring */}
              <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Scoring Breakdown</td></tr>
              <Row label="Age Score" values={properties.map((p) => `${p.age_score} / 30`)} />
              {hasNCProperty && (
                <>
                  <Row label="Disaster Score" values={properties.map((p) => (p.state || 'NC') === 'NC' ? `${p.disaster_score} / 35` : 'N/A')} highlight />
                  <Row label="Flood Risk Score" values={properties.map((p) => (p.state || 'NC') === 'NC' ? `${p.flood_risk_score} / 10` : 'N/A')} />
                </>
              )}
              <Row label="Weatherization Score" values={properties.map((p) => `${p.weatherization_score} / 25`)} highlight />

              {/* Disasters — only show if any NC property */}
              {hasNCProperty && (
                <>
                  <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Disaster Exposure (NC Only)</td></tr>
                  <Row label="Hurricane Helene" values={properties.map((p) => (p.state || 'NC') === 'NC' ? (p.helene_affected ? "Yes" : "No") : 'N/A')} />
                  <Row label="Hurricane Florence" values={properties.map((p) => (p.state || 'NC') === 'NC' ? (p.florence_affected ? "Yes" : "No") : 'N/A')} highlight />
                  <Row label="Hurricane Matthew" values={properties.map((p) => (p.state || 'NC') === 'NC' ? (p.matthew_affected ? "Yes" : "No") : 'N/A')} />
                  <Row label="Hurricane Dorian" values={properties.map((p) => (p.state || 'NC') === 'NC' ? (p.dorian_affected ? "Yes" : "No") : 'N/A')} highlight />
                  <Row label="Coastal Flood Zone" values={properties.map((p) => (p.state || 'NC') === 'NC' ? (p.coastal_flood_zone ? "Yes" : "No") : 'N/A')} />
                </>
              )}

              {/* Energy & Utilities */}
              <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Energy & Utilities</td></tr>
              <Row label="Energy Burden" values={properties.map((p) => p.energyBurdenPct != null ? `${p.energyBurdenPct}%` : null)} />
              <Row label="Avg Monthly Energy" values={properties.map((p) => p.avgMonthlyEnergy != null ? `$${p.avgMonthlyEnergy}` : null)} highlight />
              <Row label="Electric Utility" values={properties.map((p) => p.electricUtility)} />
              <Row label="Electric Rate" values={properties.map((p) => p.electricRate != null ? `${(p.electricRate * 100).toFixed(1)}¢/kWh` : null)} highlight />
              <Row label="Gas Utility" values={properties.map((p) => p.gasUtility || "No gas service")} />
              <Row label="Heating System (Est.)" values={properties.map((p) => p.heatingSystemEstimate)} highlight />

              {/* Contract */}
              <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Contract & Program</td></tr>
              <Row label="Contract Expiration" values={properties.map((p) => p.contractExpiration)} />
              <Row label="Years Until Expiry" values={properties.map((p) => p.yearsUntilExpiration != null ? `${p.yearsUntilExpiration.toFixed(1)} yr` : null)} highlight />
              <Row label="Program Category" values={properties.map((p) => p.category_clean)} />
              <Row label="LIHTC" values={properties.map((p) => p.is_lihtc ? "Yes" : "No")} highlight />
              <Row label="Section 8" values={properties.map((p) => p.is_sec8_ind ? "Yes" : "No")} />
              <Row label="Organization" values={properties.map((p) => p.organization)} highlight />

              {/* Outreach */}
              {getOutreachStatus && (
                <>
                  <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Outreach</td></tr>
                  <Row label="Status" values={properties.map((p) => getOutreachStatus(p.property_id) || "Not Started")} />
                  {getNote && <Row label="Notes" values={properties.map((p) => getNote(p.property_id)?.text)} highlight />}
                </>
              )}

              {/* Links */}
              <tr><td colSpan={properties.length + 1} className="px-4 py-2 bg-slate-50 text-xs font-bold text-slate-600 uppercase tracking-wider border-t-2 border-slate-200">Links</td></tr>
              <tr>
                <td className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide border-r border-slate-200 w-44">Actions</td>
                {properties.map((p) => (
                  <td key={p.property_id} className="px-4 py-2 border-r border-slate-200 last:border-r-0">
                    <div className="flex flex-col gap-1">
                      <a href={mapsUrl(p)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                        <MapPin className="w-3 h-3" /> Google Maps
                      </a>
                      {p.nhpdLink && (
                        <a href={p.nhpdLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                          <ExternalLink className="w-3 h-3" /> NHPD
                        </a>
                      )}
                      {p.googleSearchLink && (
                        <a href={p.googleSearchLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Find Website
                        </a>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
