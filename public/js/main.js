"use strict";

const socket = io();

const canvas = document.querySelector("canvas");
const chat = document.querySelector("#room-chat .chat-messages");

const penPreview = document.querySelector("#pen-preview div");
const allSliders = document.querySelectorAll(".option input");

const penColor = document.querySelector(".pen-option-color");
const penSize = document.querySelector(".pen-option-size");


(() => {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)

  for (let i = 0; i < allSliders.length; i++) {
    allSliders[i].addEventListener("mousedown", startSliding)
  }

  canvas.addEventListener("mousedown", startDrawing)
})()

class Game {
  constructor(c) {
    this.ctx = c.getContext("2d");
    this.drawings;
  }

  render(drawing) {
    this.ctx.lineJoin = "round";
    this.ctx.strokeStyle = drawing.penColor;
    this.ctx.lineWidth = drawing.penSize;

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
  constructor() {}

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

  get size() {
    this.size = this.sizeInput

    return this.penSize;
  }

  set size(input) {
    this.penSize = input.value;
  }
}

class PenPreview extends PenSettings{
  constructor(preview, penColor, penSize) {
    super()

    this.element = preview;
    super.color = penColor.querySelectorAll("input");
    super.size = penSize.querySelector("input");

    this.update()
  }

  update() {
    console.log("uh")
    this.element.style.background = this.penColor
    this.element.style.width = `${this.penSize}px`
    this.element.style.height = `${this.penSize}px`
  }
}

new PenPreview(penPreview, penColor, penSize)

class Drawing extends PenSettings {
  constructor(target, penColor, penSize) {
    super()

    super.color = penColor.querySelectorAll("input");
    super.size = penSize.querySelector("input");

    this.points = [];
  }

  addPoint(point) {
    this.points.push(point)
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
    drawing.addPoint({
      x: ev.clientX - ev.target.offsetLeft,
      y: ev.clientY - ev.target.offsetTop
    })

    game.render(drawing)
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
