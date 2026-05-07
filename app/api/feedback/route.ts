import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/feedback — admin: list all feedback
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const feedback = await prisma.feedback.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      loan: {
        select: {
          borrowedAt: true,
          returnedAt: true,
          book: { select: { title: true, author: true, category: true } },
          member: { select: { name: true, memberCode: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json(feedback);
}
