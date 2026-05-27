import { Router } from "express";
import { db, questionsTable, testsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const {
      testId, subject, questionText, questionType,
      optionA, optionB, optionC, optionD,
      correctOption, correctNumerical,
      marks, negativeMarks, orderIndex, solution
    } = req.body;
    const [question] = await db.insert(questionsTable).values({
      testId,
      subject,
      questionText,
      questionType: questionType ?? "mcq",
      optionA,
      optionB,
      optionC,
      optionD,
      correctOption,
      correctNumerical: correctNumerical?.toString(),
      marks: marks ?? 4,
      negativeMarks: negativeMarks?.toString() ?? "1",
      orderIndex: orderIndex ?? 0,
      solution,
    }).returning();
    await db.update(testsTable)
      .set({ totalQuestions: sql`${testsTable.totalQuestions} + 1` })
      .where(eq(testsTable.id, testId));
    res.status(201).json({
      id: question.id,
      testId: question.testId,
      subject: question.subject,
      questionText: question.questionText,
      questionType: question.questionType,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      correctNumerical: question.correctNumerical ? parseFloat(question.correctNumerical) : null,
      marks: question.marks,
      negativeMarks: parseFloat(question.negativeMarks ?? "1"),
      orderIndex: question.orderIndex,
      solution: question.solution,
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:questionId", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const questionId = parseInt(req.params.questionId as string);
    const { questionText, optionA, optionB, optionC, optionD, correctOption, correctNumerical, solution } = req.body;
    const updates: Record<string, unknown> = {};
    if (questionText !== undefined) updates.questionText = questionText;
    if (optionA !== undefined) updates.optionA = optionA;
    if (optionB !== undefined) updates.optionB = optionB;
    if (optionC !== undefined) updates.optionC = optionC;
    if (optionD !== undefined) updates.optionD = optionD;
    if (correctOption !== undefined) updates.correctOption = correctOption;
    if (correctNumerical !== undefined) updates.correctNumerical = correctNumerical?.toString();
    if (solution !== undefined) updates.solution = solution;
    const [question] = await db.update(questionsTable).set(updates).where(eq(questionsTable.id, questionId)).returning();
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    res.json({
      id: question.id,
      testId: question.testId,
      subject: question.subject,
      questionText: question.questionText,
      questionType: question.questionType,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      correctNumerical: question.correctNumerical ? parseFloat(question.correctNumerical) : null,
      marks: question.marks,
      negativeMarks: parseFloat(question.negativeMarks ?? "1"),
      orderIndex: question.orderIndex,
      solution: question.solution,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:questionId", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const questionId = parseInt(req.params.questionId as string);
    const [question] = await db.select({ testId: questionsTable.testId }).from(questionsTable).where(eq(questionsTable.id, questionId)).limit(1);
    if (question) {
      await db.delete(questionsTable).where(eq(questionsTable.id, questionId));
      await db.update(testsTable)
        .set({ totalQuestions: sql`GREATEST(${testsTable.totalQuestions} - 1, 0)` })
        .where(eq(testsTable.id, question.testId));
    }
    res.json({ message: "Question deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
