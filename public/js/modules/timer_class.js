export default class {
  constructor(start, end, step, pretty = false) {
    this.start = start;
    this.end = end;
    this.step = step;
    this._interval;
    this._timeout;
    this.iterations = 0;
    this.prettify = pretty;
  }

  interval(cb) {
    this._interval = setInterval(() => {
      if (this.start >= (this.prettify ? this.end - this.step : this.end)) {
        clearInterval(this._interval);
      } else {
        if (this.iterations == 0) {
          this.iterations++
          return cb(this.start, this.end - this.start);
        } else {
          this.start += this.step;
          return cb(this.start, this.end - this.start);
        }
      }
    }, this.step);
  }

  timeout(cb) {
    this._timeout = setTimeout(() => {
      return cb();
    }, this.prettify ? this.end + this.step : this.end);
  }

  clear() {
    clearInterval(this._interval)
    clearInterval(this._timeout)

    console.log("cleared")
  }
}
