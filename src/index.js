import Memo from "Memo";

const DEFAULT_TICK_LENGTH = 20;

export default class Scheduler extends Memo {
  constructor() {
    super();

    this.tickLength = DEFAULT_TICK_LENGTH;
    this.startTime = Date.now();
    this.started = false;
    this.currentTime = Date.now();
    this.waitForInput = false;
    this.loop = true;

    this.length = 1000;
    this._speed = 1;
    this._schedule = [];
    this._currentSchedule = [];

    this.playing = false;
    this.recording = false;

    this.looped = -1;
  }

  set speed (value) {
    this._speed = value;
  }

  get speed () {
    return this._speed;
  }

  serialize() {
      let schedule = []

      this._schedule.map(e=>{
          schedule.push(JSON.stringify(e));
      })
      return JSON.stringify(schedule)
  }

  addToSchedule(data, timestamp = this.time) {
      if(this.waitForInput && !this.started && this.recording) {
        this.started = true;
        this.startTime = Date.now();
        timestamp = this.time;
      }
      let newItem = {
        timestamp: timestamp,
        data: data
      };
      this._schedule.push(newItem);
      this.trigger("added", newItem)
  }

  reset() {
    const schedule = this._schedule.slice();
    this._schedule = [];
    this._currentSchedule = [];
    this.length = 1000;
    return schedule;
  }

  record(waitForInput = true) {
    this.waitForInput = waitForInput;
    this.trigger("record");
    this.startTime = Date.now();
    this.recording = true;
  }

  play() {
    this.looped++;
    this.playing = true;
    this._currentSchedule = this._schedule.slice();
    this.startTime = Date.now();
    this.currentTime = this.time;
    this.tick();
  }

  stop() {
    if (this.recording) {
      this.started = false;
      this.length = this.time;
      this.recording = false;
      this.trigger("endRecord", this.length);
    } else {
        this.trigger("end");
    }
    this.playing = false;
  }

  end () {
      this.loop ? this.play() : this.stop();
  }

  get timeRatio () {
    return (this.globalTimeToLocal(Date.now())*this._speed) / this.length;
  }

  get time () {
    return this.timeRatio * this.length;
  }

  tick() {

    if (this.timeRatio > 1) {
      this.end();
      return;
    }

    if (this.playing) setTimeout(this.tick.bind(this), this.tickLength);

    const items = this.processSchedule(this.time);
   
    this.trigger("tick", this.timeRatio, items);
    this.removeItemsFromSchedule(items);

  }

  seek (ratio) {
    const newTime = this.length * ratio;
    this.startTime = Date.now() - newTime;
  }

  globalTimeToLocal(globalTime) {
    return globalTime - this.startTime;
  }

  localTimeToGlobal(localTime) {
    return localTime + this.startTime;
  }

  processSchedule(timestamp) {
    if (timestamp < this.length) {
      return this.getEntriesToPlay(timestamp);
    }
    return [];
  }

  getEntriesToPlay(timestamp) {
    return this._currentSchedule.filter(e => {
      return e.timestamp < timestamp + this.tickLength;
    });
  }

  removeItemsFromSchedule(items) {
    items.forEach(item => {
      let index = this._currentSchedule.findIndex(scheduleItem => {
        return item === scheduleItem;
      });
      this._currentSchedule.splice(index, 1);
    });
  }
}
