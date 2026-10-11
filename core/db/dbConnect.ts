import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not defined in environment variables");

interface Cache { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null; }
declare global { var _mongooseCache: Cache; }
const cached: Cache = global._mongooseCache || { conn: null, promise: null };
global._mongooseCache = cached;

export default async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }).then(m => { console.log("MongoDB connected"); return m; });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
