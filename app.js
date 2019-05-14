"use strict";

///////////////
//  Modules  //
///////////////

const express = require("express"),
      session = require("express-session"),
      socketIO = require("socket.io"),
      http = require("http"),
      ejs = require("ejs"),
      cookieParser = require("cookie-parser"),
      cookie = require("cookie")

/////////////////
//  Constants  //
/////////////////

const port = 5000;

const activeSessions = {};

const rooms = [
  {
    difficulty: "easy",
    maxPlayers: 10,
    players: [],
    messages: []
  },
  {
    difficulty: "medium",
    maxPlayers: 10,
    players: [],
    messages: []
  },
  {
    difficulty: "hard",
    maxPlayers: 10,
    players: [],
    messages: []
  }
]

class Message {
  constructor(data) {
    this.sessionID = data.sessionID;
    this.socketID = data.socketID
    this.name = data.name;
    this.class;
    this.message;
  }

  lobby() {
    return new Promise((resolve, reject) => {
      this.message = `${this.name || this.socketID} joined the room`;
      this.class = "lobby";

      resolve(this)
    })
  }
}

//////////////////
//  Middleware  //
//////////////////

const app = express(),
      server = http.Server(app),
      io = socketIO(server);

app.set("view engine", "ejs");
app.set("views", "views");
app.use(cookieParser())
app.use(express.static("public"))
app.use(session({
  secret: "classified"

}));

///////////////
//  Routing  //
///////////////


app.get("/", (req, res) => {
  // res.render("lobby.ejs", {rooms: rooms})
  res.redirect("/room/1")


  // updateSessions(req) // Probably useless
})

app.get("/room/:id", (req, res) => {
  const roomIndex = parseInt(req.params.id)


  res.render("room.ejs", {roomData: rooms[roomIndex], roomId: roomIndex})
})



///////////////
//  Sockets  //
///////////////

io.on("connection", async socket => {

})

server.listen(port, () => console.log(`Listening to port: ${port}`));
