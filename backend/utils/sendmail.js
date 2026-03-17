import dotenv from "dotenv";
import nodemailer from "nodemailer";
import asyncHandler from 'express-async-handler';
dotenv.config();

const sendmail = asyncHandler(async function main(email, html) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "nguyenhongcuonga1@gmail.com", // generated ethereal user
            pass: "rtrbrqzpxdfhidpa", // generated ethereal password
        },
    });

    // async..await is not allowed in global scope, must use a wrapper
    // send mail with defined transport object
    const info = await transporter.sendMail({
        from: '"SmashShop" <no-reply@SmashShop.com>', // sender address
        to: email, // list of receivers
        subject: "Forgot Email", // Subject line
        html: html, // html body
    });

    console.log("Message sent: %s", info.messageId);

})
export default sendmail;
