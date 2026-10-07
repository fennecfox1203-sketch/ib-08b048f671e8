/* 체형 그림 스타일 A. 체지방은 둥근 정도, 근육은 골격(키·어깨)만. */
(function (root) {
'use strict';
function bodyShape(r){
  const cl=(v,a,b)=>Math.max(0,Math.min(1,(v-a)/(b-a)));
  const female=/여/.test(r.sex||'');
  const fp = r.pbf!=null ? cl(r.pbf, female?20:12, female?40:32) : null;
  const fb = r.bmi!=null ? cl(r.bmi, 20, 29) : null;
  let f = fp!=null&&fb!=null ? fp*0.7+fb*0.3 : (fp!=null?fp:(fb!=null?fb:0.4));
  let m = 0.4;
  if(r.smm!=null && r.height){ const hm=r.height/100; m=cl(r.smm/(hm*hm), female?7.5:9.2, female?10:11.6); }
  const hs = r.height ? Math.max(0.86,Math.min(1.04,r.height/183)) : 0.95;
  return {f,m,hs};
}
let _figSeq=0;
function tint(hex, k){
  const n=parseInt(hex.slice(1),16); let rgb=[n>>16&255,n>>8&255,n&255];
  rgb=rgb.map(v=>Math.round(k>=0? v+(255-v)*k : v*(1+k)));
  return '#'+rgb.map(v=>v.toString(16).padStart(2,'0')).join('');
}
const F1=v=>(+v).toFixed(1);
/* 굵기가 변하는 팔다리 외곽선: 2차 베지어 중심선 + 양끝 둥근/평평 마감 */
function limbPath(p0,p1,p2,w0,w1,w2,capS,capE){
  const N=22, L=[], R=[];
  for(let i=0;i<=N;i++){
    const t=i/N, u=1-t;
    const x=u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], y=u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1];
    let dx=2*u*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]), dy=2*u*(p1[1]-p0[1])+2*t*(p2[1]-p1[1]);
    const d=Math.hypot(dx,dy)||1; dx/=d; dy/=d;
    const s=t<0.5? t*2 : (t-0.5)*2;
    const ss=s*s*(3-2*s);
    const w=(t<0.5? w0+(w1-w0)*ss : w1+(w2-w1)*ss)/2;
    L.push([x-dy*w, y+dx*w]); R.push([x+dy*w, y-dx*w]);
  }
  const P=p=>F1(p[0])+','+F1(p[1]);
  let d='M'+P(L[0]);
  for(let i=1;i<=N;i++) d+=' L'+P(L[i]);
  d+= capE!==false ? ' A'+F1(w2/2)+','+F1(w2/2)+' 0 0 0 '+P(R[N]) : ' L'+P(R[N]);
  for(let i=N-1;i>=0;i--) d+=' L'+P(R[i]);
  d+= capS!==false ? ' A'+F1(w0/2)+','+F1(w0/2)+' 0 0 0 '+P(L[0]) : ' L'+P(L[0]);
  return d+' Z';
}

