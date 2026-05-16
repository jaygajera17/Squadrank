import userService from "../services/user.service";
import { sendSuccess } from "../utils/apiResponse";
import asyncHandler from "../utils/asyncHandler";
import { Request, Response, NextFunction } from "express";
import authService from "../services/auth.service";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  JWT_SECRET,
} from "../config/secrets";
import axios from "axios";
import JWT from "jsonwebtoken";
class AuthController {
  /**
   * Login with google authentication
   */
  public loginWithGoogle = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const { code } = req.query;

      // Exchange code for tokens
      const tokenResponse = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        },
      );

      const { id_token } = tokenResponse.data;

      // Verify Google token
      const authResult =
        await authService.authenticateUserByGoogleToken(id_token);

      // Get user by email
      let user = await userService.getUserByEmail(authResult.email);
      if (!user) {
        user = await userService.createUser({
          googleId: authResult.sub,
          email: authResult.email,
          name: authResult.name,
          avatar: authResult.picture,
        });
      }

      // Update user with the correct user ID
      await userService.updateUser(user.id, {
        name: authResult?.name,
        avatar: authResult?.picture,
      });

      //generate Token
      const tokens = await authService.generateToken(user.id);

      const result = {
        tokens,
      };

      sendSuccess(res, result, "Login successful", 200);
    },
  );

  public redirectUrl = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const redirectUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile`;
      sendSuccess(res, { redirectUrl }, "Google OAuth redirect URL", 200);
    },
  );

  public verifyToken = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        res.status(401).json({ message: "Token Missing" });
        return;
      }
      const token = authHeader.split(" ")[1];
      const decode = JWT.verify(token, JWT_SECRET);
      const newTokens = await authService.generateToken(
        (decode as { id: string }).id,
      );
      sendSuccess(res, { decode, ...newTokens }, "Token is valid", 200);
    },
  );
}

export default new AuthController();
