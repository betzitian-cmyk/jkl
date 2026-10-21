import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { ensureSchema } from "../src/db/index.ts";
import gpsRouter from "../src/routes/gpsRoutes.ts";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Mount PostgreSQL GPS Routes
app.use(gpsRouter);

async function startServer() {
  await ensureSchema();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Gantavya GPS Server running on http://0.0.0.0:${PORT}`);
  });
}

if (process.argv[1] && process.argv[1].endsWith('gps/server.ts')) {
  startServer();
}

export default app;
