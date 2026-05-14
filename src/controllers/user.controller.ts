import { Request, Response } from 'express';
import userService from '../services/user.service';
import { sendSuccess } from '../utils/apiResponse';
import asyncHandler from '../utils/asyncHandler';

class UserController {
  /**
   * POST /api/users
   * Create a new user.
   */
  createUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.createUser(req.body);
    sendSuccess(res, user, 'User created successfully', 201);
  });

  /**
   * GET /api/users
   * Retrieve all users.
   */
  getAllUsers = asyncHandler(async (_req: Request, res: Response): Promise<void> => {
    const users = await userService.getAllUsers();
    sendSuccess(res, users, 'Users retrieved successfully');
  });

  /**
   * GET /api/users/:id
   * Retrieve a single user by ID.
   */
  getUserById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.getUserById(req.params.id);
    sendSuccess(res, user, 'User retrieved successfully');
  });

  /**
   * PATCH /api/users/:id
   * Update a user.
   */
  updateUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await userService.updateUser(req.params.id, req.body);
    sendSuccess(res, user, 'User updated successfully');
  });

  /**
   * DELETE /api/users/:id
   * Delete a user.
   */
  deleteUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    await userService.deleteUser(req.params.id);
    sendSuccess(res, null, 'User deleted successfully');
  });
}

export default new UserController();
