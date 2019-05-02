"use strict";

const socket = io();

console.log("in lobby")

socket.on("player joined", data => {
  console.log("CUNT JOINED", data.sessionId)
})

socket.on("tst", () => console.log("TESTING"))
