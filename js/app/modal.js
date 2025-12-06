function mkOk(message) {
  return new Promise(function (resolve) {
    $("#mk-ok-msg").html(message);
    $("#mk-modal-ok").removeClass("mk-hidden");

    $("#mk-ok-btn").one("click", function () {
      $("#mk-modal-ok").addClass("mk-hidden");
      resolve(true);
    });
  });
}

function mkConfirm(message) {
  return new Promise(function (resolve) {
    $("#mk-confirm-msg").html(message);
    $("#mk-modal-confirm").removeClass("mk-hidden");

    $("#mk-confirm-ok").one("click", function () {
      $("#mk-modal-confirm").addClass("mk-hidden");
      resolve(true);
    });

    $("#mk-confirm-cancel").one("click", function () {
      $("#mk-modal-confirm").addClass("mk-hidden");
      resolve(false);
    });
  });
}