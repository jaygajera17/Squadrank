import mongoose, { Schema } from 'mongoose';


const SubjectSchema = new Schema({
  name:        { type: String, required: true, unique: true }, // "Math", "Physics"
  description: { type: String },
  createdAt:   { type: Date, default: Date.now }
});

const Subject = mongoose.model("Subject", SubjectSchema);
export default Subject;

