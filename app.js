"use strict";

/////////////////
//  Constants  //
/////////////////

const ROUND_LENGTH = 2000;
const API_PARAMS = {
  "user-id": process.env.USER_ID,
  "api-key": process.env.API_KEY,
  "censor-character": "*"
};


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
      fs = require("fs"),
      bodyParser = require("body-parser"),
      request = require("request");

require("dotenv").config()


/////////////////
//  Constants  //
/////////////////

const port = process.env.PORT || 5000;

let messagesMemmory = [];

let game = undefined;

const minimumPlayers = 2;

const allSessions = {};

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
    this.user = allSessions[sessionId];
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

let _allNouns;

class Game {
  constructor(players) {
    this.players = players;
    this.allIds = Object.keys(players)
    this.drawings = [];
    this.drawer = undefined;
    this.correctWord;
  }

  endRound(winner = false) {

    if (!winner) {
      this.drawer.score--
    } else {
      this.drawer.score += 3;
      winner.score += 3;
    }

    return new Promise((resolve, reject) => {
      resolve({
        drawer: this.drawer,
        winner: winner,
        correctWord: this.correctWord,
        users: this.players
      })
    })
  }

  // newRound() {
  //   this.drawer = this.newDrawer();
  // }

  randomWords() {
    const collection = [];

    for (let i = 0; i < 4; i++) {

      const index = Math.floor(Math.random() * this.nouns.length);
      collection.push(this.nouns.splice(index, 1))
    }

    return collection;
  }

  newDrawer() {
    return new Promise((resolve, reject) => {
      if (!this.allIds.length) {
        this.allIds = Object.keys(this.players);
      }

      const n = this.players[this.allIds.shift()]
      resolve(n)
    })
  }

  checkGuess(val) {
    const rx = new RegExp(this.correctWord);
    return new Promise((resolve, reject) => {
      if (!this.correctWord) {
        resolve(false)
      } else {
        resolve(rx.test(val))
      }
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
  if (req.session.id in allSessions) {
    res.redirect("/room/1")
  } else {
    res.redirect("/create_account")
  }
})

app.get("/room/:id", (req, res) => {
  const roomIndex = parseInt(req.params.id)

  if (req.session.id in allSessions) {
    res.render("room.ejs", {roomData: rooms[roomIndex], roomId: roomIndex})
  } else {
    res.redirect("/create_account")
  }
})

app.get("/create_account", (req, res) => {
  const id = req.session.id;

  allSessions[id] = {
    socketId: undefined,
    name: undefined,
    score: 0
  }

  res.render("account_maker.ejs")
})

app.post("/updateAccount", (req, res) => {
  const id = req.session.id;
  const userName = req.body.user_name;

  allSessions[id].name = userName;

  res.redirect("room/1")
})

///////////////
//  Sockets  //
///////////////

io.on("connection", async socket => {
  const sessionId = await cookieSession(socket);

  if (sessionId in allSessions) {
    allSessions[sessionId].socketId = socket.id

    io.emit("player - update all", allSessions)

    if (!game) {
      if (onlineSesssionsAmt() >= minimumPlayers) {
        game = new Game(allSessions);
        game.nouns = await allNouns()
        game.drawer = await game.newDrawer()

        io.emit("game - new round", {
          currentDrawer: game.drawer,
          words: game.randomWords()
        })
      }
    }

    // Game Functions
    socket.on("game - new round", async () => {
      game.drawer = await game.newDrawer()

      messagesMemmory = []
      game.drawings = []

      io.emit("game - new round", {
        currentDrawer: game.drawer,
        words: game.randomWords()
      })
    })

    socket.on("game - picked a word", word => {
      game.correctWord = word;

      io.emit("game - round start", game.drawer)
    })

    socket.on("game - round start", () => {
      let counter = 0;

      game.timer = setInterval(async () => {
        if (counter >= ROUND_LENGTH) {
          clearInterval(game.timer)
          counter = 0;

          const roundData = await game.endRound();

          io.emit("game - round end", roundData)
        } else {
          counter++

          io.emit("game - round timer", {
            time: counter,
            percentage: (counter/ROUND_LENGTH) * 100
          })
        }
      }, 1)
    })

    socket.emit("player - joined/update", {drawings: !game ? [] : game.drawings, messages: messagesMemmory})

    socket.broadcast.emit("player - joined", socket.id)

    socket.on("canvas - save/broadcast", (drawing, id) => {
      game.drawings[id] = drawing;

      socket.broadcast.emit("canvas - render", drawing)
    })

    socket.on("message - create", async val => {
      const msg = new Message(sessionId, val)

      messagesMemmory.push(msg);

      io.emit("message - render", msg)

      if (game) {
        const correct = await game.checkGuess(val)

        if (correct) {
          clearInterval(game.timer)

          // End the round and return data about winner, drawer
          const roundData = await game.endRound(allSessions[sessionId]);

          io.emit("game - round end", roundData);
        }
      }
    })

    socket.on("canvas - clear all", () => {
      game.drawings = [];

      io.emit("canvas - clear")
    })

    socket.on("disconnect", () => {
      allSessions[sessionId].socketId = undefined;

      io.emit("player - update all", allSessions)
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

  for (let s in allSessions) {
    if (allSessions[s].socketId) temp++
  }

  return temp
}

function allNouns() {
  return new Promise((resolve, reject) => {
    fs.readFile("nounlist.json", (err, data) => {
      if (err) throw err;
      resolve(JSON.parse(data));
    })
  })
}
