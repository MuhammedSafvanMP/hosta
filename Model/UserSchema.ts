import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      lowercase: true,
      match: [/\S+@\S+\.\S+/, "Please enter a valid email address"],
    },
    password: {
      type: String,
      minlength: 8,
    },
    // phone: {
    //   type: String,
    //   unique: true,
    //   match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    // },
    phone: {
      type: String,
      unique: true,
      sparse: true, // <-- Add this line
      match: [/^\d{10}$/, "Please enter a valid 10-digit phone number"],
    },
    picture: {
      type: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
