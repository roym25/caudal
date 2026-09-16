# Caudal ??

Personal finance tracker built with **Next.js 16**, **PostgreSQL**, and **Prisma ORM**.

Track your payroll income, fixed monthly commitments, and variable spending with a clean, fast dashboard.

---

## Features

- ?? **Dashboard** ? Monthly summary of income, fixed expenses, variable expenses, and remaining balance with period selector.
- ?? **Payroll** ? Track salary payments, week numbers, net income, ISR tax withholdings, and savings fund contributions grouped by month.
- ?? **Fixed Expenses** ? Manage recurring monthly bills with a full 12-month interactive payment matrix and year-over-year navigation.
- ?? **Variable Expenses** ? Log one-off expenses and daily purchases with quick inline editing.
- ? **Full CRUD & Validation** ? Server-side error handling, input validation, and real-time toast feedback.
- ?? **Responsive Design** ? Accessible on mobile, tablet, and desktop with horizontal scrollable tables.

---

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Database ORM:** [Prisma 7](https://www.prisma.io/) with `@prisma/adapter-pg`
- **Database Engine:** PostgreSQL
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Language:** Pure JavaScript (ESM)

---

## Getting Started

### Prerequisites

- Node.js 18+ (tested on Node 22)
- PostgreSQL running locally or in cloud (port 5432 by default)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/roym25/caudal.git
   cd caudal
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and configure your database connection string:
   ```env
   DATABASE_URL="postgresql://postgres:your_password@localhost:5432/caudal?schema=public"
   ```

4. **Run migrations & generate Prisma client:**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Available Scripts

- `npm run dev` ? Starts local development server at `http://localhost:3000`
- `npm run build` ? Compiles optimized production build
- `npm run start` ? Runs compiled production application
- `npm run lint` ? Runs ESLint checks
- `npx prisma studio` ? Opens interactive database GUI

---

## Documentation

Full architectural and developer documentation is maintained in the [`docs/`](./docs) directory:

- [`PROJECT_OVERVIEW.md`](./docs/PROJECT_OVERVIEW.md) ? System architecture, models, and stack
- [`AI_RULES.md`](./docs/AI_RULES.md) ? Coding conventions and rules
- [`API_REFERENCE.md`](./docs/API_REFERENCE.md) ? Complete REST API endpoints reference
- [`DATABASE.md`](./docs/DATABASE.md) ? Database schema, relationships, and queries
- [`FILE_MAP.md`](./docs/FILE_MAP.md) ? File-by-file directory map and data flow
- [`GIT_HISTORY.md`](./docs/GIT_HISTORY.md) ? Git commit history and workflow conventions
- [`GOALS.md`](./docs/GOALS.md) ? Product roadmap from v0.1 to v1.0
- [`IMPLEMENTATION_PLAN.md`](./docs/IMPLEMENTATION_PLAN.md) ? Step-by-step engineering plan
