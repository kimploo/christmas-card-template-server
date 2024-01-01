export interface CreateCardReqDTO {
  from: string;
  to: string;
  msg: string;
  artworkId: number;
  artworkUrl: string;
  artworkBackgroundId: number;
  bgColor: string;
  artworkSnowFlakeId: number;
  imgUrls: string[];
}
