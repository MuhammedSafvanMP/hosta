import passport from "passport";
import { Strategy as GoogleStrategy, Profile } from "passport-google-oauth20";
import dotenv from "dotenv";

dotenv.config();

// Define the expected user type (can be replaced with your own User model type)
type SerializedUser = Express.User | Profile;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, profile); // `profile` is of type `Profile`
    }
  )
);

// Explicitly type the user
passport.serializeUser((user: SerializedUser, done) => {
  done(null, user);
});

passport.deserializeUser((user: SerializedUser, done) => {
  done(null, user);
});
