# Shift Care - Staff & Booking Management System

A modern admin portal for managing staff members and their booking schedules. Built with Next.js, Prisma, and ShadCN UI.

## 🚀 Features

- **Staff Management**: Create, edit, and manage staff profiles with images and details
- **Carer Management**: Maintain carer profiles and contact information
- **Booking Scheduler**: Create one-time or recurring bookings with RRule support
- **Calendar Views**: 
  - Monthly calendar view with visual shift distribution
  - List view with detailed shift information
- **Conflict Detection**: Automatic detection and prevention of overlapping bookings
- **Recurring Shifts**: Support for complex recurrence patterns (daily, weekly, monthly)
- **Modern UI**: Clean, card-based design with consistent spacing and professional typography

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) with App Router
- **Language**: TypeScript
- **Database**: SQLite with [Prisma ORM](https://www.prisma.io)
- **UI Library**: [ShadCN UI](https://ui.shadcn.com) + [Tailwind CSS](https://tailwindcss.com)
- **Forms**: [@tanstack/react-form](https://tanstack.com/form) with Zod validation
- **Date Handling**: Day.js and date-fns
- **Recurrence Rules**: [RRule](https://github.com/jakubroztocil/rrule)

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

## 🏁 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Initialize Database

```bash
npx prisma migrate dev
```

This will:
- Create the SQLite database (`dev.db`)
- Run all migrations
- Generate Prisma Client

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
shift-care/
├── app/
│   ├── api/              # API route handlers
│   │   ├── staff/        # Staff CRUD operations
│   │   ├── carer/        # Carer CRUD operations
│   │   └── shift/        # Shift CRUD & conflict checking
│   ├── carer/            # Carer management page
│   ├── schedule/         # Calendar & schedule views
│   └── layout.tsx        # Root layout with sidebar
├── components/
│   ├── ui/               # ShadCN UI components
│   ├── create-staff-form.tsx
│   ├── create-carer-form.tsx
│   ├── create-shift-form.tsx
│   └── rrule-generator.tsx  # Recurring schedule builder
├── lib/
│   ├── prisma.ts         # Prisma client
│   ├── shift-utils.ts    # Shift expansion & grouping logic
│   └── conflict-utils.ts # Booking conflict detection
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── migrations/       # Migration history
└── docs/                 # Additional documentation
```

## 🎯 Core Functionality

### Staff Management
- Create staff with profile images, job titles, and nationality
- Filter by status (Active, Inactive, On Leave, Terminated)
- Mark favorites and manage staff details

### Booking Creation
- Assign shifts to staff and carers
- Set shift times with automatic hour calculation
- Configure pricing (hourly, daily, weekly, monthly)
- Add bonus amounts and special instructions
- Create recurring schedules with visual RRule generator

### Conflict Prevention
- Real-time conflict detection before booking creation
- Prevents double-booking of carers
- Clear conflict messages with affected dates/times

### Calendar Views
- Monthly calendar with color-coded shifts
- Click any date to see detailed shift list
- Navigate between months
- Expandable shift occurrences for recurring bookings

## 🗄️ Database Schema

Key models:
- **Staff**: Employee information, status, and contact details
- **Carer**: Care recipient profiles
- **Shift**: Booking records with recurrence rules and pricing

See [prisma/schema.prisma](prisma/schema.prisma) for full schema.

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma migrate dev --name <name>  # Create new migration
```

## 📚 Additional Documentation

- [RRule Generator Guide](docs/RRULE-GENERATOR-README.md) - Complete guide to the recurring schedule component

## 🎨 Design Principles

- Modern admin portal aesthetic
- Card-based layouts with subtle shadows
- Consistent spacing and typography
- Accessible color contrast
- Responsive design for all screen sizes

## ⚠️ Error Handling

- Form validation with clear error messages
- Loading states for async operations
- Toast notifications for success/error feedback
- Graceful fallbacks for failed operations

---

Built with ❤️ using Next.js and ShadCN UI
