import { Router } from "express";
import { db, usersTable, otpsTable, authTokensTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import crypto from "crypto";
import type { AuthRequest } from "../middlewares/auth";
import { requireAuth } from "../middlewares/auth";

const router = Router();

// The email that is always granted admin access. Can be overridden via env.
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "shubhkumarmishra82@gmail.com").trim().toLowerCase();
// Password gate for the admin-only login. Set ADMIN_PASSWORD in your Vercel
// project's environment variables — do not rely on the fallback in production.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "madara-admin-2026";

function serializeUser(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    rank: user.rank,
    totalAttempts: user.totalAttempts,
    avgScore: user.avgScore ? parseFloat(user.avgScore) : null,
    createdAt: user.createdAt.toISOString(),
  };
}

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

router.post("/send-otp", async (req, res, next) => {
  try {
    const { phone } = req.body as { phone: string };
    if (!phone || !/^\d{10}$/.test(phone.replace(/\D/g, ""))) {
      res.status(400).json({ error: "Invalid phone number" });
      return;
    }
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const [inserted] = await db.insert(otpsTable).values({
      phone,
      otpCode: otp,
      expiresAt,
    }).returning({ id: otpsTable.id });
    req.log.info({ phone }, "OTP generated");
    // In production, send OTP via SMS. For now return it directly.
    res.json({ message: "OTP sent successfully", otpId: String(inserted.id), otp });
  } catch (err) {
    next(err);
  }
});

router.post("/verify-otp", async (req, res, next) => {
  try {
    const { phone, otp } = req.body as { phone: string; otp: string };
    if (!phone || !otp) {
      res.status(400).json({ error: "Phone and OTP are required" });
      return;
    }
    const [otpRecord] = await db
      .select()
      .from(otpsTable)
      .where(
        and(
          eq(otpsTable.phone, phone),
          eq(otpsTable.otpCode, otp),
          eq(otpsTable.used, false),
          gt(otpsTable.expiresAt, new Date()),
        ),
      )
      .orderBy(otpsTable.createdAt)
      .limit(1);
    if (!otpRecord) {
      res.status(400).json({ error: "Invalid or expired OTP" });
      return;
    }
    await db.update(otpsTable).set({ used: true }).where(eq(otpsTable.id, otpRecord.id));
    let [user] = await db.select().from(usersTable).where(eq(usersTable.phone, phone)).limit(1);
    if (!user) {
      [user] = await db.insert(usersTable).values({ phone, role: "student" }).returning();
    } else if (user.email?.trim().toLowerCase() === ADMIN_EMAIL && user.role !== "admin") {
      // Auto-elevate: if this account's saved email is the admin email, keep it admin.
      [user] = await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id)).returning();
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(authTokensTable).values({ userId: user.id, token, expiresAt });
    res.json({
      user: serializeUser(user),
      token,
    });
  } catch (err) {
    next(err);
  }
});

// Dedicated admin login: email + password. Only ADMIN_EMAIL can use this,
// and it automatically grants/keeps the "admin" role on that account so the
// frontend can route straight to the admin dashboard on success.
router.post("/admin-login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    if (email.trim().toLowerCase() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      res.status(401).json({ error: "Invalid admin credentials" });
      return;
    }
    let [user] = await db.select().from(usersTable).where(eq(usersTable.email, ADMIN_EMAIL)).limit(1);
    if (!user) {
      [user] = await db
        .insert(usersTable)
        .values({ phone: `admin-${Date.now()}`, email: ADMIN_EMAIL, name: "Admin", role: "admin" })
        .returning();
    } else if (user.role !== "admin") {
      [user] = await db.update(usersTable).set({ role: "admin" }).where(eq(usersTable.id, user.id)).returning();
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.insert(authTokensTable).values({ userId: user.id, token, expiresAt });
    res.json({ user: serializeUser(user), token });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const authHeader = req.headers.authorization!;
    const token = authHeader.slice(7);
    await db.delete(authTokensTable).where(eq(authTokensTable.token, token));
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId!)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      role: user.role,
      rank: user.rank,
      totalAttempts: user.totalAttempts,
      avgScore: user.avgScore ? parseFloat(user.avgScore) : null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
