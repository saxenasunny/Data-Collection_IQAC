import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, fieldName, fieldType, placeholder, helperText, isRequired, options, fieldOrder } = body;

    if (!label) {
      return NextResponse.json({ error: "Field label is required" }, { status: 400 });
    }

    const sanitizedSlug =
      fieldName?.trim() ||
      label
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "_")
        .replace(/^_+|_+$/g, "") ||
      `field_${Date.now()}`;

    // Get current max order
    const count = await prisma.formField.count({ where: { sessionId: params.id } });

    const newField = await prisma.formField.create({
      data: {
        sessionId: params.id,
        label: label.trim(),
        fieldName: sanitizedSlug,
        fieldType: fieldType || "text",
        placeholder: placeholder?.trim() || null,
        helperText: helperText?.trim() || null,
        isRequired: Boolean(isRequired),
        options: Array.isArray(options)
          ? JSON.stringify(options)
          : typeof options === "string"
          ? options
          : null,
        fieldOrder: fieldOrder ?? count + 1,
      },
    });

    return NextResponse.json({ success: true, field: newField });
  } catch (err: unknown) {
    console.error("POST field error:", err);
    return NextResponse.json({ error: "Failed to create field" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const fieldId = searchParams.get("fieldId");

    if (!fieldId) {
      return NextResponse.json({ error: "fieldId is required" }, { status: 400 });
    }

    await prisma.formField.delete({
      where: {
        id: fieldId,
        sessionId: params.id,
      },
    });

    return NextResponse.json({ success: true, message: "Field removed" });
  } catch (err: unknown) {
    console.error("DELETE field error:", err);
    return NextResponse.json({ error: "Failed to delete field" }, { status: 500 });
  }
}
