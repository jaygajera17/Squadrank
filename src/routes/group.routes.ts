import userController from "../controllers/user.controller";
import { Router } from "express";
import groupController from "../controllers/group.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  addGroupMemberValidator,
  addGroupGoalValidator,
  addGroupMemberActivityValidator,
  createGroupValidator,
  getGroupProgressValidator,
} from "../middleware/validator/group.validator";

class GroupRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post(
      "/",
      authMiddleware,
      createGroupValidator,
      groupController.createGroup,
    );
    this.router.post(
      "/:groupId/member",
      authMiddleware,
      addGroupMemberValidator,
      groupController.addGroupMember,
    );

    this.router.post(
      "/:groupId/goal",
      authMiddleware,
      addGroupGoalValidator,
      groupController.addGroupGoal,
    );

    this.router.post(
      "/:groupId/activity",
      authMiddleware,
      addGroupMemberActivityValidator,
      groupController.addGroupMemberActivity,
    );

    this.router.get(
      "/:groupId/progress",
      authMiddleware,
      getGroupProgressValidator,
      groupController.getGroupProgress,
    );
  }
}

export default new GroupRouter().router;
