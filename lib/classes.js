class Project {

  constructor(data) {
    this.name           = data.name; // String
    this.description    = data.description; // String
    this.state          = Project.State.idle; // Project.State
    this.createdAt      = moment(data.createdAt); // Moment
    this.currentSession = data.currentSession ? new Session(data.currentSession) : null // Session
    this.sessions       = [] // Session[]

    if (data.state) {
      let stateID = _.toPairs(Project.State).find(p => p[1] == data.state)[0];
      this.state = Project.State[stateID];
    }
    for (let sessionData of data.sessions || []) {
      this.sessions.push(new Session(sessionData));
    }
  }

  /**
   * @return {Moment.Duration}
   */
  get duration() {
    let duration = this.currentSession ? this.currentSession.duration : moment.duration();
    for (let session of this.sessions) {
      duration.add(session.duration);
    }
    return duration;
  }

  startSession() {
    switch (this.state) {
      case Project.State.running:
        throw "Project already started";
        break;
      case Project.State.paused:
        this.state = Project.State.running;
        this.currentSession.start();
        break;
      default:
        this.state = Project.State.running;
        this.currentSession = new Session();
    }
  }

  pauseSession() {
    switch (this.state) {
      case Project.State.paused:
        throw "Project already paused";
        break;
      case Project.State.running:
        this.state = Project.State.paused;
        this.currentSession.pause();
        break;
      default:
        throw "Invalid state to pause : " + this.state;
    }
  }

  endSession() {
    switch (this.state) {
      case Project.State.running:
      case Project.State.paused:
        this.state = Project.State.idle;
        this.currentSession.finish();
        this.sessions.push(this.currentSession);
        this.currentSession = null;
        break;
      default:
        throw "Invalid state to end : " + this.state;
    }
  }

  toJSON() {
    let data = {};
    data[this.name] = {
      name: this.name,
      description: this.description,
      state: this.state,
      createdAt: this.createdAt.toISOString(),
      currentSession: this.currentSession ? this.currentSession.toJSON() : null,
      sessions: this.sessions.map(s => s.toJSON()),
    };
    return data;
  }

}

Project.State = {
  idle: "idle",
  running: "running",
  finished: "finished",
  paused: "paused",
}

class Session {

  constructor(data) {
    if (data) {
      this.events = data.events.map(e => new Session.Event(e));
    } else {
      this.events = [ new Session.Event() ];
    }
  }

  get duration() {
    let duration = moment.duration();
    let start = this.startedAt;
    let isFinished = false;
    for (var i = 1; i < this.events.length; i++) {
      let e = this.events[i];
      if (i % 2 === 1)
        duration.add(e.time.diff(start));
      else
        start = e.time;
      isFinished = e.type === Session.Event.Type.finished;
    }
    if (!isFinished && this.events[this.events.length - 1].type !== Session.Event.Type.paused)
      duration.add(moment().diff(start));
    return duration;
  }

  get startedAt() {
    return this.events[0].time;
  }

  get state() {
    switch (this.events[this.events.length - 1].type) {
      case Session.Event.Type.started:
      case Session.Event.Type.resumed:
        return Session.State.running;
      case Session.Event.Type.paused:
        return Session.State.paused;
      case Session.Event.Type.finished:
        return Session.State.finished;
    }
  }

  start() {
    switch (this.state) {
      case Session.State.paused:
        this.events.push(new Session.Event(Session.Event.Type.resumed));
        break;
      default:
        throw "Invalid state to start : " + this.state;
    }
  }

  pause() {
    switch (this.state) {
      case Session.State.running:
        this.events.push(new Session.Event(Session.Event.Type.paused));
        break;
      default:
        throw "Invalid state to pause : " + this.state;
    }
  }

  finish() {
    this.events.push(new Session.Event(Session.Event.Type.finished));
  }

  toJSON() {
    return {
      events: this.events.map(e => e.toJSON())
    };
  }

}

Session.State = {
  running: "running",
  paused: "paused",
  finished: "finished",
}

Session.Event = class  {

  constructor(data) {
    if (!data) {
      this.type = Session.Event.Type.started;
      this.time = moment();
    } else if (data.includes(" ")) {
      let split = data.split(" ");
      this.type = split[0];
      this.time = moment(split[1]);
    } else {
      this.type = data;
      this.time = moment();
    }
  }

  toJSON() {
    return `${this.type} ${this.time.toISOString()}`;
  }

}

Session.Event.Type = {
  started: "started",
  paused: "paused",
  resumed: "resumed",
  finished: "finished",
}
