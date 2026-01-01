/*
  Warnings:

  - You are about to drop the column `time` on the `Shift` table. All the data in the column will be lost.
  - Added the required column `end_time` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Shift" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "staffId" INTEGER NOT NULL,
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
    CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Shift" ("address", "bonus", "createdAt", "id", "instruction", "priceAmount", "priceType", "recurrenceRule", "staffId", "updatedAt") SELECT "address", "bonus", "createdAt", "id", "instruction", "priceAmount", "priceType", "recurrenceRule", "staffId", "updatedAt" FROM "Shift";
DROP TABLE "Shift";
ALTER TABLE "new_Shift" RENAME TO "Shift";
CREATE INDEX "Shift_staffId_idx" ON "Shift"("staffId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
