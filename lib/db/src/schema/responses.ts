import { pgTable, text, serial, timestamp, integer, boolean, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { sessionsTable } from "./sessions";
import { questionsTable } from "./questions";

export const responsesTable = pgTable("responses", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => sessionsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id),
  selectedOption: text("selected_option"),
  numericalAnswer: numeric("numerical_answer", { precision: 15, scale: 4 }),
  status: text("status").notNull().default("unattempted"),
  markedForReview: boolean("marked_for_review").notNull().default(false),
  isCorrect: boolean("is_correct"),
  marksAwarded: numeric("marks_awarded", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertResponseSchema = createInsertSchema(responsesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResponse = z.infer<typeof insertResponseSchema>;
export type Response = typeof responsesTable.$inferSelect;
