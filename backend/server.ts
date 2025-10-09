import "dotenv/config";           // loads .env
import express from "express";
import { openai } from "./openaiClient";

const app = express();
app.use(express.json());

app.post("/api/ai", async (req, res, next) => {
  try {
    const prompt: string = req.body?.prompt ?? "Say hi.";
    const r = await openai.responses.create({
      model: "gpt-5",
      input: prompt
    });
    // SDK exposes a handy helper for the final text:
    // r.output_text (or assemble from r.output[...] if not present in your version)
    res.json({ text: (r as any).output_text ?? r });
  } catch (e) { next(e); }
});

app.listen(5500, () => console.log("API on http://localhost:5500"));
