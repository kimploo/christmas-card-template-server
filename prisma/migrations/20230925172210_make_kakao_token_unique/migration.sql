/*
  Warnings:

  - A unique constraint covering the columns `[kakaoAccessToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[kakaoRefreshToken]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoAccessToken_key" ON "User"("kakaoAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoRefreshToken_key" ON "User"("kakaoRefreshToken");
