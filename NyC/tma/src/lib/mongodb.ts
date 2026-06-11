import mongoose from "mongoose"

declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: typeof import("mongoose") | null
    promise: Promise<typeof import("mongoose")> | null
  }
}

let cached = global.mongoose

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null }
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI no está definido en las variables de entorno")
  }

  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
