import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || (user.type !== "STUDENT" && user.type !== "FACULTY")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Determine target filter
    const audienceFilter = [user.type, "ALL"];

    const sessions = await prisma.collectionSession.findMany({
      where: {
        targetAudience: { in: audienceFilter },
      },
      include: {
        fields: {
          orderBy: { fieldOrder: "asc" },
        },
        submissions: {
          where:
            user.type === "STUDENT"
              ? { studentId: user.id }
              : { facultyId: user.id },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedSessions = sessions.map((s) => {
      const userSubmission = s.submissions[0] || null;
      let parsedValues: Record<string, unknown> = {};
      if (userSubmission) {
        try {
          parsedValues = JSON.parse(userSubmission.responseValues || "{}");
        } catch {
          parsedValues = {};
        }
      }

      return {
        id: s.id,
        title: s.title,
        description: s.description,
        targetAudience: s.targetAudience,
        isOpen: s.isOpen,
        deadline: s.deadline,
        fields: s.fields.map((f) => {
          let parsedOptions: string[] = [];
          if (f.options) {
            try {
              parsedOptions = JSON.parse(f.options);
            } catch {
              parsedOptions = f.options.split(",").map((x) => x.trim());
            }
          }
          return {
            id: f.id,
            label: f.label,
            fieldName: f.fieldName,
            fieldType: f.fieldType,
            placeholder: f.placeholder,
            helperText: f.helperText,
            isRequired: f.isRequired,
            options: parsedOptions,
            fieldOrder: f.fieldOrder,
          };
        }),
        submission: userSubmission
          ? {
              id: userSubmission.id,
              submittedAt: userSubmission.submittedAt,
              updatedAt: userSubmission.updatedAt,
              values: parsedValues,
            }
          : null,
        canEdit: s.isOpen, // Can edit anytime until admin closes the session!
      };
    });

    return NextResponse.json({ sessions: formattedSessions });
  } catch (err: unknown) {
    console.error("Portal sessions error:", err);
    return NextResponse.json({ error: "Failed to fetch collection sessions" }, { status: 500 });
  }
}
