import Schedule from "../models/assemblyLine.js";

export async function lineSchedule(req, res, next) {
  try {
    const items = await Schedule.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }

}
