import dotenv from "dotenv";
dotenv.config({ path: "./Config/.env" });
import cron from "node-cron";
import session from "express-session";
import passport from "passport";
import authRoutes from "./Routes/AuthRoutes";
import "./Config/passport"; 
import express from "express";
import cors from "cors";
import connectToDb from "./Config/dbConnection";
import userRoutes from "./Routes/UserRoutes";
import commenRoutes from "./Routes/CommenRoute";
import errorHandler from "./Middlewares/ErrorHandler";
import cookieParser from "cookie-parser";
import hospitalRoutes from "./Routes/HospitalRoute";
import AmbulanceRoutes from "./Routes/AmbulanceRoutes";
import BloodDonarRoutes from "./Routes/BloodDonarRoutes";
import MedicineRemainderRoutes from "./Routes/MedicineRemainderRoutes";
import LabRoutes from "./Routes/LabRoutes";
import {
  checkMissedDoses,
  checkAndRefillMedicines,
} from "./Controllers/MedicineRemainderSide/MedicineRemainderForm";

const app = express();

app.use(
  cors({
    origin: [
      process.env.UserSide_URL as string,
      process.env.AmbulanceSide_URL as string,
      process.env.HospitalSide_URL as string,
      "http://127.0.0.1:5500"
    ],
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       // Check if the origin is in the allowed list
//       const allowedOrigins = [
//         process.env.UserSide_URL,
//         process.env.AmbulanceSide_URL,
//         process.env.HospitalSide_URL,
//       ];
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );

// app.use(
//   cors({
//     origin: "*", // Allow all origins
//     credentials: true, // Allow credentials
//   })
// );

// Schedule the job to run every 1 minute
cron.schedule("* * * * *", async () => {
  await checkMissedDoses();
  await checkAndRefillMedicines();
});

app.use(express.json());
app.use(cookieParser());

app.use(
  session({
    secret: "your-secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/auth", authRoutes); // route prefix for auth

app.get("/", (req, res) => {
  res.send(`<a href="/auth/google">Login with Google</a>`);
});

app.get("/profile", (req, res) => {
  res.send(`<pre>${JSON.stringify(req.user, null, 2)}</pre>`);
});



// Fix route paths with leading '/'
app.use("/api", userRoutes);
app.use("/api", commenRoutes);
app.use("/api", hospitalRoutes);
app.use("/api", AmbulanceRoutes);
app.use("/api", BloodDonarRoutes);
app.use("/api", MedicineRemainderRoutes);
app.use("/api", LabRoutes);

connectToDb();

app.use(errorHandler);

app.listen(process.env.Port, () => {
  console.log(`App is running  http://localhost:${process.env.Port}`);
});

export default app;





