function toast(message, duration = 3000) {
  const container = document.querySelector(".toast-container");

  const t = document.createElement("div");
  t.className = "toast";
  t.textContent = message;

  container.appendChild(t);

  // 登場
  requestAnimationFrame(() => {
    t.classList.add("show");
  });

  // 消滅
  setTimeout(() => {
    t.classList.add("fadeout");
    setTimeout(() => t.remove(), 300);
  }, duration);
}
