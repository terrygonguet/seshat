var  projects, settings;

browser.runtime.onStartup.addListener(function () {
  settings = {

  }
  browser.storage.sync.set({ settings });
});

let saveHandler = {
  get: function (project, method) {
    if (method.includes("Session")) {
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

function createNewProject(name, description="") {
  let project = new Project({ name, description });
  projects[name] = project;
  return browser.storage.sync.set(project.toJSON());
}

function removeProject(name) {
  return browser.storage.sync.remove(name).then(() => { delete projects[name]; });
}
