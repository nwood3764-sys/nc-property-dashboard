import { useState } from "react";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

interface ScoringMethodologyProps {
  showDisaster?: boolean;
}

export default function ScoringMethodology({ showDisaster = true }: ScoringMethodologyProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white border border-border rounded-sm shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Info className="w-4 h-4 text-muted-foreground" />
          Scoring Methodology
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-border pt-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Property Age Score (0–30 pts)
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Based on occupancy date. Properties 50+ years old receive maximum points (30).
                Older buildings are more likely to have outdated HVAC, insulation, and electrical systems
                that would benefit from weatherization or electrification upgrades.
              </p>
            </div>
            {showDisaster && (
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Disaster Impact Score (0–35 pts)
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Based on FEMA disaster declarations for the property's county. Hurricane Helene (2024) adds
                  up to 15 pts, Florence (2018) adds 10 pts, Matthew (2016) adds 7 pts, and Dorian (2019) adds 3 pts.
                  Counties hit by multiple disasters accumulate points. (NC only)
                </p>
              </div>
            )}
            {showDisaster && (
              <div>
                <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Flood Risk Score (0–10 pts)
                </h4>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Properties in FEMA-designated coastal flood zone counties receive 10 points.
                  These properties face ongoing flood risk requiring resilient building upgrades. (NC only)
                </p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Weatherization Need Score (0–25 pts)
              </h4>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Subsidized properties (+8), Section 8 (+5), 202/811 elderly/disabled housing (+7),
                and older properties (+5 for 30+ years). These populations are priority targets for
                DOE Weatherization Assistance Program and HUD Green Retrofit programs.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <h4 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">
              Priority Tiers
            </h4>
            <div className="flex flex-wrap gap-4 text-xs">
              <span><span className="inline-block w-3 h-3 rounded-sm bg-[oklch(0.50_0.20_25)] mr-1 align-middle" /> Critical: 65–100 pts</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-[oklch(0.65_0.17_60)] mr-1 align-middle" /> High: 50–64 pts</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-[oklch(0.55_0.15_240)] mr-1 align-middle" /> Medium: 35–49 pts</span>
              <span><span className="inline-block w-3 h-3 rounded-sm bg-[oklch(0.50_0.15_155)] mr-1 align-middle" /> Low: 0–34 pts</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
