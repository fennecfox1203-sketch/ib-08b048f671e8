/* 체형 그림 스타일 A. 눈·입 없는 운동 마스코트.
   키 대비 머리 약 1/6.5, 다리는 키의 45% 근처.
   체지방이 낮으면 어깨가 넓고 허리에 손을 올린다. 높으면 몸통·허벅지가 둥글고 팔은 편하게 내린다. */
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
  const rgb = [n >> 16 & 255, n >> 8 & 255, n & 255].map(function (v) {
    return Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k));
  });
  return '#' + rgb.map(function (v) { return Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'); }).join('');
}
const N = function (v) { return (+v).toFixed(1); };
function limbPath(p0, p1, p2, w0, w1, w2) {
  const steps = 16, L = [], R = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps, u = 1 - t;
    const x = u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0];
    const y = u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1];
    let dx = 2 * u * (p1[0] - p0[0]) + 2 * t * (p2[0] - p1[0]);
    let dy = 2 * u * (p1[1] - p0[1]) + 2 * t * (p2[1] - p1[1]);
    const len = Math.hypot(dx, dy) || 1;
    dx /= len; dy /= len;
    const s = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    const ss = s * s * (3 - 2 * s);
    const w = (t < 0.5 ? w0 + (w1 - w0) * ss : w1 + (w2 - w1) * ss) / 2;
    L.push([x - dy * w, y + dx * w]);
    R.push([x + dy * w, y - dx * w]);
  }
  const P = function (p) { return N(p[0]) + ' ' + N(p[1]); };
  let d = 'M' + P(L[0]);
  for (let i = 1; i <= steps; i++) d += 'L' + P(L[i]);
  d += 'L' + P(R[steps]);
  for (let i = steps - 1; i >= 0; i--) d += 'L' + P(R[i]);
  return d + 'Z';
}
function layout(s) {
  const f = s.f, def = s.def, fem = s.female;
  const cx = 64;
  const yHead = 12;
  const ySole = 226;
  const H = ySole - yHead;
  const headH = H / 6.5;
  const legH = H * 0.45;
  const yChin = yHead + headH;
  const ySh = yChin + headH * 0.18;
  const yHip = ySole - legH;
  const torso = yHip - ySh;
  const yChest = ySh + torso * 0.34;
  const yWaist = ySh + torso * 0.68;
  const yHem = yWaist + torso * 0.2;
  const shW = 23 + 8 * (1 - f) + 9 * def - 1.1 * fem;
  const waistW = 12.2 + 15.5 * f - 3.6 * def + 0.5 * fem;
  const chestW = shW * 0.74 + waistW * 0.18 + 2.4 * (1 - f);
  const hipW = Math.max(waistW * 0.94, 16 + 9.5 * f + 1.8 * fem - 0.6 * def);
  const thigh = 16.5 + 9 * f + 2.2 * def + fem;
  const calf = 11.2 + 4.2 * f + 1.1 * def;
  const armU = 8.6 + 3.4 * def + 2.2 * f;
  const armL = armU * 0.78;
  const hrx = headH * 0.48;
  const hry = headH * 0.52;
  const hcy = yHead + hry * 0.92;
  return {
    f: f, def: def, fem: fem, cx: cx, yHead: yHead, ySole: ySole, H: H, headH: headH, legH: legH,
    yChin: yChin, ySh: ySh, yHip: yHip, torso: torso, yChest: yChest, yWaist: yWaist, yHem: yHem,
    shW: shW, chestW: chestW, waistW: waistW, hipW: hipW, thigh: thigh, calf: calf, armU: armU, armL: armL,
    hrx: hrx, hry: hry, hcy: hcy, pose: f < 0.38 ? 'hip' : 'relax',
    legRatio: legH / H, heads: H / headH
  };
}
function bodySVG_A2(r, color, cls) {
  const s = bodyShape(r || {});
  const g = layout(s);
  const id = 'fg' + (++_figSeq);
  const accent = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#7c9cff';
  const skin = '#f0c4a4', skinHi = '#f8dcc6', skinSh = '#d19a78';
  const hair = '#2c2724', hairHi = '#5a4e46';
  const tee = accent, teeHi = tint(accent, 0.42), teeSh = tint(accent, -0.30), teeDeep = tint(accent, -0.46);
  const shorts = tint(accent, -0.40), shortHi = tint(accent, -0.18), shortSh = tint(accent, -0.55);
  const cx = g.cx;
  const tank = g.pose === 'hip';
  const sc = 0.97 + (s.hs - 0.9) * 0.2;
  function volume(pathD, fill, shadow, hx, hy, hrx, hry, hi, clip, sx, sy, srx, sry) {
    return '<path d="' + pathD + '" fill="' + fill + '"/>' +
      '<clipPath id="' + clip + '"><path d="' + pathD + '"/></clipPath>' +
      '<ellipse cx="' + N(sx) + '" cy="' + N(sy) + '" rx="' + N(srx) + '" ry="' + N(sry) + '" fill="' + shadow + '" clip-path="url(#' + clip + ')"/>' +
      '<ellipse cx="' + N(hx) + '" cy="' + N(hy) + '" rx="' + N(hrx) + '" ry="' + N(hry) + '" fill="' + hi + '" clip-path="url(#' + clip + ')"/>';
  }
  function hand(x, y, rot) {
    return '<g transform="translate(' + N(x) + ' ' + N(y) + ') rotate(' + N(rot) + ')">' +
      '<ellipse cx="1.2" cy="0.6" rx="6.4" ry="4.8" fill="' + skinSh + '"/>' +
      '<ellipse cx="0" cy="0" rx="6.2" ry="4.6" fill="' + skin + '"/>' +
      '<ellipse cx="4.4" cy="-3.1" rx="2.3" ry="1.7" fill="' + skin + '"/>' +
      '<ellipse cx="-1.6" cy="-1.2" rx="2.4" ry="1.4" fill="' + skinHi + '"/>' +
      '</g>';
  }
  const strap = tank ? g.shW * 0.72 : g.shW;
  const sleeve = tank ? 0 : 15;
  const sleeveOut = tank ? 0 : 4.5;
  const ySl = g.ySh + sleeve;
  let shirt = 'M' + N(cx - 6.4) + ' ' + N(g.ySh - 1);
  shirt += 'C' + N(cx - strap * 0.35) + ' ' + N(g.ySh - 7) + ' ' + N(cx - strap + 6) + ' ' + N(g.ySh - 2) + ' ' + N(cx - strap) + ' ' + N(g.ySh + 5);
  if (tank) {
    shirt += 'C' + N(cx - g.chestW - 2) + ' ' + N(g.ySh + 14) + ' ' + N(cx - g.chestW - 1) + ' ' + N(g.yChest - 4) + ' ' + N(cx - g.chestW) + ' ' + N(g.yChest);
    shirt += 'C' + N(cx - g.chestW + 1) + ' ' + N(g.yChest + 10) + ' ' + N(cx - g.waistW - 0.5) + ' ' + N(g.yWaist - 8) + ' ' + N(cx - g.waistW) + ' ' + N(g.yWaist);
  } else {
    shirt += 'C' + N(cx - strap - sleeveOut) + ' ' + N(g.ySh + 7) + ' ' + N(cx - strap - sleeveOut) + ' ' + N(ySl) + ' ' + N(cx - strap + 3) + ' ' + N(ySl + 1);
    shirt += 'C' + N(cx - g.chestW - 1) + ' ' + N(ySl + 4) + ' ' + N(cx - g.chestW) + ' ' + N(g.yChest) + ' ' + N(cx - g.chestW + 1) + ' ' + N(g.yChest + 6);
    shirt += 'C' + N(cx - g.waistW - 0.4) + ' ' + N(g.yWaist - 6) + ' ' + N(cx - g.waistW) + ' ' + N(g.yWaist - 2) + ' ' + N(cx - g.waistW) + ' ' + N(g.yWaist);
  }
  shirt += 'C' + N(cx - g.waistW) + ' ' + N((g.yWaist + g.yHem) / 2) + ' ' + N(cx - g.hipW) + ' ' + N(g.yHem - 5) + ' ' + N(cx - g.hipW * 0.98) + ' ' + N(g.yHem);
  shirt += 'Q' + N(cx) + ' ' + N(g.yHem + 2.5 + 2 * g.f) + ' ' + N(cx + g.hipW * 0.98) + ' ' + N(g.yHem);
  shirt += 'C' + N(cx + g.hipW) + ' ' + N(g.yHem - 5) + ' ' + N(cx + g.waistW) + ' ' + N((g.yWaist + g.yHem) / 2) + ' ' + N(cx + g.waistW) + ' ' + N(g.yWaist);
  if (tank) {
    shirt += 'C' + N(cx + g.waistW + 0.5) + ' ' + N(g.yWaist - 8) + ' ' + N(cx + g.chestW - 1) + ' ' + N(g.yChest + 10) + ' ' + N(cx + g.chestW) + ' ' + N(g.yChest);
    shirt += 'C' + N(cx + g.chestW + 1) + ' ' + N(g.yChest - 4) + ' ' + N(cx + g.chestW + 2) + ' ' + N(g.ySh + 14) + ' ' + N(cx + strap) + ' ' + N(g.ySh + 5);
  } else {
    shirt += 'C' + N(cx + g.waistW) + ' ' + N(g.yWaist - 2) + ' ' + N(cx + g.waistW + 0.4) + ' ' + N(g.yWaist - 6) + ' ' + N(cx + g.chestW - 1) + ' ' + N(g.yChest + 6);
    shirt += 'C' + N(cx + g.chestW) + ' ' + N(g.yChest) + ' ' + N(cx + g.chestW + 1) + ' ' + N(ySl + 4) + ' ' + N(cx + strap - 3) + ' ' + N(ySl + 1);
    shirt += 'C' + N(cx + strap + sleeveOut) + ' ' + N(ySl) + ' ' + N(cx + strap + sleeveOut) + ' ' + N(g.ySh + 7) + ' ' + N(cx + strap) + ' ' + N(g.ySh + 5);
  }
  shirt += 'C' + N(cx + strap - 6) + ' ' + N(g.ySh - 2) + ' ' + N(cx + strap * 0.35) + ' ' + N(g.ySh - 7) + ' ' + N(cx + 6.4) + ' ' + N(g.ySh - 1);
  shirt += 'Q' + N(cx) + ' ' + N(g.ySh + (tank ? 8 : 5.5)) + ' ' + N(cx - 6.4) + ' ' + N(g.ySh - 1) + 'Z';

  const spread = 11 + 1.4 * g.f;
  const yAnk = g.ySole - 7;
  const yKnee = g.yHip + (yAnk - g.yHip) * 0.46;
  function leg(sign) {
    const x0 = cx + sign * (spread - 0.4);
    const x1 = cx + sign * (spread + 0.2);
    const x2 = cx + sign * (spread + 1.4);
    const d = limbPath([x0, g.yHip + 4], [x1, yKnee], [x2, yAnk], g.thigh, g.thigh * 0.82, g.calf);
    const hx = x0 + sign * g.thigh * 0.16;
    const sx = x0 - sign * g.thigh * 0.1;
    return volume(d, skin, skinSh, hx, g.yHip + 16, g.thigh * 0.28, 12, skinHi, id + 'l' + sign, sx, yKnee + 6, g.calf * 0.55, 16);
  }
  const yShort = g.yHip + 12 + 4 * g.f;
  const outTop = g.hipW + 0.8;
  const outBot = spread + g.thigh * 0.48;
  const inn = 3.1 + g.f;
  const shortsD = 'M' + N(cx - outTop) + ' ' + N(g.yWaist + 8) +
    'C' + N(cx - outTop - 0.4) + ' ' + N(g.yHip) + ' ' + N(cx - outBot) + ' ' + N(yShort - 8) + ' ' + N(cx - outBot) + ' ' + N(yShort) +
    'Q' + N(cx - inn - 1) + ' ' + N(yShort + 2) + ' ' + N(cx - inn) + ' ' + N(yShort - 1) +
    'Q' + N(cx) + ' ' + N(yShort - 8) + ' ' + N(cx + inn) + ' ' + N(yShort - 1) +
    'Q' + N(cx + inn + 1) + ' ' + N(yShort + 2) + ' ' + N(cx + outBot) + ' ' + N(yShort) +
    'C' + N(cx + outBot) + ' ' + N(yShort - 8) + ' ' + N(cx + outTop + 0.4) + ' ' + N(g.yHip) + ' ' + N(cx + outTop) + ' ' + N(g.yWaist + 8) +
    'Q' + N(cx) + ' ' + N(g.yWaist + 5) + ' ' + N(cx - outTop) + ' ' + N(g.yWaist + 8) + 'Z';

  function delt(sign) {
    const x = cx + sign * g.shW;
    const y = g.ySh + 8;
    const rx = 6.4 + 2.2 * g.def;
    const ry = 5.4 + 1.2 * g.def;
    return '<ellipse cx="' + N(x + sign) + '" cy="' + N(y + 1) + '" rx="' + N(rx) + '" ry="' + N(ry) + '" fill="' + skinSh + '"/>' +
      '<ellipse cx="' + N(x) + '" cy="' + N(y) + '" rx="' + N(rx) + '" ry="' + N(ry) + '" fill="' + skin + '"/>' +
      '<ellipse cx="' + N(x - sign * 1.4) + '" cy="' + N(y - 1.4) + '" rx="2.2" ry="1.6" fill="' + skinHi + '"/>';
  }
  function arm(sign) {
    let x0, y0, x1, y1, x2, y2, rot;
    if (g.pose === 'hip') {
      x0 = cx + sign * (g.shW * 0.92);
      y0 = g.ySh + 7;
      x1 = cx + sign * (g.shW + 16);
      y1 = g.yChest + 4;
      x2 = cx + sign * (g.waistW + 4);
      y2 = g.yWaist + 1;
      rot = sign * -6;
    } else {
      const reach = Math.max(g.shW, g.chestW);
      x0 = cx + sign * (g.shW * 0.9);
      y0 = g.ySh + 8;
      x1 = cx + sign * (reach + 15);
      y1 = g.yChest + 2;
      x2 = cx + sign * (g.hipW + 2);
      y2 = g.yWaist + (g.yHip - g.yWaist) * 0.72;
      rot = sign * 24;
    }
    const d = limbPath([x0, y0], [x1, y1], [x2, y2], g.armU, g.armU * 0.86, g.armL);
    const hx = (x0 + x1) / 2 + sign * 1.2;
    const hy = (y0 + y1) / 2 - 2;
    const sx = (x1 + x2) / 2 - sign * 1.4;
    const sy = (y1 + y2) / 2 + 3;
    return volume(d, skin, skinSh, hx, hy, 3.6, 8, skinHi, id + 'a' + sign, sx, sy, 4.2, 9) + hand(x2, y2, rot);
  }
  function shoe(sign, back) {
    const ax = cx + sign * (spread + 2.2);
    const y = g.ySole - (back ? 2 : 0);
    const toe = ax + sign * (back ? 15 : 17);
    const heel = ax - sign * 8.4;
    const sole = teeDeep;
    return '<g>' +
      '<path d="M' + N(heel) + ' ' + N(y - 8) +
      'Q' + N(heel - sign * 1.2) + ' ' + N(y - 1) + ' ' + N(ax) + ' ' + N(y - 0.4) +
      'Q' + N(toe) + ' ' + N(y - 0.2) + ' ' + N(toe + sign * 2) + ' ' + N(y - 6) +
      'Q' + N(toe - sign * 1) + ' ' + N(y - 12) + ' ' + N(ax + sign * 2) + ' ' + N(y - 13) +
      'Q' + N(heel + sign * 3) + ' ' + N(y - 14) + ' ' + N(heel) + ' ' + N(y - 8) + 'Z" fill="#f4f1eb"/>' +
      '<path d="M' + N(heel + sign * 0.3) + ' ' + N(y - 4.6) +
      'L' + N(toe) + ' ' + N(y - 5.2) +
      'L' + N(toe + sign * 0.8) + ' ' + N(y - 1.4) +
      'Q' + N(ax) + ' ' + N(y + 0.2) + ' ' + N(heel - sign * 0.4) + ' ' + N(y - 1.6) + 'Z" fill="' + sole + '"/>' +
      '<path d="M' + N(ax - sign * 2) + ' ' + N(y - 11) + 'L' + N(ax + sign * 6) + ' ' + N(y - 9.2) +
      '" fill="none" stroke="' + accent + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '</g>';
  }
  const neck = 'M' + N(cx - 6.4) + ' ' + N(g.yChin - 2) +
    'L' + N(cx - 9.2) + ' ' + N(g.ySh + 3) +
    'Q' + N(cx) + ' ' + N(g.ySh + 7) + ' ' + N(cx + 9.2) + ' ' + N(g.ySh + 3) +
    'L' + N(cx + 6.4) + ' ' + N(g.yChin - 2) +
    'Q' + N(cx) + ' ' + N(g.yChin + 2) + ' ' + N(cx - 6.4) + ' ' + N(g.yChin - 2) + 'Z';
  const yHair = g.hcy - g.hry * 0.42;
  const hairD = 'M' + N(cx - g.hrx * 0.82) + ' ' + N(yHair) +
    'C' + N(cx - g.hrx * 1.05) + ' ' + N(g.hcy - g.hry * 0.7) + ' ' + N(cx - g.hrx * 0.35) + ' ' + N(g.hcy - g.hry * 1.2) + ' ' + N(cx + g.hrx * 0.05) + ' ' + N(g.hcy - g.hry * 1.18) +
    'C' + N(cx + g.hrx * 0.7) + ' ' + N(g.hcy - g.hry * 1.12) + ' ' + N(cx + g.hrx * 1.08) + ' ' + N(g.hcy - g.hry * 0.35) + ' ' + N(cx + g.hrx * (g.fem ? 0.7 : 0.78)) + ' ' + N(yHair + (g.fem ? g.hry * 0.12 : 0)) +
    'C' + N(cx + g.hrx * 0.28) + ' ' + N(yHair - g.hry * 0.16) + ' ' + N(cx - g.hrx * 0.22) + ' ' + N(yHair - g.hry * 0.2) + ' ' + N(cx - g.hrx * 0.82) + ' ' + N(yHair) + 'Z';
  const sideburn = g.fem
    ? '<path d="M' + N(cx - g.hrx * 0.78) + ' ' + N(yHair) + 'C' + N(cx - g.hrx * 1.05) + ' ' + N(g.hcy) + ' ' + N(cx - g.hrx * 0.7) + ' ' + N(g.hcy + g.hry * 0.35) + ' ' + N(cx - g.hrx * 0.42) + ' ' + N(g.hcy + g.hry * 0.15) + 'Z" fill="' + hair + '"/>'
    : '';
  const collar = 'M' + N(cx - 7) + ' ' + N(g.ySh + 1) + 'Q' + N(cx) + ' ' + N(g.ySh + (tank ? 9 : 6.2)) + ' ' + N(cx + 7) + ' ' + N(g.ySh + 1);
  const sideSeamL = 'M' + N(cx - (tank ? strap - 1 : g.chestW * 0.85)) + ' ' + N(tank ? g.ySh + 18 : ySl) + 'Q' + N(cx - g.waistW + 0.5) + ' ' + N(g.yWaist) + ' ' + N(cx - g.hipW * 0.9) + ' ' + N(g.yHem - 1);
  const sideSeamR = 'M' + N(cx + (tank ? strap - 1 : g.chestW * 0.85)) + ' ' + N(tank ? g.ySh + 18 : ySl) + 'Q' + N(cx + g.waistW - 0.5) + ' ' + N(g.yWaist) + ' ' + N(cx + g.hipW * 0.9) + ' ' + N(g.yHem - 1);
  const shoulderSeamL = 'M' + N(cx - 6) + ' ' + N(g.ySh + 1) + 'Q' + N(cx - strap * 0.5) + ' ' + N(g.ySh - 1) + ' ' + N(cx - strap + 1) + ' ' + N(g.ySh + 4);
  const shoulderSeamR = 'M' + N(cx + 6) + ' ' + N(g.ySh + 1) + 'Q' + N(cx + strap * 0.5) + ' ' + N(g.ySh - 1) + ' ' + N(cx + strap - 1) + ' ' + N(g.ySh + 4);
  const cuff = tank ? '' : '<path d="M' + N(cx - strap - 1) + ' ' + N(ySl - 1) + 'Q' + N(cx - strap + 1) + ' ' + N(ySl + 3) + ' ' + N(cx - strap + 5) + ' ' + N(ySl) +
    '" fill="none" stroke="' + teeDeep + '" stroke-width="1.3" stroke-linecap="round"/>' +
    '<path d="M' + N(cx + strap + 1) + ' ' + N(ySl - 1) + 'Q' + N(cx + strap - 1) + ' ' + N(ySl + 3) + ' ' + N(cx + strap - 5) + ' ' + N(ySl) +
    '" fill="none" stroke="' + teeDeep + '" stroke-width="1.3" stroke-linecap="round"/>';
  const rim = 'M' + N(cx - strap) + ' ' + N(g.ySh + 6) + 'Q' + N(cx - g.waistW - 0.5) + ' ' + N(g.yWaist) + ' ' + N(cx - g.hipW * 0.96) + ' ' + N(g.yHem);
  const aria = '체형 그림' + (r && r.pbf != null ? ', 체지방률 ' + N(r.pbf) + '%' : '');
  return '<svg class="bodyfig ' + (cls || '') + '" viewBox="0 0 128 236" preserveAspectRatio="xMidYMax meet" role="img" aria-label="' + aria + '"' +
    ' data-pose="' + g.pose + '" data-leg="' + g.legRatio.toFixed(2) + '" data-heads="' + g.heads.toFixed(2) + '">' +
    '<defs><radialGradient id="' + id + 'g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#000" stop-opacity=".34"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="' + cx + '" cy="228" rx="' + N(22 + 8 * g.f) + '" ry="4.6" fill="url(#' + id + 'g)"/>' +
    '<g class="pose" transform="translate(64 226) scale(' + sc.toFixed(3) + ') translate(-64 -226)">' +
    leg(-1) + leg(1) +
    volume(shortsD, shorts, shortSh, cx - outTop * 0.35, g.yWaist + 14, 8, 7, shortHi, id + 's', cx + outTop * 0.4, yShort - 3, 9, 7) +
    '<path d="M' + N(cx - outTop + 1.5) + ' ' + N(g.yWaist + 12) + 'Q' + N(cx - outBot + 1) + ' ' + N((g.yWaist + yShort) / 2) + ' ' + N(cx - outBot + 1) + ' ' + N(yShort - 2) + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round" opacity=".7"/>' +
    '<path d="M' + N(cx + outTop - 1.5) + ' ' + N(g.yWaist + 12) + 'Q' + N(cx + outBot - 1) + ' ' + N((g.yWaist + yShort) / 2) + ' ' + N(cx + outBot - 1) + ' ' + N(yShort - 2) + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round" opacity=".7"/>' +
    (tank ? delt(-1) + delt(1) : '') +
    '<path d="' + shirt + '" fill="' + tee + '"/>' +
    '<clipPath id="' + id + 't"><path d="' + shirt + '"/></clipPath>' +
    '<g clip-path="url(#' + id + 't)">' +
    '<ellipse cx="' + N(cx + g.chestW * 0.78) + '" cy="' + N((g.yChest + g.yHem) / 2) + '" rx="' + N(Math.max(6, g.chestW * 0.22)) + '" ry="' + N(g.torso * 0.34) + '" fill="' + teeSh + '"/>' +
    '<ellipse cx="' + N(cx - g.chestW * 0.22) + '" cy="' + N(g.ySh + g.torso * 0.16) + '" rx="5.2" ry="3.1" fill="' + teeHi + '"/>' +
    '</g>' +
    '<path d="' + collar + '" fill="none" stroke="' + teeDeep + '" stroke-width="2.6" stroke-linecap="round"/>' +
    '<path d="' + shoulderSeamL + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round"/>' +
    '<path d="' + shoulderSeamR + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round"/>' +
    '<path d="' + sideSeamL + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round" opacity=".85"/>' +
    '<path d="' + sideSeamR + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round" opacity=".85"/>' +
    '<path d="M' + N(cx - g.hipW * 0.9) + ' ' + N(g.yHem - 0.5) + 'Q' + N(cx) + ' ' + N(g.yHem + 2.2) + ' ' + N(cx + g.hipW * 0.9) + ' ' + N(g.yHem - 0.5) + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.3" stroke-linecap="round"/>' +
    (tank ? '<path d="M' + N(cx - g.chestW * 0.62) + ' ' + N(g.yChest + 1) + 'Q' + N(cx) + ' ' + N(g.yChest + 5.5) + ' ' + N(cx + g.chestW * 0.62) + ' ' + N(g.yChest + 1) + '" fill="none" stroke="' + teeDeep + '" stroke-width="1.15" stroke-linecap="round" opacity=".8"/>' : '') +
    cuff +
    '<path d="' + rim + '" fill="none" stroke="' + accent + '" stroke-width="1.7" stroke-linecap="round" opacity=".55"/>' +
    arm(-1) + arm(1) +
    volume(neck, skin, skinSh, cx - 2.4, g.yChin + 3, 2.6, 3.4, skinHi, id + 'n', cx + 3.2, g.ySh - 1, 3.4, 4.2) +
    '<ellipse cx="' + N(cx - g.hrx - 1.6) + '" cy="' + N(g.hcy + g.hry * 0.08) + '" rx="4.6" ry="5.8" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx - g.hrx - 1.8) + '" cy="' + N(g.hcy + g.hry * 0.04) + '" rx="4.1" ry="5.3" fill="' + skin + '"/>' +
    '<ellipse cx="' + N(cx - g.hrx - 1.2) + '" cy="' + N(g.hcy + g.hry * 0.08) + '" rx="1.5" ry="2.6" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx + g.hrx + 1.1) + '" cy="' + N(g.hcy + g.hry * 0.1) + '" rx="3.8" ry="5" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx + g.hrx + 0.8) + '" cy="' + N(g.hcy + g.hry * 0.06) + '" rx="3.4" ry="4.6" fill="' + skin + '"/>' +
    '<ellipse cx="' + N(cx + g.hrx + 1.2) + '" cy="' + N(g.hcy + g.hry * 0.1) + '" rx="1.2" ry="2.2" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx + 1) + '" cy="' + N(g.hcy + 1.4) + '" rx="' + N(g.hrx) + '" ry="' + N(g.hry) + '" fill="' + skinSh + '"/>' +
    '<ellipse cx="' + N(cx) + '" cy="' + N(g.hcy) + '" rx="' + N(g.hrx) + '" ry="' + N(g.hry) + '" fill="' + skin + '"/>' +
    sideburn +
    '<path d="' + hairD + '" fill="' + hair + '"/>' +
    '<path d="M' + N(cx - g.hrx * 0.35) + ' ' + N(g.hcy - g.hry * 0.72) + 'Q' + N(cx) + ' ' + N(g.hcy - g.hry * 0.98) + ' ' + N(cx + g.hrx * 0.32) + ' ' + N(g.hcy - g.hry * 0.66) + '" fill="none" stroke="' + hairHi + '" stroke-width="2" stroke-linecap="round" opacity=".75"/>' +
    shoe(-1, false) + shoe(1, true) +
    '</g></svg>';
}
function bodySVG(r, color, cls) { return bodySVG_A2(r, color, cls); }
  root.Inbody = root.Inbody || {};
  root.Inbody.bodySVG = bodySVG;
  root.Inbody.bodyShape = bodyShape;
})(typeof globalThis !== 'undefined' ? globalThis : this);
