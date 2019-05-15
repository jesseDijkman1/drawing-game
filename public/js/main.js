"use strict";

import Game from "./modules/game_class.js";
import PenPreview from "./modules/penPreview_class.js";
import Drawing from "./modules/drawing_class.js";

const canvas = document.querySelector("canvas");
const chat = document.querySelector("#room-chat .chat-messages");

const penPreview = document.querySelector("#pen-preview div");
const allSliders = document.querySelectorAll(".option input");

const penColor = document.querySelector(".pen-option-color");
const penSize = document.querySelector(".pen-option-size");

const game = new Game(canvas)

void function iife() {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)

  for (let i = 0; i < allSliders.length; i++) {
    allSliders[i].addEventListener("mousedown", startSliding)
  }

  canvas.addEventListener("mousedown", startDrawing)

  new PenPreview(penPreview, penColor, penSize)
}()

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

    game.render(drawing)
    game.broadcast(drawing)
  }

  function endDrawing(ev) {
    window.removeEventListener("mousemove", isDrawing)

    setTimeout(() => {
      window.removeEventListener("mouseup", endDrawing)
      ev.target.removeEventListener("mouseleave", endDrawing)
    }, 0)
  }
}

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
