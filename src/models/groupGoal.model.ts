import mongoose, { Schema } from "mongoose";

const GroupGoalSchema = new Schema({
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudyGroup",
    required: true,
  },
  title: { type: String, required: true },

  // Array to support multi-subject goals like "100 Questions across Math & Physics"
  subjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Subject" }],

  metric: {
    type: String,
    enum: ["questionsSolved", "timeSpent"],
    default: "questionsSolved",
  },
  totalQuestions: { type: Number, required: true }, // e.g. 100

  goalType: { type: String, enum: ["deadline", "recurring"], required: true },
  startDate: { type: Date, required: true, default: Date.now },
  deadline: { type: Date, default: null }, // null for recurring goals
  frequency: {
    type: String,
    enum: ["daily", "weekly", "monthly",null],
    default: null, // null for deadline
  },
  questionsSolved: { type: Number, default: 0 }, // incremented on each valid activity
  lastResetAt: { type: Date, default: null }, // only for recurring — tracks when progress last reset
  status: { type: String, enum: ["active", "archived"], default: "active" },
  createdAt: { type: Date, default: Date.now },
});
GroupGoalSchema.index({ groupId: 1, status: 1 });

const GroupGoal = mongoose.model("GroupGoal", GroupGoalSchema);
export default GroupGoal;
