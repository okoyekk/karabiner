const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const PORT = 3000;
const PUBLIC_DIR = path.join(__dirname, "gui");
const METADATA_KEYS = ["_comment"];
const PRIORITY_MAPPING_KEYS = ["spacebar", "a", "s", "x"];

const MIME_TYPES = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  console.log(`${req.method} ${req.url}`);

  // API Route: GET /api/mappings
  if (req.url === "/api/mappings" && req.method === "GET") {
    fs.readFile(path.join(__dirname, "mappings.json"), "utf8", (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to read mappings.json" }));
        return;
      }
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      });
      res.end(data);
    });
    return;
  }

  // API Route: POST /api/mappings
  if (req.url === "/api/mappings" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        // Validate JSON
        const parsed = orderMappings(JSON.parse(body));
        const prettyJson = JSON.stringify(parsed, null, 2);

        // Write mappings.json
        fs.writeFile(path.join(__dirname, "mappings.json"), prettyJson, "utf8", (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to write mappings.json" }));
            return;
          }

          // Trigger compilation
          console.log("mappings.json updated. Triggering build...");
          exec("yarn run build", { cwd: __dirname }, (buildErr, stdout, stderr) => {
            if (buildErr) {
              console.error("Build failed:", stderr);
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Failed to build Karabiner JSON", details: stderr }));
              return;
            }
            console.log("Build compiled successfully!");
            res.writeHead(200, {
              "Content-Type": "application/json",
              "Cache-Control": "no-store"
            });
            res.end(JSON.stringify({ success: true, stdout }));
          });
        });
      } catch (e) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON format" }));
      }
    });
    return;
  }

  // Serve static assets from public /gui directory
  let filePath = path.join(PUBLIC_DIR, req.url === "/" ? "index.html" : req.url);
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || "application/octet-stream";

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/html" });
        res.end("<h1>404 Not Found</h1>", "utf-8");
      } else {
        res.writeHead(500);
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        "Content-Type": contentType,
        "Cache-Control": "no-store"
      });
      res.end(content, "utf-8");
    }
  });
});

function orderMappings(mappings) {
  const ordered = {};

  METADATA_KEYS.forEach((key) => {
    if (key in mappings) {
      ordered[key] = mappings[key];
    }
  });

  PRIORITY_MAPPING_KEYS.forEach((key) => {
    if (key in mappings) {
      ordered[key] = mappings[key];
    }
  });

  Object.entries(mappings).forEach(([key, value]) => {
    if (!(key in ordered)) {
      ordered[key] = value;
    }
  });

  return ordered;
}

server.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Karabiner Visual Configurator GUI active!       `);
  console.log(` Open: http://localhost:${PORT}                  `);
  console.log(`==================================================`);
});
