import { Router } from "express";
import { db, sessionsTable, testsTable, questionsTable, responsesTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";

const router = Router();

router.post("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { testId } = req.body as { testId: number };
    const [test] = await db.select().from(testsTable).where(eq(testsTable.id, testId)).limit(1);
    if (!test) {
      res.status(404).json({ error: "Test not found" });
      return;
    }
    const [session] = await db.insert(sessionsTable).values({
      testId,
      userId: req.userId!,
      status: "active",
    }).returning();
    await db.update(testsTable)
      .set({ attemptCount: sql`${testsTable.attemptCount} + 1` })
      .where(eq(testsTable.id, testId));
    res.status(201).json({
      id: session.id,
      testId: session.testId,
      userId: session.userId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      submittedAt: session.submittedAt?.toISOString() ?? null,
      timeLimit: test.duration * 60,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessions = await db
      .select({
        id: sessionsTable.id,
        testId: sessionsTable.testId,
        testTitle: testsTable.title,
        testType: testsTable.type,
        status: sessionsTable.status,
        startedAt: sessionsTable.startedAt,
        submittedAt: sessionsTable.submittedAt,
        score: sessionsTable.score,
        percentile: sessionsTable.percentile,
        maxMarks: testsTable.maxMarks,
        rank: sessionsTable.rank,
      })
      .from(sessionsTable)
      .leftJoin(testsTable, eq(sessionsTable.testId, testsTable.id))
      .where(eq(sessionsTable.userId, req.userId!))
      .orderBy(sql`${sessionsTable.startedAt} DESC`);
    res.json(sessions.map(s => ({
      id: s.id,
      testId: s.testId,
      testTitle: s.testTitle ?? "",
      status: s.status,
      startedAt: s.startedAt.toISOString(),
      submittedAt: s.submittedAt?.toISOString() ?? null,
      score: s.score ? parseFloat(s.score) : null,
      totalMarks: s.maxMarks,
      percentile: s.percentile ? parseFloat(s.percentile) : null,
    })));
  } catch (err) {
    next(err);
  }
});

router.get("/:sessionId", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId as string);
    const [session] = await db
      .select()
      .from(sessionsTable)
      .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.userId!)))
      .limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const [test] = await db.select().from(testsTable).where(eq(testsTable.id, session.testId)).limit(1);
    const questions = await db.select().from(questionsTable)
      .where(eq(questionsTable.testId, session.testId))
      .orderBy(questionsTable.orderIndex);
    const responses = await db.select().from(responsesTable)
      .where(eq(responsesTable.sessionId, sessionId));
    const elapsed = Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
    const timeLimit = Math.max(0, (test?.duration ?? 180) * 60 - elapsed);
    res.json({
      id: session.id,
      testId: session.testId,
      userId: session.userId,
      status: session.status,
      startedAt: session.startedAt.toISOString(),
      submittedAt: session.submittedAt?.toISOString() ?? null,
      testName: test?.title ?? "JEE Main Mock",
      timeLimit,
      questions: questions.map(q => ({
        id: q.id,
        subject: q.subject,
        questionText: q.questionText,
        questionType: q.questionType,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        marks: q.marks,
        negativeMarks: parseFloat(q.negativeMarks ?? "1"),
        orderIndex: q.orderIndex,
      })),
      answers: responses.map(r => ({
        questionId: r.questionId,
        selectedOption: r.selectedOption,
        numericalAnswer: r.numericalAnswer ? parseFloat(r.numericalAnswer) : null,
        status: r.status,
        markedForReview: r.markedForReview,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.patch("/:sessionId/answers", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId as string);
    const [session] = await db.select().from(sessionsTable)
      .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.userId!)))
      .limit(1);
    if (!session || session.status !== "active") {
      res.status(400).json({ error: "Session not active" });
      return;
    }
    const { answers } = req.body as {
      answers: Array<{
        questionId: number;
        selectedOption?: string | null;
        numericalAnswer?: number | null;
        status: string;
        markedForReview?: boolean;
      }>;
    };
    for (const answer of answers) {
      const existing = await db.select({ id: responsesTable.id }).from(responsesTable)
        .where(and(eq(responsesTable.sessionId, sessionId), eq(responsesTable.questionId, answer.questionId)))
        .limit(1);
      if (existing.length > 0) {
        await db.update(responsesTable).set({
          selectedOption: answer.selectedOption ?? null,
          numericalAnswer: answer.numericalAnswer?.toString() ?? null,
          status: answer.status,
          markedForReview: answer.markedForReview ?? false,
        }).where(and(eq(responsesTable.sessionId, sessionId), eq(responsesTable.questionId, answer.questionId)));
      } else {
        await db.insert(responsesTable).values({
          sessionId,
          questionId: answer.questionId,
          selectedOption: answer.selectedOption ?? null,
          numericalAnswer: answer.numericalAnswer?.toString() ?? null,
          status: answer.status,
          markedForReview: answer.markedForReview ?? false,
        });
      }
    }
    res.json({ message: "Answers saved" });
  } catch (err) {
    next(err);
  }
});

