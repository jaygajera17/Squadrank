import mongoose, { Schema } from 'mongoose';


const SubjectSchema = new Schema({
  name:        { type: String, required: true, unique: true }, // "Math", "Physics"
  description: { type: String },
  createdAt:   { type: Date, default: Date.now }
});

SubjectSchema.index({ name: 1 }, { collation: { locale: "en", strength: 2 } });
module.exports = mongoose.model("Subject", SubjectSchema);
