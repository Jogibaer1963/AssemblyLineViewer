import "dotenv/config";           // loads .env
import express from "express";


const app = express();
app.use(express.json());




app.listen(5500, () => console.log("API on http://localhost:5500"));
