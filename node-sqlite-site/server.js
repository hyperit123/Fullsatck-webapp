const http = require("http");
const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./database.db", (err) => {
    if (err) console.error("Error opening database:", err);
    else {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
    )`);
    }
});

function serveFile(res, filePath, contentType) {
    fs.readFile(filePath, (err, content) => {
    if (err) {
        res.writeHead(500);
        res.end("Server error");
    } else {
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
    }
    });
}

const server = http.createServer((req, res) => {
    if (req.method === "GET" && req.url === "/") {
    serveFile(res, path.join(__dirname, "public", "index.html"), "text/html");
    } else if (req.method === "GET" && req.url === "/users") {
    db.all("SELECT * FROM users", [], (err, rows) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ users: rows }));
    });
    } else if (req.method === "POST" && req.url === "/users") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", () => {
        const data = JSON.parse(body);
        db.run("INSERT INTO users (name, email) VALUES (?, ?)", [data.name, data.email], function (err) {
            res.writeHead(200, { "Content-Type": "application/json" });
            if (err) res.end(JSON.stringify({ error: err.message }));
            else res.end(JSON.stringify({ id: this.lastID, ...data }));
        });
    });
    } else {
        res.writeHead(404);
        res.end("Not found");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
