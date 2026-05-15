import mongoose, { Schema } from 'mongoose';


const QuestionSchema = new Schema({
  text:       { type: String, required: true },
  subjectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },
  topic:      { type: String },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  createdAt:  { type: Date, default: Date.now }
});

QuestionSchema.index({ subjectId: 1 });

QuestionSchema.index({ subjectId: 1, difficulty: 1 });

QuestionSchema.index({ subjectId: 1, topic: 1 });

module.exports = mongoose.model("Question", QuestionSchema);
