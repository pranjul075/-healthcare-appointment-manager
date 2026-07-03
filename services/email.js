

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendMail(to, subject, html) {
    try {

        const data = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to,
            subject,
            html
        });

        console.log("Email sent:", data);

        return true;

    } catch (err) {

        console.error("Resend Error:", err);

        return false;
    }
}

module.exports = { sendMail };
