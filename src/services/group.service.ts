import StudyGroup from "../models/studyGroup.model";
import userService from "../services/user.service";

class GroupService {
  /**
   * Create a new group.
   */
  async createGroup(groupData: ICreateGroupDTO) {
    const group = await StudyGroup.create({
      name: groupData.name,
      members: groupData.members,
      creatorId: groupData.creatorId,
    });

    await group.populate("members", "email");
    return group;
  }

  /**
   * Add a member to a group.
   */
  async addGroupMember(groupId: string, email: string) {
    const userIds = await userService.getUserIdsByEmails([email]);
    const userId = userIds[0];
    const group = await StudyGroup.findByIdAndUpdate(
      groupId,
      { $push: { members: userId } },
      { new: true },
    ).populate("members", "email");

    return group;
  }
}

export default new GroupService();
