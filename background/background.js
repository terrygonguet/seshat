var  projects, settings;

browser.storage.sync.get()
.then(function (values) {
  settings = values.settings;
  projects = _.mapValues(_.omit(values, 'settings'), v => new Project(v));
}, console.error);

function createNewProject(name, description="") {
  let project = new Project({ name, description });
  projects[name] = project;
  return browser.storage.sync.set(project.toJSON());
}

function removeProject(name) {
  return browser.storage.sync.remove(name).then(() => { delete projects[name]; });
}
