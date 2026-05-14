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
   * Return all users (password field excluded).
   */
  async getAllUsers(): Promise<IUser[]> {
    return User.find().select('-password');
  }

  

 
}

export default new UserService();
