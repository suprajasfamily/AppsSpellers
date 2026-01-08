import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { createOrUpdateTypeBuddyDocument, checkGoogleDriveConnection } from "./lib/googleDrive";
import * as path from "path";
import * as fs from "fs";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/download-project", (_req, res) => {
    const zipPath = path.resolve(process.cwd(), "letterboard-spellerbuddy-export.zip");
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, "letterboard-spellerbuddy.zip");
    } else {
      res.status(404).send("Export file not found");
    }
  });
  app.get("/api/google-drive/status", async (_req, res) => {
    try {
      const connected = await checkGoogleDriveConnection();
      res.json({ connected });
    } catch (error) {
      res.json({ connected: false });
    }
  });

  app.post("/api/google-drive/save", async (req, res) => {
    try {
      const { content } = req.body;
      if (typeof content !== "string") {
        return res.status(400).json({ error: "Content must be a string" });
      }
      const result = await createOrUpdateTypeBuddyDocument(content);
      res.json({ success: true, ...result });
    } catch (error: any) {
      console.error("Google Drive save error:", error);
      res.status(500).json({ error: error.message || "Failed to save to Google Drive" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
