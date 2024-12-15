const functions = require("firebase-functions");
const express = require("express");
const puppeteer = require("puppeteer");

const app = express();
app.use(express.json());

// API parse dữ liệu từ LightNovelWorld
app.post("/parse", async (req, res) => {
  const { path } = req.body;

  if (!path) {
    return res.status(400).json({ error: "Path is required." });
  }

  const url = `https://www.lightnovelworld.co/${path}`;

  try {
    // Sử dụng Puppeteer để bypass Cloudflare
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });

    // Extract data from the page
    const data = await page.evaluate(() => {
      // Ví dụ: Lấy các tiêu đề chương
      const elements = document.querySelectorAll(".chapter-title");
      return Array.from(elements).map((el) => el.textContent.trim());
    });

    await browser.close();

    res.json({ success: true, data });
  } catch (error) {
    console.error("Error parsing website:", error);
    res.status(500).json({ error: "Failed to parse website." });
  }
});

// Expose the app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
