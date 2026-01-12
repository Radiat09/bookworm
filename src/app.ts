import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import expressSession from "express-session";
import cron from "node-cron";
import passport from "passport";
import { envVars } from "./app/config/env";
import "./app/config/passport";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import { RecommendationServices } from "./app/modules/recommendation/recommendation.service";
import { router } from "./app/routes";

const app = express();

app.use(
  expressSession({
    secret: envVars.EXPRESS_SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());
app.use(express.json());
app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: envVars.FRONTEND_URL,
    credentials: true,
  })
);

cron.schedule("0 2 * * *", async () => {
  console.log("Running recommendation cleanup job...");
  try {
    const deletedCount =
      await RecommendationServices.cleanupExpiredRecommendations();
    console.log(`Cleaned up ${deletedCount} expired recommendations`);
  } catch (error) {
    console.error("Error in recommendation cleanup job:", error);
  }
});

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "🩸 Welcome to Book Worm System Backend",
    port: `📍${envVars.PORT || 5000}`,
    environment: envVars.NODE_ENV,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;
