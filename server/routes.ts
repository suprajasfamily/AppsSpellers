import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { createOrUpdateTypeBuddyDocument, checkGoogleDriveConnection, listTypeBuddyDocuments, getDocumentContent } from "./lib/googleDrive";

export async function registerRoutes(app: Express): Promise<Server> {
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

  app.get("/api/google-drive/list", async (_req, res) => {
    try {
      const files = await listTypeBuddyDocuments();
      res.json({ files });
    } catch (error: any) {
      console.error("Google Drive list error:", error);
      res.status(500).json({ error: error.message || "Failed to list documents" });
    }
  });

  app.get("/api/google-drive/file/:fileId", async (req, res) => {
    try {
      const { fileId } = req.params;
      const content = await getDocumentContent(fileId);
      res.json({ content });
    } catch (error: any) {
      console.error("Google Drive file error:", error);
      res.status(500).json({ error: error.message || "Failed to load document" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
