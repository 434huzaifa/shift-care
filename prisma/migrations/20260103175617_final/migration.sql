-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PriceType" AS ENUM ('WEEKLY', 'HOURLY', 'DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "nationality" TEXT NOT NULL,
    "nationalityFlag" TEXT,
    "location" TEXT NOT NULL,
    "locationFlag" TEXT,
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "gender" "Gender" NOT NULL,
    "isFav" BOOLEAN NOT NULL DEFAULT false,
    "profileImage" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Carer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gender" "Gender" NOT NULL,
    "profileImage" BYTEA,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Carer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" SERIAL NOT NULL,
    "staffId" INTEGER NOT NULL,
    "carerId" INTEGER NOT NULL,
    "priceAmount" DOUBLE PRECISION NOT NULL,
    "priceType" "PriceType" NOT NULL,
    "startDate" TEXT NOT NULL,
    "shift_start_time" TEXT NOT NULL,
    "shift_end_time" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "hours" DOUBLE PRECISION,
    "recurrenceRule" TEXT,
    "occurrences" INTEGER,
    "summary" TEXT,
    "address" TEXT NOT NULL,
    "bonus" DOUBLE PRECISION,
    "instruction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Staff_email_key" ON "Staff"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Carer_email_key" ON "Carer"("email");

-- CreateIndex
CREATE INDEX "Shift_staffId_idx" ON "Shift"("staffId");

-- CreateIndex
CREATE INDEX "Shift_carerId_idx" ON "Shift"("carerId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_carerId_fkey" FOREIGN KEY ("carerId") REFERENCES "Carer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
