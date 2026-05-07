import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/feedback/[token] — public: load feedback form data
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const feedback = await prisma.feedback.findUnique({
    where: { token },
    select: {
      memberName: true,
      bookTitle: true,
      submittedAt: true,
      rating: true,
      review: true,
      learnings: true,
      wouldRecommend: true,
    },
  });

  if (!feedback) {
    return NextResponse.json({ error: "Invalid feedback link" }, { status: 404 });
  }

  return NextResponse.json({
    memberName: feedback.memberName,
    bookTitle: feedback.bookTitle,
    alreadySubmitted: !!feedback.submittedAt,
    ...(feedback.submittedAt
      ? {
          rating: feedback.rating,
          review: feedback.review,
          learnings: feedback.learnings,
          wouldRecommend: feedback.wouldRecommend,
        }
      : {}),
  });
}

// POST /api/feedback/[token] — public: submit feedback
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await req.json();
  const { rating, review, learnings, wouldRecommend } = body;

  const existing = await prisma.feedback.findUnique({ where: { token } });

  if (!existing) {
    return NextResponse.json({ error: "Invalid feedback link" }, { status: 404 });
  }

  if (existing.submittedAt) {
    return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
  }

  if (rating !== undefined && (typeof rating !== "number" || rating < 1 || rating > 5)) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
  }

  const updated = await prisma.feedback.update({
    where: { token },
    data: {
      rating: rating ?? null,
      review: review?.trim() || null,
      learnings: learnings?.trim() || null,
      wouldRecommend: wouldRecommend ?? null,
      submittedAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, memberName: updated.memberName, bookTitle: updated.bookTitle });
}
