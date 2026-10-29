import ImageKit from "@imagekit/nodejs";
import "dotenv/config";

const imageKit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || process.env.IMAGE_KIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || process.env.IMAGE_KIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || process.env.IMAGE_KIT_URL_ENDPOINT,
});

export default imageKit;
