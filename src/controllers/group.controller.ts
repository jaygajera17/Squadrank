import { Request, Response } from "express";
import { sendSuccess } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import groupService from "../services/group.service";
import userService from "../services/user.service";

class GroupController {
  /**
   * POST /api/groups
   * Create a new group.
   */
  public createGroup = asyncHandler(
    async (req: Request, res: Response): Promise<void> => {
      const groupName = req.body.name;
      const membersEmail = req.body.members;
      const creatorId = req.user.id;
      let userIds: string[]|null = null;
      if (Array.isArray(membersEmail) && membersEmail.length > 0) {
        userIds = await userService.getUserIdsByEmails(membersEmail);
      }
      const groupData = {
        name: groupName,
        members: userIds,
        creatorId,
      };
      const newGroup = await groupService.createGroup(groupData);
      sendSuccess(res, newGroup, "Group created successfully", 201);
    },
  );
}

export default new GroupController();
