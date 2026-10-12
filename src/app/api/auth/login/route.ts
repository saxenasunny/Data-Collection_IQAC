import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, email, password, registrationId, applicationNo, facultyId } = body;

    // 1. Admin Login
    if (role === "admin") {
      if (!email || !password) {
        return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
      }

      const admin = await prisma.admin.findUnique({
        where: { email: email.trim().toLowerCase() },
      });

      if (!admin || admin.passwordHash !== password) {
        return NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 });
      }

      const token = signToken({
        type: "ADMIN",
        id: admin.id,
        identifier: admin.email,
        name: admin.name,
      });

      const response = NextResponse.json({
        success: true,
        user: { role: "admin", id: admin.id, name: admin.name, email: admin.email },
      });

      response.cookies.set("iqac_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 2. Student Login
    if (role === "student") {
      if (!registrationId || !applicationNo) {
        return NextResponse.json(
          { error: "Both Registration ID and Application Number are required" },
          { status: 400 }
        );
      }

      const student = await prisma.student.findFirst({
        where: {
          registrationId: {
            equals: registrationId.trim(),
          },
          applicationNo: {
            equals: applicationNo.trim(),
          },
        },
      });

      if (!student) {
        return NextResponse.json(
          { error: "No student record found matching this Registration ID and Application Number." },
          { status: 401 }
        );
      }

      const token = signToken({
        type: "STUDENT",
        id: student.id,
        identifier: student.registrationId,
        name: student.name,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          role: "student",
          id: student.id,
          registrationId: student.registrationId,
          applicationNo: student.applicationNo,
          name: student.name,
          department: student.department,
          program: student.program,
          year: student.year,
        },
      });

      response.cookies.set("iqac_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    // 3. Faculty Login
    if (role === "faculty") {
      if (!facultyId) {
        return NextResponse.json({ error: "Faculty ID or Email is required" }, { status: 400 });
      }

      const faculty = await prisma.faculty.findFirst({
        where: {
          facultyId: {
            equals: facultyId.trim(),
          },
        },
      });

      if (!faculty) {
        return NextResponse.json(
          { error: "No faculty record found matching this Faculty ID." },
          { status: 401 }
        );
      }

      const token = signToken({
        type: "FACULTY",
        id: faculty.id,
        identifier: faculty.facultyId,
        name: faculty.name,
      });

      const response = NextResponse.json({
        success: true,
        user: {
          role: "faculty",
          id: faculty.id,
          facultyId: faculty.facultyId,
          name: faculty.name,
          designation: faculty.designation,
          department: faculty.department,
        },
      });

      response.cookies.set("iqac_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });

      return response;
    }

    return NextResponse.json({ error: "Invalid role specified" }, { status: 400 });
  } catch (err: unknown) {
    console.error("Login API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
