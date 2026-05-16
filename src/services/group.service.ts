import StudyGroup from "../models/studyGroup.model";
import GroupGoal from "../models/groupGoal.model";
import userService from "../services/user.service";
import {
  IAddGroupGoalDTO,
  ICreateGroupDTO,
} from "../interface/group.interface";
import GroupMemberActivity from "../models/groupMemberActivity.model";
import Subject from "../models/subject.model";
import mongoose from "mongoose";
import { AppError } from "../utils/appError";
import { resolveCacheTTL } from "../utils/leaderBoard";
import { redisClient } from "../config/redis";

class GroupService {
  /**
   * Create a new group.
   */
  async createGroup(groupData: ICreateGroupDTO) {
    const group = await StudyGroup.create({
      name: groupData.name,
      members: groupData.members,
      creatorId: groupData.creatorId,
    });

    await group.populate("members", "email");
    return group;
  }

  /**
   * Add a member to a group.
   */
  async addGroupMember(groupId: string, email: string) {
    const userIds = await userService.getUserIdsByEmails([email]);
    const userId = userIds[0];
    const group = await StudyGroup.findByIdAndUpdate(
      groupId,
      { $push: { members: userId } },
      { new: true },
    ).populate("members", "email");

    return group;
  }

  /**
   * Add a new goal to a group and set it as active.
   */
  async addGroupGoal(groupId: string, goalData: IAddGroupGoalDTO) {
    const normalizedDeadline =
      goalData.goalType === "recurring" ? null : (goalData.deadline ?? null);
    const normalizedFrequency =
      goalData.goalType === "recurring" ? (goalData.frequency ?? null) : null;

    const goal = await GroupGoal.create({
      groupId,
      title: goalData.title,
      subjectIds: goalData.subjectIds,
      metric: goalData.metric,
      targetCount: goalData.targetCount,
      totalQuestions: goalData.totalQuestions ?? goalData.totalQuestions,
      goalType: goalData.goalType,
      deadline: normalizedDeadline,
      frequency: normalizedFrequency,
      ...(goalData.startDate && { startDate: goalData.startDate }),
    });

    await StudyGroup.findByIdAndUpdate(groupId, { activeGoalId: goal._id });
    await goal.populate("subjectIds", "name");

    return goal;
  }

  async getGroupProgress(groupId: string) {
    const goal = await GroupGoal.findOne({ groupId, status: "active" }).lean();
    if (!goal) {
      throw new AppError(
        "ACTIVE_GOAL_NOT_FOUND",
        "No active goal found for the group",
        404,
        `Group id ${String(groupId)} does not have an active goal.`,
      );
    }

    const cacheKey = `progress:${String(goal._id)}`;
    if (redisClient) {
      const cachedProgress = await redisClient.get<string>(cacheKey);
      if (typeof cachedProgress === "string" && cachedProgress.length > 0) {
        return JSON.parse(cachedProgress);
      }
    }

    const subjectNames = (
      await Subject.find({ _id: { $in: goal.subjectIds } })
        .select("name")
        .lean()
    ).map((s) => s.name);
    //per member progress
    /**
     *    {"user": "user1@gmail.com", "solved": 10}, 
    {"user": "user2@gmail.com", "solved": 20}, 
    {"user": "user3@gmail.com", "solved": 15}
     */
    const perMemberProgress = await GroupMemberActivity.aggregate([
      {
        $match: {
          groupId: new mongoose.Types.ObjectId(groupId),
          goalId: goal._id,
          countedTowardsGoal: true,
        },
      },
      {
        $group: {
          _id: "$userId",
          solved: {
            $sum: {
              $cond: [{ $eq: ["$status", ["solved","correct"]] }, 1, 0],
            },
          },
          totalTimeSpent: { $sum: "$timeSpent" },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          id: "$user._id",
          email: "$user.email",
          name: "$user.name",
          solved: 1,
          totalTimeSpent: 1,
        },
      },
      {
        $sort: { solved: -1 },
      },
    ]);

    const response = {
      goalId: goal._id,
      title: goal.title,
      metric: goal.metric,
      subjectNames,
      totalQuestions: goal.totalQuestions,
      questionsSolved: goal.questionsSolved,
      progressPercentage:
        goal.totalQuestions > 0
          ? (goal.questionsSolved / goal.totalQuestions) * 100
          : 0,
      perMemberProgress,
    };
    if (redisClient) {
      const ttl = resolveCacheTTL(goal);
      if (ttl > 0) {
        await redisClient.set(cacheKey, JSON.stringify(response), { ex: ttl });
      }
    }
    return response;
  }
}

export default new GroupService();
