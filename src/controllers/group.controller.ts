import { Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import groupService from "../services/group.service";
import userService from "../services/user.service";
import { IAddGroupGoalDTO } from "../interface/group.interface";
import activityService from "../services/activity.service";

class GroupController {
  private mapMemberEmails(members: any[] = []): string[] {
    return members.map((member: any) => {
      if (typeof member === "string") {
        return member;
      }
      return member?.email ?? String(member?._id ?? member);
    });
  }

  /**
   * POST /api/groups
   * Create a new group.
   */
  public createGroup = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const groupName = req.body.name;
      const membersEmail = req.body.members;
      const creatorId = req.user.id;
      const creatorEmail = req.user.email;
      let userIds: string[] | null = [creatorId];
      if (Array.isArray(membersEmail) && membersEmail.length > 0) {
        userIds = await userService.getUserIdsByEmails([
          creatorEmail,
          ...membersEmail,
        ]);
      }
      const groupData = {
        name: groupName,
        members: userIds,
        creatorId,
      };
      const newGroup = await groupService.createGroup(groupData);
      const memberEmails = this.mapMemberEmails(newGroup.members ?? []);
      const response = {
        groupId: newGroup._id,
        name: newGroup.name,
        creator: creatorEmail,
        members: memberEmails,
        activeGoal: null,
        createdAt: newGroup.createdAt,
      };
      sendSuccess(res, response, "Group created successfully", 201);
    },
  );

  public addGroupMember = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const email = req.body.email;
      const groupId = req.params.groupId;
      const addGroupMember = await groupService.addGroupMember(groupId, email);
      const memberEmails = this.mapMemberEmails(addGroupMember?.members ?? []);
      const response = {
        groupId: groupId,
        members: memberEmails,
      };
      sendSuccess(res, response, "Member added to group successfully", 200);
    },
  );

  public addGroupGoal = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const groupId = req.params.groupId;
      const goalData = req.body as IAddGroupGoalDTO;
      const newGoal = await groupService.addGroupGoal(groupId, goalData);

      const subjectNames = Array.isArray(newGoal.subjectIds)
        ? newGoal.subjectIds.map((subject: any) =>
            subject?.name ?? String(subject?._id ?? subject),
          )
        : [];

      const response = {
        goalId: newGoal._id,
        title: newGoal.title,
        subject: subjectNames,
        metric: newGoal.metric,
        deadline: newGoal.deadline,
        progress: 0,
        isActive: newGoal.status === "active",
      };

      sendSuccess(res, response, "Group goal created successfully", 201);
    },
  );

  public addGroupMemberActivity = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const groupId = req.params.groupId;
      const {  questionId,status , timeSpent  } = req.body;
     const data = await activityService.addGroupMemberActivity({
        userId: req.user.id,
        groupId,
        questionId,
        status,
        timeSpent,
      });
      sendSuccess(res, data, "Activity added to group goal successfully", 200);
    });

  public getGroupProgress = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const groupId = req.params.groupId;
      const progressData = await groupService.getGroupProgress(groupId);
      sendSuccess(res, progressData, "Group progress retrieved successfully", 200);
    },
  );
}

export default new GroupController();
