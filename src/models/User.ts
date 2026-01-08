import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  username: string; // "ADAM" or "SASTI"
  password?: string; // Hashed password
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, uppercase: true },
    password: { type: String, required: false }, // Optional for now if we have legacy users, but we will fill it
  },
  { timestamps: true }
);

if (process.env.NODE_ENV === "development" && mongoose.models.User) {
  delete mongoose.models.User;
}

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
