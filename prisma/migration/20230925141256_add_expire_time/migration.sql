-- AlterTable
ALTER TABLE "User" ADD COLUMN     "kakaoAccessTokenExpiresOn" TIMESTAMP(3),
ADD COLUMN     "kakaoRefreshTokenExpiresOn" TIMESTAMP(3);
