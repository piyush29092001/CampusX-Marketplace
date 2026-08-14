const { Resend } = require('resend');

const sendEmail = async (options) => {
    // Requires process.env.RESEND_API_KEY
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { email, otp } = options;

    try {
        const data = await resend.emails.send({
            from: process.env.RESEND_FROM_EMAIL || 'LUMINA <onboarding@resend.dev>',
            to: [email],
            subject: 'LUMINA_ Email Verification',
            text: `LUMINA_ Email Verification\n\nYour verification code is:\n\n${otp}\n\nThis code expires in 10 minutes.\n\nIf you did not create this account, ignore this email.`,
            html: `<p>LUMINA_ Email Verification</p><p>Your verification code is: <strong>${otp}</strong></p><p>This code expires in 10 minutes.</p><p>If you did not create this account, ignore this email.</p>`
        });

        if (data.error) {
            throw new Error(`Resend Error: ${data.error.message || JSON.stringify(data.error)}`);
        }

        console.log(`Email sent to ${email} via Resend. Message ID: ${data.id || data.data?.id}`);
        return data;
    } catch (error) {
        console.error('Error sending email via Resend:', error);
        throw error;
    }
};

module.exports = sendEmail;
