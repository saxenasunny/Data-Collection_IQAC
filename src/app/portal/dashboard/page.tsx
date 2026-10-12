"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  GraduationCap,
  Users,
  LogOut,
  Building2,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit3,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Save,
} from "lucide-react";

interface UserProfile {
  type: "STUDENT" | "FACULTY";
  id: string;
  name: string;
  department: string;
  // Student specific
  registrationId?: string;
  applicationNo?: string;
  program?: string;
  year?: string;
  // Faculty specific
  facultyId?: string;
  designation?: string;
  // Cumulative Baseline
  baselineData: Record<string, unknown>;
}

interface FormFieldItem {
  id: string;
  label: string;
  fieldName: string;
  fieldType: string;
  placeholder?: string;
  helperText?: string;
  isRequired: boolean;
  options?: string[];
  fieldOrder: number;
}

interface SessionItem {
  id: string;
  title: string;
  description?: string;
  targetAudience: string;
  isOpen: boolean;
  deadline?: string;
  fields: FormFieldItem[];
  submission: {
    id: string;
    submittedAt: string;
    updatedAt: string;
    values: Record<string, unknown>;
  } | null;
  canEdit: boolean;
}

export default function PortalDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSession, setActiveSession] = useState<SessionItem | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showBaselineHistory, setShowBaselineHistory] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resProfile, resSessions] = await Promise.all([
        fetch("/api/portal/profile"),
        fetch("/api/portal/sessions"),
      ]);

      if (resProfile.status === 401 || resSessions.status === 401) {
        router.push("/portal/login");
        return;
      }

      const pData = await resProfile.json();
      const sData = await resSessions.json();

      if (pData.type) {
        setProfile(pData);
      }
      if (sData.sessions) {
        setSessions(sData.sessions);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = (session: SessionItem) => {
    setActiveSession(session);
    setSubmitSuccess(null);
    setSubmitError(null);

    // Pre-populate formData from previous submission or default empty
    if (session.submission?.values) {
      setFormData({ ...session.submission.values });
    } else {
      const initial: Record<string, unknown> = {};
      session.fields.forEach((f) => {
        initial[f.fieldName] = "";
      });
      setFormData(initial);
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const res = await fetch("/api/portal/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: activeSession.id,
          responseValues: formData,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit form");
      }

      setSubmitSuccess(
        "Response successfully saved! Your answers have also been merged into your permanent baseline profile."
      );

      // Refresh data to show updated baseline & submission timestamp
      await fetchData();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError("Failed to submit form.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/portal/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-600">Loading your institutional profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const isStudent = profile.type === "STUDENT";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar */}
      <nav className="glass-panel sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-600/30">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 tracking-tight">
                IQAC <span className="text-indigo-600">Portal</span>
              </span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                {isStudent ? "Student Workspace" : "Faculty Workspace"}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-xs sm:text-sm font-medium text-slate-700 hidden sm:inline-block">
              {profile.name}
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-1.5 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Verified Profile Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-8 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-0 pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-indigo-700 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-indigo-500/20">
                  {profile.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {profile.name}
                    </h1>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Verified Record
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    {profile.department}
                  </p>
                </div>
              </div>

              {/* Institution identifiers */}
              <div className="flex flex-wrap sm:flex-nowrap gap-3 text-xs">
                {isStudent ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Reg ID
                      </span>
                      <span className="font-bold text-slate-800">{profile.registrationId}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Application No
                      </span>
                      <span className="font-bold text-slate-800">{profile.applicationNo}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Program & Year
                      </span>
                      <span className="font-bold text-slate-800">
                        {profile.program} • {profile.year}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Faculty ID
                      </span>
                      <span className="font-bold text-slate-800">{profile.facultyId}</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Designation
                      </span>
                      <span className="font-bold text-slate-800">{profile.designation}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Accordion for Permanent Baseline Profile Data */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowBaselineHistory(!showBaselineHistory)}
                className="flex items-center justify-between w-full py-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>
                    Permanent Baseline Data History ({Object.keys(profile.baselineData || {}).length} fields accumulated)
                  </span>
                </div>
                {showBaselineHistory ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showBaselineHistory && (
                <div className="mt-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                  <p className="text-slate-500 mb-3 text-[11px]">
                    All data submitted across previous collection rounds is automatically preserved here
                    and merged into your baseline institutional dossier.
                  </p>
                  {Object.keys(profile.baselineData || {}).length === 0 ? (
                    <p className="text-slate-400 italic">No additional custom fields saved yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(profile.baselineData).map(([key, val]) => (
                        <div key={key} className="bg-white p-2.5 rounded-lg border border-slate-200/70">
                          <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                            {key.replace(/_/g, " ")}
                          </span>
                          <span className="font-medium text-slate-800 break-words">
                            {typeof val === "object" ? JSON.stringify(val) : String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Collection Sessions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Assigned Data Collection Sessions</h2>
              <p className="text-xs text-slate-500">
                Forms created by the administration for accreditation data gathering.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500 bg-slate-200/70 px-2.5 py-1 rounded-full">
              {sessions.length} Available
            </span>
          </div>

          {sessions.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500">
              <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="font-medium">No active data collection sessions right now.</p>
              <p className="text-xs text-slate-400 mt-1">Check back when the administration announces a new cycle.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sessions.map((sess) => {
                const hasSubmitted = Boolean(sess.submission);
                const isOpen = sess.isOpen;

                return (
                  <div
                    key={sess.id}
                    className={`bg-white rounded-2xl border p-6 flex flex-col justify-between transition shadow-sm ${
                      activeSession?.id === sess.id
                        ? "border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      {/* Status Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        {isOpen ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            Session Open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                            <Lock className="w-3 h-3 text-rose-600" />
                            Session Closed by Admin
                          </span>
                        )}

                        {hasSubmitted ? (
                          <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                            Submitted ✓
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                            Pending Submission
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {sess.title}
                      </h3>
                      {sess.description && (
                        <p className="mt-1.5 text-xs text-slate-500 line-clamp-2">
                          {sess.description}
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {sess.fields.length} Required Fields
                        </span>
                        {hasSubmitted && (
                          <span className="text-slate-400">
                            Last updated: {new Date(sess.submission!.updatedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                      {isOpen ? (
                        <div className="text-[11px] text-slate-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Editable till session closed</span>
                        </div>
                      ) : (
                        <div className="text-[11px] text-rose-500 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>Submissions locked</span>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenForm(sess)}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl transition inline-flex items-center gap-1.5 shadow-sm ${
                          isOpen
                            ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        {isOpen ? (
                          hasSubmitted ? (
                            <>
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit Response</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-3.5 h-3.5" />
                              <span>Fill Form</span>
                            </>
                          )
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Submitted Form</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dynamic Form Completion Modal / Drawer */}
        {activeSession && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                      {isStudent ? "Student Form" : "Faculty Form"}
                    </span>
                    {activeSession.isOpen ? (
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Open for Edits
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                        Locked / Session Closed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{activeSession.title}</h3>
                  {activeSession.description && (
                    <p className="text-xs text-slate-500 mt-1">{activeSession.description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSession(null)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Form Body */}
              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                {submitSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span>{submitSuccess}</span>
                  </div>
                )}

                {submitError && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {!activeSession.isOpen && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>
                      This session has been officially closed by admin. These responses are locked and
                      cannot be altered.
                    </span>
                  </div>
                )}

                <form id="dynamic-survey-form" onSubmit={handleSubmitForm} className="space-y-5">
                  {activeSession.fields.map((field) => {
                    const value = formData[field.fieldName] ?? "";
                    const disabled = !activeSession.isOpen;

                    return (
                      <div key={field.id} className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700">
                          {field.label}{" "}
                          {field.isRequired && <span className="text-rose-500 font-bold">*</span>}
                        </label>

                        {field.helperText && (
                          <p className="text-[11px] text-slate-500">{field.helperText}</p>
                        )}

                        {/* Text / Number / Email / URL / Date input */}
                        {["text", "number", "email", "url", "date"].includes(field.fieldType) && (
                          <input
                            type={field.fieldType}
                            required={field.isRequired}
                            disabled={disabled}
                            placeholder={field.placeholder || ""}
                            value={String(value)}
                            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition shadow-sm"
                          />
                        )}

                        {/* Textarea */}
                        {field.fieldType === "textarea" && (
                          <textarea
                            rows={3}
                            required={field.isRequired}
                            disabled={disabled}
                            placeholder={field.placeholder || ""}
                            value={String(value)}
                            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition shadow-sm resize-y"
                          />
                        )}

                        {/* Select Dropdown */}
                        {field.fieldType === "select" && (
                          <select
                            required={field.isRequired}
                            disabled={disabled}
                            value={String(value)}
                            onChange={(e) => handleFieldChange(field.fieldName, e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-slate-100 disabled:text-slate-500 transition shadow-sm"
                          >
                            <option value="">-- Select an option --</option>
                            {(field.options || []).map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        )}

                        {/* Radio options */}
                        {field.fieldType === "radio" && (
                          <div className="space-y-2 pt-1">
                            {(field.options || []).map((opt) => (
                              <label key={opt} className="flex items-center space-x-2 text-xs font-medium text-slate-700 cursor-pointer">
                                <input
                                  type="radio"
                                  name={field.fieldName}
                                  value={opt}
                                  disabled={disabled}
                                  checked={value === opt}
                                  onChange={() => handleFieldChange(field.fieldName, opt)}
                                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>{opt}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveSession(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition"
                >
                  Close
                </button>

                {activeSession.isOpen && (
                  <button
                    form="dynamic-survey-form"
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-md shadow-indigo-600/30"
                  >
                    <Save className="w-4 h-4" />
                    <span>{submitting ? "Submitting..." : "Save & Update Response"}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
