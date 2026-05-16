import { IAddGroupMemberActivityDTO } from "../interface/group.interface";
import GroupGoal from "../models/groupGoal.model";
import GroupMemberActivity from "../models/groupMemberActivity.model";
import Question from "../models/question.model";

class ActivityService {
  async saveAndRespond(activityData, counted, responseMeta = {}) {
    try {
      const activity = await GroupMemberActivity.create(activityData);
      return {
        activityId: activity._id,
        counted,
        reason: activityData.notCountedReason ?? null,
        ...responseMeta,
      };
    } catch (error) {
      const errorCode = (error as { code?: number } | undefined)?.code;
      if (errorCode === 11000) {
        const existing = await GroupMemberActivity.findOne({
          goalId: activityData.goalId ?? null,
          userId: activityData.userId,
          questionId: activityData.questionId,
        })
          .select("_id")
          .lean();
        return {
          activityId: existing?._id,
          counted: false,
          reason: "duplicate",
          ...responseMeta,
        };
      }
      throw error;
    }
  }

  async getEffectiveWindow(goal) {
    if (goal.goalType === "deadline") {
      return {
        windowStart: goal.startDate,
        windowEnd: goal.deadline,
      };
    }
    // recurring goal
    const now = new Date();
    const start = new Date(goal.startDate);

    if (goal.frequency === "daily") {
      const dayMs = 86400000;
      const periods = Math.floor((now.getTime() - start.getTime()) / dayMs);
      const windowStart = new Date(start.getTime() + periods * dayMs);
      return {
        windowStart,
        windowEnd: new Date(windowStart.getTime() + dayMs),
      };
    }

    if (goal.frequency === "weekly") {
      const weekMs = 7 * 86400000;
      const periods = Math.floor((now.getTime() - start.getTime()) / weekMs);
      const windowStart = new Date(start.getTime() + periods * weekMs);
      return {
        windowStart,
        windowEnd: new Date(windowStart.getTime() + weekMs),
      };
    }

    if (goal.frequency === "monthly") {
      // Can't use fixed ms — months have different lengths
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        start.getDate(),
      );
      if (monthStart > now) monthStart.setMonth(monthStart.getMonth() - 1);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      return { windowStart: monthStart, windowEnd: monthEnd };
    }
    throw new Error("Invalid goal frequency");
  }

  async addGroupMemberActivity(activityData: IAddGroupMemberActivityDTO) {
    const { userId, groupId, questionId, status, timeSpent } = activityData;
    const activityTime = new Date();

    const question = await Question.findById(questionId).lean();
    if (!question) {
      throw new Error("Question not found");
    }

    const responseMeta = {
      questionId: question._id,
      status,
      timeSpent,
      timestamp: activityTime,
    };

    const baseActivity = {
      userId,
      groupId,
      questionId,
      subjectId: question.subjectId,
      status,
      timeSpent,
      activityDate: activityTime,
    };

    //1. Fetch Active Goal
    const goal = await GroupGoal.findOne({
      groupId,
      status: "active",
    }).lean();

    if (!goal) {
      return this.saveAndRespond(
        {
          ...baseActivity,
          goalId: null,
          countedTowardsGoal: false,
          notCountedReason: "no_active_goal",
        },
        false,
        responseMeta,
      );
    }

    //2. Check if activity falls within effective window
    const { windowStart, windowEnd } = await this.getEffectiveWindow(goal);

    if (activityTime < windowStart || activityTime > windowEnd) {
      return this.saveAndRespond(
        {
          ...baseActivity,
          goalId: goal._id,
          countedTowardsGoal: false,
          notCountedReason: "outside_window",
        },
        false,
        responseMeta,
      );
    }

    //3. Check subject matches goal subjects (if goal has specific subjects)
    const subjectMatch =
      goal.subjectIds.length === 0 ||
      goal.subjectIds.some(
        (subjId) => subjId.toString() === question.subjectId.toString(),
      );
    if (!subjectMatch) {
      return this.saveAndRespond(
        {
          ...baseActivity,
          goalId: goal._id,
          countedTowardsGoal: false,
          notCountedReason: "subject_mismatch",
        },
        false,
        responseMeta,
      );
    }

    //4. check status
    if (!["solved", "correct"].includes(status)) {
      return this.saveAndRespond(
        {
          ...baseActivity,
          goalId: goal._id,
          countedTowardsGoal: false,
          notCountedReason: "invalid_status",
        },
        false,
        responseMeta,
      );
    }

    //5. Handle recurring period reset(lazy reset on new activity in case cron job had not performed reset yet)
    if (goal.goalType === "recurring") {
      const periodRolledOver =
        !goal.lastResetAt || goal.lastResetAt < windowStart;
      if (periodRolledOver) {
        await GroupGoal.findByIdAndUpdate(goal._id, {
          $set: { progress: 0, lastResetAt: windowStart },
        });
      }
    }

    //6. Check for duplicate before counting
    const existingDuplicate = await GroupMemberActivity.findOne({
      goalId: goal._id,
      userId,
      questionId,
    })
      .select("_id")
      .lean();
    if (existingDuplicate) {
      return {
        activityId: existingDuplicate._id,
        counted: false,
        reason: "duplicate",
        ...responseMeta,
      };
    }

    //7. Insert activity
    const data = await GroupMemberActivity.create({
      ...baseActivity,
      goalId: goal._id,
      countedTowardsGoal: true,
      notCountedReason: null,
    });

    //8. Update goal progress atomically
    const updatedGoal = await GroupGoal.findByIdAndUpdate(
      goal._id,
      { $inc: { questionsSolved: 1 } },
      { new: true },
    );

    //9. invalidate redis cache

    return {
      activityId: data._id,
      counted: true,
      reason: null,
      questionSolved: updatedGoal?.questionsSolved || 0,
      ...responseMeta,
    };
  }
}

export default new ActivityService();