router.post("/:sessionId/submit", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId as string);
    const [session] = await db.select().from(sessionsTable)
      .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.userId!)))
      .limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    if (session.status !== "active") {
      // Already submitted — return existing result
      const result = await buildResult(sessionId, session);
      res.json(result);
      return;
    }
    await db.update(sessionsTable).set({
      status: "submitted",
      submittedAt: new Date(),
    }).where(eq(sessionsTable.id, sessionId));
    const [updatedSession] = await db.select().from(sessionsTable).where(eq(sessionsTable.id, sessionId)).limit(1);
    const result = await buildResult(sessionId, updatedSession);
    // Update session score/percentile
    await db.update(sessionsTable).set({
      score: result.totalScore.toString(),
      percentile: result.percentile.toString(),
      rank: result.rank,
    }).where(eq(sessionsTable.id, sessionId));
    // Update user stats
    await db.update(usersTable).set({
      totalAttempts: sql`${usersTable.totalAttempts} + 1`,
    }).where(eq(usersTable.id, req.userId!));
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.get("/:sessionId/result", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const sessionId = parseInt(req.params.sessionId as string);
    const [session] = await db.select().from(sessionsTable)
      .where(and(eq(sessionsTable.id, sessionId), eq(sessionsTable.userId, req.userId!)))
      .limit(1);
    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }
    const result = await buildResult(sessionId, session);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

async function buildResult(sessionId: number, session: typeof sessionsTable.$inferSelect) {
  const [test] = await db.select().from(testsTable).where(eq(testsTable.id, session.testId)).limit(1);
  const questions = await db.select().from(questionsTable).where(eq(questionsTable.testId, session.testId));
  const responses = await db.select().from(responsesTable).where(eq(responsesTable.sessionId, sessionId));
  const responseMap = new Map(responses.map(r => [r.questionId, r]));
  let totalScore = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  const subjectMap: Record<string, { score: number; maxScore: number; correct: number; incorrect: number; unattempted: number }> = {};
  const questionResults = [];
  for (const q of questions) {
    if (!subjectMap[q.subject]) {
      subjectMap[q.subject] = { score: 0, maxScore: 0, correct: 0, incorrect: 0, unattempted: 0 };
    }
    subjectMap[q.subject].maxScore += q.marks;
    const resp = responseMap.get(q.id);
    const marks = q.marks;
    const negMarks = parseFloat(q.negativeMarks ?? "1");
    let isCorrect = false;
    let marksAwarded = 0;
    if (!resp || resp.status === "unattempted" || (!resp.selectedOption && resp.numericalAnswer === null)) {
      unattempted++;
      subjectMap[q.subject].unattempted++;
    } else if (q.questionType === "mcq") {
      if (resp.selectedOption && resp.selectedOption === q.correctOption) {
        isCorrect = true;
        marksAwarded = marks;
        correct++;
        subjectMap[q.subject].correct++;
      } else if (resp.selectedOption) {
        marksAwarded = -negMarks;
        incorrect++;
        subjectMap[q.subject].incorrect++;
      } else {
        unattempted++;
        subjectMap[q.subject].unattempted++;
      }
    } else if (q.questionType === "numerical") {
      const correctVal = q.correctNumerical ? parseFloat(q.correctNumerical) : null;
      const givenVal = resp.numericalAnswer !== null ? parseFloat(resp.numericalAnswer ?? "") : null;
      if (givenVal !== null && correctVal !== null && Math.abs(givenVal - correctVal) < 0.01) {
        isCorrect = true;
        marksAwarded = marks;
        correct++;
        subjectMap[q.subject].correct++;
      } else if (givenVal !== null) {
        marksAwarded = -negMarks;
        incorrect++;
        subjectMap[q.subject].incorrect++;
      } else {
        unattempted++;
        subjectMap[q.subject].unattempted++;
      }
    }
    totalScore += marksAwarded;
    subjectMap[q.subject].score += marksAwarded;
    questionResults.push({
      questionId: q.id,
      subject: q.subject,
      questionText: q.questionText,
      questionType: q.questionType,
      selectedOption: resp?.selectedOption ?? null,
      correctOption: q.correctOption,
      numericalAnswer: resp?.numericalAnswer !== null && resp?.numericalAnswer !== undefined ? parseFloat(resp.numericalAnswer) : null,
      correctNumerical: q.correctNumerical ? parseFloat(q.correctNumerical) : null,
      isCorrect,
      marksAwarded,
      solution: q.solution,
    });
  }
  const totalAttempted = correct + incorrect;
  const accuracy = totalAttempted > 0 ? (correct / totalAttempted) * 100 : 0;
  const timeTaken = session.submittedAt
    ? Math.floor((session.submittedAt.getTime() - session.startedAt.getTime()) / 1000)
    : Math.floor((Date.now() - session.startedAt.getTime()) / 1000);
  const percentile = Math.min(99, Math.max(0, Math.round((totalScore / (test?.maxMarks ?? 300)) * 100)));
  const rank = Math.max(1, Math.round(((100 - percentile) / 100) * 100000));
  const subjectResults = Object.entries(subjectMap).map(([subject, data]) => ({
    subject,
    score: data.score,
    maxScore: data.maxScore,
    correct: data.correct,
    incorrect: data.incorrect,
    unattempted: data.unattempted,
    accuracy: (data.correct + data.incorrect) > 0 ? (data.correct / (data.correct + data.incorrect)) * 100 : 0,
  }));
  return {
    sessionId,
    testTitle: test?.title ?? "",
    totalScore,
    maxMarks: test?.maxMarks ?? 300,
    correct,
    incorrect,
    unattempted,
    accuracy,
    timeTaken,
    subjectResults,
    percentile,
    rank,
    questionResults,
  };
}

export default router;
