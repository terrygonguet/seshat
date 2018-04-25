var bg;
browser.runtime.getBackgroundPage()
.then(win => { bg = win; buildUI(); }, console.error);

var pState = {
  idle: "idle",
  running: "running",
  finished: "finished",
  paused: "paused",
};

$("#lblSettings").click(e => browser.runtime.openOptionsPage());
$("#lblNew").click(e => {
  $("#frmNew").show();
  $("#txbName").focus();
});
$("#frmNew").submit(function (e) {
  e.preventDefault();
  let name = $("#txbName").val();
  if (bg.projects[name] || !name) {
    let msg = $("<p>").text("Invalid or already taken").appendTo(this);
    setTimeout(function () {
      msg.detach();
    }, 2000);
  } else {
    $(this).hide();
    bg.createNewProject(name)
    .then(buildUI, console.error);
  }
  return false;
});

function compareProjects(a, b) {
  if (a.state === b.state) return 0;
  else if (a.state === pState.running || b.state === pState.idle) return -1;
  else if (b.state === pState.running || a.state === pState.idle) return 1;
}

function buildUI() {
  let table = $("#tblProjects").empty();
  let projects = _.values(bg.projects).filter(p => p.state !== "finished").sort(compareProjects);
  let previousState = "";
  for (let p of projects) {
    if (previousState !== p.state) {
      $(`<tr class='separator'><td colspan=4>${p.state.replace(/^(.)/, c => c.toUpperCase())}</td></tr>`).appendTo(table);
      previousState = p.state;
    }
    let imgRecord = p.state !== pState.idle ? "recording" : "record";
    let imgPlayPause = p.state !== pState.paused ? "pause" : "play";
    $(`<tr class="${p.state}">`)
      .append(`<td>${p.name}</td>`)
      .append(`<td id="prj${p.name}">${p.duration.humanize()}</td>`)
      .append(`<td><img src="../resources/${imgRecord}.png" class="btnRecord" data-name="${p.name}" title="record"/></td>`)
      .append(p.state === pState.idle ? "<td>" : `<td><img src="../resources/${imgPlayPause}.png" class="btnPlayPause" data-name="${p.name}" title="play/pause"/></td>`)
      .appendTo(table);
  }

  $(".btnRecord").click(function (e) {
    let name = $(this).attr("data-name");
    let project = projects.find(pro => pro.name === name);
    if (project.state === pState.idle) {
      project.startSession();
    } else {
      project.endSession();
    }
    buildUI();
  });

  $(".btnPlayPause").click(function (e) {
    let name = $(this).attr("data-name");
    let project = projects.find(pro => pro.name === name);
    if (project.state === pState.running) {
      project.pauseSession();
    } else {
      project.startSession();
    }
    buildUI();
  });

  setInterval(function () {
    for (let p of projects) {
      if (p.state != pState.idle)
        $("#prj" + p.name).text(p.duration.humanize());
    }
  }, 1000);
}
