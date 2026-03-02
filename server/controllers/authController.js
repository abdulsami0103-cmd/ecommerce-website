const User = require('../models/User');
const crypto = require('crypto');
const emailService = require('../services/emailService');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      profile: {
        firstName,
        lastName,
      },
    });

    // Generate and send verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = crypto.createHash('sha256').update(verificationCode).digest('hex');
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    emailService.send(
      user.email,
      'Verify Your Email - MarketHub',
      buildVerificationEmail(verificationCode, user.profile.firstName)
    ).catch(err => console.error('Verification email failed:', err));

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log('Login attempt:', { email, passwordLength: password?.length });

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Google-only users can't login with password
    if (user.authProvider === 'google' && !user.password) {
      return res.status(401).json({
        success: false,
        message: 'This account uses Google Sign-In. Please login with Google.',
      });
    }

    console.log('User found:', user.email, 'Has password:', !!user.password);

    // Check password
    const isMatch = await user.matchPassword(password);
    console.log('Password match result:', isMatch);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Google Sign-In / Sign-Up
// @route   POST /api/auth/google
// @access  Public
const googleAuth = async (req, res, next) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
    }

    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_IOS_CLIENT_ID,
      ].filter(Boolean),
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, given_name, family_name, picture } = payload;

    // Check if user already exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Existing user: link Google if not already linked
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.isVerified) {
        user.isVerified = true;
      }
      if (picture && !user.profile.avatar) {
        user.profile.avatar = picture;
      }
      await user.save({ validateBeforeSave: false });
    } else {
      // New user: auto-create
      user = await User.create({
        email,
        googleId,
        authProvider: 'google',
        isVerified: true,
        profile: {
          firstName: given_name || '',
          lastName: family_name || '',
          avatar: picture || '',
        },
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token') || error.message?.includes('Wrong number of segments')) {
      return res.status(401).json({ success: false, message: 'Invalid Google token' });
    }
    next(error);
  }
};

// @desc    Send email verification code
// @route   POST /api/auth/send-verification
// @access  Private
const sendVerificationCode = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    user.emailVerificationCode = crypto.createHash('sha256').update(code).digest('hex');
    user.emailVerificationExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    await emailService.send(
      user.email,
      'Verify Your Email - MarketHub',
      buildVerificationEmail(code, user.profile.firstName)
    );

    res.status(200).json({ success: true, message: 'Verification code sent to email' });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email with code
// @route   POST /api/auth/verify-email
// @access  Private
const verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Verification code is required' });
    }

    const user = await User.findById(req.user.id);

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'Email already verified' });
    }

    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    if (user.emailVerificationCode !== hashedCode || user.emailVerificationExpire < Date.now()) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with that email',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to resetPasswordToken field
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Set expire (10 minutes)
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Send password reset email
    emailService.sendPasswordReset(user.email, resetToken)
      .catch(err => console.error('Password reset email failed:', err));

    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password/:resetToken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// Helper: Build verification email HTML
const buildVerificationEmail = (code, firstName) => {
  const platformName = process.env.PLATFORM_NAME || 'MarketHub';
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #10b981; margin: 0;">${platformName}</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 30px; text-align: center;">
        <h2 style="color: #111827; margin-top: 0;">Verify Your Email</h2>
        <p style="color: #6b7280;">Hi ${firstName || 'there'},</p>
        <p style="color: #6b7280;">Use the code below to verify your email address:</p>
        <div style="background: #fff; border: 2px dashed #10b981; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #111827;">${code}</span>
        </div>
        <p style="color: #9ca3af; font-size: 14px;">This code expires in 10 minutes.</p>
      </div>
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;
};

// Helper function to send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      profile: user.profile,
      isVerified: user.isVerified,
      authProvider: user.authProvider || 'local',
      preferredLanguage: user.preferredLanguage,
      preferredCurrency: user.preferredCurrency,
    },
  });
};

module.exports = {
  register,
  login,
  googleAuth,
  sendVerificationCode,
  verifyEmail,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
};
