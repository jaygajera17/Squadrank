import { Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import leaderBoardService from "../services/leaderBoard.service";

class LeaderboardController {
  /**
   * GET /api/leaderboard
   * Retrieve the leaderboard.
   */
  public getLeaderboard = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      //const leaderboard = await leaderBoardService.fetchLeaderboard(req.query);
      const { groupId } = req.params;

      const {
        metric = "questionsSolved",
        timeWindow = "all",
        subject = "", //comma separated subjectIds
        sortBy = "questionsSolved",
        sort = "desc",
        offset = 0,
        limit = 10,
      } = req.query;
      const normalizedMetric =
        metric === "questionSolved" ? "questionsSolved" : metric;
      const allowedMetrics = new Set([
        "questionsSolved",
        "timeSpent",
        "percentage",
      ]);
      const allowedSortBy = new Set([
        "questionsSolved",
        "timeSpent",
        "percentage",
        "userName",
      ]);
      const normalizedTimeWindow =
        timeWindow === "daily"
          ? "day"
          : timeWindow === "weekly"
            ? "week"
            : timeWindow === "monthly"
              ? "month"
              : timeWindow;
      const allowedTimeWindow = new Set(["day", "week", "month", "all"]);
      const allowedSort = new Set(["asc", "desc"]);
      const safeMetric = allowedMetrics.has(String(normalizedMetric))
        ? (String(normalizedMetric) as
            | "questionsSolved"
            | "timeSpent"
            | "percentage")
        : "questionsSolved";
      const safeSortBy = allowedSortBy.has(String(sortBy))
        ? (String(sortBy) as
            | "questionsSolved"
            | "timeSpent"
            | "percentage"
            | "userName")
        : "questionsSolved";
      const safeTimeWindow = allowedTimeWindow.has(String(normalizedTimeWindow))
        ? (String(normalizedTimeWindow) as "day" | "week" | "month" | "all")
        : "all";
      const safeSort = allowedSort.has(String(sort))
        ? (String(sort) as "asc" | "desc")
        : "desc";
      const offsetStr = typeof offset === "string" ? offset : "0";

      const limitStr = typeof limit === "string" ? limit : "10";
      const parsedOffset = Math.max(parseInt(offsetStr) || 0, 0);
      const parsedLimit = Math.min(parseInt(limitStr) || 10, 50);
      const subjectStr = typeof subject === "string" ? subject : "";

      const subjectIds = subjectStr
        ? subjectStr
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const leaderboard = await leaderBoardService.getLeaderboard({
        groupId,
        metric: safeMetric,
        timeWindow: safeTimeWindow,
        subjectIds,
        sortBy: safeSortBy,
        sort: safeSort,
        offset: parsedOffset,
        limit: parsedLimit,
        viewerId: req.user?.id,
      });

      sendSuccess(res, leaderboard, "Leaderboard retrieved successfully", 200);
    },
  );
}

export default new LeaderboardController();
