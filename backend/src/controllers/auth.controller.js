import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Helper to generate access token
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: '15m'
  });
};

// Helper to generate refresh token
const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: '7d'
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  const { username, email, password } = req.body;

  try {
    // Check if user already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Create user
    const user = await User.create({ username, email, password });

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token to user
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(201).json({
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Login user & acquire tokens
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user by email (explicitly selecting password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Save refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
export const refresh = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find user and check if token exists in their refreshTokens array
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.includes(refreshToken)) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(user._id);

    res.status(200).json({ accessToken });
  } catch (err) {
    return res.status(403).json({ error: 'Invalid refresh token' });
  }
};

// @desc    Logout user & clear refresh token
// @route   POST /api/auth/logout
export const logout = async (req, res, next) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token is required' });
  }

  try {
    // Decode token to find user
    const decoded = jwt.decode(refreshToken);
    if (!decoded || !decoded.id) {
      return res.status(400).json({ error: 'Invalid token payload' });
    }

    const user = await User.findById(decoded.id);
    if (user) {
      // Remove refresh token from db
      user.refreshTokens = user.refreshTokens.filter(t => t !== refreshToken);
      await user.save();
    }

    res.status(200).json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current authenticated user's profile
// @route   GET /api/auth/me
export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user profile (username, preferences)
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  const { username, preferences } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check username uniqueness if changing
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({ error: 'Username already taken' });
      }
      user.username = username;
    }

    // Update preferences
    if (preferences) {
      if (preferences.defaultMethod !== undefined) {
        user.preferences.defaultMethod = preferences.defaultMethod;
      }
      if (preferences.requestTimeout !== undefined) {
        user.preferences.requestTimeout = preferences.requestTimeout;
      }
      if (preferences.historyRetention !== undefined) {
        user.preferences.historyRetention = preferences.historyRetention;
      }
    }

    await user.save();

    res.status(200).json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        preferences: user.preferences,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Change password (requires old password)
// @route   PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  try {
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    await user.save();

    // Issue new tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Request password reset (generates token)
// @route   POST /api/auth/forgot-password
export const forgotPassword = async (req, res, next) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user doesn't exist to prevent email enumeration
      return res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been generated'
      });
    }

    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // In production, this would be sent via email using nodemailer
    // For development, we log the reset URL and return the token
    const resetUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/#/reset-password?token=${resetToken}`;
    console.log(`\n📧 Password Reset Link (dev mode): ${resetUrl}\n`);

    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been generated',
      // Include token in response for development — remove in production
      ...(process.env.NODE_ENV === 'development' && { resetToken, resetUrl })
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
export const resetPassword = async (req, res, next) => {
  const { token, newPassword } = req.body;

  try {
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Hash the token from request to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }).select('+passwordResetToken +passwordResetExpires');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Update password and clear reset fields
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // Invalidate all refresh tokens for security
    user.refreshTokens = [];
    await user.save();

    // Generate fresh tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.refreshTokens.push(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      user: { id: user._id, username: user.username, email: user.email, preferences: user.preferences },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
};
