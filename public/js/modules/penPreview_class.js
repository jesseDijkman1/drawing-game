import PenSettings from "./penSettings_class.js"

export default class extends PenSettings {
  constructor(preview, penColor, penSize) {
    super()

    this.element = preview;
    super.color = penColor.querySelectorAll("input");
    super.size = penSize.querySelector("input");

    this.update()
  }

  update() {
    this.element.style.background = this.penColor
    this.element.style.width = `${this.penSize}px`
    this.element.style.height = `${this.penSize}px`
  }
}
