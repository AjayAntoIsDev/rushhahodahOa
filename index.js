const https = require("https");
const fs = require("fs");
const path = require("path");
const { createProxyServer } = require("http-proxy");

// Load SSL certificate and key
const options = {
    key: fs.readFileSync(path.join(__dirname, "selfsigned.key")), // Path to your private key
    cert: fs.readFileSync(path.join(__dirname, "selfsigned.crt")), // Path to your certificate
};

// Create a proxy server
const proxy = createProxyServer({
    changeOrigin: true, // Changes the origin of the host header to the target URL
});

// Create an HTTPS server
const server = https.createServer(options, (req, res) => {
    // Log details about the incoming request
    console.log(`Received ${req.method} request for ${req.url}`);

    // Log request headers
    console.log("Headers:", req.headers);

    // Log request body (if any)
    let body = "";
    req.on("data", (chunk) => {
        body += chunk;
    });

    req.on("end", () => {
        if (body) {
            console.log("Body:", body);
        }

        // Handle POST requests to /api/auth
        if (req.method === "POST" && req.url === "/api/auth") {
            // Parse the body as JSON
            const requestData = JSON.parse(body);

            // Log the extracted data
            console.log("Received HWID:", requestData.hwid);
            console.log("Received Game Version:", requestData.gameVersion);

            // Define a static response mimicking a JWT token (as in your example)
            const responseData = {
                token: "lolllll",
            };

            // Send the static JSON response back to the client
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(responseData));
        } else if (req.method === "POST" && req.url === "/api/download") {
            // Handle POST requests to /api/download
            const authHeader = req.headers["authorization"];
            const userAgent = req.headers["user-agent"];

            // Log the extracted data (Authorization and User-Agent)
            console.log("Authorization Header:", authHeader);
            console.log("User-Agent:", userAgent);

            // Path to the file to send
            const filePath = path.join(__dirname, "rusher");

            // Check if the file exists
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    console.error("File not found:", err);
                    res.statusCode = 404; // Not Found
                    res.setHeader("Content-Type", "text/plain");
                    res.end("File Not Found\n");
                    return;
                }

                // Set headers for file download
                res.statusCode = 200; // OK
                res.setHeader("Content-Type", "application/octet-stream"); // Binary file
                res.setHeader(
                    "Content-Disposition",
                    'attachment; filename="rusher"'
                ); // Prompt download

                // Create a readable stream from the file and pipe it to the response
                const readStream = fs.createReadStream(filePath);
                readStream.pipe(res);

                readStream.on("error", (streamErr) => {
                    console.error("Stream error:", streamErr);
                    res.statusCode = 500; // Internal Server Error
                    res.end("Error reading file\n");
                });
            });
        } else {
            // For all other requests, proxy them to the target server
            const targetUrl = "https://newauth.rusherhack.net";

            // Log proxying information
            console.log(`Proxying request to: ${targetUrl}${req.url}`);

            // Use the proxy to forward the request
            proxy.web(req, res, { target: targetUrl }, (err) => {
                console.error("Proxy error:", err);
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end("Proxy Error\n");
            });
        }
    });
});

// Define the port the server will listen to
const PORT = 3000;

// Start the server and log the port it's listening on
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
