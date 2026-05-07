import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { generateMemberCode } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") ?? "";

  const members = await prisma.member.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { memberCode: { contains: query } },
            { phone: { contains: query } },
          ],
        }
      : {},
    orderBy: { name: "asc" },
    include: { _count: { select: { loans: true } } },
  });

  return NextResponse.json(members);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, email, phone, address, nextOfKin, nextOfKinPhone } = body;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const memberCode = generateMemberCode();

  const member = await prisma.member.create({
    data: {
      name: name.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      nextOfKin: nextOfKin?.trim() || null,
      nextOfKinPhone: nextOfKinPhone?.trim() || null,
      memberCode,
    },
  });

  return NextResponse.json(member, { status: 201 });
}
