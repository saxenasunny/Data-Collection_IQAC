import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    return NextResponse.json({ authenticated: false, user: null });
  }

  if (sessionUser.type === "ADMIN") {
    const admin = await prisma.admin.findUnique({ where: { id: sessionUser.id } });
    if (!admin) return NextResponse.json({ authenticated: false, user: null });
    return NextResponse.json({
      authenticated: true,
      user: { role: "admin", id: admin.id, email: admin.email, name: admin.name },
    });
  }

  if (sessionUser.type === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { id: sessionUser.id } });
    if (!student) return NextResponse.json({ authenticated: false, user: null });
    return NextResponse.json({
      authenticated: true,
      user: {
        role: "student",
        id: student.id,
        registrationId: student.registrationId,
        applicationNo: student.applicationNo,
        name: student.name,
        department: student.department,
        program: student.program,
        year: student.year,
        baselineData: JSON.parse(student.baselineData || "{}"),
      },
    });
  }

  if (sessionUser.type === "FACULTY") {
    const faculty = await prisma.faculty.findUnique({ where: { id: sessionUser.id } });
    if (!faculty) return NextResponse.json({ authenticated: false, user: null });
    return NextResponse.json({
      authenticated: true,
      user: {
        role: "faculty",
        id: faculty.id,
        facultyId: faculty.facultyId,
        name: faculty.name,
        designation: faculty.designation,
        department: faculty.department,
        baselineData: JSON.parse(faculty.baselineData || "{}"),
      },
    });
  }

  return NextResponse.json({ authenticated: false, user: null });
}
