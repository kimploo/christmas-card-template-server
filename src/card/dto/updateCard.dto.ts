import { Prisma } from '@prisma/client';

export interface updateCardReqDTO {
  from: string;
  to: string;
  msg: string;
  artworkId: number;
  artworkUrl: string;
  artworkBackgroundId: number;
  bgInfo: Prisma.JsonObject;
  artworkSnowFlakeId: number;
  imgUrls: string[];
}
