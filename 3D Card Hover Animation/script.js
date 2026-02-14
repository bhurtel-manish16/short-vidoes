(() => {
  const modelViewers = document.querySelectorAll('model-viewer');
  const cards = document.querySelectorAll('.card');
  const defaultOrbit = '64deg 25deg 64m';
  const hoverOrbit = '90deg -42deg 50m';
  const defaultTarget = '8m 1m 1m';
  const hoverTarget = '4m 1m 1m';
  const applyOrbit = (modelViewer, orbit, target) => {
    modelViewer.setAttribute('camera-orbit', orbit);
    modelViewer.setAttribute('camera-target', target);
    modelViewer.setAttribute('interpolation-decay', '124');
  };
  cards.forEach((card, index) => {
    const modelViewer = modelViewers[index];
    if (modelViewer) {
      applyOrbit(modelViewer, defaultOrbit, defaultTarget);
      card.addEventListener('mouseenter', () => applyOrbit(modelViewer, hoverOrbit, hoverTarget));
      card.addEventListener('mouseleave', () => applyOrbit(modelViewer, defaultOrbit, defaultTarget));
      modelViewer.addEventListener('load', () => {
        modelViewer.classList.add('loaded');
      });
    } else {
      console.log(`No model found for card at i:${index}`);
    }
  });
})();
function changeModelStyle(element, deg, invert = 0) {
  const card = element.closest('.card');
  const modelViewer = card.querySelector('model-viewer');
  if (modelViewer) { modelViewer.style.filter = `hue-rotate(${deg}deg) invert(${invert})`; }
}