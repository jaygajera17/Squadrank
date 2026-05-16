export interface IGroup {
  name: string;
  creatorId: string;
  members: [{ type: string }];
  createdAt: Date;
  updatedAt: Date;
}

//create group DTO
export interface ICreateGroupDTO {
  name: string;
  members: string[] | null;
  creatorId: string;
}

export interface IAddGroupGoalDTO {
  title: string;
  subjectIds: string[];
  metric?: "questionsSolved" | "timeSpent";
  targetCount: number;
  goalType: "deadline" | "recurring";
  deadline?: string | Date | null;
  frequency?: "daily" | "weekly" | "monthly" | null;
  startDate?: string | Date;
}

export interface IAddGroupMemberActivityDTO {
  userId: string;
  groupId:string;
  questionId:string;
  status: "solved" | "correct";
  timeSpent: number; // in seconds
}