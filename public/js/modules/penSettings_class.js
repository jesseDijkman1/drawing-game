export default class {
  constructor() {}

  get color() {
    return this.penColor;
  }

  set color(inputs) {
    const data = {}

    for (let i = 0; i < inputs.length; i++) {
      data[inputs[i].dataset.char] = `${inputs[i].value}${inputs[i].dataset.unit || ""}`
    }

    this.penColor = `${Object.keys(data).join("")}(${Object.values(data).join(",")})`
  }

  get size() {
    this.size = this.sizeInput

    return this.penSize;
  }

  set size(input) {
    this.penSize = input.value;
  }
}
