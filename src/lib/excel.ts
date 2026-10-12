import * as XLSX from "xlsx";

export interface ParsedStudentRow {
  registrationId: string;
  applicationNo: string;
  name: string;
  department: string;
  program: string;
  year: string;
}

export interface ParsedFacultyRow {
  facultyId: string;
  name: string;
  designation: string;
  department: string;
}

// Normalize key names: lowercase and strip spaces/underscores/special characters
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function parseStudentsExcel(buffer: Buffer): { rows: ParsedStudentRow[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const rows: ParsedStudentRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2; // considering header is row 1
    const normalizedRow: Record<string, string> = {};

    for (const [key, val] of Object.entries(row)) {
      normalizedRow[normalizeKey(key)] = String(val).trim();
    }

    const regId =
      normalizedRow["registrationid"] ||
      normalizedRow["regid"] ||
      normalizedRow["registrationno"] ||
      normalizedRow["regno"] ||
      normalizedRow["id"];

    const appNo =
      normalizedRow["applicationnumber"] ||
      normalizedRow["applicationno"] ||
      normalizedRow["appno"] ||
      normalizedRow["application"];

    const name = normalizedRow["name"] || normalizedRow["studentname"] || normalizedRow["fullname"];
    const dept = normalizedRow["department"] || normalizedRow["dept"] || normalizedRow["branch"];
    const prog = normalizedRow["program"] || normalizedRow["programme"] || normalizedRow["course"];
    const year = normalizedRow["year"] || normalizedRow["batch"] || normalizedRow["academicyear"];

    if (!regId || !name) {
      errors.push(`Row ${rowNum}: Registration ID and Name are required.`);
      return;
    }

    rows.push({
      registrationId: regId,
      applicationNo: appNo || regId,
      name,
      department: dept || "General",
      program: prog || "General",
      year: year || "Current",
    });
  });

  return { rows, errors };
}

export function parseFacultiesExcel(buffer: Buffer): { rows: ParsedFacultyRow[]; errors: string[] } {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

  const rows: ParsedFacultyRow[] = [];
  const errors: string[] = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;
    const normalizedRow: Record<string, string> = {};

    for (const [key, val] of Object.entries(row)) {
      normalizedRow[normalizeKey(key)] = String(val).trim();
    }

    const name = normalizedRow["name"] || normalizedRow["facultyname"] || normalizedRow["fullname"];
    const designation =
      normalizedRow["designation"] ||
      normalizedRow["post"] ||
      normalizedRow["title"] ||
      normalizedRow["role"];
    const dept = normalizedRow["department"] || normalizedRow["dept"] || normalizedRow["branch"];
    const facultyId =
      normalizedRow["facultyid"] ||
      normalizedRow["facid"] ||
      normalizedRow["email"] ||
      normalizedRow["id"] ||
      (name && dept ? `FAC-${normalizeKey(dept).slice(0, 4).toUpperCase()}-${index + 101}` : "");

    if (!name || !designation) {
      errors.push(`Row ${rowNum}: Faculty Name and Designation are required.`);
      return;
    }

    rows.push({
      facultyId: facultyId || `FAC-${index + 1001}`,
      name,
      designation,
      department: dept || "General",
    });
  });

  return { rows, errors };
}

export function generateStudentTemplate(): Buffer {
  const data = [
    {
      "Registration ID": "2024BCSE001",
      "Application Number": "APP-2024-1001",
      "Name": "Aarav Sharma",
      "Department": "Computer Science & Engineering",
      "Program": "B.Tech CSE",
      "Year": "1st Year",
    },
    {
      "Registration ID": "2024BCSE002",
      "Application Number": "APP-2024-1002",
      "Name": "Diya Patel",
      "Department": "Computer Science & Engineering",
      "Program": "B.Tech CSE",
      "Year": "1st Year",
    },
    {
      "Registration ID": "2023BECE015",
      "Application Number": "APP-2023-2415",
      "Name": "Rohan Verma",
      "Department": "Electronics & Communication",
      "Program": "B.Tech ECE",
      "Year": "2nd Year",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Students_Template");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function generateFacultyTemplate(): Buffer {
  const data = [
    {
      "Faculty ID": "FAC-CSE-101",
      "Name": "Dr. Ramesh Chandra",
      "Designation": "Professor & HOD",
      "Department": "Computer Science & Engineering",
    },
    {
      "Faculty ID": "FAC-ECE-204",
      "Name": "Dr. Sunita Rao",
      "Designation": "Associate Professor",
      "Department": "Electronics & Communication",
    },
    {
      "Faculty ID": "FAC-MECH-308",
      "Name": "Prof. Rajesh Kumar",
      "Designation": "Assistant Professor",
      "Department": "Mechanical Engineering",
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty_Template");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

export function generateMasterExportExcel(
  studentsData: Record<string, unknown>[],
  facultiesData: Record<string, unknown>[]
): Buffer {
  const workbook = XLSX.utils.book_new();

  if (studentsData.length > 0) {
    const wsStudents = XLSX.utils.json_to_sheet(studentsData);
    XLSX.utils.book_append_sheet(workbook, wsStudents, "Student_Master_IQAC");
  } else {
    const emptyWs = XLSX.utils.json_to_sheet([{ Message: "No student records available yet" }]);
    XLSX.utils.book_append_sheet(workbook, emptyWs, "Student_Master_IQAC");
  }

  if (facultiesData.length > 0) {
    const wsFaculties = XLSX.utils.json_to_sheet(facultiesData);
    XLSX.utils.book_append_sheet(workbook, wsFaculties, "Faculty_Master_IQAC");
  } else {
    const emptyWs = XLSX.utils.json_to_sheet([{ Message: "No faculty records available yet" }]);
    XLSX.utils.book_append_sheet(workbook, emptyWs, "Faculty_Master_IQAC");
  }

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
