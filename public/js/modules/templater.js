export default class {
  constructor(template, data) {
    this.template = template;
    this.data = data;
  }

  parse() {
    return new Promise((resolve, reject) => {


    const rx = /(?:\<(\/)?(\w+)\>|\^([\§\±\$\_\w]+)\^)/g;

    let results;

    const save = [];

    while (results = rx.exec(this.template)) {
      const closing = results[1];
      const tagName = results[2];
      const dataKey = results[3];

      if (!closing && tagName) {
        save.push(document.createElement(tagName))
      } else if (closing && tagName) {
        console.log("closing tag", tagName)

        if (save.length > 1) {
          const done = save.pop()
          save[save.length - 1].appendChild(done)
        } else {
          resolve(save.pop())
        }



      } else if (dataKey) {
        save[save.length - 1].appendChild(document.createTextNode(this.data[dataKey]))


        console.log("data key", dataKey)
      }
    }
    })
  }
}
