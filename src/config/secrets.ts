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
if (!clientId || !clientSecret) {
  throw new Error(
    "CLIENT_ID and CLIENT_SECRET are not defined in environment variables",
  );
}
if (!googleRedirectUri) {
  throw new Error(
    "GOOGLE_REDIRECT_URI is not defined in environment variables",
  );
}

const SECRETS = Object.freeze({
  MONGO_URI: mongoUri,
  PORT: port,
  NODE_ENV: nodeEnv,
  JWT_SECRET: JWT,
  GOOGLE_CLIENT_ID: clientId,
  GOOGLE_CLIENT_SECRET: clientSecret,
  GOOGLE_REDIRECT_URI: googleRedirectUri,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL || "",
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN || "",
} as const);

export const {
  MONGO_URI,
  PORT,
  NODE_ENV,
  JWT_SECRET,
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI,
  UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN,
} = SECRETS;
