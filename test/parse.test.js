'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
require(path.join(root, 'parse.js'));
require(path.join(root, 'figure.js'));
require(path.join(root, 'charts.js'));
require(path.join(root, 'demo.js'));

const I = globalThis.Inbody;

function eq(actual, expected, msg) {
  assert.strictEqual(actual, expected, (msg || '') + ' expected ' + expected + ' got ' + actual);
}

eq(I.parseDate('Date(2026,9,5)'), '2026-10-05', 'gviz month');
eq(I.parseDate('Date(2026,9,5,19,40,0)'), '2026-10-05', 'gviz datetime');
eq(I.parseDate('2026년 8월 12일'), '2026-08-12', 'korean');
eq(I.parseDate('2026. 8. 26'), '2026-08-26', 'dotted');
eq(I.parseDate('26.3.5'), '2026-03-05', 'two digit year');
eq(I.parseDate('2024-02-29'), '2024-02-29', 'leap');
eq(I.parseDate('2025-02-29'), null, 'not leap');
eq(I.parseDate('2026-02-31'), null, 'bad day');
eq(I.parseDate('14:30'), null, 'time is not a date');
eq(I.parseDate(''), null, 'empty date');
(function () {
  const q = '2026-10-02'.split('-').map(Number);
  const serial = String(Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(1899, 11, 30)) / 86400000));
  eq(I.parseDate(serial), '2026-10-02', 'serial');
})();

eq(I.parseTime('오후 7:40'), '19:40');
eq(I.parseTime('오전 12:15'), '00:15');
eq(I.parseTime('12:30 PM'), '12:30');
eq(I.parseTime('12:30 AM'), '00:30');
eq(I.parseTime('19:10'), '19:10');
eq(I.parseTime(''), '');

eq(I.num('82.4 kg'), 82.4);
eq(I.num('３４.２'), 34.2);
eq(I.num('−8.2'), -8.2);
eq(I.num('1,234.5'), 1234.5);
eq(I.num('65~78'), null);
eq(I.num(''), null);
eq(I.num('#N/A'), null);
eq(I.num('2026-08-12'), null);
eq(I.num('없음'), null);
assert.deepStrictEqual(I.rng('65.2 ~ 78.4'), [65.2, 78.4]);
assert.deepStrictEqual(I.rng('78~65'), [65, 78]);
eq(I.rng('2026-08-12'), null);
eq(I.rng(''), null);

const csv = I.parseCsv('\uFEFF이름,체중,메모\nA,"70","쉼표, 포함"\r\n');
eq(csv[0][0], '이름');
eq(csv[1][2], '쉼표, 포함');
eq(I.buildData(csv).by.A[0].weight, 70);

const src = I.buildInbodyDemo();
const data = I.buildData(src.measureRows);
const goals = I.buildGoals(src.goalRows);
assert.deepStrictEqual(data.people, ['A', 'B', 'C']);
eq(data.count, 8);
eq(data.by.A[0].date, '2026-08-12');
eq(data.by.A[0].time, '09:05');
eq(data.by.A[0].smm, 34.2);
eq(data.by.A[0].fCtl, -8.2);
eq(data.by.A[1].date, '2026-08-26');
eq(data.by.A[2].date, '2026-10-05');
eq(data.by.A[2].time, '19:40');
eq(data.by.C[1].date, '2026-10-02');
assert.deepStrictEqual(I.missingMonths(data.by.A.map(function (r) { return r.date; })), ['2026-09']);
assert.deepStrictEqual(I.missingMonths(data.by.B.map(function (r) { return r.date; })), []);
assert.deepStrictEqual(I.missingMonths(data.by.C.map(function (r) { return r.date; })), ['2026-09']);
assert.ok(!data.people.includes('Z'));

eq(goals.people.A.pts[8].weight, 80.5);
eq(goals.people.A.interp[8].weight, true);
eq(goals.people.A.pts[8].smm, 34.5);
eq(goals.people.A.interp[8].smm, undefined);
assert.deepStrictEqual(goals.people.C.mode.weight.band, [68, 72]);
eq(goals.fin, 24);
eq(I.nextCheckpoint(goals, '2026-10-07').w, 8);
eq(I.dday('2026-10-07', '2026-10-07'), 'D-day');
eq(goals.note, '만든 예시 값 · 의학적 진단 아님');

const weight = I.GOAL_METRICS[0];
data.colorOf = function () { return '#6aa8ff'; };
const goalSvg = I.goalChartSVG(goals, data, 'A', goals.people.A, weight, '2026-10-07');
assert.ok(goalSvg.indexOf('NaN') < 0, 'goal chart NaN');
assert.ok(goalSvg.indexOf('Infinity') < 0, 'goal chart Infinity');
assert.ok(/data-week="8" data-interp="1"/.test(goalSvg), 'interpolated week 8');
assert.ok(/data-date="2026-08-26"[^>]*data-track="1"/.test(goalSvg), 'ahead');
assert.ok(/data-date="2026-10-05"[^>]*data-track="0"/.test(goalSvg), 'behind');
assert.ok(goalSvg.indexOf('D-day') >= 0, 'checkpoint today');
assert.ok(goalSvg.indexOf('fill-opacity=".9"') < 0, 'goal values have no background box');
assert.ok(goalSvg.indexOf('>80.5*<') >= 0, 'interpolated value label');
assert.ok(/fill="#b7c6ff"[^>]*>80\.5\*</.test(goalSvg), 'interpolated label uses the goal tint');

