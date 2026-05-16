import mongoose from "mongoose";
import { IGetLeaderBoard } from "../interface/leadeboard.interface";
import GroupGoal from "../models/groupGoal.model";
import { resolveDateRange } from "../utils/timeWindow";
import {
  buildCacheKey,
  resolveCacheTTL,
  resolveRankField,
  resolveSortField,
} from "../utils/leaderBoard";
import StudyGroup from "../models/studyGroup.model";
import { AppError } from "../utils/appError";
import { redisClient } from "../config/redis";

class LeaderboardService {
  async getLeaderboard(data: IGetLeaderBoard) {
    const {
      groupId,
      metric,
      timeWindow,
      subjectIds,
      sortBy,
      sort,
      offset,
      limit,
      viewerId,
    } = data;
    const goal = await GroupGoal.findOne({ groupId, status: "active" }).lean();
    if (!goal) {
      throw new AppError(
        "ACTIVE_GOAL_NOT_FOUND",
        "No active goal for this group. please ask the group creator to add a new goal",
        404,
        `Group id ${String(groupId)} does not have an active goal.`,
      );
    }

    // 3. Subject filter: ignored for single-subject goal
    const isMultiSubject =
      Array.isArray(goal.subjectIds) && goal.subjectIds.length > 1;
    const goalSubjectSet = new Set(
      (goal.subjectIds ?? []).map((id) => id.toString()),
    );
    const filteredSubjectIds = (subjectIds ?? []).filter((id) =>
      goalSubjectSet.has(id),
    );
    const effectiveSubjectIds =
      isMultiSubject && filteredSubjectIds.length > 0
        ? filteredSubjectIds.map((s) => new mongoose.Types.ObjectId(s))
        : null;

    //cache check
    const cacheKey = buildCacheKey(String(goal._id), data);
    if (redisClient) {
      const cachedData = await redisClient.get<string>(cacheKey);
      if (typeof cachedData === "string" && cachedData.length > 0) {
        return JSON.parse(cachedData);
      }
    }

    const dateRange = resolveDateRange(timeWindow, goal);

    const rankField = resolveRankField(metric);
    const sortField = resolveSortField(sortBy ?? metric);
    const sortDirection = sort === "asc" ? 1 : -1;
    const groupObjectId = new mongoose.Types.ObjectId(groupId);
    const safeOffset = Math.max(offset ?? 0, 0);
    const safeLimit = Math.max(Math.min(limit ?? 10, 50), 1);
    const goalValues = goal as {
      totalQuestions?: number;
      targetCount?: number;
    };
    const goalTarget = Number(
      goalValues.totalQuestions ?? goalValues.targetCount ?? 0,
    );
    const percentageExpr =
      goalTarget > 0
        ? {
            $round: [
              {
                $multiply: [{ $divide: ["$questionsSolved", goalTarget] }, 100],
              },
              2,
            ],
          }
        : 0;

    const pipeline = await StudyGroup.aggregate([
      { $match: { _id: groupObjectId } },
      { $project: { members: 1 } },
      { $unwind: "$members" },
      { $project: { _id: "$members", userId: "$members" } },
      {
        $lookup: {
          from: "groupmemberactivities",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
                    { $eq: ["$goalId", goal._id] },
                    { $eq: ["$countedTowardsGoal", true] },
                  ],
                },
                ...(dateRange && {
                  activityDate: {
                    $gte: dateRange.from,
                    $lte: dateRange.to,
                  },
                }),
                ...(effectiveSubjectIds && {
                  subjectId: { $in: effectiveSubjectIds },
                }),
              },
            },
            {
              $group: {
                _id: "$userId",
                questionsSolved: {
                  $sum: {
                    $cond: [{ $eq: ["$status", ["solved","correct"]] }, 1, 0],
                  },
                },
                timeSpent: { $sum: "$timeSpent" },
              },
            },
          ],
          as: "activity",
        },
      },
      {
        $addFields: {
          questionsSolved: {
            $ifNull: [{ $arrayElemAt: ["$activity.questionsSolved", 0] }, 0],
          },
          timeSpent: {
            $ifNull: [{ $arrayElemAt: ["$activity.timeSpent", 0] }, 0],
          },
        },
      },
      { $addFields: { percentage: percentageExpr } },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $addFields: {
          name: "$user.name",
          email: "$user.email",
          avatar: "$user.avatar",
        },
      },
      { $project: { user: 0, activity: 0 } },
      {
        $setWindowFields: {
          sortBy: { [rankField]: -1 },
          output: {
            rank: {
              $denseRank: {},
            },
          },
        },
      },
      {
        $facet: {
          entries: [
            { $sort: { [sortField]: sortDirection, userId: 1 } },
            { $skip: safeOffset },
            { $limit: safeLimit },
          ],
          currentUser: viewerId
            ? [
                {
                  $match: {
                    userId: new mongoose.Types.ObjectId(viewerId),
                  },
                },
                { $limit: 1 },
              ]
            : [{ $limit: 0 }],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const result = pipeline[0] ?? {
      entries: [],
      currentUser: [],
      totalCount: [],
    };
    const totalMembers = result.totalCount?.[0]?.count ?? 0;
    const leaderboard = (result.entries ?? []).map((entry: any) => ({
      user: entry.email,
      userId: entry.userId,
      name: entry.name,
      solved: entry.questionsSolved,
      percentage: entry.percentage,
      rank: entry.rank,
      timeSpent: entry.timeSpent,
    }));
    const currentUserEntry = result.currentUser?.[0]
      ? {
          user: result.currentUser[0].email,
          userId: result.currentUser[0].userId,
          name: result.currentUser[0].name,
          solved: result.currentUser[0].questionsSolved,
          percentage: result.currentUser[0].percentage,
          rank: result.currentUser[0].rank,
          timeSpent: result.currentUser[0].timeSpent,
        }
      : null;
    const response = {
      goalId: String(goal._id),
      totalMembers,
      leaderboard,
      currentUser: currentUserEntry,
      offset: safeOffset,
      limit: safeLimit,
    };
    if (redisClient) {
      const ttl = resolveCacheTTL(goal);
      if (ttl > 0) {
        const cacheSetKey = `leaderboard:keys:${String(goal._id)}`;
        await redisClient.set(cacheKey, JSON.stringify(response), { ex: ttl });
        await redisClient.sadd(cacheSetKey, cacheKey);
        await redisClient.expire(cacheSetKey, ttl);
      }
    }
    return response;
  }
}

export default new LeaderboardService();
