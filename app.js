"use strict";

const express = require("express"),
      session = require("express-session"),
      socketIO = require("socket.io"),
      http = require("http"),
      ejs = require("ejs");

const port = 5000;

const app = express()
const server = http.Server(app);
const io = socketIO(server);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"))

app.get("/", (req, res) => {
  res.render("lobby.ejs")
})

server.listen(port, () => console.log(`Listening to port: ${port}`));
