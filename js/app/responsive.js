function setAppHeight() {
  $(":root").css("--app-height", `${window.innerHeight}px`);
}

setAppHeight();

$(window).on("resize", setAppHeight);