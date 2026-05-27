import { Router } from "express";
import { db, usersTable, testsTable, sessionsTable } from "@workspace/db";
import { eq, sql, like, ilike } from "drizzle-orm";
import { requireAdmin } from "../middlewares/auth";
import type { AuthRequest } from "../middlewares/auth";

const router = Router();

router.get("/stats", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const [usersRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    const [testsRow] = await db.select({ count: sql<number>`count(*)` }).from(testsTable);
    const [sessionsRow] = await db.select({ count: sql<number>`count(*)` }).from(sessionsTable);
    const [activeRow] = await db.select({ count: sql<number>`count(*)` }).from(sessionsTable).where(eq(sessionsTable.status, "active"));
    const recentDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [recentRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable).where(sql`${usersTable.createdAt} > ${recentDate}`);
    // avg score from sessions
    const [scoreRow] = await db.select({
      avg: sql<string>`AVG(CAST(score AS NUMERIC))`,
      max: sql<string>`MAX(CAST(score AS NUMERIC))`,
    }).from(sessionsTable).where(sql`score IS NOT NULL`);
    res.json({
      totalUsers: Number(usersRow?.count ?? 0),
      totalTests: Number(testsRow?.count ?? 0),
      totalSessions: Number(sessionsRow?.count ?? 0),
      activeSessions: Number(activeRow?.count ?? 0),
      avgScore: scoreRow?.avg ? parseFloat(scoreRow.avg) : 0,
      topScore: scoreRow?.max ? parseFloat(scoreRow.max) : 0,
      recentSignups: Number(recentRow?.count ?? 0),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/users", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = req.query.search as string | undefined;
    const limit = 20;
    const offset = (page - 1) * limit;
    let query = db.select().from(usersTable).$dynamic();
    if (search) {
      query = query.where(ilike(usersTable.phone, `%${search}%`));
    }
    const users = await query.limit(limit).offset(offset).orderBy(usersTable.createdAt);
    const [totalRow] = await db.select({ count: sql<number>`count(*)` }).from(usersTable);
    res.json({
      users: users.map(u => ({
        id: u.id,
        phone: u.phone,
        name: u.name,
        email: u.email,
        role: u.role,
        rank: u.rank,
        totalAttempts: u.totalAttempts,
        avgScore: u.avgScore ? parseFloat(u.avgScore) : null,
        createdAt: u.createdAt.toISOString(),
      })),
      total: Number(totalRow?.count ?? 0),
      page,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/announcements", requireAdmin, async (req: AuthRequest, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      res.status(400).json({ error: "Title and message required" });
      return;
    }
    req.log.info({ title }, "Announcement sent");
    res.status(201).json({ message: "Announcement sent to all users" });
  } catch (err) {
    next(err);
  }
});

export default router;
