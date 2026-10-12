import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.type !== "STUDENT" && user.type !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sessionId, responseValues } = body;

    if (!sessionId || !responseValues) {
      return NextResponse.json(
        { error: "Session ID and response values are required" },
        { status: 400 }
      );
    }

    // 1. Fetch Session and check if Open
    const session = await prisma.collectionSession.findUnique({
      where: { id: sessionId },
      include: { fields: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Collection session not found" }, { status: 404 });
    }

    // Requirement 1: User can edit till admin closes the session
    if (!session.isOpen) {
      return NextResponse.json(
        {
          error:
            "This data collection session has been closed by the administration. Further submissions or modifications are locked.",
          sessionClosed: true,
        },
        { status: 403 }
      );
    }

    // Validate required fields
    for (const field of session.fields) {
      if (field.isRequired) {
        const val = responseValues[field.fieldName];
        if (val === undefined || val === null || val === "" || (Array.isArray(val) && val.length === 0)) {
          return NextResponse.json(
            { error: `Field "${field.label}" is required.` },
            { status: 400 }
          );
        }
      }
    }

    let submissionRecord;

    // 2. Upsert submission for Student or Faculty
    if (user.type === "STUDENT") {
      const existingSub = await prisma.submission.findFirst({
        where: {
          sessionId,
          responderType: "STUDENT",
          studentId: user.id,
        },
      });

      if (existingSub) {
        submissionRecord = await prisma.submission.update({
          where: { id: existingSub.id },
          data: {
            responseValues: JSON.stringify(responseValues),
            updatedAt: new Date(),
          },
        });
      } else {
        submissionRecord = await prisma.submission.create({
          data: {
            sessionId,
            responderType: "STUDENT",
            studentId: user.id,
            responseValues: JSON.stringify(responseValues),
          },
        });
      }

      // Requirement 2: Merge into permanent baseline data so nothing is lost in future rounds!
      const student = await prisma.student.findUnique({ where: { id: user.id } });
      if (student) {
        let currentBaseline: Record<string, unknown> = {};
        try {
          currentBaseline = JSON.parse(student.baselineData || "{}");
        } catch {
          currentBaseline = {};
        }

        const mergedBaseline = {
          ...currentBaseline,
          ...responseValues,
        };

        await prisma.student.update({
          where: { id: user.id },
          data: {
            baselineData: JSON.stringify(mergedBaseline),
          },
        });
      }
    } else {
      // FACULTY
      const existingSub = await prisma.submission.findFirst({
        where: {
          sessionId,
          responderType: "FACULTY",
          facultyId: user.id,
        },
      });

      if (existingSub) {
        submissionRecord = await prisma.submission.update({
          where: { id: existingSub.id },
          data: {
            responseValues: JSON.stringify(responseValues),
            updatedAt: new Date(),
          },
        });
      } else {
        submissionRecord = await prisma.submission.create({
          data: {
            sessionId,
            responderType: "FACULTY",
            facultyId: user.id,
            responseValues: JSON.stringify(responseValues),
          },
        });
      }

      // Merge into Faculty baseline data
      const faculty = await prisma.faculty.findUnique({ where: { id: user.id } });
      if (faculty) {
        let currentBaseline: Record<string, unknown> = {};
        try {
          currentBaseline = JSON.parse(faculty.baselineData || "{}");
        } catch {
          currentBaseline = {};
        }

        const mergedBaseline = {
          ...currentBaseline,
          ...responseValues,
        };

        await prisma.faculty.update({
          where: { id: user.id },
          data: {
            baselineData: JSON.stringify(mergedBaseline),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Data submitted and saved to your baseline profile successfully!",
      submission: submissionRecord,
    });
  } catch (err: unknown) {
    console.error("Portal submit error:", err);
    return NextResponse.json({ error: "Failed to submit responses" }, { status: 500 });
  }
}
