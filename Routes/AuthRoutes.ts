import express from "express";
import passport from "passport";
import { googleCallbackHandler } from "../Controllers/UserSide/GoogleAuth";
import { trycatch } from "../Utils/TryCatch";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  trycatch( googleCallbackHandler) 
);

export default router;
