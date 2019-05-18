import socket from "./socketIO.js";
import Templater from "./templater.js"

export default class {
  constructor(canvContainer, canv, chat, scoreboard) {
    this.canvContainer = canvContainer;
    this.canvas = canv;
    this.ctx = canv.getContext("2d");
    this.chat = chat;
    this.scoreboard = scoreboard
    this.drawingsAmt = 0;
    this.minimumPlayers = 2;
    this.players = {};
    this.currentDrawerId = undefined;

    socket.on("canvas - clear", () => this.clearCanvas())

    socket.on("drawing - render", drawing => this.renderDrawing(drawing))

    socket.on("message - render", message => this.renderMessage(message))

    socket.on("player - update all", players => {
      this.players = players;


      if (Object.keys(this.players).length >= this.minimumPlayers) {
        this.updateGameStartIndicator(true)
      } else {
        this.updateGameStartIndicator()
      }

      this.updateScoreboard()
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
    })
  }

  start(isDrawer) {

  }

  showDrawerUI() {

  }

  hideDrawerUI() {
    const options = this.canvContainer.querySelector(".canvas-options");

    options.style.display = "none"
  }

  async updateGameStartIndicator(remove = undefined) {
    console.log(remove)
      const template = `
      <div id="game-waiter">
        <p>^Waiting for players^</p>
        <h1>^${Object.keys(this.players).length}/${this.minimumPlayers}^</h1>
      </div>`;

      const el = await new Templater(template).parse();

      try {
        const waiter = this.canvContainer.querySelector("#game-waiter")
        if (remove) {
          console.log("removing")
          this.canvContainer.removeChild(waiter)
        } else {
          this.canvContainer.replaceChild(el, waiter)
        }
      } catch (e) {
        if (!remove) {
          console.log("appending")
          this.canvContainer.appendChild(el)
        }
      }
  }

  async updateScoreboard() {
    const temp = [];

    for (let player in this.players) {
      temp.push(`
        <tr>
          <td>^${player}^</td>
          <td>^${this.players[player].score}^</td>
        </tr>
        `)
    }

    const scoreboardTemplate = `
      <table>
        <tr>
          <th>^User^</th>
          <th>^Score^</th>
        </tr>
        ${temp.join("\n")}
      </table>
      `;


    const el = await new Templater(scoreboardTemplate).parse();

    try {
      const scoreboard = this.scoreboard.querySelector("table")
      this.scoreboard.replaceChild(el, scoreboard)
    } catch (e) {
      this.scoreboard.appendChild(el)
    }
  }

  renderDrawing(drawing) {
    if (socket.id == this.currentDrawerId || this.currentDrawerId == undefined) {
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
    if (socket.id == this.currentDrawerId || this.currentDrawerId == undefined) {
      socket.emit("drawing - save/broadcast", drawing, this.drawingsAmt)
    }
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
