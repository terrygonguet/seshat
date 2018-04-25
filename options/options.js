var bg;
browser.runtime.getBackgroundPage()
.then(win => { bg = win; buildUI(); }, console.error);

var pState = {
  idle: "idle",
  running: "running",
  finished: "finished",
  paused: "paused",
};

function buildUI() {
  let table = $("#tblProjects").empty();
  let projects = _.values(bg.projects);
  $(`<tr>`)
    .append(`<th>Name</th>`)
    .append(`<th>Description</th>`)
    .append(`<th>State</th>`)
    .append(`<th>Duration</th>`)
    .append(`<th>Action(s)</th>`)
    .appendTo(table);
  for (let p of projects) {
    $(`<tr class="${p.state}" data-name="${p.name}">`)
      .append(`<td>${p.name}</td>`)
      .append(`<td>${p.description}</td>`)
      .append(`<td>${p.state}</td>`)
      .append(`<td id="prj${p.name}">${p.duration.humanize()}</td>`)
      .append(`<td>
        <img class="btnEdit" src="../resources/edit.png" data-name="${p.name}" title="Edit"/>
        <img class="btnDelete" src="../resources/trash.png" data-name="${p.name}" title="Delete"/>
        <img class="btnInspect" src="../resources/inspect.png" data-name="${p.name}" title="Inspect"/>
      </td>`)
      .appendTo(table);
  }

  $(".btnDelete").click(function (e) {
    let name = $(this).attr("data-name");
    bg.removeProject(name).then(buildUI);
  });

  $(".btnEdit").click(function (e) {
    makeEditor($(this).parents("tr"));
  });

  $(".btnInspect").click(inspect);
}

function makeEditor(el) {
  let name = el.attr("data-name");
  let project = bg.projects[name];

  let txbName = $("<input>").val(project.name);
  $(el).children(":first-child").empty().append(txbName);

  let txbDescription = $("<input>").val(project.description);
  $(el).children(":nth-child(2)").empty().append(txbDescription);

  let btnSave = $("<button>").text("SAVE").click(e => {
    project.name = txbName.val();
    project.description = txbDescription.val();
    if (name !== project.name) {
      bg.createNewProject(project)
      .then(() => {
        bg.removeProject(name).then(buildUI);
      });
    } else {
      project.saveSession();
    }
    buildUI();
  });
  $(el).children(":last-child").empty().append(btnSave);
}


function inspect(e) {
  let name = $(this).attr("data-name");
  let project = bg.projects[name];
  let table = $("#tblSessions").empty().append("<tr><th colspan=3><h2>Sessions</h2></th></tr>");
  $(`<tr>`)
    .append(`<th>Started At</th>`)
    .append(`<th>State</th>`)
    .append(`<th>Duration</th>`)
    .appendTo(table);
  for (let s of project.sessions.concat(project.currentSession || []).reverse()) {
    $(`<tr>`)
      .append(`<td>${s.startedAt.format("dddd, MMMM Do YYYY, kk:mm:ss")}</td>`)
      .append(`<td>${s.state}</td>`)
      .append(`<td>${s.duration.humanize()}</td>`)
      // .append(`<td>
      //   <img class="btnEdit" src="../resources/edit.png" data-name="${p.name}" title="Edit"/>
      //   <img class="btnDelete" src="../resources/trash.png" data-name="${p.name}" title="Delete"/>
      //   <img class="btnInspect" src="../resources/inspect.png" data-name="${p.name}" title="Inspect"/>
      // </td>`)
      .appendTo(table);
  }
}
