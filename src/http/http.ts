const express = require("express");
const httpRouter = express();

httpRouter.get("/", (req, res) => {
    res.send("Hello World!");
});

httpRouter.get("/restart", (req, res) => {
    process.exit(0);
});

export default httpRouter;

