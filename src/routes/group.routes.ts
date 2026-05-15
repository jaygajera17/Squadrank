import userController from "../controllers/user.controller";
import { Router } from "express";
import groupController from "../controllers/group.controller";
import { authMiddleware } from "../middleware/authMiddleware";

class GroupRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.post("/",authMiddleware, groupController.createGroup);
  }
}

export default new GroupRouter().router;
