import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const testsTable = pgTable("tests", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  type: text("type").notNull().default("full"),
  totalQuestions: integer("total_questions").notNull().default(0),
  duration: integer("duration").notNull().default(180),
  maxMarks: integer("max_marks").notNull().default(300),
  description: text("description"),
  status: text("status").notNull().default("published"),
  attemptCount: integer("attempt_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTestSchema = createInsertSchema(testsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof testsTable.$inferSelect;
