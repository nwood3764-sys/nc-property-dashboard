import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Outreach statuses per property.
 * propertyId is the property_id from the CSV dataset (integer).
 * status: "none" | "contacted" | "in_progress" | "complete"
 */
export const outreachStatuses = mysqlTable("outreach_statuses", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  status: mysqlEnum("status", ["none", "contacted", "in_progress", "complete"]).notNull().default("none"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OutreachStatusRow = typeof outreachStatuses.$inferSelect;
export type InsertOutreachStatus = typeof outreachStatuses.$inferInsert;

/**
 * Team members for property assignment.
 * Each member has a name and a color for UI display.
 */
export const teamMembers = mysqlTable("team_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  color: varchar("color", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TeamMemberRow = typeof teamMembers.$inferSelect;
export type InsertTeamMember = typeof teamMembers.$inferInsert;

/**
 * Property assignments linking properties to team members.
 * propertyId is the property_id from the CSV dataset.
 * memberId references team_members.id.
 */
export const propertyAssignments = mysqlTable("property_assignments", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  memberId: int("memberId").notNull(),
  assignedAt: timestamp("assignedAt").defaultNow().notNull(),
});

export type PropertyAssignmentRow = typeof propertyAssignments.$inferSelect;
export type InsertPropertyAssignment = typeof propertyAssignments.$inferInsert;

/**
 * Property notes - free-text notes per property.
 */
export const propertyNotes = mysqlTable("property_notes", {
  id: int("id").autoincrement().primaryKey(),
  propertyId: int("propertyId").notNull().unique(),
  noteText: text("noteText").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PropertyNoteRow = typeof propertyNotes.$inferSelect;
export type InsertPropertyNote = typeof propertyNotes.$inferInsert;
