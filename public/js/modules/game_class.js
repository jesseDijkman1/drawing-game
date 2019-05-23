import socket from "./socketIO.js";
import Templater from "./templater.js";
import Timer from "./timer_class.js";
import * as templates from "./templates.js"

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

  reset() {
    const cWidth = this.canvas.getAttribute("width")
    const cHeight = this.canvas.getAttribute("height")

    this.ctx.clearRect(0, 0, cWidth, cHeight);

    this.chat.innerHTML = "";

    this.canvContainer.querySelector("#timer").style.width = "100%";

    if (this.canvContainer.querySelector(".word-reminder")) {
      this.canvContainer.querySelector(".word-reminder").remove()
    }
  }


  async updateGameStartIndicator(remove = undefined) {
      const template = `
      <div id="game-waiter">
        <p>^Waiting for players^</p>
        <h1>^${this.onlinePlayers.length}/${this.minimumPlayers}^</h1>
      </div>`;

      const el = new Templater(template).parse();

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

    const el = new Templater(scoreboardTemplate).parse();

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

    const msgEl = new Templater(template).parse();

    this.chat.appendChild(msgEl)
  }

  broadcastDrawing(drawing) {
    socket.emit("canvas - save/broadcast", drawing, this.drawingsAmt)
  }

  async pickWord(words) {
    const template = `
    <section class="words-menu">
      <button type="button" value="${words[0]}">^${words[0]}^</button>
      <button type="button" value="${words[1]}">^${words[1]}^</button>
      <button type="button" value="${words[2]}">^${words[2]}^</button>
      <button type="button" value="${words[3]}">^${words[3]}^</button>
    </section>`;

    const wordsMenu = new Templater(template).parse();

    this.canvContainer.appendChild(wordsMenu);

    const wordsOptions = this.canvContainer.querySelectorAll(".words-menu button")

    return new Promise((resolve, reject) => {
      const timer = new Timer(0, 3000, 1000, true);
      const timer_2 = new Timer(0, 5000, 1000, true);

      for (let i = 0; i < wordsOptions.length; i++) {
        wordsOptions[i].addEventListener("click", async e => {
          this.canvContainer.removeChild(wordsMenu);
          timer_2.clear()

          const pickedWord = new Templater(templates.pickedWord(e.target.value)).parse();

          this.canvContainer.appendChild(pickedWord)

          resolve(e.target.value)
        })
      }

      timer_2.interval((timeUp, timeDown) => {
        wordsMenu.setAttribute("data-time", timeDown / 1000);
      })

      timer_2.timeout(() => {
        const randomWord = words[Math.floor(Math.random() * words.length)]

        this.canvContainer.removeChild(wordsMenu)

        const pickedWord = new Templater(templates.pickedWord(randomWord)).parse();

        this.canvContainer.appendChild(pickedWord)

        timer.timeout(() => resolve(randomWord))
      })
    })
  }

  roundStartCounter(externalTime = undefined) {
    if (!externalTime) {
      const timer = new Timer(0, 3000, 1000, true);

      return new Promise((resolve, reject) => {
        timer.interval((timeUp, timeDown) => {
          const counter = new Templater(templates.counter(timeDown / 1000)).parse()

          this.gamePopUp(counter, true)
        })

        timer.timeout(() => {
          this.canvContainer.querySelector(".pop-up").remove()
          resolve()
        })
      })
    } else {
      const counter = new Templater(templates.counter(externalTime / 1000)).parse()
      this.gamePopUp(counter, true)
    }
  }

  roundTimer(data) {
    const timerEl = this.canvContainer.querySelector("#timer")
    timerEl.style.width = `${100 - data.percentage}%`
  }


  async gamePopUp(content, replace = undefined) {
    const el = this.canvContainer.querySelector(".pop-up") || new Templater(templates.popUp()).parse()

    if (replace) {
      if (this.canvContainer.querySelector(".pop-up")) {
        el.innerHTML = "";
        el.appendChild(content)
      } else {
        el.appendChild(content)
        this.canvContainer.appendChild(el)
      }
    } else {
      el.appendChild(content);

      this.canvContainer.appendChild(el);
    }
  }

  drawerUI() {
    const penOptions = this.canvContainer.querySelector(".canvas-options");
    penOptions.style.display = "flex";
  }

  spectatorUI() {
    const penOptions = this.canvContainer.querySelector(".canvas-options");
    penOptions.style.display = "none";
  }
}
