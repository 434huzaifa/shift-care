/*
  Warnings:

  - You are about to drop the column `isFav` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `jobTitle` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `locationFlag` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `nationality` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `nationalityFlag` on the `Carer` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Carer` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Carer" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "profileImage" BLOB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Carer" ("createdAt", "email", "gender", "id", "name", "profileImage", "updatedAt") SELECT "createdAt", "email", "gender", "id", "name", "profileImage", "updatedAt" FROM "Carer";
DROP TABLE "Carer";
ALTER TABLE "new_Carer" RENAME TO "Carer";
CREATE UNIQUE INDEX "Carer_email_key" ON "Carer"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
