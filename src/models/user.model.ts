import mongoose, { Schema } from "mongoose";
import { IUser } from "../interface/user.interface";

const UserSchema: Schema<IUser> = new Schema({
  googleId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model<IUser>("User", UserSchema);

export default User;
