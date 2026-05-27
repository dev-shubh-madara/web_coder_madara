import { pgTable, text, serial, timestamp, integer, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { testsTable } from "./tests";

export const questionsTable = pgTable("questions", {
  id: serial("id").primaryKey(),
  testId: integer("test_id").notNull().references(() => testsTable.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  questionText: text("question_text").notNull(),
  questionType: text("question_type").notNull().default("mcq"),
  optionA: text("option_a"),
  optionB: text("option_b"),
  optionC: text("option_c"),
  optionD: text("option_d"),
  correctOption: text("correct_option"),
  correctNumerical: numeric("correct_numerical", { precision: 15, scale: 4 }),
  marks: integer("marks").notNull().default(4),
  negativeMarks: numeric("negative_marks", { precision: 5, scale: 2 }).notNull().default("1"),
  orderIndex: integer("order_index").notNull().default(0),
  solution: text("solution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true });
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type Question = typeof questionsTable.$inferSelect;
