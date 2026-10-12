import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await prisma.collectionSession.findMany({
      include: {
        fields: {
          orderBy: { fieldOrder: "asc" },
        },
        _count: {
          select: { submissions: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (err: unknown) {
    console.error("GET sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, targetAudience, targetDepartments, isOpen, deadline, fields } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Session title is required" }, { status: 400 });
    }

    const createdSession = await prisma.collectionSession.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        targetAudience: targetAudience || "ALL",
        targetDepartments: targetDepartments || null,
        isOpen: isOpen ?? true,
        deadline: deadline ? new Date(deadline) : null,
        fields: {
          create: (fields || []).map((f: {
            label: string;
            fieldName?: string;
            fieldType: string;
            placeholder?: string;
            helperText?: string;
            isRequired?: boolean;
            options?: string[] | string;
            fieldOrder?: number;
          }, idx: number) => ({
            label: f.label,
            fieldName:
              f.fieldName?.trim() ||
              f.label
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "_")
                .replace(/^_+|_+$/g, "") ||
              `field_${idx + 1}`,
            fieldType: f.fieldType || "text",
            placeholder: f.placeholder || null,
            helperText: f.helperText || null,
            isRequired: Boolean(f.isRequired),
            options: Array.isArray(f.options)
              ? JSON.stringify(f.options)
              : typeof f.options === "string"
              ? f.options
              : null,
            fieldOrder: f.fieldOrder ?? idx + 1,
          })),
        },
      },
      include: {
        fields: true,
      },
    });

    return NextResponse.json({ success: true, session: createdSession });
  } catch (err: unknown) {
    console.error("POST session error:", err);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, isOpen } = body;

    if (!id) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const updated = await prisma.collectionSession.update({
      where: { id },
      data: {
        isOpen: Boolean(isOpen),
      },
    });

    return NextResponse.json({ success: true, session: updated });
  } catch (err: unknown) {
    console.error("PATCH session error:", err);
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
  }
}
