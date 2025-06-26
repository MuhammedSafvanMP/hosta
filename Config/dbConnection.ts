import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectToDb = async () => {
  try {
    mongoose
      .connect(process.env.MongoDB_String as string)
      .then(() => console.log("Connected to Database"));
  } catch (error) {}
};
export default connectToDb;
