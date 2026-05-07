import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const book = await prisma.book.findUnique({
    where: { id },
    include: {
      loans: {
        include: { member: true },
        orderBy: { borrowedAt: "desc" },
        take: 20,
      },
    },
  });

  if (!book) return NextResponse.json({ error: "Book not found" }, { status: 404 });
  return NextResponse.json(book);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, author, isbn, category, description, totalCopies, coverUrl } = body;

  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Book not found" }, { status: 404 });

  const copies = Number(totalCopies) || existing.totalCopies;
  const diffCopies = copies - existing.totalCopies;

  const book = await prisma.book.update({
    where: { id },
    data: {
      title: title ?? existing.title,
      author: author ?? existing.author,
      isbn,
      category,
      description,
      totalCopies: copies,
      available: Math.max(0, existing.available + diffCopies),
      coverUrl,
    },
  });

  return NextResponse.json(book);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const activeLoans = await prisma.loan.count({ where: { bookId: id, status: "ACTIVE" } });
  if (activeLoans > 0) {
    return NextResponse.json({ error: "Cannot delete a book with active loans" }, { status: 400 });
  }

  await prisma.book.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