/* A2) 플랫 피트니스 일러스트 · 체지방이 많을수록 동글동글(좁고 처진 어깨·짧은 목·둥근 배·넓은 엉덩이), 근육은 골격(키·어깨 폭)만 키움 */
function bodySVG_A2(r, color, cls){
  const {f,m,hs}=bodyShape(r);
  const id='fb'+(++_figSeq), cx=60, G=236, H=222*hs, T=G-H, Y=k=>T+H*k, P=F1;
  const skin='#f3cba9', skinD='#e3ae88', hair='#2b3140';
  const tee=tint(color,0.05), teeD=tint(color,-0.22), teeL=tint(color,0.42);
  const shorts=tint(color,-0.45), band=tint(color,-0.62);
  const L=x=>P(cx-x), R=x=>P(cx+x);
  /* 머리: 살이 많을수록 둥글고 볼이 통통, 목은 짧게 */
  const hry=H*(0.106+0.004*f), hrx=hry*(0.8+0.12*f), hcy=Y(0.112+0.014*f), ck=1+0.13*f;
  const headD='M'+P(cx)+','+P(hcy-hry)+
    ' C'+P(cx+hrx*0.56)+','+P(hcy-hry)+' '+P(cx+hrx)+','+P(hcy-hry*0.56)+' '+P(cx+hrx)+','+P(hcy)+
    ' C'+P(cx+hrx*ck)+','+P(hcy+hry*0.55)+' '+P(cx+hrx*0.6*ck)+','+P(hcy+hry)+' '+P(cx)+','+P(hcy+hry)+
    ' C'+P(cx-hrx*0.6*ck)+','+P(hcy+hry)+' '+P(cx-hrx*ck)+','+P(hcy+hry*0.55)+' '+P(cx-hrx)+','+P(hcy)+
    ' C'+P(cx-hrx)+','+P(hcy-hry*0.56)+' '+P(cx-hrx*0.56)+','+P(hcy-hry)+' '+P(cx)+','+P(hcy-hry)+' Z';
  /* 몸통 반폭: 어깨는 근육(골격)으로만, 배·엉덩이는 체지방으로 */
  const nk=H*(0.034+0.012*f);
  const S=H*(0.11+0.03*m+0.004*f);
  const C=H*(0.094+0.016*m+0.034*f);
  const B=H*(0.078+0.104*f+0.01*m);
  const Hp=H*(0.09+0.062*f+0.006*m);
  const yN=Y(0.214+0.008*f), ySh=Y(0.252+0.026*f), yAp=Y(0.335+0.006*f), yB=Y(0.44+0.03*f), yHem=Y(0.548+0.008*f);
  const sag=H*(0.012+0.05*f);                    /* 배가 밑단을 밀어냄 */
  const yCr=Y(0.6+0.014*f), ySb=Y(0.69), yK=Y(0.79), yA=Y(0.948);
  /* 다리: 짧고 굵은 허벅지, 부드럽게 가늘어짐 */
  const tw=H*(0.068+0.074*f), kw=H*(0.05+0.034*f), aw2=H*(0.03+0.01*f);
  const lx=Math.max(tw*0.5+0.4, Math.min(Hp-tw*0.5, tw*0.5+1+2*(1-f))), kx=lx-0.5+0.6*f, ax=lx-0.6+0.4*f;
  const legs=s=>'<path d="'+limbPath([cx+s*lx,yCr-8],[cx+s*(lx+kx)/2,(yCr+yK)/2],[cx+s*kx,yK],tw,tw*0.86,kw,true,true)+'" fill="'+skin+'"/>'+
    '<path d="'+limbPath([cx+s*kx,yK-2],[cx+s*(kx+0.3),yK+(yA-yK)*0.35],[cx+s*ax,yA],kw,kw*(1.06-0.04*f),aw2,true,true)+'" fill="'+skin+'"/>';
  /* 팔: 부드럽게 가늘어지는 통통한 팔 (근육 모양 없음) */
  const uw=H*(0.044+0.036*f+0.006*m), fw=H*(0.034+0.02*f+0.004*m);
  const side=Math.max(C, B*0.97);
  const arms=s=>{
    const p0=[cx+s*(S-uw*0.5), ySh+uw*0.45], p1=[cx+s*(side+uw*0.5+1.2), Y(0.41+0.01*f)], p2=[cx+s*(side+fw*0.5+1.8+1.5*f), Y(0.556+0.006*f)];
    const bz=t=>{const u=1-t;return [u*u*p0[0]+2*u*t*p1[0]+t*t*p2[0], u*u*p0[1]+2*u*t*p1[1]+t*t*p2[1]];};
    const ts=0.36, q1=[p0[0]+(p1[0]-p0[0])*ts, p0[1]+(p1[1]-p0[1])*ts], e=bz(ts);
    const arm='<path d="'+limbPath(p0,p1,p2,uw,uw*0.86,fw*0.92,true,true)+'" fill="'+skin+'"/>'+
      '<ellipse cx="'+P(p2[0]+s*0.3)+'" cy="'+P(p2[1]+fw*0.5)+'" rx="'+P(fw*0.6)+'" ry="'+P(fw*0.74)+'" fill="'+skin+'"/>';
    const sw=uw+3.2;
    const sleeve='<path d="'+limbPath([p0[0]-s*1.2,p0[1]-1.5],q1,e,sw+1.5,sw,sw-0.4,true,false)+'" fill="'+tee+'"/>';
    const ex=bz(ts-0.03); let dx=e[0]-ex[0], dy=e[1]-ex[1]; const dl=Math.hypot(dx,dy)||1; dx/=dl; dy/=dl;
    const hem='<path d="M'+P(e[0]-dy*sw/2-dx*1.6)+','+P(e[1]+dx*sw/2-dy*1.6)+' L'+P(e[0]+dy*sw/2-dx*1.6)+','+P(e[1]-dx*sw/2-dy*1.6)+'" stroke="'+teeD+'" stroke-width="1.3" stroke-opacity=".5" stroke-linecap="round"/>';
    return arm+sleeve+hem;
  };
  /* 티셔츠: 목 → 처진 어깨 → 겨드랑이 → 둥근 배 → 밑단 */
  const half=X=>[
    ['C',X(nk+H*0.03),P(yN+0.6),X(S-H*(0.04+0.02*f)),P(ySh-H*(0.016-0.01*f)),X(S),P(ySh+H*0.012)],
    ['C',X(S+H*(0.014+0.006*f)),P(ySh+H*0.036),X(C),P(yAp-H*0.034),X(C),P(yAp)],
    ['C',X(C),P(yAp+(yB-yAp)*0.36),X(B),P(yB-(yB-yAp)*0.55),X(B),P(yB)],
    ['C',X(B),P(yB+(yHem-yB)*0.62),X(Hp+H*0.02*f+1),P(yHem-H*0.006),X(Hp),P(yHem)]
  ];
  const hl=half(L), hr=half(R);
  let teeP='M'+L(nk)+','+P(yN);
  hl.forEach(c=>teeP+=' C'+c[1]+','+c[2]+' '+c[3]+','+c[4]+' '+c[5]+','+c[6]);
  teeP+=' C'+L(Hp*0.7)+','+P(yHem+sag*0.9)+' '+R(Hp*0.7)+','+P(yHem+sag*0.9)+' '+R(Hp)+','+P(yHem);
  const rv=[[3,2],[2,1],[1,0],[0,-1]];
  rv.forEach(([a,b])=>{ const c=hr[a], end=b>=0?[hr[b][5],hr[b][6]]:[R(nk),P(yN)]; teeP+=' C'+c[3]+','+c[4]+' '+c[1]+','+c[2]+' '+end[0]+','+end[1]; });
  teeP+=' Z';
  /* 반바지: 넓은 엉덩이, 허리밴드는 배 아래로 */
  const sbo=lx+tw*0.5+2.2, sbi=Math.max(1.2,lx-tw*0.5-1.2), Hq=Hp+H*0.012*f, yTop=yHem-H*0.03;
  const shortsD='M'+L(Hp-1)+','+P(yTop)+' C'+L(Hq+1.5)+','+P(yHem+H*0.03)+' '+L(sbo+1)+','+P(ySb-H*0.06)+' '+L(sbo)+','+P(ySb)+
    ' Q'+L((sbo+sbi)/2)+','+P(ySb+1.6)+' '+L(sbi)+','+P(ySb+0.8)+' Q'+P(cx)+','+P(yCr-H*0.045)+' '+R(sbi)+','+P(ySb+0.8)+
    ' Q'+R((sbo+sbi)/2)+','+P(ySb+1.6)+' '+R(sbo)+','+P(ySb)+' C'+R(sbo+1)+','+P(ySb-H*0.06)+' '+R(Hq+1.5)+','+P(yHem+H*0.03)+' '+R(Hp-1)+','+P(yTop)+' Z';
  /* 운동화 */
  const shoe=s=>{ const X=v=>P(cx+s*v), x0=ax+0.4, h=H*0.072, ci=aw2*0.5+1.4, w=aw2*0.85+5+1.5*f;
    const d='M'+X(x0-w*0.8)+','+P(G-1.5)+
      ' C'+X(x0-w*0.95)+','+P(G-h*0.5)+' '+X(x0-ci-0.8)+','+P(G-h*0.8)+' '+X(x0-ci)+','+P(G-h)+
      ' L'+X(x0+ci)+','+P(G-h)+
      ' C'+X(x0+ci+1)+','+P(G-h*0.62)+' '+X(x0+w*1.15)+','+P(G-h*0.62)+' '+X(x0+w*1.1)+','+P(G-1.5)+' Z';
    return '<path d="'+d+'" fill="#f5f7fb"/>'+
      '<path d="M'+X(x0-ci+0.6)+','+P(G-h*0.72)+' L'+X(x0+ci-0.6)+','+P(G-h*0.72)+' M'+X(x0-ci+0.8)+','+P(G-h*0.5)+' L'+X(x0+ci-0.2)+','+P(G-h*0.5)+'" stroke="#c4ccd9" stroke-width="1.2" stroke-linecap="round"/>'+
      '<path d="M'+X(x0+ci+1.2)+','+P(G-h*0.5)+' Q'+X(x0+w*0.75)+','+P(G-h*0.45)+' '+X(x0+w*0.95)+','+P(G-h*0.22)+'" fill="none" stroke="'+tee+'" stroke-width="1.8" stroke-linecap="round"/>'+
      '<path d="M'+X(x0-w*0.85)+','+P(G-4.4)+' L'+X(x0+w*1.12)+','+P(G-4.4)+' L'+X(x0+w*1.12)+','+P(G-1.6)+' Q'+X(x0+w*1.12)+','+P(G)+' '+X(x0+w*0.9)+','+P(G)+' L'+X(x0-w*0.65)+','+P(G)+' Q'+X(x0-w*0.85)+','+P(G)+' '+X(x0-w*0.85)+','+P(G-1.6)+' Z" fill="#d3d9e4"/>'; };
  /* 머리카락 */
  const hairD='M'+P(cx-hrx-0.8)+','+P(hcy+hry*0.1)+
    ' C'+P(cx-hrx-2)+','+P(hcy-hry*0.9)+' '+P(cx-hrx*0.5)+','+P(hcy-hry*1.32)+' '+P(cx+hrx*0.15)+','+P(hcy-hry*1.22)+
    ' C'+P(cx+hrx*0.9)+','+P(hcy-hry*1.2)+' '+P(cx+hrx+1.8)+','+P(hcy-hry*0.7)+' '+P(cx+hrx+0.7)+','+P(hcy+hry*0.08)+
    ' C'+P(cx+hrx*0.85)+','+P(hcy-hry*0.3)+' '+P(cx+hrx*0.7)+','+P(hcy-hry*0.42)+' '+P(cx+hrx*0.45)+','+P(hcy-hry*0.5)+
    ' C'+P(cx+hrx*0.05)+','+P(hcy-hry*0.42)+' '+P(cx-hrx*0.45)+','+P(hcy-hry*0.62)+' '+P(cx-hrx*0.7)+','+P(hcy-hry*0.3)+
    ' C'+P(cx-hrx*0.85)+','+P(hcy-hry*0.15)+' '+P(cx-hrx*0.9)+','+P(hcy)+' '+P(cx-hrx-0.8)+','+P(hcy+hry*0.1)+' Z';
  const hairHL='<path d="M'+P(cx-hrx*0.45)+','+P(hcy-hry*0.98)+' Q'+P(cx+hrx*0.1)+','+P(hcy-hry*1.12)+' '+P(cx+hrx*0.55)+','+P(hcy-hry*0.88)+'" fill="none" stroke="#4a5368" stroke-width="1.6" stroke-linecap="round"/>';
  /* 이중턱 곡선(살이 많을 때만) */
  const chin = f>0.45 ? '<path d="M'+P(cx-hrx*0.42)+','+P(hcy+hry*0.93)+' Q'+P(cx)+','+P(hcy+hry*(1.1+0.08*f))+' '+P(cx+hrx*0.42)+','+P(hcy+hry*0.93)+'" fill="none" stroke="'+skinD+'" stroke-width="1.5" stroke-linecap="round" opacity="'+P(Math.min(1,(f-0.45)*2.5))+'"/>' : '';
  /* 배 하이라이트·옆 그림자·당김 주름 */
  const belly = '<g clip-path="url(#'+id+'t)">'+
      '<ellipse cx="'+P(cx+B*1.12+3)+'" cy="'+P(yB)+'" rx="'+P(B*0.55+3)+'" ry="'+P(H*0.3)+'" fill="'+teeD+'" opacity=".26"/>'+
      (f>0.4?'<path d="M'+L(B*0.62)+','+P(yB-H*0.05)+' Q'+L(B*0.78)+','+P(yB+H*0.02)+' '+L(B*0.5)+','+P(yB+H*0.07)+'" fill="none" stroke="'+teeL+'" stroke-width="2.2" stroke-linecap="round" opacity="'+P(0.25+0.4*(f-0.4))+'"/>':'')+
      (f>0.5?'<path d="M'+L(B*0.78)+','+P(yB+H*0.03)+' q'+P(B*0.16)+','+P(H*0.012)+' '+P(B*0.3)+','+P(-H*0.004)+' M'+R(B*0.78)+','+P(yB+H*0.03)+' q'+P(-B*0.16)+','+P(H*0.012)+' '+P(-B*0.3)+','+P(-H*0.004)+'" fill="none" stroke="'+teeD+'" stroke-width="1.1" stroke-linecap="round" opacity=".45"/>':'')+
    '</g>';
  return '<svg class="'+(cls||'')+'" viewBox="0 0 120 240" preserveAspectRatio="xMidYMax meet" role="img" aria-label="체형 그림">'+
    '<defs><clipPath id="'+id+'t"><path d="'+teeP+'"/></clipPath><clipPath id="'+id+'p"><path d="'+shortsD+'"/></clipPath><radialGradient id="'+id+'g"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient></defs>'+
    '<ellipse cx="60" cy="'+P(G-1)+'" rx="'+P(30+16*f)+'" ry="5" fill="url(#'+id+'g)"/>'+
    legs(-1)+legs(1)+
    '<path d="'+shortsD+'" fill="'+shorts+'"/>'+
    '<g clip-path="url(#'+id+'p)"><rect x="0" y="'+P(yTop)+'" width="120" height="'+P(yHem-yTop+H*0.026)+'" fill="'+band+'"/>'+
      '<ellipse cx="'+P(cx+Hp*1.1+2)+'" cy="'+P(ySb)+'" rx="'+P(Hp*0.5)+'" ry="'+P(H*0.2)+'" fill="#000" opacity=".16"/></g>'+
    arms(-1)+arms(1)+
    '<path d="'+teeP+'" fill="'+tee+'"/>'+belly+
    '<path d="M'+L(Hp*0.97)+','+P(yHem-1.4)+' C'+L(Hp*0.68)+','+P(yHem+sag*0.9-1.4)+' '+R(Hp*0.68)+','+P(yHem+sag*0.9-1.4)+' '+R(Hp*0.97)+','+P(yHem-1.4)+'" fill="none" stroke="'+teeD+'" stroke-width="1.4" opacity=".5"/>'+
    '<path d="M'+L(nk+1.4)+','+P(yN-0.6)+' Q'+P(cx)+','+P(yN+H*0.03)+' '+R(nk+1.4)+','+P(yN-0.6)+'" fill="'+skinD+'" stroke="'+teeD+'" stroke-width="2"/>'+
    '<path d="M'+P(cx-nk)+','+P(hcy+hry*0.4)+' L'+P(cx-nk)+','+P(yN+1)+' Q'+P(cx)+','+P(yN+3)+' '+P(cx+nk)+','+P(yN+1)+' L'+P(cx+nk)+','+P(hcy+hry*0.4)+' Z" fill="'+skinD+'"/>'+
    '<ellipse cx="'+P(cx-hrx+0.2)+'" cy="'+P(hcy+hry*0.06)+'" rx="'+P(hrx*0.17)+'" ry="'+P(hry*0.2)+'" fill="'+skinD+'"/>'+
    '<ellipse cx="'+P(cx+hrx-0.2)+'" cy="'+P(hcy+hry*0.06)+'" rx="'+P(hrx*0.17)+'" ry="'+P(hry*0.2)+'" fill="'+skinD+'"/>'+
    '<path d="'+headD+'" fill="'+skin+'"/>'+chin+
    '<path d="'+hairD+'" fill="'+hair+'"/>'+hairHL+
    shoe(-1)+shoe(1)+
    '</svg>';
}

function bodySVG(r,color,cls,bgc){ return bodySVG_A2(r,color,cls); }
  root.Inbody = root.Inbody || {};
  root.Inbody.bodySVG = bodySVG;
  root.Inbody.bodyShape = bodyShape;
})(typeof globalThis !== "undefined" ? globalThis : this);
