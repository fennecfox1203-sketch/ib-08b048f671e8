/* 그래프는 숫자만 그린다. 계산은 parse.js 에 있다. */
(function (root) {
  'use strict';

  const I = function () { return root.Inbody; };

  function finite(n) { return typeof n === 'number' && Number.isFinite(n); }

  function donut(score, color) {
    const s = Math.max(0, Math.min(100, finite(score) ? score : 0));
    const r = 52;
    const c = 2 * Math.PI * r;
    const d = c * s / 100;
    const label = score == null ? '–' : I().esc(score);
    return '<svg class="donut" viewBox="0 0 132 132" role="img" aria-label="인바디점수 ' + label + '점">' +
      '<circle cx="66" cy="66" r="' + r + '" fill="none" stroke="#0e131a" stroke-width="14"/>' +
      '<circle cx="66" cy="66" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + d.toFixed(1) + ' ' + (c - d).toFixed(1) + '" transform="rotate(-90 66 66)"/>' +
      '<text x="66" y="70" text-anchor="middle" font-size="38" font-weight="800" fill="#e8eef7">' + label + '</text>' +
      '<text x="66" y="94" text-anchor="middle" font-size="13" fill="#d5deea">/100점</text></svg>';
  }

  function rangeBar(o) {
    const esc = I().esc;
    const fx = I().fx;
    const judgeClass = I().judgeClass;
    const v = o.v;
    const r = o.r;
    const d = o.d == null ? 1 : o.d;
    let j = '';
    let cls = '';
    if (v != null && r) {
      if (v < r[0]) { j = '표준이하'; cls = 'low'; }
      else if (v > r[1]) { j = '표준이상'; cls = 'warn'; }
      else { j = '표준'; cls = 'ok'; }
    }
    if (o.j) { j = o.j; cls = judgeClass(o.j); }
    let svg = '';
    if (v != null && r && r[1] > r[0] && finite(v)) {
      const span = r[1] - r[0];
      let lo = Math.max(o.min != null ? o.min : -Infinity, r[0] - span);
      let hi = r[1] + span * 1.5;
      if (v > hi) hi = v + span * 0.25;
      if (v < lo) lo = Math.max(0, v - span * 0.25);
      const W = 320;
      const X = function (x) { return Math.max(0, Math.min(W, (x - lo) / (hi - lo) * W)); };
      const a = X(r[0]);
      const b = X(r[1]);
      const vx = X(v);
      const fc = cls === 'ok' ? '#3dd68c' : cls === 'low' ? '#5ac8fa' : cls === 'bad' ? '#ff6b7a' : '#ffb020';
      const anchor = function (x) { return x < 28 ? 'start' : x > W - 28 ? 'end' : 'middle'; };
      svg = '<svg class="rb-svg" viewBox="0 0 320 48" preserveAspectRatio="xMidYMid meet">' +
        '<rect x="0" y="14" width="' + a.toFixed(1) + '" height="16" rx="3" fill="#1b2330"/>' +
        '<rect x="' + a.toFixed(1) + '" y="14" width="' + Math.max(0, b - a).toFixed(1) + '" height="16" fill="#24334a"/>' +
        '<rect x="' + b.toFixed(1) + '" y="14" width="' + Math.max(0, W - b).toFixed(1) + '" height="16" rx="3" fill="#1b2330"/>' +
        '<rect x="0" y="18" width="' + vx.toFixed(1) + '" height="8" rx="2" fill="' + fc + '"/>' +
        '<line x1="' + a.toFixed(1) + '" y1="10" x2="' + a.toFixed(1) + '" y2="34" stroke="#6b7a90" stroke-width="1"/>' +
        '<line x1="' + b.toFixed(1) + '" y1="10" x2="' + b.toFixed(1) + '" y2="34" stroke="#6b7a90" stroke-width="1"/>' +
        '<text x="' + ((a + b) / 2).toFixed(1) + '" y="10" font-size="12" text-anchor="middle" fill="#d5deea">표준</text>' +
        '<text x="' + a.toFixed(1) + '" y="46" font-size="12" text-anchor="' + anchor(a) + '" fill="#d5deea">' + (o.labels ? esc(o.labels[0]) : fx(r[0], o.rd == null ? d : o.rd)) + '</text>' +
        '<text x="' + b.toFixed(1) + '" y="46" font-size="12" text-anchor="' + anchor(b) + '" fill="#d5deea">' + (o.labels ? esc(o.labels[1]) : fx(r[1], o.rd == null ? d : o.rd)) + '</text>' +
        '</svg>';
    } else if (o.noRange) {
      svg = '<div class="rb-sub">' + esc(o.noRange) + '</div>';
    }
    return '<div class="rb"><div class="rb-head"><span class="n">' + esc(o.n) + '</span><span><span class="v">' + fx(v, d) + '<small>' + esc(o.u || '') + '</small></span>' +
      (j ? '<span class="j ' + cls + '">' + esc(j) + '</span>' : '') + '</span></div>' + svg +
      (o.note ? '<div class="rb-sub">' + o.note + '</div>' : '') + '</div>';
  }

  function lineChart(title, recs, key, unit, d, color, opt) {
    const esc = I().esc;
    const fx = I().fx;
    const dayDiff = I().dayDiff;
    const shortDate = I().shortDate;
    const monthSpan = I().monthSpan;
    const addDays = I().addDays;
    opt = opt || {};
    const inRange = function (date) {
      if (!date) return false;
      if (opt.from && date < opt.from) return false;
      if (opt.to && date > opt.to) return false;
      return true;
    };
    const pts = (recs || []).filter(function (r) { return r[key] != null && r.date && inRange(r.date); })
      .slice()
      .sort(function (a, b) { return a.date.localeCompare(b.date) || String(a.time || '').localeCompare(String(b.time || '')); });
    const goal = (opt.goal || []).filter(function (g) { return g && g.date && inRange(g.date) && finite(g.v); })
      .slice()
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
    const band = opt.band && finite(opt.band[0]) && finite(opt.band[1]) ? opt.band : null;
    const last = pts.length ? pts[pts.length - 1][key] : null;
    let deltaTxt = '';
    if (pts.length >= 2) {
      const p10 = Math.pow(10, d);
      const dv = Math.round((pts[pts.length - 1][key] - pts[0][key]) * p10) / p10;
      const eps = d === 0 ? 0.5 : 0.05;
      deltaTxt = Math.abs(dv) < eps ? '변화 없음' : Math.abs(dv).toFixed(d) + (dv < 0 ? ' 감소' : ' 증가');
    }
    const head = '<div class="t"><span>' + esc(title) + '</span><span class="num">' +
      (last == null ? '–' : fx(last, d) + ' ' + esc(unit)) +
      (deltaTxt ? '<span class="chg">' + esc(deltaTxt) + '</span>' : '') + '</span></div>';
    if (!pts.length && goal.length < 2 && !band) return '<div class="lc">' + head + '</div>';

    const W = 320;
    const H = 168;
    const pl = 48;
    const pr = 22;
    const pt = 22;
    const pb = 34;
    const ys = pts.map(function (p) { return p[key]; }).concat(goal.map(function (g) { return g.v; }));
    if (band) ys.push(band[0], band[1]);
    let mn = Math.min.apply(null, ys.filter(finite));
    let mx = Math.max.apply(null, ys.filter(finite));
    if (!finite(mn) || !finite(mx)) return '<div class="lc">' + head + '</div>';
    if (mx - mn < 0.6) { const mid = (mx + mn) / 2; mn = mid - 0.6; mx = mid + 0.6; }
    else { const pad = (mx - mn) * 0.18; mn -= pad; mx += pad; }
    const dates = [];
    if (opt.from) dates.push(opt.from);
    if (opt.to) dates.push(opt.to);
    pts.forEach(function (p) { dates.push(p.date); });
    goal.forEach(function (g) { dates.push(g.date); });
    dates.sort();
    const d0 = dates[0];
    const d1 = dates[dates.length - 1];
    const span = Math.max(1, dayDiff(d0, d1) || 1);
    const plotW = W - pl - pr;
    const Xd = function (date) {
      if (!date || d0 === d1) return pl + plotW / 2;
      const along = dayDiff(d0, date);
      if (along == null) return pl;
      return pl + plotW * Math.max(0, Math.min(1, along / span));
    };
    const Y = function (v) { return pt + (H - pt - pb) * (1 - (v - mn) / (mx - mn)); };
    const months = monthSpan(d0, d1);
    const showMonths = months.length >= 2;
    const aria = esc(title) + (deltaTxt ? ', ' + esc(deltaTxt) : '') + (goal.length > 1 ? ', 목표선' : '') + (band ? ', 유지 범위' : '');
    let s = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + aria + '">';
    [mn, (mn + mx) / 2, mx].forEach(function (v) {
      const y = Y(v);
      s += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#3a4658"/>';
      s += '<text x="' + (pl - 6) + '" y="' + (y + 4).toFixed(1) + '" font-size="12" text-anchor="end" fill="#d5deea">' + fx(v, d) + '</text>';
    });
    if (band) {
      const y0 = Y(band[0]);
      const y1 = Y(band[1]);
      s += '<rect x="' + pl + '" y="' + Math.min(y0, y1).toFixed(1) + '" width="' + plotW + '" height="' + Math.abs(y0 - y1).toFixed(1) + '" fill="rgba(61,214,140,.16)"/>';
    }
    if (showMonths) {
      let lastLabel = -999;
      months.forEach(function (ym) {
        const start = ym + '-01';
        const next = addDays(ym.slice(0, 4) + '-' + ym.slice(5) + '-01', 32);
        const end = next ? addDays(next.slice(0, 7) + '-01', -1) : start;
        const a = start < d0 ? d0 : start;
        const b = !end || end > d1 ? d1 : end;
        const x1 = Xd(a);
        const x2 = Xd(b);
        const empty = !pts.some(function (p) { return p.date.slice(0, 7) === ym; });
        if (empty && x2 > x1) {
          s += '<rect x="' + x1.toFixed(1) + '" y="' + pt + '" width="' + (x2 - x1).toFixed(1) + '" height="' + (H - pt - pb) + '" fill="rgba(255,176,32,.10)"/>';
        }
        const mid = Xd(dayDiff(a, b) ? addDays(a, Math.round((dayDiff(a, b) || 0) / 2)) : a);
        if (mid - lastLabel < 36) return;
        lastLabel = mid;
        s += '<text x="' + mid.toFixed(1) + '" y="' + (H - 10) + '" font-size="12" text-anchor="middle" fill="' + (empty ? '#ffb020' : '#d5deea') + '">' + (+ym.slice(5)) + '월' + (empty ? ' ·' : '') + '</text>';
      });
    }
    if (goal.length > 1) {
      s += '<polyline fill="none" stroke="#d5deea" stroke-width="2" stroke-dasharray="5 4" stroke-linejoin="round" stroke-linecap="round" points="' +
        goal.map(function (g) { return Xd(g.date).toFixed(1) + ',' + Y(g.v).toFixed(1); }).join(' ') + '"/>';
    }
    const seen = {};
    const coords = pts.map(function (p) {
      const n = seen[p.date] || 0;
      seen[p.date] = n + 1;
      const x = Xd(p.date) + (pts.length === 1 ? 0 : n * 6);
      return { p: p, x: x, y: Y(p[key]) };
    });
    if (coords.length > 1) {
      s += '<polyline fill="none" stroke="' + color + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="' +
        coords.map(function (c) { return c.x.toFixed(1) + ',' + c.y.toFixed(1); }).join(' ') + '"/>';
    }
    let lastValueX = -999;
    coords.forEach(function (c, i) {
      s += '<circle data-date="' + esc(c.p.date) + '" cx="' + c.x.toFixed(1) + '" cy="' + c.y.toFixed(1) + '" r="4.5" fill="' + color + '"/>';
      if (!showMonths) {
        s += '<text x="' + c.x.toFixed(1) + '" y="' + (H - 10) + '" font-size="12" text-anchor="middle" fill="#d5deea">' + esc(shortDate(c.p.date)) + '</text>';
      }
      const edge = i === 0 || i === coords.length - 1;
      if ((pts.length <= 4 || edge) && c.x - lastValueX >= 28) {
        lastValueX = c.x;
        const anchor = i === 0 && c.x < pl + 20 ? 'start' : (i === coords.length - 1 && c.x > W - pr - 20 ? 'end' : 'middle');
        s += '<text x="' + c.x.toFixed(1) + '" y="' + Math.max(14, c.y - 8).toFixed(1) + '" font-size="13" font-weight="700" text-anchor="' + anchor + '" fill="#e8eef7">' + fx(c.p[key], d) + '</text>';
      }
    });
    s += '</svg>';
    return '<div class="lc">' + head + s + '</div>';
  }

  function goalChartSVG(goals, data, name, P, m, today) {
    const I0 = I();
    const esc = I0.esc;
    const fx = I0.fx;
    const dayDiff = I0.dayDiff;
    const shortDate = I0.shortDate;
    const dday = I0.dday;
    const c = (data && data.colorOf && data.colorOf(name)) || '#6aa8ff';
    const tp = I0.goalPath(goals, name, m.k);
    if (tp.length < 2) return '';
    const W = 340;
    const H = 236;
    const L = 44;
    const R = 26;
    const T = 28;
    const B = 48;
    const pw = W - L - R;
    const ph = H - T - B;
    const d0 = tp[0].date;
    const d1 = tp[tp.length - 1].date;
    let act = ((data && data.by && data.by[name]) || [])
      .filter(function (x) { return x[m.k] != null && x.date; })
      .map(function (x) { return { date: x.date, v: x[m.k] }; })
      .sort(function (a, b) { return a.date.localeCompare(b.date); });
    let x0 = d0;
    let x1 = d1;
    const kept = [];
    let dropped = 0;
    act.forEach(function (a) {
      const before = dayDiff(a.date, d0);
      const after = dayDiff(d1, a.date);
      if (before != null && before > 45) { dropped += 1; return; }
      if (after != null && after > 45) { dropped += 1; return; }
      if (a.date < x0) x0 = a.date;
      if (a.date > x1) x1 = a.date;
      kept.push(a);
    });
    act = kept;
    const span = Math.max(1, dayDiff(x0, x1) || 1);
    const X = function (dt) {
      const along = dayDiff(x0, dt);
      if (along == null) return L;
      return L + Math.max(0, Math.min(1, along / span)) * pw;
    };
    const md = (P.mode || {})[m.k] || {};
    let vals = tp.map(function (p) { return p.v; }).concat(act.map(function (a) { return a.v; }));
    if (md.band) vals = vals.concat(md.band);
    vals = vals.filter(finite);
    if (!vals.length) return '';
    let lo = Math.min.apply(null, vals);
    let hi = Math.max.apply(null, vals);
    if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.16;
    lo -= pad;
    hi += pad * 1.15;
    const Y = function (v) { return T + (1 - (v - lo) / (hi - lo)) * ph; };
    const fmt = function (v) { return fx(v, m.d); };
    let s = '<svg class="gsvg" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(name) + ' ' + esc(m.n) + ' 목표 과정' + (dropped ? ', 기간 밖 ' + dropped + '건 제외' : '') + '">';
    if (md.band) {
      const y1 = Y(md.band[1]);
      const y0 = Y(md.band[0]);
      s += '<rect x="' + L + '" y="' + y1.toFixed(1) + '" width="' + pw + '" height="' + Math.max(0, y0 - y1).toFixed(1) + '" fill="rgba(61,214,140,.11)"/>';
      s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="rgba(61,214,140,.45)" stroke-dasharray="2 3"/>';
      s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y0.toFixed(1) + '" y2="' + y0.toFixed(1) + '" stroke="rgba(61,214,140,.45)" stroke-dasharray="2 3"/>';
      s += '<text x="' + (L + 4) + '" y="' + (y0 - 4).toFixed(1) + '" font-size="10" fill="#3dd68c" font-weight="700">유지 ' + md.band[0] + '~' + md.band[1] + esc(m.u) + '</text>';
    }
    const raw = (hi - lo) / 3;
    if (raw > 0) {
      const p10 = Math.pow(10, Math.floor(Math.log10(raw)));
      const steps = (m.d === 0 && p10 >= 1 ? [1, 2, 5, 10] : [1, 2, 2.5, 5, 10]).map(function (k) { return k * p10; });
      const stp = steps.find(function (k) { return k >= raw - 1e-9; }) || raw;
      const tdec = Math.abs(stp - Math.round(stp)) < 1e-9 ? 0 : (Math.abs(stp * 10 - Math.round(stp * 10)) < 1e-9 ? 1 : 2);
      if (stp > 0) {
        let n = 0;
        for (let v = Math.ceil(lo / stp) * stp; v <= hi + 1e-9 && n < 8; v += stp, n++) {
          const y = Y(v);
          s += '<line x1="' + L + '" x2="' + (L + pw) + '" y1="' + y.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#3a4658"/>';
          s += '<text x="' + (L - 6) + '" y="' + (y + 4).toFixed(1) + '" font-size="12" fill="#d5deea" text-anchor="end">' + fx(v, tdec) + '</text>';
        }
      }
    }
    const nc = I0.nextCheckpoint(goals, today);
    const ncp = nc && tp.find(function (p) { return p.w === nc.w; });
    if (ncp) {
      const x = X(ncp.date);
      const lab = dday(ncp.date, today);
      const tw = lab.length * 6.4 + 14;
      const tx = Math.max(L + tw / 2, Math.min(W - R - tw / 2, x));
      s += '<rect x="' + (x - 12).toFixed(1) + '" y="' + T + '" width="24" height="' + ph + '" rx="6" fill="rgba(124,156,255,.10)"/>';
      s += '<rect x="' + (tx - tw / 2).toFixed(1) + '" y="6" width="' + tw + '" height="16" rx="8" fill="#7c9cff"/>';
      s += '<text x="' + tx.toFixed(1) + '" y="17.5" font-size="10" font-weight="800" fill="#0b0f14" text-anchor="middle">' + esc(lab) + '</text>';
    }
    tp.forEach(function (p) {
      const x = X(p.date);
      const on = ncp && p.w === ncp.w;
      s += '<line x1="' + x.toFixed(1) + '" x2="' + x.toFixed(1) + '" y1="' + T + '" y2="' + (T + ph) + '" stroke="#1d2531"/>';
      s += '<text x="' + x.toFixed(1) + '" y="' + (T + ph + 16) + '" font-size="12" font-weight="700" fill="' + (on ? '#7c9cff' : '#d5deea') + '" text-anchor="middle">' + (p.w === 0 ? '시작' : p.w + '주') + '</text>';
      s += '<text x="' + x.toFixed(1) + '" y="' + (T + ph + 32) + '" font-size="11" fill="' + (on ? '#9eb0ff' : '#d5deea') + '" text-anchor="middle">' + esc(shortDate(p.date)) + '</text>';
    });
    s += '<polyline points="' + tp.map(function (p) { return X(p.date).toFixed(1) + ',' + Y(p.v).toFixed(1); }).join(' ') + '" fill="none" stroke="#8d99ab" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round"/>';
    if (act.length > 1) {
      s += '<polyline points="' + act.map(function (a) { return X(a.date).toFixed(1) + ',' + Y(a.v).toFixed(1); }).join(' ') + '" fill="none" stroke="' + c + '" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>';
    }
    const dir = tp[tp.length - 1].v - tp[0].v;
    const pending = [];
    tp.forEach(function (p, i) {
      const x = X(p.date);
      const y = Y(p.v);
      const on = ncp && p.w === ncp.w;
      const showLab = p.w === 0 || p.w === goals.fin || on || p.interp;
      if (showLab) {
        const t = (p.L || fmt(p.v)) + (p.interp ? '*' : '');
        let ly = dir < 0 ? y - 8 : y + 14;
        if (i === 0) ly = dir < 0 ? y + 16 : y - 8;
        if (p.interp) ly = y - 8;
        ly = Math.max(T + 12, Math.min(T + ph - 4, ly));
        pending.push({ t: t, x: x, ly: ly, on: on, interp: p.interp });
      }
      const fill = p.interp ? '#151b24' : (on ? '#7c9cff' : '#151b24');
      const stroke = p.interp ? '#9db4ff' : (on ? '#d6defc' : '#aeb8c7');
      s += '<circle data-week="' + p.w + '" data-interp="' + (p.interp ? '1' : '0') + '" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (on ? 5 : 3.6) + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.6"' + (p.interp ? ' stroke-dasharray="2 1.5"' : '') + '/>';
    });
    act.forEach(function (a) {
      const ok = I0.onTrack(P, m, tp, a.date, a.v);
      s += '<circle data-date="' + esc(a.date) + '" data-track="' + (ok ? '1' : '0') + '" cx="' + X(a.date).toFixed(1) + '" cy="' + Y(a.v).toFixed(1) + '" r="4.6" fill="' + (ok ? '#3dd68c' : '#ffb020') + '" stroke="' + c + '" stroke-width="2"/>';
    });
    pending.forEach(function (lab) {
      const tw = lab.t.length * 6.4;
      const x = Math.max(L + tw / 2, Math.min(W - R - tw / 2, lab.x));
      const fill = lab.interp ? '#b7c6ff' : (lab.on ? '#9eb6ff' : '#d5deea');
      s += '<text x="' + x.toFixed(1) + '" y="' + lab.ly.toFixed(1) + '" font-size="11" font-weight="700" fill="' + fill + '" text-anchor="middle">' + esc(lab.t) + '</text>';
    });
    return s + '</svg>';
  }

  root.Inbody = root.Inbody || {};
  root.Inbody.donut = donut;
  root.Inbody.rangeBar = rangeBar;
  root.Inbody.lineChart = lineChart;
  root.Inbody.goalChartSVG = goalChartSVG;
})(typeof globalThis !== 'undefined' ? globalThis : this);
