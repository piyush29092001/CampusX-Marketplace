const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getApps, initializeApp } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// Initialize Firebase Admin SDK (only needs Project ID to verify ID tokens locally)
if (!getApps().length) {
    initializeApp({ projectId: 'ourwebsite-e4be9' });
}
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');

const sendTokenResponse = (user, statusCode, res) => {
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            college: user.college,
            department: user.department,
            avatar: user.avatar,
            isVerified: user.isVerified,
            emailVerified: user.emailVerified,
            role: user.role,
            provider: user.provider || 'local'
        }
    });
};

const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
};

exports.register = async (req, res, next) => {
    try {
        const { name, email, password, college, department, year } = req.body;

        if (!validatePassword(password)) {
            return res.status(400).json({ success: false, error: 'Password does not meet requirements.' });
        }

        const existingUser = await User.findOne({ email });
        let user;

        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        if (existingUser) {
            // If a Google-only user tries to register with email/password, block it
            if (existingUser.provider === 'google' && existingUser.emailVerified) {
                return res.status(400).json({
                    success: false,
                    error: 'AUTH_PROVIDER_GOOGLE',
                    message: 'This email is registered with Google Sign-In. Please use Google to log in.'
                });
            }

            if (existingUser.emailVerified) {
                return res.status(400).json({ success: false, error: 'EMAIL_ALREADY_REGISTERED', message: 'This email is already registered.' });
            } else {
                existingUser.otpHash = otpHash;
                existingUser.otpExpiresAt = otpExpiresAt;
                existingUser.password = password;
                existingUser.name = name;
                existingUser.provider = 'local';
                existingUser.college = college || existingUser.college;
                existingUser.department = department || existingUser.department;
                existingUser.year = year || existingUser.year;

                await existingUser.save();
                user = existingUser;
            }
        } else {
            user = await User.create({
                name,
                email,
                password,
                provider: 'local',
                college: college || 'Lumina University',
                department: department || 'General',
                year: year || '1',
                emailVerified: false,
                otpHash,
                otpExpiresAt,
                isVerified: email.endsWith('.edu') || email.endsWith('.ac.in')
            });
        }

        try {
            await sendEmail({ email: user.email, otp });
            if (existingUser) {
                res.status(200).json({ success: true, message: 'Your account is not verified yet. We have sent a new verification code.' });
            } else {
                res.status(201).json({ success: true, message: 'OTP sent to email. Please verify.' });
            }
        } catch (err) {
            console.error('Email send failed', err);
            return res.status(422).json({
                success: false,
                code: 'EMAIL_DELIVERY_FAILED',
                message: 'Email could not be sent. Please check the email address or email service configuration.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: 'Registration failed.' });
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, error: 'Please provide email and OTP' });
        }

        const user = await User.findOne({ email }).select('+otpHash +otpExpiresAt');

        if (!user) {
            return res.status(400).json({ success: false, error: 'Invalid verification.' });
        }

        if (user.emailVerified) {
            return res.status(200).json({ success: true, message: 'This email is already verified. Please log in.' });
        }

        if (user.otpExpiresAt < Date.now()) {
            return res.status(400).json({ success: false, error: 'OTP_EXPIRED', message: 'This verification code has expired. Please request a new one.' });
        }

        const isMatch = await bcrypt.compare(otp, user.otpHash);
        if (!isMatch) {
            return res.status(400).json({ success: false, error: 'INVALID_OTP', message: 'Invalid verification code. Please try again.' });
        }

        user.emailVerified = true;
        user.otpHash = undefined;
        user.otpExpiresAt = undefined;
        await user.save();

        res.status(200).json({ success: true, message: 'Email verified successfully.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Verification failed.' });
    }
};

