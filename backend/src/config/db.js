import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  mongoose.connection.on("disconnected", () => console.warn("⚠️ MongoDB disconnected"));
  mongoose.connection.on("reconnected", () => console.log("🔄 MongoDB reconnected"));
  mongoose.connection.on("error", (err) => console.error("MongoDB error:", err));

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB || "production",
    // Use modern defaults; no deprecated opts needed in recent mongoose
    autoIndex: false,
  });

  console.log("✅ MongoDB connected:", mongoose.connection.name);
}

export async function closeDB() {
  try {
    await mongoose.connection.close(false);
    console.log("🛑 MongoDB connection closed");
  } catch (e) {
    console.error("Error closing MongoDB connection:", e);
  }
}