const line = I.lineChart('체중', data.by.A, 'weight', 'kg', 1, '#6aa8ff');
assert.ok(line.indexOf('NaN') < 0, 'line NaN');
assert.ok(line.indexOf('9월') >= 0, 'empty month tick');
function cx(svg, date) {
  const m = new RegExp('data-date="' + date + '" cx="([0-9.]+)"').exec(svg);
  assert.ok(m, date);
  return +m[1];
}
const x0 = cx(line, '2026-08-12');
const x1 = cx(line, '2026-08-26');
const x2 = cx(line, '2026-10-05');
const ratio = (x1 - x0) / (x2 - x0);
assert.ok(ratio > 0.15 && ratio < 0.4, 'empty month keeps calendar space ' + ratio);

const round = data.by.B[data.by.B.length - 1];
const fig = I.bodySVG(round, '#c08cff', '', 183);
assert.ok(fig.indexOf('bodyfig') >= 0 && fig.indexOf('NaN') < 0, 'silhouette');
assert.ok(fig.indexOf('img/body/bf30.webp?v=20261007') >= 0, '30% anchor');
assert.ok(/<picture class="bf-pic bf-base">/.test(fig), 'nearer anchor stays opaque');
assert.ok(/class="bf-pic bf-over" style="opacity:0\.160/.test(fig), 'only the far anchor fades');
assert.ok(/--bf-mask:url\('img\/body\/bf30\.png\?v=20261007'\)/.test(fig), 'edge follows the nearer silhouette');
const mid = I.bodySVG({ pbf: 23, height: 180 }, '#7c9cff', '', 180);
assert.ok(/bf-base">[\s\S]*bf25\.webp/.test(mid), '23% silhouette is the nearer 25% anchor');
assert.ok(/bf-over" style="opacity:0\.400/.test(mid) && /bf20\.webp/.test(mid), '23% keeps 40% of bf20 inside that edge');
const exact = I.bodySVG({ pbf: 20, height: 180 }, '#7c9cff', '', 180);
assert.ok(exact.indexOf('bf-over') < 0 && /bf20\.webp\?v=20261007/.test(exact), 'exact anchor is one opaque picture');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
assert.ok(html.indexOf('styles.css?v=20261011') >= 0 && html.indexOf('app.js?v=20261011') >= 0, 'cache bust');
const shape = I.bodyShape(round);
assert.ok(shape.f > 0.85, 'high body fat is round ' + shape.f);
assert.ok(shape.m < 0.7, 'muscle stays skeletal ' + shape.m);
const band = I.bodyBand(23);
assert.strictEqual(band.lo, 20, '23% low anchor');
assert.strictEqual(band.hi, 25, '23% high anchor');
assert.ok(Math.abs(band.t - 0.6) < 1e-9, '23% is 40/60 ' + band.t);
assert.strictEqual(I.bodyBand(8).lo, 10, 'clamp below 10');
assert.strictEqual(I.bodyBand(35).lo, 35, '35 anchor');
assert.ok(I.bodyBand(40).scaleX > 1 && I.bodyBand(40).scaleX <= 1.06, 'widen past 35');
assert.ok(Math.abs(I.bodyBand(20).scaleX - 1) < 1e-9, 'anchor scale is 1');
const shortFig = I.bodySVG({ pbf: 20, height: 167, bmi: 25, sex: '여' }, '#ff8fc7', '', 183);
assert.ok(shortFig.indexOf('data-h="0.9126"') >= 0, '167/183 height ' + shortFig.match(/data-h="[^"]+"/));
assert.ok(data.by.A[data.by.A.length - 1].pbf === 12.4, 'demo A lean');
assert.ok(data.by.C[data.by.C.length - 1].pbf === 20, 'demo C mid');
assert.ok(data.by.A[0].height === 183 && data.by.B[0].height === 180 && data.by.C[0].height === 167, 'demo heights');

['demo.js', 'app.js', 'index.html', 'charts.js', 'figure.js', 'styles.css', 'parse.js'].forEach(function (file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  assert.ok(!/spreadsheets\/d\/[A-Za-z0-9_-]{20,}/.test(text), file + ' has a sheet id');
});
assert.ok(!/docs\.google\.com/.test(fs.readFileSync(path.join(root, 'demo.js'), 'utf8')), 'demo must not reference sheets');

eq(I.normH('체중（kg）'), '체중', 'fullwidth paren');
eq(I.normH('체중*'), '체중', 'star header');
const withTitle = [['이 줄은 제목입니다']].concat(src.measureRows);
eq(I.buildData(withTitle).count, 8, 'title row skipped');
const renamed = src.measureRows.map(function (r) { return r.slice(); });
renamed[0][renamed[0].indexOf('이름')] = '성명';
renamed[0][renamed[0].indexOf('체중')] = '체중(kg)';
renamed[0][renamed[0].indexOf('체지방률')] = '체지방율';
const renamedData = I.buildData(renamed.map(function (r) { return r.slice().reverse(); }));
eq(renamedData.by.A[0].weight, 84, 'renamed reversed weight');
eq(renamedData.by.A[0].pbf, 16.8, 'renamed pbf');
eq(renamedData.by.A[0].date, '2026-08-12', 'renamed date');
eq(renamedData.by.A[0].seg.m[0], '표준', 'segment follows header');
assert.deepStrictEqual(renamedData.people, ['A', 'B', 'C']);
const noW = src.measureRows.map(function (r) { return r.slice(); });
const wi = noW[0].indexOf('체중');
noW.forEach(function (r) { r.splice(wi, 1); });
assert.throws(function () { I.buildData(noW); }, function (e) { return e.code === 'schema' && /체중/.test(e.message); });
assert.throws(function () { I.buildData([src.measureRows[0]]); }, function (e) { return e.code === 'empty'; });
assert.throws(function () { I.buildData([['값'], ['1']]); }, function (e) { return e.code === 'schema'; });

const summary = I.changeSummary(data.by.A);
eq(summary.sentence, '8/12 이후 체중은 2.8kg 줄고, 체지방률은 4.4%p 줄고, 골격근량은 0.2kg 늘었습니다.');
eq(summary.latest, '8/26보다 체중은 1.2kg 줄고, 체지방률은 2.2%p 줄고, 골격근량은 0.1kg 늘었습니다.');
eq(I.changeSummary(data.by.A.slice(0, 1)).sentence, '');
const flat = I.changeSummary([
  { date: '2026-01-01', weight: 70, pbf: 20, smm: 30 },
  { date: '2026-02-01', weight: 70, pbf: null, smm: 30.4 }
]);
eq(flat.sentence, '1/1 이후 체중은 그대로이고, 골격근량은 0.4kg 늘었습니다.');
assert.deepStrictEqual(I.periodBounds('all', '2026-10-11'), { from: '', to: '' });
assert.deepStrictEqual(I.periodBounds('4', '2026-10-11'), { from: '2026-09-13', to: '2026-10-11' });
assert.deepStrictEqual(I.periodBounds('12', '2026-10-11'), { from: '2026-07-19', to: '2026-10-11' });

const weightPath = I.goalPath(goals, 'A', 'weight');
const clipped = I.clipPath(weightPath, '2026-08-12', '2026-10-05');
eq(clipped[0].date, '2026-08-12');
eq(clipped[0].v, 84);
eq(clipped[clipped.length - 1].date, '2026-10-05');
assert.ok(Math.abs(clipped[clipped.length - 1].v - 80.6) < 0.05, 'clipped end ' + clipped[clipped.length - 1].v);
const behind = data.by.A[2];
const target = I.pathAt(weightPath, behind.date);
const ahead = I.onTrack(goals.people.A, weight, weightPath, behind.date, behind.weight);
eq(ahead, false);
const gapText = I.goalGapText(weight, behind.weight, target, ahead, {});
assert.ok(gapText.indexOf('뒤처집니다') >= 0, gapText);
const bandText = I.goalGapText(weight, 70.6, 70, true, { band: [68, 72] });
assert.ok(bandText.indexOf('68~72') >= 0 && bandText.indexOf('안입니다') >= 0, bandText);

const withGoal = I.lineChart('체중', data.by.A, 'weight', 'kg', 1, '#6aa8ff', { goal: clipped });
assert.ok(withGoal.indexOf('stroke-dasharray') >= 0, 'goal line');
assert.ok(withGoal.indexOf('NaN') < 0 && withGoal.indexOf('Infinity') < 0, 'goal line finite');
assert.ok(withGoal.indexOf('2.8 감소') >= 0, 'delta in chart header');
const zoom = I.lineChart('체중', data.by.A, 'weight', 'kg', 1, '#6aa8ff', { from: '2026-09-13', to: '2026-10-11' });
assert.ok(zoom.indexOf('data-date="2026-08-12"') < 0, '4주 hides August');
assert.ok(zoom.indexOf('data-date="2026-10-05"') >= 0, '4주 keeps October');
assert.ok(zoom.indexOf('변화 없음') < 0, 'one point is not called unchanged');
const bandSvg = I.lineChart('체중', data.by.C, 'weight', 'kg', 1, '#ff8fc7', { band: [68, 72] });
assert.ok(bandSvg.indexOf('rgba(61,214,140') >= 0 && bandSvg.indexOf('NaN') < 0, 'maintain band');

console.log('ok ' + data.count + ' rows, week8 ' + goals.people.A.pts[8].weight + ', gap ratio ' + ratio.toFixed(3));
