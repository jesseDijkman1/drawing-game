import PenSettings from "./penSettings_class.js"

export default class extends PenSettings {
  constructor(target, penColor, penSize) {
    super()

    super.color = penColor.querySelectorAll("input");
    super.size = penSize.querySelector("input");

    this.points = [];
  }

  addPoint(point) {
    if (this.points.length > 0) {
      if (point.x !== this.points[this.points.length - 1].x || point.y !== this.points[this.points.length - 1].y) {
        this.points.push(point)
      }
    } else {
      this.points.push(point)
    }
  }
}
