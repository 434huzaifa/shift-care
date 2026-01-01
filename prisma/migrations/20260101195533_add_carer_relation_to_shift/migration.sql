/*
  Warnings:

  - Added the required column `carerId` to the `Shift` table without a default value. This is not possible if the table is not empty.

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
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "recurrenceRule" TEXT,
    "address" TEXT NOT NULL,
    "bonus" REAL,
    "instruction" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Shift_carerId_fkey" FOREIGN KEY ("carerId") REFERENCES "Carer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("address", "bonus", "createdAt", "end_time", "id", "instruction", "priceAmount", "priceType", "recurrenceRule", "staffId", "start_time", "updatedAt") SELECT "address", "bonus", "createdAt", "end_time", "id", "instruction", "priceAmount", "priceType", "recurrenceRule", "staffId", "start_time", "updatedAt" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
CREATE INDEX "Shift_staffId_idx" ON "Shift"("staffId");
CREATE INDEX "Shift_carerId_idx" ON "Shift"("carerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
