/*
  Warnings:

  - You are about to drop the column `end_time` on the `Shift` table. All the data in the column will be lost.
  - You are about to drop the column `start_time` on the `Shift` table. All the data in the column will be lost.
  - Added the required column `endDate` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shift_end_time` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shift_start_time` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDate` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shift" (
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
INSERT INTO "new_Shift" ("address", "bonus", "carerId", "createdAt", "hours", "id", "instruction", "occurrences", "priceAmount", "priceType", "recurrenceRule", "staffId", "summary", "updatedAt") SELECT "address", "bonus", "carerId", "createdAt", "hours", "id", "instruction", "occurrences", "priceAmount", "priceType", "recurrenceRule", "staffId", "summary", "updatedAt" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
CREATE INDEX "Shift_staffId_idx" ON "Shift"("staffId");
CREATE INDEX "Shift_carerId_idx" ON "Shift"("carerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
