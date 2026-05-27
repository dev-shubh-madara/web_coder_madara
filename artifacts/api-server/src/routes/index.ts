import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import testsRouter from "./tests";
import questionsRouter from "./questions";
import sessionsRouter from "./sessions";
import dashboardRouter from "./dashboard";
import leaderboardRouter from "./leaderboard";
import platformRouter from "./platform";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/tests", testsRouter);
router.use("/questions", questionsRouter);
router.use("/sessions", sessionsRouter);
router.use("/dashboard", dashboardRouter);
router.use("/leaderboard", leaderboardRouter);
router.use("/platform", platformRouter);
router.use("/admin", adminRouter);

export default router;
