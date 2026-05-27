import { Router } from "express";
import { db, usersTable, testsTable, questionsTable, sessionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/stats", async (req, res, next) => {
  try {
    const [studentsRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [testsRow] = await db.select({ count: sql<number>`count(*)` }).from(testsTable);
    const [questionsRow] = await db.select({ count: sql<number>`count(*)` }).from(questionsTable);
    const [sessionsRow] = await db.select({ count: sql<number>`count(*)` }).from(sessionsTable);
    res.json({
      totalStudents: Number(studentsRow?.count ?? 0),
      totalTests: Number(testsRow?.count ?? 0),
      totalQuestions: Number(questionsRow?.count ?? 0),
      testsAttempted: Number(sessionsRow?.count ?? 0),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
