import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { parseStudentsExcel } from "@/lib/excel";

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
          { registrationId: { contains: search } },
          { applicationNo: { contains: search } },
        ],
      });
    }

    if (department && department !== "ALL") {
      andConditions.push({ department });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { registrationId: "asc" },
      }),
      prisma.student.count({ where }),
    ]);

    return NextResponse.json({ students, total, page, limit });
  } catch (err: unknown) {
    console.error("GET students error:", err);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
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
      const { rows, errors } = parseStudentsExcel(buffer);

      if (rows.length === 0) {
        return NextResponse.json(
          { error: "No valid rows found in sheet.", details: errors },
          { status: 400 }
        );
      }

      let insertedCount = 0;
      let updatedCount = 0;

      // Upsert in transactions or sequential chunks to avoid lock contention
      for (const row of rows) {
        const existing = await prisma.student.findUnique({
          where: { registrationId: row.registrationId },
        });

        if (existing) {
          await prisma.student.update({
            where: { registrationId: row.registrationId },
            data: {
              applicationNo: row.applicationNo,
              name: row.name,
              department: row.department,
              program: row.program,
              year: row.year,
            },
          });
          updatedCount++;
        } else {
          await prisma.student.create({
            data: {
              registrationId: row.registrationId,
              applicationNo: row.applicationNo,
              name: row.name,
              department: row.department,
              program: row.program,
              year: row.year,
              baselineData: "{}",
            },
          });
          insertedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${rows.length} student records (${insertedCount} new, ${updatedCount} updated).`,
        totalProcessed: rows.length,
        insertedCount,
        updatedCount,
        parsingErrors: errors,
      });
    }

    return NextResponse.json({ error: "Unsupported content type" }, { status: 400 });
  } catch (err: unknown) {
    console.error("POST students bulk upload error:", err);
    return NextResponse.json({ error: "Failed to upload student data" }, { status: 500 });
  }
}
