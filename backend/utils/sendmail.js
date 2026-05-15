import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const sendmail = async (email, html, subject) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });

        // send mail with defined transport object
        const info = await transporter.sendMail({
            from: '"SmashShop" <no-reply@smashshop.com>',
            to: email,
            subject: subject || "Notification from SmashShop",
            html: html,
        });

        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
}

export default sendmail;
