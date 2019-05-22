export default class {
  constructor(start, end, step) {
    this.start = start;
    this.end = end;
    this.step = step;
    this._interval;
    this._timeout;
  }

  interval(cb) {
    this._interval = setInterval(() => {
      if (this.start >= this.end) {
        clearInterval(this._interval);

      } else {
        this.start += this.step;

        return cb(this.start, this.end - this.start);
      }
    }, this.step);
  }

  timeout(cb) {
    this._timeout = setTimeout(() => {
      return cb();
    }, this.end);
  }

  clear() {
    clearInterval(this._interval)
    clearInterval(this._timeout)

    console.log("cleared")
  }
}
