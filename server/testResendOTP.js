require('dotenv').config();
const sendEmail = require('./utils/sendEmail');

async function testResend() {
    console.log("---------------------------------------");
    console.log("TESTING RESEND TO A DIFFERENT EMAIL...");
    console.log("---------------------------------------");
    try {
        const result = await sendEmail({
            email: 'random.test.account@gmail.com', // A different email
            subject: 'Test OTP Delivery',
            message: 'Your verification OTP is 123456'
        });
        console.log("RESEND SUCCESS RESULT:", result);
    } catch (error) {
        console.log("RESEND ERROR RESULT:");
        console.error(error.message || error);
        if (error.response) {
            console.log("RESPONSE DATA:", error.response.data);
        }
    }
}

testResend();
