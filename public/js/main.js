"use strict";

const socket = io();

const canvas = document.querySelector("canvas");
const chat = document.querySelector("#room-chat .chat-messages");

(() => {
  canvas.setAttribute("width", canvas.offsetWidth)
  canvas.setAttribute("height", canvas.offsetHeight)
})()

class Drawing {
  constructor(target) {
    this.ctx = target.getContext("2d");
    this.points = [];
  }

  addPoint(point) {
    this.points.push(point)
  }

  render() {
    this.points.forEach((p, i, a) => {
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

class Point {
  constructor(e) {
    this.x = e.clientX - e.target.offsetLeft;
    this.y = e.clientY - e.target.offsetTop;
  }
}

function startDrawing(e) {
  const startX = e.clientX,
        startY = e.clientY,
        drawing = new Drawing(e.currentTarget);

  window.addEventListener("mousemove", isDrawing)
  window.addEventListener("mouseup", endDrawing)
  
  e.target.addEventListener("mouseleave", endDrawing)

  function isDrawing(ev) {
    drawing.addPoint(new Point(ev))
    drawing.render()
  }

  function endDrawing(ev) {
    drawing.render()

    window.removeEventListener("mousemove", isDrawing)
  }
}

canvas.addEventListener("mousedown", startDrawing)
