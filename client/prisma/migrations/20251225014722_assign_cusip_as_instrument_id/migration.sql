/*
  Warnings:

  - The primary key for the `instruments` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `instruments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "instruments" DROP CONSTRAINT "instruments_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "instruments_pkey" PRIMARY KEY ("cusip");
