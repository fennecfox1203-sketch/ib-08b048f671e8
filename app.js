/* 화면. 숫자는 parse.js, 그림은 figure.js·charts.js. */
(function () {
  'use strict';

  const I = window.Inbody;
  const DEMO = new URLSearchParams(location.search).get('demo') === '1';
  const LS_KEY = 'inbodySheet';
  const LS_CACHE = 'inbodyCache';
  const LS_GOALS = 'inbodyGoals';
  const COLORS = ['#6aa8ff', '#c08cff', '#ff8fc7', '#4fd1c5', '#ffd36a', '#a3e635'];
  const HORIZONS = [4, 12, 24];

  const $ = function (id) { return document.getElementById(id); };
  const state = { tab: 'home', data: null, goals: null, sheetId: '', demo: false, gm: {}, hz: {} };
  let syncGen = 0;

  function lsGet(k) { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function readHash() {
    const h = location.hash || '';
    const k = /[#&]k=([^&]*)/.exec(h);
    const g = /[#&]g=(\d+)/.exec(h);
    return { k: k ? decodeURIComponent(k[1]).trim() : '', g: g ? g[1] : '' };
  }
  function loadCache() { try { return JSON.parse(lsGet(LS_CACHE) || 'null'); } catch (e) { return null; } }
  function cachedGoals(id) {
    try {
      const c = JSON.parse(lsGet(LS_GOALS) || 'null');
      return c && c.id === id ? c.goals : null;
    } catch (e) { return null; }
  }
  function stamp() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    return (d.getMonth() + 1) + '/' + d.getDate() + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  }
  function setSync(msg) { const s = $('syncStatus'); if (s) s.textContent = msg || ''; }
  function colorOf(name) {
    const i = state.data ? state.data.people.indexOf(name) : 0;
    return COLORS[(i < 0 ? 0 : i) % COLORS.length];
  }
  function viewData() {
    return { people: state.data.people, by: state.data.by, count: state.data.count, colorOf: colorOf };
  }
  function latest(name) { const a = state.data.by[name]; return a[a.length - 1]; }
  function goalOf(name) { return (state.goals && state.goals.people && state.goals.people[name]) || null; }
  function figLabel(r) {
    const j = r.pbfJ || '';
    return '<div class="fl ' + I.judgeClass(j) + '">' + (j ? '체지방률 ' + I.esc(j) : '') + '</div>';
  }
  function badge(label, j) {
    if (!j) return '';
    return '<span class="badge ' + I.judgeClass(j) + '">' + I.esc(label) + ' ' + I.esc(j) + '</span>';
  }
  function overall(name, fin) {
    const P = goalOf(name);
    if (!P || !state.goals) return 0;
    const now = I.goalNow(state.data, name);
    const mv = I.GOAL_METRICS.map(function (m) { return I.goalMetric(state.goals, P, m, now[m.k], fin); }).filter(function (x) { return x && x.moving; });
    return mv.length ? mv.reduce(function (a, x) { return a + x.pct; }, 0) / mv.length : 0;
  }
  function gapBits(name, metricKey) {
    const dates = (state.data.by[name] || []).map(function (r) { return r.date; });
    const miss = I.missingMonths(dates);
    const P = goalOf(name);
    const interp = P && metricKey && P.interp && Object.keys(P.interp).some(function (w) { return P.interp[w][metricKey]; });
    const parts = [];
    if (miss.length) parts.push(miss.map(function (ym) { return (+ym.slice(5)) + '월'; }).join('·') + '에는 측정이 없어요');
    if (interp) parts.push('비어 있는 주 목표는 앞뒤 값으로 이어서 채웠어요(*)');
    return parts.join('. ');
  }
  function gmDefault(P) { return (P.mode.weight && P.mode.weight.band) ? 'smm' : 'weight'; }

  function goalGraphCard(name) {
    const P = goalOf(name);
    const goals = state.goals;
    if (!P || !goals) return '';
    const c = colorOf(name);
    const r = latest(name);
    const fin = goals.fin;
    const mets = I.GOAL_METRICS.filter(function (m) { return P.pts[0][m.k] != null && (P.pts[fin] || {})[m.k] != null; });
    if (!mets.length) return '';
    const want = state.gm[name] || gmDefault(P);
    const m = mets.find(function (x) { return x.k === want; }) || mets[0];
    const pct = overall(name, fin);
    const now = I.goalNow(state.data, name)[m.k];
    const today = I.todayStr();
    const nc = I.nextCheckpoint(goals, today);
    const tp = I.goalPath(goals, name, m.k);
    const np = nc && tp.find(function (p) { return p.w === nc.w; });
    const unit = function (v) { return v == null ? '–' : I.fx(v, m.d) + m.u; };
    let info = '지금 <b>' + unit(now) + '</b>';
    if (np) info += ' → ' + np.w + '주 목표 <b>' + (np.L ? I.esc(np.L) + m.u : unit(np.v)) + '</b> <span class="dd">' + I.esc(I.dday(np.date, today)) + '</span>';
    else if (tp.length) info += ' · 최종 목표 <b>' + unit(tp[tp.length - 1].v) + '</b>';
    const gap = gapBits(name, m.k);
    return '<div class="card">' +
      '<div class="gc-h"><div><div class="pc-name"><i style="background:' + c + '"></i>' + I.esc(name) + '</div>' +
      (P.goal ? '<div class="gc-goal">' + I.esc(P.goal) + '</div>' : '') + '</div>' +
      '<div class="gc-stats"><div><span class="v" style="color:' + c + '">' + (r.score == null ? '–' : I.esc(r.score)) + '</span><span class="l">점수</span></div>' +
      '<div><span class="v">' + pct.toFixed(0) + '%</span><span class="l">' + fin + '주 진행</span></div></div></div>' +
      '<div class="gchips">' + mets.map(function (x) {
        return '<button type="button" class="gchip' + (x.k === m.k ? ' on' : '') + '" data-person="' + I.esc(name) + '" data-metric="' + x.k + '"' +
          (x.k === m.k ? ' style="color:' + c + '"' : '') + '>' + x.n + '</button>';
      }).join('') + '</div>' +
      I.goalChartSVG(goals, viewData(), name, P, m, today) +
      '<div class="glegend"><span><i class="lg-a" style="background:' + c + '"></i>실제</span><span><i class="lg-t"></i>목표</span>' +
      '<span><i class="lg-d" style="background:#3dd68c"></i>목표선 맞춤·앞섬</span><span><i class="lg-d" style="background:#ffb020"></i>뒤처짐</span>' +
      '<span><i class="lg-d" style="background:transparent;box-shadow:inset 0 0 0 1.5px #9db4ff"></i>이어서 채움</span></div>' +
      (gap ? '<div class="gapnote">' + I.esc(gap) + '</div>' : '') +
      '<div class="gfoot"><div class="ginfo">' + info + '</div><button type="button" class="gmore" data-go="' + I.esc(name) + '">자세히</button></div></div>';
  }

  function summaryCard(name) {
    const r = latest(name);
    const c = colorOf(name);
    const D = state.data;
    return '<div class="card pcard">' +
      '<div class="pc-top"><div><div class="pc-name"><i style="background:' + c + '"></i>' + I.esc(name) + '</div>' +
      '<div class="pc-date">' + I.esc((r.date || '날짜 없음') + (r.time ? ' ' + r.time : '')) + ' · ' + D.by[name].length + '회 측정</div></div>' +
      '<div class="pc-score"><div class="v" style="color:' + c + '">' + (r.score == null ? '–' : I.esc(r.score)) + '</div><div class="l">인바디점수</div></div></div>' +
      '<div class="pc-body"><div class="fig">' + I.bodySVG(r, c) + figLabel(r) + '</div><div class="grid4">' +
      '<div class="kv"><div class="l">체중</div><div class="v">' + I.fx(r.weight, 1) + '<small>kg</small></div></div>' +
      '<div class="kv"><div class="l">골격근량</div><div class="v">' + I.fx(r.smm, 1) + '<small>kg</small></div></div>' +
      '<div class="kv"><div class="l">체지방률</div><div class="v ' + I.judgeClass(r.pbfJ) + '">' + I.fx(r.pbf, 1) + '<small>%</small></div></div>' +
      '<div class="kv"><div class="l">내장지방레벨</div><div class="v ' + (r.vfl != null && r.vfl >= 10 ? 'warn' : '') + '">' + (r.vfl == null ? '–' : I.esc(r.vfl)) + '</div></div>' +
      '</div></div><div class="badges">' + badge('BMI', r.bmiJ) + badge('체지방률', r.pbfJ) + '</div>' +
      '<div class="goal"><div class="gl">목표까지 남은 조절량 (용지 값)</div><div class="gv"><span>지방 <b class="' + (r.fCtl < 0 ? 'warn' : 'ok') + '">' + I.sgn(r.fCtl, 1) + 'kg</b></span>' +
      '<span>근육 <b class="' + (r.mCtl > 0 ? 'low' : 'ok') + '">' + I.sgn(r.mCtl, 1) + 'kg</b></span></div></div>' +
      '<button type="button" class="gmore" data-go="' + I.esc(name) + '">자세히</button></div>';
  }

  function cmpBlock(title, key, unit, d, max) {
    const D = state.data;
    const vals = D.people.map(function (n) { return latest(n)[key]; }).filter(function (v) { return v != null; });
    const m = max || (vals.length ? Math.max.apply(null, vals) : 1) * 1.08;
    let s = '<div class="cmp"><div class="t">' + title + '</div>';
    D.people.forEach(function (n) {
      const v = latest(n)[key];
      const w = v == null || !m ? 0 : Math.max(2, Math.min(100, v / m * 100));
      s += '<div class="cmp-row"><span class="n">' + I.esc(n) + '</span><div class="track"><div class="fill" style="width:' + w.toFixed(1) + '%;background:' + colorOf(n) + '"></div></div><span class="val">' + I.fx(v, d) + unit + '</span></div>';
    });
    return s + '</div>';
  }

  function renderHome() {
    const D = state.data;
    let h = '<div class="card"><h2>세 사람 체형<small>용지 값으로 그린 그림</small></h2><div class="trio">' +
      D.people.map(function (n) {
        const r = latest(n);
        return '<button type="button" class="fig" data-go="' + I.esc(n) + '">' + I.bodySVG(r, colorOf(n)) +
          '<div class="nm" style="color:' + colorOf(n) + '">' + I.esc(n) + '</div>' + figLabel(r) + '</button>';
      }).join('') + '</div></div>';
    D.people.forEach(function (n) {
      const card = goalOf(n) ? goalGraphCard(n) : '';
      h += card || summaryCard(n);
    });
    h += '<div class="card"><h2>세 사람 비교<small>최근 측정</small></h2>' +
      cmpBlock('체지방률', 'pbf', '%', 1) + cmpBlock('골격근량', 'smm', 'kg', 1) + cmpBlock('인바디점수', 'score', '점', 0, 100) + '</div>';
    return h;
  }

  function goalCard(name, c) {
    const P = goalOf(name);
    const goals = state.goals;
    if (!P || !goals) return '';
    const fin = goals.fin;
    const horizons = HORIZONS.filter(function (w) { return goals.weeks.indexOf(w) >= 0; });
    const hz = horizons.indexOf(state.hz[name]) >= 0 ? state.hz[name] : (horizons.indexOf(fin) >= 0 ? fin : horizons[horizons.length - 1]);
    const now = I.goalNow(state.data, name);
    const today = I.todayStr();
    const cp = (goals.checkpoints || []).find(function (x) { return x.w === hz; }) || I.nextCheckpoint(goals, today);
    const nm = I.nextMeasure(goals, state.data, name, today);
    const pct = overall(name, hz);
    const cell = function (w, m) {
      const L = (P.label[w] || {})[m.k];
      if (L) return I.esc(L);
      const v = (P.pts[w] || {})[m.k];
      const star = P.interp && P.interp[w] && P.interp[w][m.k];
      return (v == null ? '–' : I.fx(v, m.d)) + (star ? '<span class="star">*</span>' : '');
    };
    const mets = I.GOAL_METRICS.filter(function (m) { return P.pts[0][m.k] != null && (P.pts[fin] || {})[m.k] != null; });
    let h = '<div class="card"><h2>' + fin + '주 목표<small>' + I.esc(I.shortDate(goals.period.start)) + ' ~ ' + I.esc(I.shortDate(goals.period.end)) + '</small></h2>';
    if (P.goal) h += '<div class="gsent" style="color:' + c + '">' + I.esc(P.goal) + '</div>';
    if (horizons.length) {
      h += '<div class="htabs" role="tablist" aria-label="목표 시점">';
      horizons.forEach(function (w) {
        h += '<button type="button" class="htab' + (w === hz ? ' on' : '') + '" role="tab" aria-selected="' + (w === hz ? 'true' : 'false') + '" data-hz="' + w + '" data-who="' + I.esc(name) + '">' + w + '주</button>';
      });
      h += '</div>';
    }
    const passed = cp && I.dayDiff(today, cp.date) < 0;
    h += '<div class="gnext">' +
      (cp ? '<span>' + (cp.w === hz ? hz + '주 점검' : '다음 점검') + ' <b>' + cp.w + '주 ' + I.esc(I.mdw(cp.date)) + '</b> <span class="dd">' + I.esc(passed ? '지남' : I.dday(cp.date, today)) + '</span></span>' : '') +
      '<span>다음 측정 ' + (nm ? '<b>' + I.esc(I.mdw(nm)) + '</b>' : '–') + '</span>' +
      '<span>' + hz + '주 진행 <b>' + pct.toFixed(0) + '%</b></span></div>';
    h += '<div class="gtab-wrap"><table class="gtab"><tr><th></th><th>지금</th>' + goals.weeks.map(function (w) {
      return '<th>' + w + '주</th>';
    }).join('') + '</tr>' + mets.map(function (m) {
      return '<tr><td>' + m.n + '</td><td class="now">' + (now[m.k] == null ? '–' : I.fx(now[m.k], m.d)) + '</td>' +
        goals.weeks.map(function (w) {
          const interp = P.interp && P.interp[w] && P.interp[w][m.k];
          return '<td class="' + (w === hz ? 'fin' : '') + (interp ? ' interp' : '') + '">' + cell(w, m) + '</td>';
        }).join('') + '</tr>';
    }).join('') + '</table></div>';
    const rules = [];
    mets.forEach(function (m) {
      const g = I.goalMetric(goals, P, m, now[m.k], hz);
      if (!g) return;
      const s0 = P.pts[0][m.k];
      const tg = (P.pts[hz] || {})[m.k];
      const cur = now[m.k];
      const md = (P.mode || {})[m.k] || {};
      const L = (P.label[hz] || {})[m.k];
      const unit = function (v) { return v == null ? '–' : I.fx(v, m.d) + m.u; };
      let bar;
      let left;
      let right;
      if (g.band) {
        const lo = g.band[0] - 2;
        const hi = g.band[1] + 2;
        const pos = function (v) { return Math.max(0, Math.min(100, (v - lo) / (hi - lo) * 100)); };
        bar = '<div class="gm-bar"><div class="band" style="left:' + pos(g.band[0]).toFixed(1) + '%;width:' + (pos(g.band[1]) - pos(g.band[0])).toFixed(1) + '%"></div>' +
          (cur != null ? '<div class="pt" style="left:' + pos(cur).toFixed(1) + '%;background:' + c + '"></div>' : '') + '</div>';
        left = '유지 범위 ' + g.band[0] + '~' + g.band[1] + m.u;
        right = '지금 ' + unit(cur);
        rules.push(m.n + I.josa(m.n) + ' ' + g.band[0] + '~' + g.band[1] + m.u + ' 안이면 달성');
      } else if (!g.moving) {
        const lim = md.max != null ? md.max : md.min;
        bar = '<div class="gm-bar"><i style="width:' + g.pct.toFixed(1) + '%;background:' + (g.st === 'ok' ? 'var(--ok)' : g.st === 'bad' ? 'var(--bad)' : 'transparent') + '"></i></div>';
        left = '지금 ' + unit(cur);
        right = '목표 ' + (L ? I.esc(L) + m.u : unit(tg));
        if (lim != null) rules.push(m.n + I.josa(m.n) + ' ' + I.fx(lim, m.d) + m.u + (md.max != null ? ' 이하' : ' 이상') + '면 달성');
      } else {
        bar = '<div class="gm-bar"><i style="width:' + Math.max(g.pct > 0 ? 2 : 0, Math.min(100, g.pct)).toFixed(1) + '%;background:linear-gradient(90deg,#3b82f6,#3dd68c)"></i></div>';
        left = '시작 ' + unit(s0) + ' → 지금 ' + unit(cur);
        right = g.pct.toFixed(0) + '% · ' + hz + '주 ' + unit(tg) + (L ? ' (' + I.esc(L) + ')' : '');
      }
      h += '<div class="gm"><div class="gm-h"><span class="n">' + m.n + '</span><span class="st ' + g.st + '">' + g.txt + '</span></div>' + bar +
        '<div class="gm-l"><span>' + left + '</span><span>' + right + '</span></div></div>';
    });
    const gap = gapBits(name, 'weight');
    h += '<div class="gnote">진행률은 시작값에서 최근 측정값까지 고른 ' + hz + '주 목표 쪽으로 간 비율이에요' +
      (rules.length ? ' (' + I.esc(rules.join(', ')) + ')' : '') + '. 재측정: ' +
      (goals.remeasure || []).map(function (d) { return I.shortDate(d); }).join(' · ') +
      (gap ? '<br>' + I.esc(gap) : '') + '<br>' + I.esc(goals.note) + '</div></div>';
    return h;
  }

  function segGrid(title, arr) {
    const parts = ['왼팔', '오른팔', '몸통', '왼다리', '오른다리'];
    const cell = function (i) {
      const s = (arr && arr[i]) || '–';
      return '<div class="c ' + I.judgeClass(s) + '"><div class="p">' + parts[i] + '</div><div class="s ' + I.judgeClass(s) + '">' + I.esc(s) + '</div></div>';
    };
    return '<div class="seg-title">' + title + '</div><div class="seg">' + cell(0) + cell(2) + cell(1) + cell(3) + '<div class="c blank"></div>' + cell(4) + '</div>';
  }

  function renderPerson(name) {
    const recs = state.data.by[name];
    const r = recs[recs.length - 1];
    const first = recs[0];
    const c = colorOf(name);
    const female = /여/.test(r.sex || '');
    let h = '<div class="card"><div class="hero">' + I.donut(r.score, c) + '<div><div class="nm">' + I.esc(name) + '</div>' +
      '<div class="meta">' + I.esc((r.date || '날짜 없음') + (r.time ? ' ' + r.time : '')) + '<br>' +
      I.esc([r.place, r.device].filter(Boolean).join(' · ')) + '<br>' +
      I.esc([r.height != null ? r.height + 'cm' : '', r.age != null ? r.age + '세' : '', r.sex].filter(Boolean).join(' · ')) + '</div>' +
      '<div class="badges">' + badge('BMI', r.bmiJ) + badge('체지방률', r.pbfJ) + '</div></div></div></div>';
    h += goalCard(name, c);
    const one = function (x, cap) {
      return '<div class="fig">' + I.bodySVG(x, c) + figLabel(x) + '<div class="fs">' + (cap ? I.esc(cap) + '<br>' : '') +
        I.fx(x.weight, 1) + 'kg · 체지방률 ' + I.fx(x.pbf, 1) + '%</div></div>';
    };
    const dated = recs.filter(function (x) { return x.date; });
    const early = dated[0] || first;
    h += '<div class="card"><h2>체형 그림<small>스타일 A</small></h2><div class="figs">' +
      (recs.length >= 2 ? one(early, '첫 측정 ' + I.shortDate(early.date)) + one(r, '최근 ' + I.shortDate(r.date)) : one(r, '')) +
      '</div><div class="rb-sub" style="margin-top:8px;text-align:center">체지방률·BMI·골격근량·키로 모양을 정했습니다. 체지방이 높으면 둥글고, 근육은 어깨 너비만 바꿉니다.</div></div>';
    if (r.target != null && first.weight != null) {
      const start = first.weight;
      const tgt = r.target;
      const cur = r.weight;
      const total = start - tgt;
      const done = start - cur;
      const pct = Math.abs(total) < 0.05 ? (Math.abs(cur - tgt) < 0.05 ? 100 : 0) : Math.max(0, Math.min(100, done / total * 100));
      const left = tgt - cur;
      h += '<div class="card"><h2>적정체중까지</h2>' +
        '<div class="metric"><span class="n">지금 체중</span><span class="a">' + I.fx(cur, 1) + ' kg</span></div>' +
        '<div class="metric"><span class="n">용지의 적정체중</span><span class="a">' + I.fx(tgt, 1) + ' kg</span></div>' +
        '<div class="metric"><span class="n">남은 차이</span><span class="a ' + (Math.abs(left) < 0.05 ? 'ok' : 'warn') + '">' + I.sgn(left, 1) + ' kg</span></div>' +
        '<div class="prog"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
        '<div class="prog-lab"><span>첫 측정 ' + I.fx(start, 1) + 'kg</span><span>' + pct.toFixed(0) + '%</span><span>목표 ' + I.fx(tgt, 1) + 'kg</span></div></div>';
    }
    h += '<div class="card"><h2>체성분 · 표준 범위<small>용지 값</small></h2>' +
      I.rangeBar({ n: '체중', v: r.weight, r: r.weightR, u: 'kg', min: 0 }) +
      I.rangeBar({ n: '골격근량', v: r.smm, u: 'kg', noRange: '용지에 kg 표준범위가 없어 값만 표시합니다' }) +
      I.rangeBar({ n: '체지방량', v: r.bfm, r: r.bfmR, u: 'kg', min: 0 }) +
      I.rangeBar({ n: '체수분', v: r.tbw, r: r.tbwR, u: 'L', min: 0 }) +
      I.rangeBar({ n: '단백질', v: r.protein, r: r.proteinR, u: 'kg', min: 0 }) +
      I.rangeBar({ n: '무기질', v: r.mineral, r: r.mineralR, u: 'kg', d: 2, min: 0 }) + '</div>';
    h += '<div class="card"><h2>비만 분석</h2>' +
      I.rangeBar({ n: 'BMI', v: r.bmi, r: [18.5, 23], u: 'kg/㎡', j: r.bmiJ, min: 0, note: '표준 구간 18.5~23.0은 용지 눈금 기준' }) +
      I.rangeBar({ n: '체지방률', v: r.pbf, r: female ? [18, 28] : [10, 20], u: '%', j: r.pbfJ, min: 0, note: '표준 구간 ' + (female ? '18.0~28.0' : '10.0~20.0') + '은 용지 눈금 기준' }) +
      I.rangeBar({ n: '복부지방률', v: r.whr, r: [0.8, 0.9], d: 2, min: 0, note: '용지 눈금 0.80 · 0.90' }) +
      I.rangeBar({ n: '내장지방레벨', v: r.vfl, r: [0, 9.5], d: 0, labels: ['낮음', '10'], min: 0, note: '10부터 표준이상으로 표시' }) +
      I.rangeBar({ n: '비만도', v: r.obes, r: r.obesR || [90, 110], u: '%', d: 0, min: 0 }) + '</div>';
    h += '<div class="card"><h2>부위별 분석</h2>' + segGrid('부위별 근육', r.seg.m) + '<div style="height:14px"></div>' + segGrid('부위별 체지방', r.seg.f) +
      '<div class="seg-note">용지 그림 방향 그대로(왼쪽 = 왼팔·왼다리). 부위별 체지방은 용지에도 추정치로 적혀 있습니다.</div></div>';
    h += '<div class="card"><h2>체중 조절<small>용지 값</small></h2>' +
      '<div class="metric"><span class="n">적정체중</span><span class="a">' + I.fx(r.target, 1) + ' kg</span></div>' +
      '<div class="metric"><span class="n">체중조절</span><span class="a">' + I.sgn(r.wCtl, 1) + ' kg</span></div>' +
      '<div class="metric"><span class="n">지방조절</span><span class="a">' + I.sgn(r.fCtl, 1) + ' kg</span></div>' +
      '<div class="metric"><span class="n">근육조절</span><span class="a">' + I.sgn(r.mCtl, 1) + ' kg</span></div></div>';
    h += '<div class="card"><h2>연구항목</h2>' +
      I.rangeBar({ n: '기초대사량', v: r.bmr, r: r.bmrR, u: 'kcal', d: 0, min: 0 }) +
      '<div class="metric"><span class="n">제지방량</span><span class="a">' + I.fx(r.ffm, 1) + ' kg</span></div>' +
      '<div class="metric"><span class="n">권장섭취열량</span><span class="a">' + I.fx(r.kcal, 0) + ' kcal</span></div>' +
      (r.badminton != null ? '<div class="metric"><span class="n">배드민턴 30분 소비열량</span><span class="a">' + I.fx(r.badminton, 0) + ' kcal</span></div>' : '') +
      '</div>';
    const gap = gapBits(name);
    h += '<div class="card"><h2>변화<small>' + recs.length + '회 측정</small></h2>' +
      I.lineChart('체중', recs, 'weight', 'kg', 1, c) +
      I.lineChart('골격근량', recs, 'smm', 'kg', 1, c) +
      I.lineChart('체지방률', recs, 'pbf', '%', 1, c) +
      (gap ? '<div class="gapnote">' + I.esc(gap) + '. 가로축은 날짜라 빈 달이 그대로 넓습니다.</div>' : '') +
      (recs.length < 2 ? '<div class="rb-sub">측정이 1회라 점 하나만 보입니다.</div>' : '') + '</div>';
    h += '<div class="card"><h2>측정 기록</h2><table class="hist"><tr><th>날짜</th><th>체중</th><th>골격근</th><th>체지방률</th><th>점수</th></tr>' +
      recs.slice().reverse().map(function (x) {
        return '<tr><td>' + I.esc(x.date || '날짜 없음') + '</td><td>' + I.fx(x.weight, 1) + '</td><td>' + I.fx(x.smm, 1) + '</td><td>' + I.fx(x.pbf, 1) + '</td><td>' + (x.score == null ? '–' : I.esc(x.score)) + '</td></tr>';
      }).join('') + '</table>' + (r.memo ? '<div class="rb-sub" style="margin-top:8px">메모: ' + I.esc(r.memo) + '</div>' : '') + '</div>';
    return h;
  }

  function renderTabs() {
    const t = $('tabs');
    if (!state.data) { t.hidden = true; t.innerHTML = ''; return; }
    t.hidden = false;
    let h = '<button type="button" class="tab' + (state.tab === 'home' ? ' on' : '') + '" data-tab="home" role="tab" aria-selected="' + (state.tab === 'home') + '">홈</button>';
    state.data.people.forEach(function (n) {
      const on = state.tab === n;
      h += '<button type="button" class="tab' + (on ? ' on' : '') + '" data-tab="' + I.esc(n) + '" role="tab" aria-selected="' + on + '"><span class="dot" style="background:' + colorOf(n) + '"></span>' + I.esc(n) + '</button>';
    });
    t.innerHTML = h;
  }

  function render() {
    const D = state.data;
    if (D && state.tab !== 'home' && !D.by[state.tab]) state.tab = 'home';
    renderTabs();
    if (!D) {
      $('subtitle').textContent = state.demo ? '데모' : '측정 없음';
      $('panel').innerHTML = '<div class="empty">' + (DEMO
        ? '예시 데이터를 준비하지 못했습니다.'
        : '표시할 측정이 없습니다. 주소 끝의 #k= 를 확인하거나, ?demo=1 로 예시를 볼 수 있습니다.') + '</div>';
    } else {
      const dates = [];
      D.people.forEach(function (n) { D.by[n].forEach(function (x) { if (x.date) dates.push(x.date); }); });
      dates.sort();
      $('subtitle').textContent = D.people.join(' · ') + (dates.length ? ' · 최근 ' + dates[dates.length - 1] : '');
      $('panel').innerHTML = state.tab === 'home' ? renderHome() : renderPerson(state.tab);
    }
    const note = $('modeNote');
    if (note) {
      note.textContent = state.demo
        ? '지금은 만든 예시입니다. 구글 시트에는 연결하지 않았습니다.'
        : '이 화면은 인바디 용지에 적힌 값과 판정만 옮겨 보여 줍니다. 목표는 시트 ‘목표’ 탭 값입니다.';
    }
    const link = $('sheetLink');
    if (link) {
      link.innerHTML = (!state.demo && state.sheetId)
        ? ' (<a href="https://docs.google.com/spreadsheets/d/' + encodeURIComponent(state.sheetId) + '/edit" target="_blank" rel="noopener noreferrer">시트 열기</a>)'
        : '';
    }
  }

  function bootDemo() {
    const src = I.buildInbodyDemo();
    state.data = I.buildData(src.measureRows);
    state.goals = I.buildGoals(src.goalRows);
    state.sheetId = '';
    state.demo = true;
    setSync('데모');
    const btn = $('syncBtn');
    btn.disabled = false;
    btn.textContent = '새로고침';
    render();
  }

  async function sync(manual) {
    if (DEMO) { bootDemo(); return; }
    const seq = ++syncGen;
    const btn = $('syncBtn');
    btn.disabled = true;
    btn.textContent = '불러오는 중';
    setSync('불러오는 중');
    const hash = readHash();
    const hashK = hash.k;
    const savedK = lsGet(LS_KEY);
    try {
      if (!hashK && !savedK) {
        state.data = null;
        state.goals = null;
        state.sheetId = '';
        state.demo = false;
        setSync('시트 주소 없음');
        if (manual) window.alert('시트 주소가 없어요.\n받은 주소 전체(#k= 까지)로 다시 열어 주세요.');
        render();
        return;
      }
      let used = '';
      let data = null;
      let hashErr = null;
      if (hashK) {
        try { data = await I.loadMeasurements(hashK, hash.g); used = hashK; }
        catch (e) { hashErr = e; }
      }
      if (!data && savedK && savedK !== hashK) {
        try { data = await I.loadMeasurements(savedK, hash.g); used = savedK; }
        catch (e) { if (!hashErr) hashErr = e; }
      }
      if (seq !== syncGen) return;
      if (!data) throw hashErr || new Error('불러오지 못했어요');
      let goals = null;
      try { goals = await I.loadGoalTable(used); }
      catch (e) { goals = cachedGoals(used); }
      if (seq !== syncGen) return;
      const at = stamp();
      lsSet(LS_KEY, used);
      lsSet(LS_CACHE, JSON.stringify({ id: used, at: at, data: data }));
      if (goals) lsSet(LS_GOALS, JSON.stringify({ id: used, goals: goals }));
      state.data = data;
      state.goals = goals;
      state.sheetId = used;
      state.demo = false;
      setSync((hashK && used !== hashK ? '저장된 시트 · ' : '시트 최신 ') + at);
      render();
    } catch (e) {
      if (seq !== syncGen) return;
      const cache = loadCache();
      const can = cache && cache.data && (!hashK || cache.id === hashK || cache.id === savedK);
      if (can) {
        state.data = cache.data;
        state.sheetId = cache.id;
        state.goals = cachedGoals(cache.id);
        state.demo = false;
        setSync('오프라인 · 저장본 ' + (cache.at || ''));
      } else if (!state.data) {
        state.goals = null;
        setSync('시트를 불러오지 못했어요');
      } else {
        setSync('오프라인 · 저장본');
      }
      if (manual) window.alert('시트를 불러오지 못했어요.\n' + (e && e.message ? e.message : e) + '\n\n인터넷 연결과 시트 공유를 확인해 주세요.');
      render();
    } finally {
      if (seq === syncGen) {
        btn.disabled = false;
        btn.textContent = '새로고침';
      }
    }
  }

  $('tabs').addEventListener('click', function (e) {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    state.tab = b.getAttribute('data-tab');
    render();
    window.scrollTo(0, 0);
  });
  $('panel').addEventListener('click', function (e) {
    const metric = e.target.closest('[data-metric]');
    if (metric) {
      state.gm[metric.getAttribute('data-person')] = metric.getAttribute('data-metric');
      render();
      return;
    }
    const hz = e.target.closest('[data-hz]');
    if (hz) {
      state.hz[hz.getAttribute('data-who')] = +hz.getAttribute('data-hz');
      render();
      return;
    }
    const go = e.target.closest('[data-go]');
    if (!go) return;
    state.tab = go.getAttribute('data-go');
    render();
    window.scrollTo(0, 0);
  });
  $('syncBtn').addEventListener('click', function () { sync(true); });
  window.addEventListener('hashchange', function () { if (!DEMO) location.reload(); });

  if (!DEMO) {
    const hash = readHash();
    const cache = loadCache();
    const saved = lsGet(LS_KEY);
    if (cache && cache.data && (!hash.k || cache.id === hash.k || cache.id === saved)) {
      state.data = cache.data;
      state.sheetId = cache.id;
      state.goals = cachedGoals(cache.id);
      setSync('저장본 ' + (cache.at || ''));
      render();
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') sync(false);
    });
    sync(false);
  } else {
    bootDemo();
  }
})();
