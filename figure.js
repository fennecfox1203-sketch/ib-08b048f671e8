/* 체형 그림 스타일 A. 납작한 스티커 느낌. 눈·입은 없다.
   체지방이 낮으면 어깨가 넓고 허리가 잘록하다. 높으면 둥글지만 과장하지 않는다.
   근육 선은 체지방이 낮을 때만 약하게 넣는다. */
(function (root) {
'use strict';
function bodyShape(r) {
  const cl = function (v, a, b) { return Math.max(0, Math.min(1, (v - a) / (b - a))); };
  const female = /여/.test(r.sex || '');
  const bmi = r.bmi != null ? r.bmi : (r.weight && r.height ? r.weight / Math.pow(r.height / 100, 2) : null);
  const fp = r.pbf != null ? cl(r.pbf, 8, 34) : null;
  const fb = bmi != null ? cl(bmi, 18.5, 32) : null;
  const f = fp != null && fb != null ? fp * 0.9 + fb * 0.1 : (fp != null ? fp : (fb != null ? fb : 0.4));
  let m = 0.42;
  if (r.smm != null && r.height) {
    const hm = r.height / 100;
    m = cl(r.smm / (hm * hm), female ? 6.6 : 8.2, female ? 10.2 : 12.4);
  }
  const hs = r.height ? Math.max(0.9, Math.min(1.06, r.height / 176)) : 0.98;
  const def = m * (1 - f) * (1 - f);
  return { f: f, m: m, hs: hs, def: def, female: female ? 1 : 0 };
}
let _figSeq = 0;
function tint(hex, k) {
  const h = /^#[0-9a-fA-F]{6}$/.test(hex || '') ? hex : '#7c9cff';
  const n = parseInt(h.slice(1), 16);
  let rgb = [n >> 16 & 255, n >> 8 & 255, n & 255];
  rgb = rgb.map(function (v) { return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)); });
  return '#' + rgb.map(function (v) { return v.toString(16).padStart(2, '0'); }).join('');
}
const F1 = function (v) { return (+v).toFixed(1); };
function limbPath(p0, p1, p2, w0, w1, w2, capS, capE) {
  const N = 18, L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    let dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    let dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const d = Math.hypot(dx, dy) || 1;
    dx /= d; dy /= d;
    const s = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const ss = s * s * (3 - 2 * s);
    const w = (t < 0.5 ? w0 + (w1 - w0) * ss : w1 + (w2 - w1) * ss) / 2;
    L.push([x - dy * w, y + dx * w]);
    R.push([x + dy * w, y - dx * w]);
  }
  const P = function (p) { return F1(p[0]) + ',' + F1(p[1]); };
  let d = 'M' + P(L[0]);
  for (let i = 1; i <= N; i++) d += ' L' + P(L[i]);
  d += capE !== false ? ' A' + F1(w2 / 2) + ',' + F1(w2 / 2) + ' 0 0 0 ' + P(R[N]) : ' L' + P(R[N]);
  for (let i = N - 1; i >= 0; i--) d += ' L' + P(R[i]);
  d += capS !== false ? ' A' + F1(w0 / 2) + ',' + F1(w0 / 2) + ' 0 0 0 ' + P(L[0]) : ' L' + P(L[0]);
  return d + ' Z';
}
function bodySVG_A2(r, color, cls) {
  const s = bodyShape(r || {});
  const f = s.f, def = s.def, fem = s.female;
  const id = 'fg' + (++_figSeq);
  const accent = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#7c9cff';
  const skin = '#f1c7aa', skinHi = '#f8ddc8', skinSh = '#d9a888';
  const hair = '#322c28', hairHi = tint(accent, 0.15);
  const tee = accent, teeHi = tint(accent, 0.46), teeSh = tint(accent, -0.28), teeDeep = tint(accent, -0.48);
  const shorts = tint(accent, -0.38);
  const cx = 60;
  const headTop = 14 + (1.04 - s.hs) * 16;
  const hrx = 13.4 + 2.2 * f;
  const hry = 15.0 + 2.2 * f;
  const hcy = headTop + hry;
  const neckW = 5.0 + 1.15 * f - 0.35 * def;
  const yNeck = hcy + hry * 0.55;
  const ySh = yNeck + 7.6 - 0.8 * f;
  const torsoH = 56 + 6 * (1 - f);
  const yWaist = ySh + torsoH * 0.56;
  const yHem = ySh + torsoH;
  const yHip = yHem - 2;
  const sh = 17.2 + 7.4 * def + 0.6 * s.m * (1 - f) - 2.2 * fem;
  const waist = 9.2 + 16.2 * f - 3.2 * def + 0.5 * fem;
  const hem = Math.max(waist * 0.94 + 1.2 * f + 1.8 * fem, waist - 1);
  const thigh = 15.2 + 10.5 * f + 1.4 * def;
  const kneeW = 9.4 + 4.2 * f + 0.4 * def;
  const ankleW = 6.6 + 1.4 * f;
  const armU = 9.2 + 3.4 * f - 1.4 * def;
  const armL = 6.6 + 2.2 * f - 0.4 * def;
  const tank = f < 0.4;
  const sleeveDrop = tank ? 9 : 16 + 3 * f;
  const sleeveOut = tank ? 0.4 : 2.4 + 1.2 * f;
  const shortLen = 22 + 7 * f;
  const hipOff = 4.6 + fem * 0.8;
  const kneeOff = 6.4 + 2.6 * f;
  const ankOff = 8.2 + 3.0 * f;
  const ankleY = 214;
  const N = F1;
  function C(nums) { return nums.map(N).join(','); }
  const neckD = 'M' + C([cx - neckW, hcy + hry * 0.35]) +
    ' L' + C([cx - neckW - 0.4, ySh + 2]) +
    ' Q' + C([cx, ySh + 5, cx + neckW + 0.4, ySh + 2]) +
    ' L' + C([cx + neckW, hcy + hry * 0.35]) + ' Z';
  const shirt = 'M' + C([cx - neckW - 0.2, yNeck + 1]) +
    ' C' + C([cx - neckW - 6, ySh - 1, cx - sh + (tank ? 8 : 5), ySh - 5, cx - sh, ySh + 1]) +
    ' C' + C([cx - sh - sleeveOut, ySh + 5, cx - sh - sleeveOut, ySh + sleeveDrop, cx - sh + (tank ? 5 : 1), ySh + sleeveDrop + 1]) +
    ' C' + C([cx - sh + 7, ySh + sleeveDrop + 2, cx - waist - 1.5, yWaist - 8, cx - waist, yWaist]) +
    ' C' + C([cx - waist + 0.4, (yWaist + yHem) / 2, cx - hem, yHem - 8, cx - hem, yHem]) +
    ' Q' + C([cx, yHem + 2.2 + 2.4 * f, cx + hem, yHem]) +
    ' C' + C([cx + hem, yHem - 8, cx + waist - 0.4, (yWaist + yHem) / 2, cx + waist, yWaist]) +
    ' C' + C([cx + waist + 1.5, yWaist - 8, cx + sh - 7, ySh + sleeveDrop + 2, cx + sh - (tank ? 5 : 1), ySh + sleeveDrop + 1]) +
    ' C' + C([cx + sh + sleeveOut, ySh + sleeveDrop, cx + sh + sleeveOut, ySh + 5, cx + sh, ySh + 1]) +
    ' C' + C([cx + sh - (tank ? 8 : 5), ySh - 5, cx + neckW + 6, ySh - 1, cx + neckW + 0.2, yNeck + 1]) +
    ' Q' + C([cx, yNeck + (tank ? 9 : 6.5), cx - neckW - 0.2, yNeck + 1]) + ' Z';
  const hi = 'M' + C([cx - neckW, yNeck + 4]) +
    ' C' + C([cx - sh * 0.55, ySh + 2, cx - sh * 0.72, ySh + 16, cx - waist * 0.55, yWaist - 2]) +
    ' L' + C([cx - waist * 0.15, yWaist]) +
    ' C' + C([cx - sh * 0.2, ySh + 18, cx - 2, ySh + 4, cx - 1, yNeck + 8]) + ' Z';
  const shade = 'M' + C([cx + sh * 0.15, ySh + 8]) +
    ' C' + C([cx + sh * 0.72, ySh + 14, cx + waist * 0.85, yWaist, cx + hem * 0.7, yHem - 2]) +
    ' L' + C([cx + hem * 0.15, yHem]) +
    ' C' + C([cx + waist * 0.2, yWaist + 4, cx + 4, ySh + 20, cx + 2, ySh + 6]) + ' Z';
  const yShort = yHip + shortLen;
  const inBot = 2.6 + 1.4 * f;
  const outTop = hem + 1.2;
  const outBot = hipOff + thigh / 2 + 1.2;
  const shortsD = 'M' + C([cx - outTop, yHem - 8]) +
    ' C' + C([cx - outTop - 1, yHip, cx - outBot - 0.4, yShort - 8, cx - outBot, yShort]) +
    ' Q' + C([cx - outBot + 1, yShort + 2.4, cx - inBot, yShort + 1.2]) +
    ' Q' + C([cx, yShort - 7 - 2 * f, cx + inBot, yShort + 1.2]) +
    ' Q' + C([cx + outBot - 1, yShort + 2.4, cx + outBot, yShort]) +
    ' C' + C([cx + outBot + 0.4, yShort - 8, cx + outTop + 1, yHip, cx + outTop, yHem - 8]) +
    ' Q' + C([cx, yHem - 4, cx - outTop, yHem - 8]) + ' Z';
  const stripe = 'M' + C([cx - outTop + 2.2, yHem - 4]) +
    ' C' + C([cx - outBot + 1, yHip + 4, cx - outBot + 2, yShort - 4, cx - outBot + 3.2, yShort - 0.4]);
  function arm(side) {
    const sign = side;
    const edge = Math.max(sh * 0.92, hem);
    const x0 = cx + sign * (sh - 4);
    const y0 = ySh + 8;
    const x1 = cx + sign * (edge + 0.2);
    const y1 = ySh + 26;
    const x2 = cx + sign * (edge - 2.2);
    const y2 = yHem + 2;
    return limbPath([x0, y0], [x1, y1], [x2, y2], armU, (armU + armL) * 0.48, armL, false, true);
  }
  function leg(side) {
    const sign = side;
    const x0 = cx + sign * hipOff;
    const x1 = cx + sign * kneeOff;
    const x2 = cx + sign * ankOff;
    const y0 = yHip + 2;
    const y1 = yHip + (ankleY - yHip) * 0.52;
    return limbPath([x0, y0], [x1, y1], [x2, ankleY], thigh, kneeW, ankleW, false, false);
  }
  function shoe(side) {
    const sign = side;
    const ax = cx + sign * ankOff;
    const y = ankleY - 2;
    const toe = ax + sign * 8.5;
    const heel = ax - sign * 5.2;
    return '<path d="M' + C([heel, y]) + ' Q' + C([heel - sign * 1.2, y + 5.2, ax, y + 6.2]) +
      ' Q' + C([toe, y + 6.4, toe + sign * 1.4, y + 3.2]) +
      ' Q' + C([toe - sign * 0.4, y + 0.4, ax + sign * 2, y - 0.6]) +
      ' Q' + C([ax - sign * 2, y - 1.4, heel, y]) + ' Z" fill="#f6f3ee"/>' +
      '<path d="M' + C([heel + sign * 0.4, y + 3.6]) + ' Q' + C([ax, y + 5.4, toe + sign * 0.6, y + 3.4]) +
      ' L' + C([toe + sign * 0.2, y + 5.2]) + ' Q' + C([ax, y + 6.6, heel - sign * 0.2, y + 4.6]) + ' Z" fill="' + teeDeep + '"/>' +
      '<path d="M' + C([ax - sign * 1.5, y + 0.2]) + ' Q' + C([ax + sign * 2.4, y + 1.6, ax + sign * 3.6, y + 3.4]) +
      '" fill="none" stroke="' + tee + '" stroke-width="1.4" stroke-linecap="round"/>';
  }
  const hairD = fem
    ? 'M' + C([cx - hrx * 0.92, hcy - hry * 0.08]) +
      ' C' + C([cx - hrx * 1.08, hcy - hry * 0.85, cx - hrx * 0.2, hcy - hry * 1.2, cx + hrx * 0.12, hcy - hry * 1.16]) +
      ' C' + C([cx + hrx * 0.95, hcy - hry * 1.05, cx + hrx * 1.12, hcy - hry * 0.2, cx + hrx * 0.78, hcy + hry * 0.22]) +
      ' C' + C([cx + hrx * 0.42, hcy + hry * 0.02, cx - hrx * 0.05, hcy + hry * 0.08, cx - hrx * 0.55, hcy + hry * 0.28]) +
      ' C' + C([cx - hrx * 0.95, hcy + hry * 0.22, cx - hrx * 1.02, hcy + hry * 0.02, cx - hrx * 0.92, hcy - hry * 0.08]) + ' Z'
    : 'M' + C([cx - hrx * 0.86, hcy - hry * 0.05]) +
      ' C' + C([cx - hrx * 1.02, hcy - hry * 0.72, cx - hrx * 0.25, hcy - hry * 1.18, cx + hrx * 0.08, hcy - hry * 1.16]) +
      ' C' + C([cx + hrx * 0.72, hcy - hry * 1.08, cx + hrx * 1.04, hcy - hry * 0.45, cx + hrx * 0.84, hcy - hry * 0.02]) +
      ' C' + C([cx + hrx * 0.35, hcy - hry * 0.28, cx - hrx * 0.25, hcy - hry * 0.2, cx - hrx * 0.86, hcy - hry * 0.05]) + ' Z';
  const lock = fem
    ? '<path d="M' + C([cx - hrx * 0.72, hcy - hry * 0.05]) +
      ' C' + C([cx - hrx * 1.15, hcy + hry * 0.15, cx - hrx * 0.95, hcy + hry * 0.85, cx - hrx * 0.35, hcy + hry * 0.95]) +
      ' C' + C([cx - hrx * 0.05, hcy + hry * 0.7, cx - hrx * 0.35, hcy + hry * 0.25, cx - hrx * 0.4, hcy + hry * 0.05]) + ' Z" fill="' + hair + '"/>'
    : '';
  const seam = def > 0.32
    ? '<path d="M' + C([cx - sh * 0.28, ySh + 15]) + ' Q' + C([cx, ySh + 20 + 4 * def, cx + sh * 0.28, ySh + 15]) +
      '" fill="none" stroke="' + teeDeep + '" stroke-width="1.3" stroke-linecap="round" opacity=".45"/>'
    : '';
  const aria = '체형 그림' + (r && r.pbf != null ? ', 체지방률 ' + N(r.pbf) + '%' : '');
  return '<svg class="bodyfig ' + (cls || '') + '" viewBox="0 0 120 240" preserveAspectRatio="xMidYMax meet" role="img" aria-label="' + aria + '">' +
    '<defs><radialGradient id="' + id + '" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".38"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="' + cx + '" cy="228" rx="' + N(18 + 10 * f) + '" ry="5.2" fill="url(#' + id + ')"/>' +
    '<g class="pose">' +
    '<path d="' + leg(-1) + '" fill="' + skin + '"/>' +
    '<path d="' + leg(1) + '" fill="' + skin + '"/>' +
    '<path d="' + shortsD + '" fill="' + shorts + '"/>' +
    '<path d="' + stripe + '" fill="none" stroke="' + teeHi + '" stroke-width="2" stroke-linecap="round" opacity=".85"/>' +
    '<path d="' + arm(-1) + '" fill="' + skin + '"/>' +
    '<path d="' + arm(1) + '" fill="' + skin + '"/>' +
    '<path d="' + neckD + '" fill="' + skinSh + '"/>' +
    '<path d="' + shirt + '" fill="' + tee + '"/>' +
    '<path d="' + shade + '" fill="' + teeSh + '" opacity=".55"/>' +
    '<path d="' + hi + '" fill="' + teeHi + '" opacity=".55"/>' +
    seam +
    '<path d="M' + C([cx - neckW + 0.4, yNeck + 1.5]) + ' Q' + C([cx, yNeck + (tank ? 7.5 : 5.4), cx + neckW - 0.4, yNeck + 1.5]) +
    '" fill="none" stroke="' + teeDeep + '" stroke-width="2.4" stroke-linecap="round"/>' +
    '<ellipse cx="' + N(cx - hrx + 1.2) + '" cy="' + N(hcy + 1) + '" rx="' + N(hrx * 0.16) + '" ry="' + N(hry * 0.2) + '" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx + hrx - 1.2) + '" cy="' + N(hcy + 1) + '" rx="' + N(hrx * 0.16) + '" ry="' + N(hry * 0.2) + '" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx) + '" cy="' + N(hcy) + '" rx="' + N(hrx) + '" ry="' + N(hry) + '" fill="' + skin + '"/>' +
    lock +
    '<path d="' + hairD + '" fill="' + hair + '"/>' +
    '<path d="M' + C([cx - hrx * 0.42, hcy - hry * 0.78]) + ' Q' + C([cx, hcy - hry * 0.98, cx + hrx * 0.36, hcy - hry * 0.7]) +
    '" fill="none" stroke="' + hairHi + '" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>' +
    shoe(-1) + shoe(1) +
    '</g></svg>';
}
function bodySVG(r, color, cls) { return bodySVG_A2(r, color, cls); }
  root.Inbody = root.Inbody || {};
  root.Inbody.bodySVG = bodySVG;
  root.Inbody.bodyShape = bodyShape;
})(typeof globalThis !== 'undefined' ? globalThis : this);
