/*
  Warnings:

  - Added the required column `gender` to the `Carer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jobTitle` to the `Carer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `location` to the `Carer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nationality` to the `Carer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Carer" (
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
INSERT INTO "new_Carer" ("createdAt", "email", "id", "name", "updatedAt") SELECT "createdAt", "email", "id", "name", "updatedAt" FROM "Carer";
DROP TABLE "Carer";
ALTER TABLE "new_Carer" RENAME TO "Carer";
CREATE UNIQUE INDEX "Carer_email_key" ON "Carer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
