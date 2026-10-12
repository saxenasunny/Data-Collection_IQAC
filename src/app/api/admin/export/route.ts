import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  generateStudentTemplate,
  generateFacultyTemplate,
  generateMasterExportExcel,
} from "@/lib/excel";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const template = searchParams.get("template");

    // 1. Download templates (can be accessed for sample download)
    if (template === "student") {
      const buffer = generateStudentTemplate();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Disposition": 'attachment; filename="IQAC_Students_Upload_Template.xlsx"',
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    if (template === "faculty") {
      const buffer = generateFacultyTemplate();
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Disposition": 'attachment; filename="IQAC_Faculty_Upload_Template.xlsx"',
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
      });
    }

    // 2. Export Master Data (requires admin authentication)
    const user = await getCurrentUser();
    if (!user || user.type !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all students with their submissions
    const students = await prisma.student.findMany({
      include: {
        submissions: {
          include: {
            session: true,
          },
        },
      },
      orderBy: { registrationId: "asc" },
    });

    // Fetch all faculties with their submissions
    const faculties = await prisma.faculty.findMany({
      include: {
        submissions: {
          include: {
            session: true,
          },
        },
      },
      orderBy: { facultyId: "asc" },
    });

    // Prepare Student rows
    const studentRows = students.map((s) => {
      let cumulative: Record<string, unknown> = {};
      try {
        cumulative = JSON.parse(s.baselineData || "{}");
      } catch {
        cumulative = {};
      }

      // Merge dynamic submissions
      const sessionAnswers: Record<string, unknown> = {};
      for (const sub of s.submissions) {
        try {
          const values = JSON.parse(sub.responseValues || "{}");
          for (const [k, v] of Object.entries(values)) {
            const colName = `[${sub.session.title}] ${k}`;
            sessionAnswers[colName] = v;
          }
        } catch {
          // ignore corrupted json
        }
      }

      return {
        "Registration ID": s.registrationId,
        "Application Number": s.applicationNo,
        "Name": s.name,
        "Department": s.department,
        "Program": s.program,
        "Year": s.year,
        "Cumulative Baseline History": JSON.stringify(cumulative),
        ...cumulative,
        ...sessionAnswers,
        "Last Updated": s.updatedAt.toISOString(),
      };
    });

    // Prepare Faculty rows
    const facultyRows = faculties.map((f) => {
      let cumulative: Record<string, unknown> = {};
      try {
        cumulative = JSON.parse(f.baselineData || "{}");
      } catch {
        cumulative = {};
      }

      const sessionAnswers: Record<string, unknown> = {};
      for (const sub of f.submissions) {
        try {
          const values = JSON.parse(sub.responseValues || "{}");
          for (const [k, v] of Object.entries(values)) {
            const colName = `[${sub.session.title}] ${k}`;
            sessionAnswers[colName] = v;
          }
        } catch {
          // ignore
        }
      }

      return {
        "Faculty ID": f.facultyId,
        "Name": f.name,
        "Designation": f.designation,
        "Department": f.department,
        "Cumulative Baseline History": JSON.stringify(cumulative),
        ...cumulative,
        ...sessionAnswers,
        "Last Updated": f.updatedAt.toISOString(),
      };
    });

    const masterExcelBuffer = generateMasterExportExcel(studentRows, facultyRows);

    const timestamp = new Date().toISOString().split("T")[0];
    return new NextResponse(new Uint8Array(masterExcelBuffer), {
      headers: {
        "Content-Disposition": `attachment; filename="IQAC_Consolidated_Master_Data_${timestamp}.xlsx"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (err: unknown) {
    console.error("Master Export Error:", err);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
