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
      cookie = require("cookie"),
      bodyParser = require("body-parser");

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
  constructor(sessionId, msg) {
    this.user = activeSessions[sessionId];
    this.msg = msg;
    this.time = this.time(new Date());
    this.connected = this.isConnected()
  }

  isConnected() {
    if (messagesMemmory.length >= 1) {
      if (messagesMemmory[messagesMemmory.length - 1].user.socketId === this.user.socketId) {
        return true
      } else {
        return false
      }
    }
  }

  time(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours < 10 ? 0 : ""}${hours}:${minutes < 10 ? 0 : ""}${minutes}`
  }
}

class Game {
  constructor(players) {
    this.players = players
    this.allIds = Object.keys(this.players);
    this.currentDrawer;
    this.index = 0;
  }

  pickPlayer() {}

  start() {
    this.currentDrawer = this.players[this.allIds[this.index]]
  }

  stop() {
    this.currentDrawer = undefined;
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
app.use(express.static("public"))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser())
app.use(session({
  secret: "classified"
}));

///////////////
//  Routing  //
///////////////


app.get("/", (req, res) => {
  if (req.session.id in activeSessions) {
    res.redirect("/room/1")
  } else {
    res.redirect("/create_account")
  }
})

app.get("/room/:id", (req, res) => {
  const roomIndex = parseInt(req.params.id)

  if (req.session.id in activeSessions) {
    res.render("room.ejs", {roomData: rooms[roomIndex], roomId: roomIndex})
  } else {
    res.redirect("/create_account")
  }
})

app.get("/create_account", (req, res) => {
  const id = req.session.id;

  activeSessions[id] = {
    socketId: undefined,
    name: undefined,
    score: 0
  }

  res.render("account_maker.ejs")
})

app.post("/updateAccount", (req, res) => {
  const id = req.session.id;
  const userName = req.body.user_name;

  activeSessions[id].name = userName;

  res.redirect("room/1")
})

///////////////
//  Sockets  //
///////////////

io.on("connection", async socket => {
  const sessionId = await cookieSession(socket);

  if (sessionId in activeSessions) {
    activeSessions[sessionId].socketId = socket.id

    io.emit("player - update all", activeSessions)

    if (onlineSesssionsAmt() >= minimumPlayers) {
      game = new Game(activeSessions);
      game.start()

      let counter = 0;
      const max = 10000;
      const i = 1000;
      const timer = setInterval(() => {
        if (counter >= max) {
          clearInterval(timer)

          // Mkae new round
        } else {
          counter += i;

          io.emit("game - update timer", ((max - counter) / max) * 100)
        }
      }, i)

      io.emit("game - start", game.currentDrawer)
    }

    socket.emit("player - joined/update", {drawings: drawingsMemory, messages: messagesMemmory})

    socket.broadcast.emit("player - joined", socket.id)

    socket.on("drawing - save/broadcast", (drawing, id) => {
      drawingsMemory[id] = drawing;

      socket.broadcast.emit("drawing - render", drawing)
    })

    socket.on("message - create", val => {
      const msg = new Message(sessionId, val)

      messagesMemmory.push(msg);

      io.emit("message - render", msg)
    })

    socket.on("drawing - clear all", () => {
      drawingsMemory = [];

      io.emit("canvas - clear")
    })

    socket.on("message - clear all", () => {
      messagesMemmory = [];
    })

    socket.on("disconnect", () => {
      activeSessions[sessionId].socketId = undefined;

      if (onlineSesssionsAmt() < minimumPlayers) {
        if (game) {
          game.stop()
        }

        io.emit("game - stop")
      }

      io.emit("player - update all", activeSessions)
    })
  } else {
    console.log("player unknown")
  }
})

server.listen(port, () => console.log(`Listening to port: ${port}`));

function cookieSession(socket) {
  return new Promise((resolve, reject) => {
    const rough = cookie.parse(socket.request.headers.cookie)["connect.sid"],
          rx = /(?<=s:).+?(?=\.)/;

     resolve(rx.exec(rough)[0])
  })
}

function onlineSesssionsAmt() {
  let temp = 0;

  for (let s in activeSessions) {
    if (activeSessions[s].socketId) temp++
  }

  return temp
}
