import { Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import groupService from "../services/group.service";
import userService from "../services/user.service";

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
}

export default new GroupController();
