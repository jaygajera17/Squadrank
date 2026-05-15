import StudyGroup from "../models/studyGroup.model";

class GroupService {
  /**
   * Create a new group.
   */
  async createGroup(groupData: ICreateGroupDTO) {
    return StudyGroup.create({
      name: groupData.name,
      members: groupData.members,
      creatorId: groupData.creatorId,
    });
  }
}

export default new GroupService();
