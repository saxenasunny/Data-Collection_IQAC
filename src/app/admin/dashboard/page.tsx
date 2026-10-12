"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Upload,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  Eye,
  LogOut,
  RefreshCw,
  Search,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from "lucide-react";

interface AdminSession {
  id: string;
  title: string;
  description: string | null;
  targetAudience: string;
  targetDepartments: string | null;
  isOpen: boolean;
  deadline: string | null;
  createdAt: string;
  fields: {
    id: string;
    label: string;
    fieldName: string;
    fieldType: string;
    placeholder: string | null;
    helperText: string | null;
    isRequired: boolean;
    options: string | null;
    fieldOrder: number;
  }[];
  _count: {
    submissions: number;
  };
}

interface StudentRecord {
  id: string;
  registrationId: string;
  applicationNo: string;
  name: string;
  department: string;
  program: string;
  year: string;
  baselineData: string;
}

interface FacultyRecord {
  id: string;
  facultyId: string;
  name: string;
  designation: string;
  department: string;
  baselineData: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [currentTab, setCurrentTab] = useState<"sessions" | "students" | "faculties" | "export">("sessions");
  const [loading, setLoading] = useState(true);

  // Stats & Sessions
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [faculties, setFaculties] = useState<FacultyRecord[]>([]);
  const [studentTotal, setStudentTotal] = useState(0);
  const [facultyTotal, setFacultyTotal] = useState(0);

  // Search queries
  const [studentSearch, setStudentSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");

  // Create Session Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAudience, setNewAudience] = useState<"ALL" | "STUDENT" | "FACULTY">("STUDENT");
  const [newFields, setNewFields] = useState<
    Array<{
      label: string;
      fieldType: string;
      isRequired: boolean;
      placeholder: string;
      options: string;
    }>
  >([
    {
      label: "Contact Number",
      fieldType: "number",
      isRequired: true,
      placeholder: "10-digit mobile number",
      options: "",
    },
  ]);

  // Add field to existing session modal state
  const [selectedSessionForField, setSelectedSessionForField] = useState<AdminSession | null>(null);
  const [addCustomLabel, setAddCustomLabel] = useState("");
  const [addCustomType, setAddCustomType] = useState("text");
  const [addCustomRequired, setAddCustomRequired] = useState(false);
  const [addCustomPlaceholder, setAddCustomPlaceholder] = useState("");
  const [addCustomOptions, setAddCustomOptions] = useState("");

  // Upload state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const studentFileRef = useRef<HTMLInputElement>(null);
  const facultyFileRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSessions, resStudents, resFaculties] = await Promise.all([
        fetch("/api/admin/sessions"),
        fetch(`/api/admin/students?search=${encodeURIComponent(studentSearch)}&limit=100`),
        fetch(`/api/admin/faculties?search=${encodeURIComponent(facultySearch)}&limit=100`),
      ]);

      if (resSessions.status === 401) {
        router.push("/admin/login");
        return;
      }

      const sData = await resSessions.json();
      const stData = await resStudents.json();
      const fData = await resFaculties.json();

