-- AlterTable
ALTER TABLE "User" ALTER COLUMN "kakaoAccessToken" DROP NOT NULL,
ALTER COLUMN "kakaoRefreshToken" DROP NOT NULL;
