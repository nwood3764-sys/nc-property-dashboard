/*
 * OutreachProgressDashboard — shows outreach completion rates by county and organization.
 * Design: Civic Blueprint — clean charts with tier-coded progress bars.
 */

import { useMemo } from "react";
import type { Property } from "@/lib/types";
import type { OutreachStatus } from "@/hooks/useOutreachStatus";
import type { TeamMember } from "@/hooks/useTeamAssignments";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface OutreachProgressDashboardProps {
  properties: Property[];
  getOutreachStatus: (id: number) => OutreachStatus;
  team?: TeamMember[];
  getAssignedMember?: (id: number) => TeamMember | null;
  workload?: Record<string, number>;
  totalAssigned?: number;
}

interface ProgressEntry {
  name: string;
  total: number;
  contacted: number;
  inProgress: number;
  complete: number;
  notStarted: number;
  completionPct: number;
}

function ProgressBar({ entry }: { entry: ProgressEntry }) {
  const total = entry.total || 1;
  const completePct = (entry.complete / total) * 100;
  const inProgressPct = (entry.inProgress / total) * 100;
  const contactedPct = (entry.contacted / total) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1">
        <div className="flex h-3 rounded-sm overflow-hidden bg-muted">
          {completePct > 0 && (
            <div
              className="h-full"
              style={{ width: `${completePct}%`, backgroundColor: "oklch(0.45 0.15 155)" }}
              title={`Complete: ${entry.complete}`}
            />
          )}
          {inProgressPct > 0 && (
            <div
              className="h-full"
              style={{ width: `${inProgressPct}%`, backgroundColor: "oklch(0.55 0.15 240)" }}
              title={`In Progress: ${entry.inProgress}`}
            />
          )}
          {contactedPct > 0 && (
            <div
              className="h-full"
              style={{ width: `${contactedPct}%`, backgroundColor: "oklch(0.60 0.17 60)" }}
              title={`Contacted: ${entry.contacted}`}
            />
          )}
        </div>
      </div>
      <span className="text-xs font-semibold tabular-nums w-10 text-right">
        {Math.round(entry.completionPct)}%
      </span>
    </div>
  );
}

