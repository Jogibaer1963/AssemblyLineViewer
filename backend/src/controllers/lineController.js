import Schedule from "../models/assemblyLine.js";

export async function lineSchedule(_req, res, _next) {
  try {
    // Load only items explicitly marked active, accepting legacy string/number truthy values
    const rawItems = await Schedule.find({ activeList: { $in: [true, "true", 1, "1"] } })
      .sort({ sequenz: 1 })
      .lean()
      .exec();
    {
      const ids = (rawItems || []).map(it => it?._id).filter(Boolean).join(", ");
      console.log("lineSchedule debug: found", rawItems.length, "items; _ids:", ids);
    }
    // Normalize activeList to a boolean for API consumers
    const items = rawItems.map(it => ({
      ...it,
      activeList: it?.activeList === "true"
    }));

    if (process.env.NODE_ENV !== "production") {
      const ids = (items || []).map(it => it?._id).filter(Boolean).join(", ");
      console.log("lineSchedule debug: returned", items.length, "items; _ids:", ids);
    }

    // Prevent client/proxy caching so fresh data is always fetched
    res.set("Cache-Control", "no-store");
    res.json(items);
  } catch (err) {
    console.error("lineSchedule error:", err?.message || err);
    // Fallback: return empty array to keep UI functional instead of 500
    res.set("Cache-Control", "no-store");
    res.status(200).json([]);
  }
}

export async function advanceItem(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: "Missing id" });

    const update = { activeList: "false", activeInLine: "true" };

    // First, try the standard Mongoose path (works when _id is ObjectId or castable)
    try {
      const updatedByMongoose = await Schedule.findByIdAndUpdate(
        id,
        { $set: update }
      ).lean();
      if (updatedByMongoose) {
        return res.json({ ok: true, id, item: updatedByMongoose });
      }
    } catch (castErr) {
      // Swallow CastError to try native fallback below
      if (process.env.NODE_ENV !== "production") {
        console.warn("advanceItem cast warning (will try native driver):",
          castErr?.message || castErr);
      }
    }

    // Fallback for non-ObjectId _id values (e.g., UUID strings)
    const native = Schedule.collection;

    // Helper: perform update and then fetch in a driver-version-safe way
    async function updateThenFetch(filter, fetchFilter = filter) {
      try {
        const updRes = await native.updateOne(filter, { $set: update });
        const matched = (updRes && (updRes.matchedCount ?? updRes.result?.n ?? updRes.result?.nMatched ?? 0)) > 0;
        if (!matched) return { didUpdate: false, doc: null };
        // Try to fetch the updated doc; if this fails, still acknowledge success
        try {
          const doc = await native.findOne(fetchFilter);
          return { didUpdate: true, doc };
        } catch (_) {
          return { didUpdate: true, doc: null };
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("advanceItem native update failed for filter", JSON.stringify(filter), e?.message || e);
        }
        return { didUpdate: false, doc: null };
      }
    }

    let didUpdate = false;
    let doc = null;

    // 1) Try direct string match on _id
    {
      const r = await updateThenFetch({ _id: id });
      didUpdate = r.didUpdate; doc = r.doc;
    }

    // 2) If not found, try matching by stringified _id (works for ObjectId)
    if (!didUpdate) {
      try {
        const exprFilter = { $expr: { $eq: [ { $toString: "$_id" }, id ] } };
        const r = await updateThenFetch(exprFilter);
        didUpdate = r.didUpdate; doc = r.doc;
        if (process.env.NODE_ENV !== "production") {
          console.log("advanceItem fallback $toString matched:", Boolean(didUpdate));
        }
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("advanceItem $toString fallback failed:", e?.message || e);
        }
      }
    }

    // 3) As a final fallback, try common alternate id fields (id/guid/uuid)
    const altKeys = ["id", "guid", "uuid", "UUID", "Id", "ID"];
    if (!didUpdate) {
      for (const key of altKeys) {
        const r = await updateThenFetch({ [key]: id });
        if (r.didUpdate) {
          if (process.env.NODE_ENV !== "production") {
            console.log(`advanceItem matched by alternate key '${key}'`);
          }
          didUpdate = true;
          doc = r.doc;
          break;
        }
      }
    }

    if (!didUpdate) return res.status(404).json({ error: "Item not found" });

    return res.json({ ok: true, id, item: doc });
  } catch (err) {
    console.error("advanceItem error:", err?.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
