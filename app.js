"use strict";

///////////////
//  Modules  //
///////////////

const express = require("express"),
      session = require("express-session"),
      socketIO = require("socket.io"),
      http = require("http"),
      ejs = require("ejs");

/////////////////
//  Constants  //
/////////////////

const port = 5000;

//////////////////
//  Middleware  //
//////////////////

const app = express(),
      server = http.Server(app),
      io = socketIO(server);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(express.static("public"))
app.use(session({secret: "classified"}));

///////////////
//  Routing  //
///////////////

app.get("/", (req, res) => {
  res.render("lobby.ejs")
})

///////////////
//  Sockets  //
///////////////

io.on("connection", socket => {

})


server.listen(port, () => console.log(`Listening to port: ${port}`));
