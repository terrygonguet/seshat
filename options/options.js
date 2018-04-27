var bg;
browser.runtime.getBackgroundPage()
.then(win => { bg = win; buildUI(); }, console.error);

var pState = {
  idle: "idle",
  running: "running",
  finished: "finished",
  paused: "paused",
};

function compareProjects(a, b) {
  if (a.state === b.state) return 0;
  else if (a.state === pState.running || b.state === pState.idle) return -1;
  else if (b.state === pState.running || a.state === pState.idle) return 1;
}

function buildUI() {
  let table = $("#tblProjects").empty();
  let projects = _.values(bg.projects).sort(compareProjects);
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
        <img class="btnInspect" src="../resources/inspect.png" data-name="${p.name}" title="Inspect"/>
        <span>&nbsp;&nbsp;</span>
        <img class="btnDelete" src="../resources/trash.png" data-name="${p.name}" title="Delete"/>
      </td>`)
      .appendTo(table);
  }

  $(".btnDelete").click(function (e) {
    let name = $(this).attr("data-name");
    if (confirm("Are you sure you want to delete " + name + " ?")) 
      bg.removeProject(name).then(buildUI);
  });

  $(".btnEdit").click(function (e) {
    makeEditorProject($(this).parents("tr"));
  });

  $(".btnInspect").click(inspectProject);
}

function makeEditorProject(el) {
  let name = el.attr("data-name");
  let project = bg.projects[name];

  let txbName = $("<input>").val(project.name);
  $(el).children(":first-child").empty().append(txbName);

  let txbDescription = $("<input>").val(project.description);
  $(el).children(":nth-child(2)").empty().append(txbDescription);

  let btnSave = $("<img src='../resources/save.png' title='Save'>").click(e => {
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
  let btnCancel = $("<img src='../resources/cancel.png' title='Cancel'>").click(buildUI);
  $(el).children(":last-child").empty()
    .append(btnSave)
    .append("&nbsp;&nbsp;")
    .append(btnCancel);
}

function makeEditorSession() {
  let el = $("#trCreate");
  let name = el.attr("data-name");
  let project = bg.projects[name];
  el.empty()
    .append(`<td><input type="date" id="txbDate"/></td>`)
    .append(`<td><input type="time" id="txbTime"/></td>`)
    .append(`<td>
      <input type="number" id="txbHours" min=0 value=0 />h<input type="number" id="txbMinutes" min=0 value=0 />min
    </td>`)
    .append(`<td>
      <img class="btnCreateSession" src="../resources/create.png" title="Create"/>
    </td>`);

  $(".btnCreateSession").click(function () {
    let start = moment($("#txbDate").val() + " " + $("#txbTime").val());
    let duration = { hours:Number($("#txbHours").val()), minutes:Number($("#txbMinutes").val()) };
    project.createSession(start, duration);
    buildUI();
    $(`#tblProjects tr[data-name='${name}'] .btnInspect`).click();
  });
}


function inspectProject(e) {
  let name = $(this).attr("data-name");
  let project = bg.projects[name];
  let table = $("#tblSessions").empty().append("<tr><th colspan=3><h2>Sessions</h2></th></tr>");
  let sessions = project.sessions.concat(project.currentSession || []).reverse();
  $(`<tr>`)
    .append(`<th>Started At</th>`)
    .append(`<th>State</th>`)
    .append(`<th>Duration</th>`)
    .append(`<th>Action(s)</th>`)
    .appendTo(table);
  for (let s of sessions) {
    let index = project.sessions.indexOf(s);
    $(`<tr>`)
      .append(`<td>${s.startedAt.format("dddd, MMMM Do YYYY, kk:mm:ss")}</td>`)
      .append(`<td>${s.state}</td>`)
      .append(`<td>${s.duration.humanize()}</td>`)
      .append(index !== -1 ? `<td>
        <img class="btnDeleteSession" src="../resources/trash.png" data-index="${index}" title="Delete"/>
      </td>` : `<td>Current session</td>`)
      .appendTo(table);
  }
  $(`<tr id='trCreate' data-name="${name}">`)
    .append(`<td colspan=${$("#tblSessions tr").eq(1).children().length}>
      <img class="btnCreateSession" src="../resources/create.png" title="Create"/>
    </td>`)
    .appendTo(table);

  $(".btnDeleteSession").click(function () {
    let index = $(this).attr("data-index");
    project.deleteSession(index);
    buildUI();
    $(`#tblProjects tr[data-name='${name}'] .btnInspect`).click();
  });

  $(".btnCreateSession").click(makeEditorSession);
}
