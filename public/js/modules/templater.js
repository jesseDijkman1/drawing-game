export default class {
  constructor(template, data) {
    this.template = template;
    this.data = data;
  }

  parse() {
    return new Promise((resolve, reject) => {
      const rx = /(?:\<(\/)?(\w+)\>|\^(.+)\^)/g,
            memory = [];
      let results;

      while (results = rx.exec(this.template)) {
        const closing = results[1],
              tagName = results[2],
              text = results[3];

        if (!closing && tagName) {
          memory.push(document.createElement(tagName))
        } else if (closing && tagName) {
          if (memory.length > 1) {
            const done = memory.pop()
            memory[memory.length - 1].appendChild(done)
          } else {
            resolve(memory.pop())
          }
        } else if (text) {
          memory[memory.length - 1].appendChild(document.createTextNode(text))
        }
      }
    })
  }
}
