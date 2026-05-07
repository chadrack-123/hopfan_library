import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { sendEmail, sendWhatsApp, buildLoanConfirmationEmail } from "@/lib/notifications";
import { addDays, format, differenceInDays } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "";

  const loans = await prisma.loan.findMany({
    where: status ? { status: status as "ACTIVE" | "RETURNED" | "OVERDUE" | "LOST" } : {},
    include: {
      book: { select: { id: true, title: true, author: true } },
      member: { select: { id: true, name: true, email: true, phone: true, memberCode: true } },
    },
    orderBy: { borrowedAt: "desc" },
  });

  return NextResponse.json(loans);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { bookId, memberId, dueDays = 14, notes } = body;

  if (!bookId || !memberId) {
    return NextResponse.json({ error: "bookId and memberId are required" }, { status: 400 });
  }

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  if (book.available < 1) return NextResponse.json({ error: "No copies available" }, { status: 400 });

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member || !member.active) {
    return NextResponse.json({ error: "Member not found or inactive" }, { status: 404 });
  }

  const dueDate = addDays(new Date(), Number(dueDays));

  const [loan] = await prisma.$transaction([
    prisma.loan.create({
      data: { bookId, memberId, dueDate, notes },
      include: { book: true, member: true },
    }),
    prisma.book.update({
      where: { id: bookId },
      data: { available: { decrement: 1 } },
    }),
  ]);

  // Fire-and-forget loan confirmation notifications
  (async () => {
    const borrowedAtStr = format(loan.borrowedAt, "dd MMM yyyy");
    const dueDateStr = format(loan.dueDate, "dd MMM yyyy");
    const loanDays = differenceInDays(loan.dueDate, loan.borrowedAt);

    const confirmationText =
      `HOPFAN Library — Loan Confirmed!\n` +
      `Member: ${loan.member.name} (${loan.member.memberCode})\n` +
      `Book: "${loan.book.title}" by ${loan.book.author}\n` +
      `Borrowed: ${borrowedAtStr}\n` +
      `Return by: ${dueDateStr} (${loanDays} days)\n` +
      `Please return the book on time to avoid fines.`;

    if (loan.member.email) {
      const html = buildLoanConfirmationEmail(
        loan.member.name,
        loan.member.memberCode,
        loan.book.title,
        loan.book.author,
        borrowedAtStr,
        dueDateStr,
        loanDays
      );
      await sendEmail(
        loan.member.email,
        `Loan Confirmed: "${loan.book.title}" — HOPFAN Library`,
        html
      ).then(() =>
        prisma.notification.create({
          data: {
            loanId: loan.id,
            type: "LOAN_CONFIRMATION",
            channel: "EMAIL",
            recipient: loan.member.email!,
            message: `Loan confirmation sent for "${loan.book.title}"`,
            success: true,
          },
        })
      ).catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Unknown error";
        prisma.notification.create({
          data: {
            loanId: loan.id,
            type: "LOAN_CONFIRMATION",
            channel: "EMAIL",
            recipient: loan.member.email!,
            message: msg,
            success: false,
          },
        }).catch(console.error);
      });
    }

    if (loan.member.phone) {
      await sendWhatsApp(loan.member.phone, confirmationText)
        .then(() =>
          prisma.notification.create({
            data: {
              loanId: loan.id,
              type: "LOAN_CONFIRMATION",
              channel: "WHATSAPP",
              recipient: loan.member.phone!,
              message: confirmationText,
              success: true,
            },
          })
        ).catch((err: unknown) => {
          const msg = err instanceof Error ? err.message : "Unknown error";
          prisma.notification.create({
            data: {
              loanId: loan.id,
              type: "LOAN_CONFIRMATION",
              channel: "WHATSAPP",
              recipient: loan.member.phone!,
              message: msg,
              success: false,
            },
          }).catch(console.error);
        });
    }
  })().catch(console.error);

  return NextResponse.json(loan, { status: 201 });
}
