import cron from 'node-cron';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER || 'demo',
    pass: process.env.SMTP_PASS || 'demo',
  },
});

export function initFollowUpCronJobs() {
  // Run daily at 08:00 AM (or every hour in dev testing)
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Cron] Scanning for upcoming customer follow-ups...');
    try {
      const today = new Date();
      const next24h = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const upcomingCustomers = await prisma.customer.findMany({
        where: {
          nextFollowUpAt: {
            gte: today,
            lte: next24h,
          },
        },
        include: {
          followUps: {
            orderBy: { followUpDate: 'desc' },
            take: 1,
            include: { createdBy: true },
          },
        },
      });

      logger.info(`[Cron] Found ${upcomingCustomers.length} upcoming customer follow-ups`);

      for (const customer of upcomingCustomers) {
        const lastFollowUp = customer.followUps[0];
        const salesRepEmail = lastFollowUp?.createdBy?.email || 'sales@example.com';
        const salesRepName = lastFollowUp?.createdBy?.name || 'Sales Rep';

        logger.info(`[Notification] Reminder for ${salesRepName} (${salesRepEmail}): Customer "${customer.name}" follow-up scheduled at ${customer.nextFollowUpAt}`);

        if (process.env.SMTP_HOST) {
          await transporter.sendMail({
            from: '"Nexus Operations ERP" <noreply@nexus.com>',
            to: salesRepEmail,
            subject: `[Reminder] Customer Follow-Up Scheduled for ${customer.name}`,
            text: `Hello ${salesRepName},\n\nYou have an upcoming follow-up scheduled with ${customer.name} (${customer.businessName}, Mobile: ${customer.mobile}) on ${customer.nextFollowUpAt?.toLocaleString()}.\n\nAddress: ${customer.address}\nNotes: ${customer.notes || 'N/A'}\n\nNexus Operations Portal`,
          }).catch((err) => logger.warn(`[Cron] Email dispatch warning: ${err.message}`));
        }
      }
    } catch (err) {
      logger.error(`[Cron] Error scanning follow-ups: ${err instanceof Error ? err.message : err}`);
    }
  });

  logger.info('[Cron] Follow-up reminder cron job initialized');
}