exports.resendOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Please provide email.' });
        }

        const user = await User.findOne({ email }).select('+otpExpiresAt');

        if (!user) {
            return res.status(400).json({ success: false, error: 'User does not exist.' });
        }

        if (user.emailVerified) {
            return res.status(400).json({ success: false, error: 'EMAIL_ALREADY_VERIFIED', message: 'This email is already verified. Please log in.' });
        }

        const nineMinutesFromNow = Date.now() + 9 * 60 * 1000;
        if (user.otpExpiresAt && user.otpExpiresAt > nineMinutesFromNow) {
            const timeDiff = Math.ceil((user.otpExpiresAt - nineMinutesFromNow) / 1000);
            return res.status(429).json({ success: false, error: 'RATE_LIMIT', message: `Please wait ${timeDiff} seconds before requesting another code.` });
        }

        const otp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const otpHash = await bcrypt.hash(otp, salt);
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        user.otpHash = otpHash;
        user.otpExpiresAt = otpExpiresAt;
        await user.save();

        try {
            await sendEmail({ email: user.email, otp });
            res.status(200).json({ success: true, message: 'A new verification code has been sent.' });
        } catch (err) {
            console.error('Email send failed', err);
            return res.status(422).json({
                success: false,
                code: 'EMAIL_DELIVERY_FAILED',
                message: 'Email could not be sent. Please check the email address or email service configuration.'
            });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Failed to resend OTP.' });
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'Please provide an email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, error: 'ACCOUNT_NOT_FOUND', message: 'Account not found. Please sign up first.' });
        }

        // Block Google-only users from password login
        if (user.provider === 'google' && !user.password) {
            return res.status(401).json({
                success: false,
                error: 'AUTH_PROVIDER_GOOGLE',
                message: 'This account uses Google Sign-In. Please continue with Google.'
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'INVALID_CREDENTIALS', message: 'Invalid credentials. Please try again.' });
        }

        if (!user.emailVerified) {
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const salt = await bcrypt.genSalt(10);
            user.otpHash = await bcrypt.hash(otp, salt);
            user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
            await user.save();

            try {
                await sendEmail({ email: user.email, otp });
                return res.status(401).json({ success: false, error: 'EMAIL_NOT_VERIFIED', message: 'Your account is not verified yet. We have sent a new verification code to your email.' });
            } catch (err) {
                console.error('Email send failed', err);
                return res.status(422).json({
                    success: false,
                    error: 'EMAIL_DELIVERY_FAILED',
                    message: 'Email could not be sent. Please check the email address or email service configuration.'
                });
            }
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error(error);
        res.status(400).json({ success: false, error: 'Login failed', message: 'A server error occurred during login.' });
    }
};

exports.googleAuth = async (req, res, next) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, error: 'No token provided' });

        const decodedToken = await getAuth().verifyIdToken(idToken);
        const { email, name, picture } = decodedToken;

        let user = await User.findOne({ email });
        if (!user) {
            // Create Google user WITHOUT a password
            user = await User.create({
                name: name || 'Google User',
                email: email,
                provider: 'google',
                college: 'Unknown (Google)',
                department: 'Unknown (Google)',
                year: '1',
                emailVerified: true,
                isVerified: email.endsWith('.edu') || email.endsWith('.ac.in'),
                avatar: picture || 'default.jpg'
            });
        } else {
            // Existing user logging in via Google — mark email verified
            user.emailVerified = true;
            // If they were a local user, keep their password intact but don't change provider
            // If they have no provider set, mark as google
            if (!user.provider || user.provider === 'local') {
                // Keep existing provider — they already have a local password
                // This allows dual auth: password + google
            }
            await user.save();
        }

        sendTokenResponse(user, 200, res);
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ success: false, error: 'Invalid Google Identity token' });
    }
};

// @desc    Refresh session — reissue JWT from Firebase ID token or existing valid JWT
// @route   POST /api/auth/refresh-session
// @access  Public (but requires valid Firebase token or existing JWT)
exports.refreshSession = async (req, res, next) => {
    try {
        const { firebaseIdToken } = req.body;

        // Strategy 1: Firebase ID token (for Google users or any Firebase-authenticated user)
        if (firebaseIdToken) {
            try {
                const decodedToken = await getAuth().verifyIdToken(firebaseIdToken);
                const { email } = decodedToken;

                const user = await User.findOne({ email });
                if (!user) {
                    return res.status(401).json({ success: false, error: 'User not found' });
                }

                return sendTokenResponse(user, 200, res);
            } catch (firebaseErr) {
                console.error('Firebase token verification failed:', firebaseErr.message);
                return res.status(401).json({ success: false, error: 'Invalid Firebase token' });
            }
        }

        // Strategy 2: Existing JWT in Authorization header (for local users)
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer')) {
            const token = authHeader.split(' ')[1];
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                const user = await User.findById(decoded.id);
                if (!user) {
                    return res.status(401).json({ success: false, error: 'User not found' });
                }

                return sendTokenResponse(user, 200, res);
            } catch (jwtErr) {
                return res.status(401).json({ success: false, error: 'Token expired or invalid' });
            }
        }

        return res.status(401).json({ success: false, error: 'No valid authentication provided' });
    } catch (error) {
        console.error('Refresh session error:', error);
        res.status(500).json({ success: false, error: 'Session refresh failed' });
    }
};

exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: user.emailVerified,
                college: user.college,
                department: user.department,
                provider: user.provider || 'local'
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
};
