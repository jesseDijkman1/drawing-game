import socket from "./socketIO.js";

export default class {
  constructor() {
    this.ctx = document.getElementById("main-canvas").getContext("2d");
    this.drawingsAmt = 0;

    socket.on("drawing - render", drawing => {
      this.render(drawing)
    })

    socket.on("player - joined", drawings => {
      this.drawingsAmt = drawings.length;

      drawings.forEach(drawing => {
        this.render(drawing)
      })
    })
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

  broadcast(drawing) {
    socket.emit("drawing - save/broadcast", drawing, this.drawingsAmt)
  }
}
