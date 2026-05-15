import { Router } from "express";
import authController from "../controllers/auth.controller";
class AuthRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get("/google/callback", authController.loginWithGoogle);
    this.router.get("/login", authController.redirectUrl);
    this.router.get("/verify-token", authController.verifyToken);
  }
}

export default new AuthRouter().router;
