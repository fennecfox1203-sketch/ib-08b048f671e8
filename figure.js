/* 체형 그림. 10~35% 앵커 그림을 1%마다 섞고, 키는 같이 있는 사람 중 가장 큰 키에 맞춘다. */
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
var ASSET_V = '20261007';
function asset(n, ext) {
  return 'img/body/bf' + n + '.' + ext + '?v=' + ASSET_V;
}
function picture(n, role, opacity, maskN) {
  const attrs = role === 'over'
    ? ' class="bf-pic bf-over" style="opacity:' + opacity.toFixed(3) + ';--bf-mask:url(\'' + asset(maskN, 'png') + '\')"'
    : ' class="bf-pic bf-base"';
  return '<picture' + attrs + '>' +
    '<source srcset="' + asset(n, 'webp') + '" type="image/webp">' +
    '<img src="' + asset(n, 'png') + '" alt="" draggable="false">' +
    '</picture>';
}
function bodySVG(r, color, cls, maxCm) {
  const rec = r || {};
  const band = bodyBand(rec.pbf);
  const accent = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#7c9cff';
  const cm = rec.height ? +rec.height : 0;
  const max = maxCm && +maxCm > 0 ? +maxCm : (cm || 1);
  const h = cm ? Math.max(0.72, Math.min(1, cm / max)) : 1;
  const aria = '체형 그림' + (rec.pbf != null ? ', 체지방률 ' + (+rec.pbf).toFixed(1) + '%' : '');
  /* 가까운 앵커를 불투명하게 깔고, 먼 앵커만 그 실루엣 안에 겹친다. */
  let pics;
  if (band.hi === band.lo || band.t <= 0.001) pics = picture(band.lo, 'base');
  else if (band.t >= 0.999) pics = picture(band.hi, 'base');
  else if (band.t < 0.5) pics = picture(band.lo, 'base') + picture(band.hi, 'over', band.t, band.lo);
  else pics = picture(band.hi, 'base') + picture(band.lo, 'over', 1 - band.t, band.hi);
  return '<div class="bodyfig ' + (cls || '') + '" role="img" aria-label="' + aria + '"' +
    ' data-pbf="' + (rec.pbf == null ? '' : (+rec.pbf).toFixed(1)) + '"' +
    ' data-lo="' + band.lo + '" data-hi="' + band.hi + '" data-t="' + band.t.toFixed(3) + '"' +
    ' data-sx="' + band.scaleX.toFixed(4) + '" data-h="' + h.toFixed(4) + '"' +
    ' style="--accent:' + accent + ';--h:' + h.toFixed(4) + ';--sx:' + band.scaleX.toFixed(4) + '">' +
    '<div class="bf-glow"></div><div class="bf-stack">' + pics + '</div></div>';
}
  root.Inbody = root.Inbody || {};
  root.Inbody.bodySVG = bodySVG;
  root.Inbody.bodyShape = bodyShape;
  root.Inbody.bodyBand = bodyBand;
})(typeof globalThis !== 'undefined' ? globalThis : this);
