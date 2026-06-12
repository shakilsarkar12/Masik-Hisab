const cron = require('node-cron');
const nodemailer = require('nodemailer');
const { clerkClient } = require('@clerk/express');
const NotificationSettings = require('../models/NotificationSettings');
const Income = require('../models/Income');
const Expense = require('../models/Expense');

// Create transporter helper (robust sandbox, SMTP config, or logger fallback)
const createTransporter = async () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  // Create ethereal test account for local environments
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } catch (err) {
    console.warn("[CronScheduler] Ethereal Email account creation failed. Falling back to Console Logger.", err.message);
    return {
      sendMail: async (mailOptions) => {
        console.log("\n=================== MOCK EMAIL SENT ===================");
        console.log(`To: ${mailOptions.to}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Body (Plain): Please log into MasikHisab and enter your daily income/expense transactions!`);
        console.log("========================================================\n");
        return { messageId: 'mock-logger-id' };
      }
    };
  }
};

// Main task logic to check transactions and send reminder
const checkAndSendDailyReminders = async () => {
  console.log('[CronScheduler] Running daily reminder check...');
  try {
    const settingsList = await NotificationSettings.find({ dailyReminderEnabled: true });
    const transporter = await createTransporter();

    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = now.toDateString(); // For check duplicate

    for (const settings of settingsList) {
      // Parse reminder hour
      const [remHourStr] = settings.dailyReminderTime.split(':');
      const reminderHour = parseInt(remHourStr, 10);

      // Verify it is the target hour
      if (currentHour !== reminderHour) {
        continue;
      }

      // Check if reminder was already sent today
      if (settings.lastReminderSent && settings.lastReminderSent.toDateString() === todayStr) {
        continue;
      }

      // Query if user entered any income or expense today
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const endOfToday = new Date();
      endOfToday.setHours(23, 59, 59, 999);

      const hasIncome = await Income.findOne({
        userId: settings.userId,
        date: { $gte: startOfToday, $lte: endOfToday }
      });

      const hasExpense = await Expense.findOne({
        userId: settings.userId,
        date: { $gte: startOfToday, $lte: endOfToday }
      });

      // If user hasn't logged anything today, send email!
      if (!hasIncome && !hasExpense) {
        try {
          // Fetch user info from Clerk to get their email address
          const user = await clerkClient.users.getUser(settings.userId);
          const email = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user.emailAddresses[0]?.emailAddress;

          if (email) {
            console.log(`[CronScheduler] Dispatched email reminder to user ${settings.userId} at ${email}`);
            
            const htmlContent = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #0f172a; color: #f8fafc;">
                <div style="text-align: center; border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 20px;">
                  <h1 style="color: #38bdf8; margin: 0; font-size: 24px;">MasikHisab Reminder</h1>
                  <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Personal Finance Dashboard</p>
                </div>
                <div style="line-height: 1.6; font-size: 16px;">
                  <p>Hello ${user.firstName || 'there'},</p>
                  <p>We noticed that you haven't added any income or expense entries to your dashboard today.</p>
                  <p>Keeping your logs updated daily is the best way to maintain budget accuracy and reach your savings goals!</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.FRONTEND_URL || 'https://masikhisab.vercel.app'}" style="background-color: #38bdf8; color: #0f172a; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">Log Transactions Now</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">You received this email because daily reminders are active in your settings. You can modify your preferences at any time in the dashboard.</p>
                </div>
                <div style="text-align: center; border-top: 1px solid #334155; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #64748b;">
                  &copy; 2026 MasikHisab. All rights reserved.
                </div>
              </div>
            `;

            await transporter.sendMail({
              from: '"MasikHisab" <noreply@masikhisab.com>',
              to: email,
              subject: 'Daily Personal Finance Entry Reminder 📅',
              text: 'Hello, you haven\'t added any transactions today. Please log in to MasikHisab to record your expenses.',
              html: htmlContent
            });

            // Update reminder sent timestamp
            settings.lastReminderSent = now;
            await settings.save();
          } else {
            console.warn(`[CronScheduler] No primary email found for Clerk user: ${settings.userId}`);
          }
        } catch (clerkErr) {
          console.error(`[CronScheduler] Failed to fetch user profile for userId: ${settings.userId}`, clerkErr.message);
        }
      }
    }
  } catch (error) {
    console.error('[CronScheduler] Error checking/sending daily reminders:', error);
  }
};

// Initialize cron scheduler tasks
const initCronScheduler = () => {
  console.log('[CronScheduler] Initializing background scheduler tasks...');
  
  // Run once every hour at the top of the hour: '0 * * * *'
  cron.schedule('0 * * * *', checkAndSendDailyReminders);

  // In development environments, we log scheduling information
  console.log('[CronScheduler] Daily transaction entry checker scheduled (Hourly interval check).');
};

// General purpose email sender helper
const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = await createTransporter();
    const info = await transporter.sendMail({
      from: '"MasikHisab" <noreply@masikhisab.com>',
      to,
      subject,
      text,
      html
    });
    return info;
  } catch (error) {
    console.error('[CronScheduler] Error sending email:', error);
    throw error;
  }
};

module.exports = {
  initCronScheduler,
  // Export for testing purposes
  checkAndSendDailyReminders,
  sendEmail
};
