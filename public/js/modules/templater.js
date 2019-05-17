export default class {
  constructor(template) {
    this.template = template;
  }

  parse() {
    return new Promise((resolve, reject) => {
      // const rx = /(?:\<(\/)?(\w+)\>|\^(.+)\^)/g,
      const rx = /(?:\<(\/)?(\w+)(?:\s(.+?))?\>|\^(.+)\^)/g,
            memory = [];
      let results;

      while (results = rx.exec(this.template)) {
        const closing = results[1],
              tagName = results[2],
              attributes = results[3],
              text = results[4]

        if (!closing && tagName) {
          memory.push(document.createElement(tagName))
          if (attributes) {
            const attrRx = /([\w-]+)="(.+?)"/g;
            let attrResults;

            while (attrResults = attrRx.exec(attributes)) {
              memory[memory.length - 1].setAttribute(attrResults[1], attrResults[2])
            }
          }
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
