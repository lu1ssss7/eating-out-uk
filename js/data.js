/*
 * Données de la Figure 1
 * Source : Defra, Family Food datasets, fichier UKExp_17Sep26 (publié le 17/09/2026),
 * feuille "expenditure", lignes de niveau 1. Calculs : Annexe 1, feuille Clean_series.
 *   eatingOut        = eo90002 / t2   (colonne L)
 *   atHome           = cat105 / t2    (colonne M)
 *   eatingOutAlcohol = eo90001 / t1   (colonne N, test de robustesse)
 * Valeurs stockées en fractions (0.2896 = 28,96 %), arrondies à 4 décimales.
 * periodType : "financial" = année budgétaire (avril-mars), "calendar" = année civile.
 */
const FOOD_DATA = {
  referencePeriod: '2019-20',
  covidPeriod: '2020-21',
  periods: [
    '2001-02', '2002-03', '2003-04', '2004-05', '2005-06',
    '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014',
    '2015-16', '2016-17', '2017-18', '2018-19', '2019-20',
    '2020-21', '2021-22', '2022-23', '2023-24', '2024-25'
  ],
  periodType: [
    'financial', 'financial', 'financial', 'financial', 'financial',
    'calendar', 'calendar', 'calendar', 'calendar', 'calendar', 'calendar', 'calendar', 'calendar', 'calendar',
    'financial', 'financial', 'financial', 'financial', 'financial',
    'financial', 'financial', 'financial', 'financial', 'financial'
  ],
  eatingOut: [
    0.2698, 0.2722, 0.2697, 0.2765, 0.2715,
    0.2707, 0.2645, 0.2620, 0.2571, 0.2584, 0.2608, 0.2562, 0.2587, 0.2638,
    0.2743, 0.2873, 0.2789, 0.2830, 0.2896,
    0.0787, 0.1944, 0.2072, 0.2117, 0.2270
  ],
  atHome: [
    0.7302, 0.7278, 0.7303, 0.7235, 0.7285,
    0.7293, 0.7355, 0.7380, 0.7429, 0.7416, 0.7392, 0.7438, 0.7413, 0.7362,
    0.7257, 0.7127, 0.7211, 0.7183, 0.7104,
    0.9213, 0.8056, 0.7928, 0.7883, 0.7730
  ],
  eatingOutAlcohol: [
    0.3333, 0.3340, 0.3266, 0.3296, 0.3263,
    0.3222, 0.3130, 0.3042, 0.2976, 0.2971, 0.2989, 0.2921, 0.2920, 0.2955,
    0.3073, 0.3170, 0.3072, 0.3115, 0.3179,
    0.0840, 0.2176, 0.2327, 0.2385, 0.2537
  ]
};
