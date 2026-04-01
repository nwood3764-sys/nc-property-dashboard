import { describe, expect, it } from "vitest";

/**
 * Tests for the haversine distance calculation used in the My Location feature.
 * The actual function lives in the client-side PropertyMap component,
 * so we replicate it here for unit testing.
 */

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

interface MockProperty {
  property_id: number;
  property_name_clean: string;
  lat: number | null;
  lng: number | null;
  priority_tier: string;
  total_priority_score: number;
}

function findNearbyProperties(
  userLat: number,
  userLng: number,
  properties: MockProperty[],
  radiusMiles: number
) {
  const nearby: (MockProperty & { distance: number })[] = [];
  for (const p of properties) {
    if (p.lat == null || p.lng == null) continue;
    const dist = haversineDistance(userLat, userLng, p.lat, p.lng);
    if (dist <= radiusMiles) {
      nearby.push({ ...p, distance: dist });
    }
  }
  nearby.sort((a, b) => a.distance - b.distance);
  return nearby;
}

describe("haversineDistance", () => {
  it("returns 0 for the same point", () => {
    const dist = haversineDistance(35.55, -79.39, 35.55, -79.39);
    expect(dist).toBe(0);
  });

  it("calculates distance between Raleigh and Charlotte (~130 mi)", () => {
    // Raleigh: 35.7796, -78.6382
    // Charlotte: 35.2271, -80.8431
    const dist = haversineDistance(35.7796, -78.6382, 35.2271, -80.8431);
    expect(dist).toBeGreaterThan(120);
    expect(dist).toBeLessThan(145);
  });

  it("calculates distance between two close points (~1 mi)", () => {
    // Two points roughly 1 mile apart in NC
    const dist = haversineDistance(35.55, -79.39, 35.5645, -79.39);
    expect(dist).toBeGreaterThan(0.8);
    expect(dist).toBeLessThan(1.2);
  });

  it("is symmetric (distance A→B equals B→A)", () => {
    const d1 = haversineDistance(35.55, -79.39, 36.0, -80.0);
    const d2 = haversineDistance(36.0, -80.0, 35.55, -79.39);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });

  it("calculates distance across NC (~400 mi Manteo to Murphy)", () => {
    // Manteo: 35.9082, -75.6757
    // Murphy: 35.0868, -84.0346
    const dist = haversineDistance(35.9082, -75.6757, 35.0868, -84.0346);
    expect(dist).toBeGreaterThan(380);
    expect(dist).toBeLessThan(500);
  });
});

describe("findNearbyProperties", () => {
  const mockProperties: MockProperty[] = [
    { property_id: 1, property_name_clean: "Prop A", lat: 35.551, lng: -79.391, priority_tier: "Critical", total_priority_score: 75 },
    { property_id: 2, property_name_clean: "Prop B", lat: 35.56, lng: -79.40, priority_tier: "High", total_priority_score: 60 },
    { property_id: 3, property_name_clean: "Prop C", lat: 36.0, lng: -80.0, priority_tier: "Medium", total_priority_score: 45 },
    { property_id: 4, property_name_clean: "Prop D", lat: null, lng: null, priority_tier: "Low", total_priority_score: 30 },
    { property_id: 5, property_name_clean: "Prop E", lat: 35.555, lng: -79.395, priority_tier: "Critical", total_priority_score: 70 },
  ];

  it("finds properties within a small radius", () => {
    const nearby = findNearbyProperties(35.55, -79.39, mockProperties, 1);
    // Prop A and Prop E should be very close (< 1 mi)
    expect(nearby.length).toBeGreaterThanOrEqual(1);
    expect(nearby.every((p) => p.distance <= 1)).toBe(true);
  });

  it("finds more properties with a larger radius", () => {
    const small = findNearbyProperties(35.55, -79.39, mockProperties, 1);
    const large = findNearbyProperties(35.55, -79.39, mockProperties, 50);
    expect(large.length).toBeGreaterThanOrEqual(small.length);
  });

  it("returns results sorted by distance (closest first)", () => {
    const nearby = findNearbyProperties(35.55, -79.39, mockProperties, 100);
    for (let i = 1; i < nearby.length; i++) {
      expect(nearby[i].distance).toBeGreaterThanOrEqual(nearby[i - 1].distance);
    }
  });

  it("excludes properties with null coordinates", () => {
    const nearby = findNearbyProperties(35.55, -79.39, mockProperties, 10000);
    expect(nearby.find((p) => p.property_id === 4)).toBeUndefined();
  });

  it("returns empty array when no properties are within radius", () => {
    const nearby = findNearbyProperties(35.55, -79.39, mockProperties, 0.001);
    expect(nearby.length).toBe(0);
  });

  it("includes distance in results", () => {
    const nearby = findNearbyProperties(35.55, -79.39, mockProperties, 100);
    for (const p of nearby) {
      expect(typeof p.distance).toBe("number");
      expect(p.distance).toBeGreaterThanOrEqual(0);
    }
  });
});
