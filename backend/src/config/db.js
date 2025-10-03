import mongoose from "mongoose";

export default async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("MONGO_URI missing in .env");

  await mongoose.connect(uri, {
    dbName: process.env.MONGO_DB || "production",
  });

  console.log("✅ MongoDB connected:", mongoose.connection.name);
}
