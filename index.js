const http = require("http");
const fs = require("fs");

http.createServer((req, res) => {
    req.url === "/" ? res.end(fs.readFileSync(__dirname + "/index.html")) :
        req.url === "/style" ? res.end(fs.readFileSync(__dirname + "/public/style.css")) :
        req.url === "/script" ? res.end(fs.readFileSync(__dirname + "/public/script.js")) : 
        res.end("404 - File not found!");
}).listen(3000, (error) => {
    console.log(error || "App running in http://localhost:3000");
});