const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // Update last login
      await user.updateLastLogin();
      return done(null, user);
    }

    // Check if user exists with same email
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // Link Google account to existing user
      user.googleId = profile.id;
      user.provider = 'google';
      if (!user.profileImage && profile.photos?.[0]?.value) {
        user.profileImage = profile.photos[0].value;
      }
      await user.updateLastLogin();
      return done(null, user);
    }

    // Create new user
    user = new User({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      profileImage: profile.photos?.[0]?.value || '',
      provider: 'google'
    });

    await user.save();
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
