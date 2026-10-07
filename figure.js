/* 체형 그림. 가까운 포즈 한 장을 고르고, 1%는 가로 비율로, 키는 같이 있는 사람 중 가장 큰 키로 맞춘다. */
(function (root) {
'use strict';
function bodyShape(r) {
  const cl = function (v, a, b) { return Math.max(0, Math.min(1, (v - a) / (b - a))); };
  const female = /여/.test(r.sex || '');
  const fp = r.pbf != null ? cl(r.pbf, female ? 20 : 12, female ? 40 : 32) : null;
  const fb = r.bmi != null ? cl(r.bmi, 20, 29) : null;
  const f = fp != null && fb != null ? fp * 0.7 + fb * 0.3 : (fp != null ? fp : (fb != null ? fb : 0.4));
  let m = 0.4;
  if (r.smm != null && r.height) {
    const hm = r.height / 100;
    m = cl(r.smm / (hm * hm), female ? 7.5 : 9.2, female ? 10 : 11.6);
  }
  const hs = r.height ? Math.max(0.86, Math.min(1.04, r.height / 183)) : 0.95;
  return { f: f, m: m, hs: hs };
}
function bodyBand(pbf) {
  const raw = pbf == null || isNaN(+pbf) ? 20 : +pbf;
  if (raw <= 10) return { lo: 10, hi: 10, t: 0, scaleX: 1, pbf: raw };
  if (raw >= 35) {
    return { lo: 35, hi: 35, t: 0, scaleX: 1 + Math.min(0.06, (raw - 35) * 0.004), pbf: raw };
  }
  const lo = Math.floor(raw / 5) * 5;
  const hi = lo + 5;
  const t = (raw - lo) / 5;
  return { lo: lo, hi: hi, t: t, scaleX: 1 + 0.03 * Math.sin(Math.PI * t), pbf: raw };
}
var ASSET_V = '20261007c';
var POSE = { 10: 'flex', 15: 'jog', 20: 'wave', 25: 'donut', 30: 'poke', 35: 'hug' };
var SPARKS = [[27.5, 4.3], [16.0, 8.0], [9.7, 12.9], [41.7, 16.2]];
var BLUSH = {
  poke: [[40.7, 18.5], [51.0, 18.8]],
  hug: [[40.9, 19.5], [52.5, 17.0]]
};
function nearest(band) {
  if (band.lo === band.hi || band.t < 0.5) return band.lo;
  return band.hi;
}
function asset(file, ext) {
  return 'img/body/' + file + '.' + ext + '?v=' + ASSET_V;
}
function picture(file, cls) {
  return '<picture class="bf-pic ' + cls + '">' +
    '<source srcset="' + asset(file, 'webp') + '" type="image/webp">' +
    '<img src="' + asset(file, 'png') + '" alt="" draggable="false">' +
    '</picture>';
}
function bodySVG(r, color, cls, maxCm) {
  const rec = r || {};
  const band = bodyBand(rec.pbf);
  const accent = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#7c9cff';
  const cm = rec.height ? +rec.height : 0;
  const max = maxCm && +maxCm > 0 ? +maxCm : (cm || 1);
  const h = cm ? Math.max(0.72, Math.min(1, cm / max)) : 1;
  const anchor = nearest(band);
  const pose = POSE[anchor] || 'wave';
  const phase = -(((Math.round((band.pbf || 20) * 10) + Math.round(cm || 0)) * 17) % 32) / 10;
  const aria = '체형 그림' + (rec.pbf != null ? ', 체지방률 ' + (+rec.pbf).toFixed(1) + '%' : '');
  let pics = picture('pose_bf' + anchor, 'bf-base');
  if (anchor === 25) pics = picture('pose_bf25_fx', 'bf-fx') + pics;
  if (anchor === 20) pics += picture('pose_bf20_fx', 'bf-fx');
  let extra = '';
  if (anchor === 10) {
    extra = SPARKS.map(function (p, i) {
      return '<i class="spark" style="left:' + p[0].toFixed(1) + '%;top:' + p[1].toFixed(1) +
        '%;animation-delay:calc(var(--phase) + ' + (i * 0.32).toFixed(2) + 's)"></i>';
    }).join('');
  } else if (BLUSH[pose]) {
    extra = BLUSH[pose].map(function (p) {
      return '<i class="blush" style="left:' + p[0].toFixed(1) + '%;top:' + p[1].toFixed(1) + '%"></i>';
    }).join('');
  }
  return '<div class="bodyfig pose-' + pose + ' ' + (cls || '') + '" role="img" aria-label="' + aria + '"' +
    ' data-pbf="' + (rec.pbf == null ? '' : (+rec.pbf).toFixed(1)) + '"' +
    ' data-pose="' + pose + '" data-anchor="' + anchor + '"' +
    ' data-lo="' + band.lo + '" data-hi="' + band.hi + '" data-t="' + band.t.toFixed(3) + '"' +
    ' data-sx="' + band.scaleX.toFixed(4) + '" data-h="' + h.toFixed(4) + '"' +
    ' style="--accent:' + accent + ';--h:' + h.toFixed(4) + ';--sx:' + band.scaleX.toFixed(4) +
    ';--aw:0.467;--phase:' + phase.toFixed(2) + 's;--joint-x:31.9%;--joint-y:28.1%;--fx-x:80.1%;--fx-y:52.5%">' +
    '<div class="bf-glow"></div><div class="bf-scale"><div class="bf-anim">' + pics + extra + '</div></div></div>';
}
  root.Inbody = root.Inbody || {};
  root.Inbody.bodySVG = bodySVG;
  root.Inbody.bodyShape = bodyShape;
  root.Inbody.bodyBand = bodyBand;
})(typeof globalThis !== 'undefined' ? globalThis : this);
