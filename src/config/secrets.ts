import "dotenv/config";

const mongoUri = process.env.MONGO_URI;
const port = process.env.PORT || "3000";
const nodeEnv = process.env.NODE_ENV || "development";
const JWT = process.env.JWT_SECRET;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

if (!mongoUri) {
  throw new Error("MONGO_URI is not defined in environment variables");
}
if (!JWT) {
  throw new Error("JWT_SECRET is not defined in environment variables");
}
if(!clientId || !clientSecret){
  throw new Error("CLIENT_ID and CLIENT_SECRET are not defined in environment variables");
}
if(!googleRedirectUri){
  throw new Error("GOOGLE_REDIRECT_URI is not defined in environment variables");
}

export const MONGO_URI: string = mongoUri;
export const PORT: string = port;
export const NODE_ENV: string = nodeEnv;
export const JWT_SECRET: string = JWT;
export const GOOGLE_CLIENT_ID: string = clientId;
export const GOOGLE_CLIENT_SECRET: string = clientSecret;
export const GOOGLE_REDIRECT_URI: string = googleRedirectUri;