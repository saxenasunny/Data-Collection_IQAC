import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await prisma.collectionSession.findUnique({
      where: { id: params.id },
      include: {
        fields: {
          orderBy: { fieldOrder: "asc" },
        },
        submissions: {
          include: {
            student: true,
            faculty: true,
          },
          orderBy: { submittedAt: "desc" },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (err: unknown) {
    console.error("GET session detail error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, targetAudience, targetDepartments, isOpen, deadline } = body;

    const updated = await prisma.collectionSession.update({
      where: { id: params.id },
      data: {
        title: title ? title.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        targetAudience: targetAudience || undefined,
        targetDepartments: targetDepartments !== undefined ? targetDepartments : undefined,
        isOpen: isOpen !== undefined ? Boolean(isOpen) : undefined,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: unknown) {
    console.error("PUT session error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.collectionSession.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Session deleted" });
  } catch (err: unknown) {
    console.error("DELETE session error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
