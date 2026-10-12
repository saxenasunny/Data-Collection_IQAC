import Link from "next/link";
import {
  GraduationCap,
  Users,
  ShieldCheck,
  FileSpreadsheet,
  Layers,
  Clock,
  ArrowRight,
  Database,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
                IQAC <span className="text-indigo-600 font-extrabold">DataHub</span>
              </span>
              <p className="text-[11px] text-slate-500 font-medium -mt-1 hidden sm:block">
                Internal Quality Assurance Cell
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              href="/portal/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 px-3 py-2 transition"
            >
              Student / Faculty Login
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-sm shadow-indigo-600/30 transition transform active:scale-95"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Console</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45rem_50rem_at_top,theme(colors.indigo.100),white)] opacity-60" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 mb-6 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
              <span>Next-Gen Institutional Quality & Accreditation System</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
              Centralized Data Collection for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600">
                Students & Faculty
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Streamlined institutional reporting for NAAC, NIRF, and NBA. Bulk upload rosters,
              craft custom dynamic surveys, empower students and faculty to submit and edit, and export
              consolidated intelligence in one click.
            </p>

            {/* Portal Action Cards */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              {/* Card 1: Students */}
              <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm glass-card-hover flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Student Portal</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Login using Registration ID & Application Number. Review verified baseline details
                    and submit pending IQAC survey fields.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Pre-filled Data</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Editable till close</span>
                  </div>
                </div>

                <Link
                  href="/portal/login?role=student"
                  className="mt-6 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-medium text-sm transition"
                >
                  <span>Student Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Card 2: Faculty */}
              <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm glass-card-hover flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-5 group-hover:bg-purple-600 group-hover:text-white transition">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Faculty Portal</h3>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Access institutional forms for research publications, patents, conferences, and
                    department audits with pre-filled baseline credentials.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Faculty ID</span>
                    <span className="bg-slate-100 px-2 py-0.5 rounded">Research Audits</span>
                  </div>
                </div>

                <Link
                  href="/portal/login?role=faculty"
                  className="mt-6 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-purple-600 text-white font-medium text-sm transition"
                >
                  <span>Faculty Login</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              {/* Card 3: Admin */}
              <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-indigo-100 shadow-md ring-1 ring-indigo-500/10 glass-card-hover flex flex-col justify-between group bg-gradient-to-b from-white to-indigo-50/30">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-slate-900">Admin Control Center</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Command
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500 leading-relaxed">
                    Bulk upload Excel rosters, build dynamic forms, toggle session statuses, lock edits,
                    and download consolidated IQAC workbooks.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5 text-xs text-slate-500">
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">Excel Importer</span>
                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-medium">Form Builder</span>
                  </div>
                </div>

                <Link
                  href="/admin/login"
                  className="mt-6 inline-flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
                >
                  <span>Enter Admin Console</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Section */}
        <section className="py-16 bg-white border-y border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                Architectural Highlights
              </h2>
              <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">
                Engineered for High Strength Institutions & Zero Data Loss
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-start p-5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="p-3 rounded-lg bg-indigo-100 text-indigo-700 mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Editable Till Session Close</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Students and faculty can review and edit submitted data anytime until the admin officially
                  closes the session, ensuring verified accuracy.
                </p>
              </div>

              <div className="flex flex-col items-start p-5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="p-3 rounded-lg bg-emerald-100 text-emerald-700 mb-4">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Cumulative Baseline Evolution</h4>
                <p className="mt-2 text-sm text-slate-500">
                  When new rounds are launched next day or month, previously submitted details are
                  permanently retained as baseline data and never lost!
                </p>
              </div>

              <div className="flex flex-col items-start p-5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="p-3 rounded-lg bg-amber-100 text-amber-700 mb-4">
                  <Database className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">High-Volume Postgres Scalability</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Serverless PostgreSQL backend with connection pooling handles tens of thousands of
                  simultaneous submissions with sub-millisecond lookups.
                </p>
              </div>

              <div className="flex flex-col items-start p-5 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="p-3 rounded-lg bg-purple-100 text-purple-700 mb-4">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Consolidated IQAC Excel Export</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Single-click master export combines baseline roster fields with all historical and
                  dynamic answers into clean, accredited spreadsheets.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-white">IQAC DataHub</span>
            <span>• Continuous Quality Improvement & Institutional Accreditation</span>
          </div>
          <div>
            <span>Deployment Ready for Vercel & PostgreSQL</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
