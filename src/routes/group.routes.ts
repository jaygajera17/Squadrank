import userController from "../controllers/user.controller";
import { Router } from "express";
import groupController from "../controllers/group.controller";
import { authMiddleware } from "../middleware/authMiddleware";
import {
  addGroupMemberValidator,
  createGroupValidator,
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
  }
}

export default new GroupRouter().router;
