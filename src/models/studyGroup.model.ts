import mongoose, { Schema } from 'mongoose';

const StudyGroupSchema = new Schema(
  ({
  name: { type: String, required: true, trim: true },
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  activeGoalId: { type: mongoose.Schema.Types.ObjectId, ref: "GroupGoal", default: null },
  createdAt: { type: Date, default: Date.now }
}
));

StudyGroupSchema.index({ creatorId: 1 }, { unique: true });
StudyGroupSchema.index({ members: 1 });

const StudyGroup = mongoose.model('StudyGroup', StudyGroupSchema);

export default StudyGroup;