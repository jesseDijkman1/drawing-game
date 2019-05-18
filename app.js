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

let drawingsMemory = [];
let messagesMemmory = [];
let game;

const minimumPlayers = 2;

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

class Game {
  constructor(players) {
    this.players = players
    this.allIds = Object.keys(this.players);
    this.currentDrawer;
  }

  pickPlayer() {}

  start() {
    this.currentDrawer = this.players[this.allIds[0]]
  }

  newRound() {

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
  activeSessions[socket.id] = {
    id: socket.id,
    name: undefined,
    score: 0
  };

  io.emit("player - update all", activeSessions)

  if (Object.keys(activeSessions).length >= minimumPlayers) {
    game = new Game(activeSessions);
    game.start()

    io.emit("game - start", game.currentDrawer);
  }

  socket.emit("player - joined/update", {drawings: drawingsMemory, messages: messagesMemmory})

  socket.broadcast.emit("player - joined", socket.id)

  socket.on("drawing - save/broadcast", (drawing, id) => {
    drawingsMemory[id] = drawing;

    socket.broadcast.emit("drawing - render", drawing)
  })

  socket.on("message - save/broadcast", message => {
    messagesMemmory.push(message);

    socket.broadcast.emit("message - render", message)
  })

  socket.on("drawing - clear all", () => {
    drawingsMemory = [];

    socket.broadcast.emit("canvas - clear")
  })

  socket.on("disconnect", () => {
    delete activeSessions[socket.id];

    io.emit("player - update all", activeSessions)
  })
})

server.listen(port, () => console.log(`Listening to port: ${port}`));
