import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      loans: {
        include: { book: true },
        orderBy: { borrowedAt: "desc" },
      },
    },
  });

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { name, email, phone, address, active, nextOfKin, nextOfKinPhone } = body;

  const member = await prisma.member.update({
    where: { id },
    data: {
      name: name?.trim(),
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      address: address?.trim() || null,
      active,
      nextOfKin: nextOfKin?.trim() || null,
      nextOfKinPhone: nextOfKinPhone?.trim() || null,
    },
  });

  return NextResponse.json(member);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const activeLoans = await prisma.loan.count({ where: { memberId: id, status: "ACTIVE" } });
  if (activeLoans > 0) {
    return NextResponse.json({ error: "Cannot delete a member with active loans" }, { status: 400 });
  }

  await prisma.member.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
