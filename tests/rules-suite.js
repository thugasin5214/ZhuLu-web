// 规则数值测试集：Node（tests/rules.js）和网页调参器（tuner.html）共用。不依赖 Node 或 DOM。
// rulesSuite(CP) 返回 {tests, runOne(t)}；每项测试返回
//   {rule, expect, measured, pass, table?, finding?, kpi:[[名称, 数值, 小数位]]}
// kpi 是这项测试的关键数字，调参器拿它和默认参数的结果逐项对比。
// 两类测试：
//   公式：直接调用引擎的倍率函数，核对每条规则是否按当前参数（RT.RU）生效；
//   模拟：在程序生成的地形上摆好军阵、关掉 AI 真跑引擎，量伤亡、用时、折损，看规则的实际效果是否合乎设计意图。
// 模拟用固定随机种子，多次取平均，结果可复现。
(function(root){
function rulesSuite(CP){
const RT=CP.RT,TS=40,PI=Math.PI;
const realRandom=Math.random;
const seeded=a=>()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
const R=()=>RT.RU;

/* ---------------- 场景工具 ---------------- */
// 地图：f(x,y) 返回地形字符。. 平地 ^ 山丘 f 林地 ~ 河流 = 浅滩 - 道路 % 沮泽 A 绝壁
const MAP=f=>{const r=[];for(let y=0;y<38;y++){let s='';for(let x=0;x<60;x++)s+=f(x,y)||'.';r.push(s);}return r;};
const FLAT=MAP(()=>'.');
let G=null;
function field(rows,o={}){
 const L={id:'rt',name:'rt',seed:3,hour0:o.hour0===undefined?5:o.hour0,hourLen:o.hourLen||5000,face:{1:0,2:PI},cam:[30,19],rows:rows||FLAT,units:[],lose:[],win:[{type:'time',t:1e9}],
  weather:o.weather||{type:'sun',wind:0,str:1}};
 CP.newGame(CP.mkMission(L));G=CP.G;G.paused=false;return G;}
function place(side,type,n,x,y,o={}){const u=RT.spawn(side,type,n,x,y,{});u.thinkT=1e9;
 for(const k in o)u[k]=o[k];if(o.x!==undefined)u.x=o.x;return u;}
function attack(a,b){a.target=b;a.ordered=true;a.state='idle';a.hold=false;}
function moveTo(u,tx,ty){u.path=RT.findPath(u,(tx+.5)*TS,(ty+.5)*TS);u.state='move';u.target=null;}
function run(T,stop,dt=.05){const n=Math.round(T/dt);for(let i=0;i<n;i++){CP.update(dt);if(stop&&stop())return G.t;}return G.t;}
const broken=u=>!u.alive||u.state==='rout';
const avg=a=>a.reduce((s,x)=>s+x,0)/a.length;
const pct=x=>(x*100).toFixed(1)+'%';
const f1=x=>Number(x).toFixed(1),f2=x=>Number(x).toFixed(2),f0=x=>Math.round(x).toLocaleString('en-US');
const pc=x=>Math.round(x*1000)/10+'%';
// 重复跑 k 次（不同随机种子）取平均
function rep(k,fn){const out=[];try{for(let s=1;s<=k;s++){Math.random=seeded(s*7919);out.push(fn(s));}}finally{Math.random=realRandom;}return out;}

// 一对一接战：A 主动进攻，B 原地迎战（不追不退）。到有一方溃散或阵亡为止。
function duel(spec,T=240){
 field(spec.rows,spec.field);
 const A=place(1,spec.a.type,spec.a.n||3000,spec.a.x??22,spec.a.y??19,spec.a.o||{});
 const B=place(2,spec.b.type,spec.b.n||3000,spec.b.x??27,spec.b.y??19,spec.b.o||{});
 attack(A,B);B.target=null;B.ordered=false;
 const a0=A.n,b0=B.n;
 const t=run(T,()=>broken(A)||broken(B));
 return{t,aLoss:a0-A.n,bLoss:b0-B.n,win:broken(B)&&!broken(A)?'A':broken(A)&&!broken(B)?'B':A.n/a0>=B.n/b0?'A?':'B?'};}
function duelAvg(spec,k=5){const r=rep(k,()=>duel(spec));
 return{t:avg(r.map(x=>x.t)),aLoss:avg(r.map(x=>x.aLoss)),bLoss:avg(r.map(x=>x.bLoss)),aWins:r.filter(x=>x.win[0]==='A').length,k};}
const ex=d=>d.aLoss/Math.max(1,d.bLoss);   // 交换比：攻方折损 ÷ 守方折损

// 只算倍率：两支军阵摆在指定格子，不跑时间
function pair(o){field(o.rows);const a=place(1,o.a||'ji',o.an||3000,o.ax??20,o.ay??19,o.ao||{}),b=place(2,o.b||'ji',o.bn||3000,o.bx??21,o.by??19,o.bo||{});
 if(o.elevA!==undefined)G.elev[(a.y/TS|0)*60+(a.x/TS|0)]=o.elevA;if(o.elevB!==undefined)G.elev[(b.y/TS|0)*60+(b.x/TS|0)]=o.elevB;
 b.face=o.bFace??PI;a.face=0;if(o.prep)o.prep(a,b);return{a,b};}
const M=o=>{const{a,b}=pair(o);return RT.meleeMult(a,b);};
const Rg=o=>{const{a,b}=pair(o);return RT.rangedMult(a,b);};

const near=(x,y,tol=.005)=>Math.abs(x-y)<=tol*Math.max(1,Math.abs(y));
const ratioRows=(list,fmt=f2)=>list.map(([k,exp,got])=>[k,fmt(exp),fmt(got),near(got,exp)?'✓':'✗']);
// 倍率型测试的通用返回
const ratioTest=(rule,rows,tol)=>({rule,expect:'见表（预期值按当前参数算出）',measured:rows.map(r=>r[0]+' ×'+f2(r[2])).join('，'),
 pass:rows.every(r=>near(r[2],r[1],tol)),table:{head:['情形','预期','实测','对'],rows:ratioRows(rows)},kpi:rows.map(r=>[r[0],r[2],2])});

const tests=[];
const test=(group,id,name,fn)=>tests.push({group,id,name,fn});

/* ================= 一、地势 ================= */
const HILL=MAP((x,y)=>x>=14&&x<=24&&y>=13&&y<=25?'^':'');   // 11×13 山丘，中心地势 3
const BROW=MAP((x,y)=>x>=10&&x<=20&&y>=13&&y<=25?'^':'');   // 山丘东缘：x=18 地势 3，x≥21 为平地
test('地势','E1','近战：居高临下的倍率',()=>{
 const E=R().elevation,base=M({}),rows=[];
 for(const d of[1,2,3,-1,-2,-3]){const m=d>0?M({elevA:d}):M({elevB:-d});const k=Math.min(Math.abs(d),E.maxLv);rows.push(['高差 '+(d>0?'+':'')+d,d>0?1+E.meleeUp*k:1-E.meleeDown*k,m/base]);}
 return ratioTest('攻方每高一级近战杀伤 +'+pc(E.meleeUp)+'（至多 '+E.maxLv+' 级）；每低一级 −'+pc(E.meleeDown)+'。',rows);});
test('地势','E2','射击：居高射远、射得狠',()=>{
 const E=R().elevation,base=Rg({a:'nu'}),rows=[];for(const d of[1,2,3])rows.push(['杀伤 高差 +'+d,1+E.shot*d,Rg({a:'nu',elevA:d})/base]);
 rows.push(['杀伤 高差 −2',1-E.shot*Math.min(2,E.maxLv),Rg({a:'nu',elevB:2})/base]);
 const {a:a0}=pair({a:'nu'}),r0=RT.rangeOf(a0);
 for(const d of[1,2,3]){const{a}=pair({a:'nu',elevA:d});rows.push(['射程 地势 '+d,1+E.range*d,RT.rangeOf(a)/r0]);}
 {const{a:a2,b:b2}=pair({a:'nu'}),flatR=RT.rangeTo(a2,b2);const{a,b}=pair({a:'nu',elevB:3});rows.push(['仰射地势 3 的目标（射程）',1-E.rangeTarget*Math.min(3,E.maxLv),RT.rangeTo(a,b)/flatR]);}
 const r=ratioTest('弩手每高一级：杀伤 +'+pc(E.shot)+'、射程 +'+pc(E.range)+'；目标每高一级射程 −'+pc(E.rangeTarget)+'。平地基础射程 '+r0+' 步。',rows);
 r.kpi.unshift(['平地射程（步）',r0,0]);return r;});
test('地势','E3','模拟：山顶弩手对平地步卒',()=>{
 const shoot=(onHill,dist)=>{const r=rep(3,()=>{field(onHill?BROW:FLAT);const a=place(1,'nu',3000,18,19,{hold:true});const b=place(2,'ji',3000,18+dist,19);a.target=b;a.ordered=true;
  const b0=b.n;run(60);return b0-b.n;});return avg(r);};
 const flat=shoot(false,4),hill=shoot(true,4),far=shoot(false,6.5),farH=shoot(true,6.5);
 return{rule:'弩手站山顶（地势 3）对 4 格外平地戟兵连射 60 息，与同距离平地对射比较；再看 6.5 格（260 步）处，平地与山顶各能否射到。',
  expect:'山顶杀伤明显更高（> ×1.15）；6.5 格处只有山顶射得到',measured:'4 格：平地 '+f0(flat)+'，山顶 '+f0(hill)+'（×'+f2(hill/flat)+'）；6.5 格：平地 '+f0(far)+'，山顶 '+f0(farH),
  pass:hill/flat>1.15&&far===0&&farH>0,kpi:[['4 格 平地杀伤',flat,0],['4 格 山顶杀伤',hill,0],['山顶 ÷ 平地',hill/flat,2],['6.5 格 平地杀伤',far,0],['6.5 格 山顶杀伤',farH,0]]};});
test('地势','E4','模拟：仰攻山顶守军',()=>{
 const flat=duelAvg({a:{type:'ji',x:12},b:{type:'ji',x:19}});
 const up=duelAvg({rows:HILL,a:{type:'ji',x:12},b:{type:'ji',x:19}});
 return{rule:'戟兵 3000 进攻原地迎战的戟兵 3000：一次在平地，一次守军站山顶（地势 3）。',expect:'仰攻方交换比更差、胜率更低',
  measured:'平地：攻方折损 '+f0(flat.aLoss)+'、守方 '+f0(flat.bLoss)+'、攻方胜 '+flat.aWins+'/'+flat.k+'；仰攻：攻方折损 '+f0(up.aLoss)+'、守方 '+f0(up.bLoss)+'、攻方胜 '+up.aWins+'/'+up.k,
  pass:ex(up)>ex(flat)&&up.aWins<=flat.aWins,kpi:[['平地 攻方胜场',flat.aWins,0],['仰攻 攻方胜场',up.aWins,0],['平地 交换比',ex(flat),2],['仰攻 交换比',ex(up),2]]};});
test('地势','E5','模拟：上坡行军',()=>{
 const rows=[],kpi=[];
 for(const[type,nm]of[['ji','戟兵'],['qi','骑兵']]){
  const go=map=>{field(map);const u=place(1,type,3000,12,19);moveTo(u,26,19);const t=run(120,()=>!u.path.length);return{t,loss:3000-u.n};};
  const a=go(FLAT),b=go(HILL);rows.push([nm,f1(a.t)+' 息',f1(b.t)+' 息','×'+f2(b.t/a.t),f0(b.loss)]);kpi.push([nm+' 翻山 ÷ 平地用时',b.t/a.t,2]);if(type==='qi')kpi.push(['骑兵翻山折损',b.loss,0]);}
 const E=R().elevation,cs=R().cavSpeed,ts=R().terrainSpeed;
 return{rule:'横穿 11 格宽的山丘（14 格路程）与平地比较。山丘地形速度 ×'+ts.hill+'（骑兵 ×'+cs.hill+'），上坡每步再 ×'+E.upSpeed+'、下坡 ×'+E.downSpeed+'；骑兵在地势 2 以上折损战马。',
  expect:'翻山明显更慢（> ×1.3）；骑兵慢得更多，且有战马折损',measured:rows.map(r=>r[0]+' '+r[3]).join('，'),
  pass:kpi[0][1]>1.3&&kpi[1][1]>kpi[0][1]&&kpi[2][1]>0,table:{head:['兵种','平地用时','翻山用时','慢了','战马折损'],rows},kpi};});

/* ================= 二、战马 ================= */
const BAND=ch=>MAP((x)=>x>=20&&x<=29?ch:'');                 // 10 格宽、贯通南北的地形带
const STEEP=MAP((x,y)=>x>=18&&x<=31?'^':'');                  // 14 格宽山脉：中间 10 格地势 2–3
test('战马','H1','模拟：骑兵穿越各种地形的战马折损',()=>{
 const rows=[],kpi=[];const cases=[['平地',FLAT,{}],['道路',BAND('-'),{}],['林地',BAND('f'),{}],['沮泽',BAND('%'),{}],['陡坡（山脉）',STEEP,{}],['雨中急行·平地',FLAT,{weather:{type:'rain',wind:0,str:1}},true],['林地·急行',BAND('f'),{},true]];
 for(const[nm,map,fo,fast]of cases){field(map,fo);const u=place(1,'qi',3000,16,19,{march:!!fast});moveTo(u,34,19);const t=run(200,()=>!u.path.length);const l=(3000-u.n)/3000;
  rows.push([nm,f1(t)+' 息',f0(3000-u.n),pct(l),f0(u.stam)]);kpi.push([nm+' 折损率 %',l*100,1]);}
 const g=k=>kpi[k][1],H=R().horse;
 return{rule:'骑兵行军每息折损：沮泽 '+H.marsh+'%、林地 '+H.forest+'%、地势 2 的坡 '+H.hill2+'%、地势 3 的坡 '+H.hill3+'%、雨中急行于平地 '+H.rainForce+'%；急行时 ×'+H.forceMul+'。平地、道路无折损。',
  expect:'平地、道路 0；沮泽 > 林地 > 0；陡坡、雨中急行 > 0；急行折损更重',measured:rows.map(r=>r[0]+' '+r[3]).join('，'),
  pass:g(0)===0&&g(1)===0&&g(3)>g(2)&&g(2)>0&&g(4)>0&&g(5)>0&&g(6)>g(2),table:{head:['路线（18 格）','用时','折损人数','折损率','剩余体力'],rows},kpi};});
test('战马','H2','模拟：折损过的骑兵冲击弩手',()=>{
 // 一路走平地，一路先穿林地；出林后再跑 5 格冲击弩手
 const S=map=>{const r=rep(3,()=>{field(map);const c=place(1,'qi',3000,16,19);const n=place(2,'nu',3000,35,19);attack(c,n);n.target=null;let c1=null,n1=null,tc=null;
  run(120,()=>{if(tc===null&&c.contact===n){tc=G.t;c1=c.n;n1=n.n;}return tc!==null&&(G.t-tc>15||broken(n));});return{pre:3000-(c1??c.n),dealt:(n1??n.n)-n.n};});
  return{pre:avg(r.map(x=>x.pre)),dealt:avg(r.map(x=>x.dealt))};};
 const a=S(FLAT),b=S(BAND('f'));
 return{rule:'同样 3000 骑，一队走平地，一队先穿 10 格林地；出林后跑 5 格冲击 3000 弩手，比较接战头 15 息的杀伤。折损让人数变少，杀伤随人数^'+R().combat.sizeExp+' 下降。',
  expect:'穿林的一队到阵前人数更少、杀伤更低',measured:'平地队：到阵前已折 '+f0(a.pre)+'，15 息杀伤 '+f0(a.dealt)+'；穿林队：已折 '+f0(b.pre)+'，杀伤 '+f0(b.dealt)+'（×'+f2(b.dealt/a.dealt)+'）',
  pass:b.pre>a.pre&&b.dealt<a.dealt,kpi:[['平地队 到阵前折损',a.pre,0],['穿林队 到阵前折损',b.pre,0],['平地队 15 息杀伤',a.dealt,0],['穿林队 15 息杀伤',b.dealt,0],['穿林 ÷ 平地 杀伤',b.dealt/a.dealt,2]]};});
test('战马','H3','冲锋：骑兵冲锋与戟兵拒马',()=>{
 const K=R().charge,E=R().elevation;
 const base=M({a:'qi',b:'nu'}),ch=M({a:'qi',b:'nu',ao:{chargeT:2}});
 const vsJi=M({a:'qi',b:'ji',ao:{chargeT:2}})/M({a:'qi',b:'ji'});
 const vsJiSide=M({a:'qi',b:'ji',ao:{chargeT:2},bFace:PI/2})/M({a:'qi',b:'ji',bFace:PI/2});
 const vsDug=M({a:'qi',b:'nu',ao:{chargeT:2},bo:{hold:true,holdT:R().hold.dugTime+2}})/M({a:'qi',b:'nu',bo:{hold:true,holdT:R().hold.dugTime+2}});
 const inf=M({a:'ji',b:'nu',ao:{chargeT:2}})/M({a:'ji',b:'nu'});
 const down=M({a:'ji',b:'ji',ao:{chargeT:2},elevA:1})/M({a:'ji',b:'ji',elevA:1})/K.inf;
 return ratioTest('跑动 '+K.run+' 息以上接敌即“冲锋” '+K.time+' 息：骑兵 ×'+K.cav+'、步卒 ×'+K.inf+'；居高冲下再 ×'+E.chargeDown+'，夜里再 ×'+K.night+'。骑兵正面冲非锋矢阵的戟兵无冲锋之利；冲深沟高垒无冲锋之利；雨天骑兵不能冲锋。',
  [['骑兵冲锋（对弩手）',K.cav,ch/base],['骑兵正面冲戟兵',1,vsJi],['骑兵从侧面冲戟兵',K.cav,vsJiSide],['冲锋撞上深沟高垒',1,vsDug],['步卒冲锋',K.inf,inf],['居高冲下另加（势）',E.chargeDown,down]]);});
test('战马','H4','相克：兵种克制倍率',()=>{
 const T=['ji','dun','nu','qi'],N={ji:'戟',dun:'盾',nu:'弩',qi:'骑'};
 const CTt=CP.CT,cell=(a,b)=>CTt[a][b]??1,P=R().counters,want=(a,b)=>(P[a]||{})[b]??1;
 const out=T.map(a=>['攻 '+N[a]].concat(T.map(b=>'×'+f2(cell(a,b)))));
 const u=R().units;
 return{rule:'近战杀伤 = '+R().combat.meleeBase+' ×（人数/1000）^'+R().combat.sizeExp+' × 攻/防 × 相克 × 阵形相克 × 地形… 每息。基础攻防：'+T.map(k=>N[k]+' '+u[k].atk+'/'+u[k].def).join('，')+'。',
  expect:'引擎里的相克表与参数一致',measured:'表中为攻方对守方的相克倍率（不含攻防基础值）',
  pass:T.every(a=>T.every(b=>cell(a,b)===want(a,b))),table:{head:['','守 戟','守 盾','守 弩','守 骑'],rows:out},kpi:[['戟克骑',cell('ji','qi'),2],['骑克弩',cell('qi','nu'),2],['盾克戟',cell('dun','ji'),2],['骑撞戟',cell('qi','ji'),2]]};});

/* ================= 三、渡河与行军 ================= */
const FORD=MAP(x=>x>=22&&x<=29?'=':'');
test('渡河行军','R1','模拟：各种地形的行军速度',()=>{
 const rows=[],kpi=[];for(const[nm,map]of[['平地',FLAT],['道路',BAND('-')],['浅滩（8 格）',FORD],['林地',BAND('f')],['沮泽',BAND('%')]]){
  for(const type of['ji','qi']){field(map);const u=place(1,type,3000,16,19);moveTo(u,34,19);const t=run(300,()=>!u.path.length);rows.push([nm,type==='ji'?'戟兵':'骑兵',f1(t)+' 息',f0(u.stam)]);kpi.push([nm+' '+(type==='ji'?'戟兵':'骑兵')+' 用时',t,1]);}}
 const t=i=>kpi[i][1],ts=R().terrainSpeed,cs=R().cavSpeed,u=R().units;
 return{rule:'地形速度：道路 ×'+ts.road+'、平地 '+ts.plain+'、林地 '+ts.forest+'（骑 '+cs.forest+'）、山丘 '+ts.hill+'（骑 '+cs.hill+'）、沮泽 '+ts.marsh+'（骑 '+cs.marsh+'）、浅滩 '+ts.ford+'。基础速度：戟 '+u.ji.spd+'、盾 '+u.dun.spd+'、弩 '+u.nu.spd+'、骑 '+u.qi.spd+' 步/息。',
  expect:'道路最快；浅滩明显慢（> ×1.3）；骑兵进林地后比平地慢',measured:'18 格路程（戟兵）：平地 '+f1(t(0))+' 息，道路 '+f1(t(2))+' 息，浅滩 '+f1(t(4))+' 息',
  pass:t(2)<t(0)&&t(4)>t(0)*1.3&&t(7)>t(1),table:{head:['路线（18 格）','兵种','用时','剩余体力'],rows},kpi};});
test('渡河行军','R2','半渡而击：倍率',()=>{
 const T=R().terrain;
 return ratioTest('目标在浅滩：近战受伤 ×'+T.fordTarget+'、中箭 ×'+T.fordShot+'；自己在浅滩里打人 ×'+T.fordAttacker+'。',
  [['打浅滩里的敌军（近战）',T.fordTarget,M({rows:FORD,ax:21,bx:22})/M({})],['自己站在浅滩里攻击',T.fordAttacker,M({rows:FORD,ax:22,bx:30})/M({})],['射浅滩里的敌军',T.fordShot,Rg({rows:FORD,a:'nu',ax:18,bx:23})/Rg({a:'nu',ax:18,bx:23})]]);});
test('渡河行军','R3','模拟：半渡而击',()=>{
 const plain=duelAvg({a:{type:'ji',x:22},b:{type:'ji',x:30}});
 const ford=duelAvg({rows:FORD,a:{type:'ji',x:22},b:{type:'ji',x:30}});
 return{rule:'戟兵 3000 涉过 8 格浅滩进攻岸上原地迎战的戟兵 3000，与平地同样对阵比较。',expect:'涉水方交换比比平地差一倍以上，胜率不高于平地',
  measured:'平地：攻方折损 '+f0(plain.aLoss)+' / 守方 '+f0(plain.bLoss)+'，攻方胜 '+plain.aWins+'/'+plain.k+'；涉水：攻方 '+f0(ford.aLoss)+' / 守方 '+f0(ford.bLoss)+'，攻方胜 '+ford.aWins+'/'+ford.k,
  pass:ex(ford)>2*ex(plain)&&ford.aWins<=plain.aWins,kpi:[['平地 攻方胜场',plain.aWins,0],['涉水 攻方胜场',ford.aWins,0],['平地 交换比',ex(plain),2],['涉水 交换比',ex(ford),2]]};});
test('渡河行军','R4','模拟：长途行军与急行的体力',()=>{
 const rows=[],kpi=[],C=R().combat,Mr=R().march;for(const fast of[false,true])for(const T of[30,60]){field(BAND('-'));const u=place(1,'ji',3000,1,19,{march:fast});moveTo(u,58,19);run(T);
  rows.push([fast?'急行':'常行',T+' 息',f1((u.x/TS)-1.5)+' 格',f0(u.stam),f2(C.stamMin+(1-C.stamMin)*u.stam/100)]);kpi.push([(fast?'急行':'常行')+T+' 息 走了（格）',(u.x/TS)-1.5,1],[(fast?'急行':'常行')+T+' 息 体力',u.stam,0]);}
 return{rule:'行军每息耗体力 '+Mr.stamMarch+'，急行 '+Mr.stamForce+'（速度 ×'+Mr.forceSpeed+'）；体力低于 5 自动停止急行，低于 '+Mr.tiredAt+' 速度 ×'+Mr.tiredSpeed+'。近战杀伤 ×('+C.stamMin+'+'+f2(1-C.stamMin)+'×体力/100)。',
  expect:'急行 30 息后体力 < 30；常行 30 息后体力 > 85',measured:rows.map(r=>r[0]+r[1]+' 体力 '+r[3]).join('，'),
  pass:+rows[2][3]<30&&+rows[0][3]>85,table:{head:['方式','时长','走了','剩余体力','近战系数'],rows},kpi};});
test('渡河行军','R5','模拟：疲兵对生力军',()=>{
 const fresh=duelAvg({a:{type:'ji'},b:{type:'ji'}});
 const tired=duelAvg({a:{type:'ji',o:{stam:20}},b:{type:'ji'}});
 const C=R().combat;
 return{rule:'攻方体力 20（急行后）对体力 100 的同等戟兵。疲兵杀伤 ×'+f2(C.stamMin+(1-C.stamMin)*.2)+'；双方体力差 '+C.restGap+' 以上，体力高的一方再 ×'+C.restBonus+'（以逸待劳）。',expect:'疲兵交换比差 1.5 倍以上，胜率不高于体力相当时',
  measured:'体力相当：攻方胜 '+fresh.aWins+'/'+fresh.k+'，折损 '+f0(fresh.aLoss)+' / '+f0(fresh.bLoss)+'；疲兵：攻方胜 '+tired.aWins+'/'+tired.k+'，折损 '+f0(tired.aLoss)+' / '+f0(tired.bLoss),
  pass:tired.aWins<=fresh.aWins&&ex(tired)>ex(fresh)*1.5,kpi:[['体力相当 攻方胜场',fresh.aWins,0],['疲兵 攻方胜场',tired.aWins,0],['体力相当 交换比',ex(fresh),2],['疲兵 交换比',ex(tired),2]]};});

/* ================= 四、镇守 ================= */
test('镇守','D1','镇守与深沟高垒：倍率',()=>{
 const H=R().hold,b0=M({}),r0=Rg({a:'nu'}),dt=H.dugTime;
 return ratioTest('镇守：原地不追，受近战 ×'+H.melee+'；满 '+dt+' 息成“深沟高垒”，受近战 ×'+H.dugMelee+'、中箭 ×'+H.dugShot+'，且对方冲锋无效。镇守时体力恢复 '+H.restHold+'/息（平时 '+H.rest+'/息）。',
  [['镇守（未满 '+dt+' 息）受近战',H.melee,M({bo:{hold:true,holdT:dt/4}})/b0],['深沟高垒（镇守 '+dt+' 息以上）受近战',H.dugMelee,M({bo:{hold:true,holdT:dt+2}})/b0],['深沟高垒中箭',H.dugShot,Rg({a:'nu',bo:{hold:true,holdT:dt+2}})/r0],['镇守未满 '+dt+' 息中箭',1,Rg({a:'nu',bo:{hold:true,holdT:dt/4}})/r0]]);});
test('镇守','D2','模拟：镇守与不镇守的守军',()=>{
 const no=duelAvg({a:{type:'ji'},b:{type:'ji'}});
 const hold=duelAvg({a:{type:'ji'},b:{type:'ji',o:{hold:true,holdT:R().hold.dugTime+2}}});
 return{rule:'戟兵 3000 进攻戟兵 3000：守军原地迎战（不镇守），或已深沟高垒。',expect:'攻深沟高垒，交换比差 1.3 倍以上，胜率不高于不镇守时',
  measured:'不镇守：攻方胜 '+no.aWins+'/'+no.k+'，折损 '+f0(no.aLoss)+' / '+f0(no.bLoss)+'；深沟高垒：攻方胜 '+hold.aWins+'/'+hold.k+'，折损 '+f0(hold.aLoss)+' / '+f0(hold.bLoss),
  pass:hold.aWins<=no.aWins&&ex(hold)>ex(no)*1.3,kpi:[['不镇守 攻方胜场',no.aWins,0],['深沟高垒 攻方胜场',hold.aWins,0],['不镇守 交换比',ex(no),2],['深沟高垒 交换比',ex(hold),2]]};});
test('镇守','D3','模拟：骑兵冲击镇守的弩手',()=>{
 const no=duelAvg({a:{type:'qi',x:14},b:{type:'nu',x:24}});
 const dug=duelAvg({a:{type:'qi',x:14},b:{type:'nu',x:24,o:{hold:true,holdT:R().hold.dugTime+2}}});
 return{rule:'骑兵 3000 从 10 格外冲击弩手 3000。弩手不镇守，或深沟高垒（冲锋无效、受伤 ×'+R().hold.dugMelee+'）。',expect:'深沟高垒的弩手撑得更久、骑兵折损更多',
  measured:'不镇守：弩手撑 '+f1(no.t)+' 息，骑兵折 '+f0(no.aLoss)+'；深沟高垒：撑 '+f1(dug.t)+' 息，骑兵折 '+f0(dug.aLoss),pass:dug.t>no.t&&dug.aLoss>no.aLoss,
  kpi:[['不镇守 弩手撑（息）',no.t,1],['深沟高垒 弩手撑（息）',dug.t,1],['不镇守 骑兵折损',no.aLoss,0],['深沟高垒 骑兵折损',dug.aLoss,0]]};});
const WOOD=MAP((x,y)=>x>=24&&x<=30&&y>=15&&y<=23?'f':'');
test('镇守','D4','模拟：林中设伏',()=>{
 // order：我军伏兵对看得见的敌军下令出击；walk：敌军行军路过、撞上林中的我军
 const H=R().hold,wait=H.hideTime+1;
 const sim=(hide,mode)=>avg(rep(3,()=>{field(WOOD);const b=place(1,'ji',3000,26,19,{hold:hide});run(wait);const a=place(2,'ji',3000,mode==='walk'?20:23,mode==='walk'?19.4:19);
  if(mode==='order'){run(.1);G.sel=[b];CP.order(a.x,a.y);G.sel=[];}else{moveTo(a,33,19);}
  let tc=null;run(30,()=>{if(tc===null&&(a.contact===b||b.contact===a))tc=G.t;return tc!==null&&G.t-tc>=8;});return 3000-a.n;}));
 const hidN=rep(3,()=>{field(WOOD);const b=place(1,'ji',3000,26,19,{hold:true});run(wait);return b.hidden?1:0;}).reduce((x,y)=>x+y,0);
 const o1=sim(true,'order'),o0=sim(false,'order'),w1=sim(true,'walk'),w0=sim(false,'walk');
 return{rule:'在林地（或地势 2 以上山丘）镇守 '+H.hideTime+' 息即成伏兵，敌不能察。伏兵下令出击：'+H.ambushOrderTime+' 息内近战 ×'+H.ambushMelee+'、射击 ×'+H.ambushShot+'；敌军撞上镇守中的伏兵：'+H.ambushTime+' 息内同样加成。',
  expect:'镇守后隐身；伏击接战头 8 息的杀伤是未设伏的 1.3 倍以上',
  measured:'隐身 '+hidN+'/3；伏兵出击 8 息杀伤 '+f0(o1)+'，未设伏 '+f0(o0)+'（×'+f2(o1/o0)+'）；敌军撞上伏兵 '+f0(w1)+'，撞上未设伏的军阵 '+f0(w0)+'（×'+f2(w1/w0)+'）',
  pass:hidN===3&&o1>o0*1.3&&w1>w0*1.3,kpi:[['伏兵出击 ÷ 未设伏',o1/o0,2],['撞上伏兵 ÷ 未设伏',w1/w0,2]]};});
test('镇守','D5','发现：敌军直扑伏兵时伏击加成失效',()=>{
 const r=rep(3,()=>{field(WOOD);const b=place(1,'ji',3000,26,19,{hold:true});run(R().hold.hideTime+1);const a=place(2,'ji',3000,20,19);attack(a,b);let amb=0;
  run(20,()=>{if(b.ambushT>0)amb=1;return false;});return amb;});
 const got=r.reduce((x,y)=>x+y,0);
 return{finding:true,rule:'敌军已锁定伏兵（例如走到 70 步内发觉后）直扑过来时：攻方移动后当帧即可出手，而伏兵的“接敌”要到下一帧才算，伏兵先挨一刀就现形，伏击加成从不生效。代码位置：update() 先算 contact、再 stepUnit 移动、fight 里攻方按移动后的距离出手。这是时序问题，调参数修不好。',
  expect:'伏兵仍应获得伏击加成（3/3）',measured:'获得伏击加成 '+got+'/3',pass:got===3,kpi:[['获得伏击加成（/3）',got,0]]};});

/* ================= 五、阵形、侧背、隘口 ================= */
test('阵形侧背','F1','阵形：攻守倍率与相克',()=>{
 const F=['fang','feng','yuan','yan'],N=RT.FM,P=R().formations,FC=R().formationCounters;const b0=M({});
 const got=(a,b)=>M({ao:{fm:a},bo:{fm:b}})/b0;
 const rows=F.map(a=>[N[a].name||a].concat(F.map(b=>'×'+f2(got(a,b)))));
 // 攻方阵形攻 × 守方阵形防的倒数 × 阵形相克；方阵对方阵为 1
 const exp=(a,b)=>P[a].atk/P.fang.atk*P.fang.def/P[b].def*((FC[a]||{})[b]||1)/((FC.fang||{}).fang||1);
 const ok=F.every(a=>F.every(b=>near(got(a,b),exp(a,b))));
 return{rule:F.map(k=>N[k].name+' 攻'+P[k].atk+' 守'+P[k].def+' 速'+P[k].spd+(P[k].shot?' 箭矢×'+P[k].shot:'')+(P[k].rng?' 射程×'+P[k].rng:'')).join('；')+'。圆阵不惧侧背。阵形相克：'+Object.keys(FC).flatMap(a=>Object.keys(FC[a]).map(b=>N[a].name+'打'+N[b].name+' ×'+FC[a][b])).join('、')+'。',
  expect:'表中为戟兵对戟兵、攻方阵形（行）打守方阵形（列）相对方阵对方阵的杀伤，与参数一致',measured:'锋矢打雁行 '+rows[1][4]+'，圆阵受锋矢 '+rows[1][3],
  pass:ok,table:{head:['攻＼守','方阵','锋矢阵','圆阵','雁行阵'],rows},kpi:[['锋矢打雁行',got('feng','yan'),2],['锋矢打圆阵',got('feng','yuan'),2],['方阵打锋矢',got('fang','feng'),2],['圆阵打方阵',got('yuan','fang'),2]]};});
test('阵形侧背','F2','侧背：倍率',()=>{
 const F=R().flank,b0=M({});
 return ratioTest('守方朝向与来敌方向夹角大于 1.35 弧度为侧、大于 2.2 弧度为背：杀伤 ×'+F.side+' / ×'+F.rear+'，士气打击 ×'+F.sideMorale+' / ×'+F.rearMorale+'。圆阵无侧背。三阵以上围攻一阵，士气打击再 ×'+F.massMorale+'。',
  [['击其侧（夹角 >77°）',F.side,M({bFace:PI/2})/b0],['击其背（夹角 >126°）',F.rear,M({bFace:0})/b0],['圆阵不惧侧背',1,M({bFace:0,bo:{fm:'yuan'}})/M({bo:{fm:'yuan'}})]]);});
test('阵形侧背','F3','模拟：正面牵制、绕后夹击',()=>{
 const sim=rear=>avg(rep(3,()=>{field();const e=place(2,'ji',4000,30,19);const a=place(1,'ji',3000,26,19);const b=place(1,'ji',3000,rear?34:26,rear?19:21);
  attack(a,e);attack(b,e);e.target=a;e.ordered=true;return run(200,()=>broken(e));}));
 const front=sim(false),rear=sim(true);
 return{rule:'两阵戟兵 3000 合击戟兵 4000：两阵都从正面上，或一阵正面、一阵从背后上。',expect:'从背后夹击，敌阵溃得快（用时 < 正面的 80%）',measured:'正面齐上 '+f1(front)+' 息溃，前后夹击 '+f1(rear)+' 息溃',pass:rear<front*.8,
  kpi:[['正面齐上 破敌（息）',front,1],['前后夹击 破敌（息）',rear,1]]};});
test('阵形侧背','F4','模拟：隘口以少胜多',()=>{
 const PASS=MAP((x,y)=>x>=26&&x<=32&&y!==19?'A':'');
 const sim=map=>{const r=rep(3,()=>{field(map);const big=place(1,'ji',9000,20,19);const small=place(2,'ji',3000,29,19,{hold:true,holdT:R().hold.dugTime+2});attack(big,small);const t=run(240,()=>broken(big)||broken(small));return{t,big:9000-big.n,small:3000-small.n,win:broken(small)?1:0};});
  return{t:avg(r.map(x=>x.t)),big:avg(r.map(x=>x.big)),small:avg(r.map(x=>x.small)),win:r.filter(x=>x.win).length};};
 const open=sim(FLAT),pass=sim(PASS);
 return{rule:'隘口（两侧绝壁、只容一格）每阵至多 '+RT.frontage(1)+' 人接战（两格宽 '+RT.frontage(2)+'）。戟兵 9000 攻深沟高垒的戟兵 3000。',
  expect:'开阔地大军轻胜；隘口里用时 1.5 倍以上、大军折损更多',measured:'开阔地：'+f1(open.t)+' 息破敌，大军折 '+f0(open.big)+'；隘口：大军胜 '+pass.win+'/3，'+f1(pass.t)+' 息，大军折 '+f0(pass.big)+'、守军折 '+f0(pass.small),
  pass:pass.t>open.t*1.5&&pass.big>open.big,kpi:[['开阔地 用时（息）',open.t,1],['隘口 用时（息）',pass.t,1],['开阔地 大军折损',open.big,0],['隘口 大军折损',pass.big,0],['隘口 大军胜场',pass.win,0]]};});

/* ================= 六、天时 ================= */
test('天时','W1','雨、雾、夜：倍率',()=>{
 const W=R().weather;
 const r0=Rg({a:'nu'}),{a:a0}=pair({a:'nu'}),rg0=RT.rangeOf(a0),v0=RT.visionOf(a0);
 field();RT.setWeather('rain',0,1);let a=place(1,'nu',3000,20,19),b=place(2,'ji',3000,21,19);const rain=RT.rangedMult(a,b)/r0;
 field();RT.setWeather('fog',0,1);a=place(1,'nu',3000,20,19);const fogR=RT.rangeOf(a)/rg0,fogV=RT.visionOf(a)/v0;
 field(null,{hour0:11});a=place(1,'nu',3000,20,19);b=place(2,'ji',3000,21,19);const nR=RT.rangeOf(a)/rg0,nV=RT.visionOf(a)/v0,nD=RT.rangedMult(a,b)/r0;
 return ratioTest('雨中箭矢 ×'+W.rainShot+'、骑兵不能冲锋、平地行军变慢（步 ×'+W.rainPlainInf+'、骑 ×'+W.rainPlainCav+'）；雾中射程 ×'+W.fogRange+'、目力 ×'+W.fogVision+'；夜里射程 ×'+f2(1-W.nightRange)+'、箭矢 ×'+f2(1-W.nightShot)+'、目力 '+W.vision+'→'+(W.vision-W.nightVision)+' 步。',
  [['雨：箭矢杀伤',W.rainShot,rain],['雾：射程',W.fogRange,fogR],['雾：目力',W.fogVision,fogV],['夜：射程',1-W.nightRange,nR],['夜：箭矢杀伤',1-W.nightShot,nD],['夜：目力',(W.vision-W.nightVision)/W.vision,nV]],.01);});

/* ================= 七、均势（平衡观察，不判对错） ================= */
test('均势','B1','模拟：同兵种对攻，先手优势',()=>{
 const rows=[],kpi=[];
 for(const[t,nm]of[['ji','戟兵'],['dun','盾兵'],['qi','骑兵']]){const d=duelAvg({a:{type:t},b:{type:t}});rows.push([nm,d.aWins+'/'+d.k,f2(ex(d)),f1(d.t)+' 息']);kpi.push([nm+' 攻方胜场',d.aWins,0],[nm+' 交换比',ex(d),2]);}
 return{observe:true,rule:'同兵种 3000 对 3000，平地，一方进攻、一方原地迎战。进攻方跑动接敌会触发冲锋（步卒 ×'+R().charge.inf+'、骑兵 ×'+R().charge.cav+'）。',
  expect:'观察项：先手优势多大由你定。交换比 1 为均势，越小进攻方越占便宜',measured:rows.map(r=>r[0]+' 攻方胜 '+r[1]+'，交换比 '+r[2]).join('；'),pass:true,
  table:{head:['兵种','攻方胜','交换比（攻折÷守折）','用时'],rows},kpi};});
test('均势','B2','模拟：兵种相克实战',()=>{
 const rows=[],kpi=[];
 for(const[a,b,nm]of[['ji','qi','戟兵 迎击 骑兵冲锋'],['qi','nu','骑兵 冲 弩手'],['dun','ji','盾兵 攻 戟兵'],['qi','ji','骑兵 冲 戟兵']]){
  const d=a==='ji'?duelAvg({a:{type:'qi',x:14},b:{type:'ji',x:24}}):duelAvg({a:{type:a,x:a==='qi'?14:22},b:{type:b,x:a==='qi'?24:27}});
  const atkWin=a==='ji'?d.k-d.aWins:d.aWins;rows.push([nm,(a==='ji'?'戟兵':'攻方')+'胜 '+atkWin+'/'+d.k,f2(ex(d)),f1(d.t)+' 息']);kpi.push([nm+' 胜场',atkWin,0]);}
 return{observe:true,rule:'各兵种 3000 对 3000，平地。骑兵从 10 格外冲。戟兵一项是骑兵冲戟兵、看戟兵胜几场。',expect:'观察项：克制方应占上风',measured:rows.map(r=>r[0]+' '+r[1]).join('；'),pass:true,
  table:{head:['对阵','克制方胜','交换比（攻折÷守折）','用时'],rows},kpi};});

function runOne(t){let r;const t0=Date.now();
 try{r=t.fn();}catch(e){r={pass:false,measured:'异常：'+(e&&e.message),expect:'',rule:'',kpi:[]};if(typeof console!=='undefined')console.error(e);}
 return Object.assign(r,{group:t.group,id:t.id,name:t.name,ms:Date.now()-t0});}
return{tests,runOne,GROUPS:['地势','战马','渡河行军','镇守','阵形侧背','天时','均势']};
}
if(typeof module!=='undefined'&&module.exports)module.exports=rulesSuite;else root.rulesSuite=rulesSuite;
})(typeof window!=='undefined'?window:this);
