import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { calculateFine } from "@/lib/utils";
import { addDays } from "date-fns";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const loan = await prisma.loan.findUnique({
    where: { id },
    include: { book: true, member: true, notifications: true },
  });

  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });
  return NextResponse.json(loan);
}

// Return a book
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { action, finePaid, notes } = body;

  const loan = await prisma.loan.findUnique({ where: { id }, include: { book: true } });
  if (!loan) return NextResponse.json({ error: "Loan not found" }, { status: 404 });

  if (action === "return") {
    if (loan.status === "RETURNED") {
      return NextResponse.json({ error: "Book already returned" }, { status: 400 });
    }

    const fine = calculateFine(loan.dueDate);

    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id },
        data: {
          status: "RETURNED",
          returnedAt: new Date(),
          fine,
          finePaid: finePaid ?? fine === 0,
          notes,
        },
        include: { book: true, member: true },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { available: { increment: 1 } },
      }),
    ]);

    return NextResponse.json(updated);
  }

  if (action === "renew") {
    if (loan.status !== "ACTIVE") {
      return NextResponse.json({ error: "Only active loans can be renewed" }, { status: 400 });
    }
    if (loan.renewalCount >= 2) {
      return NextResponse.json({ error: "Maximum renewals (2) reached" }, { status: 400 });
    }

    const newDueDate = addDays(loan.dueDate, 14);
    const updated = await prisma.loan.update({
      where: { id },
      data: { dueDate: newDueDate, renewalCount: { increment: 1 } },
      include: { book: true, member: true },
    });

    return NextResponse.json(updated);
  }

  if (action === "mark_lost") {
    const [updated] = await prisma.$transaction([
      prisma.loan.update({
        where: { id },
        data: { status: "LOST" },
        include: { book: true, member: true },
      }),
      prisma.book.update({
        where: { id: loan.bookId },
        data: { totalCopies: { decrement: 1 } },
      }),
    ]);
    return NextResponse.json(updated);
  }

  if (action === "pay_fine") {
    const updated = await prisma.loan.update({
      where: { id },
      data: { finePaid: true },
      include: { book: true, member: true },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
