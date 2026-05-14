import { Request, Response } from 'express';
import userService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

class UserController {
  /**
   * GET /api/users
   * Retrieve all users.
   */
  public getAllUsers = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const users = await userService.getAllUsers();
    sendSuccess(res, users, 'Users retrieved successfully', 200);
  });




}

export default new UserController();
