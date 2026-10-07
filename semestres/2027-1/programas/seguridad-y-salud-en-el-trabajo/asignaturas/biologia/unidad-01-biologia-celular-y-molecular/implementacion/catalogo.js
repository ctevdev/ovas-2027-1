const fullscreenButton = document.querySelector("#fullscreen-toggle");
const fullscreenLabel = document.querySelector("#fullscreen-label");
const fullscreenStatus = document.querySelector("#fullscreen-status");
const page = document.documentElement;

const enterFullscreen = page.requestFullscreen || page.webkitRequestFullscreen;
const exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen;
const isFullscreen = () => Boolean(document.fullscreenElement || document.webkitFullscreenElement);

function updateFullscreenControl() {
  const active = isFullscreen();
  fullscreenButton.setAttribute("aria-pressed", String(active));
  fullscreenLabel.textContent = active ? "Salir de pantalla completa" : "Pantalla completa";
}

if (!enterFullscreen || !exitFullscreen) {
  fullscreenButton.hidden = true;
} else {
  fullscreenButton.addEventListener("click", async () => {
    try {
      if (isFullscreen()) {
        await exitFullscreen.call(document);
      } else {
        await enterFullscreen.call(page);
      }
    } catch {
      fullscreenStatus.textContent = "El navegador no permitió cambiar al modo de pantalla completa.";
    }
  });

  document.addEventListener("fullscreenchange", updateFullscreenControl);
  document.addEventListener("webkitfullscreenchange", updateFullscreenControl);
  updateFullscreenControl();
}
