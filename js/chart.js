/*
 * Figure 1 - part de la dépense alimentaire faite hors domicile (Chart.js)
 *
 * Niveau 1 (Chart.js) : infobulle, légende cliquable, clic sur un point.
 * Niveau 2 (HTML -> graphique) : boutons de séries, sélecteur de période, case "Include alcohol".
 * Les données viennent de data.js (FOOD_DATA). story.js utilise l'objet window.figure1.
 */

(function () {
  'use strict';

  const D = FOOD_DATA;
  const REF = D.periods.indexOf(D.referencePeriod); // 2019-20
  const COVID = D.periods.indexOf(D.covidPeriod);   // 2020-21
  const LAST = D.periods.length - 1;                // 2024-25

  // Les couleurs sont définies une seule fois, dans style.css
  const css = getComputedStyle(document.documentElement);
  const color = (name) => css.getPropertyValue(name).trim();
  const C = {
    out: color('--eating-out'),
    home: color('--at-home'),
    ink: color('--ink'),
    muted: color('--muted'),
    rule: color('--rule'),
    band: color('--band'),
    paper: color('--paper')
  };

  const pct = (v) => (v * 100).toFixed(1) + '%';
  const pts = (v) => (v < 0 ? '−' : '+') + Math.abs(v * 100).toFixed(1) + ' pts';
  const isCalendar = (i) => D.periodType[i] === 'calendar';
  const toPercent = (values) => values.map((v) => v * 100);

  Chart.defaults.font.family = color('--sans');
  Chart.defaults.color = C.muted;

  /* ---------- Plugin : bande Covid et valeurs clés écrites sur la courbe ---------- */

  const annotations = {
    id: 'annotations',

    beforeDatasetsDraw(chart) {
      const { ctx, chartArea, scales: { x } } = chart;
      if (COVID < x.min || COVID > x.max) return;
      const step = chartArea.width / (x.max - x.min);
      ctx.save();
      ctx.fillStyle = C.band;
      ctx.fillRect(x.getPixelForValue(COVID) - step / 2, chartArea.top, step, chartArea.height);
      ctx.restore();
    },

    afterDatasetsDraw(chart) {
      if (!chart.isDatasetVisible(0)) return;
      const { ctx, scales: { x } } = chart;
      const points = chart.getDatasetMeta(0).data;
      const revealed = chart.$revealed ?? LAST; // story.js peut masquer la fin de la courbe

      ctx.save();
      ctx.font = 'bold 13px ' + Chart.defaults.font.family;
      ctx.fillStyle = C.ink;
      [[REF, -12], [COVID, 22], [LAST, -12]].forEach(([i, dy]) => {
        if (i < x.min || i > x.max || i > revealed) return;
        ctx.textAlign = i === x.max ? 'right' : 'center';
        ctx.fillText(pct(D.eatingOut[i]), points[i].x, points[i].y + dy);
      });
      ctx.restore();
    }
  };

  /* ---------- Séries ---------- */

  // Points creux = années civiles (2006-2014), points pleins = années budgétaires
  function line(label, values, lineColor, extra = {}) {
    return {
      label,
      data: toPercent(values),
      borderColor: lineColor,
      backgroundColor: lineColor,
      pointBackgroundColor: D.periods.map((_, i) => (isCalendar(i) ? C.paper : lineColor)),
      pointRadius: 4,
      pointHoverRadius: 7,
      borderWidth: 2.5,
      clip: 10,
      ...extra
    };
  }

  const datasets = [
    line('Eating out', D.eatingOut, C.out),
    line('At home', D.atHome, C.home, { hidden: true }),
    line('Eating out, incl. alcohol', D.eatingOutAlcohol, C.out, {
      hidden: true, borderDash: [3, 4], borderWidth: 2, pointRadius: 0
    }),
    {
      label: 'Pre-Covid level (' + D.referencePeriod + ')',
      data: D.periods.map(() => D.eatingOut[REF] * 100),
      borderColor: C.muted,
      borderDash: [6, 5],
      borderWidth: 1.5,
      pointRadius: 0,
      pointHoverRadius: 0
    }
  ];

  /* ---------- Graphique ---------- */

  const canvas = document.getElementById('figure1-canvas');
  const detail = document.getElementById('figure1-detail');
  const alcoholBox = document.getElementById('figure1-alcohol');
  const rangeSelect = document.getElementById('figure1-range');
  const viewButtons = document.querySelectorAll('[data-view]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const chart = new Chart(canvas, {
    type: 'line',
    data: { labels: D.periods, datasets },
    plugins: [annotations],
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: reduceMotion ? false : { duration: 800 },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { autoSkip: false, maxRotation: 55, minRotation: 55, font: { size: 11 } }
        },
        y: {
          min: 0,
          max: 35,
          grid: { color: C.rule },
          border: { display: false },
          ticks: { stepSize: 5, callback: (v) => v + '%' }
        }
      },
      plugins: {
        // Interaction 2 : légende cliquable (comportement natif de Chart.js)
        legend: {
          align: 'start',
          labels: {
            color: C.ink,
            usePointStyle: true,
            pointStyle: 'line',
            // la série avec alcool n'apparaît dans la légende que si la case est cochée
            filter: (item) => item.datasetIndex !== 2 || alcoholBox.checked
          }
        },
        // Interaction 1 : infobulle
        tooltip: {
          backgroundColor: C.ink,
          padding: 10,
          filter: (item) => item.datasetIndex !== 3,
          callbacks: {
            title: (items) => items[0].label + (isCalendar(items[0].dataIndex) ? ' (calendar year)' : ' (financial year)'),
            // pendant l'histoire animée, la fin de la courbe est vide (null) : rien à afficher
            label: (item) => item.parsed.y === null ? null : ' ' + item.dataset.label + ': ' + item.parsed.y.toFixed(1) + '%'
          }
        }
      },
      // Interaction 3 : clic sur un point
      onClick: (event, elements) => {
        if (elements.length) select(elements[0].index);
      }
    }
  });

  // Une fois les polices web chargées, on redessine avec la bonne police
  document.fonts.ready.then(() => chart.update('none'));

  /* ---------- Panneau "Selected period" ---------- */

  function select(i) {
    const change = i === REF
      ? 'This is the pre-Covid reference.'
      : 'Change vs ' + D.referencePeriod + ': ' + pts(D.eatingOut[i] - D.eatingOut[REF]) + '.';
    detail.innerHTML =
      '<strong>' + D.periods[i] + '</strong> (' + (isCalendar(i) ? 'calendar' : 'financial') + ' year): ' +
      '<span class="figure__detail-value">' + pct(D.eatingOut[i]) + '</span> eating out, ' +
      pct(D.atHome[i]) + ' at home. ' + change;
    // Événement écouté par story.js (lien Chart.js -> GSAP, niveau 4)
    canvas.dispatchEvent(new CustomEvent('figure1:select', { detail: { index: i } }));
  }

  /* ---------- Contrôles extérieurs (niveau 2) ---------- */

  function setView(view) {
    chart.setDatasetVisibility(0, view !== 'home');
    chart.setDatasetVisibility(1, view !== 'out');
    chart.setDatasetVisibility(2, view !== 'home' && alcoholBox.checked);
    // dès que "At home" est affiché, l'axe va jusqu'à 100 % pour ne pas couper la série
    chart.options.scales.y.max = view === 'out' ? 35 : 100;
    chart.options.scales.y.ticks.stepSize = view === 'out' ? 5 : 20;
    viewButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.view === view)));
    chart.update();
  }

  function setRange(range) {
    const ranges = { all: [0, LAST], before: [0, REF], after: [REF, LAST] };
    rangeSelect.value = range;
    [chart.options.scales.x.min, chart.options.scales.x.max] = ranges[range];
    chart.update();
  }

  // Met un point en avant comme au survol (utilisé par les chiffres clés et l'histoire animée)
  function highlight(i) {
    const active = [{ datasetIndex: 0, index: i }];
    chart.setActiveElements(active);
    chart.tooltip.setActiveElements(active, { x: 0, y: 0 });
    chart.update();
  }

  viewButtons.forEach((btn) => btn.addEventListener('click', () => setView(btn.dataset.view)));
  rangeSelect.addEventListener('change', () => setRange(rangeSelect.value));
  alcoholBox.addEventListener('change', () => {
    chart.setDatasetVisibility(2, alcoholBox.checked && chart.isDatasetVisible(0));
    chart.update();
  });

  select(COVID); // au chargement, le panneau montre l'année la plus marquante

  window.figure1 = { chart, data: D, referenceIndex: REF, covidIndex: COVID, select, setView, setRange, highlight };
})();
