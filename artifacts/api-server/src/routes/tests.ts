import { Router } from "express";
import { db, testsTable, questionsTable } from "@workspace/db";
import { eq, and, like, sql } from "drizzle-orm";
import { requireAuth, requireAdmin } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const { subject, type } = req.query as { subject?: string; type?: string };
    let query = db.select().from(testsTable).$dynamic();
    const conditions = [];
    if (type) conditions.push(eq(testsTable.type, type));
    if (subject) conditions.push(like(testsTable.subject, `%${subject}%`));
    conditions.push(eq(testsTable.status, "published"));
    query = query.where(and(...conditions));
    const tests = await query.orderBy(testsTable.createdAt);
    res.json(tests.map(t => ({
      id: t.id,
      title: t.title,
      subject: t.subject,
      type: t.type,
      totalQuestions: t.totalQuestions,
      duration: t.duration,
      maxMarks: t.maxMarks,
      description: t.description,
      status: t.status,
      attemptCount: t.attemptCount,
      createdAt: t.createdAt.toISOString(),
    })));
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { title, subject, type, duration, maxMarks, description, status } = req.body;
    const [test] = await db.insert(testsTable).values({
      title,
      subject,
      type: type ?? "full",
      duration,
      maxMarks,
      description,
      status: status ?? "published",
    }).returning();
    res.status(201).json({
      id: test.id,
      title: test.title,
      subject: test.subject,
      type: test.type,
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      maxMarks: test.maxMarks,
      description: test.description,
      status: test.status,
      attemptCount: test.attemptCount,
      createdAt: test.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:testId", async (req, res, next) => {
  try {
    const testId = parseInt(req.params.testId as string);
    const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId)).limit(1);
    if (!test) {
      res.status(404).json({ error: "Test not found" });
      return;
    }
    const questions = await db.select().from(questionsTable)
      .where(eq(questionsTable.testId, testId))
      .orderBy(questionsTable.orderIndex);
    res.json({
      id: test.id,
      title: test.title,
      subject: test.subject,
      type: test.type,
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      maxMarks: test.maxMarks,
      description: test.description,
      status: test.status,
      questions: questions.map(q => ({
        id: q.id,
        testId: q.testId,
        subject: q.subject,
        questionText: q.questionText,
        questionType: q.questionType,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        correctNumerical: q.correctNumerical ? parseFloat(q.correctNumerical) : null,
        marks: q.marks,
        negativeMarks: parseFloat(q.negativeMarks ?? "1"),
        orderIndex: q.orderIndex,
        solution: q.solution,
      })),
      createdAt: test.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.put("/:testId", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const testId = parseInt(req.params.testId as string);
    const { title, description, status, duration } = req.body;
    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (duration !== undefined) updates.duration = duration;
    const [test] = await db.update(testsTable).set(updates).where(eq(testsTable.id, testId)).returning();
    if (!test) {
      res.status(404).json({ error: "Test not found" });
      return;
    }
    res.json({
      id: test.id,
      title: test.title,
      subject: test.subject,
      type: test.type,
      totalQuestions: test.totalQuestions,
      duration: test.duration,
      maxMarks: test.maxMarks,
      description: test.description,
      status: test.status,
      attemptCount: test.attemptCount,
      createdAt: test.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/:testId", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const testId = parseInt(req.params.testId as string);
    await db.delete(testsTable).where(eq(testsTable.id, testId));
    res.json({ message: "Test deleted successfully" });
  } catch (err) {
    next(err);
  }
});

export default router;
