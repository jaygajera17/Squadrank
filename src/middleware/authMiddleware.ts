import { NextFunction, Request, Response } from 'express';
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/secrets";
import userService from "../services/user.service";
import { sendError } from "../utils/apiResponse";


export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      // Extract token from Authorization header
      const accessToken = authHeader.split(" ")[1];

      // Verify JWT token
      const decodedAccessToken = jwt.verify(accessToken, JWT_SECRET, {
        algorithms: ["HS256"],
      }) as { id: string };

      // Check if user exists in the database
      const user = await userService.getUserById(decodedAccessToken.id);

      if (!user) {
        // If user doesn't exist then we can consider token as invalid
        sendError(res, "Invalid token: user not found", 401);
        return;
      }

      // @ts-ignore - Attach user object to the request for further processing
      req.user = user;
      req.user.id = user._id.toString();
      

      // Proceed to the next middleware or route handler
      next();
    } else {
      sendError(res, "Token doesn't exist.", 401);
      return;
    }
  } catch (error: unknown) {
    next(error);
  }
};
