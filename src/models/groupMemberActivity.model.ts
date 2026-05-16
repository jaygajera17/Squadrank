import mongoose, { Schema } from "mongoose";

const GroupMemberActivitySchema = new Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyGroup",
    required: true,
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "GroupGoal",
    default: null,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Question",
    required: true,
  },
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
  }, // denormalized from Question

  status: {
    type: String,
    enum: ["solved", "correct", "attempted"],
    required: true,
  },
  timeSpent: { type: Number, required: true }, // in seconds
  activityDate: { type: Date, required: true, default: Date.now },

  countedTowardsGoal: { type: Boolean, default: false },
  notCountedReason: {
    type: String,
    enum: [
      "subject_mismatch",
      "outside_window",
      "invalid_status",
      "duplicate",
      "no_active_goal",
      null,
    ],
    default: null,
  },
});



const GroupMemberActivity = mongoose.model(
  "GroupMemberActivity",
  GroupMemberActivitySchema,
);
export default GroupMemberActivity;
