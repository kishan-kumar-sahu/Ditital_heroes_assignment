import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import api from "./routes/api.js";
import { seed } from "./utils/seed.js";

import dns from 'node:dns';

dns.setServers([
  '8.8.8.8',
  '1.1.1.1'
]);
const app = express();


const PORT = process.env.PORT || 5000;
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));
app.get("/api/health", (req, res) =>
  res.json({ ok: true, time: new Date().toISOString() }),
);
app.use("/api", api);
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res
    .status(err.statusCode || 500)
    .json({ error: err.message || "Internal server error" });
});
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dist = path.resolve(__dirname, "../client/dist");
app.use(express.static(dist));
app.use((req, res, next) =>
  req.path.startsWith("/api/")
    ? next()
    : res.sendFile(path.join(dist, "index.html")),
);

// console.log(process.env.MONGO_URI),
connectDB()
  .then(seed)
  .then(() =>
    app.listen(PORT, () =>
      
      console.log(`server is started port on :${PORT}`),
    ),
  )
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
