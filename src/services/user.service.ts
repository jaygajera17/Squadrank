import mongoose from 'mongoose';
import User from '../models/user.model';
import { IUser, ICreateUserDTO, IUpdateUserDTO } from '../interface/user.interface';

/** Reusable helper to create a typed operational error. */
const makeError = (message: string, statusCode: number): Error & { statusCode: number } => {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
};

class UserService {
  /**
   * Create a new user.
   * Guards against NoSQL injection by explicitly coercing the email to a
   * plain string before using it in a query predicate.
   */
  async createUser(dto: ICreateUserDTO): Promise<IUser> {
    // Explicit string cast prevents operator-injection via email field
    const emailQuery = String(dto.email).toLowerCase();
    const existingUser = await User.findOne({ email: emailQuery });
    if (existingUser) {
      throw makeError('A user with this email already exists', 409);
    }

    // Only pass the known, typed fields to User.create to avoid mass-assignment
    const user = await User.create({
      name: dto.name,
      email: emailQuery,
      password: dto.password,
      ...(dto.role !== undefined && { role: dto.role }),
    });
    return user;
  }

  /**
   * Return all users (password field excluded).
   */
  async getAllUsers(): Promise<IUser[]> {
    return User.find().select('-password');
  }

  /**
   * Return a single user by ID.
   */
  async getUserById(id: string): Promise<IUser> {
    if (!mongoose.isValidObjectId(id)) {
      throw makeError('Invalid user ID', 400);
    }
    const user = await User.findById(id).select('-password');
    if (!user) throw makeError('User not found', 404);
    return user;
  }

  /**
   * Update a user's mutable fields.
   * Only the explicitly allowed fields are forwarded to the DB to prevent
   * mass-assignment and operator injection via the request body.
   */
  async updateUser(id: string, dto: IUpdateUserDTO): Promise<IUser> {
    if (!mongoose.isValidObjectId(id)) {
      throw makeError('Invalid user ID', 400);
    }

    // Build an update payload containing only known, safe fields
    const safeUpdate: IUpdateUserDTO = {};
    if (dto.name !== undefined) safeUpdate.name = String(dto.name);
    if (dto.email !== undefined) {
      const newEmail = String(dto.email).toLowerCase();
      // Ensure the new email is not already taken by a different user
      const conflict = await User.findOne({ email: newEmail });
      if (conflict && String(conflict._id) !== id) {
        throw makeError('Email is already in use by another account', 409);
      }
      safeUpdate.email = newEmail;
    }
    if (dto.role !== undefined) safeUpdate.role = dto.role;
    if (dto.isActive !== undefined) safeUpdate.isActive = Boolean(dto.isActive);

    const user = await User.findByIdAndUpdate(
      id,
      { $set: safeUpdate },
      { new: true, runValidators: true },
    ).select('-password');

    if (!user) throw makeError('User not found', 404);
    return user;
  }

  /**
   * Delete a user by ID.
   */
  async deleteUser(id: string): Promise<void> {
    if (!mongoose.isValidObjectId(id)) {
      throw makeError('Invalid user ID', 400);
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) throw makeError('User not found', 404);
  }
}

export default new UserService();