function ProgressTable({ data, label }: { data: ProgressEntry[]; label: string }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</th>
            <th className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-14">Total</th>
            <th className="text-center py-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-14">Done</th>
            <th className="text-left py-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground w-40">Progress</th>
          </tr>
        </thead>
        <tbody>
          {data.map((entry) => (
            <tr key={entry.name} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
              <td className="py-2 px-2 font-medium text-foreground truncate max-w-[200px]" title={entry.name}>{entry.name}</td>
              <td className="py-2 px-2 text-center tabular-nums text-muted-foreground">{entry.total}</td>
              <td className="py-2 px-2 text-center tabular-nums font-semibold">{entry.complete}</td>
              <td className="py-2 px-2">
                <ProgressBar entry={entry} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function OutreachProgressDashboard({ properties, getOutreachStatus, team, getAssignedMember, workload, totalAssigned }: OutreachProgressDashboardProps) {
  // Overall stats
  const overallStats = useMemo(() => {
    let contacted = 0, inProgress = 0, complete = 0, notStarted = 0;
    properties.forEach((p) => {
      const s = getOutreachStatus(p.property_id);
      if (s === "contacted") contacted++;
      else if (s === "in_progress") inProgress++;
      else if (s === "complete") complete++;
      else notStarted++;
    });
    const total = properties.length;
    const touched = contacted + inProgress + complete;
    return { total, contacted, inProgress, complete, notStarted, touched, touchedPct: total > 0 ? Math.round((touched / total) * 100) : 0, completePct: total > 0 ? Math.round((complete / total) * 100) : 0 };
  }, [properties, getOutreachStatus]);

  // By county
  const countyProgress = useMemo(() => {
    const map = new Map<string, { total: number; contacted: number; inProgress: number; complete: number; notStarted: number }>();
    properties.forEach((p) => {
      const county = p.county_clean || "Unknown";
      if (!map.has(county)) map.set(county, { total: 0, contacted: 0, inProgress: 0, complete: 0, notStarted: 0 });
      const entry = map.get(county)!;
      entry.total++;
      const s = getOutreachStatus(p.property_id);
      if (s === "contacted") entry.contacted++;
      else if (s === "in_progress") entry.inProgress++;
      else if (s === "complete") entry.complete++;
      else entry.notStarted++;
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        completionPct: data.total > 0 ? ((data.complete + data.inProgress + data.contacted) / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [properties, getOutreachStatus]);

  // By organization
  const orgProgress = useMemo(() => {
    const map = new Map<string, { total: number; contacted: number; inProgress: number; complete: number; notStarted: number }>();
    properties.forEach((p) => {
      const org = (p.organization || "").trim();
      if (!org) return;
      if (!map.has(org)) map.set(org, { total: 0, contacted: 0, inProgress: 0, complete: 0, notStarted: 0 });
      const entry = map.get(org)!;
      entry.total++;
      const s = getOutreachStatus(p.property_id);
      if (s === "contacted") entry.contacted++;
      else if (s === "in_progress") entry.inProgress++;
      else if (s === "complete") entry.complete++;
      else entry.notStarted++;
    });
    return Array.from(map.entries())
      .map(([name, data]) => ({
        name,
        ...data,
        completionPct: data.total > 0 ? ((data.complete + data.inProgress + data.contacted) / data.total) * 100 : 0,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [properties, getOutreachStatus]);

  // Chart data for overall status breakdown
  const statusChartData = useMemo(() => [
    { name: "Complete", value: overallStats.complete, color: "oklch(0.45 0.15 155)" },
    { name: "In Progress", value: overallStats.inProgress, color: "oklch(0.55 0.15 240)" },
    { name: "Contacted", value: overallStats.contacted, color: "oklch(0.60 0.17 60)" },
    { name: "Not Started", value: overallStats.notStarted, color: "oklch(0.85 0.01 250)" },
  ], [overallStats]);

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border bg-muted/30">
        <h3 className="font-[Space_Grotesk] text-base font-bold text-foreground">
          Outreach Progress Dashboard
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Track outreach completion rates across counties and organizations
        </p>
      </div>

      <div className="p-5 space-y-6">
        {/* Overall Summary Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-muted/30 rounded-sm p-3 text-center">
            <p className="text-2xl font-bold font-[Space_Grotesk] text-foreground tabular-nums">{overallStats.total.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Properties</p>
          </div>
          <div className="bg-[oklch(0.95_0.04_155)] rounded-sm p-3 text-center">
            <p className="text-2xl font-bold font-[Space_Grotesk] text-[oklch(0.35_0.12_155)] tabular-nums">{overallStats.complete}</p>
            <p className="text-xs text-[oklch(0.40_0.10_155)] mt-0.5">Complete</p>
          </div>
          <div className="bg-[oklch(0.93_0.04_240)] rounded-sm p-3 text-center">
            <p className="text-2xl font-bold font-[Space_Grotesk] text-[oklch(0.40_0.12_240)] tabular-nums">{overallStats.inProgress}</p>
            <p className="text-xs text-[oklch(0.45_0.10_240)] mt-0.5">In Progress</p>
          </div>
          <div className="bg-[oklch(0.95_0.04_60)] rounded-sm p-3 text-center">
            <p className="text-2xl font-bold font-[Space_Grotesk] text-[oklch(0.40_0.14_60)] tabular-nums">{overallStats.contacted}</p>
            <p className="text-xs text-[oklch(0.45_0.12_60)] mt-0.5">Contacted</p>
          </div>
          <div className="bg-muted/30 rounded-sm p-3 text-center">
            <p className="text-2xl font-bold font-[Space_Grotesk] text-muted-foreground tabular-nums">{overallStats.notStarted.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Not Started</p>
          </div>
        </div>

        {/* Overall progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Overall Outreach Progress</span>
            <span className="font-semibold">{overallStats.touchedPct}% touched ({overallStats.touched.toLocaleString()} of {overallStats.total.toLocaleString()})</span>
          </div>
          <div className="flex h-5 rounded-sm overflow-hidden bg-muted">
            {statusChartData.map((d) =>
              d.value > 0 ? (
                <div
                  key={d.name}
                  className="h-full flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    width: `${(d.value / overallStats.total) * 100}%`,
                    backgroundColor: d.color,
                    minWidth: d.value > 0 ? "16px" : "0",
                  }}
                  title={`${d.name}: ${d.value}`}
                >
                  {(d.value / overallStats.total) * 100 >= 5 ? d.value : ""}
                </div>
              ) : null
            )}
          </div>
          <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
            {statusChartData.map((d) => (
              <span key={d.name} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </span>
            ))}
          </div>
        </div>

        {/* Team Workload Section */}
        {team && team.length > 0 && getAssignedMember && workload && (
          <div>
            <h4 className="font-[Space_Grotesk] text-sm font-bold text-foreground mb-3">
              Team Workload Distribution
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
              {team.map((member) => {
                const assigned = workload[member.id] || 0;
                // Count statuses for this member's assigned properties
                let memberComplete = 0, memberInProgress = 0, memberContacted = 0, memberNotStarted = 0;
                properties.forEach((p) => {
                  const am = getAssignedMember(p.property_id);
                  if (am?.id === member.id) {
                    const s = getOutreachStatus(p.property_id);
                    if (s === "complete") memberComplete++;
                    else if (s === "in_progress") memberInProgress++;
                    else if (s === "contacted") memberContacted++;
                    else memberNotStarted++;
                  }
                });
                const memberTouched = memberComplete + memberInProgress + memberContacted;
                const memberPct = assigned > 0 ? Math.round((memberTouched / assigned) * 100) : 0;
                return (
                  <div key={member.id} className="bg-muted/30 rounded-sm p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: member.color }} />
                      <span className="text-sm font-semibold text-foreground truncate">{member.name}</span>
                    </div>
                    <div className="text-2xl font-bold font-[Space_Grotesk] text-foreground tabular-nums">{assigned}</div>
                    <div className="text-xs text-muted-foreground">properties assigned</div>
                    <div className="mt-2">
                      <div className="flex h-2 rounded-sm overflow-hidden bg-muted">
                        {memberComplete > 0 && (
                          <div className="h-full" style={{ width: `${(memberComplete / Math.max(assigned, 1)) * 100}%`, backgroundColor: "oklch(0.45 0.15 155)" }} />
                        )}
                        {memberInProgress > 0 && (
                          <div className="h-full" style={{ width: `${(memberInProgress / Math.max(assigned, 1)) * 100}%`, backgroundColor: "oklch(0.55 0.15 240)" }} />
                        )}
                        {memberContacted > 0 && (
                          <div className="h-full" style={{ width: `${(memberContacted / Math.max(assigned, 1)) * 100}%`, backgroundColor: "oklch(0.60 0.17 60)" }} />
                        )}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{memberPct}% touched</span>
                        <span>{memberComplete} done</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Unassigned card */}
              <div className="bg-muted/20 rounded-sm p-3 border border-dashed border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-3 h-3 rounded-full flex-shrink-0 bg-gray-300" />
                  <span className="text-sm font-semibold text-muted-foreground">Unassigned</span>
                </div>
                <div className="text-2xl font-bold font-[Space_Grotesk] text-muted-foreground tabular-nums">{properties.length - (totalAssigned || 0)}</div>
                <div className="text-xs text-muted-foreground">properties remaining</div>
              </div>
            </div>
          </div>
        )}

        {/* County and Org Progress side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-[Space_Grotesk] text-sm font-bold text-foreground mb-3">
              Progress by County (Top 20)
            </h4>
            <ProgressTable data={countyProgress} label="County" />
          </div>
          <div>
            <h4 className="font-[Space_Grotesk] text-sm font-bold text-foreground mb-3">
              Progress by Organization (Top 20)
            </h4>
            <ProgressTable data={orgProgress} label="Organization" />
          </div>
        </div>
      </div>
    </div>
  );
}
