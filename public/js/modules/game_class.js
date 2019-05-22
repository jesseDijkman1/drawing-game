import socket from "./socketIO.js";
import Templater from "./templater.js";
import Timer from "./timer_class.js";

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
    socket.emit("canvas - save/broadcast", drawing, this.drawingsAmt)
  }

  clearCanvas() {
    socket.emit("canvas - clear all")
  }

  clearChat() {
    socket.emit("message - clear all")
  }

  async pickWord(words) {
    const template = `
    <section class="words-menu" data-time="5">
      <button type="button" value="${words[0]}">^${words[0]}^</button>
      <button type="button" value="${words[1]}">^${words[1]}^</button>
      <button type="button" value="${words[2]}">^${words[2]}^</button>
      <button type="button" value="${words[3]}">^${words[3]}^</button>
    </section>`;

    const wordsMenu = await new Templater(template).parse();

    this.canvContainer.appendChild(wordsMenu);

    const wordsOptions = this.canvContainer.querySelectorAll(".words-menu button")

    return new Promise((resolve, reject) => {
      const timer = new Timer(0, 5000, 1000)

      for (let i = 0; i < wordsOptions.length; i++) {
        wordsOptions[i].addEventListener("click", e => {
          this.canvContainer.removeChild(wordsMenu);
          timer.clear()

          resolve(e.target.value)
        })
      }

      timer.interval((timeUp, timeDown) => {
        wordsMenu.setAttribute("data-time", timeDown / 1000)
      })

      timer.timeout(() => {
        this.canvContainer.removeChild(wordsMenu)

        resolve(words[Math.floor(Math.random() * words.length)])
      })
    })
  }

  async roundEnd(data) {
    const timer = new Timer(0, 5000, 1000)

    const template = `
    <section id="round-winner">
      <h1>^Winner: ${data.winner.name}^</h1>
      <h2>^Answer: ${data.correctWord}^</h2>
    </section>
    `;

    const el = await new Templater(template).parse();

    this.canvContainer.appendChild(el);

    const roundWinner = this.canvContainer.querySelector("#round-winner");


    timer.timeout(() => {
      // Announce the next drawer
      const timer_2 = new Timer(0, 3000, 1000);

      timer.interval((timeUp, timeDown) => {
        const template_2 = `
        <h1>Next drawer<h1>
        <p>Round starts in ${timeDown / 1000}</p>
        `;

        roundWinner.innerHTML = template_2;
      })
    })
  }
}
