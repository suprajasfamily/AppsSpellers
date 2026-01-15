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

  app.post("/api/subscribe", async (req, res) => {
    try {
      const { name, email } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Name and email are required" });
      }
      
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: "glowinnovation2024@gmail.com",
        subject: `New Subscriber: ${name}`,
        text: `New subscriber!\n\nName: ${name}\nEmail: ${email}\n\nFrom Letterboard SpellerBuddy landing page.`,
        html: `<h2>New Subscriber!</h2><p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><em>From Letterboard SpellerBuddy landing page.</em></p>`
      });

      res.json({ success: true });
    } catch (error: any) {
      console.error("Subscribe error:", error);
      res.status(500).json({ error: error.message || "Failed to subscribe" });
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
