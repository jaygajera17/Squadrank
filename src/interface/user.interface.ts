import { Document } from 'mongoose';

export interface IUser extends Document {
  googleId: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}


export interface IUpdateUserDTO {
  name?: string;
  avatar?: string;
}