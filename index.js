const { exec } = require("child_process");
const nodemailer = require("nodemailer");
require("dotenv").config();

// Function to check disk space
function checkDiskSpace() {
    exec("df -h /", (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing disk check: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }

        const lines = stdout.split("\n");
        const diskData = lines[1].split(/\s+/);
        const usedPercentage = parseInt(diskData[4]);
        const availableSpace = 100 - usedPercentage;

        console.log(`Available Disk Space: ${availableSpace}%`);

        if (availableSpace < DISK_THRESHOLD) {
            sendMail(availableSpace);
        }
    });
}

// Function to send email using Mailjet SMTP
function sendMail(availableSpace) {
    let transporter = nodemailer.createTransport({
        host: process.env.MAILJET_HOST,
        port: process.env.MAILJET_PORT,
        secure: process.env.MAILJET_SECURE === "true",
        auth: {
            user: process.env.MAILJET_USER,
            pass: process.env.MAILJET_PASS
        }
    });
    
    let recipients = process.env.MAIL_RECIPIENTS.split(","); // Get recipients from .env file

    let mailOptions = {
        from: process.env.MAIL_FROM,
        to: recipients.join(","), // Join emails with comma separator
        subject: "🚨 Server Disk Space Warning 🚨",
        html: `<h2 style="color: red;">⚠️ Warning: Low Disk Space!</h2>
               <p style="font-size: 16px;">Your <b>serverspace.top server</b> is running low on disk space. Only <strong style="color: red;">${availableSpace}%</strong> is available.</p>
               <p>Please take immediate action to free up space.</p>
               <hr>
               <p style="color: gray; font-size: 12px;">This is an automated alert from serverspace.top server monitoring system.</p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error(`Error sending mail: ${error.message}`);
        } else {
            console.log(`Alert email sent: ${info.response}`);
        }
    });
}

// Check disk space every hour
setInterval(checkDiskSpace, 60 * 60 * 1000);
// Check disk space every minute
//setInterval(checkDiskSpace, 60 * 1000);

// Initial check
checkDiskSpace();
