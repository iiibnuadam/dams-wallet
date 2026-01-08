import mongoose, { Schema, Document, Model } from "mongoose";

export interface IProject extends Document {
  name: string;
  owner: string; // Could be specific enum if needed, using String for now based on prompt "owner"
  status: string; // e.g., "ACTIVE", "COMPLETED"
  targetDate: Date;
  isDeleted: boolean;
}

const ProjectSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    owner: { type: String, required: true }, 
    status: { type: String, default: "ACTIVE" },
    targetDate: { type: Date },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Project: Model<IProject> = mongoose.models.Project || mongoose.model<IProject>("Project", ProjectSchema);

export default Project;
