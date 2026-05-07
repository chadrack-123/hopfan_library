import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, sendWhatsApp, buildFeedbackRequestEmail } from "@/lib/notifications";

// POST /api/feedback/request — admin triggers a feedback request for a loan
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { loanId } = body;

  if (!loanId) {
    return NextResponse.json({ error: "loanId is required" }, { status: 400 });
  }

  const loan = await prisma.loan.findUnique({
    where: { id: loanId },
    include: { book: true, member: true },
  });

  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  // Upsert: one feedback record per loan. Re-requesting resends but doesn't change the token.
  const feedback = await prisma.feedback.upsert({
    where: { loanId },
    create: {
      loanId,
      memberName: loan.member.name,
      bookTitle: loan.book.title,
    },
    update: {
      // Don't reset existing submission data — just ensure the record exists
    },
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const feedbackUrl = `${baseUrl}/feedback/${feedback.token}`;

  const memberEmail = loan.member.email?.trim() || null;
  const memberPhone = loan.member.phone?.trim() || null;

  const results: { channel: string; success: boolean; error?: string }[] = [];

  // Send email
  if (memberEmail) {
    try {
      const html = buildFeedbackRequestEmail(loan.member.name, loan.book.title, feedbackUrl);
      await sendEmail(
        memberEmail,
        `Your feedback on "${loan.book.title}" — HOPFAN Library`,
        html
      );
      await prisma.notification.create({
        data: {
          loanId,
          type: "FEEDBACK_REQUEST",
          channel: "EMAIL",
          recipient: memberEmail,
          message: `Feedback request sent for "${loan.book.title}"`,
          success: true,
        },
      });
      results.push({ channel: "EMAIL", success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.notification.create({
        data: {
          loanId,
          type: "FEEDBACK_REQUEST",
          channel: "EMAIL",
          recipient: memberEmail,
          message: msg,
          success: false,
        },
      });
      results.push({ channel: "EMAIL", success: false, error: msg });
    }
  }

  // Send WhatsApp
  if (memberPhone) {
    const whatsappText =
      `HOPFAN Library: Hi ${loan.member.name}, we'd love to hear your feedback on "${loan.book.title}". ` +
      `Please share your thoughts here: ${feedbackUrl}`;
    try {
      await sendWhatsApp(memberPhone, whatsappText);
      await prisma.notification.create({
        data: {
          loanId,
          type: "FEEDBACK_REQUEST",
          channel: "WHATSAPP",
          recipient: memberPhone,
          message: whatsappText,
          success: true,
        },
      });
      results.push({ channel: "WHATSAPP", success: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      await prisma.notification.create({
        data: {
          loanId,
          type: "FEEDBACK_REQUEST",
          channel: "WHATSAPP",
          recipient: memberPhone,
          message: msg,
          success: false,
        },
      });
      results.push({ channel: "WHATSAPP", success: false, error: msg });
    }
  }

  return NextResponse.json({
    feedbackUrl,
    token: feedback.token,
    results,
    noContactInfo: !memberEmail && !memberPhone,
    alreadySubmitted: !!feedback.submittedAt,
  });
}
