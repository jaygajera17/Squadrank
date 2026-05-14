import { Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUserDTO {
  name: string;
  email: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface IUpdateUserDTO {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  isActive?: boolean;
}
