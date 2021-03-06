"use strict";

import Game from "./modules/game_class.js";
import PenPreview from "./modules/penPreview_class.js";
import Drawing from "./modules/drawing_class.js";
import socket from "./modules/socketIO.js";

const canvContainer = document.querySelector("#room-content .canvas-container");
const canvas = document.getElementById("main-canvas");
const chat = document.querySelector("#game-extras .chat-container .chat-messages");
const scoreboard = document.querySelector("#game-extras .scoreboard-container");
const canvasOptions = document.querySelector(".canvas-options");

const penPreview = document.querySelector("#pen-preview div");
const allSliders = document.querySelectorAll(".option input[type=range]");

const canvasClear = document.getElementById("canvas-clear");

const penColor = document.querySelector(".pen-option-color");
const penSize = document.querySelector(".pen-option-size");

const chatForm = document.querySelector("#game-extras .chat-container form");

const game = new Game(canvContainer, canvas, chat, scoreboard)

void function iife() {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)

  for (let i = 0; i < allSliders.length; i++) {
    allSliders[i].addEventListener("mousedown", startSliding)
  }

  chatForm.addEventListener("submit", e => e.preventDefault())
  chatForm.addEventListener("submit", submitChatMsg)

  canvasClear.addEventListener("click", () => {
    game.clearCanvas()
  })

  new PenPreview(penPreview, penColor, penSize)
}()


///////////////////////
//  Drawing Section  //
///////////////////////


function startDrawing(e) {
  const startX = e.clientX,
        startY = e.clientY,
        drawing = new Drawing(e.currentTarget, penColor, penSize);

  window.addEventListener("mousemove", isDrawing)
  window.addEventListener("mouseup", endDrawing)
  e.target.addEventListener("mouseleave", endDrawing)

  function isDrawing(ev) {
    drawing.addPoint({
      x: ev.clientX - ev.target.parentElement.offsetLeft,
      y: ev.clientY - ev.target.parentElement.offsetTop
    })

    game.renderDrawing(drawing)
    game.broadcastDrawing(drawing)
  }

  function endDrawing(ev) {
    game.drawingsAmt++;

    window.removeEventListener("mousemove", isDrawing)

    setTimeout(() => {
      window.removeEventListener("mouseup", endDrawing)
      ev.target.removeEventListener("mouseleave", endDrawing)
    }, 0)
  }
}

////////////////////////////
//  Pen Settings Section  //
////////////////////////////

function startSliding(e) {
  window.addEventListener("mousemove", isSliding)
  e.target.addEventListener("change", isSliding)
  window.addEventListener("mouseup", endSliding)

  function isSliding() {
    new PenPreview(penPreview, penColor, penSize)
  }

  function endSliding() {
    window.removeEventListener("mousemove", isSliding)

    setTimeout(() => {
      window.removeEventListener("mouseup", endSliding)
    }, 0)
  }
}

////////////////////
//  Chat Section  //
////////////////////

function submitChatMsg(e) {
  e.preventDefault()

  const input = e.target.querySelector("input");

  socket.emit("message - create", input.value)

  input.value = ""
}

//////////////////////////////
//  Socket Event Listeners  //
//////////////////////////////

// +++++++++++++++ //
// + Game Events + //
// +++++++++++++++ //

socket.on("game - new round", async data => {
  game.reset()

  chatForm.addEventListener("submit", submitChatMsg)

  if (data.currentDrawer.socketId == socket.id) {
    chatForm.removeEventListener("submit", submitChatMsg)

    const word = await game.pickWord(data.words);

    game.drawerUI()

    socket.emit("game - picked a word", word);
  } else {
    game.spectatorUI()
  }
})

socket.on("game - round start", async data => {
  // game.reset()

  await game.roundStartCounter()

  if (socket.id == data.socketId) {
    canvas.addEventListener("mousedown", startDrawing);

    socket.emit("game - round start")
  }
})

socket.on("game - round timer", data => {
  game.roundTimer(data)
})

socket.on("game - round end", async data => {
  await game.roundWinner(data)
  console.log("next step")
  game.allPlayers = data.users;
  game.updateScoreboard()



  if (socket.id == data.drawer.socketId) {
    socket.emit("game - new round")

    canvas.removeEventListener("mousedown", startDrawing)
  }
})

// ++++++++++++++++++ //
// + Message Events + //
// ++++++++++++++++++ //

socket.on("message - render", data => game.renderMessage(data))

// +++++++++++++++++ //
// + Canvas Events + //
// +++++++++++++++++ //

socket.on("canvas - clear", () => {
  game.ctx.clearRect(0, 0, game.canvas.offsetWidth, game.canvas.offsetHeight);
})

socket.on("canvas - render", drawing => game.renderDrawing(drawing))

// +++++++++++++++++ //
// + Player Events + //
// +++++++++++++++++ //

socket.on("player - update all", players => {
  game.allPlayers = players;
  game.onlinePlayers = game.allPlayers;

  if (game.onlinePlayers.length >= game.minimumPlayers) {
    game.updateGameStartIndicator(true)
  } else {
    game.updateGameStartIndicator()
  }

  game.updateScoreboard()
})

socket.on("player - joined/update", data => {
  game.drawingsAmt = data.drawings.length;
  game.allPlayers = data.users

  data.drawings.forEach(drawing => {
    game.renderDrawing(drawing);
  })

  data.messages.forEach(message => {
    game.renderMessage(message);
  })
})
