const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

async function runTest() {
    await mongoose.connect('mongodb://127.0.0.1:27017/college-marketplace');

    // Set a known OTP for test-pass2 manually since Resend handles the real email dynamically
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("111111", salt);

    await User.updateOne({ email: 'test-pass2@resend.dev' }, {
        otpHash: hash,
        otpExpiresAt: new Date(Date.now() + 1000 * 600)
    });

    console.log('Test OTP Hash injected. Verifying via API (http)...');

    const res = await fetch('http://localhost:5000/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test-pass2@resend.dev', otp: '111111' })
    });
    const data = await res.json();
    console.log('================');
    console.log('API Response:', data);

    const updatedUser = await User.findOne({ email: 'test-pass2@resend.dev' }).select('+otpHash +otpExpiresAt +password');
    console.log('DB Record:');
    console.log('- emailVerified:', updatedUser.emailVerified);
    console.log('- otpHash cleared:', !updatedUser.otpHash);
    console.log('- otpExpiresAt cleared:', !updatedUser.otpExpiresAt);

    // Check if password works internally
    const passMatch = await bcrypt.compare("Piyush@123", updatedUser.password);
    console.log('- Password hashing intact (match Piyush@123):', passMatch);
    console.log('================');

    process.exit(0);
}
runTest();