      if (sData.sessions) setSessions(sData.sessions);
      if (stData.students) {
        setStudents(stData.students);
        setStudentTotal(stData.total);
      }
      if (fData.faculties) {
        setFaculties(fData.faculties);
        setFacultyTotal(fData.total);
      }
    } catch (err) {
      console.error("Admin dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [studentSearch, facultySearch]);

  // Toggle Session Open/Closed status
  const handleToggleSessionStatus = async (sessionId: string, currentOpen: boolean) => {
    try {
      const res = await fetch("/api/admin/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: sessionId, isOpen: !currentOpen }),
      });

      if (!res.ok) throw new Error("Failed to update session status");

      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, isOpen: !currentOpen } : s))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to toggle session status");
    }
  };

  // Add field to new session draft
  const handleAddDraftField = () => {
    setNewFields((prev) => [
      ...prev,
      { label: "", fieldType: "text", isRequired: false, placeholder: "", options: "" },
    ]);
  };

  const handleRemoveDraftField = (index: number) => {
    setNewFields((prev) => prev.filter((_, i) => i !== index));
  };

  // Create new session
  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const payload = {
        title: newTitle.trim(),
        description: newDesc.trim() || null,
        targetAudience: newAudience,
        isOpen: true,
        fields: newFields
          .filter((f) => f.label.trim())
          .map((f, i) => ({
            label: f.label.trim(),
            fieldType: f.fieldType,
            isRequired: f.isRequired,
            placeholder: f.placeholder.trim() || null,
            options: f.options
              ? f.options.split(",").map((s) => s.trim()).filter(Boolean)
              : null,
            fieldOrder: i + 1,
          })),
      };

      const res = await fetch("/api/admin/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create session");

      setShowCreateModal(false);
      setNewTitle("");
      setNewDesc("");
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  // Add field to an existing session
  const handleAddCustomFieldToExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionForField || !addCustomLabel.trim()) return;

    try {
      const res = await fetch(`/api/admin/sessions/${selectedSessionForField.id}/fields`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: addCustomLabel.trim(),
          fieldType: addCustomType,
          isRequired: addCustomRequired,
          placeholder: addCustomPlaceholder.trim() || null,
          options: addCustomOptions
            ? addCustomOptions.split(",").map((s) => s.trim()).filter(Boolean)
            : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add field");

      setSelectedSessionForField(null);
      setAddCustomLabel("");
      setAddCustomPlaceholder("");
      setAddCustomOptions("");
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  // Bulk Upload File Handler
  const handleBulkUpload = async (type: "students" | "faculties", file: File) => {
    setUploadLoading(true);
    setUploadMessage(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/admin/${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Bulk upload failed");
      }

      setUploadMessage(data.message);
      fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setUploadError(err.message);
      } else {
        setUploadError("Bulk upload failed");
      }
    } finally {
      setUploadLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight">
                IQAC <span className="text-indigo-400">Admin Command</span>
              </span>
              <p className="text-[10px] text-slate-400 font-medium -mt-1 hidden sm:block">
                Institutional Data Collection & NAAC/NIRF Reporting
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="/api/admin/export"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Master IQAC Excel</span>
            </a>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white bg-slate-800 hover:bg-rose-900/60 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* KPI Metrics Ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Student Strength</span>
              <p className="text-2xl font-extrabold text-slate-900">{studentTotal}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Faculty Strength</span>
              <p className="text-2xl font-extrabold text-slate-900">{facultyTotal}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Collection Rounds</span>
              <p className="text-2xl font-extrabold text-slate-900">{sessions.length}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500">Total Submissions</span>
              <p className="text-2xl font-extrabold text-slate-900">
                {sessions.reduce((acc, s) => acc + s._count.submissions, 0)}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl">
          <button
            onClick={() => setCurrentTab("sessions")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              currentTab === "sessions"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Collection Rounds & Form Builder</span>
          </button>
          <button
            onClick={() => setCurrentTab("students")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              currentTab === "students"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Student Roster & Upload</span>
          </button>
          <button
            onClick={() => setCurrentTab("faculties")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              currentTab === "faculties"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Faculty Roster & Upload</span>
          </button>
          <button
            onClick={() => setCurrentTab("export")}
            className={`py-3.5 px-4 text-xs sm:text-sm font-bold border-b-2 flex items-center gap-2 transition ${
              currentTab === "export"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Consolidated IQAC Reports</span>
          </button>
        </div>

        {/* TAB 1: SESSIONS & DYNAMIC FORM BUILDER */}
        {currentTab === "sessions" && (
          <div className="bg-white rounded-b-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Active & Historical Collection Sessions</h3>
                <p className="text-xs text-slate-500">
                  Control session status (Open/Close). Students and faculties can submit and edit until closed.
                  New fields added will seamlessly append to their baseline data.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold transition shadow-md shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Data Collection Session</span>
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-5 rounded-2xl border border-slate-200/90 hover:border-slate-300 transition bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
                        Target: {sess.targetAudience}
                      </span>
                      {sess.isOpen ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Unlock className="w-3 h-3 text-emerald-600" />
                          <span>Session Open (Editable)</span>
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Lock className="w-3 h-3 text-rose-600" />
                          <span>Session Closed (Locked)</span>
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
                        {sess._count.submissions} Submissions
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{sess.title}</h4>
                    {sess.description && (
                      <p className="text-xs text-slate-500">{sess.description}</p>
                    )}

                    {/* Field chips */}
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {sess.fields.map((f) => (
                        <span
                          key={f.id}
                          className="text-[11px] font-medium bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded"
                        >
                          {f.label} ({f.fieldType})
                          {f.isRequired && <span className="text-rose-500 font-bold ml-0.5">*</span>}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions & Session Open/Close Toggle */}
                  <div className="flex items-center space-x-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleToggleSessionStatus(sess.id, sess.isOpen)}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                        sess.isOpen
                          ? "bg-rose-100 hover:bg-rose-200 text-rose-800"
                          : "bg-emerald-100 hover:bg-emerald-200 text-emerald-800"
                      }`}
                      title={
                        sess.isOpen
                          ? "Click to Close Session (Lock edits for students/faculties)"
                          : "Click to Open Session (Allow edits)"
                      }
                    >
                      {sess.isOpen ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Close Session</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>Open Session</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedSessionForField(sess)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Add Fields</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS ROSTER & UPLOAD */}
        {currentTab === "students" && (
          <div className="bg-white rounded-b-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Student Baseline Roster</h3>
                <p className="text-xs text-slate-500">
                  Upload Registration ID, Application Number, Name, Department, Program, Year.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/admin/export?template=student"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </a>

                <input
                  type="file"
                  ref={studentFileRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBulkUpload("students", e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={uploadLoading}
                  onClick={() => studentFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadLoading ? "Uploading..." : "Bulk Upload Students (.xlsx/.csv)"}</span>
                </button>
              </div>
            </div>

            {uploadMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Search filter */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Registration ID or Name..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Registration ID</th>
                    <th className="py-3 px-4">Application No</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Program</th>
                    <th className="py-3 px-4">Year</th>
                    <th className="py-3 px-4">Cumulative Baseline Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {students.map((st) => {
                    let baselineCount = 0;
                    try {
                      baselineCount = Object.keys(JSON.parse(st.baselineData || "{}")).length;
                    } catch {
                      baselineCount = 0;
                    }

                    return (
                      <tr key={st.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">
                          {st.registrationId}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{st.applicationNo}</td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{st.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{st.department}</td>
                        <td className="py-2.5 px-4 text-slate-600">{st.program}</td>
                        <td className="py-2.5 px-4 text-slate-600">{st.year}</td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>{baselineCount} fields saved</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: FACULTY ROSTER & UPLOAD */}
        {currentTab === "faculties" && (
          <div className="bg-white rounded-b-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Faculty Baseline Roster</h3>
                <p className="text-xs text-slate-500">
                  Upload Faculty ID, Name, Designation, Department.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="/api/admin/export?template=faculty"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl border border-indigo-200 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Sample Template</span>
                </a>

                <input
                  type="file"
                  ref={facultyFileRef}
                  accept=".xlsx, .xls, .csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBulkUpload("faculties", e.target.files[0]);
                    }
                  }}
                />

                <button
                  type="button"
                  disabled={uploadLoading}
                  onClick={() => facultyFileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadLoading ? "Uploading..." : "Bulk Upload Faculty (.xlsx/.csv)"}</span>
                </button>
              </div>
            </div>

            {uploadMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{uploadMessage}</span>
              </div>
            )}

            {uploadError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Search filter */}
            <div className="relative max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by Faculty ID or Name..."
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Faculty Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Faculty ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Cumulative Baseline Fields</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {faculties.map((fc) => {
                    let baselineCount = 0;
                    try {
                      baselineCount = Object.keys(JSON.parse(fc.baselineData || "{}")).length;
                    } catch {
                      baselineCount = 0;
                    }

                    return (
                      <tr key={fc.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-mono font-bold text-indigo-600">
                          {fc.facultyId}
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-800">{fc.name}</td>
                        <td className="py-2.5 px-4 text-slate-600">{fc.designation}</td>
                        <td className="py-2.5 px-4 text-slate-600">{fc.department}</td>
                        <td className="py-2.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span>{baselineCount} fields saved</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: CONSOLIDATED IQAC REPORTS & EXPORT */}
        {currentTab === "export" && (
          <div className="bg-white rounded-b-2xl p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="max-w-3xl">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                Accreditation Data Pipeline
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
                Consolidated IQAC Master Intelligence Workbook
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">
                Export a unified multi-sheet Excel spreadsheet containing all institutional records.
                The generator combines initial baseline data (Name, Reg ID, Program, Designation)
                with all cumulative historical answers and dynamically filled survey responses.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                  <h4 className="font-bold text-slate-900 text-base">
                    Ready for NAAC Criteria, NIRF & NBA Audits
                  </h4>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Sheet 1: Student Master IQAC (Baseline + All Historical & Active Responses)</li>
                  <li>Sheet 2: Faculty Master IQAC (Baseline + Research, Publications & Patents)</li>
                  <li>Formatted column headers with exact survey timestamps</li>
                </ul>
              </div>

              <a
                href="/api/admin/export"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform active:scale-95 text-center flex-shrink-0"
              >
                <Download className="w-5 h-5" />
                <span>Download Consolidated Excel (.xlsx)</span>
              </a>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE NEW COLLECTION SESSION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Create New Collection Session</h3>
                <p className="text-xs text-slate-500">
                  Configure custom fields required from students or faculty.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IQAC Annual Academic & Research Audit 2026-27"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide instructions for responders..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Target Audience *
                </label>
                <select
                  value={newAudience}
                  onChange={(e) => setNewAudience(e.target.value as "ALL" | "STUDENT" | "FACULTY")}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="STUDENT">Students Only</option>
                  <option value="FACULTY">Faculty Only</option>
                  <option value="ALL">Both Students & Faculty</option>
                </select>
              </div>

              {/* Dynamic Field Builder inside modal */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Dynamic Form Fields
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddDraftField}
                    className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Field</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {newFields.map((field, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5 relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Field #{idx + 1}</span>
                        {newFields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDraftField(idx)}
                            className="text-rose-500 hover:text-rose-700 text-xs font-bold"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Field Label (e.g. Current CGPA)"
                          value={field.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, label: val } : f))
                            );
                          }}
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />

                        <select
                          value={field.fieldType}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, fieldType: val } : f))
                            );
                          }}
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="text">Short Text</option>
                          <option value="number">Number</option>
                          <option value="email">Email</option>
                          <option value="url">Website / Portfolio URL</option>
                          <option value="date">Date</option>
                          <option value="textarea">Long Text / Textarea</option>
                          <option value="select">Dropdown Select</option>
                          <option value="radio">Radio Buttons</option>
                        </select>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Placeholder text (optional)"
                          value={field.placeholder}
                          onChange={(e) => {
                            const val = e.target.value;
                            setNewFields((prev) =>
                              prev.map((f, i) => (i === idx ? { ...f, placeholder: val } : f))
                            );
                          }}
                          className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />

                        {["select", "radio"].includes(field.fieldType) ? (
                          <input
                            type="text"
                            placeholder="Options comma-separated (e.g. Day Scholar, Hosteler)"
                            value={field.options}
                            onChange={(e) => {
                              const val = e.target.value;
                              setNewFields((prev) =>
                                prev.map((f, i) => (i === idx ? { ...f, options: val } : f))
                              );
                            }}
                            className="px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                          />
                        ) : (
                          <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={field.isRequired}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setNewFields((prev) =>
                                  prev.map((f, i) => (i === idx ? { ...f, isRequired: checked } : f))
                                );
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span>Required Field</span>
                          </label>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Publish Collection Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FIELD TO EXISTING SESSION */}
      {selectedSessionForField && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Field to &quot;{selectedSessionForField.title}&quot;
                </h3>
                <p className="text-xs text-slate-500">
                  Existing submitted data is preserved and will seamlessly merge with this new field.
                </p>
              </div>
              <button
                onClick={() => setSelectedSessionForField(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomFieldToExisting} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Field Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Internship Organization"
                  value={addCustomLabel}
                  onChange={(e) => setAddCustomLabel(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Field Type
                  </label>
                  <select
                    value={addCustomType}
                    onChange={(e) => setAddCustomType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="text">Short Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="url">URL</option>
                    <option value="date">Date</option>
                    <option value="textarea">Textarea</option>
                    <option value="select">Select Dropdown</option>
                    <option value="radio">Radio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Placeholder (optional)
                  </label>
                  <input
                    type="text"
                    value={addCustomPlaceholder}
                    onChange={(e) => setAddCustomPlaceholder(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {["select", "radio"].includes(addCustomType) && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Options (comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Option 1, Option 2, Option 3"
                    value={addCustomOptions}
                    onChange={(e) => setAddCustomOptions(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={addCustomRequired}
                  onChange={(e) => setAddCustomRequired(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <span>Required Field</span>
              </label>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedSessionForField(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md transition"
                >
                  Add Field Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
