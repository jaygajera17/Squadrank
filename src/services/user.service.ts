import User from "../models/user.model";
import { IUpdateUserDTO, IUser } from "../interface/user.interface";

class UserService {

  async createUser(userData: { googleId: string; email: string; name: string; avatar: string }) {
    return User.create(userData);
  }
  async getAllUsers(): Promise<IUser[]> {
    return User.find().select("-password");
  }

  async getUserByEmail(email: string) {
    return User.findOne({ email });
  }

  async getUserById(id: string) {
    return User.findById(id);
  }

  async updateUser(userId:string, updateData: IUpdateUserDTO) {
    return User.findByIdAndUpdate(userId, updateData, { new: true });
  }

  async getUserIdsByEmails(emails:string[]){
    const users = await User.find({
      email: { $in: emails }
    }).select('_id');
    return users.map(user => user._id.toString());
  }
}

export default new UserService();
