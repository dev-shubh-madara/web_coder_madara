import { Router } from "express";
import { db, sessionsTable, usersTable } from "@workspace/db";
import { eq, sql, and, not } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const testId = req.query.testId ? parseInt(req.query.testId as string) : null;
    let whereClause = not(eq(sessionsTable.status, "active"));
    if (testId) {
      whereClause = and(whereClause, eq(sessionsTable.testId, testId))!;
    }
    const rows = await db
      .select({
        userId: sessionsTable.userId,
        name: usersTable.name,
        phone: usersTable.phone,
        score: sessionsTable.score,
        percentile: sessionsTable.percentile,
        timeTaken: sql<number>`EXTRACT(EPOCH FROM (${sessionsTable.submittedAt} - ${sessionsTable.startedAt}))::int`,
      })
      .from(sessionsTable)
      .leftJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
      .where(whereClause)
      .orderBy(sql`CAST(${sessionsTable.score} AS NUMERIC) DESC NULLS LAST`)
      .limit(limit);
    res.json(rows.map((r, idx) => ({
      rank: idx + 1,
      userId: r.userId,
      name: r.name,
      phone: r.phone ? r.phone.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2") : "****",
      score: r.score ? parseFloat(r.score) : 0,
      percentile: r.percentile ? parseFloat(r.percentile) : 0,
      accuracy: r.score ? Math.min(100, (parseFloat(r.score) / 300) * 100) : 0,
      timeTaken: r.timeTaken ?? 0,
    })));
  } catch (err) {
    next(err);
  }
});

export default router;
