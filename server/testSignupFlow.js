const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');
require('dotenv').config();

// We will mock req/res for the controller
const authController = require('./controllers/authController');

async function debugFlow() {
    console.log("=========================================");
    console.log("DEBUGGING SIGNUP FLOW FOR NEW EMAIL");
    console.log("=========================================");
    await connectDB();

    // Test email
    const testEmail = "test_different_email_" + Date.now() + "@example.com";

    const req = {
        body: {
            name: "Test User",
            email: testEmail,
            college: "IIT BHU",
            password: "Password123!"
        }
    };

    const res = {
        status: function (code) {
            this.statusCode = code;
            return this;
        },
        json: function (data) {
            this.data = data;
            console.log("\n[FRONTEND RESPONSE HTTP " + this.statusCode + "]");
            console.log(JSON.stringify(data, null, 2));
            return this;
        }
    };

    try {
        console.log("1. Checking if user exists in DB...");
        const existing = await User.findOne({ email: testEmail });
        console.log("User already exists inside MongoDB:", existing ? "YES" : "NO");

        console.log("\n2. Executing register controller...");
        await authController.register(req, res);

        console.log("\n3. Post-execution DB check...");
        const postUser = await User.findOne({ email: testEmail });
        if (postUser) {
            console.log("- User found in DB");
            console.log("- isVerified:", postUser.isVerified);
            console.log("- OTP generated:", !!postUser.otp);
            console.log("- OTP Expiry:", postUser.otpExpires);
        } else {
            console.log("- User NOT found in DB after execution.");
        }
    } catch (e) {
        console.error("DEBUG SCRIPT EXCEPTION:", e);
    } finally {
        mongoose.connection.close();
    }
}

debugFlow();
