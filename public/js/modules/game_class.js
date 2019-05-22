import socket from "./socketIO.js";
import Templater from "./templater.js"

const _onlineClients = [];

export default class {
  constructor(canvContainer, canv, chat, scoreboard) {
    this.canvContainer = canvContainer;
    this.canvas = canv;
    this.ctx = canv.getContext("2d");
    this.chat = chat;
    this.scoreboard = scoreboard
    this.drawingsAmt = 0;
    this.minimumPlayers = 2;
    this.allPlayers = {};
    this.currentDrawerId = undefined;

    socket.on("message - render", data => this.renderMessage(data))

    socket.on("canvas - clear", () => {
      this.ctx.clearRect(0, 0, this.canvas.offsetWidth, this.canvas.offsetHeight);
    })

    socket.on("message - clear", () => {
      this.chat.innerHTML = "";
    })

    socket.on("drawing - render", drawing => this.renderDrawing(drawing))

    socket.on("game - update timer", percentage => {
      this.canvContainer.querySelector("#timer").style.width = `${percentage}%`
    })

    socket.on("player - update all", players => {
      this.allPlayers = players;
      this.onlinePlayers = this.allPlayers;

      // if (this.onlinePlayers.length >= this.minimumPlayers) {
      //   this.updateGameStartIndicator(true)
      // } else {
      //   this.updateGameStartIndicator()
      // }

      this.updateScoreboard()
    })

    socket.on("player - joined/update", data => {
      this.drawingsAmt = data.drawings.length;
      this.allPlayers = data.users

      data.drawings.forEach(drawing => {
        this.renderDrawing(drawing);
      })

      data.messages.forEach(message => {
        this.renderMessage(message);
      })
    })
  }

  get onlinePlayers() {
    return _onlineClients
  }

  set onlinePlayers(all) {
    let temp = 0;

    for (let p in all) {
      if (all[p].socketId) {
        if (_onlineClients.indexOf(p) < 0) {
          _onlineClients.push(p)
        }

      } else {
        const i = _onlineClients.indexOf(p);

        if (i > 0) {
          _onlineClients.splice(i, 1)
        }
      }
    }
  }

  start(isDrawer) {
  }

  async updateGameStartIndicator(remove = undefined) {
      const template = `
      <div id="game-waiter">
        <p>^Waiting for players^</p>
        <h1>^${this.onlinePlayers.length}/${this.minimumPlayers}^</h1>
      </div>`;

      const el = await new Templater(template).parse();

      try {
        const waiter = this.canvContainer.querySelector("#game-waiter")
        if (remove) {
          this.canvContainer.removeChild(waiter)
        } else {
          this.canvContainer.replaceChild(el, waiter)
        }
      } catch (e) {
        if (!remove) {
          this.canvContainer.appendChild(el)
        }
      }
  }

  async updateScoreboard() {
    const temp = [];

    for (let player in this.allPlayers) {
      if (this.onlinePlayers.includes(player)) {
        temp.push(`
          <tr>
            <td>^${this.allPlayers[player].name}^</td>
            <td>^${this.allPlayers[player].score}^</td>
          </tr>
          `)
      }
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

  async renderMessage(data) {
    const template = `
    <${this.chat.nodeName == "UL" ? "li" : "div"} class="user-message ${(data.user.socketId == socket.id) ? 'my-message' : null}">
      <strong ${data.connected ? 'style="display:none"' : null}>^${data.user.name || data.user.socketId}^</strong>
      <div>
        <p>^${data.msg}^</p>
        <span>^${data.time}^</span>
      </div>
    </${this.chat.nodeName == "UL" ? "li" : "div"}>`;

    const msgEl = await new Templater(template).parse();

    this.chat.appendChild(msgEl)
  }

  broadcastDrawing(drawing) {
    socket.emit("drawing - save/broadcast", drawing, this.drawingsAmt)
  }

  clearCanvas() {
    socket.emit("drawing - clear all")
  }

  clearChat() {
    socket.emit("message - clear all")
  }

}
