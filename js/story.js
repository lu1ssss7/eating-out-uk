/*
 * Figure 1 - animations GSAP et liens entre GSAP et Chart.js
 *
 * Niveau 3 (GSAP) : compteurs des chiffres clés et de la valeur sélectionnée.
 * Niveau 4 (GSAP <-> Chart.js) :
 *   - "Play the story" : une timeline GSAP dessine la courbe en 3 étapes et pilote le graphique ;
 *   - un clic sur un point du graphique (événement figure1:select) lance un compteur GSAP.
 */

(function () {
  'use strict';

  const playBtn = document.getElementById('figure1-play');

  // Sans GSAP (connexion coupée, CDN bloqué), on le dit au lieu d'échouer en silence
  if (typeof gsap === 'undefined') {
    playBtn.disabled = true;
    playBtn.textContent = 'Animation unavailable';
    return;
  }

  const F = window.figure1;
  const D = F.data;
  const chart = F.chart;
  const LAST = D.periods.length - 1;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pct = (v) => (v * 100).toFixed(1) + '%';

  /* ---------- 1. Compteurs (niveau 3) ---------- */

  // Anime le texte d'un élément d'une valeur à une autre
  function countTo(el, from, to, duration) {
    const counter = { value: from };
    gsap.to(counter, {
      value: to,
      duration: reduceMotion ? 0 : duration,
      ease: 'power2.out',
      onUpdate: () => { el.textContent = pct(counter.value); }
    });
  }

  const tiles = document.querySelectorAll('.keyfig');

  // Les chiffres clés comptent depuis 0 quand ils apparaissent à l'écran (une seule fois)
  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    tiles.forEach((tile, n) => {
      const value = D.eatingOut[Number(tile.dataset.index)];
      gsap.delayedCall(n * 0.15, () => countTo(tile.querySelector('.keyfig__value'), 0, value, 1.2));
    });
    observer.disconnect();
  }, { threshold: 0.5 });
  observer.observe(document.getElementById('keyfigs'));

  /* ---------- 2. Chart.js -> GSAP : un point est sélectionné ---------- */

  let previous = D.eatingOut[F.covidIndex];

  chart.canvas.addEventListener('figure1:select', (event) => {
    const i = event.detail.index;
    countTo(document.querySelector('.figure__detail-value'), previous, D.eatingOut[i], 0.6);
    previous = D.eatingOut[i];
    // la carte du chiffre clé correspondant est marquée comme sélectionnée
    tiles.forEach((tile) => tile.setAttribute('aria-pressed', String(Number(tile.dataset.index) === i)));
  });

  // Clic sur un chiffre clé : on retrouve le point sur le graphique
  tiles.forEach((tile) => {
    tile.addEventListener('click', () => {
      stopStory();
      const i = Number(tile.dataset.index);
      F.setRange('all');
      F.highlight(i);
      F.select(i);
    });
  });

  /* ---------- 3. GSAP -> Chart.js : "Play the story" (niveau 4) ---------- */

  const caption = document.getElementById('figure1-story');
  const fullData = chart.data.datasets[0].data.slice();
  let story = null;

  // Affiche la courbe jusqu'à la position "progress" (ex. 18.5 = moitié du segment 18-19)
  function reveal(progress) {
    const whole = Math.floor(progress);
    const frac = progress - whole;
    chart.data.datasets[0].data = fullData.map((v, i) => {
      if (i <= whole) return v;
      if (i === whole + 1) return fullData[whole] + (v - fullData[whole]) * frac;
      return null;
    });
    chart.$revealed = whole;
    chart.update('none'); // pas d'animation Chart.js : c'est GSAP qui anime
  }

  function restoreChart() {
    chart.data.datasets[0].data = fullData.slice();
    chart.$revealed = undefined;
    chart.update('none');
  }

  // Une étape = dessiner la courbe jusqu'à un point, le sélectionner, afficher une phrase
  function step(timeline, cursor, toIndex, drawTime, text) {
    timeline.call(() => { caption.textContent = text; });
    if (reduceMotion) {
      // animations réduites : la portion de courbe apparaît d'un coup
      timeline.call(() => { cursor.progress = toIndex; reveal(toIndex); });
    } else {
      timeline.to(cursor, { progress: toIndex, duration: drawTime, ease: 'none', onUpdate: () => reveal(cursor.progress) });
    }
    timeline
      .call(() => { F.highlight(toIndex); F.select(toIndex); })
      .to({}, { duration: reduceMotion ? 3.5 : 1.5 }); // temps de lecture
  }

  function playStory() {
    const cursor = { progress: 0 };
    story = gsap.timeline({ onComplete: stopStory });
    story.call(() => { F.setView('out'); F.setRange('all'); reveal(0); });
    step(story, cursor, F.referenceIndex, 3.5,
      '2001 to 2019: around a quarter of food spending goes on eating out.');
    step(story, cursor, F.covidIndex, 1,
      '2020-21: lockdowns close restaurants, cafés and pubs. The share falls to 7.9%.');
    step(story, cursor, LAST, 2.5,
      '2024-25: eating out is back, but still 6.3 points below its pre-Covid level.');
    playBtn.textContent = 'Stop the story';
  }

  function stopStory() {
    if (!story) return;
    story.kill();
    story = null;
    restoreChart();
    playBtn.textContent = 'Play the story';
  }

  playBtn.addEventListener('click', () => (story ? stopStory() : playStory()));

  // Si le lecteur utilise un autre contrôle, l'histoire s'arrête et il garde la main
  document.querySelectorAll('[data-view]').forEach((el) => el.addEventListener('click', stopStory));
  document.querySelectorAll('#figure1-range, #figure1-alcohol').forEach((el) => el.addEventListener('change', stopStory));
  chart.canvas.addEventListener('pointerdown', stopStory);
})();
