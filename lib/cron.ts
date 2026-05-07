import { prisma } from "@/lib/prisma";
import { sendEmail, sendWhatsApp, buildDueReminderEmail, buildOverdueEmail } from "@/lib/notifications";
import { calculateFine } from "@/lib/utils";
import { format, addDays } from "date-fns";

export interface NotificationResult {
  loanId: string;
  member: string;
  book: string;
  channels: { channel: string; success: boolean; error?: string }[];
}

export interface ScheduledRunResult {
  markedOverdue: number;
  dueSoonCount: number;
  overdueNotified: NotificationResult[];
  dueSoonNotified: NotificationResult[];
}

async function notifyLoan(
  loan: {
    id: string;
    dueDate: Date;
    book: { title: string };
    member: { name: string; email: string | null; phone: string | null };
  },
  type: "DUE_REMINDER" | "OVERDUE_ALERT"
): Promise<NotificationResult> {
  const dueDateStr = format(loan.dueDate, "dd MMM yyyy");
  const fine = calculateFine(loan.dueDate);
  const results: { channel: string; success: boolean; error?: string }[] = [];

  const subject =
    type === "DUE_REMINDER"
      ? `Library Reminder: "${loan.book.title}" is due on ${dueDateStr}`
      : `OVERDUE: Please return "${loan.book.title}" — HOPFAN Library`;

  const html =
    type === "DUE_REMINDER"
      ? buildDueReminderEmail(loan.member.name, loan.book.title, dueDateStr)
      : buildOverdueEmail(loan.member.name, loan.book.title, dueDateStr, fine);

  const whatsappText =
    type === "DUE_REMINDER"
      ? `HOPFAN Library: Hi ${loan.member.name}, "${loan.book.title}" is due on ${dueDateStr}. Please return it on time.`
      : `HOPFAN Library: Hi ${loan.member.name}, "${loan.book.title}" is OVERDUE (was due ${dueDateStr}). Fine: R${fine.toFixed(2)}. Please return immediately.`;

  if (loan.member.email) {
    try {
      await sendEmail(loan.member.email, subject, html);
      await prisma.notification.create({
        data: { loanId: loan.id, type, channel: "EMAIL", recipient: loan.member.email, message: subject, success: true },
      });
      results.push({ channel: "EMAIL", success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.notification.create({
        data: { loanId: loan.id, type, channel: "EMAIL", recipient: loan.member.email, message: msg, success: false },
      });
      results.push({ channel: "EMAIL", success: false, error: msg });
    }
  }

  if (loan.member.phone) {
    try {
      await sendWhatsApp(loan.member.phone, whatsappText);
      await prisma.notification.create({
        data: { loanId: loan.id, type, channel: "WHATSAPP", recipient: loan.member.phone, message: whatsappText, success: true },
      });
      results.push({ channel: "WHATSAPP", success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.notification.create({
        data: { loanId: loan.id, type, channel: "WHATSAPP", recipient: loan.member.phone, message: msg, success: false },
      });
      results.push({ channel: "WHATSAPP", success: false, error: msg });
    }
  }

  return { loanId: loan.id, member: loan.member.name, book: loan.book.title, channels: results };
}

export async function processScheduledNotifications(): Promise<ScheduledRunResult> {
  const now = new Date();

  // Mark any ACTIVE loans past due date as OVERDUE
  await prisma.loan.updateMany({
    where: { status: "ACTIVE", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  // Loans due within the next 2 days
  const inTwoDays = addDays(now, 2);
  const dueSoonLoans = await prisma.loan.findMany({
    where: { status: "ACTIVE", dueDate: { gte: now, lte: inTwoDays } },
    include: { book: true, member: true },
  });

  // All currently overdue loans
  const overdueLoans = await prisma.loan.findMany({
    where: { status: "OVERDUE" },
    include: { book: true, member: true },
  });

  const overdueNotified: NotificationResult[] = [];
  const dueSoonNotified: NotificationResult[] = [];

  for (const loan of overdueLoans) {
    const result = await notifyLoan(loan, "OVERDUE_ALERT");
    overdueNotified.push(result);
  }

  for (const loan of dueSoonLoans) {
    const result = await notifyLoan(loan, "DUE_REMINDER");
    dueSoonNotified.push(result);
  }

  console.log(
    `[cron] ${format(now, "dd MMM yyyy HH:mm")} — overdue: ${overdueLoans.length}, due-soon: ${dueSoonLoans.length}`
  );

  return {
    markedOverdue: overdueLoans.length,
    dueSoonCount: dueSoonLoans.length,
    overdueNotified,
    dueSoonNotified,
  };
}
