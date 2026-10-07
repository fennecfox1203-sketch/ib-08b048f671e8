/* 가짜 측정. 이름·숫자는 모두 만든 것이다. 네트워크를 쓰지 않는다. */
(function (root) {
  'use strict';

  const P = root.Inbody;

  function serial(iso) {
    const q = iso.split('-').map(Number);
    return String(Math.round((Date.UTC(q[0], q[1] - 1, q[2]) - Date.UTC(1899, 11, 30)) / 86400000));
  }

  function bmi(weight, height) {
    const hm = height / 100;
    return Math.round(weight / (hm * hm) * 10) / 10;
  }

  const MEASURE_HEAD = [
    '이름', '측정일', '시각', '키', '나이', '성별', '장소', '기기',
    '체중', '체중범위', '골격근량', '체지방량', '체지방량범위', '체지방률', 'BMI', '인바디점수',
    '체수분', '체수분범위', '단백질', '단백질범위', '무기질', '무기질범위',
    '적정체중', '체중조절', '지방조절', '근육조절', 'BMI판정', '체지방률판정',
    '복부지방률', '내장지방레벨', '제지방량', '기초대사량', '기초대사량범위', '비만도', '비만도범위', '권장섭취열량',
    '근육왼팔', '근육오른팔', '근육몸통', '근육왼다리', '근육오른다리',
    '지방왼팔', '지방오른팔', '지방몸통', '지방왼다리', '지방오른다리',
    '배드민턴', '메모'
  ];

  function measure(o) {
    const weight = o.weightNum;
    const pbf = o.pbfNum;
    const bfm = Math.round(weight * pbf) / 100;
    const ffm = Math.round((weight - bfm) * 10) / 10;
    const row = {
      '이름': o.name,
      '측정일': o.date,
      '시각': o.time || '',
      '키': o.height,
      '나이': o.age,
      '성별': o.sex,
      '장소': '데모센터',
      '기기': 'InBody000',
      '체중': o.weight,
      '체중범위': o.weightR,
      '골격근량': o.smm,
      '체지방량': bfm.toFixed(1),
      '체지방량범위': o.bfmR,
      '체지방률': String(pbf),
      'BMI': String(bmi(weight, o.height)),
      '인바디점수': o.score,
      '체수분': o.tbw,
      '체수분범위': o.tbwR,
      '단백질': o.protein,
      '단백질범위': o.proteinR,
      '무기질': o.mineral,
      '무기질범위': o.mineralR,
      '적정체중': o.target,
      '체중조절': o.wCtl,
      '지방조절': o.fCtl,
      '근육조절': o.mCtl,
      'BMI판정': o.bmiJ,
      '체지방률판정': o.pbfJ,
      '복부지방률': o.whr,
      '내장지방레벨': o.vfl,
      '제지방량': ffm.toFixed(1),
      '기초대사량': o.bmr,
      '기초대사량범위': o.bmrR,
      '비만도': o.obes,
      '비만도범위': '90~110',
      '권장섭취열량': o.kcal,
      '근육왼팔': o.mL, '근육오른팔': o.mR, '근육몸통': o.mT, '근육왼다리': o.mLL, '근육오른다리': o.mRL,
      '지방왼팔': o.fL, '지방오른팔': o.fR, '지방몸통': o.fT, '지방왼다리': o.fLL, '지방오른다리': o.fRL,
      '배드민턴': o.badminton || '',
      '메모': o.memo || ''
    };
    return MEASURE_HEAD.map(function (h) { return row[h] == null ? '' : String(row[h]); });
  }

  const A = { height: 178, age: 32, sex: '남', weightR: '70.0~85.0', bfmR: '10.0~17.0', tbwR: '40.0~49.0', proteinR: '11.0~13.5', mineralR: '3.50~4.30', bmrR: '1500~1800', target: '74.0' };
  const B = { height: 170, age: 41, sex: '남', weightR: '62.0~80.0', bfmR: '9.0~16.0', tbwR: '38.0~46.0', proteinR: '10.5~12.8', mineralR: '3.20~4.00', bmrR: '1450~1750', target: '80.0' };
  const C = { height: 162, age: 29, sex: '여', weightR: '50.0~68.0', bfmR: '11.0~18.0', tbwR: '28.0~34.0', proteinR: '7.5~9.2', mineralR: '2.40~3.10', bmrR: '1200~1450', target: '70.0' };

  function personRow(base, o) {
    return measure(Object.assign({}, base, o, { weightNum: o.weightNum, pbfNum: o.pbfNum }));
  }

  const GOAL_HEAD = ['이름', '시점', '날짜', '목표문장', '체중', '골격근량', '체지방률', '내장지방', '점수', '설정', '값'];

  function goalRow(o) {
    const row = {
      '이름': o.name || '', '시점': o.when || '', '날짜': o.date || '', '목표문장': o.goal || '',
      '체중': o.weight == null ? '' : o.weight, '골격근량': o.smm == null ? '' : o.smm,
      '체지방률': o.pbf == null ? '' : o.pbf, '내장지방': o.vfl == null ? '' : o.vfl,
      '점수': o.score == null ? '' : o.score, '설정': o.key || '', '값': o.val || ''
    };
    return GOAL_HEAD.map(function (h) { return String(row[h]); });
  }

  const WEEKS = [
    { when: '시작', date: '2026-08-12', w: 0 },
    { when: '4주', date: '2026-09-09', w: 4 },
    { when: '8주', date: '2026-10-07', w: 8 },
    { when: '12주', date: '2026-11-04', w: 12 },
    { when: '16주', date: '2026-12-02', w: 16 },
    { when: '20주', date: '2026-12-30', w: 20 },
    { when: '24주', date: '2027-01-27', w: 24 }
  ];

  function series(name, goal, cols) {
    return WEEKS.map(function (wk) {
      const o = { name: name, when: wk.when, date: wk.date, goal: wk.w === 0 ? goal : '' };
      Object.keys(cols).forEach(function (k) {
        const list = cols[k];
        o[k] = list[WEEKS.indexOf(wk)];
      });
      return goalRow(o);
    });
  }

  function buildInbodyDemo() {
    const measureRows = [MEASURE_HEAD];
    measureRows.push(personRow(A, {
      name: 'A', date: '2026년 8월 12일', time: '오전 9:05', weight: '84.0', weightNum: 84, smm: '３４.２', pbfNum: 26,
      score: 68, tbw: '44.1', protein: '12.0', mineral: '3.80', wCtl: '-10.0', fCtl: '−8.2', mCtl: '+0.8',
      bmiJ: '비만', pbfJ: '경도비만', whr: '0.92', vfl: 12, bmr: 1680, obes: 118, kcal: 2100,
      mL: '표준', mR: '표준', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준이상', fR: '표준이상', fT: '표준이상', fLL: '표준', fRL: '표준', badminton: 180, memo: '예시 첫 측정'
    }));
    measureRows.push(personRow(A, {
      name: 'A', date: '2026. 8. 26', time: '19:10', weight: '82.4 kg', weightNum: 82.4, smm: '34.3', pbfNum: 25.1,
      score: 70, tbw: '44.0', protein: '12.0', mineral: '3.82', wCtl: '-8.4', fCtl: '-7.0', mCtl: '+0.6',
      bmiJ: '비만', pbfJ: '경도비만', whr: '0.91', vfl: 11, bmr: 1670, obes: 115, kcal: 2050,
      mL: '표준', mR: '표준', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준이상', fR: '표준이상', fT: '표준이상', fLL: '표준', fRL: '표준'
    }));
    measureRows.push(['A', '2026-09-15', '', '178', '32', '남', '데모센터', 'InBody000', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
    measureRows.push(personRow(A, {
      name: 'A', date: 'Date(2026,9,5)', time: '오후 7:40', weight: '81.2', weightNum: 81.2, smm: '34.4', pbfNum: 24.2,
      score: 72, tbw: '43.8', protein: '12.1', mineral: '3.84', wCtl: '-7.2', fCtl: '-6.1', mCtl: '+0.6',
      bmiJ: '비만', pbfJ: '경도비만', whr: '0.90', vfl: 11, bmr: 1664, obes: 114, kcal: 2020,
      mL: '표준', mR: '표준', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준', fR: '표준', fT: '표준이상', fLL: '표준', fRL: '표준', memo: '9월은 빈 달'
    }));

    measureRows.push(personRow(B, {
      name: 'B', date: '2026-08-12', time: '10:20', weight: '90.0', weightNum: 90, smm: '30.0', pbfNum: 32,
      score: 54, tbw: '40.2', protein: '10.8', mineral: '3.40', wCtl: '-10.0', fCtl: '-12.4', mCtl: '+1.5',
      bmiJ: '비만', pbfJ: '비만', whr: '0.98', vfl: 16, bmr: 1620, obes: 132, kcal: 1900,
      mL: '표준이하', mR: '표준이하', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준이상', fR: '표준이상', fT: '표준이상', fLL: '표준이상', fRL: '표준이상'
    }));
    measureRows.push(personRow(B, {
      name: 'B', date: '2026-09-15', time: '10:05', weight: '89.1', weightNum: 89.1, smm: '30.1', pbfNum: 31.4,
      score: 56, tbw: '40.1', protein: '10.8', mineral: '3.41', wCtl: '-9.1', fCtl: '-11.6', mCtl: '+1.4',
      bmiJ: '비만', pbfJ: '비만', whr: '0.97', vfl: 16, bmr: 1615, obes: 130, kcal: 1880,
      mL: '표준이하', mR: '표준이하', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준이상', fR: '표준이상', fT: '표준이상', fLL: '표준이상', fRL: '표준이상'
    }));
    measureRows.push(personRow(B, {
      name: 'B', date: '2026-10-06', time: '11:00', weight: '88.6', weightNum: 88.6, smm: '30.2', pbfNum: 30.8,
      score: 57, tbw: '40.0', protein: '10.9', mineral: '3.42', wCtl: '-8.6', fCtl: '-11.0', mCtl: '+1.3',
      bmiJ: '비만', pbfJ: '비만', whr: '0.97', vfl: 15, bmr: 1610, obes: 129, kcal: 1860,
      mL: '표준이하', mR: '표준', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준이상', fR: '표준이상', fT: '표준이상', fLL: '표준이상', fRL: '표준이상'
    }));

    measureRows.push(personRow(C, {
      name: 'C', date: '2026-08-12', time: '18:00', weight: '70.0', weightNum: 70, smm: '22.0', pbfNum: 28,
      score: 74, tbw: '31.2', protein: '8.2', mineral: '2.70', wCtl: '0.0', fCtl: '-2.4', mCtl: '+2.0',
      bmiJ: '과체중', pbfJ: '표준', whr: '0.84', vfl: 7, bmr: 1320, obes: 108, kcal: 1700,
      mL: '표준', mR: '표준', mT: '표준', mLL: '표준이하', mRL: '표준이하',
      fL: '표준', fR: '표준', fT: '표준', fLL: '표준', fRL: '표준'
    }));
    measureRows.push(personRow(C, {
      name: 'C', date: serial('2026-10-02'), time: '18:30', weight: '70.6', weightNum: 70.6, smm: '23.0', pbfNum: 27.2,
      score: 76, tbw: '31.6', protein: '8.4', mineral: '2.74', wCtl: '+0.6', fCtl: '-1.8', mCtl: '+1.0',
      bmiJ: '과체중', pbfJ: '표준', whr: '0.83', vfl: 7, bmr: 1340, obes: 109, kcal: 1720,
      mL: '표준', mR: '표준', mT: '표준', mLL: '표준', mRL: '표준',
      fL: '표준', fR: '표준', fT: '표준', fLL: '표준', fRL: '표준', memo: '체중은 유지 범위'
    }));
    measureRows.push(['Z', '2026-10-01', '', '', '', '', '', '', 'abc', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);

    const goalRows = [GOAL_HEAD];
    goalRows.push(goalRow({ key: '기간시작', val: '2026-08-12' }));
    goalRows.push(goalRow({ key: '기간끝', val: '2027-01-27' }));
    goalRows.push(goalRow({ key: '안내문구', val: '만든 예시 값 · 의학적 진단 아님' }));
    goalRows.push(goalRow({ key: 'C체중범위', val: '68~72' }));
    series('A', '24주 동안 체중을 천천히 줄이기', {
      weight: ['84.0', '82.0', '', '79.0', '77.0', '75.5', '74.0'],
      smm: ['34.2', '34.4', '34.5', '34.6', '34.7', '34.8', '35.0'],
      pbf: ['26.0', '24.8', '23.6', '22.2', '20.8', '19.4', '18.0'],
      vfl: ['12', '11', '10', '9', '9', '8', '7'],
      score: ['68', '70', '72', '74', '76', '78', '80']
    }).forEach(function (r) { goalRows.push(r); });
    series('B', '체지방을 조금씩 낮추기', {
      weight: ['90.0', '88.0', '86.0', '84.5', '83.0', '81.5', '80.0'],
      smm: ['30.0', '30.2', '30.4', '30.6', '30.8', '31.0', '31.2'],
      pbf: ['32.0', '30.5', '29.0', '27.5', '26.2', '25.0', '24.0'],
      vfl: ['16', '15', '14', '13', '12', '11', '10'],
      score: ['54', '58', '62', '65', '68', '70', '72']
    }).forEach(function (r) { goalRows.push(r); });
    series('C', '체중은 유지하고 골격근만 올리기', {
      weight: ['70.0', '70.0', '70.0', '70.0', '70.0', '70.0', '70.0'],
      smm: ['22.0', '22.4', '22.8', '23.2', '23.5', '23.8', '24.0'],
      pbf: ['28.0', '27.4', '26.8', '26.0', '25.2', '24.6', '24.0'],
      vfl: ['7', '7', '6', '6', '6', '5', '5'],
      score: ['74', '76', '78', '80', '81', '82', '84']
    }).forEach(function (r) { goalRows.push(r); });

    return { measureRows: measureRows, goalRows: goalRows };
  }

  root.buildInbodyDemo = buildInbodyDemo;
  if (P) root.Inbody.buildInbodyDemo = buildInbodyDemo;
  if (typeof module !== 'undefined' && module.exports) module.exports = { buildInbodyDemo: buildInbodyDemo };
})(typeof globalThis !== 'undefined' ? globalThis : this);
