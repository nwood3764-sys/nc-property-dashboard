import { eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  outreachStatuses,
  teamMembers,
  propertyAssignments,
  propertyNotes,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User helpers ───────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Outreach Status helpers ────────────────────────────────────

export async function getAllOutreachStatuses() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(outreachStatuses);
}

export async function upsertOutreachStatus(
  propertyId: number,
  status: "none" | "target" | "contacted" | "in_progress" | "complete"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status === "none") {
    await db.delete(outreachStatuses).where(eq(outreachStatuses.propertyId, propertyId));
    return null;
  }

  await db
    .insert(outreachStatuses)
    .values({ propertyId, status })
    .onDuplicateKeyUpdate({ set: { status } });

  const result = await db
    .select()
    .from(outreachStatuses)
    .where(eq(outreachStatuses.propertyId, propertyId))
    .limit(1);
  return result[0] ?? null;
}

export async function bulkUpsertOutreachStatus(
  propertyIds: number[],
  status: "none" | "target" | "contacted" | "in_progress" | "complete"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (status === "none") {
    if (propertyIds.length > 0) {
      await db.delete(outreachStatuses).where(inArray(outreachStatuses.propertyId, propertyIds));
    }
    return;
  }

  // Upsert each one (MySQL doesn't support bulk upsert with ON DUPLICATE KEY easily for multiple values)
  for (const propertyId of propertyIds) {
    await db
      .insert(outreachStatuses)
      .values({ propertyId, status })
      .onDuplicateKeyUpdate({ set: { status } });
  }
}

// ─── Team Member helpers ────────────────────────────────────────

export async function getAllTeamMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(teamMembers);
}

export async function addTeamMember(name: string, color: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(teamMembers).values({ name, color });
  const insertId = result[0].insertId;
  const rows = await db.select().from(teamMembers).where(eq(teamMembers.id, insertId)).limit(1);
  return rows[0];
}

export async function deleteTeamMember(memberId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Remove all assignments for this member first
  await db.delete(propertyAssignments).where(eq(propertyAssignments.memberId, memberId));
  // Then remove the member
  await db.delete(teamMembers).where(eq(teamMembers.id, memberId));
}

// ─── Property Assignment helpers ────────────────────────────────

export async function getAllAssignments() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyAssignments);
}

export async function upsertAssignment(propertyId: number, memberId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (memberId === null) {
    await db.delete(propertyAssignments).where(eq(propertyAssignments.propertyId, propertyId));
    return null;
  }

  await db
    .insert(propertyAssignments)
    .values({ propertyId, memberId })
    .onDuplicateKeyUpdate({ set: { memberId } });

  const result = await db
    .select()
    .from(propertyAssignments)
    .where(eq(propertyAssignments.propertyId, propertyId))
    .limit(1);
  return result[0] ?? null;
}

export async function bulkUpsertAssignments(propertyIds: number[], memberId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (memberId === null) {
    if (propertyIds.length > 0) {
      await db
        .delete(propertyAssignments)
        .where(inArray(propertyAssignments.propertyId, propertyIds));
    }
    return;
  }

  for (const propertyId of propertyIds) {
    await db
      .insert(propertyAssignments)
      .values({ propertyId, memberId })
      .onDuplicateKeyUpdate({ set: { memberId } });
  }
}

// ─── Property Notes helpers ─────────────────────────────────────

export async function getAllNotes() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(propertyNotes);
}

export async function upsertNote(propertyId: number, noteText: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const trimmed = noteText.trim();
  if (!trimmed) {
    await db.delete(propertyNotes).where(eq(propertyNotes.propertyId, propertyId));
    return null;
  }

  await db
    .insert(propertyNotes)
    .values({ propertyId, noteText: trimmed })
    .onDuplicateKeyUpdate({ set: { noteText: trimmed } });

  const result = await db
    .select()
    .from(propertyNotes)
    .where(eq(propertyNotes.propertyId, propertyId))
    .limit(1);
  return result[0] ?? null;
}
