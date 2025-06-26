import { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import User from "../../Model/UserSchema";

export const googleCallbackHandler = async (req: Request, res: Response) => {
  const profile = req.user as any;

  const email = profile?.emails?.[0]?.value;
  const name = profile?.displayName;
  const picture = profile?.photos?.[0]?.value;

  if (!email || !name || !picture) {
    return res.status(400).json({ message: "Missing user info from Google" });
  }

  const jwtSecret = process.env.JWT_SECRET!;
  let user = await User.findOne({ email });

  if (!user) {
    user = new User({ email, name, picture });
    await user.save();
  }

  const token = Jwt.sign({ id: user._id, name: user.name }, jwtSecret, {
    expiresIn: "15m",
  });

  const refreshToken = Jwt.sign({ id: user._id, name: user.name }, jwtSecret, {
    expiresIn: "7d",
  });

  const expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: expirationDate,
  });

  return res.status(200).json({
    status: "Success",
    token,
    data: user,
    message: user.isNew ? "Account created via Google" : "Google login successful",
  });
};
