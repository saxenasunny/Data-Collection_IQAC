# IQAC Centralized Data Collection Portal & Accreditation Hub

A modern, high-performance web platform engineered for universities and colleges to streamline institutional data collection for students and faculty (specifically tailored for **NAAC**, **NIRF**, and **NBA** accreditation).

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **Prisma ORM** with **PostgreSQL / Neon / Supabase** support, fully optimized for single-click deployment on **Vercel**.

---

## 🌟 Key Architecture & Highlights

### 1. High-Volume Scalability (Large Student & Faculty Strength)
- **Database Strategy**: Relational schema backed by **PostgreSQL** with B-Tree indices on `Registration ID`, `Application Number`, and `Faculty ID` ensuring sub-millisecond lookups even with 100,000+ records.
- **Serverless Ready**: Prisma Client with pooled connection string (PgBouncer or Neon serverless driver) prevents connection exhaustion during peak submission deadlines on Vercel.

### 2. Session Locking & Post-Submission Edits
- When a data collection session is **Open**: Students and faculty can fill, submit, and **edit their responses at any time**.
- When the Admin clicks **Close Session**: The session instantly locks into a read-only state, safeguarding the fidelity of final submissions.

### 3. Cumulative Baseline Evolution (Zero Data Loss)
- When students/faculty submit data for any round, their answers are automatically **merged into their permanent baseline profile** (`baselineData`).
- When the administration launches a new survey round the next day or month with additional fields:
  - Previously filled data is **never lost**.
  - All past details appear in their verified baseline history.
  - Responders only need to complete the new required fields.
  - The master export includes all past and current fields in unified Excel columns.

### 4. Bulk Excel / CSV Roster Upload
- **Student Upload Sheet**: Columns: `Registration ID`, `Application Number`, `Name`, `Department`, `Program`, `Year`.
- **Faculty Upload Sheet**: Columns: `Faculty ID`, `Name`, `Designation`, `Department`.
- Auto-generates downloadable sample templates (`.xlsx`).

### 5. Consolidated Master IQAC Export
- 1-Click Excel workbook export (`.xlsx`) containing:
  - **Sheet 1**: `Student_Master_IQAC` (All baseline attributes + cumulative historical fields + session responses).
  - **Sheet 2**: `Faculty_Master_IQAC` (All baseline attributes + publications, patents, and session answers).

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Sample Data
```bash
# Push schema to SQLite (default for local zero-config testing)
npx prisma db push

# Seed default admin & sample rosters
npx tsx prisma/seed.ts
```

### 3. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Default Credentials for Testing

| Role | Login Identifier | Password / Secondary Credential |
| :--- | :--- | :--- |
| **Admin Console** | `admin@iqac.edu` | `adminpassword123` |
| **Sample Student 1** | `2024BCSE001` | Application No: `APP-2024-1001` |
| **Sample Student 2** | `2024BCSE002` | Application No: `APP-2024-1002` |
| **Sample Faculty 1** | `FAC-CSE-101` | *(Direct login with Faculty ID)* |
| **Sample Faculty 2** | `FAC-ECE-204` | *(Direct login with Faculty ID)* |

*(The login pages also feature one-click auto-fill buttons for quick testing)*

---

## ☁️ Deploying to Vercel with PostgreSQL (Neon / Supabase)

### Step 1: Create a PostgreSQL Database
- Go to [Neon.tech](https://neon.tech) or [Supabase.com](https://supabase.com) and create a free PostgreSQL database.
- Copy your pooled connection string:
  ```text
  postgresql://user:password@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true
  ```

### Step 2: Update Prisma Provider for PostgreSQL
In `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Step 3: Deploy to Vercel
1. Push this project to GitHub or GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Under **Project Settings > Environment Variables**, add:
   - `DATABASE_URL`: Your Neon/Supabase pooled connection string
   - `ADMIN_SECRET`: A secure random secret key (e.g. `your_production_secret_32_chars_long`)
4. Click **Deploy**. Vercel will automatically build and serve the application globally.
