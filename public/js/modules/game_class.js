import socket from "./socketIO.js";
import Templater from "./templater.js"

export default class {
  constructor(canv, chat) {
    this.ctx = canv.getContext("2d");
    this.chat = chat;
    this.drawingsAmt = 0;

    socket.on("drawing - render", drawing => {
      this.renderDrawing(drawing);
    })

    socket.on("message - render", message => {
      this.renderMessage(message);
    })

    socket.on("player - joined", data => {
      this.drawingsAmt = data.drawings.length;

      data.drawings.forEach(drawing => {
        this.renderDrawing(drawing);
      })

      data.messages.forEach(message => {
        this.renderMessage(message);
      })
    })
  }

  renderDrawing(drawing) {
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
      <header>^${message.userId}^</header>
      <p>^${message.value}^</p>
      <footer>^${message.time}^</footer>
    </${this.chat.nodeName == "UL" ? "li" : "div"}>`;

    const msgEl = await new Templater(template, message).parse();

    this.chat.appendChild(msgEl)
  }

  broadcastDrawing(drawing) {
    socket.emit("drawing - save/broadcast", drawing, this.drawingsAmt)
  }

  broadcastMessage(message) {
    socket.emit("message - save/broadcast", message)
  }
}
