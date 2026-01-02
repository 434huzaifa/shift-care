-- CreateTable
CREATE TABLE "Staff" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "nationalityFlag" TEXT,
    "location" TEXT NOT NULL,
    "locationFlag" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "gender" TEXT NOT NULL,
    "isFav" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Carer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "profileImage" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staffId" INTEGER NOT NULL,
    "carerId" INTEGER NOT NULL,
    "priceAmount" REAL NOT NULL,
    "priceType" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "shift_start_time" TEXT NOT NULL,
    "shift_end_time" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "hours" REAL,
    "recurrenceRule" TEXT,
    "occurrences" INTEGER,
    "summary" TEXT,
    "address" TEXT NOT NULL,
    "bonus" REAL,
    "instruction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shift_carerId_fkey" FOREIGN KEY ("carerId") REFERENCES "Carer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Carer_email_key" ON "Carer"("email");

-- CreateIndex
CREATE INDEX "Shift_staffId_idx" ON "Shift"("staffId");

-- CreateIndex
CREATE INDEX "Shift_carerId_idx" ON "Shift"("carerId");
