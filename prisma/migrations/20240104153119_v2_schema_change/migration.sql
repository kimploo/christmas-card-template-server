-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "kakaoId" BIGINT NOT NULL,
    "kakaoAccessToken" TEXT,
    "kakaoAccessTokenExpiresOn" TIMESTAMP(3),
    "kakaoRefreshToken" TEXT,
    "kakaoRefreshTokenExpiresOn" TIMESTAMP(3),
    "name" TEXT,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Card" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3),
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "msg" TEXT NOT NULL,
    "userId" INTEGER,
    "artworkId" INTEGER NOT NULL,
    "artworkBackgroundId" INTEGER NOT NULL,
    "artworkSnowFlakeId" INTEGER NOT NULL,

    CONSTRAINT "Card_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artwork" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "Artwork_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkBackground" (
    "id" SERIAL NOT NULL,
    "bgInfo" JSONB NOT NULL,

    CONSTRAINT "ArtworkBackground_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkSnowFlake" (
    "id" SERIAL NOT NULL,
    "imgUrls" TEXT[],

    CONSTRAINT "ArtworkSnowFlake_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtworkToArtworkBackground" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "_ArtworkToArtworkSnowFlake" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoId_key" ON "User"("kakaoId");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoAccessToken_key" ON "User"("kakaoAccessToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_kakaoRefreshToken_key" ON "User"("kakaoRefreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "Card_uuid_key" ON "Card"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtworkToArtworkBackground_AB_unique" ON "_ArtworkToArtworkBackground"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtworkToArtworkBackground_B_index" ON "_ArtworkToArtworkBackground"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_ArtworkToArtworkSnowFlake_AB_unique" ON "_ArtworkToArtworkSnowFlake"("A", "B");

-- CreateIndex
CREATE INDEX "_ArtworkToArtworkSnowFlake_B_index" ON "_ArtworkToArtworkSnowFlake"("B");

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_artworkId_fkey" FOREIGN KEY ("artworkId") REFERENCES "Artwork"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_artworkBackgroundId_fkey" FOREIGN KEY ("artworkBackgroundId") REFERENCES "ArtworkBackground"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Card" ADD CONSTRAINT "Card_artworkSnowFlakeId_fkey" FOREIGN KEY ("artworkSnowFlakeId") REFERENCES "ArtworkSnowFlake"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtworkToArtworkBackground" ADD CONSTRAINT "_ArtworkToArtworkBackground_A_fkey" FOREIGN KEY ("A") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtworkToArtworkBackground" ADD CONSTRAINT "_ArtworkToArtworkBackground_B_fkey" FOREIGN KEY ("B") REFERENCES "ArtworkBackground"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtworkToArtworkSnowFlake" ADD CONSTRAINT "_ArtworkToArtworkSnowFlake_A_fkey" FOREIGN KEY ("A") REFERENCES "Artwork"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtworkToArtworkSnowFlake" ADD CONSTRAINT "_ArtworkToArtworkSnowFlake_B_fkey" FOREIGN KEY ("B") REFERENCES "ArtworkSnowFlake"("id") ON DELETE CASCADE ON UPDATE CASCADE;
