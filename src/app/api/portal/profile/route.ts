import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.type === "STUDENT") {
      const student = await prisma.student.findUnique({
        where: { id: user.id },
      });

      if (!student) {
        return NextResponse.json({ error: "Student record not found" }, { status: 404 });
      }

      let baseline = {};
      try {
        baseline = JSON.parse(student.baselineData || "{}");
      } catch {
        baseline = {};
      }

      return NextResponse.json({
        type: "STUDENT",
        id: student.id,
        registrationId: student.registrationId,
        applicationNo: student.applicationNo,
        name: student.name,
        department: student.department,
        program: student.program,
        year: student.year,
        baselineData: baseline,
        updatedAt: student.updatedAt,
      });
    }

    if (user.type === "FACULTY") {
      const faculty = await prisma.faculty.findUnique({
        where: { id: user.id },
      });

      if (!faculty) {
        return NextResponse.json({ error: "Faculty record not found" }, { status: 404 });
      }

      let baseline = {};
      try {
        baseline = JSON.parse(faculty.baselineData || "{}");
      } catch {
        baseline = {};
      }

      return NextResponse.json({
        type: "FACULTY",
        id: faculty.id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        designation: faculty.designation,
        department: faculty.department,
        baselineData: baseline,
        updatedAt: faculty.updatedAt,
      });
    }

    return NextResponse.json({ error: "Invalid user type" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Portal profile error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
