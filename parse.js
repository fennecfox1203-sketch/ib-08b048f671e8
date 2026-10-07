/* 숫자·날짜·시트 행. 화면은 그리지 않는다. */
(function (root) {
  'use strict';

  const TAB_NAME = '측정';
  const GOAL_TAB = '목표';
  /* 탭 gid. 스프레드시트 키(#k=)가 아니다. */
  const DEFAULT_GID = '1319583377';
  const GOAL_GID = '1897299590';
  const GOAL_NOTE_DEFAULT = '세 AI(클로드·GPT·그록) 추천 중간값 · 의학적 진단 아님';
  const GOAL_METRICS = [
    { k: 'weight', n: '체중', u: 'kg', d: 1, low: true },
    { k: 'smm', n: '골격근량', u: 'kg', d: 1, low: false },
    { k: 'pbf', n: '체지방률', u: '%', d: 1, low: true },
    { k: 'vfl', n: '내장지방', u: '', d: 0, low: true },
    { k: 'score', n: '점수', u: '점', d: 0, low: false }
  ];
  const COLS = {
    name: ['이름', '성명'], date: ['측정일', '날짜', '검사일'], time: ['시각', '시간', '측정시각'],
    height: ['키', '신장'], age: ['나이', '연령'], sex: ['성별'], place: ['장소'], device: ['기기'],
    weight: ['체중'], weightR: ['체중범위'], smm: ['골격근량', '골격근'], bfm: ['체지방량'], bfmR: ['체지방량범위'],
    pbf: ['체지방률'], bmi: ['BMI'], score: ['인바디점수', '점수'],
    tbw: ['체수분'], tbwR: ['체수분범위'], protein: ['단백질'], proteinR: ['단백질범위'], mineral: ['무기질'], mineralR: ['무기질범위'],
    target: ['적정체중'], wCtl: ['체중조절'], fCtl: ['지방조절'], mCtl: ['근육조절'],
    bmiJ: ['BMI판정'], pbfJ: ['체지방률판정'], whr: ['복부지방률'], vfl: ['내장지방레벨', '내장지방'],
    ffm: ['제지방량'], bmr: ['기초대사량'], bmrR: ['기초대사량범위'], obes: ['비만도'], obesR: ['비만도범위'], kcal: ['권장섭취열량'],
    mLA: ['근육왼팔'], mRA: ['근육오른팔'], mTR: ['근육몸통'], mLL: ['근육왼다리'], mRL: ['근육오른다리'],
    fLA: ['지방왼팔'], fRA: ['지방오른팔'], fTR: ['지방몸통'], fLL: ['지방왼다리'], fRL: ['지방오른다리'],
    badminton: ['배드민턴'], memo: ['메모']
  };
  const GCOLS = {
    name: ['이름'], when: ['시점'], date: ['날짜'], goal: ['목표문장'],
    weight: ['체중'], smm: ['골격근량', '골격근'], pbf: ['체지방률'], vfl: ['내장지방', '내장지방레벨'], score: ['점수', '인바디점수'],
    key: ['설정', '항목'], val: ['값']
  };

  function clean(v) {
    return String(v == null ? '' : v)
      .replace(/^\uFEFF/, '')
      .replace(/\u00A0/g, ' ')
      .replace(/[０-９]/g, function (ch) { return String(ch.charCodeAt(0) - 0xFF10); })
      .replace(/\uFF0B/g, '+')
      .replace(/[－−‐‑‒–—]/g, '-')
      .replace(/\uFF0E/g, '.')
      .trim();
  }

  function normH(s) {
    return clean(s).replace(/\(.*?\)/g, '').replace(/\s+/g, '').toUpperCase();
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function validYMD(y, m, d) {
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
    return y + '-' + pad2(m) + '-' + pad2(d);
  }

  function parseDate(s) {
    const raw = clean(s);
    if (!raw || raw === '-' || raw === '없음') return null;

    let m = /^Date\((\d{4})\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/i.exec(raw);
    if (m) return validYMD(+m[1], +m[2] + 1, +m[3]);

    if (/^\d{5}(?:\.0+)?$/.test(raw)) {
      const serial = Math.round(Number(raw));
      if (serial >= 20000 && serial <= 80000) {
        const dt = new Date(Date.UTC(1899, 11, 30) + serial * 86400000);
        return validYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate());
      }
    }

    m = /(\d{4})\s*[.\-/년]\s*(\d{1,2})\s*[.\-/월]\s*(\d{1,2})/.exec(raw);
    if (m) return validYMD(+m[1], +m[2], +m[3]);

    m = /^(\d{4})\s+(\d{1,2})\s+(\d{1,2})\b/.exec(raw);
    if (m) return validYMD(+m[1], +m[2], +m[3]);

    m = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if (m) return validYMD(+m[1], +m[2], +m[3]);

    m = /^(\d{2})\s*[.\-/]\s*(\d{1,2})\s*[.\-/]\s*(\d{1,2})\b/.exec(raw);
    if (m) return validYMD(2000 + +m[1], +m[2], +m[3]);

    return null;
  }

  function parseTime(s) {
    const raw = clean(s);
    if (!raw) return '';
    let m = /Date\(\d{4}\s*,\s*\d{1,2}\s*,\s*\d{1,2}\s*,\s*(\d{1,2})\s*,\s*(\d{1,2})/i.exec(raw);
    let h;
    let min;
    if (m) {
      h = +m[1];
      min = +m[2];
    } else {
      m = /(\d{1,2})\s*:\s*(\d{2})/.exec(raw);
      if (!m) return '';
      h = +m[1];
      min = +m[2];
      if (/오후|PM/i.test(raw) && h < 12) h += 12;
      if (/오전|AM/i.test(raw) && h === 12) h = 0;
    }
    if (h === 24 && min === 0) h = 0;
    if (h < 0 || h > 23 || min < 0 || min > 59) return '';
    return pad2(h) + ':' + pad2(min);
  }

  function rng(v) {
    const s = clean(v).replace(/,/g, '');
    if (!s) return null;
    const m = /(-?\d+(?:\.\d+)?)\s*[~∼〜～\-]\s*(-?\d+(?:\.\d+)?)/.exec(s);
    if (!m) return null;
    let a = parseFloat(m[1]);
    let b = parseFloat(m[2]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === b) return null;
    if (a >= 1900 && a <= 2100 && b >= 1 && b <= 12 && /-/.test(m[0]) && !/[~∼〜～]/.test(m[0])) return null;
    if (b < a) { const t = a; a = b; b = t; }
    return [a, b];
  }

  function num(v) {
    if (typeof v === 'number') return Number.isFinite(v) ? v : null;
    const s = clean(v);
    if (!s || /^(#N\/A|N\/A|NA|NULL|UNDEFINED|없음|-+)$/i.test(s)) return null;
    if (parseDate(s) && /\d{4}/.test(s)) return null;
    if (rng(s)) return null;
    const m = /[+-]?\d+(?:\.\d+)?/.exec(s.replace(/,/g, ''));
    if (!m) return null;
    const n = parseFloat(m[0]);
    return Number.isFinite(n) ? n : null;
  }

  function fx(v, d) { return v == null || !Number.isFinite(Number(v)) ? '–' : Number(v).toFixed(d); }
  function sgn(v, d) {
    if (v == null || !Number.isFinite(Number(v))) return '–';
    const s = Number(v).toFixed(d);
    return (Number(s) > 0 ? '+' : '') + s;
  }

  function judgeClass(t) {
    t = String(t || '');
    if (/경도/.test(t)) return 'warn';
    if (/심한|비만/.test(t)) return 'bad';
    if (/과체중|이상/.test(t)) return 'warn';
    if (/이하|저체중/.test(t)) return 'low';
    if (/표준/.test(t)) return 'ok';
    return '';
  }

  function shortDate(d) {
    if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return '';
    const a = d.split('-');
    return (+a[1]) + '/' + (+a[2]);
  }

  function dayDiff(a, b) {
    const t = function (s) {
      const q = String(s || '').split('-').map(Number);
      if (q.length < 3 || q.some(function (n) { return !Number.isFinite(n); })) return NaN;
      return Date.UTC(q[0], q[1] - 1, q[2]);
    };
    const ms = t(b) - t(a);
    return Number.isFinite(ms) ? Math.round(ms / 86400000) : null;
  }

  function addDays(iso, days) {
    if (!iso || dayDiff(iso, iso) !== 0) return '';
    const q = iso.split('-').map(Number);
    const dt = new Date(Date.UTC(q[0], q[1] - 1, q[2] + days));
    return validYMD(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate()) || '';
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function dday(date, today) {
    const n = dayDiff(today || todayStr(), date);
    if (n == null) return '';
    return n === 0 ? 'D-day' : (n > 0 ? 'D-' + n : 'D+' + (-n));
  }

  function mdw(date) {
    if (!date || dayDiff(date, date) !== 0) return '';
    const q = date.split('-').map(Number);
    const w = '일월화수목금토'[new Date(Date.UTC(q[0], q[1] - 1, q[2])).getUTCDay()];
    return q[1] + '/' + q[2] + '(' + w + ')';
  }

  function monthSpan(a, b) {
    if (!a || !b) return [];
    const out = [];
    let y = +a.slice(0, 4);
    let m = +a.slice(5, 7);
    const ey = +b.slice(0, 4);
    const em = +b.slice(5, 7);
    if (!y || !m || !ey || !em) return [];
    let guard = 0;
    while ((y < ey || (y === ey && m <= em)) && guard < 240) {
      out.push(y + '-' + pad2(m));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
      guard += 1;
    }
    return out;
  }

  function missingMonths(dates) {
    const ds = (dates || []).filter(function (d) { return /^\d{4}-\d{2}-\d{2}$/.test(d || ''); }).sort();
    if (ds.length < 2) return [];
    const have = {};
    ds.forEach(function (d) { have[d.slice(0, 7)] = true; });
    return monthSpan(ds[0], ds[ds.length - 1]).filter(function (ym) { return !have[ym]; });
  }

  function parseCsv(text) {
    const src = String(text || '').replace(/^\uFEFF/, '');
    const rows = [];
    let row = [];
    let f = '';
    let q = false;
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (q) {
        if (c === '"') {
          if (src[i + 1] === '"') { f += '"'; i++; }
          else q = false;
        } else f += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(f); f = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && src[i + 1] === '\n') i++;
        row.push(f);
        rows.push(row);
        row = [];
        f = '';
      } else f += c;
    }
    if (f !== '' || row.length) { row.push(f); rows.push(row); }
    return rows;
  }

  function colIndex(head, names) {
    const want = names.map(normH);
    return head.findIndex(function (h) { return want.indexOf(h) >= 0; });
  }

  function buildData(rows) {
    const list = rows || [];
    const hi = list.findIndex(function (r) { return (r || []).some(function (c) { return normH(c) === '이름'; }); });
    if (hi < 0) throw new Error('‘측정’ 탭에서 ‘이름’ 머리글을 찾지 못했어요.');
    const head = list[hi].map(normH);
    const idx = {};
    Object.keys(COLS).forEach(function (k) { idx[k] = colIndex(head, COLS[k]); });
    if (idx.weight < 0) throw new Error('‘측정’ 탭에서 ‘체중’ 열을 찾지 못했어요.');
    const g = function (r, k) {
      const i = idx[k];
      return i >= 0 ? clean(r[i]) : '';
    };
    const recs = [];
    list.slice(hi + 1).forEach(function (r, i) {
      const name = g(r, 'name');
      if (!name) return;
      const w = num(g(r, 'weight'));
      if (w == null) return;
      recs.push({
        row: i, name: name, date: parseDate(g(r, 'date')), time: parseTime(g(r, 'time')),
        height: num(g(r, 'height')), age: num(g(r, 'age')), sex: g(r, 'sex'), place: g(r, 'place'), device: g(r, 'device'),
        weight: w, weightR: rng(g(r, 'weightR')), smm: num(g(r, 'smm')), bfm: num(g(r, 'bfm')), bfmR: rng(g(r, 'bfmR')),
        pbf: num(g(r, 'pbf')), bmi: num(g(r, 'bmi')), score: num(g(r, 'score')),
        tbw: num(g(r, 'tbw')), tbwR: rng(g(r, 'tbwR')), protein: num(g(r, 'protein')), proteinR: rng(g(r, 'proteinR')),
        mineral: num(g(r, 'mineral')), mineralR: rng(g(r, 'mineralR')),
        target: num(g(r, 'target')), wCtl: num(g(r, 'wCtl')), fCtl: num(g(r, 'fCtl')), mCtl: num(g(r, 'mCtl')),
        bmiJ: g(r, 'bmiJ'), pbfJ: g(r, 'pbfJ'), whr: num(g(r, 'whr')), vfl: num(g(r, 'vfl')),
        ffm: num(g(r, 'ffm')), bmr: num(g(r, 'bmr')), bmrR: rng(g(r, 'bmrR')), obes: num(g(r, 'obes')), obesR: rng(g(r, 'obesR')), kcal: num(g(r, 'kcal')),
        seg: {
          m: [g(r, 'mLA'), g(r, 'mRA'), g(r, 'mTR'), g(r, 'mLL'), g(r, 'mRL')],
          f: [g(r, 'fLA'), g(r, 'fRA'), g(r, 'fTR'), g(r, 'fLL'), g(r, 'fRL')]
        },
        badminton: num(g(r, 'badminton')), memo: g(r, 'memo')
      });
    });
    if (!recs.length) throw new Error('‘측정’ 탭에 측정 행이 없어요.');
    const order = [];
    const by = {};
    recs.forEach(function (x) {
      if (!by[x.name]) { by[x.name] = []; order.push(x.name); }
      by[x.name].push(x);
    });
    order.forEach(function (n) {
      by[n].sort(function (a, b) {
        if (a.date && b.date) {
          const c = (a.date + (a.time || '')).localeCompare(b.date + (b.time || ''));
          if (c) return c;
        }
        return a.row - b.row;
      });
    });
    return { people: order, by: by, count: recs.length };
  }

  function roundMetric(v, d) {
    if (!Number.isFinite(v)) return null;
    if (d === 0) return Math.round(v);
    const p = Math.pow(10, d);
    return Math.round(v * p) / p;
  }

  function interpolatePerson(P, weeks, startDate) {
    const marks = [0].concat(weeks);
    P.interp = P.interp || {};
    marks.forEach(function (w) {
      if (!P.pts[w]) P.pts[w] = { date: startDate ? addDays(startDate, w * 7) : '' };
      else if (!P.pts[w].date && startDate) P.pts[w].date = addDays(startDate, w * 7);
    });
    GOAL_METRICS.forEach(function (m) {
      const known = marks.filter(function (w) { return P.pts[w][m.k] != null; });
      marks.forEach(function (w) {
        if (P.pts[w][m.k] != null) return;
        let prev = null;
        let next = null;
        known.forEach(function (k) {
          if (k < w) prev = k;
          if (k > w && next == null) next = k;
        });
        if (prev == null || next == null || next === prev) return;
        const a = P.pts[prev][m.k];
        const b = P.pts[next][m.k];
        const v = roundMetric(a + (b - a) * ((w - prev) / (next - prev)), m.d);
        if (v == null) return;
        P.pts[w][m.k] = v;
        P.interp[w] = P.interp[w] || {};
        P.interp[w][m.k] = true;
      });
    });
  }

  function buildGoals(rows) {
    const list = rows || [];
    const hi = list.findIndex(function (r) {
      const cells = r || [];
      return cells.some(function (c) { return normH(c) === '이름'; }) && cells.some(function (c) { return normH(c) === '시점'; });
    });
    if (hi < 0) throw new Error('목표 머리글 없음');
    const head = list[hi].map(normH);
    const I = {};
    Object.keys(GCOLS).forEach(function (k) { I[k] = colIndex(head, GCOLS[k]); });
    const LB = {};
    GOAL_METRICS.forEach(function (m) { LB[m.k] = head.indexOf(normH(m.n + '표시')); });
    const g = function (r, i) { return i >= 0 ? clean(r[i]) : ''; };
    const people = {};
    const order = [];
    const weeks = new Set();
    const cpDate = {};
    const set = {};
    list.slice(hi + 1).forEach(function (r) {
      if (I.key >= 0) {
        const k = g(r, I.key);
        if (k) set[normH(k)] = g(r, I.val);
      }
      const n = g(r, I.name);
      const w = g(r, I.when);
      if (!n || !w) return;
      let key = null;
      if (/시작/.test(w)) key = 0;
      else {
        const mm = /(\d+)\s*주/.exec(w);
        if (mm) key = +mm[1];
      }
      if (key == null) return;
      if (!people[n]) { people[n] = { goal: '', pts: {}, label: {}, mode: {}, interp: {} }; order.push(n); }
      const P = people[n];
      const o = { date: parseDate(g(r, I.date)) };
      GOAL_METRICS.forEach(function (m) {
        o[m.k] = num(g(r, I[m.k]));
        const L = g(r, LB[m.k]);
        if (L) (P.label[key] = P.label[key] || {})[m.k] = L;
      });
      P.pts[key] = o;
      if (key > 0) {
        weeks.add(key);
        if (o.date && !cpDate[key]) cpDate[key] = o.date;
      }
      const gs = g(r, I.goal);
      if (gs && !P.goal) P.goal = gs;
    });
    const ws = Array.from(weeks).sort(function (a, b) { return a - b; });
    if (!ws.length) throw new Error('목표 시점 없음');
    const fin = ws[ws.length - 1];
    const names = order.filter(function (n) { return people[n].pts[0] && people[n].pts[fin]; });
    if (!names.length) throw new Error('목표 행 없음');
    const anyStart = people[names[0]].pts[0].date;
    const periodStart = parseDate(set[normH('기간시작')] || '') || anyStart || '';
    names.forEach(function (n) { interpolatePerson(people[n], ws, periodStart); });
    names.forEach(function (n) {
      const P = people[n];
      GOAL_METRICS.forEach(function (m) {
        const band = rng(set[normH(n + m.n + '범위')]);
        const s = P.pts[0][m.k];
        const t = P.pts[fin] && P.pts[fin][m.k];
        if (band) P.mode[m.k] = { band: band };
        else if (s != null && t != null && Math.abs(s - t) < 1e-9) P.mode[m.k] = m.low ? { max: t } : { min: t };
      });
    });
    const checkpoints = ws.filter(function (w) { return cpDate[w]; }).map(function (w) { return { w: w, date: cpDate[w] }; });
    let remeasure = String(set[normH('재측정일')] || '').split(/[,;\n]+/).map(function (s) { return parseDate(s.trim()); }).filter(Boolean).sort();
    if (!remeasure.length) remeasure = checkpoints.map(function (c) { return c.date; });
    const P0 = {};
    names.forEach(function (n) { P0[n] = people[n]; });
    return {
      period: { start: periodStart, end: parseDate(set[normH('기간끝')] || '') || cpDate[fin] || '' },
      weeks: ws,
      fin: fin,
      checkpoints: checkpoints,
      remeasure: remeasure,
      note: set[normH('안내문구')] || GOAL_NOTE_DEFAULT,
      people: P0
    };
  }

  function goalPath(goals, name, key) {
    const P = goals && goals.people && goals.people[name];
    if (!P) return [];
    const marks = [0].concat(goals.weeks || []);
    const out = [];
    marks.forEach(function (w) {
      const o = P.pts[w];
      if (!o || o[key] == null || !o.date) return;
      out.push({
        w: w,
        date: o.date,
        v: o[key],
        L: (P.label[w] || {})[key] || '',
        interp: !!(P.interp && P.interp[w] && P.interp[w][key])
      });
    });
    return out;
  }

  function pathAt(tp, date) {
    if (!tp || !tp.length || !date) return null;
    if (date <= tp[0].date) return tp[0].v;
    const z = tp[tp.length - 1];
    if (date >= z.date) return z.v;
    for (let i = 1; i < tp.length; i++) {
      if (date <= tp[i].date) {
        const a = tp[i - 1];
        const b = tp[i];
        const s = dayDiff(a.date, b.date);
        const along = dayDiff(a.date, date);
        if (s == null || along == null || s === 0) return a.v;
        return a.v + (b.v - a.v) * along / s;
      }
    }
    return z.v;
  }

  function onTrack(P, m, tp, date, v) {
    if (!tp || tp.length < 2 || v == null || !date) return false;
    const md = (P.mode || {})[m.k] || {};
    if (md.band) return v >= md.band[0] - 1e-9 && v <= md.band[1] + 1e-9;
    if (md.max != null) return v <= md.max + 1e-9;
    if (md.min != null) return v >= md.min - 1e-9;
    const t = pathAt(tp, date);
    if (t == null || !Number.isFinite(t)) return false;
    const dir = tp[tp.length - 1].v - tp[0].v;
    return dir < 0 ? v <= t + 1e-9 : v >= t - 1e-9;
  }

  function goalMetric(goals, P, m, cur, fin) {
    const end = fin == null ? goals.fin : fin;
    const s = P.pts[0][m.k];
    const tg = (P.pts[end] || {})[m.k];
    const md = (P.mode || {})[m.k] || {};
    if (s == null || tg == null) return null;
    const R = function (ok) { return { pct: ok ? 100 : 0, st: ok ? 'ok' : 'bad', txt: ok ? '달성' : '반대 방향', moving: false }; };
    if (cur == null) return { pct: 0, st: 'prog', txt: '진행 중', moving: false, none: true };
    if (md.band) return Object.assign(R(cur >= md.band[0] && cur <= md.band[1]), { band: md.band });
    if (md.max != null) return R(cur <= md.max + 1e-9);
    if (md.min != null) return R(cur >= md.min - 1e-9);
    const denom = tg - s;
    if (Math.abs(denom) < 1e-9) return R(Math.abs(cur - tg) < 1e-9);
    const p = (cur - s) / denom;
    if (p >= 1 - 1e-9) return { pct: 100, st: 'ok', txt: '달성', moving: true };
    if (p < -1e-9) return { pct: 0, st: 'bad', txt: '반대 방향', moving: true };
    return { pct: p * 100, st: 'prog', txt: '진행 중', moving: true };
  }

  function goalNow(data, name) {
    const recs = (data && data.by && data.by[name]) || [];
    const o = {};
    GOAL_METRICS.forEach(function (m) {
      for (let i = recs.length - 1; i >= 0; i--) {
        if (recs[i][m.k] != null) { o[m.k] = recs[i][m.k]; break; }
      }
    });
    return o;
  }

  function nextCheckpoint(goals, today) {
    if (!goals) return null;
    const t = today || todayStr();
    return (goals.checkpoints || []).find(function (c) { return c.date >= t; }) || null;
  }

  function nextMeasure(goals, data, name, today) {
    if (!goals) return null;
    const recs = (data && data.by && data.by[name]) || [];
    const last = recs.length ? (recs[recs.length - 1].date || '') : '';
    const t = today || todayStr();
    return (goals.remeasure || []).find(function (d) { return d >= t && (!last || d > last); }) || null;
  }

  function josa(w) {
    const s = String(w || '');
    const c = s.charCodeAt(s.length - 1) - 0xAC00;
    return (c >= 0 && c < 11172 && c % 28) ? '은' : '는';
  }

  function cellText(c) {
    if (c == null) return '';
    const formatted = c.f == null ? '' : String(c.f).trim();
    const raw = c.v == null ? '' : String(c.v).trim();
    return formatted || raw;
  }

  function fetchCsv(id, gid) {
    const ctl = new AbortController();
    const tm = setTimeout(function () { ctl.abort(); }, 20000);
    return fetch('https://docs.google.com/spreadsheets/d/' + encodeURIComponent(id) + '/export?format=csv&gid=' + encodeURIComponent(gid) + '&t=' + Date.now(), {
      cache: 'no-store', signal: ctl.signal, credentials: 'omit'
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) {
      if (!t || /^\s*<(!doctype|html)/i.test(t)) throw new Error('공개되지 않은 시트');
      return parseCsv(t);
    }).finally(function () { clearTimeout(tm); });
  }

  let gvizSeq = 0;
  function fetchGviz(id, tab) {
    return new Promise(function (resolve, reject) {
      if (typeof document === 'undefined') { reject(new Error('불러오기 실패')); return; }
      const cb = '__inbodyCb' + (++gvizSeq) + '_' + Date.now();
      const sc = document.createElement('script');
      const done = function () {
        try { delete root[cb]; } catch (e) { root[cb] = undefined; }
        sc.remove();
        clearTimeout(tm);
      };
      const tm = setTimeout(function () { done(); reject(new Error('응답 없음')); }, 20000);
      root[cb] = function (resp) {
        done();
        if (!resp || resp.status === 'error' || !resp.table) { reject(new Error('시트 읽기 실패')); return; }
        const t = resp.table;
        const nc = t.cols.length;
        const head = t.cols.map(function (c) { return c.label || ''; });
        const body = (t.rows || []).map(function (r) {
          const o = [];
          for (let i = 0; i < nc; i++) o.push(cellText((r.c || [])[i]));
          return o;
        });
        const useful = head.some(function (h) { return normH(h) === '이름'; });
        resolve(useful ? [head].concat(body) : body);
      };
      sc.onerror = function () { done(); reject(new Error('불러오기 실패')); };
      sc.src = 'https://docs.google.com/spreadsheets/d/' + encodeURIComponent(id) + '/gviz/tq?tqx=out:json;responseHandler:' + cb + '&headers=0&sheet=' + encodeURIComponent(tab) + '&t=' + Date.now();
      document.head.appendChild(sc);
    });
  }

  function assertSheetId(id) {
    if (!/^[A-Za-z0-9_-]{20,}$/.test(id || '')) throw new Error('시트 주소의 형식이 올바르지 않아요.');
  }

  async function loadMeasurements(id, gid) {
    assertSheetId(id);
    let rows = null;
    let err = null;
    try {
      rows = await fetchCsv(id, gid || DEFAULT_GID);
      buildData(rows);
    } catch (e) {
      err = e;
      rows = null;
    }
    if (!rows) {
      try { rows = await fetchGviz(id, TAB_NAME); }
      catch (e2) {
        throw (err && /이름|체중|측정/.test(err.message)) ? err : new Error('시트를 열 수 없어요 (' + ((err && err.message) || e2.message) + ')');
      }
    }
    return buildData(rows);
  }

  async function loadGoalTable(id) {
    assertSheetId(id);
    try { return buildGoals(await fetchCsv(id, GOAL_GID)); }
    catch (e) { return buildGoals(await fetchGviz(id, GOAL_TAB)); }
  }

  const api = {
    clean: clean, normH: normH, esc: esc, num: num, rng: rng, parseDate: parseDate, parseTime: parseTime, parseCsv: parseCsv,
    fx: fx, sgn: sgn, judgeClass: judgeClass, shortDate: shortDate, dayDiff: dayDiff, addDays: addDays, todayStr: todayStr,
    dday: dday, mdw: mdw, monthSpan: monthSpan, missingMonths: missingMonths,
    buildData: buildData, buildGoals: buildGoals, goalPath: goalPath, pathAt: pathAt, onTrack: onTrack, goalMetric: goalMetric,
    goalNow: goalNow, nextCheckpoint: nextCheckpoint, nextMeasure: nextMeasure, josa: josa,
    loadMeasurements: loadMeasurements, loadGoalTable: loadGoalTable,
    GOAL_METRICS: GOAL_METRICS, GOAL_NOTE_DEFAULT: GOAL_NOTE_DEFAULT, TAB_NAME: TAB_NAME, GOAL_TAB: GOAL_TAB
  };

  root.Inbody = Object.assign(root.Inbody || {}, api);
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
