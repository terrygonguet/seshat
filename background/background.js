var  projects, settings;

browser.runtime.onStartup.addListener(function () {
  settings = {

  }
  browser.storage.sync.set({ settings });
});

let saveHandler = {
  get: function (project, method) {
    if (method.includes && method.includes("Session")) {
      setTimeout(function () {
        browser.storage.sync.set(project.toJSON());
      }, 50);
    }
    return project[method];
  }
}

browser.storage.sync.get()
.then(function (values) {
  settings = values.settings;
  projects = _.mapValues(_.omit(values, 'settings'), v => new Proxy(new Project(v), saveHandler));
}, console.error);

function createNewProject(nameOrProject, description="") {
  if (nameOrProject instanceof Project) {
    if (nameOrProject.name === "settings") return Promise.Reject("Can't use this name");
    let obj = {};
    obj[nameOrProject.name] = nameOrProject;
    _.merge(projects, obj);
    return browser.storage.sync.set(nameOrProject.toJSON());
  } else {
    if (nameOrProject === "settings") return Promise.reject("Can't use this name");
    let project = new Proxy(new Project({ name:nameOrProject, description }), saveHandler);
    projects[nameOrProject] = project;
    return browser.storage.sync.set(project.toJSON());
  }
}

function removeProject(name) {
  return browser.storage.sync.remove(name).then(() => { delete projects[name]; });
}

function exportData() {
  var data = { settings };
  _.values(projects).forEach(p => _.assign(data, p.toJSON()));
  return data;
}

function importData(data) {
  return browser.storage.sync.clear()
  .then(() => {
    return browser.storage.sync.set(data);
  }, console.error)
  .then(() => {
    settings = data.settings;
    projects = _.mapValues(_.omit(data, 'settings'), v => new Proxy(new Project(v), saveHandler));
  }, console.error);
}
