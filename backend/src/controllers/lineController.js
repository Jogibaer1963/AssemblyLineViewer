import Report from "../models/assemblyLine.js";

export async function listReports(req, res, next) {
  try {
    const items = await Report.find().sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function createReport(req, res, next) {
  try {
    const created = await Report.create(req.body);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}
