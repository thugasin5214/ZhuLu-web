// 生成规则测试报告（HTML）。Node（tests/rules.js）和网页调参器（tuner.html）共用。
// page(data,{fragment}) 出整页或页面片段；body(data,{embed}) 只出正文，调参器嵌进自己的页面。
// data：{RES 本次结果, BASE 默认参数的结果（可无，有则逐项对比）, CP, RT, over 覆盖的参数（可无）, date}
(function(root){
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const GROUPS=[
 ['地势','meleeMult · rangedMult · rangeOf · rangeTo · stepUnit','高地对近战、射击、射程、目力与行军的影响。'],
 ['战马','stepUnit（战马折损）· meleeMult（冲锋）· CT 相克表','骑兵穿越险地的折损、折损对接战的影响、冲锋与兵种相克。'],
 ['渡河行军','SPD 地形速度 · spdF · stepUnit · meleeMult · upkeep（体力）','浅滩、各类地形的行军速度，半渡而击，长途行军与急行的体力消耗。'],
 ['镇守','meleeMult · rangedMult · upkeep（隐身、体力）· order · fight','镇守、深沟高垒、设伏的攻守加成。'],
 ['阵形侧背','FM · FMC · meleeMult（侧背）· frontage（隘口）','四阵攻守、阵形相克、侧背受击、隘口接战人数。'],
 ['天时','rangedMult · rangeOf · visionOf · spdF','雨、雾、夜对射击、射程、目力的影响。'],
 ['均势','fight · meleeMult','平衡观察：同兵种对攻的先手优势、兵种相克的实战效果。只记录数字，不判对错。']];
const CSS=`
/* 版式：单栏长卷，左侧窄栏放编号与状态，右侧正文；附录数值表可横向滚动 */
:root{
 --paper:#ebe5d4;--sheet:#f4f0e4;--ink:#1f1d1a;--wash:#6b665b;--rule:rgba(31,29,26,.16);
 --zhu:#a8261d;--zhu-soft:rgba(168,38,29,.1);--qing:#2e5068;--qing-soft:rgba(46,80,104,.1);--zhe:#8a6338;
 --display:"Ma Shan Zheng","STKaiti","KaiTi",serif;--body:"Noto Serif SC","Songti SC","SimSun",serif;--mono:"IBM Plex Mono",ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){
 --paper:#1a1b1d;--sheet:#232427;--ink:#e4ddcb;--wash:#a29d90;--rule:rgba(228,221,203,.16);
 --zhu:#e0604f;--zhu-soft:rgba(224,96,79,.14);--qing:#8db3cc;--qing-soft:rgba(141,179,204,.13);--zhe:#c9a06d;color-scheme:dark}}
:root[data-theme="dark"]{
 --paper:#1a1b1d;--sheet:#232427;--ink:#e4ddcb;--wash:#a29d90;--rule:rgba(228,221,203,.16);
 --zhu:#e0604f;--zhu-soft:rgba(224,96,79,.14);--qing:#8db3cc;--qing-soft:rgba(141,179,204,.13);--zhe:#c9a06d;color-scheme:dark}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.75;
 padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:2.5rem 4rem}
.wrap{max-width:62rem;margin:0 auto;display:grid;gap:2.5rem}
h1,h2,h3{text-wrap:balance;margin:0;font-weight:400}
h1{font-family:var(--display);font-size:clamp(2.4rem,6vw,3.6rem);line-height:1.1}
h2{font-family:var(--display);font-size:1.9rem;line-height:1.2}
h3{font-size:1.05rem;font-weight:600;line-height:1.45}
p{margin:0}
code,.mono{font-family:var(--mono);font-size:.86em}
.num{font-variant-numeric:tabular-nums}
header.top{display:grid;gap:1rem}
.lede{color:var(--wash);max-width:44rem}
.tally{display:flex;flex-wrap:wrap;gap:.6rem 1.6rem;align-items:baseline}
.tally .big{font-family:var(--mono);font-size:2.2rem;line-height:1;font-variant-numeric:tabular-nums}
.tally .lbl{color:var(--wash);font-size:.85rem;letter-spacing:.06em}
.chips{display:flex;flex-wrap:wrap;gap:.45rem}
.chip{display:inline-flex;gap:.4rem;align-items:center;border:1px solid var(--rule);border-radius:2px;padding:.1rem .6rem;font-size:.85rem;color:var(--ink);text-decoration:none;background:var(--sheet)}
.chip:hover{border-color:var(--wash)}.chip:focus-visible{outline:2px solid var(--zhu);outline-offset:2px}
.chip b{font-family:var(--mono);font-weight:500;font-variant-numeric:tabular-nums}
.chip.bad b{color:var(--zhu)}
.howto{font-size:.88rem;color:var(--wash)}
.howto code{background:var(--sheet);border:1px solid var(--rule);padding:.05rem .35rem;color:var(--ink)}
.finding{background:var(--zhu-soft);border-left:3px solid var(--zhu);padding:1rem 1.2rem;display:grid;gap:.5rem}
.finding h2{font-size:1.5rem;color:var(--zhu)}
.finding a{color:var(--zhu)}
section.grp{display:grid;gap:1.2rem}
.grp-hd{display:grid;gap:.25rem;border-bottom:1px solid var(--ink);padding-bottom:.6rem}
.grp-hd p{color:var(--wash);font-size:.9rem}
.grp-hd .fn{font-family:var(--mono);font-size:.78rem;color:var(--zhe)}
article.t{display:grid;grid-template-columns:5.2rem minmax(0,1fr);gap:.2rem 1.2rem;padding-block:.9rem;border-bottom:1px solid var(--rule)}
article.t .side{display:grid;gap:.35rem;align-content:start}
.id{font-family:var(--mono);font-size:.95rem;color:var(--wash)}
.pill{display:inline-block;justify-self:start;font-size:.75rem;letter-spacing:.08em;padding:.05rem .45rem;border-radius:2px;border:1px solid currentColor}
.pill.ok{color:var(--qing);background:var(--qing-soft)}
.pill.no{color:var(--zhu);background:var(--zhu-soft)}
.pill.find{color:var(--zhu);background:var(--zhu-soft)}
.kind{font-size:.75rem;color:var(--wash)}
.body{display:grid;gap:.5rem;min-width:0}
dl{display:grid;grid-template-columns:3.2em minmax(0,1fr);gap:.25rem .9rem;margin:0}
dt{color:var(--wash);font-size:.85rem;padding-top:.12rem}
dd{margin:0;min-width:0}
dd.meas{font-variant-numeric:tabular-nums}
.tbl{overflow-x:auto;margin-top:.2rem}
table{border-collapse:collapse;font-size:.88rem;font-variant-numeric:tabular-nums;min-width:22rem}
th,td{text-align:left;padding:.3rem .8rem .3rem 0;border-bottom:1px solid var(--rule);white-space:nowrap}
th{font-weight:600;color:var(--wash);font-size:.8rem;letter-spacing:.04em}
td.y{color:var(--qing)}td.n{color:var(--zhu);font-weight:600}
.appx{display:grid;gap:1.6rem}
.appx .tblock{display:grid;gap:.4rem}
.appx h3 small{font-weight:400;color:var(--wash);margin-left:.5em}
.pill.obs{color:var(--zhe);background:transparent}
.pill.chg{color:var(--zhe);border-style:dashed}
.kpi td.d{font-family:var(--mono);font-size:.82rem}
.kpi td.up{color:var(--qing)}.kpi td.dn{color:var(--zhu)}.kpi td.same{color:var(--wash)}
.kpi tr.moved td:first-child{font-weight:600}
.delta{display:grid;gap:.6rem;background:var(--sheet);border:1px solid var(--rule);padding:1rem 1.2rem}
.delta h2{font-size:1.5rem}
.delta ul{margin:0;padding-left:1.2rem;display:grid;gap:.2rem}
.over{font-family:var(--mono);font-size:.8rem;color:var(--zhe);overflow-wrap:anywhere}
footer{color:var(--wash);font-size:.85rem;border-top:1px solid var(--rule);padding-top:1rem;display:grid;gap:.4rem}
@media (max-width:560px){article.t{grid-template-columns:1fr}article.t .side{grid-auto-flow:column;justify-content:start;align-items:center;gap:.6rem}dl{grid-template-columns:1fr}dt{padding-top:.4rem}}
`;
function cell(v){const s=String(v);return s==='✓'?'<td class="y">✓</td>':s==='✗'?'<td class="n">✗</td>':'<td>'+esc(s)+'</td>';}
function table(t){return '<div class="tbl"><table><thead><tr>'+t.head.map(h=>'<th>'+esc(h)+'</th>').join('')+'</tr></thead><tbody>'+t.rows.map(r=>'<tr>'+r.map(cell).join('')+'</tr>').join('')+'</tbody></table></div>';}
const fmtN=(v,d)=>v==null||isNaN(v)?'—':Number(v).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
// 一项测试的关键数字：默认 / 当前 / 变化
function kpiTable(r,b){if(!r.kpi||!r.kpi.length)return'';const bk={};for(const k of(b&&b.kpi)||[])bk[k[0]]=k[1];
 return '<div class="tbl kpi"><table><thead><tr><th>关键数字</th><th>默认参数</th><th>当前参数</th><th>变化</th></tr></thead><tbody>'+r.kpi.map(([n,v,d])=>{const o=bk[n];
  const diff=o==null?null:v-o,rel=o?diff/Math.abs(o):diff?Infinity:0,moved=diff!=null&&Math.abs(diff)>Math.pow(10,-d)/2;
  const cls=!moved?'same':diff>0?'up':'dn',txt=!moved?'—':(diff>0?'+':'')+fmtN(diff,d)+(isFinite(rel)&&o?'（'+(rel>0?'+':'')+Math.round(rel*100)+'%）':'');
  return '<tr'+(moved?' class="moved"':'')+'><td>'+esc(n)+'</td><td>'+fmtN(o,d)+'</td><td>'+fmtN(v,d)+'</td><td class="d '+cls+'">'+esc(txt)+'</td></tr>';}).join('')+'</tbody></table></div>';}
// 覆盖参数的扁平列表：a.b.c = v
function flat(o,p='',out=[]){for(const k in o){const v=o[k],q=p?p+'.'+k:k;if(v&&typeof v==='object'&&!Array.isArray(v))flat(v,q,out);else out.push([q,v]);}return out;}
function body({RES,BASE,CP,RT,over,date},opt={}){
 const pass=RES.filter(r=>r.pass).length,finds=RES.filter(r=>!r.pass),bmap={};for(const b of BASE||[])bmap[b.id]=b;
 const kind=r=>r.observe?'观察':/^模拟/.test(r.name)?'模拟':r.finding?'发现':'公式';
 const art=r=>{const b=bmap[r.id];
  const st=r.observe?'<span class="pill obs">观察</span>':r.pass?'<span class="pill ok">通过</span>':r.finding?'<span class="pill find">问题</span>':'<span class="pill no">未通过</span>';
  const chg=b&&b.pass!==r.pass?'<span class="pill chg">'+(b.pass?'由通过变为未通过':'由未通过变为通过')+'</span>':'';
  return '<article class="t" id="'+esc(r.id)+'"><div class="side"><span class="id">'+esc(r.id)+'</span>'+st+chg+'<span class="kind">'+kind(r)+'</span></div><div class="body"><h3>'+esc(r.name.replace(/^(模拟|发现)：/,''))+'</h3><dl>'+
   '<dt>规则</dt><dd>'+esc(r.rule)+'</dd><dt>预期</dt><dd>'+esc(r.expect)+'</dd><dt>实测</dt><dd class="meas">'+esc(r.measured)+'</dd></dl>'+(r.table?table(r.table):'')+(BASE?kpiTable(r,b):'')+'</div></article>';};
 const groups=GROUPS.map(([g,fn,desc])=>{const list=RES.filter(r=>r.group===g);if(!list.length)return'';const ok=list.filter(r=>r.pass).length;
  return '<section class="grp" id="g-'+esc(g)+'"><div class="grp-hd"><h2>'+esc(g)+'</h2><p>'+esc(desc)+'　'+ok+' / '+list.length+' 通过</p><p class="fn">'+esc(fn)+'</p></div>'+list.map(art).join('')+'</section>';}).join('');
 const chips=GROUPS.map(([g])=>{const l=RES.filter(r=>r.group===g);if(!l.length)return'';const ok=l.filter(r=>r.pass).length;return '<a class="chip'+(ok<l.length?' bad':'')+'" href="#g-'+esc(g)+'">'+esc(g)+' <b>'+ok+'/'+l.length+'</b></a>';}).join('');
 // 附录：当前参数下的基础数值表
 const UT=CP.UT,ks=['ji','dun','nu','qi','liang'];
 const ut={head:['兵种','速度（步/息）','攻','防','射程'],rows:ks.map(k=>[RT.UT_ZH[k]||UT[k].name,UT[k].spd,UT[k].atk,UT[k].def,UT[k].range||'—'])};
 const cs=RT.RU.cavSpeed,cav={1:cs.hill,2:cs.forest,10:cs.marsh};
 const T=[0,1,2,4,5,9,10,12],sp={head:['地形','步卒速度','骑兵速度'],rows:T.map(i=>[RT.TNAME_ZH[i],'×'+RT.SPD[i],'×'+(cav[i]??RT.SPD[i])])};
 const F=['fang','feng','yuan','yan'],fm={head:['阵形','攻','守','速','箭矢','射程','侧背'],rows:F.map(k=>{const f=RT.FM[k];return[f.name,f.atk,f.def,f.spd,f.shot||1,f.rng||1,f.noflank?'不惧':'—'];})};
 const C=['ji','dun','nu','qi'],ct={head:['攻＼守'].concat(C.map(k=>RT.UT_ZH[k])),rows:C.map(a=>[RT.UT_ZH[a]].concat(C.map(b=>'×'+(CP.CT[a][b]??1))))};
 const appx='<section class="appx grp" id="appendix"><div class="grp-hd"><h2>附录：基础数值</h2><p>直接读自引擎当前参数（src/rules.json'+(over?' 加上覆盖值':'')+'）。</p></div>'+
  [['兵种','units',ut],['地形速度','terrainSpeed · cavSpeed',sp],['阵形','formations',fm],['兵种相克','counters',ct]].map(([n,c,t])=>'<div class="tblock"><h3>'+n+'<small class="mono">'+c+'</small></h3>'+table(t)+'</div>').join('')+'</section>';
 const finding=finds.length?'<aside class="finding" aria-label="需要处理的问题"><h2>需要处理的问题</h2>'+finds.map(r=>'<p><a class="mono" href="#'+esc(r.id)+'">'+esc(r.id)+'</a>　'+esc(r.name.replace(/^(模拟|发现)：/,''))+'：'+esc(r.finding?r.rule:r.expect+'。实测：'+r.measured)+'</p>').join('')+'</aside>':'';
 // 与默认参数对比：通过状态变了的测试、变化最大的关键数字
 let delta='';
 if(BASE){const flips=RES.filter(r=>bmap[r.id]&&bmap[r.id].pass!==r.pass),moves=[];
  for(const r of RES){const b=bmap[r.id];if(!b)continue;const bk={};for(const k of b.kpi||[])bk[k[0]]=k[1];
   for(const[n,v,d]of r.kpi||[]){const o=bk[n];if(o==null)continue;const diff=v-o;if(Math.abs(diff)<=Math.pow(10,-d)/2)continue;moves.push({id:r.id,n,o,v,d,rel:o?Math.abs(diff/o):1});}}
  moves.sort((a,b)=>b.rel-a.rel);
  delta='<section class="delta" aria-label="与默认参数对比"><h2>与默认参数对比</h2>'+(over?'<p class="over">'+flat(over).map(([k,v])=>esc(k)+' = '+esc(JSON.stringify(v))).join('　')+'</p>':'')+
   (flips.length?'<p>通过状态变了：'+flips.map(r=>'<a class="mono" href="#'+esc(r.id)+'">'+esc(r.id)+'</a> '+(r.pass?'变为通过':'变为未通过')).join('，')+'</p>':'<p>各项测试的通过状态都没变。</p>')+
   (moves.length?'<p>变化最大的关键数字：</p><ul>'+moves.slice(0,8).map(m=>'<li><a class="mono" href="#'+esc(m.id)+'">'+esc(m.id)+'</a> '+esc(m.n)+'：'+fmtN(m.o,m.d)+' → '+fmtN(m.v,m.d)+'</li>').join('')+'</ul>':'<p>关键数字都没变。</p>')+'</section>';}
 const tally='<div class="tally"><span><span class="big">'+pass+' / '+RES.length+'</span> <span class="lbl">项通过</span></span>'+(finds.length?'<span><span class="big" style="color:var(--zhu)">'+finds.length+'</span> <span class="lbl">项待处理</span></span>':'')+(date?'<span class="lbl">'+esc(date)+' 生成</span>':'')+'</div>'+
  '<nav class="chips" aria-label="按类别跳转">'+chips+'<a class="chip" href="#appendix">附录 数值表</a></nav>';
 if(opt.embed)return '<div class="wrap">'+tally+delta+finding+groups+appx+'</div>';
 return '<div class="wrap"><header class="top"><h1>逐鹿兵制校验</h1><p class="lede">把战斗、行军、地势、战马、镇守等规则写成数字测试，在可控地形上真跑引擎，核对每条规则的系数与实际效果。调整规则后重跑，看哪些数字变了。</p>'+tally+
  '<p class="howto">重跑：<code>node tests/rules.js</code>（试一组参数：<code>--rules 改动.json</code>），会重写本页 <code>docs/rules-report.html</code>；也可以打开网页调参器 <code>tuner.html</code> 边调边跑。“公式”测试核对每条规则是否按当前参数生效；“模拟”测试在程序生成的地形上摆好军阵、关掉 AI 真跑引擎，固定随机种子、多次取平均，结果可复现；“观察”只记录数字，供平衡参考。</p></header>'+
  delta+finding+groups+appx+'<footer><p>人数单位为“人”，时间单位为“息”（游戏秒），距离单位为“步”（一格 40 步）。交换比 = 攻方折损 ÷ 守方折损。模拟默认难度：敌军兵力、战力 100%。</p><p>参数：<span class="mono">src/rules.json</span> · 测试：<span class="mono">tests/rules-suite.js</span> · 报告：<span class="mono">tests/rules-report-template.js</span></p></footer></div>';}
const FONTS='<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;600&display=swap" rel="stylesheet">';
function page(data,opt={}){
 const head='<title>逐鹿兵制校验</title><meta name="claude:viewport-fit-sides" content="cover">'+FONTS+'<style>'+CSS+'</style>';
 if(opt.fragment)return head+body(data);
 return '<!doctype html>\n<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">'+head+'</head><body>'+body(data)+'</body></html>\n';}
const api={page,body,CSS,FONTS,esc};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.rulesReport=api;
})(typeof window!=='undefined'?window:this);
