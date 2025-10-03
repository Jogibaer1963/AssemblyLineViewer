import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    machineNumber: { type: String, index: true },
    country: String,
    notes: String
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
