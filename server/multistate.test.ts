import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// Load the properties data directly for testing
const dataPath = path.resolve(__dirname, "../client/src/data/properties.json");
const properties: any[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

describe("Multi-state property data", () => {
  it("should contain properties from NC, WI, and MI", () => {
    const states = new Set(properties.map((p: any) => p.state));
    expect(states.has("NC")).toBe(true);
    expect(states.has("WI")).toBe(true);
    expect(states.has("MI")).toBe(true);
  });

  it("should have a reasonable number of properties per state", () => {
    const ncCount = properties.filter((p: any) => p.state === "NC").length;
    const wiCount = properties.filter((p: any) => p.state === "WI").length;
    const miCount = properties.filter((p: any) => p.state === "MI").length;

    expect(ncCount).toBeGreaterThan(1000);
    expect(wiCount).toBeGreaterThan(500);
    expect(miCount).toBeGreaterThan(500);

    // Total should match
    expect(ncCount + wiCount + miCount).toBe(properties.length);
  });

  it("all properties should have required fields", () => {
    for (const p of properties) {
      expect(p.property_id).toBeDefined();
      // property_id can be number or string depending on data source
      expect(["number", "string"]).toContain(typeof p.property_id);
      expect(p.property_name_clean).toBeDefined();
      expect(p.state).toBeDefined();
      expect(["NC", "WI", "MI"]).toContain(p.state);
      expect(p.total_priority_score).toBeDefined();
      expect(typeof p.total_priority_score).toBe("number");
      expect(p.priority_tier).toBeDefined();
      expect(["Critical", "High", "Medium", "Low"]).toContain(p.priority_tier);
    }
  });

  it("NC properties should have disaster scoring data", () => {
    const ncProps = properties.filter((p: any) => p.state === "NC");
    // At least some NC properties should have disaster data
    const withDisaster = ncProps.filter((p: any) => p.any_disaster);
    expect(withDisaster.length).toBeGreaterThan(0);

    // NC properties should have disaster_score field
    for (const p of ncProps.slice(0, 100)) {
      expect(p.disaster_score).toBeDefined();
      expect(typeof p.disaster_score).toBe("number");
    }
  });

  it("WI and MI properties should have zero disaster scores", () => {
    const nonNCProps = properties.filter((p: any) => p.state !== "NC");
    for (const p of nonNCProps) {
      expect(p.disaster_score).toBe(0);
      expect(p.flood_risk_score).toBe(0);
      expect(p.helene_affected).toBeFalsy();
      expect(p.florence_affected ?? false).toBeFalsy();
      expect(p.matthew_affected ?? false).toBeFalsy();
      expect(p.dorian_affected ?? false).toBeFalsy();
    }
  });

  it("all properties should have valid priority scores between 0 and 100", () => {
    for (const p of properties) {
      expect(p.total_priority_score).toBeGreaterThanOrEqual(0);
      expect(p.total_priority_score).toBeLessThanOrEqual(100);
    }
  });

  it("priority tiers should be consistent with scores (higher score = higher tier)", () => {
    // Check that Critical properties have higher avg scores than Low
    const tierAvgs: Record<string, number[]> = { Critical: [], High: [], Medium: [], Low: [] };
    for (const p of properties) {
      tierAvgs[p.priority_tier]?.push(p.total_priority_score);
    }
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    const criticalAvg = avg(tierAvgs.Critical);
    const highAvg = avg(tierAvgs.High);
    const mediumAvg = avg(tierAvgs.Medium);
    const lowAvg = avg(tierAvgs.Low);
    
    // Higher tiers should have higher average scores
    if (tierAvgs.Critical.length > 0 && tierAvgs.High.length > 0) {
      expect(criticalAvg).toBeGreaterThan(highAvg);
    }
    if (tierAvgs.High.length > 0 && tierAvgs.Medium.length > 0) {
      expect(highAvg).toBeGreaterThan(mediumAvg);
    }
    if (tierAvgs.Medium.length > 0 && tierAvgs.Low.length > 0) {
      expect(mediumAvg).toBeGreaterThan(lowAvg);
    }
  });

  it("property IDs should be unique", () => {
    const ids = properties.map((p: any) => p.property_id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it("geocoded properties should have valid lat/lng", () => {
    const geocoded = properties.filter((p: any) => p.lat != null && p.lng != null);
    expect(geocoded.length).toBeGreaterThan(properties.length * 0.5); // At least 50% geocoded

    for (const p of geocoded) {
      expect(p.lat).toBeGreaterThan(24); // South of US
      expect(p.lat).toBeLessThan(50); // North of US
      expect(p.lng).toBeGreaterThan(-100); // West boundary
      expect(p.lng).toBeLessThan(-70); // East boundary
    }
  });

  it("WI/MI properties should have county data", () => {
    const wiProps = properties.filter((p: any) => p.state === "WI");
    const miProps = properties.filter((p: any) => p.state === "MI");

    // At least some should have county data
    const wiWithCounty = wiProps.filter((p: any) => p.county_clean && p.county_clean.trim());
    const miWithCounty = miProps.filter((p: any) => p.county_clean && p.county_clean.trim());

    expect(wiWithCounty.length).toBeGreaterThan(wiProps.length * 0.3);
    expect(miWithCounty.length).toBeGreaterThan(miProps.length * 0.3);
  });
});
