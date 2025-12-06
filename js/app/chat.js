import { db, dbRef } from "../firebase/firebase_config.js"; //削除でdb使うから受け取る
import {
  ref, //削除で使う
  push,
  set,
  get,
  remove, //middnight fragment mode用に追加
  update, //論理削除用に追加
  onChildAdded,
  onChildRemoved,
  onChildChanged,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

//状態管理等
let initialized = false;
let editingKey = null;
let originalMsg = null;
let editedMsg = null;
let midnightMode = false;

//トースト爆撃防止
get(dbRef).then(function () {
  initialized = true;
});

// ユーザー固有IDを生成
let userid = localStorage.getItem("userid");
if (!userid) {
  userid = crypto.randomUUID();
  localStorage.setItem("userid", userid);
}

const username = "user_" + userid.slice(0, 5);

// 送信イベント
$("#send-talk").on("click", function () {
  sendMessage();
});

$("#talk-text").on("keydown", function (e) {
  if (e.keyCode == 13 && e.ctrlKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 送信
function sendMessage() {
  const text = $("#talk-text").val().trim();

  if (text === "") {
    return;
  }

  console.log(originalMsg);

  if (editingKey !== null) {
    editedMsg = $("#talk-text").val().trim();
    console.log(editedMsg);

    if (originalMsg === editedMsg) {
      mkConfirm("内容が変更されていません。下書きを破棄しますか？").then(
        function (ok) {
          if (ok) {
            $("#talk-text").val("");
            editingKey = null;
            originalMsg = null;
            editedMsg = null;
            console.log(editingKey);
            toast("下書きを破棄しました");
          }
        }
      );
    } else if (originalMsg !== editedMsg) {
      const key = editingKey;
      update(ref(db, `chat/${key}`), {
        talk: $("#talk-text").val(),
        edited: true,
      }).then(function () {
        $("#talk-text").val("");
        editingKey = null;
        originalMsg = null;
        editedMsg = null;
      });
    }
  } else {
    let mode = "normal";

    if (midnightMode) {
      mode = "midnight";
    }

    const msg = {
      userid: userid,
      time: new Date().getTime(),
      name: username,
      talk: $("#talk-text").val(),
      deleted: false,
      edited: false,
      mode: mode, //モード情報追加
    };

    const newPostRef = push(dbRef);
    set(newPostRef, msg).then(function () {
      if (midnightMode) {
        fadefragmentMessages(newPostRef.key);
      }
    });
    $("#talk-text").val("");
  }
}

// 反映
onChildAdded(dbRef, function (data) {
  const msg = data.val();
  const key = data.key;
  const time = formatTime(msg.time);

  if (msg.deleted) {
    $(`.msg[data-key="${key}"]`).remove();
    if (msg.userid === userid) {
      let html = `
        <div class="my-msg deleted-msg" data-key="${key}">
            <p class="deleted-text">このメッセージは削除されました</p>
        </div>
    `;
      $("#talk-room").append(html);

    } else {
      let html = `
        <div class="other-msg deleted-msg" data-key="${key}">
            <p class="deleted-text">このメッセージは削除されました</p>
        </div>
    `;
      $("#talk-room").append(html);
    }

    return;
  }

  let editedBadge = "";
  if (msg.edited === true) {
    editedBadge = `<span class="edited-badge">（編集済み）</span>`;
  }

  if (msg.userid === userid) {
    let html = `
        <div class="msg my-msg" data-userid="${msg.userid}" data-key="${key}">
            <div class="msg-header">
                <span class="msg-name">${msg.name}</span>
                <span class="msg-time">${time}</span>
                <span class="msg-edit-btn">🖊️</span>
                <span class="msg-dlt-btn">🗑️</span>
                ${editedBadge}
            </div>
            <p class="msg-text">${msg.talk}</p>
        </div>
    `;
    $("#talk-room").append(html);

  } else {
    let html = `
        <div class="msg other-msg" data-userid="${msg.userid}" data-key="${key}">
            <div class="msg-header">
                <span class="msg-name">${msg.name}</span>
                <span class="msg-time">${time}</span>
                ${editedBadge}
            </div>
            <p class="msg-text">${msg.talk}</p>
        </div>
    `;
    $("#talk-room").append(html);
    if (initialized) toast(msg.name + " " + msg.talk); //初回ロード爆撃防止
  }

  const lastMsg = $(`#talk-room .msg[data-key="${key}"]`);

  if (msg.mode === "midnight") {
    lastMsg.addClass("msg-fragment");
  }

  $("#talk-room").scrollTop($("#talk-room")[0].scrollHeight);
});

// 反映
onChildChanged(dbRef, function (data) {
  const msg = data.val();
  const key = data.key;
  const time = formatTime(msg.time);

  if (msg.deleted) {
    const old = $(`.msg[data-key="${key}"]`);

    let html = "";

    if (msg.userid === userid) {
      html = `
        <div class="my-msg deleted-msg" data-key="${key}">
            <p class="deleted-text">このメッセージは削除されました</p>
        </div>
    `;
    } else {
      html = `
        <div class="other-msg deleted-msg" data-key="${key}">
            <p class="deleted-text">このメッセージは削除されました</p>
        </div>
    `;
    }
    if (old.length) {
      old.after(html);
      old.remove();
    } else {
      // （初回読み込みなどで元要素がない場合だけ）
      $("#talk-room").append(html);
    }

    return;
  }

  if (msg.edited) {
    const old = $(`.msg[data-key="${key}"]`);

    if (old.length) {
      old.find(".msg-text").text(msg.talk);

      if (old.find(".edited-badge").length === 0) {
        old
          .find(".msg-header")
          .append(`<span class="edited-badge">(編集済み)</span>`);
      }

      return;
    }
  }

  if (msg.userid === userid) {
    let html = `
        <div class="msg my-msg" data-userid="${msg.userid}" data-key="${key}">
            <div class="msg-header">
                <span class="msg-name">${msg.name}</span>
                <span class="msg-time">${time}</span>
                <span class="msg-edit-btn">🖊️</span>
                <span class="msg-dlt-btn">🗑️</span>
            </div>
            <p class="msg-text">${msg.talk}</p>
        </div>
    `;
    $("#talk-room").append(html);
  } else {
    let html = `
        <div class="msg other-msg" data-userid="${msg.userid}" data-key="${key}">
            <div class="msg-header">
                <span class="msg-name">${msg.name}</span>
                <span class="msg-time">${time}</span>
            </div>
            <p class="msg-text">${msg.talk}</p>
        </div>
    `;
    $("#talk-room").append(html);
    toast(msg.name + " " + msg.talk);
  }

  $("#talk-room").scrollTop($("#talk-room")[0].scrollHeight);
});

// 時刻整形
function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    day: "2-digit",
  });
}

//メッセージ編集
$(document).on("click", ".msg-edit-btn", function () {
  const target = $(this).closest(".my-msg");
  editingKey = target.data("key");
  originalMsg = target.find(".msg-text").text().trim();
  console.log(editingKey);
  console.log(originalMsg);
  $("#talk-text").val(originalMsg);
});

//メッセージ削除
$(document).on("click", ".msg-dlt-btn", function () {
  const key = $(this).closest(".my-msg").data("key");

  mkConfirm("このメッセージを削除しますか？").then(function (ok) {
    if (ok) {
      update(ref(db, `chat/${key}`), {
        deleted: true,
      });
      toast("メッセージを削除しました");
    }
  });
});

onChildRemoved(dbRef, function (data) {
  const key = data.key;
  //クラスとキーが一致するもの削除
  $(`.my-msg[data-key="${key}"], .other-msg[data-key="${key}"]`).remove();
});

//Midnight fragment Mode Toggle
$("#modeToggle").on("click", function () {
  $("#modeToggle").toggleClass("active-fade");

  if ($("#modeToggle").hasClass("active-fade")) {
    midnightMode = true;
    $(".mode-label").text("Midnight fragment Mode: ON");
  } else {
    midnightMode = false;
    $(".mode-label").text("Midnight fragment Mode: OFF");
  }
});

//Midnight fragment Mode用メッセージフェード
function fadefragmentMessages(key) {
  if (midnightMode) {
    setTimeout(function () {
      const target = ref(db, `chat/${key}`);
      remove(target).then(function () {
        console.log("fragment message removed:", key);
      });
    }, 10000);
  }
}
