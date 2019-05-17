"use strict";

import Game from "./modules/game_class.js";
import PenPreview from "./modules/penPreview_class.js";
import Drawing from "./modules/drawing_class.js";
import Message from "./modules/chatMessage_class.js"
import socket from "./modules/socketIO.js";

const canvas = document.getElementById("main-canvas");
const chat = document.querySelector("#chat-container .chat-messages");

const penPreview = document.querySelector("#pen-preview div");
const allSliders = document.querySelectorAll(".option input");

const penColor = document.querySelector(".pen-option-color");
const penSize = document.querySelector(".pen-option-size");

const chatForm = document.querySelector("#chat-container form");

const game = new Game(canvas, chat)

void function iife() {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)

  for (let i = 0; i < allSliders.length; i++) {
    allSliders[i].addEventListener("mousedown", startSliding)
  }

  canvas.addEventListener("mousedown", startDrawing)

  chatForm.addEventListener("submit", submitChatMsg)

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
      x: ev.clientX - ev.target.offsetLeft,
      y: ev.clientY - ev.target.offsetTop
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
  const msg = new Message(input.value);

  game.renderMessage(msg);
  game.broadcastMessage(msg);

  // Reset the input
  input.value = ""
}
