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
    players: 0
  },
  {
    difficulty: "medium",
    maxPlayers: 10,
    players: 0
  },
  {
    difficulty: "hard",
    maxPlayers: 10,
    players: 0
  }
]
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
  res.render("lobby.ejs", {rooms: rooms})


  updateSessions(req) // Probably useless
})

app.get("/room/:id", (req, res) => {
  const roomIndex = parseInt(req.params.id);

  res.render("room.ejs", {roomData: rooms[roomIndex], roomId: roomIndex})
})





///////////////
//  Sockets  //
///////////////

io.on("connection", async (socket) => {
  console.log("NEW CONNECTION")
  const session = await cookieSession(socket)

  checkSession(session, socket.id)

  socket.on("disconnect", () => {
    console.log(`${socket.id} disconnected`)
    checkSession(session, null)

  })
})

function checkSession(session, socketID) {
  if (session in activeSessions) {
    activeSessions[session].socketID = socketID;
    console.log("UPDATE", activeSessions)
  } else {
    activeSessions[session] = {
      socketID: socketID
    }

    console.log("NEW", activeSessions)
  }
}

function updateSessions(req) {
  const all = Object.keys(req.sessionStore.sessions);

  console.log(all)

  for (let s in activeSessions) {
    if (!all.includes(s)) {
      delete activeSessions[s]
    }
  }
}

function cookieSession(socket) {
  return new Promise((resolve, reject) => {
    const rough = cookie.parse(socket.request.headers.cookie)["connect.sid"],
          rx = /(?<=s:).+?(?=\.)/;

    resolve(rx.exec(rough)[0])
  })
}

server.listen(port, () => console.log(`Listening to port: ${port}`));
