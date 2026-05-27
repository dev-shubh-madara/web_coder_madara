import type { Request, Response, NextFunction } from "express";
import { db, authTokensTable, usersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: number;
  userRole?: string;
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const [authToken] = await db
      .select({ userId: authTokensTable.userId, expiresAt: authTokensTable.expiresAt })
      .from(authTokensTable)
      .where(and(eq(authTokensTable.token, token), gt(authTokensTable.expiresAt, new Date())))
      .limit(1);
    if (!authToken) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    req.userId = authToken.userId;
    const [user] = await db.select({ role: usersTable.role }).from(usersTable).where(eq(usersTable.id, authToken.userId)).limit(1);
    req.userRole = user?.role ?? "student";
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  await requireAuth(req, res, () => {
    if (req.userRole !== "admin") {
      res.status(403).json({ error: "Forbidden" });
      return;
    }
    next();
  });
}
