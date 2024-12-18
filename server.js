const express = require('express'); // Importing express
const app = express(); // Creating an express app
const axios = require('axios');
const cheerio = require("cheerio");
app.use(express.json());

// API parse dữ liệu từ LightNovelWorld
app.get("/getnewnovel", async (req, res) => {
  const { page } = req.query;
  if (!page) {
    page = 1;
  }
  const url = `https://www.lightnovelworld.co/browse/genre-all-25060123/order-new/status-all?page=${page}`;

  // Sử dụng axios để gửi request
  const response = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    },
    method: 'GET',
    proxy: {
      host: 'proxy-server.scraperapi.com',
      port: 8001,
      auth: {
        username: 'scraperapi',
        password: '0f97b6c5b07c0c9782e304f3e67d01b9'
      },
      protocol: 'http'
    }
  });

  // Load HTML vào cheerio
  const $ = cheerio.load(response.data);

  // Parse danh sách các tiểu thuyết
  const novels = [];
  $(".novel-item").each((index, element) => {
    const title = $(element).find(".novel-title").text().trim();
    const star = $(element).find("._br").text().trim();
    const updatetime = $(element).find(".uppercase").text().trim();
    const thumbnail = $(element).find("img").attr("data-src");
    const link = $(element).find("a").attr("href");

    novels.push({
      title,
      star,
      updatetime,
      thumbnail,
      link: `https://www.lightnovelworld.co${link}`, // Đảm bảo link đầy đủ
    });
  });
  // Trả về dữ liệu JSON
  res.json({ success: true, novels });

});
// Endpoint GET /parse
app.get("/parse", async (req, res) => {
  const { path } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing 'path' parameter." });
  }

  const url = `https://www.lightnovelworld.co/${path}`;

  console.log(`URL: ${url}`);

  try {
    // Launch Puppeteer để bypass Cloudflare
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Điều hướng đến URL và chờ trang tải xong
    await page.goto(url, { waitUntil: "networkidle2" });

    // Parse các element từ trang web
    const data = await page.evaluate(() => {
      // Lấy danh sách các chương (ví dụ)
      const chapters = Array.from(document.querySelectorAll(".chapter-title")).map((el) => ({
        title: el.textContent.trim(),
        link: el.href,
      }));

      // Trả về dữ liệu
      return { chapters };
    });

    await browser.close();

    // Trả về dữ liệu JSON
    res.json({ success: true, data });
  } catch (error) {
    console.error("Error parsing website:", error);
    res.status(500).json({ success: false, error: "Failed to parse website." });
  }
});

// Set up the server to listen on port 3000
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});