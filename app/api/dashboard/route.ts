import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalBooks, totalMembers, activeLoans, overdueLoans, unpaidFines] = await Promise.all([
    prisma.book.count(),
    prisma.member.count(),
    prisma.loan.count({ where: { status: "ACTIVE" } }),
    prisma.loan.count({ where: { status: "OVERDUE" } }),
    prisma.loan.aggregate({
      where: { finePaid: false, fine: { gt: 0 } },
      _sum: { fine: true },
    }),
  ]);

  const recentLoans = await prisma.loan.findMany({
    take: 5,
    orderBy: { borrowedAt: "desc" },
    include: {
      book: { select: { title: true } },
      member: { select: { name: true } },
    },
  });

  return NextResponse.json({
    totalBooks,
    totalMembers,
    activeLoans,
    overdueLoans,
    unpaidFines: unpaidFines._sum.fine ?? 0,
    recentLoans,
  });
}
