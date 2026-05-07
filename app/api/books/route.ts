import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";
  const category = searchParams.get("category") ?? "";

  const books = await prisma.book.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { title: { contains: query } },
                { author: { contains: query } },
                { isbn: { contains: query } },
              ],
            }
          : {},
        category ? { category } : {},
      ],
    },
    orderBy: { title: "asc" },
  });

  return NextResponse.json(books);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, author, isbn, category, description, totalCopies, coverUrl } = body;

  if (!title || !author) {
    return NextResponse.json({ error: "Title and author are required" }, { status: 400 });
  }

  const copies = Number(totalCopies) || 1;

  const book = await prisma.book.create({
    data: { title, author, isbn, category, description, totalCopies: copies, available: copies, coverUrl },
  });

  return NextResponse.json(book, { status: 201 });
}
