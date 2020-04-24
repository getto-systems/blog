const server = require("live-server");

const headers = {
  "strict-transport-security": "max-age=31536000",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
  "x-xss-protection": "1; mode=block",
  "referrer-policy": "same-origin",
};

Object.keys(headers).forEach((key) => {
  console.log(`header: ${key}, ${headers[key]}`);
});

server.start({
  port: 8080,
  host: "0.0.0.0",
  root: "./public",
  open: false,
  middleware: [
    (req, res, next) => {
      Object.keys(headers).forEach((key) => {
        res.setHeader(key, headers[key]);
      });
      next();
    },
  ],
});
