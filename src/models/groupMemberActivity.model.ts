
import mongoose, { Schema } from 'mongoose';


const GroupMemberActivitySchema = new Schema({
  groupId:    { type: mongoose.Schema.Types.ObjectId, ref: "StudyGroup", required: true },
  goalId:     { type: mongoose.Schema.Types.ObjectId, ref: "GroupGoal",  required: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User",       required: true },
  questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question",   required: true },
  subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject",    required: true }, // denormalized from Question

  status:    { type: String, enum: ["solved", "correct"], required: true },
  timeSpent: { type: Number, required: true }, // in seconds
  activityDate: { type: Date, required: true, default: Date.now }
});


// Dedup check: same user solving same question under same goal
GroupMemberActivitySchema.index(
  { goalId: 1, userId: 1, questionId: 1 },
  { unique: true }   // enforces per-user dedup at DB level
);

module.exports = mongoose.model("GroupMemberActivity", GroupMemberActivitySchema);
