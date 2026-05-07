import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, sendWhatsApp, buildDueReminderEmail, buildOverdueEmail } from "@/lib/notifications";
import { processScheduledNotifications } from "@/lib/cron";
import { calculateFine } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { type, loanId } = body;

  if (!type || !loanId) {
    return NextResponse.json({ error: "type and loanId are required" }, { status: 400 });
  }

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { book: true, member: true },
  });

  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  const { member, book } = loan;
  const dueDateStr = format(loan.dueDate, "dd MMM yyyy");
  const fine = calculateFine(loan.dueDate);
  const results: { channel: string; success: boolean; error?: string }[] = [];

  if (type === "DUE_REMINDER" || type === "OVERDUE_ALERT") {
    const subject =
      type === "DUE_REMINDER"
        ? `Library Reminder: "${book.title}" is due on ${dueDateStr}`
        : `OVERDUE: Please return "${book.title}" — HOPFAN Library`;

    const html =
      type === "DUE_REMINDER"
        ? buildDueReminderEmail(member.name, book.title, dueDateStr)
        : buildOverdueEmail(member.name, book.title, dueDateStr, fine);

    const smsText =
      type === "DUE_REMINDER"
        ? `HOPFAN Library: Hi ${member.name}, "${book.title}" is due on ${dueDateStr}. Please return it on time.`
        : `HOPFAN Library: Hi ${member.name}, "${book.title}" is OVERDUE (was due ${dueDateStr}). Fine: R${fine.toFixed(2)}. Please return immediately.`;

    if (member.email) {
      try {
        await sendEmail(member.email, subject, html);
        await prisma.notification.create({
          data: { loanId, type, channel: "EMAIL", recipient: member.email, message: subject, success: true },
        });
        results.push({ channel: "EMAIL", success: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.notification.create({
          data: { loanId, type, channel: "EMAIL", recipient: member.email, message: msg, success: false },
        });
        results.push({ channel: "EMAIL", success: false, error: msg });
      }
    }

    if (member.phone) {
      try {
        await sendWhatsApp(member.phone, smsText);
        await prisma.notification.create({
          data: { loanId, type, channel: "WHATSAPP", recipient: member.phone, message: smsText, success: true },
        });
        results.push({ channel: "WHATSAPP", success: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.notification.create({
          data: { loanId, type, channel: "WHATSAPP", recipient: member.phone, message: msg, success: false },
        });
        results.push({ channel: "WHATSAPP", success: false, error: msg });
      }
    }
  }

  return NextResponse.json({ results });
}

// Bulk process: mark overdue loans & send notifications
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await processScheduledNotifications();

  return NextResponse.json({
    markedOverdue: result.markedOverdue,
    dueSoonCount: result.dueSoonCount,
    overdue: result.overdueNotified.map((r) => ({
      id: r.loanId,
      member: r.member,
      book: r.book,
    })),
    dueSoon: result.dueSoonNotified.map((r) => ({
      id: r.loanId,
      member: r.member,
      book: r.book,
    })),
  });
}
