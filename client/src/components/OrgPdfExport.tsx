/*
 * OrgPdfExport — generates a downloadable HTML-based summary document for an organization.
 * Uses a new window with print-optimized styling that can be saved as PDF via browser print dialog.
 * Design: Civic Blueprint — clean, professional layout for field team handoff.
 */

import { FileDown } from "lucide-react";
import type { Property } from "@/lib/types";
import type { OutreachStatus } from "@/hooks/useOutreachStatus";

interface OrgPdfExportProps {
  orgName: string;
  properties: Property[];
  stats: {
    total: number;
    totalUnits: number;
    totalAssisted: number;
    avgAge: number | null;
    avgScore: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    disasterAffected: number;
    uniqueCounties: string[];
    lihtcCount: number;
    mgmtPhone: string | null;
    mgmtEmail: string | null;
    mgmtAgent: string | null;
    ownerCompany: string | null;
  };
  getOutreachStatus: (id: number) => OutreachStatus;
}

const statusLabels: Record<OutreachStatus, string> = {
  none: "Not Started",
  target: "Target",
  contacted: "Contacted",
  in_progress: "In Progress",
  complete: "Complete",
};

export default function OrgPdfExport({ orgName, properties, stats, getOutreachStatus }: OrgPdfExportProps) {
  const handleExport = () => {
    const sortedProps = [...properties].sort((a, b) => b.total_priority_score - a.total_priority_score);

    const tierColor: Record<string, string> = {
      Critical: "#c0392b",
      High: "#d4880f",
      Medium: "#2980b9",
      Low: "#27ae60",
    };

    const rows = sortedProps.map((p) => {
      const status = getOutreachStatus(p.property_id);
      return `<tr>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${p.property_name_clean}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${p.city_clean}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${p.county_clean}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;">${p.total_unit_count}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;">${p.property_age_years != null ? p.property_age_years + "yr" : "—"}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;text-align:center;">
          <span style="color:${tierColor[p.priority_tier] || "#333"};font-weight:600;">${p.total_priority_score}</span>
        </td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">
          <span style="background:${tierColor[p.priority_tier] || "#999"};color:white;padding:1px 6px;border-radius:2px;font-size:10px;font-weight:600;">${p.priority_tier}</span>
        </td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${p.building_type}</td>
        <td style="padding:4px 6px;border-bottom:1px solid #e5e7eb;font-size:11px;">${statusLabels[status]}</td>
      </tr>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${orgName} - Property Summary</title>
  <style>
    @page { size: landscape; margin: 0.5in; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a2e; margin: 0; padding: 20px; }
    .header { background: #1B3A5C; color: white; padding: 16px 20px; border-radius: 4px; margin-bottom: 16px; }
    .header h1 { margin: 0; font-size: 18px; font-weight: 700; }
    .header p { margin: 4px 0 0; font-size: 12px; opacity: 0.8; }
    .stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; margin-bottom: 16px; }
    .stat-card { border: 1px solid #e5e7eb; border-radius: 4px; padding: 10px; text-align: center; }
    .stat-card .value { font-size: 20px; font-weight: 700; }
    .stat-card .label { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
    .contact-row { display: flex; gap: 16px; margin-bottom: 12px; font-size: 12px; color: #555; }
    .counties { margin-bottom: 12px; }
    .counties span { display: inline-block; background: #f3f4f6; padding: 2px 8px; border-radius: 2px; font-size: 10px; margin: 2px; color: #555; }
    .tier-bar { display: flex; height: 20px; border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1B3A5C; color: white; padding: 6px 6px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; font-weight: 600; }
    .footer { margin-top: 16px; padding-top: 8px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${orgName}</h1>
    <p>NC Property Outreach Priority Summary &mdash; Generated ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="stats-grid">
    <div class="stat-card"><div class="value">${stats.total}</div><div class="label">Properties</div></div>
    <div class="stat-card"><div class="value">${stats.totalUnits.toLocaleString()}</div><div class="label">Total Units</div></div>
    <div class="stat-card"><div class="value">${stats.avgScore}</div><div class="label">Avg Score</div></div>
    <div class="stat-card"><div class="value">${stats.avgAge ?? "N/A"}</div><div class="label">Avg Age (yr)</div></div>
    <div class="stat-card"><div class="value">${stats.disasterAffected}</div><div class="label">Disaster-Affected</div></div>
    <div class="stat-card"><div class="value">${stats.lihtcCount}</div><div class="label">LIHTC</div></div>
  </div>

  <div class="contact-row">
    ${stats.ownerCompany ? `<span><strong>Owner:</strong> ${stats.ownerCompany}</span>` : ""}
    ${stats.mgmtAgent && stats.mgmtAgent !== stats.ownerCompany ? `<span><strong>Mgmt:</strong> ${stats.mgmtAgent}</span>` : ""}
    ${stats.mgmtPhone ? `<span><strong>Phone:</strong> ${stats.mgmtPhone}</span>` : ""}
    ${stats.mgmtEmail ? `<span><strong>Email:</strong> ${stats.mgmtEmail}</span>` : ""}
  </div>

  <div class="counties">
    <strong style="font-size:11px;">Counties (${stats.uniqueCounties.length}):</strong>
    ${stats.uniqueCounties.map((c) => `<span>${c}</span>`).join("")}
  </div>

  <div class="tier-bar">
    ${stats.critical > 0 ? `<div style="width:${(stats.critical / stats.total) * 100}%;background:#c0392b;min-width:16px;" title="Critical: ${stats.critical}"></div>` : ""}
    ${stats.high > 0 ? `<div style="width:${(stats.high / stats.total) * 100}%;background:#d4880f;min-width:16px;" title="High: ${stats.high}"></div>` : ""}
    ${stats.medium > 0 ? `<div style="width:${(stats.medium / stats.total) * 100}%;background:#2980b9;min-width:16px;" title="Medium: ${stats.medium}"></div>` : ""}
    ${stats.low > 0 ? `<div style="width:${(stats.low / stats.total) * 100}%;background:#27ae60;min-width:16px;" title="Low: ${stats.low}"></div>` : ""}
  </div>

  <table>
    <thead>
      <tr>
        <th>Property</th>
        <th>City</th>
        <th>County</th>
        <th style="text-align:center;">Units</th>
        <th style="text-align:center;">Age</th>
        <th style="text-align:center;">Score</th>
        <th>Tier</th>
        <th>Type</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    NC Property Outreach Dashboard &mdash; Data: HUD Active Portfolio & LIHTC Database &mdash; ${new Date().toLocaleDateString()}
  </div>
</body>
</html>`;

    // Open in new window for print/save as PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 text-sm font-medium text-[oklch(0.30_0.06_250)] hover:text-[oklch(0.40_0.06_250)] transition-colors print:hidden"
    >
      <FileDown className="w-4 h-4" />
      Download PDF
    </button>
  );
}
