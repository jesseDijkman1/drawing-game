import socket from "./socketIO.js";

export default class {
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

  broadcast(drawing) {
    console.log(drawing)
  }
}
