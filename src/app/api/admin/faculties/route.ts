import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseFacultiesExcel } from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.trim() || "";
    const department = searchParams.get("department")?.trim() || "";
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const skip = (page - 1) * limit;

    const where: {
      AND?: Array<Record<string, unknown>>;
    } = {};

    const andConditions: Array<Record<string, unknown>> = [];

    if (search) {
      andConditions.push({
        OR: [
          { name: { contains: search } },
          { facultyId: { contains: search } },
          { designation: { contains: search } },
        ],
      });
    }

    if (department && department !== "ALL") {
      andConditions.push({ department });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [faculties, total] = await Promise.all([
      prisma.faculty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { facultyId: "asc" },
      }),
      prisma.faculty.count({ where }),
    ]);

    return NextResponse.json({ faculties, total, page, limit });
  } catch (err: unknown) {
    console.error("GET faculties error:", err);
    return NextResponse.json({ error: "Failed to fetch faculties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const { rows, errors } = parseFacultiesExcel(buffer);

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in sheet.", details: errors },
          { status: 400 }
        );
      }

      let insertedCount = 0;
      let updatedCount = 0;

      for (const row of rows) {
        const existing = await prisma.faculty.findUnique({
          where: { facultyId: row.facultyId },
        });

        if (existing) {
          await prisma.faculty.update({
            where: { facultyId: row.facultyId },
            data: {
              name: row.name,
              designation: row.designation,
              department: row.department,
            },
          });
          updatedCount++;
        } else {
          await prisma.faculty.create({
            data: {
              facultyId: row.facultyId,
              name: row.name,
              designation: row.designation,
              department: row.department,
              baselineData: "{}",
            },
          });
          insertedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${rows.length} faculty records (${insertedCount} new, ${updatedCount} updated).`,
        totalProcessed: rows.length,
        insertedCount,
        updatedCount,
        parsingErrors: errors,
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST faculties bulk upload error:", err);
    return NextResponse.json({ error: "Failed to upload faculty data" }, { status: 500 });
  }
}
