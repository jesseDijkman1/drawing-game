import socket from "./socketIO.js";
import Templater from "./templater.js"

export default class {
  constructor(main, canv, chat) {
    this.main = main;
    this.canvas = canv;
    this.ctx = canv.getContext("2d");
    this.chat = chat;
    this.drawingsAmt = 0;
    this.maxPlayers = 5;
    this.players = {};

    socket.on("canvas - clear", () => {
      this.clearCanvas()
    })

    socket.on("drawing - render", drawing => {
      this.renderDrawing(drawing);
    })

    socket.on("message - render", message => {
      this.renderMessage(message);
    })

    socket.on("player - joined/update", data => {
      this.drawingsAmt = data.drawings.length;
      this.players = data.users

      data.drawings.forEach(drawing => {
        this.renderDrawing(drawing);
      })

      data.messages.forEach(message => {
        this.renderMessage(message);
      })

      this.updateUsers()
    })

    socket.on("player - joined", userId => {
      this.updateUsers(userId, true)
    })

    socket.on("player - left", userId => {
      this.updateUsers(userId, false)
    })
  }

  async updateUsers(userId = undefined, joined = undefined) {
    if (userId) {
      if (joined) {
        this.players[userId] = {};
      } else {
        delete this.players[userId]
      }
    }

    const usersAmt = Object.keys(this.players).length;

    if (usersAmt == this.maxPlayers) {
      console.log("start the game")
    } else {
      const template = `<div id="game-waiter"><p>^Waiting for players ${usersAmt}/${this.maxPlayers}^</p></div>`;

      const el = await new Templater(template).parse();
      const waiter = this.main.querySelector("#game-waiter");

      if (waiter) {
        this.main.replaceChild(el, waiter)
      } else {
        this.main.appendChild(el)
      }
    }
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

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
  }

  broadcastClearCanvas() {
    socket.emit("drawing - clear all")
  }
}
