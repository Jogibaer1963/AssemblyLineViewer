import Schedule from "../models/assemblyLine.js";

export async function lineSchedule(req, res, next) {
  try {
    // Use an aggregation with an explicit $match on the boolean true for clarity
    const items = await Schedule.aggregate([
      { $match: { activeList: { $eq: true } } },
      { $sort: { machine: -1 } },
    ]);

    // Debug info to help diagnose mismatched types in the DB
    if (process.env.NODE_ENV !== "production") {
      const [stats] = await Schedule.aggregate([
        {
          $group: {
            _id: { type: { $type: "$activeList" }, value: "$activeList" },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);
      console.log("lineSchedule debug: returned", items.length, "items with activeList === true");
      console.log("lineSchedule debug: activeList type/value distribution:", stats);
    }
    res.json(items);
  } catch (err) {
    console.error("lineSchedule error:", err?.message || err);
    // Fallback: return empty array to keep UI functional instead of 500
    res.status(200).json([]);
  }
}
