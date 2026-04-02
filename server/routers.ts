import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getAllOutreachStatuses,
  upsertOutreachStatus,
  bulkUpsertOutreachStatus,
  getAllTeamMembers,
  addTeamMember,
  deleteTeamMember,
  getAllAssignments,
  upsertAssignment,
  bulkUpsertAssignments,
  getAllNotes,
  upsertNote,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── Outreach Status ─────────────────────────────────────────
  outreach: router({
    /** Get all outreach statuses as a map: { [propertyId]: status } */
    getAll: publicProcedure.query(async () => {
      const rows = await getAllOutreachStatuses();
      const map: Record<string, string> = {};
      for (const row of rows) {
        map[String(row.propertyId)] = row.status;
      }
      return map;
    }),

    /** Set status for a single property */
    setStatus: publicProcedure
      .input(
        z.object({
          propertyId: z.number(),
          status: z.enum(["none", "contacted", "in_progress", "complete"]),
        })
      )
      .mutation(async ({ input }) => {
        await upsertOutreachStatus(input.propertyId, input.status);
        return { success: true };
      }),

    /** Bulk set status for multiple properties */
    bulkSetStatus: publicProcedure
      .input(
        z.object({
          propertyIds: z.array(z.number()),
          status: z.enum(["none", "contacted", "in_progress", "complete"]),
        })
      )
      .mutation(async ({ input }) => {
        await bulkUpsertOutreachStatus(input.propertyIds, input.status);
        return { success: true };
      }),
  }),

  // ─── Team Members ─────────────────────────────────────────────
  team: router({
    /** Get all team members */
    getAll: publicProcedure.query(async () => {
      return getAllTeamMembers();
    }),

    /** Add a new team member */
    add: publicProcedure
      .input(z.object({ name: z.string().min(1), color: z.string() }))
      .mutation(async ({ input }) => {
        const member = await addTeamMember(input.name, input.color);
        return member;
      }),

    /** Remove a team member (and their assignments) */
    remove: publicProcedure
      .input(z.object({ memberId: z.number() }))
      .mutation(async ({ input }) => {
        await deleteTeamMember(input.memberId);
        return { success: true };
      }),
  }),

  // ─── Property Assignments ─────────────────────────────────────
  assignments: router({
    /** Get all assignments as a map: { [propertyId]: memberId } */
    getAll: publicProcedure.query(async () => {
      const rows = await getAllAssignments();
      const map: Record<string, number> = {};
      for (const row of rows) {
        map[String(row.propertyId)] = row.memberId;
      }
      return map;
    }),

    /** Assign a property to a team member (or unassign with null) */
    assign: publicProcedure
      .input(
        z.object({
          propertyId: z.number(),
          memberId: z.number().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        await upsertAssignment(input.propertyId, input.memberId);
        return { success: true };
      }),

    /** Bulk assign properties to a team member */
    bulkAssign: publicProcedure
      .input(
        z.object({
          propertyIds: z.array(z.number()),
          memberId: z.number().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        await bulkUpsertAssignments(input.propertyIds, input.memberId);
        return { success: true };
      }),
  }),

  // ─── Property Notes ───────────────────────────────────────────
  notes: router({
    /** Get all notes as a map: { [propertyId]: { text, updatedAt } } */
    getAll: publicProcedure.query(async () => {
      const rows = await getAllNotes();
      const map: Record<string, { text: string; updatedAt: Date }> = {};
      for (const row of rows) {
        map[String(row.propertyId)] = {
          text: row.noteText,
          updatedAt: row.updatedAt,
        };
      }
      return map;
    }),

    /** Set a note for a property (empty string deletes it) */
    setNote: publicProcedure
      .input(z.object({ propertyId: z.number(), text: z.string() }))
      .mutation(async ({ input }) => {
        await upsertNote(input.propertyId, input.text);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
