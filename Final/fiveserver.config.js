module.exports = {
  port: 5500,

  middleware: [
    (req, res, next) => {
      if (req.url.split("?")[0] === "/") {
        res.writeHead(302, { Location: "/login.html" });
        res.end();
        return;
      }

      if (req.url === "/menu" || req.url.startsWith("/menu/")) {
        req.url = "/menu.html";
      }

      next();
    },
  ],
};
