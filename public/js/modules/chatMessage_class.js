import socket from "./socketIO.js";

export default class {
  constructor(msg) {
    this.userId = socket.id;
    this.message = msg;
    this.time = this.time(new Date());
  }

  time(date) {
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours < 10 ? 0 : ""}${hours}:${minutes < 10 ? 0 : ""}${minutes}`
  }
 }
