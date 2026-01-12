// jobs/recommendationCleanup.job.ts
import cron from "node-cron";
import { RecommendationServices } from "../modules/recommendation/recommendation.service";

export const setupRecommendationCleanupJob = () => {
  // Run daily at 2 AM
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

  console.log("Recommendation cleanup job scheduled");
};

// In your server.ts or index.ts
// import { setupRecommendationCleanupJob } from './jobs/recommendationCleanup.job';
// setupRecommendationCleanupJob();
