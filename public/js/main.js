"use strict";

const socket = io();

const canvas = document.querySelector("canvas");
const chat = document.querySelector("#room-chat .chat-messages");

const penColor = document.querySelector(".pen-option-color");
const penSize = document.querySelector(".pen-option-size");

(() => {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)
})()

class Game {
  constructor(c) {
    this.ctx = c.getContext("2d");
    this.drawings;
  }

  render(drawing) {

    this.ctx.strokeStyle = drawing.drawingColor;
    this.ctx.lineJoin = "round";
    // this.ctx.lineWidth = 100;

    drawing.points.forEach((p, i, a) => {
      this.ctx.beginPath();

      if (i == 0) {
        this.ctx.moveTo(this.x, this.y)
      } else {
        this.ctx.moveTo(a[i - 1].x, a[i - 1].y)
      }

      this.ctx.lineTo(p.x, p.y)
      this.ctx.closePath()
      this.ctx.stroke()
    })
  }
}

const game = new Game(canvas)

class PenSettings {
  constructor(colorsContainer, sizeContainer) {
    this.colorInputs = colorsContainer.querySelectorAll("input");
    this.sizeContainer = sizeContainer.childElements;
    this.penColor;

  }

  get color() {
    this.color = this.colorInputs

    return this.penColor;
  }

  set color(inputs) {
    const data = {}

    for (let i = 0; i < inputs.length; i++) {
      data[inputs[i].dataset.char] = `${inputs[i].value}${inputs[i].dataset.unit || ""}`
    }

    this.penColor = `${Object.keys(data).join("")}(${Object.values(data).join(",")})`
  }
}

class Drawing extends PenSettings {
  constructor(target, penColor, penSize) {
    super(penColor, penSize)

    this.drawingColor = super.color;
    this.points = [];
  }

  addPoint(point) {
    this.points.push(point)
  }
}

class Point {
  constructor(e, target) {
    this.x = e.clientX - target.offsetLeft;
    this.y = e.clientY - target.offsetTop;
  }
}

function startDrawing(e) {
  const startX = e.clientX,
        startY = e.clientY,
        drawing = new Drawing(e.currentTarget, penColor, penSize);

  window.addEventListener("mousemove", isDrawing)
  window.addEventListener("mouseup", endDrawing)

  e.target.addEventListener("mouseleave", endDrawing)

  function isDrawing(ev) {
    drawing.addPoint(new Point(ev, ev.target.parentElement))

    game.render(drawing)
  }

  function endDrawing(ev) {
    // drawing.render()

    window.removeEventListener("mousemove", isDrawing)
  }
}

canvas.addEventListener("mousedown", startDrawing)
