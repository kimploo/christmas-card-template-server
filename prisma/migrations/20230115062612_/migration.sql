/*
  Warnings:

  - A unique constraint covering the columns `[kakaoAccessToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kakaoRefreshToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `kakaoAccessToken` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `kakaoRefreshToken` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kakaoAccessToken" TEXT NOT NULL,
ADD COLUMN     "kakaoRefreshToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoAccessToken_key" ON "User"("kakaoAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoRefreshToken_key" ON "User"("kakaoRefreshToken");
