export function pickedWord(word) {
  return `<h2 class="word-reminder">^Your word is: ${word}^</h2>`;
}

export function nextDrawer(name) {
  return `<h2>^The next drawer is: ${name}^</h2>`
}

export function roundWinner(name) {
  return `<h2>${name} guessed the word</h2>`
}

export function counter(time) {
  return `<h1>^${time}^</h1>`;
}

export function popUp() {
  return `<section class="pop-up"></section>`
}

export function gameStarting(time) {
  return `<h2>^Game starting in ${time}^</h2>`
}
