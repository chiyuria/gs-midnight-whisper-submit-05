# ①課題名

**Midnight Whisper（自動消滅メッセージ対応リアルタイムチャット）**

---

# ②課題内容（どんな作品か）

Firebase Realtime Database を使用したリアルタイムチャットアプリ。

**通常モード（Mode OFF）**：
編集・削除が可能な、一般的なチャットアプリとして利用できる。

**Midnight Fragment Mode（Mode ON）**：
送信したメッセージが **10 秒後にフェードアウトし、DB から完全削除（物理削除）** される。
DOM 側では “溶けるように消える” アニメーション演出が行われる。

匿名利用のため、起動時にブラウザ側で
**UUID（Crypto API）を生成 → そのユーザーIDでチャット参加**。
※LAN公開（ローカルIP）などで `crypto.randomUUID()` が使えない環境向けに **UUIDフォールバックも実装**。

---

# ③アプリのデプロイURL

[https://chiyuria.github.io/gs-midnight-whisper-submit-05/](https://chiyuria.github.io/gs-midnight-whisper-submit-05/)

---

# ④アプリにログイン情報がある場合

なし（UUID による匿名識別）

---

# ⑤こだわった点（シンプル版）

### ■ 1. 通常チャットと Fragment Mode を明確に切り替える設計

* OFF：編集・削除・保持が可能な“普通のチャット”
* ON：10 秒で自動消滅する“儚いチャット”
  利用シーンに応じて切り替えられる構造にした。

---

### ■ 2. UUID による匿名ユーザー管理（フォールバック対応）

`crypto.randomUUID()` を用いてユーザーごとに一意のIDを生成。
さらに、LAN公開（ローカルIP）では `crypto.randomUUID()` が使えない場合があるため、**UUIDフォールバック関数で代替生成**できるようにして、送信者判定・編集権限判定が安定して動くようにした。

---

### ■ 3. Firebase remove() を使った完全消滅

Fragment モード時は送信直後に以下の処理を予約：

```js
setTimeout(function () {
  const target = ref(db, `chat/${key}`);
  remove(target).then(function () {});
}, 10000);
```

**“見えている間だけ存在するメッセージ”** を実現。

---

### ■ 4. アニメーションと DB 消滅の同期

DOM の fade → blur → 上昇アニメーションと
Firebase の物理削除のタイミングがずれないよう調整。

---

### ■ 5. UI は 1 画面構成でシンプル＋実用的に（レスポンシブ強化）

* ダークUI
* ガラス風メッセージバブル
* Midnight Mode トグル
* 編集・削除ボタン
* 入力エリア固定
* スマホ最適のレスポンシブ対応（**`responsive.js` で `--app-height` を更新し、アドレスバーによる `100vh` のズレを抑制**）

3カラムアプリからの切り出しだが、1カラム用に完全最適化した。

---

# ⑥ 難しかった点・次回トライしたいこと

### ■ Firebase の概念理解

LocalStorage と似ている部分もあるが、
**import / initializeApp / getDatabase / ref / push / onChildAdded**
など、リアルタイムDB特有の仕組みを整理するのが難しかった。

---

### ■ 編集機能と論理削除機能の実装が非常に難しかった

Firebase は **配列ではなく「キー付きオブジェクト」** でデータを保持するため、
単純に append すると **表示順が崩れる問題** が発生した。

そのため：

* 編集 → update() → 対応する DOM をキーで特定し、中身を差し替え
* 削除 → deleted: true → DOM 側を “削除済み表示” に置き換え

という **“キー基準で DOM を探し出して更新する処理”** を自前で作る必要があった。
ただDBを更新すればいいわけではなく、
**“チャットの位置を維持したまま UI を更新する”** 理解が最も難しかった。

---

### ■ UUID による匿名識別（LAN公開対応）

`crypto.randomUUID()` を用いた一時ユーザーID生成と、
それを利用した **メッセージ所有者判定（編集・削除権）** の仕組みを理解するのに時間がかかった。
また、ローカルIPでの動作確認時に Crypto API が使えないケースがあり、**フォールバック実装で安定化**した。

---

### 次回トライしたいこと

* 既読管理
* ユーザー名カスタム
* Fragment Mode の残光エフェクト／時間変更対応
* 消滅メッセージ数など、モード別ログの導入

---

# ⑦ フリー項目

* ロゴは **AI生成（SVG）**。アプリの世界観に合わせて制作。
* Midnight Fragment Mode は“危険なチャット”ではなく、
  **深夜のつぶやきがふっと消えるような感覚**をテーマにした UI 演出を重視した。

---

# 🌙 Midnight Whisper – README 251208 update

---

# 📝 概要（Overview）

**Midnight Whisper** は Firebase Realtime Database を使った、
**「通常チャット」と「深夜の感情だけ溶ける消滅チャット」** の
2つの顔を持つリアルタイムアプリです。

### ✔ Midnight Fragment Mode → *ON のときだけ、メッセージが10秒後に自動消滅*

### ✔ Mode OFF → *編集・削除もできる普通のチャットとして働く*

**普段は普通に使えるチャットだけど、
気持ちが揺れる深夜だけ Fragment モードに切り替える**
そんな使い分けができる構造になっています。

Fragment で消えたメッセージは、
フェードアウトして blur がかかり、
ふっと上に溶けて、
**DBからも物理削除され、二度と戻りません。**

---

# 🎮 機能一覧（Features）

## ▼ 通常モード（Midnight Mode = OFF）

* リアルタイムメッセージ
* 自分のメッセージ編集
* 削除（論理削除）
* ずっと残る、普通のチャット体験

**→ 課題チャットアプリとしての“基本機能”はここで満たしている。**

---

## ▼ Midnight Fragment Mode（ON のときだけ発動）

* 送信後 **10 秒で自動消滅（DBごと削除）**
* 消える途中のアニメーション（fade + blur + 上昇）
* "残らないから言える言葉" の世界観を表現

**→ 通常チャットの上位に乗る “拡張機能” として実装。**

---

## ▼ UI / 補助機能

* 初回ロード爆撃防止付きの toast 通知
* Promise ベースの OK / Confirm モーダル
* スマホ・PC両対応の単一画面UI（**`responsive.js` による `--app-height` 更新でスマホの縦ズレを軽減**）

---

# 🧠 仕組み（How It Works）

## 1. 送信処理の分岐

```
if (midnightMode) {
  mode = "midnight";
}
```

## 2. 通常メッセージ（mode = normal）

* Firebase に保存され続ける
* 削除 → deleted: true
* 編集 → update()

## 3. Fragment メッセージ（mode = midnight）

* DOM に `msg-fragment` クラス
* 10 秒後に remove()
* 消滅アニメーションが動くのは **DOM側だけの演出**
* “消滅後は痕跡ゼロ”

---

# 🗂 ディレクトリ構成

```
.
├── index.html
├── css/
│   ├── buttons.css
│   ├── forms.css
│   ├── modal.css
│   ├── style.css
│   └── toast.css
├── img/
│   └── logo.svg   ← AI生成
├── js/
│   ├── app/
│   │   ├── chat.js
│   │   ├── modal.js
│   │   ├── toast.js
│   │   └── responsive.js   ← 追加（スマホ縦100%対策）
│   ├── firebase/
│   │   └── firebase_config.js
│   └── libs/
│       └── jquery-3.7.1.min.js
└── .gitignore
```

---

# 🎨 デザインポイント

* 黒 × 紫の“深夜配色”
* Glassmorphism（blur + 透過）
* Midnight Fragment 用の keyframes
* ロゴは AI 生成（README に明記）

---

# 🔧 技術要素

* Firebase Realtime Database
* jQuery（MIT）
* PromiseベースUI
* Toast通知
* レスポンシブUI（**`--app-height` / `responsive.js`**）

---

# 🌙 Midnight Whisper – README 251208 update

---

# 📝 Overview

**Midnight Whisper** is a real-time chat application built on Firebase Realtime Database.
It has two distinct modes:

### ✔ **Normal Mode** — a standard chat with editing and deletion

### ✔ **Midnight Fragment Mode** — messages softly dissolve and vanish after 10 seconds

Fragment messages fade, blur, drift upward,
and then disappear **entirely from the database** —
not for thrill, but to capture the feeling of
**a late-night confession that doesn’t need a record,
a small emotion that exists only in the moment.**

In other words:

**Some words are meant to be heard once,
and then disappear.**

Midnight Whisper expresses that idea through animation, timing, and silence.

---

# 🎮 Features

## ▼ Normal Mode (Midnight Mode = OFF)

* Real-time messaging
* Edit own messages
* Logical delete (message replaced with placeholder)
* Functions as a standard persistent chat

**→ This covers all baseline features required for a typical chat app.**

---

## ▼ Midnight Fragment Mode (ON)

* Messages **self-erase after 10 seconds**
* Fade → blur → upward drift → disappearance
* Physically removed from Firebase using `remove()`
* Only the person who happens to see it will witness it dissolve
* Designed for **late-night, transient feelings**

**→ Works as an optional “ephemeral layer” on top of a normal chat.**

---

## ▼ UI Enhancements

* Toast notifications (with first-load suppression)
* Promise-based modals (OK / Confirm)
* Fully responsive single-screen layout (**`responsive.js` updates `--app-height` to reduce mobile 100vh jumps**)

---

# 🧠 How It Works

## 1. Message sending

```
if (midnightMode) {
  mode = "midnight";
}
```

## 2. Normal messages (`mode = "normal"`)

* Stored normally
* Delete → `deleted: true`
* Edit → `update()`

## 3. Fragment messages (`mode = "midnight"`)

* Assigned `.msg-fragment` class
* Scheduled deletion after 10 seconds
* Visual dissolve animation in the DOM
* Complete physical deletion via Firebase `remove()`
* Leaves **no trace** after disappearing

---

# 🎨 UI / Design

* **AI-generated logo**
* Midnight-inspired dark palette with purple accents
* Glass-like message bubbles (blur + transparency)
* Fragment animation expresses “feelings that fade”
* One-page responsive design optimized for mobile (with `--app-height` support)

The visual theme represents
**soft emotions that only appear at night,
meant to be seen once and never saved.**

---

# 🔧 Tech Stack

* HTML5 / CSS3 / jQuery
* Firebase Realtime Database
* Promise-based modals
* Toast notification system
* Responsive layout (**`responsive.js` + `--app-height`**)
* Anonymous identity via UUID (**with fallback for non-secure/LAN access**)

---

# 🗂 Directory Structure

```
.
├── index.html
├── css/
│   ├── buttons.css
│   ├── forms.css
│   ├── modal.css
│   ├── style.css
│   └── toast.css
├── img/
│   └── logo.svg   ← AI-generated
├── js/
│   ├── app/
│   │   ├── chat.js
│   │   ├── modal.js
│   │   ├── toast.js
│   │   └── responsive.js   ← added (mobile viewport fix)
│   ├── firebase/
│   │   └── firebase_config.js
│   └── libs/
│       └── jquery-3.7.1.min.js
└── .gitignore
```

---

# ▶ How to Use

1. Add your Firebase credentials to `firebase_config.js`
2. Open `index.html` in a browser
3. Turn Midnight Fragment Mode ON
4. Send a message
5. Watch it dissolve and vanish after 10 seconds

---

# 📘 Learning Points

* Firebase push / set / update / remove
* Coordinating visual effects with real DB deletion
* Keyframe-based dissolve animation
* Promise-driven modal UI
* State management (editingKey / initialized / midnightMode)
* Designing a clean single-screen chat interface
* Handling mobile viewport quirks with `--app-height`

---

# 📄 License

Created for learning and prototyping purposes.
Logo includes **AI-generated assets**.

---

# ✨ Author

Chiyuria

---
