import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => {
  let statusStore: Record<string, string> = {};
  let teamStore: Array<{ id: number; name: string; color: string; createdAt: Date }> = [];
  let assignmentStore: Record<string, number> = {};
  let notesStore: Record<string, { noteText: string; updatedAt: Date }> = {};
  let nextTeamId = 1;

  return {
    // User helpers (needed by auth)
    getDb: vi.fn().mockResolvedValue({}),
    upsertUser: vi.fn(),
    getUserByOpenId: vi.fn(),

    // Outreach
    getAllOutreachStatuses: vi.fn(async () => {
      return Object.entries(statusStore).map(([propertyId, status]) => ({
        id: Number(propertyId),
        propertyId: Number(propertyId),
        status,
        updatedAt: new Date(),
      }));
    }),
    upsertOutreachStatus: vi.fn(async (propertyId: number, status: string) => {
      if (status === "none") {
        delete statusStore[String(propertyId)];
        return null;
      }
      statusStore[String(propertyId)] = status;
      return { id: propertyId, propertyId, status, updatedAt: new Date() };
    }),
    bulkUpsertOutreachStatus: vi.fn(async (propertyIds: number[], status: string) => {
      for (const id of propertyIds) {
        if (status === "none") {
          delete statusStore[String(id)];
        } else {
          statusStore[String(id)] = status;
        }
      }
    }),

    // Team
    getAllTeamMembers: vi.fn(async () => [...teamStore]),
    addTeamMember: vi.fn(async (name: string, color: string) => {
      const member = { id: nextTeamId++, name, color, createdAt: new Date() };
      teamStore.push(member);
      return member;
    }),
    deleteTeamMember: vi.fn(async (memberId: number) => {
      teamStore = teamStore.filter((m) => m.id !== memberId);
      // Also remove assignments
      for (const [propId, mId] of Object.entries(assignmentStore)) {
        if (mId === memberId) delete assignmentStore[propId];
      }
    }),

    // Assignments
    getAllAssignments: vi.fn(async () => {
      return Object.entries(assignmentStore).map(([propertyId, memberId]) => ({
        id: Number(propertyId),
        propertyId: Number(propertyId),
        memberId,
        assignedAt: new Date(),
      }));
    }),
    upsertAssignment: vi.fn(async (propertyId: number, memberId: number | null) => {
      if (memberId === null) {
        delete assignmentStore[String(propertyId)];
        return null;
      }
      assignmentStore[String(propertyId)] = memberId;
      return { id: propertyId, propertyId, memberId, assignedAt: new Date() };
    }),
    bulkUpsertAssignments: vi.fn(async (propertyIds: number[], memberId: number | null) => {
      for (const id of propertyIds) {
        if (memberId === null) {
          delete assignmentStore[String(id)];
        } else {
          assignmentStore[String(id)] = memberId;
        }
      }
    }),

    // Notes
    getAllNotes: vi.fn(async () => {
      return Object.entries(notesStore).map(([propertyId, data]) => ({
        id: Number(propertyId),
        propertyId: Number(propertyId),
        noteText: data.noteText,
        updatedAt: data.updatedAt,
      }));
    }),
    upsertNote: vi.fn(async (propertyId: number, noteText: string) => {
      const trimmed = noteText.trim();
      if (!trimmed) {
        delete notesStore[String(propertyId)];
        return null;
      }
      notesStore[String(propertyId)] = { noteText: trimmed, updatedAt: new Date() };
      return { id: propertyId, propertyId, noteText: trimmed, updatedAt: new Date() };
    }),

    // Reset helper for tests
    __resetStores: () => {
      statusStore = {};
      teamStore = [];
      assignmentStore = {};
      notesStore = {};
      nextTeamId = 1;
    },
  };
});

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("Outreach Status API", () => {
  const ctx = createPublicContext();

  beforeEach(async () => {
    const db = await import("./db");
    (db as any).__resetStores();
  });

  it("returns empty map initially", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.outreach.getAll();
    expect(result).toEqual({});
  });

  it("sets and retrieves a status", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.outreach.setStatus({ propertyId: 100, status: "contacted" });
    const result = await caller.outreach.getAll();
    expect(result["100"]).toBe("contacted");
  });

  it("removes status when set to none", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.outreach.setStatus({ propertyId: 100, status: "contacted" });
    await caller.outreach.setStatus({ propertyId: 100, status: "none" });
    const result = await caller.outreach.getAll();
    expect(result["100"]).toBeUndefined();
  });

  it("bulk sets statuses", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.outreach.bulkSetStatus({
      propertyIds: [1, 2, 3],
      status: "in_progress",
    });
    const result = await caller.outreach.getAll();
    expect(result["1"]).toBe("in_progress");
    expect(result["2"]).toBe("in_progress");
    expect(result["3"]).toBe("in_progress");
  });
});

describe("Team Members API", () => {
  const ctx = createPublicContext();

  beforeEach(async () => {
    const db = await import("./db");
    (db as any).__resetStores();
  });

  it("returns empty list initially", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.team.getAll();
    expect(result).toEqual([]);
  });

  it("adds a team member", async () => {
    const caller = appRouter.createCaller(ctx);
    const member = await caller.team.add({ name: "Alice", color: "oklch(0.55 0.20 250)" });
    expect(member.name).toBe("Alice");
    expect(member.id).toBe(1);

    const all = await caller.team.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Alice");
  });

  it("removes a team member", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.team.add({ name: "Bob", color: "oklch(0.55 0.20 150)" });
    await caller.team.remove({ memberId: 1 });
    const all = await caller.team.getAll();
    expect(all).toHaveLength(0);
  });
});

describe("Property Assignments API", () => {
  const ctx = createPublicContext();

  beforeEach(async () => {
    const db = await import("./db");
    (db as any).__resetStores();
  });

  it("returns empty map initially", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.assignments.getAll();
    expect(result).toEqual({});
  });

  it("assigns a property to a team member", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.assignments.assign({ propertyId: 42, memberId: 1 });
    const result = await caller.assignments.getAll();
    expect(result["42"]).toBe(1);
  });

  it("unassigns a property", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.assignments.assign({ propertyId: 42, memberId: 1 });
    await caller.assignments.assign({ propertyId: 42, memberId: null });
    const result = await caller.assignments.getAll();
    expect(result["42"]).toBeUndefined();
  });

  it("bulk assigns properties", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.assignments.bulkAssign({
      propertyIds: [10, 20, 30],
      memberId: 5,
    });
    const result = await caller.assignments.getAll();
    expect(result["10"]).toBe(5);
    expect(result["20"]).toBe(5);
    expect(result["30"]).toBe(5);
  });
});

describe("Property Notes API", () => {
  const ctx = createPublicContext();

  beforeEach(async () => {
    const db = await import("./db");
    (db as any).__resetStores();
  });

  it("returns empty map initially", async () => {
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notes.getAll();
    expect(result).toEqual({});
  });

  it("sets and retrieves a note", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.notes.setNote({ propertyId: 99, text: "Needs follow-up" });
    const result = await caller.notes.getAll();
    expect(result["99"]).toBeDefined();
    expect(result["99"].text).toBe("Needs follow-up");
  });

  it("deletes a note when text is empty", async () => {
    const caller = appRouter.createCaller(ctx);
    await caller.notes.setNote({ propertyId: 99, text: "Needs follow-up" });
    await caller.notes.setNote({ propertyId: 99, text: "" });
    const result = await caller.notes.getAll();
    expect(result["99"]).toBeUndefined();
  });
});
