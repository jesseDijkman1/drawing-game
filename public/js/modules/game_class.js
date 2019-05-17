import socket from "./socketIO.js";
import Templater from "./templater.js"

export default class {
  constructor(canv, chat) {
    this.ctx = canv.getContext("2d");
    this.chat = chat;
    this.drawingsAmt = 0;

    socket.on("drawing - render", drawing => {
      this.renderDrawings(drawing)
    })

    socket.on("player - joined", drawings => {
      this.drawingsAmt = drawings.length;

      drawings.forEach(drawing => {
        this.renderDrawings(drawing)
      })
    })
  }

  renderDrawings(drawing) {
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

  async renderMessage(message) {
    const template = `
    <${this.chat.nodeName == "UL" ? "li" : "div"}>
      <header>^userId^</header>
      <p>^value^</p>
      <footer>^time^</footer>
    </${this.chat.nodeName == "UL" ? "li" : "div"}>`;

    const msgEl = await new Templater(template, message).parse();

    this.chat.appendChild(msgEl)



  }

  broadcast(drawing) {
    socket.emit("drawing - save/broadcast", drawing, this.drawingsAmt)
  }
}
