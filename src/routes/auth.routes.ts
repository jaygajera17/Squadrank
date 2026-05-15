import { Router } from "express";
import authController from "../controllers/auth.controller";
import {
  googleCallbackValidator,
  verifyTokenValidator,
} from "../middleware/validator/auth.validator";
class AuthRouter {
  public router: Router = Router();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes() {
    this.router.get(
      "/google/callback",
      googleCallbackValidator,
      authController.loginWithGoogle,
    );
    this.router.get("/login", authController.redirectUrl);
    this.router.get(
      "/verify-token",
      verifyTokenValidator,
      authController.verifyToken,
    );
  }
}

export default new AuthRouter().router;
