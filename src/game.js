'use strict';
(()=>{
const TS=40,MW=60,MH=38,WW=MW*TS,WH=MH*TS,PI=Math.PI,TAU=PI*2;
const PLAIN=0,HILL=1,FOREST=2,RIVER=3,FORD=4,ROAD=5,WALL=6,GATE=7,CAMP=8,BURNT=9,MARSH=10,CLIFF=11,RUBBLE=12;
const TNAME=['平地','山丘','林地','河流','浅滩','道路','城垣','垒门','营垒','焦土','沮泽','绝壁','残垣'];
const TNOTE=['无险可守，利骑兵驰突','地势越高，攻守越利，弩矢越远；陡处战马易伤','镇守可设伏；骑兵难行且折损，畏火攻','','半渡受击，伤亡倍增','行军迅捷','','','守军依垒，矢石难伤','草木已尽','泥淖难行，战马陷足，折损最重','','城垣崩缺，可由此突入'];
const SPD=[1,.65,.7,0,.45,1.3,.12,1,1,.9,.5,0,.6];
const GN={ram:'冲车',ladder:'云梯',cata:'发石车'},GT={ram:12,ladder:9,cata:18},GS={ram:.75,ladder:.9,cata:.6};
const HN='子丑寅卯辰巳午未申酉戌亥',GAN='甲乙丙丁戊己庚辛壬癸';
const INK='#1d1b19',QING='#2f4d66',ZHU='#b3261e',ZHE='#8f6a3f',PAPER='#e6dfcc';
const BRUSH='"Ma Shan Zheng","STKaiti","KaiTi","Kaiti SC",serif';
const UT={
 ji:{name:'戟兵',ch:'戟',spd:46,atk:1,def:1,range:0},
 dun:{name:'盾兵',ch:'盾',spd:42,atk:.9,def:1.25,range:0},
 nu:{name:'弩手',ch:'弩',spd:44,atk:.5,def:.7,range:200},
 qi:{name:'骑兵',ch:'骑',spd:92,atk:1.15,def:.9,range:0},
 liang:{name:'粮队',ch:'粮',spd:32,atk:.05,def:1.1,range:0}};
const CT={ji:{qi:1.6,dun:.85},dun:{ji:1.2,qi:.85,nu:1.2},qi:{nu:1.7,dun:1.15,ji:.7,liang:1.3},nu:{},liang:{}};
const FM={
 fang:{name:'方阵',atk:1,def:1,spd:1},
 feng:{name:'锋矢阵',atk:1.3,def:.8,spd:1.15},
 yuan:{name:'圆阵',atk:.75,def:1.4,spd:.6,noflank:true},
 yan:{name:'雁行阵',atk:.9,def:.85,spd:1,shot:1.3,rng:1.1}};
const FMC={feng:{yan:1.25,yuan:.85},fang:{feng:1.1},yan:{},yuan:{}};
const QUOTES={
 flank:['出其不意，攻其无备','计篇'],high:['凡军好高而恶下','行军篇'],ford:['令半济而击之，利','行军篇'],
 rest:['以近待远，以佚待劳','军争篇'],ai:['隘形者，我先居之，必盈之以待敌','地形篇'],siege:['攻城之法，为不得已','谋攻篇'],shi:['如转圆石于千仞之山者，势也','势篇'],marsh:['绝斥泽，惟亟去无留','行军篇'],terrain:['夫地形者，兵之助也','地形篇'],fire:['发火有时，起火有日','火攻篇'],wind:['火发上风，无攻下风','火攻篇'],
 ambush:['兵者，诡道也','计篇'],death:['围师必阙，穷寇勿迫','军争篇'],rout:['三军可夺气，将军可夺心','军争篇'],
 supply:['军无辎重则亡，无粮食则亡','军争篇'],speed:['兵之情主速，乘人之不及','九地篇'],
 dig:['先为不可胜，以待敌之可胜','形篇'],night:['夜战多火鼓，昼战多旌旗','军争篇'],
 mass:['我专为一，敌分为十','虚实篇'],rain:['上雨，水沫至，欲涉者，待其定也','行军篇'],
 fog:['难知如阴，动如雷震','军争篇'],qi:['凡战者，以正合，以奇胜','势篇'],march:['其疾如风，其徐如林','军争篇']};

const $=id=>document.getElementById(id);
const cl=(v,a,b)=>v<a?a:v>b?b:v;
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const ang=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const angDiff=(a,b)=>{let d=(b-a)%TAU;if(d>PI)d-=TAU;if(d<-PI)d+=TAU;return d;};
const turn=(a,b,mx)=>{const d=angDiff(a,b);return Math.abs(d)<=mx?b:a+Math.sign(d)*mx;};
const tileIdx=(x,y)=>cl(y/TS|0,0,MH-1)*MW+cl(x/TS|0,0,MW-1);
const cen=i=>({x:(i%MW+.5)*TS,y:((i/MW|0)+.5)*TS});
function rng32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

let G=null;
/* ---------- 难度 ---------- */
const PRESET=[{force:75,might:85,wit:1,pace:80},{force:100,might:100,wit:2,pace:100},{force:125,might:110,wit:3,pace:115}];
const WIT=['守拙','常法','善谋'];
const D={force:100,might:100,wit:2,pace:100,vol:70,snd:true};
try{Object.assign(D,JSON.parse(localStorage.getItem('changping-set')||'{}'));}catch(e){}
const saveD=()=>{try{localStorage.setItem('changping-set',JSON.stringify(D));}catch(e){}};
const paceName=v=>v<=85?'宽裕':v>=115?'紧迫':'如常';
const diffLine=()=>'敌军兵力 '+D.force+'%，战力 '+D.might+'%，敌将'+WIT[D.wit-1]+'，粮草时限'+paceName(D.pace);
/* ---------- 音效（全部即时合成，无外部文件） ---------- */
const SND={ctx:null,master:null,buf:null,last:{},rain:null};
const GAP={hail:220,hoof:300,clash:120,arrow:260,thud:380,gong:2500,horn:2600,pluck:280,tick:40,move:120,fire:600,drum:160,crash:500,fall:700};
function audio(){
 if(!D.snd)return null;
 if(!SND.ctx){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;const a=SND.ctx=new A();SND.master=a.createGain();SND.master.gain.value=D.vol/100;SND.master.connect(a.destination);
  const b=a.createBuffer(1,a.sampleRate*2|0,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;SND.buf=b;}catch(e){return null;}}
 if(SND.ctx.state==='suspended')SND.ctx.resume();return SND.ctx;}
function tone(f0,f1,dur,type,vol,delay){const a=audio();if(!a)return;const t=a.currentTime+(delay||0),o=a.createOscillator(),g=a.createGain();o.type=type;
 o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(f1,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0006,t+dur);o.connect(g);g.connect(SND.master);o.start(t);o.stop(t+dur+.03);}
function hiss(dur,ft,f0,f1,q,vol,delay){const a=audio();if(!a)return;const t=a.currentTime+(delay||0),n=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();
 n.buffer=SND.buf;f.type=ft;f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0006,t+dur);n.connect(f);f.connect(g);g.connect(SND.master);n.start(t,Math.random());n.stop(t+dur+.03);}
const drum=(v,dl)=>{tone(120,44,.45,'sine',.9*v,dl);hiss(.1,'lowpass',500,120,1,.45*v,dl);};
const PENTA=[146.8,174.6,196,220,261.6,293.7,349.2,392,440];
const SCALES={yu:PENTA,gong:[130.8,146.8,164.8,196,220,261.6,293.7,329.6,392],shang:[146.8,164.8,196,220,261.6,293.7,329.6,392,440],jue:[164.8,196,220,261.6,293.7,329.6,392,440,523.3],zhi:[196,220,261.6,293.7,329.6,392,440,523.3,587.3]};
const MUS={scale:PENTA,gap:[1.6,4.8],vol:.3,drum:.28};
function setMusic(m){m=m||{};const sc=Array.isArray(m.scale)?m.scale.map(Number).filter(f=>f>40&&f<4000):SCALES[m.scale];MUS.scale=sc&&sc.length>=3?sc:PENTA;
 const g=Array.isArray(m.gap)&&m.gap[1]>=m.gap[0]&&m.gap[0]>=.2?m.gap:[1.6,4.8];MUS.gap=[g[0],g[1]];MUS.vol=cl(typeof m.vol==='number'?m.vol:.3,0,1);MUS.drum=cl(typeof m.drum==='number'?m.drum:.28,0,1);}
function playOps(ops,v){for(const o of ops){if(!Array.isArray(o))continue;const p=o.slice(1);if(o[0]==='tone')tone(p[0]||220,p[1]||p[0]||220,cl(p[2]||.3,.02,6),p[3]||'sine',cl((p[4]||.2)*v,0,1),p[5]||0);
 else if(o[0]==='hiss')hiss(cl(p[0]||.3,.02,6),p[1]||'bandpass',p[2]||1000,p[3]||p[2]||1000,p[4]||1,cl((p[5]||.2)*v,0,1),p[6]||0);else if(o[0]==='drum')drum(cl((p[0]||1)*v,0,2),p[1]||0);else if(o[0]==='pluck')pluck(p[0]|0,cl((p[1]||1)*v,0,2),p[2]||0);}}
const pluck=(i,v,dl)=>{const f=MUS.scale[cl(i,0,MUS.scale.length-1)];tone(f,f*.997,1.7,'triangle',.24*v,dl);tone(f*2,f*2,.5,'sine',.07*v,dl);tone(f*3,f*3,.18,'sine',.03*v,dl);};
function sfx(name,x,y){
 if(!D.snd)return;const now=typeof performance!=='undefined'?performance.now():0;if(now-(SND.last[name]||-1e9)<(GAP[name]||0))return;SND.last[name]=now;
 let v=1;if(x!==undefined&&G){const sx=(x-cam.x)*cam.z,sy=(y-cam.y)*K*cam.z;if(sx<-90||sy<-90||sx>W+90||sy>H+90)v=.2;}
 const cu=G&&G.M&&G.M.data&&G.M.data.sfx&&G.M.data.sfx[name];if(Array.isArray(cu)){playOps(cu,v);return;}
 const r=Math.random();
 switch(name){
  case'clash':hiss(.08,'bandpass',2400+r*2200,1700,3,.26*v);tone(1400+r*1700,900+r*400,.13,'triangle',.06*v);break;
  case'arrow':hiss(.34,'bandpass',800,3400,5,.2*v);break;
  case'thud':tone(95,48,.2,'sine',.55*v);hiss(.07,'lowpass',800,200,1,.3*v);break;
  case'crash':hiss(.8,'lowpass',2200,140,1,.7*v);tone(72,34,.65,'sine',.7*v);break;
  case'fall':drum(.7*v);tone(60,38,.7,'sine',.4*v,.05);break;
  case'fire':hiss(.55,'bandpass',420,1700,1,.24*v);break;
  case'gong':tone(196,191,2.4,'sine',.3);tone(294,288,1.9,'sine',.17);tone(417,406,1.4,'sine',.1);tone(588,570,.8,'sine',.05);hiss(.22,'bandpass',1000,500,2,.14);break;
  case'horn':tone(147,151,1.05,'sawtooth',.075);tone(220.5,226,1.05,'sawtooth',.035);tone(73.5,75,1.05,'sine',.12);break;
  case'pluck':pluck(3+(r*5|0),1);break;
  case'qin':pluck(2,1);pluck(5,.9,.28);pluck(7,.8,.6);break;
  case'hail':for(let j=0;j<4;j++)tone(150+r*30+j*17,112+j*9,.3,'sawtooth',.045,j*.035);hiss(.3,'bandpass',760,480,1.6,.2);hiss(.3,'bandpass',1500,1000,3,.07,.02);hiss(.05,'bandpass',3200,2200,3,.1,.16);hiss(.05,'bandpass',2800,2000,3,.08,.24);break;
  case'hoof':for(let j=0;j<4;j++){tone(170,90,.07,'sine',.22,.1+j*.085+(j%2)*.02);hiss(.03,'lowpass',1200,500,1,.1,.1+j*.085);}tone(820,1320,.14,'sawtooth',.018,.05);tone(1320,620,.34,'sawtooth',.018,.19);break;
  case'tick':tone(880,620,.05,'square',.05);break;
  case'move':tone(190,110,.12,'sine',.32);hiss(.04,'lowpass',900,300,1,.16);break;
  case'drum':drum(v);break;
  case'drums':drum(1);drum(1,.32);drum(1,.64);drum(1,.84);drum(1.1,1.04);break;
  case'win':drum(1);drum(1,.25);drum(1.1,.5);[2,4,5,7,8].forEach((n,i)=>pluck(n,1,.8+i*.22));break;
  case'lose':tone(196,188,3,'sine',.3);tone(277,262,2.4,'sine',.16);hiss(.3,'bandpass',900,400,2,.14);drum(.8,.9);drum(.6,1.7);break;
 }}
function ambient(){const a=SND.ctx;if(!a)return;const want=D.snd&&G&&!G.paused&&!G.over&&G.weather==='rain';
 if(want&&!SND.rain){try{const n=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();n.buffer=SND.buf;n.loop=true;f.type='highpass';f.frequency.value=2600;g.gain.value=.05;n.connect(f);f.connect(g);g.connect(SND.master);n.start();SND.rain=n;}catch(e){}}
 else if(!want&&SND.rain){try{SND.rain.stop();}catch(e){}SND.rain=null;}}
let musT=2,musI=3,beatT=0;
function music(el){if(!D.snd||!SND.ctx||!G||G.paused||G.over)return;
 musT-=el;if(musT<=0){musI=cl(musI+((Math.random()*5|0)-2),0,8);pluck(musI,MUS.vol);if(Math.random()<.35)pluck(cl(musI+2,0,8),MUS.vol*.73,.3);musT=MUS.gap[0]+Math.random()*(MUS.gap[1]-MUS.gap[0]);}
 if(G.heat>0){G.heat-=el;beatT-=el;if(beatT<=0){beatT=G.heat>1.5?.55:.9;if(MUS.drum>0)drum(MUS.drum);}}}
const cam={x:0,y:0,z:1};
let W=800,H=600,dpr=1;
const tAtU=u=>G.map[tileIdx(u.x,u.y)];
// 地势：平地 0；山丘由外向内 1~3；己方城头 2；箭楼每层再加 1
function elevAt(i,side){let e=G.elev[i];if(G.ramp[i]&&G.own[i]!==side)e=0;const tw=G.tower[i];if(tw)e=Math.max(e,1)+tw;return e;}
const elevOf=u=>elevAt(tileIdx(u.x,u.y),u.side);
// 隘口：两侧被绝壁、城垣、河水夹住，横向或纵向只容一二格通行
function computeGap(){const blk=(x,y)=>{if(x<0||y<0||x>=MW||y>=MH)return false;const t=G.map[y*MW+x];return t===WALL||t===RIVER||t===CLIFF;};
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;G.gap[i]=0;if(blk(x,y))continue;let w=9;
  for(const[ax,ay]of[[1,0],[0,1]]){let n=1;for(let k=1;k<5&&!blk(x+ax*k,y+ay*k);k++)n++;for(let k=1;k<5&&!blk(x-ax*k,y-ay*k);k++)n++;if(n<w)w=n;}
  if(w<=2)G.gap[i]=w;}}
const frontage=g=>600+1400*g;
function computeElev(){const m=G.map,e=G.elev;const hill=(x,y)=>x<0||y<0||x>=MW||y>=MH||m[y*MW+x]===HILL||m[y*MW+x]===CLIFF;
 for(let i=0;i<MW*MH;i++)e[i]=m[i]===HILL?1:m[i]===WALL?2:0;
 for(let lv=2;lv<=3;lv++){const up=[];for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const i=y*MW+x;if(e[i]!==lv-1)continue;let ok=true;
   for(let d=0;d<4;d++){const nx=x+DX[d],ny=y+DY[d];if(!hill(nx,ny)||(nx>=0&&ny>=0&&nx<MW&&ny<MH&&e[ny*MW+nx]<lv-1)){ok=false;break;}}if(ok)up.push(i);}
  for(const i of up)e[i]=lv;}
 for(let y=1;y<MH-1;y++)for(let x=1;x<MW-1;x++){const i=y*MW+x;if(m[i]!==CAMP||!G.own[i])continue;for(let d=0;d<8;d++){const t=m[(y+DY[d])*MW+x+DX[d]];if(t===WALL||t===GATE){e[i]=2;G.ramp[i]=1;break;}}}}
const hourOf=()=>(G.hour0+G.t/G.hourLen)%12;
function dark(){const h=hourOf();if(h>=10||h<3)return 1;if(h>=9)return h-9;if(h<4)return 4-h;return 0;}

/* ---------- 地图构筑 ---------- */
function build(g){
 const m=g.map,R=g.rnd;
 const set=(x,y,t)=>{m[y*MW+x]=t;};
 function poly(pts,rad,fn){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])*3);
  for(let s=0;s<=n;s++){const px=a[0]+(b[0]-a[0])*s/n,py=a[1]+(b[1]-a[1])*s/n;
   for(let y=Math.floor(py-rad);y<=Math.ceil(py+rad);y++)for(let x=Math.floor(px-rad);x<=Math.ceil(px+rad);x++){
    if(x<0||y<0||x>=MW||y>=MH)continue;if(Math.hypot(x-px,y-py)<=rad)fn(x,y);}}}}
 return{
  river(p){g.riverLines.push(p);poly(p,1.15,(x,y)=>set(x,y,RIVER));},
  road(p){g.roadLines.push(p);poly(p,1.05,(x,y)=>{if(m[y*MW+x]===RIVER)set(x,y,FORD);});
   poly(p,.72,(x,y)=>{const t=m[y*MW+x];if(t!==FORD&&t!==RIVER)set(x,y,ROAD);});},
  blob(cx,cy,r,t){for(let y=Math.floor(cy-r-1);y<=cy+r+1;y++)for(let x=Math.floor(cx-r-1);x<=cx+r+1;x++){
   if(x<0||y<0||x>=MW||y>=MH)continue;if(Math.hypot(x-cx,y-cy)<r*(.72+.4*R())&&m[y*MW+x]===PLAIN)set(x,y,t);}},
  fort(x0,y0,x1,y1,side,gates){g.fortList.push({x0,y0,x1,y1,side,gates});for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const e=x===x0||x===x1||y===y0||y===y1;set(x,y,e?WALL:CAMP);g.own[y*MW+x]=side;}
   for(const[gx,gy,hp]of gates){const i=gy*MW+gx;set(gx,gy,GATE);const o={i,tx:gx,ty:gy,x:(gx+.5)*TS,y:(gy+.5)*TS,hp,max:hp,side};g.gates.push(o);g.gateIdx[i]=o;
    const ix=gx===x0?1:gx===x1?-1:0,iy=gy===y0?1:gy===y1?-1:0;for(const k of[-1,1]){const tx=gx+ix+(ix?0:k),ty=gy+iy+(iy?0:k);if(tx>x0&&tx<x1&&ty>y0&&ty<y1)g.tower[ty*MW+tx]=1;}}},
  cliff(p,rad){poly(p,rad||1,(x,y)=>{const t=m[y*MW+x];if(t===PLAIN||t===HILL||t===FOREST||t===MARSH)set(x,y,CLIFF);});},
  camp(x0,y0,x1,y1,side){g.campList.push({x0,y0,x1,y1,side});for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){if(m[y*MW+x]===PLAIN||m[y*MW+x]===ROAD){if(m[y*MW+x]===PLAIN)set(x,y,CAMP);g.own[y*MW+x]=side;}}}
 };
}

/* ---------- 寻路 ---------- */
const gS=new Float32Array(MW*MH),came=new Int32Array(MW*MH),closed=new Uint8Array(MW*MH);
const DX=[1,-1,0,0,1,1,-1,-1],DY=[0,0,1,-1,1,-1,1,-1];
const pass=(i,u)=>{const t=G.map[i];if(t===RIVER||t===CLIFF)return false;if(t===WALL)return !!(u&&u.gear==='ladder');return true;};
function spdF(t,type){let s=SPD[t];if(type==='qi'){if(t===HILL)s=.5;else if(t===FOREST)s=.42;else if(t===MARSH)s=.3;}
 if(G.weather==='rain'&&(t===PLAIN||t===BURNT))s*=type==='qi'?.75:.88;return s;}
function nearPass(tx,ty){for(let r=1;r<8;r++)for(let y=ty-r;y<=ty+r;y++)for(let x=tx-r;x<=tx+r;x++){if(x<0||y<0||x>=MW||y>=MH)continue;if(Math.max(Math.abs(x-tx),Math.abs(y-ty))!==r)continue;if(pass(y*MW+x))return y*MW+x;}return -1;}
function los(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/13);for(let s=0;s<=n;s++){const t=G.map[tileIdx(x0+(x1-x0)*s/n,y0+(y1-y0)*s/n)];if(!(t===PLAIN||t===ROAD||t===CAMP||t===BURNT))return false;}return true;}
function hpush(h,f,i){h.push([f,i]);let c=h.length-1;while(c>0){const p=(c-1)>>1;if(h[p][0]<=h[c][0])break;[h[p],h[c]]=[h[c],h[p]];c=p;}}
function hpop(h){const top=h[0],last=h.pop();if(h.length){h[0]=last;let c=0;for(;;){let l=c*2+1,r=l+1,s=c;if(l<h.length&&h[l][0]<h[s][0])s=l;if(r<h.length&&h[r][0]<h[s][0])s=r;if(s===c)break;[h[s],h[c]]=[h[c],h[s]];c=s;}}return top[1];}
function findPath(u,gx,gy){
 gx=cl(gx,4,WW-4);gy=cl(gy,4,WH-4);
 const tx=gx/TS|0,ty=gy/TS|0;let goal=ty*MW+tx,exact=true;
 if(!pass(goal,u)){goal=nearPass(tx,ty);exact=false;if(goal<0)return[];}
 const start=tileIdx(u.x,u.y);
 if(start===goal)return[exact?{x:gx,y:gy}:cen(goal)];
 const gxT=goal%MW,gyT=goal/MW|0;
 gS.fill(1e9);closed.fill(0);const heap=[];gS[start]=0;came[start]=-1;hpush(heap,0,start);let found=false;
 let bestI=start,bestH=1e9;
 while(heap.length){const cur=hpop(heap);if(closed[cur])continue;closed[cur]=1;if(cur===goal){found=true;break;}
  const cx=cur%MW,cy=cur/MW|0;{const hx=Math.abs(cx-gxT),hy=Math.abs(cy-gyT),hh=Math.max(hx,hy)+.414*Math.min(hx,hy);if(hh<bestH){bestH=hh;bestI=cur;}}
  for(let d=0;d<8;d++){const nx=cx+DX[d],ny=cy+DY[d];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const ni=ny*MW+nx;
   if(closed[ni]||!pass(ni,u))continue;if(d>=4&&(!pass(cy*MW+nx,u)||!pass(ny*MW+cx,u)))continue;
   const t=G.map[ni];let c=(d>=4?1.414:1)/spdF(t,u.type);
   if(t===GATE){const g=G.gateIdx[ni];if(g&&g.hp>0&&g.side!==u.side)c+=14;}
   if(G.fires.has(ni))c+=8;
   const ng=gS[cur]+c;if(ng<gS[ni]){gS[ni]=ng;came[ni]=cur;const ax=Math.abs(nx-gxT),ay=Math.abs(ny-gyT);
    hpush(heap,ng+(Math.max(ax,ay)+.414*Math.min(ax,ay))*.77,ni);}}}
 if(!found){if(bestI===start)return[];goal=bestI;exact=false;}
 const pts=[];let c=goal;while(c!==start&&c>=0){pts.push(cen(c));c=came[c];}pts.reverse();
 if(exact)pts[pts.length-1]={x:gx,y:gy};
 const out=[];let ax=u.x,ay=u.y,i=0;
 while(i<pts.length){let j=Math.min(pts.length-1,i+14);while(j>i&&!los(ax,ay,pts[j].x,pts[j].y))j--;out.push(pts[j]);ax=pts[j].x;ay=pts[j].y;i=j+1;}
 return out;
}

/* ---------- 军阵 ---------- */
function spawn(side,type,n,tx,ty,opt){
 const kind=type;if(UT[type]&&UT[type].base)type=UT[type].base;
 if(side===2&&type!=='liang')n=Math.max(500,Math.round(n*D.force/10000)*100);
 let i=cl(ty|0,0,MH-1)*MW+cl(tx|0,0,MW-1);
 if(!pass(i)){const j=nearPass(tx|0,ty|0);if(j>=0){i=j;tx=j%MW;ty=j/MW|0;}}
 const k=side+kind;G.nameIdx[k]=G.nameIdx[k]||0;
 const u={id:G.uid++,side,type,kind,n,nMax:n,x:(tx+.5)*TS,y:(ty+.5)*TS,face:G.M.face[side],fm:'fang',morale:90,stam:100,path:[],target:null,ordered:false,
  hold:false,holdT:0,march:false,state:'idle',cd:Math.random()*2,fireCd:0,hidden:false,vis:side===1,visA:side===1?1:0,ambushT:0,lastHit:-99,lastAtk:-99,
  chargeT:0,runT:0,death:false,alive:true,thinkT:Math.random()*.4,repT:0,general:false,auto:false,ai:null,siege:null,routT:0,r:20,hitT:0,contact:null,cd2:0,atkN:0,atkP:0,had:false,tag:''};
 if(opt)Object.assign(u,opt);
 if(!u.name)u.name=UT[kind].name+GAN[G.nameIdx[k]++%10]+'阵';
 u.home=u.home||{x:u.x,y:u.y};
 G.units.push(u);return u;
}
function removeUnit(u){u.alive=false;}
function kill(u){
 if(!u.alive)return;u.alive=false;stain(u.x,u.y,u.r);sfx('fall',u.x,u.y);
 if(u.type==='liang'){G.convLost++;msg('粮队被劫，辎重尽失！','warn');return;}
 if(u.general){msg((u.side===1?'我军主将':'敌将')+u.name.replace('亲卫','')+'阵亡！',u.side===1?'warn':'good');
  for(const o of G.units)if(o.side===u.side&&o.alive&&!o.death)o.morale-=30;}
 else msg((u.side===1?'我军':'敌军')+u.name+'覆没',u.side===1?'warn':'good');
}
function rout(u){
 sfx('gong');u.state='rout';u.target=null;u.ordered=false;u.hold=false;u.march=false;u.routT=0;u.path=findPath(u,u.home.x,u.home.y);
 for(const o of G.units)if(o!==u&&o.side===u.side&&o.alive&&!o.death&&dist(o,u)<220)o.morale-=6;
 if(u.side===2){msg('敌'+u.name+'溃走','good');quote('rout');}else msg('我军'+u.name+'溃退！','warn');
}
function surrounded(u){let q=0;for(const e of G.units){if(e.side===u.side||!e.alive||e.state==='rout'||e.type==='liang')continue;const dx=e.x-u.x,dy=e.y-u.y;if(dx*dx+dy*dy>190*190)continue;q|=1<<((dx>0?1:0)+(dy>0?2:0));}
 return((q&1)+(q>>1&1)+(q>>2&1)+(q>>3&1))>=3;}
function wallBetween(a,b){if(G.map[tileIdx(a.x,a.y)]===WALL||G.map[tileIdx(b.x,b.y)]===WALL)return false;for(let s=1;s<4;s++){const i=tileIdx(a.x+(b.x-a.x)*s/4,a.y+(b.y-a.y)*s/4),t=G.map[i];if(t===WALL)return true;if(t===GATE){const g=G.gateIdx[i];if(g&&g.hp>0)return true;}}return false;}
const canSee=(u,e)=>u.side===1?e.vis:(!e.hidden||dist(u,e)<70);
function visionOf(u){let v=420-250*dark();if(G.weather==='fog')v*=.45;return v*(1+.12*elevOf(u));}
function rangeOf(u){let r=UT[u.kind].range*(FM[u.fm].rng||1)*(1+.1*elevOf(u));if(G.weather==='fog')r*=.6;return r*(1-.2*dark());}
function rangeTo(u,t){return rangeOf(u)*(1-.08*Math.min(3,elevOf(t)))*(1+Math.cos(ang(u,t)-G.wind)*(G.windStr>1?.22:.08));}

let FLK=1;
const ctr=(a,b)=>{const c=CT[a.kind]||CT[a.type]||{},v=c[b.kind];return v!==undefined?v:(c[b.type]||1);};
function meleeMult(a,b){
 const A=UT[a.kind],B=UT[b.kind],fa=FM[a.fm],fb=FM[b.fm];
 let m=A.atk*fa.atk/(B.def*fb.def)*ctr(a,b)*(FMC[a.fm][b.fm]||1)*(a.chargeT>0?(A.charge||1):1);
 const ta=tAtU(a),tb=tAtU(b);
 const dh=elevOf(a)-elevOf(b);if(dh>0){m*=1+.12*Math.min(dh,3);quote('high');}else if(dh<0)m*=1-.1*Math.min(-dh,3);
 if(tb===FOREST)m*=.85;
 if(a.type==='qi'&&(ta===FOREST||tb===FOREST||ta===MARSH))m*=.7;
 if(tb===FORD){m*=1.5;quote('ford');}if(ta===FORD)m*=.6;
 if(tb===MARSH)m*=1.2;
 if(tb===WALL)m*=1.4;if(ta===WALL)m*=.6;if(a.gear==='ram')m*=.85;
 if(tb===CAMP&&G.own[tileIdx(b.x,b.y)]===b.side)m*=.75;
 const dug=b.hold&&b.holdT>8;
 if(b.hold){m*=dug?.65:.85;if(dug)quote('dig');}
 FLK=1;
 if(!fb.noflank&&b.state!=='rout'){const da=Math.abs(angDiff(b.face,ang(b,a)));if(da>2.2){m*=1.5;FLK=1.6;quote('flank');}else if(da>1.35){m*=1.25;FLK=1.3;}}
 if(a.chargeT>0&&!dug){if(a.type==='qi'){if(dh>=0&&!(b.type==='ji'&&b.fm!=='feng'&&FLK===1))m*=1.6;}else m*=1.2;
  if(dh>0){m*=1.15;quote('shi');}
  if(dark()>.6){m*=1.15;quote('night');}}
 m*=(.6+.4*a.stam/100)*(.75+.35*cl(a.morale,0,100)/100);
 if(a.ambushT>0)m*=1.7;
 if(a.death)m*=1.3;
 if(b.state==='rout')m*=1.5;
 if(a.stam-b.stam>45){m*=1.15;quote('rest');}
 if(b.atkP>=3){FLK*=1.2;quote('mass');}
 return m;
}
function rangedMult(a,b){
 let m=(UT[a.kind].shot||1)*(UT[b.kind].arrowDef||1)*(FM[a.fm].shot||1)*(.6+.4*a.stam/100)*(.8+.25*cl(a.morale,0,100)/100);
 if(b.type==='dun')m*=b.fm==='yuan'?.35:.45;else if(b.fm==='yuan')m*=1.2;
 const tb=tAtU(b);
 if(tb===FOREST)m*=.6;if(tb===FORD)m*=1.3;if(tb===WALL)m*=1.4;
 if(G.gap[tileIdx(b.x,b.y)]&&tb!==GATE){m*=1.25;if(elevOf(a)>elevOf(b)){m*=1.15;quote('ai');}}
 if(tb===CAMP&&G.own[tileIdx(b.x,b.y)]===b.side)m*=.5;
 if(G.weather==='rain')m*=.5;
 if(b.hold&&b.holdT>8)m*=.8;
 if(a.ambushT>0)m*=1.4;
 if(b.state==='rout')m*=1.2;
 const dh=elevOf(a)-elevOf(b);m*=1+.1*cl(dh,-3,4);if(dh>0)quote('high');
 return m*(1-.2*dark());
}
function hurt(b,dmg,mk){
 if(dmg<=0||!b.alive)return;dmg=Math.min(dmg,b.n);b.n-=dmg;b.lastHit=G.t;b.hitT=.2;
 if(b.type!=='liang'&&!b.death)b.morale-=dmg/b.nMax*100*1.6*mk;
 if(b.side===1)G.stats.loss+=dmg;else G.stats.kill+=dmg;
}
function fight(u,dt){
 if(u.chargeT>0)u.chargeT-=dt;if(u.ambushT>0)u.ambushT-=dt;if(u.hitT>0)u.hitT-=dt;if(u.fireCd>0)u.fireCd-=dt;
 if(u.state==='rout'||u.type==='liang'){u.had=false;return;}
 const tg=u.target&&u.target.alive?u.target:null;let foe=null;
 if(tg&&dist(u,tg)<u.r+tg.r+10&&!wallBetween(u,tg))foe=tg;else if(u.contact&&u.contact.alive)foe=u.contact;
 if(foe&&!u.had&&u.runT>1.2&&!(G.weather==='rain'&&u.type==='qi')){u.chargeT=3.5;if(u.type==='qi'&&foe.type==='nu')quote('speed');}
 u.had=!!foe;
 if(foe){
  if(u.hidden){u.ambushT=6;u.hidden=false;quote('ambush');}
  const m=meleeMult(u,foe);const ga=G.gap[tileIdx(u.x,u.y)],gb=G.gap[tileIdx(foe.x,foe.y)],gp=ga&&gb?Math.min(ga,gb):(ga||gb);let eff=u.n;if(gp&&eff>frontage(gp)){eff=frontage(gp);quote('ai');}
  let dmg=16*Math.pow(eff/1000,.7)*m*dt*(u.side===2?D.might/100:1);if(u.state==='move'&&!tg)dmg*=.4;G.heat=Math.min(3,(G.heat||0)+dt*2);
  foe.atkN++;hurt(foe,dmg,FLK);u.stam-=1.1*dt;u.lastAtk=G.t;
  if(u.state!=='move')u.face=turn(u.face,ang(u,foe),dt*5);
  if(Math.random()<dt*6){splat((u.x+foe.x)/2,(u.y+foe.y)/2);sfx('clash',u.x,u.y);}
 }else if(UT[u.kind].range&&u.state!=='move'){
  u.cd-=dt;
  if(u.cd<=0){let t2=null;
   if(tg&&canSee(u,tg)&&dist(u,tg)<=rangeTo(u,tg))t2=tg;
   else if(!u.ordered||!tg){let bd=1e9;for(const e of G.units){if(e.side===u.side||!e.alive||!canSee(u,e))continue;const d=dist(u,e);if(d<bd&&d<=rangeTo(u,e)){bd=d;t2=e;}}}
   if(t2){if(u.hidden){u.ambushT=6;u.hidden=false;quote('ambush');}
    u.cd=2.2;hurt(t2,11*2.2*Math.pow(u.n/1000,.7)*rangedMult(u,t2)*(u.side===2?D.might/100:1),1);volley(u,t2,false);sfx('arrow',u.x,u.y);G.heat=Math.min(3,(G.heat||0)+.3);
    if(u.side===2&&D.wit>=3&&u.fireCd<=0&&G.weather!=='rain'){const fi=tileIdx(t2.x,t2.y);if(flam(fi)&&G.own[fi]!==2&&startFire(fi)){u.fireCd=40;volley(u,t2,true);msg('敌军发火箭'+(G.map[fi]===FOREST?'焚林':'烧营')+'！','warn');}}u.face=ang(u,t2);u.lastAtk=G.t;u.stam-=.6;}
   else u.cd=.25;}
 }
 if(u.siege){const g=u.siege;if(g.hp>0){const raw=3*(UT[u.kind].gate||1)*Math.pow(u.n/1000,.7)*(u.type==='nu'?.3:u.type==='qi'?.5:1)*dt;u.lastAtk=G.t;
  if(u.gear==='ram'){if(g.rT!==G.t){g.rT=G.t;g.rr=0;}const dm=Math.min(raw*5,70*dt-g.rr);if(dm>0){g.hp-=dm;g.rr+=dm;}quote('siege');}
  else{if(g.frT!==G.t){g.frT=G.t;g.fr=0;}const dm=Math.min(raw,28*dt-g.fr);if(dm>0){g.hp-=dm;g.fr+=dm;}}
  if(Math.random()<dt*(u.gear==='ram'?7:4)){splat(g.x,g.y);sfx('thud',g.x,g.y);}if(g.hp<=0)breakGate(g);}}
 // 发石车轰击城垣、垒门、箭楼
 if(u.bomb){const i=u.bomb.i,p=cen(i),t=G.map[i],g=G.gateIdx[i];
  if(u.gear!=='cata'||!(t===WALL||(t===GATE&&g&&g.hp>0)||G.tower[i]>0))u.bomb=null;
  else if(!foe&&!u.path.length&&dist(u,p)<=bombR(u)){u.bcd=(u.bcd||0)-dt;u.face=turn(u.face,ang(u,p),dt*4);
   if(u.bcd<=0){u.bcd=3;const dm=70*Math.sqrt(u.n/3000);G.arrows.push({x0:u.x,y0:u.y,x1:p.x+(Math.random()-.5)*14,y1:p.y+(Math.random()-.5)*14,t:0,d:.9,stone:true});sfx('thud',u.x,u.y);u.lastAtk=G.t;u.stam-=1;
    if(t===GATE){g.hp-=dm;if(g.hp<=0)breakGate(g);}
    else if(t===WALL){const h=(G.shp[i]===undefined?600:G.shp[i])-dm;G.shp[i]=h;if(h<=0)breach(i);}
    else{const k='t'+i,h=(G.shp[k]===undefined?260:G.shp[k])-dm;G.shp[k]=h;if(h<=0){G.tower[i]--;delete G.shp[k];sfx('crash',p.x,p.y);msg('箭楼被砸塌一层','good');}}}}}
}
const bombR=u=>300*(1+.05*elevOf(u));
function breach(i){const p=cen(i);G.map[i]=RUBBLE;delete G.shp[i];G.elev[i]=0;sfx('crash',p.x,p.y);msg('城垣崩塌，缺口已开！','good');paintRubble(i);computeGap();}
function breakGate(g){sfx('crash',g.x,g.y);g.hp=0;G.map[g.i]=ROAD;msg(g.side===1?'我军垒门被攻破！':'敌垒门已破！',g.side===1?'warn':'good');stain(g.x,g.y,16);}

/* ---------- 行军 ---------- */
function stepUnit(u,dt){
 u.siege=null;const tg=u.target&&u.target.alive?u.target:null;
 if(u.bomb&&u.state!=='rout'&&!tg){const p=cen(u.bomb.i);if(dist(u,p)>bombR(u)*.95){u.repT-=dt;if(u.repT<=0||!u.path.length){u.path=findPath(u,p.x,p.y);u.repT=1.5;}}else{u.path.length=0;return;}}
 if(u.man){const m=u.man,e=m.tg;
  if(!e.alive||u.state==='rout')u.man=null;
  else if(!u.path.length||(m.cur&&(m.hold?u.contact===e||dist(u,m.cur)<8:dist(u,m.cur)<44))){let go=false;
   while(m.pts.length&&!go){const q=m.pts.shift(),R=e.r+u.r+q.R,p=findPath(u,e.x+Math.cos(m.a+q.da)*R,e.y+Math.sin(m.a+q.da)*R);if(p.length){u.path=p;u.state='move';m.cur=p[p.length-1];go=true;}}
   if(!go){u.man=null;u.path=[];u.state='idle';if(m.hold){u.hold=true;u.target=null;u.face=ang(u,e);}else{u.target=e;u.ordered=true;u.repT=0;if(u.side===1){quote('qi');ack([u],'杀');}}}}}
 if(u.state!=='rout'&&tg){
  const d=dist(u,tg),rg=UT[u.kind].range&&!u.contact;
  if(u.hold||(rg?d<=rangeTo(u,tg)*.92:(d<=u.r+tg.r+2&&!wallBetween(u,tg)))){u.path.length=0;u.runT=0;return;}
  u.repT-=dt;if(u.repT<=0||!u.path.length){u.path=findPath(u,tg.x,tg.y);u.repT=.8+Math.random()*.4;}
 }
 if(!u.path.length){if(u.state==='move'){u.state='idle';u.march=false;}u.runT=0;return;}
 const wp=u.path[0],dx=wp.x-u.x,dy=wp.y-u.y,d=Math.hypot(dx,dy),t=tAtU(u);
 // 扼隘：敌军镇守于隘口时，不能从其身侧硬闯，只能接战
 {const k=u.contact;if(k&&k.alive&&k.hold&&u.state!=='rout'&&G.gap[tileIdx(k.x,k.y)]&&(k.x-u.x)*dx+(k.y-u.y)*dy>0){u.runT=0;u.face=turn(u.face,ang(u,k),dt*5);if(u.side===2&&u.ai&&!u.target)u.target=k;return;}}
 const fast=u.march&&u.stam>5;if(u.march&&!fast)u.march=false;
 const gpw=G.gap[tileIdx(u.x,u.y)],slow=(u.gear?GS[u.gear]:1)*(gpw&&u.n>frontage(gpw)?.75:1);
 const de=G.elev[tileIdx(wp.x,wp.y)]-G.elev[tileIdx(u.x,u.y)];
 const sp=slow*(de>0?.82:de<0?1.1:1)*UT[u.kind].spd*FM[u.fm].spd*spdF(t,u.type)*(u.state==='rout'?1.25:1)*(fast?1.45:1)*(u.stam<15?.75:1),st=sp*dt;
 const nx=d<=st?wp.x:u.x+dx/d*st,ny=d<=st?wp.y:u.y+dy/d*st,ni=tileIdx(nx,ny);
 if(G.map[ni]===GATE){const g=G.gateIdx[ni];if(g&&g.hp>0&&g.side!==u.side){u.siege=g;u.face=Math.atan2(dy,dx);u.runT=0;return;}}
 u.x=nx;u.y=ny;if(d<=st)u.path.shift();
 if(d>1)u.face=turn(u.face,Math.atan2(dy,dx),dt*6);
 u.runT=spdF(t,u.type)>=.9?u.runT+dt:0;
 u.stam-=dt*(fast?2.6:.3);
 if(u.type==='qi'&&u.state!=='rout'){const e=G.elev[ni];let k=t===MARSH?1:t===FOREST?.6:t===HILL&&e>=2?(e>=3?.8:.5):G.weather==='rain'&&fast&&(t===PLAIN||t===BURNT)?.25:0;
  if(k){const loss=Math.min(u.n,u.n*k/100*(fast?2.2:1)*dt);u.n-=loss;if(u.side===1)G.stats.loss+=loss;else G.stats.kill+=loss;u.runT=0;
   if(u.side===1&&G.t-(u.wornT||-99)>25){u.wornT=G.t;msg(u.name+(t===MARSH?'陷于沮泽':t===FOREST?'穿行密林':t===HILL?'攀行险坡':'雨中疾驰')+'，战马折损','warn');quote(t===MARSH?'marsh':'terrain');}}}
 // 看护：两息之内几乎未动，则重新寻路并稍作侧移
 u.stT=(u.stT||0)+dt;if(u.stT>2){if(u.path.length&&Math.hypot(u.x-(u.sx||0),u.y-(u.sy||0))<5&&!u.contact){const f=u.path[u.path.length-1];u.path=findPath(u,f.x,f.y);const a=u.face+(Math.random()<.5?1.57:-1.57);tryMove(u,Math.cos(a)*8,Math.sin(a)*8);}u.sx=u.x;u.sy=u.y;u.stT=0;}
}
function tryMove(u,dx,dy){const nx=cl(u.x+dx,6,WW-6),ny=cl(u.y+dy,6,WH-6),i=tileIdx(nx,ny);if(!pass(i,u))return;
 if(G.map[i]===GATE){const g=G.gateIdx[i];if(g&&g.hp>0&&g.side!==u.side)return;}u.x=nx;u.y=ny;}
// 推挤：行军中的军阵只会被侧向挤开，不会被友军顶回去；溃兵可穿行
function slideX(u,px,py){const w=u.path[0],hx=w.x-u.x,hy=w.y-u.y,l=Math.hypot(hx,hy)||1,dot=(px*hx+py*hy)/l;return dot<0?px-dot*hx/l:px;}
function slideY(u,px,py){const w=u.path[0],hx=w.x-u.x,hy=w.y-u.y,l=Math.hypot(hx,hy)||1,dot=(px*hx+py*hy)/l;return dot<0?py-dot*hy/l:py;}
function separate(dt){const U=G.units;for(let i=0;i<U.length;i++){const a=U[i];if(!a.alive)continue;for(let j=i+1;j<U.length;j++){const b=U[j];if(!b.alive)continue;
 const same=a.side===b.side,dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),mn=(a.r+b.r)*(same?.8:.92);
 if(d<mn){if(a.state==='rout'||b.state==='rout')continue;
  const p=(mn-d)*Math.min(1,dt*7),ux=d>.01?dx/d:1,uy=d>.01?dy/d:0;
  const am=a.path.length>0,bm=b.path.length>0;
  if(same&&(am||bm)){let ax=-ux*p*.5,ay=-uy*p*.5,bx=ux*p*.5,by=uy*p*.5;
   if(am){const sx=slideX(a,ax,ay),sy=slideY(a,ax,ay);ax=sx;ay=sy;}else{const k=a.hold?0:.3;ax*=k;ay*=k;}
   if(bm){const sx=slideX(b,bx,by),sy=slideY(b,bx,by);bx=sx;by=sy;}else{const k=b.hold?0:.3;bx*=k;by*=k;}
   tryMove(a,ax,ay);tryMove(b,bx,by);}
  else{const wa=a.hold?.25:b.hold?.75:.5;tryMove(a,-ux*p*wa,-uy*p*wa);tryMove(b,ux*p*(1-wa),uy*p*(1-wa));}}}}}

/* ---------- 思虑（自动接战与敌军AI） ---------- */
function think(u){
 if(u.state==='rout'||u.type==='liang')return;
 if(u.target&&!u.target.alive){u.target=null;u.ordered=false;}
 if(u.side===2)return aiThink(u);
 if(u.state==='move'||u.bomb||u.man)return;
 if(u.target&&u.ordered){if(!u.target.vis){u.target=null;u.ordered=false;}return;}
 const rg=UT[u.kind].range,R=rg?rangeOf(u)*1.05:(u.hold?u.r+45:150);let b=null,bd=R;
 for(const e of G.units){if(e.side!==2||!e.alive||!e.vis)continue;const d=dist(u,e)-(rg?0:e.r);if(d<bd){bd=d;b=e;}}
 u.target=b;
}
function aiForm(u,tg){
 if(D.wit<2)return;let f='fang';
 if(u.type==='nu')f=u.contact?'fang':'yan';
 else if(u.type==='qi')f=tg&&!(tg.type==='ji'&&tg.fm!=='feng')?'feng':'fang';
 else if(D.wit>=3&&u.atkP>=2)f='yuan';
 else if(tg&&(tg.type==='nu'||tg.state==='rout'||tg.fm==='yan'))f='feng';
 u.fm=f;}
function aiThink(u){
 const ai=u.ai;if(!ai)return;const wit=D.wit;
 if(wit>=3&&!ai.stay&&!u.death){
  // 侧击途中：到位或遇敌即转入攻击
  if(ai.flank){const t=ai.flank.tg;if(G.t>ai.flank.until||!t.alive||!u.path.length||u.contact){ai.flank=null;if(t.alive){u.target=t;u.state='idle';aiForm(u,t);return;}}else return;}
  // 士气将崩：退回本阵整顿，回稳后再战
  const starve=G.grain[2]!==null&&G.grain[2]<=0;
  if(ai.fall){if(u.morale>60||starve)ai.fall=false;else{u.target=u.contact||null;if(!u.contact&&!u.path.length&&dist(u,u.home)>80){u.path=findPath(u,u.home.x,u.home.y);u.state='move';}return;}}
  else if(u.morale<30&&!starve&&dist(u,u.home)>240&&!u.general){ai.fall=true;u.target=null;u.hold=false;u.path=findPath(u,u.home.x,u.home.y);u.state='move';return;}
 }
 const aggro=(ai.aggro||(UT[u.kind].range?rangeOf(u)+40:240))*(wit===1?.75:wit===3?1.2:1);let best=null,bs=1e9,bd=0;
 for(const p of G.units){if(p.side!==1||!p.alive)continue;const d=dist(u,p);if(d>aggro)continue;if(p.hidden&&d>70)continue;
  if(ai.mode==='guard'&&dist(p,ai.post)>ai.leash)continue;
  if(ai.focus&&ai.mode==='assault'&&p.type!==ai.pref&&p!==u.contact)continue;
  let s=d;if(ai.pref===p.type)s*=.4;
  else if(wit===2){if(u.type==='qi'&&p.type==='nu')s*=.7;}
  else if(wit>=3){if(ctr(u,p)>1.1)s*=.6;if(ctr(p,u)>1.3)s*=1.5;if(p.contact&&p.contact!==u)s*=.75;if(p.morale<35)s*=.8;if(p.general)s*=.85;}
  if(p.state==='rout')s*=1.5;if(s<bs){bs=s;best=p;bd=d;}}
 if(best){
  if(wit>=3&&!ai.stay){
   // 弩手避近战：敌近身则后撤再射
   if(u.type==='nu'&&best.type!=='nu'&&bd<95&&!u.contact&&(ai.kT||0)<G.t){ai.kT=G.t+5;const a=ang(best,u),p=findPath(u,u.x+Math.cos(a)*150,u.y+Math.sin(a)*150);if(p.length){u.target=null;u.path=p;u.state='move';u.hold=false;return;}}
   // 骑兵绕击：目标正与友军交锋时，先绕到其背后
   if(u.type==='qi'&&best.contact&&best.contact!==u&&!u.contact&&bd>90&&(ai.fT||0)<G.t&&Math.abs(angDiff(best.face,ang(best,u)))<2){
    ai.fT=G.t+9;const k=best.r+u.r+30,p=findPath(u,best.x-Math.cos(best.face)*k,best.y-Math.sin(best.face)*k);
    if(p.length){ai.flank={tg:best,until:G.t+3.5};u.target=null;u.path=p;u.state='move';u.hold=false;u.fm='feng';return;}}
  }
  u.target=best;aiForm(u,best);if(!ai.stay){if(u.hidden)u.ambushT=6;u.hold=false;u.state='idle';}return;}
 u.target=null;if(wit>=2&&u.type!=='nu')u.fm='fang';
 if(ai.stay){u.hold=true;return;}
 if(ai.mode==='guard'){if(dist(u,ai.post)>36){if(!u.path.length){u.path=findPath(u,ai.post.x,ai.post.y);u.state='move';u.hold=false;}}else{u.hold=true;u.state='idle';}}
 else if(ai.mode==='assault'){if(dist(u,ai.goal)>60){if(!u.path.length){u.path=findPath(u,ai.goal.x,ai.goal.y);u.state='move';u.hold=false;
   if(!u.path.length){u.ai={mode:'guard',post:{x:u.x,y:u.y},leash:260};}}}
  else u.ai={mode:'guard',post:ai.goal,leash:280,pref:ai.pref};}
}
const guard=(tx,ty,leash,o)=>Object.assign({mode:'guard',post:{x:(tx+.5)*TS,y:(ty+.5)*TS},leash:leash||220},o);
const aslt=(x,y,o)=>Object.assign({mode:'assault',goal:{x,y}},o);

/* ---------- 士气、体力、溃散 ---------- */
function upkeep(u,dt){
 const calm=G.t-u.lastHit>5&&!u.contact,gr=G.grain[u.side],starve=gr!==null&&gr<=0;
 if(u.state!=='move'&&!u.contact&&!u.path.length)u.stam+=dt*(u.hold?3:2);
 u.stam=cl(u.stam,0,100);
 if(u.hold)u.holdT+=dt;else u.holdT=0;
 if(u.make){if(!u.hold||u.state==='rout')u.make=null;else if(!u.contact){u.make.t+=dt*Math.sqrt(u.n/3000)/GT[u.make.g];if(Math.random()<dt*1.6)sfx('thud',u.x,u.y);
   if(u.make.t>=1){u.gear=u.make.g;u.make=null;sfx('drum',u.x,u.y);if(u.side===1)msg(u.name+'造成'+GN[u.gear]+(u.gear==='cata'?'：右键（或轻点）敌方城垣、垒门、箭楼即可轰击':u.gear==='ladder'?'：可直接翻越城垣':'：撞门如摧枯'),'good');}}}
 if(u.build){const bi=u.build.i;if(!u.hold||u.state==='rout'||tileIdx(u.x,u.y)!==bi||G.tower[bi]>=3)u.build=null;
  else if(!u.contact){u.build.t+=dt*Math.sqrt(u.n/3000)/14;if(Math.random()<dt*1.6)sfx('thud',u.x,u.y);
   if(u.build.t>=1){G.tower[bi]++;u.build=G.tower[bi]<3&&u.buildMore?{i:bi,t:0}:null;sfx('drum',u.x,u.y);msg(u.name+'筑成箭楼'+'一二三'[G.tower[bi]-1]+'层，地势 '+elevOf(u),'good');}}}
 if(u.type==='liang'){if(u.n<300)kill(u);return;}
 if(calm&&!starve)u.morale+=dt*2;
 const gen=G.gen[u.side];if(gen&&gen.alive&&!starve&&dist(u,gen)<280)u.morale+=dt;
 if(starve)u.morale-=dt*(u.side===2?1:.8);
 const fi=tileIdx(u.x,u.y);if(G.fires.has(fi)){hurt(u,(30+u.n*.006)*dt,1.5);}
 u.morale=cl(u.morale,0,100);
 u.hidden=u.hold&&u.holdT>3&&!u.make&&!u.build&&(G.map[fi]===FOREST||(G.map[fi]===HILL&&G.elev[fi]>=2))&&G.t-u.lastHit>4&&G.t-u.lastAtk>4&&!u.contact&&u.ambushT<=0;
 if(u.n<Math.max(120,u.nMax*.08)){kill(u);return;}
 if(starve&&u.morale<15){removeUnit(u);msg((u.side===2?'敌':'我军')+u.name+(u.side===2?'弃甲请降':'粮尽而散'),u.side===2?'good':'warn');if(u.side===2)G.stats.surr+=u.n;return;}
 if(u.state==='rout'){u.routT+=dt;let near=false;for(const e of G.units)if(e.side!==u.side&&e.alive&&dist(e,u)<230){near=true;break;}
  if((u.routT>8&&!near)||u.routT>16){u.state='idle';u.morale=Math.max(u.morale,42);u.path=[];}}
  else if(u.morale<15&&!u.death){if(surrounded(u)){u.death=true;u.morale=50;if(u.side===2)quote('death');msg((u.side===2?'敌':'我军')+u.name+'身陷重围，殊死而战',u.side===2?'warn':'');}else rout(u);}
}

/* ---------- 火 ---------- */
const flam=i=>G.map[i]===FOREST||(G.map[i]===CAMP&&!G.burnt[i]);
function startFire(i){if(G.weather==='rain'||G.fires.has(i)||!flam(i))return false;G.fires.set(i,{t:G.map[i]===FOREST?18:10,sp:2.5+Math.random()});const p=cen(i);sfx('fire',p.x,p.y);return true;}
function fires(dt){
 for(const[i,f]of G.fires){f.t-=dt*(G.weather==='rain'?6:1);f.sp-=dt;
  if(f.sp<=0){f.sp=2.6;const x=i%MW,y=i/MW|0;for(let d=0;d<8;d++){const nx=x+DX[d],ny=y+DY[d];if(nx<0||ny<0||nx>=MW||ny>=MH)continue;
   const al=Math.cos(Math.atan2(DY[d],DX[d])-G.wind),p=G.windStr>1?(al>.5?.85:al<-.3?.04:.25):(al>.5?.5:al<-.3?.1:.25);if(Math.random()<p)startFire(ny*MW+nx);}}
  if(f.t<=0){G.fires.delete(i);G.burnt[i]=1;if(G.map[i]===FOREST)G.map[i]=BURNT;paintBurnt(i);}}
}

/* ---------- 据点 ---------- */
function points(dt){for(const p of G.points){let a=0,d=0;for(const u of G.units){if(!u.alive||u.type==='liang'||u.state==='rout'||dist(u,p)>p.r)continue;if(u.side===p.side)d++;else a++;}
 if(a&&!d){p.prog+=dt/p.time;if(p.prog>=1){p.side=3-p.side;p.prog=0;if(G.M.onPoint)G.M.onPoint(G,p);}}else p.prog=Math.max(0,p.prog-dt/4);}}
function vis(dt){for(const e of G.units){if(e.side===1)continue;let v=false;for(const p of G.units){if(p.side!==1||!p.alive)continue;if(dist(e,p)<(e.hidden?90:visionOf(p))){v=true;break;}}
 e.vis=v;e.visA=cl(e.visA+(v?dt*3:-dt*2),0,1);}}

function update(dt){
 const g=G;g.t+=dt;
 while(g.evi<g.events.length&&g.events[g.evi].t<=g.t)g.events[g.evi++].f(g);
 const U=g.units;
 for(const u of U){u.r=15+5.2*Math.sqrt(u.n/1000);u.contact=null;u.cd2=1e9;u.atkP=u.atkN;u.atkN=0;}
 for(let i=0;i<U.length;i++){const a=U[i];for(let j=i+1;j<U.length;j++){const b=U[j];if(a.side===b.side)continue;const d=dist(a,b);
  if(d<a.r+b.r+10&&!wallBetween(a,b)){if(d<a.cd2){a.cd2=d;a.contact=b;}if(d<b.cd2){b.cd2=d;b.contact=a;}}}}
 for(const u of U){if(!u.alive)continue;u.thinkT-=dt;if(u.thinkT<=0){u.thinkT=.45;think(u);}stepUnit(u,dt);}
 separate(dt);
 for(const u of U)if(u.alive)fight(u,dt);
 for(const u of U)if(u.alive)upkeep(u,dt);
 fires(dt);points(dt);
 if(g.M.tick)g.M.tick(g,dt);
 if(g.units.some(u=>!u.alive)){g.units=g.units.filter(u=>u.alive);}
 g.sel=g.sel.filter(u=>u.alive&&u.state!=='rout');
 vis(dt);
 for(const a of g.arrows)a.t+=dt;g.arrows=g.arrows.filter(a=>a.t<a.d);
 for(const p of g.parts){p.l-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}g.parts=g.parts.filter(p=>p.l>0);
 for(const r of g.rings)r.t+=dt;g.rings=g.rings.filter(r=>r.t<.6);
 let r=g.M.check(g);
 if(!r&&!g.units.some(u=>u.side===1&&!u.auto))r=['lose','全军覆没'];
 if(r)endGame(r);
}

/* ---------- 号令 ---------- */
const selOK=()=>G.sel.filter(u=>u.alive&&u.state!=='rout');
function pickUnit(wx,wy,side){let b=null,bd=1e9;for(const u of G.units){if(u.side!==side||!u.alive||(side===2&&!u.vis))continue;const d=Math.hypot(u.x-wx,(u.y-wy)*K);if(d<u.r+12&&d<bd){bd=d;b=u;}}return b;}
function order(wx,wy){
 let s=selOK();if(!s.length)return;for(const u of s)u.man=null;
 const e=pickUnit(wx,wy,2);
 sfx('move');
 if(e){for(const u of s){u.bomb=null;if(u.hidden)u.ambushT=10;u.target=e;u.ordered=true;u.hold=false;u.state='idle';u.repT=0;}ring(e.x,e.y,ZHU);ack(s,'杀');return;}
 {const ti=tileIdx(wx,wy),tt=G.map[ti],gg=G.gateIdx[ti],cat=s.filter(u=>u.gear==='cata');
  if(cat.length&&(tt===WALL&&G.own[ti]!==1||(tt===GATE&&gg&&gg.hp>0&&gg.side!==1)||(G.tower[ti]>0&&G.own[ti]===2))){
   for(const u of cat){u.bomb={i:ti};u.bcd=1;u.target=null;u.ordered=false;u.hold=false;u.state='idle';u.path=[];u.repT=0;}
   const p=cen(ti);ring(p.x,p.y,ZHU);ack(cat,'轰');msg('发石车轰击'+(tt===WALL?'城垣':tt===GATE?'垒门':'箭楼'));s=s.filter(u=>u.gear!=='cata');if(!s.length)return;}}
 for(const u of s)u.bomb=null;
 const k=s.length,cols=Math.ceil(Math.sqrt(k)),rows=Math.ceil(k/cols);let bad=0;
 s.forEach((u,i)=>{const ox=((i%cols)-(cols-1)/2)*66,oy=((i/cols|0)-(rows-1)/2)*66;const p=findPath(u,wx+ox,wy+oy);
  if(!p.length){bad++;return;}u.path=p;u.state='move';u.target=null;u.ordered=false;u.hold=false;});
 if(bad===k)msg('此处不可至');else{ring(wx,wy,INK);ack(s,'得令');}
}
function splitOff(u){if(u.n<1600||u.general){msg(u.general?'主将亲卫不可分兵':'兵力不足一千六，不可再分');return null;}
 const h=u.n/2;u.n=h;u.nMax/=2;const a=u.face+PI/2;
 const v=spawn(1,u.kind,h,u.x/TS,u.y/TS,{fm:u.fm,morale:u.morale,stam:u.stam,face:u.face,hold:u.hold,gear:u.gear});
 v.nMax=u.nMax;v.r=u.r;v.x=u.x+Math.cos(a)*18;v.y=u.y+Math.sin(a)*18;u.x-=Math.cos(a)*18;u.y-=Math.sin(a)*18;
 if(!pass(tileIdx(v.x,v.y))){v.x=u.x;v.y=u.y;}return v;}
function split(u){const v=splitOff(u);if(v)G.sel.push(v);}
/* ---------- 列阵战术：两翼包抄、绕后夹击、侧翼包抄 ---------- */
const TAC={wings:'两翼包抄',rear:'绕后夹击',side:'侧翼包抄'};
function tactic(mode,e){
 let s=selOK().filter(u=>u.type!=='liang');if(!s.length){msg('先点选我军军阵');return;}
 s.sort((a,b)=>dist(a,e)-dist(b,e));let front=null,mv;
 if(s.length===1){const u=s[0],v=splitOff(u);if(!v)return;G.sel.push(v);if(mode==='wings')mv=[u,v];else{front=u;mv=[v];}}
 else if(mode==='wings')mv=s;else{front=s[0];mv=s.slice(1);}
 let cx=0,cy=0;for(const u of mv){cx+=u.x;cy+=u.y;}const a=front?ang(e,front):Math.atan2(cy/mv.length-e.y,cx/mv.length-e.x);
 const okSide=(u,sd)=>{const R=e.r+u.r+90,i=tileIdx(cl(e.x+Math.cos(a+sd*PI/2)*R,0,WW-1),cl(e.y+Math.sin(a+sd*PI/2)*R,0,WH-1));return pass(i,u)&&!G.gap[i];};
 mv.sort((p,q)=>angDiff(a,ang(e,p))-angDiff(a,ang(e,q)));
 mv.forEach((u,j)=>{let sd=mode==='wings'||mv.length>1?(j<mv.length/2?-1:1):(angDiff(a,ang(e,u))<0?-1:1);
  if(mv.length===1&&mode==='wings')sd=1;if(!okSide(u,sd)&&okSide(u,-sd)&&!(mode==='wings'&&mv.length>1))sd=-sd;
  const pts=mode==='rear'?[{da:sd*1.9,R:95},{da:PI,R:42}]:[{da:sd*PI/2,R:42}];
  u.man={tg:e,a,pts,mode};u.hold=false;u.target=null;u.ordered=false;u.bomb=null;u.make=null;u.build=null;u.path=[];u.state='move';if(u.hidden)u.ambushT=10;});
 if(front){front.path=[];front.target=null;front.ordered=false;front.march=false;front.bomb=null;
  if(dist(front,e)>e.r+front.r+60){front.hold=false;front.state='move';front.man={tg:e,a,pts:[{da:0,R:-10}],hold:true};}else{front.man=null;front.hold=true;front.state='idle';front.face=ang(front,e);}ack([front],'守');}
 ack(mv,mode==='wings'?'包抄':mode==='rear'?'绕后':'侧击');sfx('move');ring(e.x,e.y,ZHU);
 msg(TAC[mode]+'：'+(front?front.name+'逼近敌前镇守，':'')+(mode==='wings'?'分兵左右两翼':mode==='rear'?'后军绕出敌后':'后军迂回侧翼')+'，合击敌'+e.name);}
function tacAt(w){const mode=G.tacMode;G.tacMode=null;const e=pickUnit(w.x,w.y,2);if(!e){msg('须点选一支看得见的敌军');return;}tactic(mode,e);}
function merge(s){if(s.length<2){msg('合兵需选中两阵以上同种军阵');return;}const a=s[0];let done=0;
 for(const b of s.slice(1)){if(b.kind!==a.kind||b.general||dist(a,b)>150)continue;const t=a.n+b.n;a.morale=(a.morale*a.n+b.morale*b.n)/t;a.stam=(a.stam*a.n+b.stam*b.n)/t;a.n=t;a.nMax+=b.nMax;b.alive=false;done++;}
 if(!done)msg('需同种军阵且相距不远，方可合兵');else{G.units=G.units.filter(u=>u.alive);G.sel=[a];}}
function fireAt(w){
 G.fireMode=false;const arch=selOK().filter(u=>u.type==='nu');
 if(!arch.length){msg('火攻需选中弩手');return;}
 if(G.weather==='rain'){msg('雨中火不可发');return;}
 const i=tileIdx(w.x,w.y);if(!flam(i)){msg('此地无草木营帐可燃（林地、敌营可火攻）');return;}
 for(const u of arch){if(u.fireCd>0||Math.hypot(u.x-w.x,u.y-w.y)>rangeOf(u)*1.3)continue;u.fireCd=25;volley(u,w,true);startFire(i);quote(G.windStr>1?'wind':'fire');return;}
 msg('弩手距离太远，或火箭尚未备妥');
}
function cmd(c){
 if(!G||G.over)return;const s=selOK();sfx('tick');
 if(c==='all'){const pv=G.sel;G.sel=G.units.filter(u=>u.side===1&&!u.auto&&u.alive&&u.state!=='rout');hail(G.sel.filter(u=>!pv.includes(u)));return;}
 if(c==='pause'){G.paused=!G.paused;return;}
 if(c==='siege'){$('siegemenu').hidden=!$('siegemenu').hidden;$('tacmenu').hidden=true;return;}
 if(c==='tac'){if(G.tacMode){G.tacMode=null;return;}$('tacmenu').hidden=!$('tacmenu').hidden;$('siegemenu').hidden=true;return;}
 if(c==='speed'){G.speed=G.speed===1?2:1;return;}
 if(!s.length){msg('先点选我军军阵');return;}
 if(c==='hold'){const on=!s.every(u=>u.hold);for(const u of s){u.man=null;u.hold=on;if(on){u.path=[];u.target=null;u.ordered=false;u.state='idle';u.march=false;}}}
 else if(c==='stop')for(const u of s){u.man=null;u.bomb=null;u.make=null;u.build=null;u.path=[];u.target=null;u.ordered=false;u.state='idle';u.march=false;}
 else if(c==='split')s.forEach(split);
 else if(c==='merge')merge(s);
 else if(c==='march'){const on=!s.every(u=>u.march);for(const u of s)u.march=on&&u.stam>10;if(on)quote('march');}
 else if(c==='ram'||c==='ladder'||c==='cata'){let n=0;for(const u of s){
   if(u.type==='qi'){msg('骑兵不能携攻城器');continue;}if(c!=='cata'&&u.type==='nu'){msg('弩手只可操发石车');continue;}
   u.hold=true;u.path=[];u.target=null;u.ordered=false;u.state='idle';u.march=false;u.build=null;u.bomb=null;u.gear=null;u.make={g:c,t:0};n++;}
  if(n)msg('就地赶造'+GN[c]+'，约'+GT[c]+'息');}
 else if(TAC[c]){G.tacMode=c;G.fireMode=false;msg(TAC[c]+'：'+(touchy?'轻点':'点选')+'要合击的敌军');}
 else if(c==='nogear'){for(const u of s){u.gear=null;u.make=null;u.bomb=null;}}
 else if(c==='build'){for(const u of s){const i=tileIdx(u.x,u.y),t=G.map[i];
   if(u.type==='qi'){msg('骑兵不可筑楼');continue;}
   if(!(t===PLAIN||t===CAMP||t===BURNT||t===HILL||t===ROAD)){msg(TNAME[t]+'之上不可筑楼');continue;}
   if(G.tower[i]>=3){msg('此处箭楼已有三层');continue;}
   u.hold=true;u.path=[];u.target=null;u.ordered=false;u.state='idle';u.march=false;u.build={i,t:0};}
  if(s.some(u=>u.build))msg('就地筑楼：每层约十四息，遇敌接战则停工');}
 else if(c==='fire'){G.fireMode=!G.fireMode;if(G.fireMode)msg('点选林地或敌营，发火箭');}
 else if(FM[c])for(const u of s)u.fm=c;
}

/* ---------- 墨迹特效 ---------- */
function splat(x,y){for(let i=0;i<3;i++){const a=Math.random()*TAU,v=20+Math.random()*50;G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.35+Math.random()*.3,r:1+Math.random()*2.4});}}
function volley(u,t,fire){const n=fire?3:5;for(let i=0;i<n;i++){const j=u.r*.7,k=(t.r||10)*.7;G.arrows.push({x0:u.x+(Math.random()-.5)*j*2,y0:u.y+(Math.random()-.5)*j*2,x1:t.x+(Math.random()-.5)*k*2,y1:t.y+(Math.random()-.5)*k*2,t:-i*.05,d:.45,fire});}}
function ring(x,y,c){G.rings.push({x,y,c,t:0});}
function stain(x,y,r){const c=G.gctx;if(!c)return;c.save();for(let i=0;i<9;i++){const a=Math.random()*TAU,d=Math.random()*r;c.fillStyle='rgba(30,27,24,'+(.05+Math.random()*.1)+')';c.beginPath();c.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,3+Math.random()*r*.5,0,TAU);c.fill();}
 c.strokeStyle='rgba(30,27,24,.5)';c.lineWidth=1.2;c.beginPath();c.moveTo(x-6,y+4);c.lineTo(x+7,y-3);c.moveTo(x+2,y-8);c.lineTo(x-1,y+6);c.stroke();c.restore();}

/* ---------- 水墨地形 ---------- */
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function paintGround(){
 const cv=G.ground=mkCanvas(WW,WH),x=G.gctx=cv.getContext('2d'),R=rng32(G.M.seed*7+3),m=G.map;
 x.fillStyle=PAPER;x.fillRect(0,0,WW,WH);
 for(let i=0;i<150;i++){const px=R()*WW,py=R()*WH,r=120+R()*320,g=x.createRadialGradient(px,py,0,px,py,r);
  g.addColorStop(0,R()<.5?'rgba(120,104,78,.06)':'rgba(255,251,238,.12)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(px-r,py-r,r*2,r*2);}
 x.strokeStyle='rgba(90,78,58,.07)';x.lineWidth=.7;x.beginPath();
 for(let i=0;i<2800;i++){const px=R()*WW,py=R()*WH,a=R()*TAU,l=4+R()*14;x.moveTo(px,py);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);}x.stroke();
 const each=(fn)=>{for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++)fn(m[ty*MW+tx],(tx+.5)*TS,(ty+.5)*TS,tx,ty);};
 const trace=p=>{x.beginPath();p.forEach((q,i)=>{const px=(q[0]+.5)*TS,py=(q[1]+.5)*TS;if(i)x.lineTo(px,py);else x.moveTo(px,py);});};
 x.lineJoin='round';x.lineCap='round';
 // 道路：枯笔
 for(const p of G.roadLines){trace(p);x.strokeStyle='rgba(143,106,63,.2)';x.lineWidth=9;x.stroke();
  for(let k=0;k<3;k++){x.save();x.translate((R()-.5)*5,(R()-.5)*5);trace(p);x.strokeStyle='rgba(110,80,46,'+(.22+R()*.2)+')';x.lineWidth=.8+R();x.setLineDash([6+R()*14,3+R()*9]);x.lineDashOffset=R()*30;x.stroke();x.restore();}x.setLineDash([]);}
 // 水：留白
 for(const p of G.riverLines){trace(p);x.strokeStyle='rgba(47,77,102,.10)';x.lineWidth=TS*3.1;x.stroke();x.strokeStyle='rgba(47,77,102,.13)';x.lineWidth=TS*2.6;x.stroke();
  x.strokeStyle='#f2eee1';x.lineWidth=TS*2.2;x.stroke();
  x.strokeStyle='rgba(47,77,102,.4)';x.lineWidth=1;
  for(let i=0;i<p.length-1;i++){const ax=(p[i][0]+.5)*TS,ay=(p[i][1]+.5)*TS,bx=(p[i+1][0]+.5)*TS,by=(p[i+1][1]+.5)*TS,L=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/L,uy=(by-ay)/L,n=L/9|0;
   for(let k=0;k<n;k++){const f=R(),o=(R()-.5)*TS*1.9,l=10+R()*18,px=ax+(bx-ax)*f-uy*o,py=ay+(by-ay)*f+ux*o;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+ux*l/2-uy*3,py+uy*l/2+ux*3,px+ux*l,py+uy*l);x.stroke();}}}
 if(G.tilePaint){const link=pred=>{x.beginPath();for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){if(!pred(m[ty*MW+tx]))continue;const cx=(tx+.5)*TS,cy=(ty+.5)*TS;x.moveTo(cx,cy);x.lineTo(cx+.01,cy);
    for(const[ox,oy]of[[1,0],[0,1],[1,1],[-1,1]]){const nx=tx+ox,ny=ty+oy;if(nx<0||nx>=MW||ny>=MH||!pred(m[ny*MW+nx]))continue;x.moveTo(cx,cy);x.lineTo(cx+ox*TS,cy+oy*TS);}}};
  link(t=>t===ROAD||t===GATE||t===FORD);x.strokeStyle='rgba(143,106,63,.2)';x.lineWidth=9;x.stroke();x.strokeStyle='rgba(110,80,46,.42)';x.lineWidth=1.2;x.setLineDash([7,6]);x.stroke();x.setLineDash([]);
  link(t=>t===RIVER||t===FORD);x.strokeStyle='rgba(47,77,102,.12)';x.lineWidth=TS*1.95;x.stroke();x.strokeStyle='#f2eee1';x.lineWidth=TS*1.4;x.stroke();
  x.strokeStyle='rgba(47,77,102,.4)';x.lineWidth=1;each((t,cx,cy)=>{if(t!==RIVER)return;for(let k=0;k<2;k++){const px=cx+(R()-.5)*30,py=cy+(R()-.5)*30,l=10+R()*14;x.beginPath();x.moveTo(px,py);x.quadraticCurveTo(px+5,py+l/2,px-1,py+l);x.stroke();}});}
 each((t,cx,cy)=>{if(t!==FORD)return;x.strokeStyle='rgba(143,106,63,.55)';x.lineWidth=1.3;for(let k=0;k<4;k++){const px=cx+(R()-.5)*32,py=cy+(R()-.5)*32;x.beginPath();x.moveTo(px-6,py);x.lineTo(px+6,py+(R()-.5)*2);x.stroke();}
  x.fillStyle='rgba(60,58,54,.5)';for(let k=0;k<3;k++){x.beginPath();x.arc(cx+(R()-.5)*30,cy+(R()-.5)*30,1.5+R()*1.5,0,TAU);x.fill();}});
 // 沮泽
 each((t,cx,cy)=>{if(t!==MARSH)return;x.strokeStyle='rgba(52,74,66,.45)';x.lineWidth=1;for(let k=0;k<6;k++){const px=cx+(R()-.5)*36,py=cy+(R()-.5)*36;x.beginPath();x.moveTo(px-5,py);x.lineTo(px+5,py);x.moveTo(px-1,py);x.lineTo(px-3,py-6);x.moveTo(px+1,py);x.lineTo(px+3,py-5);x.stroke();}});
 // 营垒底色
 each((t,cx,cy)=>{if(t!==CAMP)return;const g=x.createRadialGradient(cx,cy,2,cx,cy,TS*1.2);g.addColorStop(0,'rgba(143,106,63,.07)');g.addColorStop(1,'rgba(143,106,63,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,TS*1.2,0,TAU);x.fill();});
 // 山影、林荫：立体之物另绘，地面只留淡墨
 each((t,cx,cy)=>{if(t!==HILL&&t!==CLIFF&&t!==FOREST)return;const g=x.createRadialGradient(cx,cy,4,cx,cy,TS*1.15);g.addColorStop(0,t===CLIFF?'rgba(34,36,38,.3)':t===FOREST?'rgba(28,44,36,.13)':'rgba(58,60,58,.12)');g.addColorStop(1,'rgba(58,60,58,0)');x.fillStyle=g;x.beginPath();x.arc(cx,cy,TS*1.15,0,TAU);x.fill();});
 // 小地图：俯视
 const mc=G.mini=mkCanvas(180,114),mx=mc.getContext('2d');mx.drawImage(cv,0,0,180,114);const ms=180/WW;
 each((t,cx,cy,tx,ty)=>{const col=t===FOREST?'rgba(28,44,36,.5)':t===HILL?'rgba(60,62,60,'+(.14+.13*G.elev[ty*MW+tx])+')':t===CLIFF?'rgba(24,24,24,.8)':t===WALL||t===GATE?'#22201d':null;if(!col)return;mx.fillStyle=col;mx.fillRect((cx-TS/2)*ms,(cy-TS/2)*ms,TS*ms+.5,TS*ms+.5);});
}
function paintRubble(i){const c=G.gctx;if(!c)return;const p=cen(i);c.fillStyle='rgba(226,219,200,.9)';c.beginPath();c.arc(p.x,p.y,23,0,TAU);c.fill();
 for(let k=0;k<14;k++){c.fillStyle=k%3?'rgba(120,104,80,.8)':'rgba(34,32,29,.8)';const px=p.x+(Math.random()-.5)*36,py=p.y+(Math.random()-.5)*36,r=2+Math.random()*4;c.fillRect(px,py,r*1.4,r);}}
function paintBurnt(i){const c=G.gctx;if(!c)return;const p=cen(i);c.fillStyle='rgba(226,219,200,.82)';c.beginPath();c.arc(p.x,p.y,25,0,TAU);c.fill();
 for(let k=0;k<9;k++){c.fillStyle='rgba(32,29,26,'+(.12+Math.random()*.22)+')';c.beginPath();c.arc(p.x+(Math.random()-.5)*36,p.y+(Math.random()-.5)*36,3+Math.random()*7,0,TAU);c.fill();}
 c.strokeStyle='rgba(30,26,22,.7)';c.lineWidth=1.2;for(let k=0;k<4;k++){const px=p.x+(Math.random()-.5)*30,py=p.y+(Math.random()-.5)*30;c.beginPath();c.moveTo(px,py);c.lineTo(px+(Math.random()-.5)*3,py-6);c.stroke();}}

/* ---------- 2.5D 投影：斜俯视，纵深压缩，地势抬升 ---------- */
const K=.62,HS=15;let NOW=0;
function buildHeights(){const hv=G.hv;for(let i=0;i<MW*MH;i++)hv[i]=G.map[i]===HILL?G.elev[i]:0;}
function hillH(x,y){const fx=x/TS-.5,fy=y/TS-.5,x0=Math.floor(fx),y0=Math.floor(fy),ax=fx-x0,ay=fy-y0,hv=G.hv;
 const a=cl(y0,0,MH-1)*MW,b=cl(y0+1,0,MH-1)*MW,l=cl(x0,0,MW-1),r=cl(x0+1,0,MW-1);
 return((hv[a+l]*(1-ax)+hv[a+r]*ax)*(1-ay)+(hv[b+l]*(1-ax)+hv[b+r]*ax)*ay)*HS;}
function hpx(x,y){const h=hillH(x,y),i=tileIdx(x,y);let s=G.map[i]===WALL||G.ramp[i]?2:0;const tw=G.tower[i];if(tw)s=Math.max(s,G.elev[i],1)+tw;return Math.max(h,s*HS);}
const SPR={};
function sprites(){if(SPR.tree)return;const R=rng32(977);
 const mk=(w,h,ox,oy,fn)=>{const cv=mkCanvas(w,h),x=cv.getContext('2d');x.translate(ox,oy);x.lineCap='round';x.lineJoin='round';fn(x);return{cv,ox,oy};};
 // 树：点叶与松
 SPR.tree=[];for(let v=0;v<8;v++)SPR.tree.push(mk(30,36,15,33,x=>{const lean=(R()-.5)*4,ht=16+R()*8;
  x.strokeStyle='rgba(30,26,22,.75)';x.lineWidth=1.3;x.beginPath();x.moveTo(0,0);x.quadraticCurveTo(lean*.3,-ht*.5,lean,-ht);x.stroke();
  if(v%3===0){for(let j=0;j<4;j++){const yy=-ht*(.45+j*.2),w=9-j*1.9;x.strokeStyle='rgba(24,40,32,'+(.6+R()*.3)+')';x.lineWidth=2.6-j*.3;x.beginPath();x.moveTo(lean*.6-w,yy+2);x.quadraticCurveTo(lean*.6,yy-3,lean*.6+w,yy+2);x.stroke();}}
  else for(let j=0;j<6;j++){x.fillStyle='rgba(28,44,36,'+(.4+R()*.4)+')';x.beginPath();x.ellipse(lean+(R()-.5)*11,-ht+2-(R()*7)+j*.6,3.5+R()*4,2.6+R()*2.4,0,0,TAU);x.fill();}}));
 // 山：层峦。前三款为天际线（浓墨勾脊），后三款为山腹（淡墨皴擦）
 SPR.mound={};for(let e=1;e<=3;e++){SPR.mound[e]=[];const Hh=e*HS;for(let v=0;v<6;v++){const sky=v<3;SPR.mound[e].push(mk(104,Hh+52,52,Hh+30,x=>{
  const l=-44-R()*4,r=44+R()*4,a=-20-R()*6,b=18+R()*7,pk=sky?4+R()*(3+e*2.5):1+R()*2,px=(R()-.5)*14;
  const path=()=>{x.beginPath();x.moveTo(l,14);x.quadraticCurveTo(l+8,-Hh*.6,a,-Hh);x.quadraticCurveTo(px-6,-Hh-pk*.4,px,-Hh-pk);x.quadraticCurveTo(px+7,-Hh-pk*.3,b,-Hh);x.quadraticCurveTo(r-8,-Hh*.5,r,14);x.lineTo(r,20);x.lineTo(l,20);x.closePath();};
  let g=x.createLinearGradient(0,-Hh-pk,0,20);g.addColorStop(0,'rgba(230,223,204,1)');g.addColorStop(.72,'rgba(230,223,204,1)');g.addColorStop(1,'rgba(230,223,204,0)');path();x.fillStyle=g;x.fill();
  g=x.createLinearGradient(0,-Hh-pk,0,14);g.addColorStop(0,'rgba(44,48,48,'+(sky?.42:.2)+')');g.addColorStop(.55,'rgba(70,74,74,.1)');g.addColorStop(1,'rgba(70,74,74,0)');path();x.fillStyle=g;x.fill();
  g=x.createLinearGradient(l,0,r,0);g.addColorStop(0,'rgba(255,250,236,.1)');g.addColorStop(1,'rgba(36,38,40,.13)');path();x.fillStyle=g;x.fill();
  const ridge=(al,lw)=>{x.strokeStyle='rgba(24,23,21,'+al+')';x.lineWidth=lw;x.beginPath();x.moveTo(l+3,6);x.quadraticCurveTo(l+8,-Hh*.6,a,-Hh);x.quadraticCurveTo(px-6,-Hh-pk*.4,px,-Hh-pk);x.quadraticCurveTo(px+7,-Hh-pk*.3,b,-Hh);x.quadraticCurveTo(r-8,-Hh*.5,r-4,4);x.stroke();};
  if(sky){ridge(.8,1.5+R());x.setLineDash([9,4,3,6]);ridge(.35,2.6);x.setLineDash([]);}else ridge(.22,1);
  x.strokeStyle='rgba(24,23,21,'+(sky?.4:.26)+')';x.lineWidth=.9;for(let j=0;j<4+e;j++){const sx=a+(b-a)*R(),sy=-Hh+3+R()*Hh*.7;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+3+R()*5,sy+5+R()*7);x.stroke();}
  x.fillStyle='rgba(22,34,28,.55)';for(let j=0;j<(sky?2+e:1);j++){x.beginPath();x.ellipse(a+(b-a)*R(),-Hh-1+R()*5,1.6+R()*1.4,1.1,0,0,TAU);x.fill();}}));}}
 // 绝壁：斧劈皴
 SPR.cliff=[];for(let v=0;v<5;v++){const Hh=36+R()*16;SPR.cliff.push(mk(84,Hh+34,42,Hh+22,x=>{
  const w=22+R()*10,p1=-6+(R()-.5)*10,p2=p1+10+R()*8,h2=Hh*(.62+R()*.2);
  const path=()=>{x.beginPath();x.moveTo(-w-8,10);x.lineTo(-w,-Hh*.35);x.lineTo(p1-6,-Hh*.86);x.lineTo(p1,-Hh);x.lineTo(p1+5,-Hh*.8);x.lineTo(p2-3,-h2*.92);x.lineTo(p2,-h2);x.lineTo(p2+6,-h2*.7);x.lineTo(w,-Hh*.25);x.lineTo(w+8,10);x.lineTo(w+6,16);x.lineTo(-w-6,16);x.closePath();};
  let g=x.createLinearGradient(0,-Hh,0,16);g.addColorStop(0,'rgba(226,219,200,1)');g.addColorStop(.8,'rgba(226,219,200,1)');g.addColorStop(1,'rgba(226,219,200,0)');path();x.fillStyle=g;x.fill();
  g=x.createLinearGradient(0,-Hh,0,12);g.addColorStop(0,'rgba(26,28,30,.72)');g.addColorStop(.45,'rgba(50,54,56,.34)');g.addColorStop(1,'rgba(60,64,66,.04)');path();x.fillStyle=g;x.fill();
  x.strokeStyle='rgba(18,18,17,.9)';x.lineWidth=1.8;x.beginPath();x.moveTo(-w-4,2);x.lineTo(-w,-Hh*.35);x.lineTo(p1-6,-Hh*.86);x.lineTo(p1,-Hh);x.lineTo(p1+5,-Hh*.8);x.lineTo(p2-3,-h2*.92);x.lineTo(p2,-h2);x.lineTo(p2+6,-h2*.7);x.lineTo(w,-Hh*.25);x.lineTo(w+5,0);x.stroke();
  x.strokeStyle='rgba(18,18,17,.5)';for(let j=0;j<14;j++){const sx=-w+R()*w*2,sy=-Hh*(.1+R()*.75);if(sy<-Hh+Math.abs(sx-p1)*1.6)continue;x.lineWidth=.7+R()*1.6;x.beginPath();x.moveTo(sx,sy);x.lineTo(sx+1+R()*4,sy+8+R()*10);x.stroke();}
  x.fillStyle='rgba(22,34,28,.6)';for(let j=0;j<3;j++){x.beginPath();x.ellipse(p1+(R()-.5)*20,-Hh*(.5+R()*.4),2.4,1.5,0,0,TAU);x.fill();}}));}
 SPR.tent=[];for(let v=0;v<3;v++)SPR.tent.push(mk(30,24,15,21,x=>{const w=9+R()*3,h=12+R()*3;x.fillStyle='rgba(240,234,218,.96)';x.strokeStyle='rgba(40,34,28,.75)';x.lineWidth=1.1;
  x.beginPath();x.moveTo(-w,0);x.lineTo(-2,-h);x.lineTo(w*.6,-h+1);x.lineTo(w,0);x.closePath();x.fill();x.stroke();x.fillStyle='rgba(60,50,40,.35)';x.beginPath();x.moveTo(-2,-h);x.lineTo(1,0);x.lineTo(-w,0);x.closePath();x.fill();}));
}
function buildProps(){sprites();buildHeights();const R=rng32(G.M.seed*13+5),m=G.map,P=[];
 const wl=(x,y)=>x>=0&&y>=0&&x<MW&&y<MH&&(m[y*MW+x]===WALL||m[y*MW+x]===GATE);
 for(let ty=0;ty<MH;ty++)for(let tx=0;tx<MW;tx++){const i=ty*MW+tx,t=m[i],cx=(tx+.5)*TS,cy=(ty+.5)*TS;
  if(t===HILL){const e=G.elev[i],sky=ty===0||G.hv[i-MW]<e;P.push({k:ty*TS+R(),type:'s',i,x:cx+(R()-.5)*8,sy:cy*K,s:SPR.mound[e][(sky?0:3)+(R()*3|0)]});}
  else if(t===CLIFF){const n=1+(R()<.55?1:0);for(let j=0;j<n;j++){const py=cy+(R()-.5)*26;P.push({k:py,type:'s',i,x:cx+(R()-.5)*26,sy:py*K,s:SPR.cliff[R()*SPR.cliff.length|0]});}}
  else if(t===FOREST){const n=4+(R()*3|0);for(let j=0;j<n;j++){const px=cx+(R()-.5)*38,py=cy+(R()-.5)*38;P.push({k:py,type:'t',i,x:px,sy:py*K-hillH(px,py),s:SPR.tree[R()*SPR.tree.length|0]});}}
  else if(t===CAMP&&!G.ramp[i]&&!G.tower[i]&&R()<.13){const px=cx+(R()-.5)*14,py=cy+(R()-.5)*14;P.push({k:py,type:'s',i,x:px,sy:py*K,s:SPR.tent[R()*3|0]});}
  if(t===WALL)P.push({k:ty*TS,type:'w',i,tx,ty,L:wl(tx-1,ty),R:wl(tx+1,ty),U:wl(tx,ty-1),D:wl(tx,ty+1)});
  if(G.ramp[i])P.push({k:ty*TS-.5,type:'r',i,tx,ty});}
 P.sort((a,b)=>a.k-b.k);G.props=P;}
// 立方块：顶面 + 朝向观者的立面
function block(c,x0,x1,y0,y1,h,top,face,line){const ty=y0*K-h,fy=y1*K-h;
 c.fillStyle=face;c.fillRect(x0,fy,x1-x0,h);c.fillStyle=top;c.fillRect(x0,ty,x1-x0,fy-ty);
 if(line){c.strokeStyle=line;c.lineWidth=1.2;c.strokeRect(x0,ty,x1-x0,fy-ty);c.beginPath();c.moveTo(x0,fy);c.lineTo(x0,fy+h);c.moveTo(x1,fy);c.lineTo(x1,fy+h);c.stroke();}}
const WT=TS*.56,WALLH=2*HS;
function drawWall(c,p){const x0=p.tx*TS,y0=p.ty*TS,cx=x0+TS/2,cy=y0+TS/2,h=WALLH,top='#c4b491',face='#8c7757';
 const seg=(ax,bx,ay,by)=>{block(c,ax,bx,ay,by,h,top,face,'#22201d');
  c.fillStyle='rgba(34,32,29,.34)';const fy=by*K-h;for(let k=ax+3;k<bx-4;k+=9){c.fillRect(k,fy+5+((k*7)%3)*5,6,1.2);c.fillRect(k+4,fy+16+((k*5)%3)*3,5,1.2);}
  c.fillStyle='#22201d';for(let k=ax+2;k<bx-3;k+=7)c.fillRect(k,fy-3,4,3);};
 if(p.U||p.D||!(p.L||p.R))seg(cx-WT/2,cx+WT/2,p.U?y0:cy-WT/2,p.D?y0+TS:cy+WT/2);
 if(p.L||p.R)seg(p.L?x0:cx-WT/2,p.R?x0+TS:cx+WT/2,cy-WT/2,cy+WT/2);
 const hp=G.shp[p.i];if(hp!==undefined){c.fillStyle='rgba(29,27,25,.3)';c.fillRect(cx-16,cy*K-h-12,32,3);c.fillStyle=ZHU;c.fillRect(cx-16,cy*K-h-12,32*cl(hp/600,0,1),3);}}
function drawRamp(c,p){const x0=p.tx*TS,y0=p.ty*TS;block(c,x0,x0+TS,y0,y0+TS,WALLH,'#d3c6a6','#a9966f',null);
 c.strokeStyle='rgba(60,46,30,.3)';c.lineWidth=.8;c.beginPath();const ty=y0*K-WALLH;for(let k=0;k<4;k++){const o=x0+5+k*10;c.moveTo(o,ty+3);c.lineTo(o+4,ty+TS*K-3);}
 c.moveTo(x0,(y0+TS)*K-WALLH);c.lineTo(x0+TS,(y0+TS)*K-WALLH);c.stroke();}
function drawGate(c,o){const x0=o.tx*TS,y0=o.ty*TS,cx=x0+TS/2,cy=y0+TS/2,hz=(o.tx>0&&G.map[o.i-1]===WALL)||(o.tx<MW-1&&G.map[o.i+1]===WALL),h=WALLH;
 if(o.hp>0){const ax=hz?x0:cx-WT/2,bx=hz?x0+TS:cx+WT/2,ay=hz?cy-WT/2:y0,by=hz?cy+WT/2:y0+TS;
  block(c,ax,bx,ay,by,h,'#6f5a40','#4e3d2b','#1d1b19');const fy=by*K-h;
  if(hz){c.fillStyle='#2a221a';c.fillRect(cx-11,fy+7,22,h-7);c.strokeStyle='#8f6a3f';c.lineWidth=1;c.beginPath();c.moveTo(cx,fy+7);c.lineTo(cx,fy+h);c.stroke();c.fillStyle='#c9a45a';for(const dx of[-6,6])for(const dy of[13,21]){c.fillRect(cx+dx-1,fy+dy,2,2);}}
  // 门楼
  const ty=ay*K-h,my=(ty+fy)/2,rw=(bx-ax)/2+5;c.fillStyle='#8a7353';c.fillRect(cx-rw+6,my-13,rw*2-12,13);c.strokeStyle='#1d1b19';c.lineWidth=1.1;c.strokeRect(cx-rw+6,my-13,rw*2-12,13);
  c.fillStyle='#22201d';c.beginPath();c.moveTo(cx-rw-3,my-12);c.quadraticCurveTo(cx-rw*.5,my-15,cx,my-24);c.quadraticCurveTo(cx+rw*.5,my-15,cx+rw+3,my-12);c.closePath();c.fill();
  if(o.hp<o.max){c.fillStyle='rgba(29,27,25,.3)';c.fillRect(cx-16,my-32,32,3);c.fillStyle=ZHU;c.fillRect(cx-16,my-32,32*o.hp/o.max,3);}}
 else{c.strokeStyle='rgba(60,46,30,.85)';c.lineWidth=3.5;c.beginPath();const gy=cy*K;if(hz){c.moveTo(x0+3,gy);c.lineTo(x0+6,gy-13);c.moveTo(x0+TS-3,gy);c.lineTo(x0+TS-7,gy-10);}else{c.moveTo(cx-6,y0*K+2);c.lineTo(cx-3,y0*K-10);c.moveTo(cx+5,(y0+TS)*K);c.lineTo(cx+2,(y0+TS)*K-12);}c.stroke();}}
function drawTower(c,i){const lv=G.tower[i],p=cen(i),base=Math.max(G.map[i]===WALL||G.ramp[i]?2:0,G.elev[i])*HS,top=(Math.max(G.map[i]===WALL||G.ramp[i]?2:0,G.elev[i],1)+lv)*HS,gy=p.y*K;
 c.strokeStyle='#1d1b19';c.lineWidth=1.3;const n=Math.round((top-base)/HS);
 for(let k=0;k<n;k++){const yb=gy-base-k*HS,w=17-k*1.2;c.fillStyle=k%2?'rgba(179,159,125,.9)':'rgba(156,134,99,.9)';c.fillRect(p.x-w,yb-HS,w*2,HS);c.strokeRect(p.x-w,yb-HS,w*2,HS);
  c.beginPath();c.moveTo(p.x-w,yb);c.lineTo(p.x+w,yb-HS);c.moveTo(p.x+w,yb);c.lineTo(p.x-w,yb-HS);c.stroke();}
 const ty=gy-top;c.fillStyle='#b9a781';c.beginPath();c.moveTo(p.x-20,ty+5);c.lineTo(p.x-15,ty-7);c.lineTo(p.x+15,ty-7);c.lineTo(p.x+20,ty+5);c.closePath();c.fill();c.stroke();
 c.fillStyle='#22201d';for(let k=-18;k<16;k+=7)c.fillRect(p.x+k,ty+2,4,3.5);}

/* ---------- 军阵呼应 ---------- */
function hail(us){if(!us.length)return;us.forEach((u,j)=>{u.cheerAt=NOW+Math.min(j,8)*.05;if(j<8)G.floats.push({u,txt:'诺',t0:NOW+Math.min(j,8)*.05});});sfx('hail');if(us.some(u=>u.type==='qi'))sfx('hoof');}
function ack(us,txt){us.forEach((u,j)=>{u.ackAt=NOW;if(j<6)G.floats.push({u,txt,t0:NOW});});}

/* ---------- 绘制 ---------- */
let cvEl,ctx,nc,nctx,miniEl,mctx;
const LAY={};
function layout(fm,k,sp){const key=fm+k+'_'+sp;if(LAY[key])return LAY[key];const o=[];
 if(fm==='fang'){const c=Math.ceil(Math.sqrt(k*1.4)),r=Math.ceil(k/c);for(let i=0;i<k;i++)o.push([((r-1)/2-(i/c|0))*sp,((i%c)-(c-1)/2)*sp]);}
 else if(fm==='feng'){const rows=Math.ceil((Math.sqrt(8*k+1)-1)/2);let row=0,i=0;while(i<k){for(let j=0;j<=row&&i<k;j++,i++)o.push([((rows-1)/2-row)*sp,(j-row/2)*sp*.95]);row++;}}
 else if(fm==='yuan'){let i=0,rg=0;while(i<k){const rr=rg*sp,cnt=Math.min(k-i,rg===0?1:Math.floor(TAU*rr/sp));for(let j=0;j<cnt;j++,i++){const a=j/cnt*TAU+rg*.4;o.push([Math.cos(a)*rr,Math.sin(a)*rr]);}rg++;}}
 else{const off=k/8*.7+.5;for(let i=0;i<k;i++){const s=i%2?1:-1,q=i>>1,rk=q%2,d=(q>>1)+rk*.5;o.push([(off-d*.7-rk)*sp,s*(d+.5)*sp*.85]);}}
 return LAY[key]=o;}
const PX=new Float32Array(64),PY=new Float32Array(64),PH=new Float32Array(64),ORD=new Uint8Array(64),HALO='rgba(232,226,208,.92)';
function drawUnit(u){
 const c=ctx,col=u.side===1?INK:QING,ty=u.type,k=ty==='liang'?3:cl(Math.round(u.n/260),3,42),sp=ty==='qi'?11:ty==='nu'?9:ty==='liang'?14:8;
 const L=layout(ty==='liang'?'fang':u.fm,k,sp),cs=Math.cos(u.face),sn=Math.sin(u.face),mv=u.path.length>0,tt=G.t*9;
 const al=u.visA*(u.state==='rout'?.5:u.hidden?.55:1);if(al<=.01)return;c.globalAlpha=al;
 const ux=u.x,uy=u.y*K-hpx(u.x,u.y),ct=NOW-(u.cheerAt===undefined?-9:u.cheerAt),at=NOW-(u.ackAt===undefined?-9:u.ackAt),sel=G.sel.includes(u);
 c.fillStyle=u.hitT>0?'rgba(179,38,30,.18)':'rgba(40,38,34,.11)';c.beginPath();c.ellipse(ux,uy+1,u.r*1.08,u.r*.95*K,0,0,TAU);c.fill();
 if(sel){c.strokeStyle=ZHU;c.lineWidth=1.8;c.setLineDash([7,5]);c.lineDashOffset=-NOW*14;c.beginPath();c.ellipse(ux,uy+1,u.r*1.2+3,(u.r*1.1+3)*K,0,0,TAU);c.stroke();c.setLineDash([]);}
 if(u.build||u.make){c.strokeStyle=ZHE;c.lineWidth=3;c.beginPath();c.ellipse(ux,uy+1,u.r+7,(u.r+7)*K,0,-PI/2,-PI/2+TAU*(u.build||u.make).t);c.stroke();}
 for(let i=0;i<k;i++){let fx=L[i][0],fy=L[i][1];if(mv)fx+=Math.sin(tt+i*1.7)*.9;const wx=u.x+fx*cs-fy*sn,wy=u.y+fx*sn+fy*cs;
  let hop=0;if(ct>0&&ct<1.6){const ph=ct-Math.hypot(fx,fy)*.013;if(ph>0&&ph<.44)hop=Math.sin(ph/.44*PI)*5.5;}
  if(at>0&&at<.3)hop+=Math.sin(at/.3*PI)*2.6;if(mv)hop+=Math.abs(Math.sin(tt*.8+i*2.1))*1.1;
  PX[i]=wx;PY[i]=wy*K-hpx(wx,wy)-hop;PH[i]=hop;}
 for(let i=0;i<k;i++){let j=i;while(j>0&&PY[ORD[j-1]]>PY[i]){ORD[j]=ORD[j-1];j--;}ORD[j]=i;}
 c.fillStyle=col;c.lineCap='round';
 if(ty==='qi'){const hx=cs*4.6,hy=sn*4.6*K;
  for(let q=0;q<k;q++){const i=ORD[q];c.beginPath();c.moveTo(PX[i]-hx,PY[i]-3.5-hy);c.lineTo(PX[i]+hx,PY[i]-3.5+hy-PH[i]*.5);c.moveTo(PX[i],PY[i]-6.5);c.lineTo(PX[i],PY[i]-11);c.strokeStyle=HALO;c.lineWidth=5.6;c.stroke();
   c.strokeStyle=col;c.lineWidth=3.6;c.beginPath();c.moveTo(PX[i]-hx,PY[i]-3.5-hy);c.lineTo(PX[i]+hx,PY[i]-3.5+hy-PH[i]*.5);c.stroke();}
  c.strokeStyle=col;
  c.lineWidth=1;c.beginPath();for(let i=0;i<k;i++){c.moveTo(PX[i]-hx,PY[i]-3-hy);c.lineTo(PX[i]-hx,PY[i]+.5-hy);c.moveTo(PX[i]+hx,PY[i]-3+hy-PH[i]*.5);c.lineTo(PX[i]+hx+cs,PY[i]+.5+hy-PH[i]);
   c.moveTo(PX[i]+1.6,PY[i]-7);c.lineTo(PX[i]+1.6+cs*4,PY[i]-18-PH[i]);}c.stroke();
  c.lineWidth=2.4;c.beginPath();for(let i=0;i<k;i++){c.moveTo(PX[i],PY[i]-6.5);c.lineTo(PX[i],PY[i]-11.5);}c.stroke();}
 else if(ty==='liang'){c.lineWidth=1;for(let i=0;i<k;i++){c.fillStyle=ZHE;c.fillRect(PX[i]-7,PY[i]-9,14,7);c.strokeStyle=INK;c.strokeRect(PX[i]-7,PY[i]-9,14,7);c.beginPath();c.arc(PX[i]-4,PY[i]-1,2.4,0,TAU);c.moveTo(PX[i]+6.4,PY[i]-1);c.arc(PX[i]+4,PY[i]-1,2.4,0,TAU);c.stroke();}}
 else{const bw=ty==='dun'?3:2.6;for(let q=0;q<k;q++){const i=ORD[q];c.beginPath();c.moveTo(PX[i],PY[i]-1.5);c.lineTo(PX[i],PY[i]-6.5);c.strokeStyle=HALO;c.lineWidth=bw+1.9;c.stroke();c.strokeStyle=col;c.lineWidth=bw;c.stroke();}
  c.beginPath();
  if(ty==='ji'){c.lineWidth=.9;for(let i=0;i<k;i++){const r=PH[i]>.5?0:1;c.moveTo(PX[i]+1.7,PY[i]-1);c.lineTo(PX[i]+1.7+cs*4*r,PY[i]-14-PH[i]);}}
  else if(ty==='dun'){c.lineWidth=1;for(let i=0;i<k;i++){c.moveTo(PX[i]-1.8,PY[i]-5);c.lineTo(PX[i]-2.6-cs,PY[i]-10-PH[i]);}c.stroke();c.beginPath();c.lineCap='butt';c.lineWidth=3.4;
   for(let i=0;i<k;i++){const bx=PX[i]+cs*2.8,by=PY[i]+sn*1.4;c.moveTo(bx,by-.5);c.lineTo(bx,by-6-PH[i]*.3);}}
  else{c.lineWidth=1;for(let i=0;i<k;i++){const y0=PY[i]-5-PH[i]*.8,tx=PX[i]+cs*5.5,t2=y0+sn*3;c.moveTo(PX[i],PY[i]-5);c.lineTo(tx,t2);c.moveTo(tx-sn*2.6,t2+cs*2.6*K-1);c.lineTo(tx+sn*2.6,t2-cs*2.6*K-1);}}
  c.stroke();c.lineCap='round';}
 // 旌旗：点将时翻卷
 const g=u.general,fw=g?20:15,fh=g?26:19,py=uy-(g?48:38),wv=Math.sin(NOW*3+u.id)*1.1+(ct>0&&ct<1.3?Math.sin(ct*20)*4.5*(1-ct/1.3):0);
 c.strokeStyle=INK;c.lineWidth=1.4;c.beginPath();c.moveTo(ux,uy-1);c.lineTo(ux,py-2);c.stroke();
 c.fillStyle=ty==='liang'?ZHE:u.side===1?ZHU:QING;c.beginPath();c.moveTo(ux,py);c.lineTo(ux+fw,py+wv);c.lineTo(ux+fw,py+fh+wv);c.lineTo(ux,py+fh);c.closePath();c.fill();
 if(g){c.strokeStyle='#c9a45a';c.lineWidth=1.6;c.stroke();}
 c.fillStyle='#f4efe2';c.font=(g?17:13)+'px '+BRUSH;c.textAlign='center';c.textBaseline='middle';c.fillText(g?(u.side===1?'帅':'将'):UT[u.kind].ch,ux+fw/2,py+fh/2+1+wv/2);
 const st=u.state==='rout'?'溃':u.death?'死':u.man?'抄':u.make?'造':u.build?'筑':u.hidden?'伏':u.hold?'守':u.march&&mv?'疾':'';
 if(st){c.fillStyle=u.state==='rout'||u.death?ZHU:INK;c.font='13px '+BRUSH;c.fillText(st,ux+fw+9,py+8);}
 if(u.gear||u.make){const gg=u.gear||u.make.g,dir=cs>=0?1:-1;c.save();c.translate(ux+dir*(u.r+13),uy+sn*6);c.scale(dir,1);if(!u.gear)c.globalAlpha=al*.4;c.strokeStyle=INK;c.fillStyle=ZHE;c.lineWidth=1.3;
  if(gg==='ram'){c.fillRect(-11,-10,22,7);c.strokeRect(-11,-10,22,7);c.beginPath();c.moveTo(-13,-10);c.lineTo(0,-17);c.lineTo(13,-10);c.stroke();c.lineWidth=3;c.beginPath();c.moveTo(-8,-6.5);c.lineTo(17,-6.5);c.stroke();c.fillStyle=INK;c.beginPath();c.arc(-6,-1.5,2.8,0,TAU);c.arc(6,-1.5,2.8,0,TAU);c.fill();}
  else if(gg==='ladder'){c.beginPath();c.moveTo(-8,0);c.lineTo(3,-26);c.moveTo(-2,0);c.lineTo(9,-26);for(let q=1;q<6;q++){c.moveTo(-8+q*1.85,-q*4.3);c.lineTo(-2+q*1.85,-q*4.3);}c.stroke();}
  else{c.fillRect(-10,-4,20,4);c.strokeRect(-10,-4,20,4);c.beginPath();c.moveTo(-6,-4);c.lineTo(0,-15);c.lineTo(6,-4);c.stroke();c.lineWidth=2;c.beginPath();c.moveTo(-11,-21);c.lineTo(10,-9);c.stroke();c.fillStyle=INK;c.beginPath();c.arc(-11,-21,3,0,TAU);c.fill();}
  c.restore();c.globalAlpha=al;}
 if(ty!=='liang'){const bw=34,bx=ux-bw/2,by=uy+u.r*.95*K+6;c.fillStyle='rgba(29,27,25,.16)';c.fillRect(bx,by,bw,2.2);c.fillRect(bx,by+3.4,bw,2.2);
  c.fillStyle=INK;c.fillRect(bx,by,bw*cl(u.n/u.nMax,0,1),2.2);c.fillStyle=u.morale<35?ZHU:ZHE;c.fillRect(bx,by+3.4,bw*u.morale/100,2.2);}
 c.globalAlpha=1;
}
function drawPoint(c,p){const gy=p.y*K-hpx(p.x,p.y);
 if(p.prog>0){c.strokeStyle=p.side===1?QING:ZHU;c.lineWidth=3;c.beginPath();c.ellipse(p.x,gy,26,26*K,0,-PI/2,-PI/2+TAU*p.prog);c.stroke();}
 c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(p.x,gy);c.lineTo(p.x,gy-58);c.stroke();
 const wv=Math.sin(NOW*3)*2;c.fillStyle=p.side===1?ZHU:QING;c.beginPath();c.moveTo(p.x,gy-58);c.lineTo(p.x+14+wv,gy-56);c.lineTo(p.x+13-wv,gy-20);c.lineTo(p.x,gy-22);c.closePath();c.fill();
 c.fillStyle='#f4efe2';c.font='12px '+BRUSH;c.textAlign='center';c.textBaseline='middle';[...p.name].forEach((ch,k)=>c.fillText(ch,p.x+7,gy-48+k*13));}
const DYN=[];
function render(){
 const zm=Math.max(.5,W/WW,H/(WH*K+260));if(cam.z<zm)cam.z=zm;
 const c=ctx,z=cam.z,g=G,vh=H/z/K;
 cam.x=cl(cam.x,0,Math.max(0,WW-W/z));cam.y=vh>WH+150?(WH-vh)/2-20:cl(cam.y,-130,WH-vh+20+120/z/K);
 c.setTransform(dpr,0,0,dpr,0,0);c.fillStyle=PAPER;c.fillRect(0,0,W,H);
 // 地面：平铺的画纸按纵深压缩
 c.setTransform(dpr*z,0,0,dpr*z*K,-cam.x*z*dpr,-cam.y*K*z*dpr);
 const sx=Math.floor(cam.x),sy=Math.max(0,Math.floor(cam.y)),sw=Math.min(WW-sx,Math.ceil(W/z)+2),sh=Math.min(WH-sy,Math.ceil(vh)+2+Math.min(0,Math.floor(cam.y)));
 if(sh>0)c.drawImage(g.ground,sx,sy,sw,sh,sx,sy,sw,sh);
 c.setTransform(dpr*z,0,0,dpr*z,-cam.x*z*dpr,-cam.y*K*z*dpr);
 {const gy=WH*K;let gr=c.createLinearGradient(0,0,0,60);gr.addColorStop(0,PAPER);gr.addColorStop(1,'rgba(230,223,204,0)');c.fillStyle=gr;c.fillRect(cam.x-2,-1,W/z+4,61);
  gr=c.createLinearGradient(0,gy-60,0,gy);gr.addColorStop(0,'rgba(230,223,204,0)');gr.addColorStop(1,PAPER);c.fillStyle=gr;c.fillRect(cam.x-2,gy-60,W/z+4,61);}
 const x0=cam.x-70,x1=cam.x+W/z+70,k0=cam.y-40,k1=cam.y+vh+190;
 // 立体之物与军阵：由远及近
 DYN.length=0;for(const u of g.units)DYN.push({k:u.y,u});for(const p of g.points)DYN.push({k:p.y,p});for(const o of g.gates)DYN.push({k:o.ty*TS+.2,o});
 for(let i=0;i<MW*MH;i++)if(g.tower[i])DYN.push({k:(i/MW|0)*TS+.4,tw:i});
 DYN.sort((a,b)=>a.k-b.k);
 const P=g.props;let lo=0,hi=P.length;while(lo<hi){const m=(lo+hi)>>1;if(P[m].k<k0)lo=m+1;else hi=m;}
 let di=0;const dyn=d=>{if(d.u)drawUnit(d.u);else if(d.p)drawPoint(c,d.p);else if(d.o)drawGate(c,d.o);else drawTower(c,d.tw);};
 for(let pi=lo;pi<P.length;pi++){const p=P[pi];if(p.k>k1)break;
  while(di<DYN.length&&DYN[di].k<=p.k)dyn(DYN[di++]);
  if(p.type==='w'){if(g.map[p.i]===WALL&&p.tx*TS>x0-TS&&p.tx*TS<x1)drawWall(c,p);}
  else if(p.type==='r'){if(p.tx*TS>x0-TS&&p.tx*TS<x1)drawRamp(c,p);}
  else{if(p.x<x0||p.x>x1||(p.type==='t'&&g.map[p.i]!==FOREST))continue;const s=p.s;c.drawImage(s.cv,p.x-s.ox,p.sy-s.oy);}}
 while(di<DYN.length)dyn(DYN[di++]);
 // 火
 for(const[i]of g.fires){const p=cen(i),gy=p.y*K-hpx(p.x,p.y);for(let k=0;k<4;k++){const fx=p.x+Math.sin(i*3.1+k*2.3)*13,fy=gy+Math.cos(i*1.7+k*1.9)*7-8,r=9+6*Math.sin(g.t*9+k*2+i);
  const gr=c.createRadialGradient(fx,fy,1,fx,fy-4,r+8);gr.addColorStop(0,'rgba(214,74,38,.85)');gr.addColorStop(.6,'rgba(179,38,30,.4)');gr.addColorStop(1,'rgba(179,38,30,0)');c.fillStyle=gr;c.beginPath();c.ellipse(fx,fy-4,r+5,r+10,0,0,TAU);c.fill();}
  const sm=(g.t*22+i*7)%44;c.fillStyle='rgba(40,38,36,'+(.25*(1-sm/44))+')';c.beginPath();c.arc(p.x+Math.cos(g.wind)*sm+4,gy-16-sm*1.2,6+sm*.3,0,TAU);c.fill();}
 // 地面标记
 for(const r of g.rings){const gy=r.y*K-hpx(r.x,r.y),rr=6+r.t*46;c.globalAlpha=1-r.t/.6;c.strokeStyle=r.c;c.lineWidth=2.5;c.beginPath();c.ellipse(r.x,gy,rr,rr*K,0,0,TAU);c.stroke();}c.globalAlpha=1;
 for(const u of g.sel){const uy=u.y*K-hpx(u.x,u.y);
  if(UT[u.kind].range||u.gear==='cata'){const rr=UT[u.kind].range?rangeOf(u):bombR(u);c.strokeStyle='rgba(179,38,30,.3)';c.lineWidth=1;c.setLineDash([3,7]);c.beginPath();c.ellipse(u.x,uy,rr,rr*K,0,0,TAU);c.stroke();c.setLineDash([]);}
  if(u.path.length){c.strokeStyle='rgba(29,27,25,.34)';c.lineWidth=1.2;c.setLineDash([2,6]);c.beginPath();c.moveTo(u.x,uy);for(const p of u.path)c.lineTo(p.x,p.y*K-hpx(p.x,p.y));c.stroke();c.setLineDash([]);}}
 c.lineCap='round';for(const a of g.arrows){if(a.t<0)continue;if(a.h0===undefined){a.h0=hpx(a.x0,a.y0)+7;a.h1=hpx(a.x1,a.y1)+4;}
  const f=a.t/a.d,L=Math.hypot(a.x1-a.x0,a.y1-a.y0),ay0=a.y0*K-a.h0,ay1=a.y1*K-a.h1;
  if(a.stone){const hh=L*.45;c.fillStyle=INK;c.beginPath();c.arc(a.x0+(a.x1-a.x0)*f,ay0+(ay1-ay0)*f-Math.sin(f*PI)*hh,3.6,0,TAU);c.fill();continue;}
  const f2=Math.min(1,f+.09),h=L*.26;
  c.strokeStyle=a.fire?ZHU:'rgba(29,27,25,.78)';c.lineWidth=a.fire?1.8:1;c.beginPath();c.moveTo(a.x0+(a.x1-a.x0)*f,ay0+(ay1-ay0)*f-Math.sin(f*PI)*h);c.lineTo(a.x0+(a.x1-a.x0)*f2,ay0+(ay1-ay0)*f2-Math.sin(f2*PI)*h);c.stroke();}
 c.fillStyle=INK;for(const p of g.parts){c.globalAlpha=Math.min(1,p.l*2.2)*.7;c.beginPath();c.arc(p.x,p.y*K-hpx(p.x,p.y)-4,p.r,0,TAU);c.fill();}c.globalAlpha=1;
 // 题字：立于纸上
 for(const L of g.M.labels||[]){const s=L.s||30,lx=L.x*TS,ly=L.y*TS;c.font=s+'px '+BRUSH;c.textAlign='center';c.textBaseline='middle';c.fillStyle='rgba(29,27,25,.5)';
  const gy=ly*K-hpx(lx,ly);[...L.t].forEach((ch,k)=>c.fillText(ch,lx,gy+k*s*1.02-s*.4));}
 // 应声
 c.textAlign='center';c.textBaseline='middle';for(const f of g.floats){const a=NOW-f.t0;if(a<0||!f.u.alive)continue;const u=f.u,fy=u.y*K-hpx(u.x,u.y)-58-a*20;c.globalAlpha=cl(1.5-a*1.6,0,1);
  c.font=(20+Math.min(a,.15)*40)+'px '+BRUSH;c.lineWidth=3;c.strokeStyle='rgba(230,223,204,.85)';c.strokeText(f.txt,u.x-8,fy);c.fillStyle=f.txt==='杀'||f.txt==='轰'?ZHU:INK;c.fillText(f.txt,u.x-8,fy);}
 c.globalAlpha=1;if(g.floats.length)g.floats=g.floats.filter(f=>NOW-f.t0<1&&f.u.alive);
 // 屏幕层：天气、夜色
 c.setTransform(dpr,0,0,dpr,0,0);
 if(g.weather==='rain'){c.fillStyle='rgba(70,78,84,.13)';c.fillRect(0,0,W,H);c.strokeStyle='rgba(29,27,25,.28)';c.lineWidth=1;c.beginPath();
  for(let i=0;i<130;i++){const px=((i*131.7+g.t*240)%(W+80))-40,py=((i*71.3+i*i*3.1+g.t*830)%(H+60))-30;c.moveTo(px,py);c.lineTo(px-5,py+17);}c.stroke();}
 else if(g.weather==='fog'){c.fillStyle='rgba(236,232,220,.3)';c.fillRect(0,0,W,H);for(let i=0;i<9;i++){const px=((i*217+g.t*11)%(W+560))-280,py=(i*149)%Math.max(1,H),r=230+(i%3)*90;
  const gr=c.createRadialGradient(px,py,10,px,py,r);gr.addColorStop(0,'rgba(240,236,224,.55)');gr.addColorStop(1,'rgba(240,236,224,0)');c.fillStyle=gr;c.fillRect(px-r,py-r,r*2,r*2);}}
 if(g.windStr>1){c.strokeStyle='rgba(29,27,25,.14)';c.lineWidth=1;c.beginPath();const wx=Math.cos(g.wind),wy=Math.sin(g.wind);
  for(let i=0;i<22;i++){const s=(i*97.1+g.t*190)%(W+H),px=((i*173.3)%W)+wx*s-wx*(W+H)/2,py=((i*89.7)%H)+wy*s-wy*(W+H)/2;c.moveTo(px,py);c.quadraticCurveTo(px+wx*20-wy*4,py+wy*20+wx*4,px+wx*42,py+wy*42);}c.stroke();}
 const d=dark();
 if(d>.02){const w=nc.width,h=nc.height,x=nctx,s=w/W;x.globalCompositeOperation='source-over';x.clearRect(0,0,w,h);x.fillStyle='rgba(16,22,36,'+(.68*d)+')';x.fillRect(0,0,w,h);x.globalCompositeOperation='destination-out';
  const hole=(wx,wy,rr,a)=>{const px=(wx-cam.x)*z*s,py=((wy-cam.y)*K-hpx(wx,wy))*z*s,r=rr*z*s;if(px<-r||py<-r||px>w+r||py>h+r)return;x.save();x.translate(px,py);x.scale(1,K);const gr=x.createRadialGradient(0,0,r*.15,0,0,r);gr.addColorStop(0,'rgba(0,0,0,'+a+')');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.beginPath();x.arc(0,0,r,0,TAU);x.fill();x.restore();};
  for(const u of g.units)if(u.side===1)hole(u.x,u.y,visionOf(u),.8);for(const[i]of g.fires){const p=cen(i);hole(p.x,p.y,130,.7);}
  c.drawImage(nc,0,0,W,H);}
 if(drag&&drag.mode==='box'&&drag.moved){c.strokeStyle=ZHU;c.lineWidth=1.2;c.setLineDash([5,4]);c.strokeRect(drag.sx,drag.sy,drag.x-drag.sx,drag.y-drag.sy);c.setLineDash([]);}
 if(g.tacMode){c.fillStyle=ZHU;c.font='20px '+BRUSH;c.textAlign='center';c.fillText(TAC[g.tacMode]+'：点选敌军',W/2,H-150);}
 if(g.fireMode){c.fillStyle=ZHU;c.font='20px '+BRUSH;c.textAlign='center';c.fillText('火攻：点选林地或敌营',W/2,H-150);}
}
function drawMini(){const c=mctx,g=G;c.clearRect(0,0,180,114);c.drawImage(g.mini,0,0);const s=180/WW;
 for(const p of g.points){c.fillStyle=p.side===1?ZHU:QING;c.fillRect(p.x*s-2,p.y*s-5,4,7);}
 for(const u of g.units){if(u.side===2&&!u.vis)continue;c.fillStyle=u.type==='liang'?ZHE:u.side===1?ZHU:QING;c.beginPath();c.arc(u.x*s,u.y*s,u.general?3.2:2.3,0,TAU);c.fill();}
 c.strokeStyle=INK;c.lineWidth=1;c.strokeRect(cam.x*s,Math.max(0,cam.y)*s,W/cam.z*s,Math.min(WH,H/cam.z/K)*s);}

/* ---------- 军报、兵法题句、界面 ---------- */
function msg(t,kind){const box=$('log');if(!box)return;const d=document.createElement('div');d.className='ln '+(kind||'');d.textContent=t;box.appendChild(d);if(kind==='warn')sfx('horn');else if(kind==='good')sfx('pluck');G.msgN=(G.msgN||0)+1;
 setTimeout(()=>{try{d.remove();}catch(e){}},6500);}
let qTimer=0;
function quote(k){if(!G||G.t-(G.qt[k]||-999)<75||G.t-G.qLast<8)return;G.qt[k]=G.t;G.qLast=G.t;const q=QUOTES[k],el=$('quote');
 sfx('qin');$('qtext').textContent=q[0];$('qsrc').textContent='孙子 '+q[1];el.classList.add('on');clearTimeout(qTimer);qTimer=setTimeout(()=>el.classList.remove('on'),5200);}
function setWeather(w,wind,str){G.weather=w;if(wind!==undefined)G.wind=wind;G.windStr=str||1;if(w==='rain'){quote('rain');}if(w==='fog')quote('fog');}
const WN={sun:'晴',rain:'雨',fog:'雾'},WD=['西','西北','北','东北','东','东南','南','西南'];
let hudCache={};
function setH(id,html){if(hudCache[id]!==html){hudCache[id]=html;$(id).innerHTML=html;}}
function hud(){
 const g=G,h=hourOf(),d=dark();
 setH('clock',HN[h|0]+'时<small>'+(d>.5?'夜':d>0?'昏':'昼')+'</small>');
 const wi=((Math.round(g.wind/(PI/4))%8)+8)%8;
 setH('wx',WN[g.weather]+'<small>'+(g.windStr>1?'大':'')+WD[wi]+'风</small>');
 let gr='';if(g.grain[1]!==null)gr+='军粮 '+Math.ceil(g.grain[1]);if(g.grain[2]!==null)gr+=(gr?'　':'')+'敌粮 '+Math.ceil(g.grain[2]);
 let tot=0;for(const u of g.units)if(u.side===1&&u.type!=='liang')tot+=u.n;
 setH('force',(gr?gr+'　':'')+'我军 '+Math.round(tot/100)/10+' 千');
 setH('objlist',g.M.obj(g).map(o=>'<li class="'+(o[1]>0?'ok':o[1]<0?'bad':'')+'">'+o[0]+'</li>').join(''));
 const s=selOK();let info;
 if(!s.length)info='点选我军军阵以下令。'+(touchy?'轻点地面行军，轻点敌阵进攻。':'右键行军或进攻，拖框多选。');
 else if(s.length===1){const u=s[0],t=tAtU(u);info='<b>'+u.name+'</b>　兵 '+Math.round(u.n)+'　士气 '+Math.round(u.morale)+'　体力 '+Math.round(u.stam)+'　'+FM[u.fm].name+(UT[u.kind].weapon?'　'+UT[u.kind].weapon:'')+'　地势 '+elevOf(u)+(u.gear?'　'+GN[u.gear]:'')+(G.gap[tileIdx(u.x,u.y)]?'　<i>隘口</i>':'')+
  (u.hidden?'　<i>伏</i>':u.hold?(u.holdT>8?'　<i>深沟高垒</i>':'　<i>镇守</i>'):'')+(u.death?'　<i>死战</i>':'')+'<br><small>'+TNAME[t]+(TNOTE[t]?'：'+TNOTE[t]:'')+(G.gap[tileIdx(u.x,u.y)]?'　隘口：每阵至多 '+frontage(G.gap[tileIdx(u.x,u.y)])+' 人接战，大军施展不开':'')+'</small>';}
 else{let n=0;for(const u of s)n+=u.n;info='<b>'+s.length+' 阵</b>　共 '+Math.round(n)+' 人';}
 setH('selinfo',info);
 const bs=$('btns').children;for(let i=0;i<bs.length;i++){const b=bs[i],c=b.dataset.c;let on=false;
  if(s.length){if(c==='hold')on=s.every(u=>u.hold);else if(c==='build')on=s.every(u=>u.build);else if(c==='siege')on=s.every(u=>u.gear||u.make);else if(c==='march')on=s.every(u=>u.march);else if(FM[c])on=s.every(u=>u.fm===c);}
  if(c==='fire')on=!!g.fireMode;if(c==='tac')on=!!g.tacMode||(s.length>0&&s.some(u=>u.man));b.classList.toggle('on',on);}
 setH('bsnd',D.snd?'有声':'静音');ambient();
 setH('bpause',g.paused?'继续':'暂停');setH('bspeed',g.speed===2?'缓行':'快进');
}

/* ---------- 战役 ---------- */
const pt=(tx,ty,side,name,time)=>({x:tx*TS,y:ty*TS,side,name,r:85,prog:0,time:time||8});
const MISSIONS=[
{name:'坚壁',ord:'其一',role:'赵 上将军廉颇',seed:11,hour0:5,hourLen:40,face:{1:PI,2:0},cam:[36,18],
 line:'守丹水壁垒，护住东北粮道，撑到粮队入营。',
 brief:'周赧王五十三年，秦左庶长王龁夺上党，兵锋直指长平。赵军初战不利，廉颇退守丹水东岸，筑垒坚壁。秦军远来，利在速战；我军粮草自东北故关而来，粮至则军心定。',
 goals:['守住大营帅旗','三支粮队至少两支入营','廉颇不可阵亡'],
 tips:['弩手已登西门两侧箭楼：地势越高，射得越远、杀伤越重。可令步卒“筑楼”再加高。','秦军渡浅滩时出击，半渡而击，事半功倍。','秦骑劫粮必经营北的“北隘”：令一阵戟兵镇守隘口，敌军施展不开，可以少胜多；隘东山丘可伏弩手。','午后有雨，弩矢乏力，当以戟盾当先；入夜后目力所及大减。'],
 labels:[{t:'丹水',x:24.6,y:13,s:34},{t:'故关',x:57,y:6.2,s:26},{t:'赵垒',x:45.5,y:15,s:26},{t:'北隘',x:42,y:10.2,s:22}],
 win:'廉颇坚壁不出，秦军顿兵垒下，三年不得进。然赵王数责其怯战，终以赵括代之。',
 setup(g){const b=build(g);
  b.river([[21,0],[20,8],[23,18],[21,28],[22,37]]);
  b.road([[0,10],[14,9],[28,10],[36,17],[37,18]]);b.road([[0,27],[15,27],[29,26],[36,20],[37,18]]);b.road([[59,3],[52,10],[52,19],[49,19]]);
  b.fort(38,13,48,24,1,[[38,18,1800],[48,19,1000]]);
  b.cliff([[44,0],[44,10]],1);b.blob(30,4,4.5,HILL);b.blob(31,33,4.5,HILL);b.blob(56,26,4,HILL);b.blob(47,6,3,HILL);b.blob(8,18,3,HILL);
  b.blob(28,15,3,FOREST);b.blob(30,22,3,FOREST);b.blob(10,5,3.5,FOREST);b.blob(11,33,3.5,FOREST);b.blob(56,13,3,FOREST);b.blob(14,20,2.5,MARSH);
  g.points.push(pt(43.5,19,1,'帅旗'));g.grain[1]=70;g.convArr=0;g.convLost=0;
  g.gen[1]=spawn(1,'dun',4000,43,18,{general:true,name:'廉颇亲卫',hold:true});
  spawn(1,'nu',4000,39,17,{hold:true});spawn(1,'nu',4000,39,19,{hold:true});
  spawn(1,'ji',5000,34,17);spawn(1,'ji',5000,34,20);spawn(1,'dun',5000,35,18);spawn(1,'ji',4000,36,22);
  spawn(1,'qi',3000,51,13);spawn(1,'qi',3000,50,16);
  setWeather('sun',0,1);},
 events:[
  {t:4,f:g=>msg('斥候来报：秦军前锋已至丹水西岸','warn')},
  {t:12,f:g=>wave(g,[['ji',5000,1,26],['dun',4000,1,28],['nu',3000,0,27]])},
  {t:55,f:g=>{msg('秦骑自北浅滩渡河，直扑东北粮道！','warn');spawn(2,'qi',3000,1,9,{ai:aslt(53.5*TS,8*TS,{pref:'liang',aggro:300,focus:true})});}},
  {t:95,f:g=>convoy(g)},
  {t:110,f:g=>{setWeather('rain',PI*.25,1);msg('天降大雨，弩弦受潮，道路泥泞');}},
  {t:125,f:g=>wave(g,[['ji',5000,1,9],['ji',5000,1,11],['nu',4000,0,10],['qi',3000,2,8]])},
  {t:178,f:g=>{setWeather('sun',0,1);msg('雨歇');}},
  {t:185,f:g=>{msg('又一队秦骑绕向粮道','warn');spawn(2,'qi',3000,1,8,{ai:aslt(54*TS,7*TS,{pref:'liang',aggro:300,focus:true})});spawn(2,'qi',2500,1,10,{ai:aslt(52.5*TS,15*TS,{pref:'liang',aggro:300,focus:true})});}},
  {t:215,f:g=>convoy(g)},
  {t:235,f:g=>{msg('暮色四合，秦军倾营来攻','warn');wave(g,[['ji',6000,1,26],['dun',5000,1,28],['ji',4000,1,10],['nu',4000,0,27],['qi',3000,2,25]]);}},
  {t:290,f:g=>{msg('夜色中又有秦骑潜向粮道','warn');spawn(2,'qi',3000,1,9,{ai:aslt(54*TS,8*TS,{pref:'liang',aggro:300,focus:true})});}},
  {t:325,f:g=>convoy(g)}],
 tick(g,dt){g.grain[1]=Math.max(0,g.grain[1]-dt*.2*D.pace/100);
  for(const u of g.units)if(u.type==='liang'&&u.alive&&(dist(u,g.points[0])<90||!u.path.length)){if(dist(u,g.points[0])<160){u.alive=false;g.convArr++;g.grain[1]=Math.min(100,g.grain[1]+35);g.flags.st=0;msg('粮队入营，军心大定','good');for(const o of g.units)if(o.side===1)o.morale=Math.min(100,o.morale+12);}else{u.path=findPath(u,g.points[0].x+40,g.points[0].y);}}if(g.grain[1]<=0&&!g.flags.st){g.flags.st=1;msg('军中粮尽，士卒饥疲','warn');quote('supply');}},
 obj(g){return[['守住大营帅旗',g.points[0].side===1?0:-1],['粮队入营 '+g.convArr+'/2（已失 '+g.convLost+'）',g.convArr>=2?1:g.convLost>=2?-1:0],['廉颇无恙',g.gen[1].alive?0:-1]];},
 check(g){if(!g.gen[1].alive)return['lose','廉颇阵亡，赵军无主'];if(g.points[0].side!==1)return['lose','帅旗被夺，壁垒已破'];if(g.convLost>=2)return['lose','粮道断绝，军无粮食则亡'];
  if(g.convArr>=2&&g.convArr+g.convLost>=3)return['win'];return null;}},
{name:'拔垒',ord:'其二',role:'秦 左庶长王龁',seed:23,hour0:3.7,hourLen:85,paceTime:true,face:{1:0,2:PI},cam:[12,19],
 line:'渡丹水，破垒门，日落前夺下赵军西垒壁。',
 brief:'赵军坚壁不出，秦军屡挑不战。王龁决意强攻，先拔丹水东岸的西垒壁。垒在山前，西门坚厚，南门新筑未固；北渡口有弩手据高而守，南路林深，恐有伏兵。',
 goals:['戌时（日落）之前夺取西垒壁帅旗：驻军旗下，肃清守军','王龁不可阵亡'],
 tips:['晨雾未散时渡河，敌弩射程大减。垒门两侧有箭楼，仰攻吃亏，可先以盾兵当矢。','南路密林可令弩手火攻，逼出伏兵；午后起大西风，火借风势向东蔓延。','垒墙坚厚：令步卒造“攻城器”——冲车撞门，云梯翻墙，发石车远轰城垣与箭楼。','南路须过“谷道”，谷口有盾兵扼守，大军施展不开；可绕行，或以弩手居高射之。','用“战术”：一阵分兵两翼包抄，或前军镇守、后军绕后夹击，侧背受击的敌军伤亡与士气损失大增。'],
 labels:[{t:'丹水',x:18.6,y:15,s:34},{t:'西垒壁',x:49.5,y:14.2,s:26},{t:'谷道',x:36.5,y:25.6,s:22}],
 win:'秦攻其垒，取二尉，败其阵，夺西垒壁。赵军退守，自此不敢出。',
 setup(g){const b=build(g);
  b.river([[16,0],[15,10],[17,20],[15,30],[16,37]]);
  b.road([[0,10],[15,10],[26,12],[38,17],[39,18]]);b.road([[0,29],[15,29],[26,30],[38,30],[46,27],[46,26]]);
  b.fort(40,12,52,25,2,[[40,18,1500],[46,25,650]]);
  b.cliff([[32,28.2],[41,28.2]],1);b.cliff([[32,31.8],[42,31.8]],1);b.blob(20,7,3,HILL);b.blob(46,6,5,HILL);b.blob(57,18,3.5,HILL);b.blob(33,22,2.5,HILL);b.blob(6,5,3,HILL);
  b.blob(25,30,4.5,FOREST);b.blob(31,14,2.5,FOREST);b.blob(7,19,3,FOREST);b.blob(55,32,4,FOREST);b.blob(33,35,2.5,MARSH);
  g.points.push(pt(46.5,18.5,2,'帅旗',9));
  g.gen[1]=spawn(1,'dun',4000,6,19,{general:true,name:'王龁亲卫'});
  spawn(1,'ji',6000,9,16);spawn(1,'ji',6000,9,22);spawn(1,'dun',5000,10,18);spawn(1,'dun',5000,10,20);
  spawn(1,'nu',4000,7,16);spawn(1,'nu',4000,7,22);spawn(1,'qi',4000,5,14);spawn(1,'qi',4000,5,24);
  g.gen[2]=spawn(2,'dun',3500,46,19,{general:true,name:'赵都尉亲卫',ai:guard(46,19,200)});
  spawn(2,'ji',4000,42,18,{ai:guard(42,18,150)});
  spawn(2,'nu',3000,41,17,{ai:guard(41,17,0,{stay:true}),hold:true});spawn(2,'nu',2500,45,24,{ai:guard(45,24,0,{stay:true}),hold:true});
  spawn(2,'ji',3000,46,23,{ai:guard(46,23,150)});
  spawn(2,'nu',3000,19,8,{ai:guard(19,8,0,{stay:true}),hold:true,fm:'yan'});spawn(2,'ji',3000,19,10,{ai:guard(19,10,170)});
  spawn(2,'ji',3500,24,28,{ai:guard(24,28,220),hold:true,holdT:10});spawn(2,'dun',2500,40,30,{ai:guard(40,30,120),hold:true,holdT:10});
  spawn(2,'qi',3000,55,10,{ai:guard(55,10,200),tag:'sortie'});spawn(2,'qi',3000,55,27,{ai:guard(55,27,200),tag:'sortie'});
  setWeather('fog',0,1);},
 events:[
  {t:3,f:g=>msg('拂晓，晨雾弥漫，正宜渡河')},
  {t:85,f:g=>{setWeather('sun',0,1);msg('雾散日出');}},
  {t:170,f:g=>{setWeather('sun',0,2);msg('大西风起，火攻正当其时','good');}},
  {t:180,f:g=>{msg('赵军骑兵出垒逆袭！','warn');const p=g.gen[1];for(const u of g.units)if(u.tag==='sortie')u.ai=aslt(p.x,p.y,{pref:'nu',aggro:300});}},
  {t:330,f:g=>msg('日已西斜，须速破垒','warn')}],
 obj(g){const left=Math.max(0,(10-g.hour0)*g.hourLen-g.t);return[['夺取西垒壁帅旗',g.points[0].side===1?1:0],['日落之前（尚余 '+(left/g.hourLen).toFixed(1)+' 时辰）',left>0?0:-1],['王龁无恙',g.gen[1].alive?0:-1]];},
 check(g){if(!g.gen[1].alive)return['lose','王龁阵亡'];if(g.points[0].side===1||!g.units.some(u=>u.side===2))return['win'];if(g.t>(10-g.hour0)*g.hourLen)return['lose','日落垒未下，师老兵疲'];return null;}},
{name:'合围',ord:'其三',role:'秦 武安君白起',seed:37,hour0:4,hourLen:50,face:{1:0,2:PI},cam:[16,18],
 line:'正兵守秦壁，奇兵绝粮道，围歼赵括大军。',
 brief:'赵王中反间之计，以赵括代廉颇。赵括尽起大军渡丹水来攻。秦王密令白起为上将军，军中敢泄者斩。白起佯败退入秦壁，另遣奇兵绕出赵军之后，断其营垒粮道。',
 goals:['守住秦壁帅旗','奇兵夺取东北“粮道”并坚守，待赵军粮尽','斩赵括，或迫赵军溃降'],
 tips:['正兵退入垒内镇守，以逸待劳；弩手已登门楼，居高射敌。','南北山林中各伏奇兵（镇守于林，敌不能察），沿山间小径东进，夺粮道；骑兵莫离小径，穿林攀险战马折损。','粮道一断，赵军必回师死战突围：粮道南侧是两山夹峙的隘口，以一阵镇守其中，赵军虽众，每次只能上来两三千人。','赵军粮尽则士气日衰，终将弃甲请降。'],
 labels:[{t:'丹水',x:33.6,y:21,s:34},{t:'秦壁',x:11.5,y:15,s:26},{t:'赵营',x:52.5,y:19.6,s:26},{t:'粮道',x:57.3,y:3.4,s:24},{t:'隘',x:55.2,y:9.2,s:22}],
 win:'赵军绝粮四十六日，赵括出锐卒自搏战，秦军射杀之。括军败，卒四十万人降武安君。',
 setup(g){const b=build(g);
  b.river([[31,0],[30,10],[32,19],[30,28],[31,37]]);
  b.road([[15,18],[30,14],[45,16],[50,18]]);b.road([[15,19],[31,25],[45,22],[50,19]]);b.road([[59,2],[55,7],[51,13],[50,17]]);
  b.road([[24,4],[40,3],[52,4],[55,7]]);b.road([[26,34],[36,35],[48,30],[52,24]]);
  b.fort(5,13,14,24,1,[[14,18,2400]]);b.camp(46,14,54,23,2);
  b.cliff([[43,7],[49,7],[51,10]],1);b.cliff([[59,11],[56,9.6],[54.4,12.6]],1.3);b.blob(20,3,4,HILL);b.blob(36,6,3,HILL);b.blob(46,10,2.5,HILL);b.blob(20,34,4,HILL);b.blob(40,32,3,HILL);b.blob(57,7,2,HILL);b.blob(57,30,3.5,HILL);
  b.blob(27,5,3.5,FOREST);b.blob(28,33,3.5,FOREST);b.blob(42,27,2.6,FOREST);b.blob(40,10,2.5,FOREST);b.blob(22,25,2.5,MARSH);
  g.points.push(pt(10,19,1,'帅旗'));g.points.push(pt(55.5,7.5,2,'粮道',12));g.grain[2]=100;
  g.gen[1]=spawn(1,'dun',5000,9,18,{general:true,name:'白起亲卫',hold:true});
  spawn(1,'nu',5000,13,17,{hold:true});spawn(1,'nu',5000,13,19,{hold:true});
  spawn(1,'ji',6000,17,17);spawn(1,'ji',6000,17,20);spawn(1,'dun',5000,16,18);
  spawn(1,'qi',5000,27,6,{hold:true,holdT:10,name:'奇兵骑甲阵'});spawn(1,'ji',5000,26,6,{hold:true,holdT:10,name:'奇兵戟甲阵'});spawn(1,'nu',3000,28,5,{hold:true,holdT:10,name:'奇兵弩甲阵'});
  spawn(1,'ji',6000,27,32,{hold:true,holdT:10,name:'奇兵戟乙阵'});spawn(1,'nu',3000,27,31,{hold:true,holdT:10,name:'奇兵弩乙阵'});spawn(1,'dun',5000,29,32,{hold:true,holdT:10,name:'奇兵盾甲阵'});spawn(1,'qi',2500,28,31,{hold:true,holdT:10,name:'奇兵骑乙阵'});
  const f=g.points[0];
  g.gen[2]=spawn(2,'dun',5000,27,18,{general:true,name:'赵括亲卫',ai:guard(27,18,200)});
  spawn(2,'ji',6000,22,16,{ai:aslt(f.x,f.y),gear:D.wit>=3?'ram':null});spawn(2,'ji',6000,22,21,{ai:aslt(f.x,f.y)});spawn(2,'dun',5000,23,18,{ai:aslt(f.x,f.y)});spawn(2,'nu',4000,25,17,{ai:aslt(18*TS,18*TS)});
  for(const[t,n,x,y]of[['ji',6000,28,15],['ji',6000,28,22],['dun',5000,29,19],['nu',4000,29,16],['qi',3500,27,13],['qi',3500,27,24]])spawn(2,t,n,x,y,{ai:guard(x,y,160),tag:'second'});
  spawn(2,'ji',4000,50,19,{ai:guard(50,19,220),tag:'camp'});spawn(2,'nu',3000,50,16,{ai:guard(50,16,0,{stay:true}),hold:true});
  spawn(2,'ji',3500,55,8,{ai:guard(55,8,180)});spawn(2,'nu',2500,57,10,{ai:guard(57,10,0,{stay:true}),hold:true,fm:'yan'});
  g.e0=0;for(const u of g.units)if(u.side===2)g.e0+=u.n;
  setWeather('sun',PI,1);},
 events:[
  {t:3,f:g=>msg('赵括全军渡水来攻，前锋已近秦壁','warn')},
  {t:70,f:g=>{msg('赵军后队压上','warn');const f=g.points[0];for(const u of g.units)if(u.tag==='second'){u.ai=aslt(f.x,f.y,u.type==='qi'?{pref:'nu'}:null);u.hold=false;}}},
  {t:260,f:g=>{setWeather('fog',PI,1);msg('暮霭沉沉，夜雾四起');}},
  {t:400,f:g=>{setWeather('sun',PI,1);}}],
 tick(g,dt){const p=g.points[1];
  if(p.side===1)g.grain[2]=Math.max(0,g.grain[2]-dt*.7*100/D.pace);else g.grain[2]=Math.min(100,g.grain[2]+dt*.08);
  if(g.grain[2]<45&&!g.flags.brk){g.flags.brk=1;msg('赵军乏粮，赵括亲率锐卒回师突围！','warn');quote('supply');
   for(const u of g.units)if(u.side===2&&u.ai&&!u.ai.stay){u.ai=aslt(p.x,p.y);u.hold=false;u.path=[];}}},
 onPoint(g,p){if(p.name!=='粮道')return;
  if(p.side===1){msg('奇兵已断赵军粮道！','good');quote('qi');for(const u of g.units)if(u.side===2&&(u.tag==='camp'||(u.type==='qi'&&u.ai&&u.ai.mode))){u.ai=aslt(p.x,p.y);u.hold=false;u.path=[];}}
  else msg('赵军夺回粮道，粮草复通','warn');},
 obj(g){let e=0;for(const u of g.units)if(u.side===2)e+=u.n;
  return[['守住秦壁帅旗',g.points[0].side===1?0:-1],['断赵军粮道（敌粮 '+Math.ceil(g.grain[2])+'）',g.points[1].side===1?1:0],['斩赵括或迫其溃降（敌尚存 '+Math.round(e/g.e0*100)+'%）',g.gen[2].alive?0:1],['白起无恙',g.gen[1].alive?0:-1]];},
 check(g){if(!g.gen[1].alive)return['lose','白起阵亡'];if(g.points[0].side!==1)return['lose','秦壁失守'];
  let e=0;for(const u of g.units)if(u.side===2)e+=u.n;if(!g.gen[2].alive||e<g.e0*.2)return['win'];return null;}}
];
function wave(g,list){sfx('drums');const f=g.points[0];let ram=D.wit>=3;for(const[t,n,x,y]of list)spawn(2,t,n,x,y,{gear:ram&&t==='ji'?(ram=false,'ram'):null,ai:aslt(f.x,f.y,t==='qi'?{pref:'nu'}:null),home:{x:60,y:(y+.5)*TS}});msg('秦军渡水来攻','warn');}
function convoy(g){const u=spawn(1,'liang',1800,58,3,{auto:true,name:'粮队',morale:100});const f=g.points[0];u.path=findPath(u,f.x+40,f.y);u.state='move';msg('粮队已过故关，正沿东北大道入营','good');}

/* ---------- 流程 ---------- */
let done=[];try{done=JSON.parse(localStorage.getItem('changping-done')||'[]');}catch(e){}
let fromEd=false;const exitName=()=>fromEd?'回编辑器':'回到卷首';
function exitGame(){if(!fromEd)return toTitle();closeModal();running=false;G=null;ambient();$('game').hidden=true;$('editor').hidden=false;edResize();}
let running=false,last=0,hudT=0,miniT=0,touchy=false,drag=null;
const keys={};
function newGame(mi){
 const M=typeof mi==='number'?MISSIONS[mi]:mi;installTypes(M.data&&M.data.unitTypes);setMusic(M.data&&M.data.music);
 G={mi:typeof mi==='number'?mi:-1,M,s0:[0,0,0],fortList:[],campList:[],tilePaint:false,t:0,map:new Uint8Array(MW*MH),own:new Uint8Array(MW*MH),burnt:new Uint8Array(MW*MH),units:[],gates:[],gateIdx:{},points:[],elev:new Uint8Array(MW*MH),hv:new Float32Array(MW*MH),props:[],floats:[],gap:new Uint8Array(MW*MH),shp:{},ramp:new Uint8Array(MW*MH),tower:new Uint8Array(MW*MH),riverLines:[],roadLines:[],fires:new Map(),arrows:[],parts:[],rings:[],sel:[],
  weather:'sun',wind:0,windStr:1,grain:[null,null,null],gen:[null,null,null],hour0:M.hour0,hourLen:M.paceTime?M.hourLen*100/D.pace:M.hourLen,heat:0,events:[],evi:0,over:null,speed:1,paused:true,uid:1,
  stats:{kill:0,loss:0,surr:0},flags:{},rnd:rng32(M.seed),nameIdx:{},qt:{},qLast:-99,fireMode:false,ground:null,gctx:null};
 M.setup(G);G.events=M.events.slice().sort((a,b)=>a.t-b.t);
 computeElev();computeGap();for(const u of G.units)if(u.type!=='liang')G.s0[u.side]+=u.n;
 for(const u of G.units)if(u.ai&&u.ai.mode==='guard'&&u.hold&&G.map[tileIdx(u.x,u.y)]===FOREST){u.holdT=10;u.hidden=true;}
 for(const u of G.units)if(u.side===1&&u.hold&&u.holdT>=10&&G.map[tileIdx(u.x,u.y)]===FOREST)u.hidden=true;
 paintGround();buildProps();hudCache={};try{$('quote').classList.remove('on');}catch(e){}
 cam.z=W<700?.7:1;cam.x=M.cam[0]*TS-W/cam.z/2;cam.y=M.cam[1]*TS-H/cam.z/K/2;
}
function showBrief(mi,ed){
 fromEd=!!ed;newGame(mi);const M=G.M;$('title').hidden=true;$('game').hidden=false;resize();$('log').innerHTML='';
 cam.x=M.cam[0]*TS-W/cam.z/2;cam.y=M.cam[1]*TS-H/cam.z/K/2;
 modal('<p class="ord">'+M.ord+'</p><h2>'+M.name+'</h2><p class="role">'+M.role+'</p><p>'+M.brief+'</p><h3>军令</h3><ul>'+M.goals.map(x=>'<li>'+x+'</li>').join('')+'</ul><h3>帐下献策</h3><ul>'+M.tips.map(x=>'<li>'+x+'</li>').join('')+'</ul><p class="role">难度：'+diffLine()+'。可回卷首调整。</p>',
  [['开战',()=>{closeModal();G.paused=false;sfx('drums');}],['兵法要览',()=>showCodex(()=>showBriefAgain())],[exitName(),exitGame]]);
 running=true;hud();
}
function showBriefAgain(){const M=G.M;modal('<p class="ord">'+M.ord+'</p><h2>'+M.name+'</h2><p class="role">'+M.role+'</p><p>'+M.brief+'</p><h3>军令</h3><ul>'+M.goals.map(x=>'<li>'+x+'</li>').join('')+'</ul><h3>帐下献策</h3><ul>'+M.tips.map(x=>'<li>'+x+'</li>').join('')+'</ul>',
  [[G.t>0?'继续':'开战',()=>{closeModal();G.paused=false;}],[exitName(),exitGame]]);}
function endGame(r){
 if(G.over)return;G.over=r;const win=r[0]==='win',M=G.M;sfx(win?'win':'lose');
 if(win&&G.mi>=0&&!done.includes(G.mi)){done.push(G.mi);try{localStorage.setItem('changping-done',JSON.stringify(done));}catch(e){}}
 const st='歼敌 '+Math.round(G.stats.kill)+(G.stats.surr?'　受降 '+Math.round(G.stats.surr):'')+'　折损 '+Math.round(G.stats.loss)+'　历时 '+(G.t/G.hourLen).toFixed(1)+' 时辰';
 const btn=[];if(win&&G.mi>=0&&G.mi<MISSIONS.length-1)btn.push(['下一战',()=>showBrief(G.mi+1)]);btn.push(['再战此役',()=>showBrief(G.mi>=0?G.mi:mkMission(G.M.data),fromEd)]);btn.push([exitName(),exitGame]);
 modal('<p class="seal '+(win?'':'lost')+'">'+(win?'捷':'败')+'</p><h2>'+M.name+(win?'　大捷':'　兵败')+'</h2><p>'+(win?M.win:r[1]+'。')+'</p><p class="role">'+st+'</p>',btn);
}
function toTitle(){fromEd=false;closeModal();running=false;G=null;ambient();$('game').hidden=true;$('editor').hidden=true;$('title').hidden=false;buildTitle();}
function modal(html,btns){const m=$('modal');$('mbody').innerHTML=html;const f=$('mbtns');f.innerHTML='';
 btns.forEach(([t,fn],i)=>{const b=document.createElement('button');b.textContent=t;if(i===0)b.className='pri';b.addEventListener('click',fn);f.appendChild(b);});m.hidden=false;if(G)G.wasPaused=G.paused,G.paused=true;}
function closeModal(){$('modal').hidden=true;}
function showCodex(back){modal($('codex').innerHTML,[['合上兵书',()=>{closeModal();if(back)back();else if(G&&!G.over)G.paused=G.wasP2;}]]);}
function buildTitle(){const box=$('mlist');box.innerHTML='';
 const add=(M,ord,won,play,edit)=>{const li=document.createElement('li');li.innerHTML='<span class="ord">'+ord+'</span><div><h3>'+M.name+(won?'<em class="seal sm">捷</em>':'')+'</h3><p class="role">'+M.role+'</p><p>'+M.line+'</p></div>';
  const sp=document.createElement('span');sp.className='acts';const b=document.createElement('button');b.textContent='入阵';b.className='pri';b.addEventListener('click',play);sp.appendChild(b);
  if(edit){const e=document.createElement('button');e.textContent='编辑';e.addEventListener('click',edit);sp.appendChild(e);}li.appendChild(sp);box.appendChild(li);};
 MISSIONS.forEach((M,i)=>add(M,M.ord,done.includes(i),()=>showBrief(i)));
 EMBED.forEach((L,i)=>{const M=mkMission(L);add(M,M.ord,false,()=>showBrief(mkMission(L)),()=>openEditor(Object.assign({},L,{id:'lv'+Date.now().toString(36),name:(L.name||'')+'（改）'})));});
 LOCAL.forEach((L,i)=>{const M=mkMission(L);add(M,M.ord,false,()=>showBrief(mkMission(L)),()=>openEditor(L,i));});
 syncDiff();}
function syncDiff(){for(const k of['force','might','wit','pace','vol']){$('d_'+k).value=D[k];}
 $('o_force').textContent=D.force+'%';$('o_might').textContent=D.might+'%';$('o_wit').textContent=WIT[D.wit-1];$('o_pace').textContent=paceName(D.pace);$('o_vol').textContent=D.snd?D.vol+'%':'静音';
 const bs=$('presets').children;for(let i=0;i<bs.length;i++){const p=PRESET[i];bs[i].classList.toggle('on',p.force===D.force&&p.might===D.might&&p.wit===D.wit&&p.pace===D.pace);}}

function resize(){if(!cvEl)return;const r=cvEl.getBoundingClientRect();W=Math.max(200,r.width);H=Math.max(200,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
 cvEl.width=W*dpr|0;cvEl.height=H*dpr|0;nc.width=Math.ceil(W/4);nc.height=Math.ceil(H/4);}
function frame(ts){
 requestAnimationFrame(frame);if(!running||!G)return;
 const el=Math.min(.05,(ts-last)/1000||0);last=ts;
 const ps=520*el/cam.z;if(keys.ArrowLeft||keys.a)cam.x-=ps;if(keys.ArrowRight||keys.d)cam.x+=ps;if(keys.ArrowUp||keys.w)cam.y-=ps/K;if(keys.ArrowDown||keys.s)cam.y+=ps/K;NOW=ts/1000;
 if(!G.paused&&!G.over)for(let i=0;i<G.speed&&!G.over;i++)update(el);
 if(!G)return;
 music(el);render();hudT-=el;if(hudT<=0){hudT=.2;hud();}miniT-=el;if(miniT<=0){miniT=.25;drawMini();}
}
const toWorld=(sx,sy)=>{const x=cl(cam.x+sx/cam.z,0,WW-1),v=cam.y*K+sy/cam.z;let y=v/K;for(let i=0;i<4;i++)y=cl((v+hpx(x,cl(y,0,WH-1)))/K,0,WH-1);return{x,y};};
const scrOf=u=>({x:(u.x-cam.x)*cam.z,y:((u.y-cam.y)*K-hpx(u.x,u.y))*cam.z});
function init(){
 try{touchy=window.matchMedia('(hover:none)').matches;}catch(e){}
 cvEl=$('cv');ctx=cvEl.getContext('2d');nc=mkCanvas(10,10);nctx=nc.getContext('2d');miniEl=$('mini');mctx=miniEl.getContext('2d');
 loadLevels();try{edInit();}catch(e){}
 buildTitle();window.addEventListener('resize',resize);
 try{$('bedit').addEventListener('click',()=>openEditor());}catch(e){}
 try{document.fonts.load('30px "Ma Shan Zheng"','长平丹水故关秦壁赵垒营西粮道戟盾弩骑帅将守伏溃死疾火攻');}catch(e){}
 const ptrs=new Map(),pos=e=>{const r=cvEl.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top};};
 const pd=()=>{const a=[...ptrs.values()];return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);};
 cvEl.addEventListener('contextmenu',e=>e.preventDefault());
 cvEl.addEventListener('pointerdown',e=>{if(!G||G.over)return;try{cvEl.setPointerCapture(e.pointerId);}catch(_){}const p=pos(e);ptrs.set(e.pointerId,p);touchy=e.pointerType!=='mouse';
  if(ptrs.size===2){drag={mode:'pinch',d:pd(),z:cam.z};return;}
  drag={mode:e.pointerType==='mouse'?(e.button===0?'box':e.button===2?'order':'pan'):'touch',sx:p.x,sy:p.y,x:p.x,y:p.y,cx:cam.x,cy:cam.y,moved:false,shift:e.shiftKey};});
 cvEl.addEventListener('pointermove',e=>{if(!drag||!ptrs.has(e.pointerId))return;const p=pos(e);ptrs.set(e.pointerId,p);
  if(drag.mode==='pinch'){if(ptrs.size===2)cam.z=cl(drag.z*pd()/drag.d,.45,1.6);return;}
  drag.x=p.x;drag.y=p.y;if(Math.hypot(p.x-drag.sx,p.y-drag.sy)>7)drag.moved=true;
  if(drag.mode==='pan'||(drag.mode==='touch'&&drag.moved)){cam.x=drag.cx-(p.x-drag.sx)/cam.z;cam.y=drag.cy-(p.y-drag.sy)/cam.z/K;}});
 const up=e=>{if(!ptrs.has(e.pointerId))return;const prevSel=G?G.sel.slice():[];const p=pos(e);ptrs.delete(e.pointerId);if(!drag||!G)return;
  if(drag.mode==='pinch'){if(ptrs.size===0)drag=null;return;}const d=drag;drag=null;const w=toWorld(p.x,p.y);
  if(d.mode==='box'){if(!d.moved){if(G.tacMode)return tacAt(w);if(G.fireMode)return fireAt(w);const u=pickUnit(w.x,w.y,1);
    if(u&&!u.auto&&u.state!=='rout'){if(d.shift){const i=G.sel.indexOf(u);if(i>=0)G.sel.splice(i,1);else G.sel.push(u);}else G.sel=[u];}else if(!d.shift)G.sel=[];}
   else{const ax=Math.min(d.sx,p.x),ay=Math.min(d.sy,p.y),bx=Math.max(d.sx,p.x),by=Math.max(d.sy,p.y);
    const s=G.units.filter(u=>{if(u.side!==1||u.auto||u.state==='rout')return false;const q=scrOf(u);return q.x>=ax&&q.x<=bx&&q.y>=ay-8&&q.y<=by+8;});G.sel=d.shift?[...new Set(G.sel.concat(s))]:s;}}
  else if(d.mode==='order'){if(G.tacMode)tacAt(w);else if(G.fireMode)G.fireMode=false;else order(w.x,w.y);}
  else if(d.mode==='touch'&&!d.moved){if(G.tacMode)return tacAt(w);if(G.fireMode)return fireAt(w);const u=pickUnit(w.x,w.y,1);
   if(u&&!u.auto&&u.state!=='rout'){if(G.sel.length===1&&G.sel[0]===u)G.sel=[];else if(G.sel.includes(u))G.sel=[u];else if(G.sel.length&&e.shiftKey)G.sel.push(u);else G.sel=[u];}
   else if(G.sel.length)order(w.x,w.y);}
  {const nw=G.sel.filter(u=>!prevSel.includes(u));if(nw.length)hail(nw);}
  hudT=0;};
 cvEl.addEventListener('pointerup',up);cvEl.addEventListener('pointercancel',e=>{ptrs.delete(e.pointerId);drag=null;});
 cvEl.addEventListener('dblclick',e=>{if(!G)return;const p=pos(e),w=toWorld(p.x,p.y),u=pickUnit(w.x,w.y,1);if(u&&!u.auto){G.sel=G.units.filter(o=>o.side===1&&!o.auto&&o.kind===u.kind&&o.state!=='rout');hail(G.sel);}});
 cvEl.addEventListener('wheel',e=>{e.preventDefault();const p=pos(e),w=toWorld(p.x,p.y);cam.z=cl(cam.z*(e.deltaY<0?1.1:.91),.45,1.6);cam.x=w.x-p.x/cam.z;cam.y=w.y-(p.y/cam.z+hpx(w.x,w.y))/K;},{passive:false});
 const mj=e=>{if(!G)return;const r=miniEl.getBoundingClientRect();cam.x=(e.clientX-r.left)/r.width*WW-W/cam.z/2;cam.y=(e.clientY-r.top)/r.height*WH-H/cam.z/K/2;};
 miniEl.addEventListener('pointerdown',e=>{try{miniEl.setPointerCapture(e.pointerId);}catch(_){}mj(e);});miniEl.addEventListener('pointermove',e=>{if(e.buttons||e.pointerType==='touch')mj(e);});
 $('btns').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cmd(b.dataset.c);hudT=0;}});
 $('tacmenu').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cmd(b.dataset.c);$('tacmenu').hidden=true;hudT=0;}});
 $('siegemenu').addEventListener('click',e=>{const b=e.target.closest('button');if(b){cmd(b.dataset.c);$('siegemenu').hidden=true;hudT=0;}});
 $('bpause').addEventListener('click',()=>{cmd('pause');hudT=0;});$('bspeed').addEventListener('click',()=>{cmd('speed');hudT=0;});
 $('bhelp').addEventListener('click',()=>{if(!G)return;G.wasP2=G.paused;showCodex();});
 $('bquit').addEventListener('click',()=>{if(!G)return;const was=G.paused;modal('<h2>收兵</h2><p>此役尚未分胜负，确定离开？</p>',[['继续作战',()=>{closeModal();G.paused=was;}],['军令与献策',showBriefAgain],[exitName(),exitGame]]);});
 $('bcodex').addEventListener('click',()=>showCodex());
 for(const k of['force','might','wit','pace','vol'])$('d_'+k).addEventListener('input',e=>{D[k]=+e.target.value;if(k==='vol'){D.snd=D.vol>0;audio();if(SND.master)SND.master.gain.value=D.vol/100;sfx('pluck');}saveD();syncDiff();});
 $('presets').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;Object.assign(D,PRESET[+b.dataset.p]);saveD();syncDiff();sfx('tick');});
 $('bsnd').addEventListener('click',()=>{D.snd=!D.snd;if(D.snd&&D.vol===0)D.vol=70;saveD();if(D.snd){audio();if(SND.master)SND.master.gain.value=D.vol/100;sfx('pluck');}else ambient();hudT=0;});
 $('bobj').addEventListener('click',()=>$('obj').classList.toggle('shut'));
 const KM={t:'tac',e:'siege',b:'build',g:'hold',x:'stop',f:'split',c:'merge',r:'march',v:'fire','1':'fang','2':'feng','3':'yuan','4':'yan',q:'all',' ':'pause'};
 window.addEventListener('keydown',e=>{if(!G||!$('modal').hidden)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
  if(k==='Escape'){G.tacMode=null;G.fireMode=false;G.sel=[];return;}
  if(KM[k]){e.preventDefault();cmd(KM[k]);hudT=0;return;}keys[k]=true;if(k.startsWith('Arrow'))e.preventDefault();});
 window.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;keys[k]=false;});
 requestAnimationFrame(frame);
}
/* ====================================================================
   数据战役：一关就是一个 JSON 对象。格式说明见下方 FORMAT_DOC（编辑器“格式”页同文）。
   ==================================================================== */
const FORMAT_DOC=`【怎样加一关】
三选一：① 在编辑器里画好，点“保存”（存在本机浏览器）；② 在编辑器“导入导出”页粘贴 JSON 再点“载入”；
③ 直接改网页源码：把关卡对象加进 <script type="application/json" id="levels"> 里的数组，卷首就会多出一关。
地图固定 60×38 格，坐标 x 0–59 自西向东，y 0–37 自北向南。时间单位是秒（“息”）。

【关卡对象】
{
 "id":"唯一标识", "name":"战役名", "ord":"序（如 别传）", "role":"我方主帅", "line":"一句话任务",
 "brief":"战前形势", "goals":["军令…"], "tips":["献策…"], "winText":"胜后题记",
 "seed":7, "hour0":5, "hourLen":50, "paceTime":false,      // hour0: 0子 1丑 … 11亥；hourLen: 每时辰多少秒；戌亥子丑寅为夜
 "face":{"1":0,"2":3.1416},                                 // 双方开局朝向（弧度，0 朝东，3.1416 朝西，-1.5708 朝北）
 "cam":[12,19], "weather":{"type":"sun|rain|fog","wind":0,"str":1},   // wind: 风吹去的方向（弧度）；str 2 为大风

 // 地形两种写法，可并用（先 rows 后 draw）：
 "rows":["60 个字符一行，共 38 行"],     // . 平地  ^ 山丘  f 林地  ~ 河流  = 浅滩  - 道路  % 沮泽  A 绝壁
 "draw":[                                  // 矢量画法，写起来快；须先画河、后画路（路过河处自动成浅滩）
  {"op":"river","pts":[[21,0],[20,8],[23,18]]}, {"op":"road","pts":[[0,10],[28,10]]},
  {"op":"hill","x":30,"y":4,"r":4.5}, {"op":"forest","x":28,"y":15,"r":3}, {"op":"marsh","x":14,"y":20,"r":2.5},
  {"op":"cliff","pts":[[44,0],[44,10]],"r":1} ],
 "forts":[{"x0":38,"y0":13,"x1":48,"y1":24,"side":1,"gates":[[38,18,1800]]}],   // 城垒：四周是墙，gates 为 [x,y,耐久]，须在墙上
 "camps":[{"x0":46,"y0":14,"x1":54,"y1":23,"side":2}],                            // 无墙营地
 "points":[{"x":43.5,"y":19,"side":1,"name":"帅旗","time":8}],                    // 据点，序号从 0 起；time 为夺旗所需秒数
 "labels":[{"t":"丹水","x":24.6,"y":13,"s":34}],

 "units":[{"side":1,"type":"ji","n":5000,"x":34,"y":17,
           "name":"可省","general":false,"hold":false,"ambush":false,"fm":"fang|feng|yuan|yan","gear":"ram|ladder|cata","tag":"分组名",
           "ai":{"mode":"guard|stay|assault","leash":220,"point":0,"goal":[9,19],"pref":"nu","focus":false}}],
   // type: ji 戟兵  dun 盾兵  nu 弩手  qi 骑兵，或 unitTypes 里自定的名字。general:true 的一阵即主将。
   // ai 只对敌军（side 2）有效：guard 驻守并追出 leash 远；stay 死守；assault 进攻某据点(point)或坐标(goal)。

 "grain":[{"side":1,"start":70,"drain":0.2},                    // 粮草：每秒消耗 drain，归零后士气日衰直至溃散、请降
          {"side":2,"start":100,"drain":0.7,"regen":0.08,"cutBy":0}],   // cutBy: 只有该序号的据点落入对方手中时才消耗
 "events":[ {"t":10,"do":"msg","text":"军报","kind":"warn|good"},
            {"t":30,"do":"spawn","text":"敌军来攻","units":[ …同 units… ]},
            {"t":90,"do":"convoy","from":[58,3],"to":0,"gain":35,"n":1800},       // 我方粮队走向据点 to，入营加粮 gain
            {"t":120,"do":"weather","type":"rain","wind":0.785,"str":1,"text":"天降大雨"},
            {"t":180,"do":"retask","tag":"后队","ai":{"mode":"assault","point":0},"text":"敌军后队压上"},
            {"t":200,"do":"grain","side":1,"add":20}, {"t":1,"do":"sfx","name":"drums"}, {"t":300,"do":"lose","text":"…"}, {"t":300,"do":"win"} ],
 "triggers":[{"when":<条件>,"do":[<同 events 的动作，不写 t>]}],                 // 条件首次成立时触发一次

 "win":[<条件>, …],            // 满足其一即胜。缺省：敌军全灭
 "lose":[{"when":<条件>,"text":"败因"}],    // 缺省：我军主将阵亡。另外“我军全灭”恒为败
 "objectives":[{"text":"断敌粮道（敌粮 {grain2}）","done":<条件>,"fail":<条件>}],  // 左上角军令；缺省用 goals
   // 文本可用 {grain1} {grain2} {conv}入营粮队数 {lost}失粮队数 {enemy}敌军剩余百分比 {hours}已过时辰

 "unitTypes":{"che":{"name":"战车","ch":"车","base":"qi","spd":74,"atk":1.35,"def":1.15,"range":0,"weapon":"驷马战车",
                     "charge":1.25,"shot":1,"arrowDef":1,"gate":1,"counters":{"nu":1.6,"ji":0.75},"weakTo":{"ji":1.7}}},
   // base 决定画法与兵种规则（ji/dun/nu/qi 之一）；counters: 我打谁的倍率；weakTo: 谁打我的倍率；
   // range>0 即远射；shot 箭矢杀伤、arrowDef 受箭倍率、charge 冲锋倍率、gate 撞门倍率；ch 是旗上的字。
 "music":{"scale":"gong|shang|jue|zhi|yu 或 9 个频率","gap":[1.6,4.8],"vol":0.3,"drum":0.28},
 "sfx":{"horn":[["tone",110,116,1.3,"sawtooth",0.08,0],["hiss",0.3,"bandpass",800,400,2,0.2,0],["drum",1,0.2],["pluck",4,1,0.4]]}
   // 同名覆盖内置音效，或新增后用事件 {"do":"sfx","name":…} 播放。
   // tone: 起频,止频,时长,波形,音量,延时   hiss: 时长,滤波,起频,止频,Q,音量,延时   drum: 力度,延时   pluck: 音阶第几音,力度,延时
   // 内置音效名：clash arrow thud crash fall fire gong horn pluck qin tick move drum drums hail hoof win lose
}

【条件】
{"type":"point","i":0,"side":1}        据点 i 归 side 所有
{"type":"dead","side":2}               该方主将已亡（或已降）
{"type":"tagDead","tag":"后队"}        带此标签的军阵已全灭
{"type":"wiped","side":2}              该方已无军阵
{"type":"strength","side":2,"below":25} 该方兵力不足开局（含援军）的百分之几
{"type":"grain","side":2,"below":0}    该方粮草不高于某值
{"type":"convoys","n":2} / {"type":"convoysLost","n":2}   粮队入营数 / 被劫数
{"type":"time","t":300} 或 {"type":"time","hours":6}      开战后已过多久
{"type":"all","of":[…]}  {"type":"any","of":[…]}  {"type":"not","of":<条件>}

【提醒】删掉据点会让后面的据点序号前移，规则里引用的序号要跟着改。敌军兵力与战力还会按卷首的难度设置缩放。`;

const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TCH={'.':PLAIN,'^':HILL,'f':FOREST,'~':RIVER,'=':FORD,'-':ROAD,'%':MARSH,'A':CLIFF},TCHR=[];for(const k in TCH)TCHR[TCH[k]]=k;
let EMBED=[],LOCAL=[];
function loadLevels(){try{const el=$('levels');if(el&&el.textContent)EMBED=JSON.parse(el.textContent);}catch(e){EMBED=[];}
 try{LOCAL=JSON.parse(localStorage.getItem('changping-levels')||'[]')||[];}catch(e){LOCAL=[];}if(!Array.isArray(EMBED))EMBED=[];if(!Array.isArray(LOCAL))LOCAL=[];}
const saveLocal=()=>{try{localStorage.setItem('changping-levels',JSON.stringify(LOCAL));return true;}catch(e){return false;}};

/* 自定兵种 */
let CUSTOM_KINDS=[],CT_ADDED=[];
function installTypes(def){for(const k of CUSTOM_KINDS){delete UT[k];delete CT[k];}for(const[a,b]of CT_ADDED)if(CT[a])delete CT[a][b];CUSTOM_KINDS=[];CT_ADDED=[];
 for(const k in def||{}){if(UT[k])continue;const d=def[k]||{},base=UT[d.base]&&!UT[d.base].base&&d.base!=='liang'?d.base:'ji';
  UT[k]=Object.assign({},UT[base],d,{base,name:esc(d.name||k),ch:String(d.ch||UT[base].ch).slice(0,1),weapon:d.weapon?esc(d.weapon):''});CT[k]=Object.assign({},CT[base],d.counters);CUSTOM_KINDS.push(k);}
 for(const k of CUSTOM_KINDS){const wk=(def[k]||{}).weakTo||{};for(const o in wk)if(CT[o]&&CT[o][k]===undefined){CT[o][k]=wk[o];CT_ADDED.push([o,k]);}}}

function applyTerrain(g,L,b){
 if(L.rows)for(let y=0;y<MH&&y<L.rows.length;y++){const r=String(L.rows[y]);for(let x=0;x<MW&&x<r.length;x++){const t=TCH[r[x]];if(t!==undefined)g.map[y*MW+x]=t;}}
 for(const o of L.draw||[]){if(o.op==='river')b.river(o.pts);else if(o.op==='road')b.road(o.pts);else if(o.op==='cliff')b.cliff(o.pts,o.r);
  else if(o.op==='hill')b.blob(o.x,o.y,o.r||3,HILL);else if(o.op==='forest')b.blob(o.x,o.y,o.r||3,FOREST);else if(o.op==='marsh')b.blob(o.x,o.y,o.r||2.5,MARSH);}}
function terrainOf(L){const g={map:new Uint8Array(MW*MH),own:new Uint8Array(MW*MH),tower:new Uint8Array(MW*MH),gates:[],gateIdx:{},riverLines:[],roadLines:[],fortList:[],campList:[],rnd:rng32(L.seed||7)};applyTerrain(g,L,build(g));return g.map;}
const rowsOf=grid=>{const rows=[];for(let y=0;y<MH;y++){let s='';for(let x=0;x<MW;x++)s+=TCHR[grid[y*MW+x]]||'.';rows.push(s);}return rows;};
const ci=(v,a,b)=>cl(Math.round(Number(v)||0),a,b);
function aiOf(g,a,tx,ty){if(!a)return null;
 if(a.mode==='assault'){let gx,gy;if(a.point!==undefined&&a.point!==''&&g.points[a.point]){gx=g.points[a.point].x;gy=g.points[a.point].y;}else if(a.goal&&a.goal.length>=2){gx=(a.goal[0]+.5)*TS;gy=(a.goal[1]+.5)*TS;}
  else{const p=g.points.find(p=>p.side===1)||g.gen[1]||{x:WW/2,y:WH/2};gx=p.x;gy=p.y;}
  return aslt(gx,gy,{pref:a.pref||undefined,focus:!!a.focus,aggro:a.aggro});}
 const o={pref:a.pref||undefined};if(a.mode==='stay')o.stay=true;return guard(a.post?a.post[0]:tx,a.post?a.post[1]:ty,a.leash||220,o);}
function mkUnit(g,s){const side=s.side===1?1:2,o={};if(s.name)o.name=esc(s.name);if(s.general)o.general=true;if(s.fm&&FM[s.fm])o.fm=s.fm;if(s.tag)o.tag=String(s.tag);if(s.gear&&GN[s.gear])o.gear=s.gear;
 if(s.hold||s.ambush||(s.ai&&s.ai.mode==='stay'))o.hold=true;if(s.ambush)o.holdT=10;if(typeof s.face==='number')o.face=s.face;
 const x=ci(s.x,0,MW-1),y=ci(s.y,0,MH-1);if(side===2)o.ai=aiOf(g,s.ai||{mode:'guard'},x,y);
 const type=UT[s.type]&&s.type!=='liang'?s.type:'ji',u=spawn(side,type,cl(Number(s.n)||3000,300,30000),x,y,o);if(u.general)g.gen[side]=u;return u;}
function runAct(g,a){if(!a)return;switch(a.do){
 case'msg':msg(a.text||'',a.kind);break;
 case'weather':setWeather(a.type||'sun',typeof a.wind==='number'?a.wind:g.wind,a.str||1);if(a.text)msg(a.text);break;
 case'spawn':{let foe=false;for(const s of a.units||[]){const u=mkUnit(g,s);g.s0[u.side]+=u.n;if(u.side===2)foe=true;}if(foe)sfx('drums');if(a.text)msg(a.text,a.kind||(foe?'warn':'good'));break;}
 case'convoy':{const f=a.from||[58,3],u=spawn(1,'liang',a.n||1800,ci(f[0],0,MW-1),ci(f[1],0,MH-1),{auto:true,name:esc(a.name||'粮队'),morale:100});u.dest=a.to|0;u.gain=a.gain===undefined?35:a.gain;
  const p=g.points[u.dest]||g.points[0];if(p){u.path=findPath(u,p.x+40,p.y);u.state='move';}msg(a.text||'粮队已上路','good');break;}
 case'retask':for(const u of g.units)if(u.side===2&&u.tag===a.tag){u.ai=aiOf(g,a.ai||{mode:'assault'},u.x/TS|0,u.y/TS|0);u.hold=false;u.path=[];}if(a.text)msg(a.text,a.kind||'warn');break;
 case'grain':{const s=a.side===2?2:1;if(a.set!==undefined)g.grain[s]=a.set;if(a.add)g.grain[s]=cl((g.grain[s]||0)+a.add,0,100);break;}
 case'sfx':sfx(String(a.name));break;
 case'win':g.flags.forceWin=1;break;
 case'lose':g.flags.forceLose=esc(a.text||'兵败');break;}}
function strength(g,side){let n=0;for(const u of g.units)if(u.side===side&&u.type!=='liang')n+=u.n;return n;}
function cond(g,c){if(!c)return false;const s=c.side===1?1:2;switch(c.type){
 case'point':return !!g.points[c.i|0]&&g.points[c.i|0].side===(c.side===2?2:1);
 case'dead':{const u=g.gen[s];return !!u&&!u.alive;}
 case'tagDead':return !g.units.some(u=>u.tag===c.tag);
 case'time':return g.t>=(c.hours!==undefined?c.hours*g.hourLen:c.t||0);
 case'convoys':return(g.convArr||0)>=(c.n||1);
 case'convoysLost':return(g.convLost||0)>=(c.n||1);
 case'strength':return g.s0[s]>0&&strength(g,s)/g.s0[s]*100<(c.below||20);
 case'wiped':return !g.units.some(u=>u.side===s&&u.type!=='liang');
 case'grain':{const k=c.side===2?2:1;return g.grain[k]!==null&&g.grain[k]<=(c.below||0);}
 case'all':return(c.of||[]).every(x=>cond(g,x));
 case'any':return(c.of||[]).some(x=>cond(g,x));
 case'not':return !cond(g,c.of);}
 return false;}
function fillTxt(g,t){return esc(t).replace(/\{(\w+)\}/g,(m,k)=>{switch(k){case'grain1':return Math.ceil(g.grain[1]||0);case'grain2':return Math.ceil(g.grain[2]||0);case'conv':return g.convArr||0;case'lost':return g.convLost||0;
 case'enemy':return g.s0[2]?Math.round(strength(g,2)/g.s0[2]*100):0;case'hours':return(g.t/g.hourLen).toFixed(1);}return m;});}
function mkMission(L){
 const lines=a=>(Array.isArray(a)?a:[]).map(esc);
 const M={data:L,name:esc(L.name||'无名之战'),ord:esc(L.ord||'自拟'),role:esc(L.role||''),seed:L.seed||7,hour0:typeof L.hour0==='number'?L.hour0:5,hourLen:L.hourLen>5?L.hourLen:50,paceTime:!!L.paceTime,
  face:{1:Number((L.face||{})[1])||0,2:(L.face||{})[2]===undefined?PI:Number(L.face[2])||0},cam:Array.isArray(L.cam)&&L.cam.length>=2?L.cam:[30,19],line:esc(L.line||''),brief:esc(L.brief||''),goals:lines(L.goals),tips:lines(L.tips),
  labels:(L.labels||[]).filter(l=>l&&l.t).map(l=>({t:String(l.t),x:Number(l.x)||0,y:Number(l.y)||0,s:cl(Number(l.s)||26,12,60)})),win:esc(L.winText||'此战告捷。')};
 M.setup=g=>{const b=build(g);g.tilePaint=!!L.rows;g.convArr=0;g.convLost=0;applyTerrain(g,L,b);
  for(const f of L.forts||[]){const x0=ci(Math.min(f.x0,f.x1),0,MW-3),y0=ci(Math.min(f.y0,f.y1),0,MH-3),x1=ci(Math.max(f.x0,f.x1),x0+2,MW-1),y1=ci(Math.max(f.y0,f.y1),y0+2,MH-1);
   b.fort(x0,y0,x1,y1,f.side===1?1:2,(f.gates||[]).filter(q=>{const x=q[0],y=q[1];return x>=x0&&x<=x1&&y>=y0&&y<=y1&&((x===x0||x===x1)!==(y===y0||y===y1));}).map(q=>[q[0],q[1],cl(Number(q[2])||1500,100,9000)]));}
  for(const c of L.camps||[])b.camp(ci(Math.min(c.x0,c.x1),0,MW-1),ci(Math.min(c.y0,c.y1),0,MH-1),ci(Math.max(c.x0,c.x1),0,MW-1),ci(Math.max(c.y0,c.y1),0,MH-1),c.side===1?1:2);
  for(const p of L.points||[])g.points.push(pt(cl(Number(p.x)||0,1,MW-1),cl(Number(p.y)||0,1,MH-1),p.side===2?2:1,String(p.name||'旗').slice(0,4),p.time));
  for(const r of L.grain||[])g.grain[r.side===2?2:1]=r.start===undefined?100:r.start;
  for(const s of L.units||[])mkUnit(g,s);
  const w=L.weather||{};setWeather(w.type==='rain'||w.type==='fog'?w.type:'sun',Number(w.wind)||0,w.str>1?2:1);};
 M.events=(L.events||[]).map(e=>({t:Number(e.t)||0,f:g=>runAct(g,e)}));
 M.tick=(g,dt)=>{
  for(const r of L.grain||[]){const s=r.side===2?2:1,k=s===1?D.pace/100:100/D.pace;if(g.grain[s]===null)continue;
   const cut=r.cutBy===undefined||r.cutBy===null||(g.points[r.cutBy]&&g.points[r.cutBy].side!==s);
   if(cut)g.grain[s]=Math.max(0,g.grain[s]-dt*(r.drain||0)*k);else g.grain[s]=Math.min(100,g.grain[s]+dt*(r.regen||0));
   if(g.grain[s]<=0){if(!g.flags['st'+s]){g.flags['st'+s]=1;msg(s===1?'军中粮尽，士卒饥疲':'敌军粮尽，军心动摇',s===1?'warn':'good');quote('supply');}}else g.flags['st'+s]=0;}
  for(const u of g.units)if(u.type==='liang'&&u.alive&&u.dest!==undefined){const p=g.points[u.dest]||g.points[0];if(!p)continue;
   if(dist(u,p)<110){u.alive=false;g.convArr++;if(g.grain[1]!==null)g.grain[1]=Math.min(100,g.grain[1]+u.gain);msg('粮队入营，军心大定','good');for(const o of g.units)if(o.side===1)o.morale=Math.min(100,o.morale+12);}
   else if(!u.path.length)u.path=findPath(u,p.x+40,p.y);}
  g.trT=(g.trT||0)-dt;if(g.trT<=0){g.trT=.5;(L.triggers||[]).forEach((tr,i)=>{if(g.flags['tr'+i]||!cond(g,tr.when))return;g.flags['tr'+i]=1;for(const a of tr.do||[])runAct(g,a);});}};
 M.obj=g=>(L.objectives&&L.objectives.length?L.objectives:(L.goals||[]).map(t=>({text:t}))).map(o=>[fillTxt(g,o.text),o.fail&&cond(g,o.fail)?-1:o.done&&cond(g,o.done)?1:0]);
 M.check=g=>{if(g.flags.forceLose)return['lose',g.flags.forceLose];
  for(const l of L.lose||[{when:{type:'dead',side:1},text:'主将阵亡'}])if(cond(g,l.when))return['lose',esc(l.text||'兵败')];
  if(g.flags.forceWin)return['win'];const w=L.win||{type:'wiped',side:2};if(Array.isArray(w)?w.some(x=>cond(g,x)):cond(g,w))return['win'];return null;};
 return M;}
function checkLevel(L){const w=[],t=terrainOf(L),us=L.units||[];
 if(!us.some(u=>u.side===1))w.push('没有我军军阵');
 if(!us.some(u=>u.side!==1)&&!(L.events||[]).some(e=>e.do==='spawn'))w.push('没有敌军');
 if(!us.some(u=>u.side===1&&u.general))w.push('我军未设主将，默认的落败条件“主将阵亡”不会触发');
 for(const u of us){if(!UT[u.type]&&!(L.unitTypes||{})[u.type])w.push('未知兵种 '+u.type+'（会当作戟兵）');const tt=t[ci(u.y,0,MH-1)*MW+ci(u.x,0,MW-1)];if(tt===RIVER||tt===CLIFF)w.push((u.name||u.type)+' 落在'+TNAME[tt]+'上，开局会被挪到最近的可行处');}
 const np=(L.points||[]).length,chk=c=>{if(!c||typeof c!=='object')return;if(c.type==='point'&&(c.i|0)>=np)w.push('条件引用了不存在的据点 '+c.i);[].concat(c.of||[]).forEach(chk);};
 [].concat(L.win||[]).forEach(chk);(L.lose||[]).forEach(l=>chk(l&&l.when));(L.triggers||[]).forEach(l=>chk(l&&l.when));(L.grain||[]).forEach(r=>{if(r.cutBy!==undefined&&r.cutBy!==null&&r.cutBy>=np)w.push('粮草规则引用了不存在的据点 '+r.cutBy);});
 return w;}

/* ---------- 战役编辑器 ---------- */
const ED={L:null,grid:new Uint8Array(MW*MH),tool:'sel',brush:HILL,size:1,side:2,kind:'ji',n:4000,sel:null,tab:'info',cell:16,idx:-1,drag:null,bind:null,ctx:null,cv:null,dpr:1};
const ETER=[[PLAIN,'平地'],[HILL,'山丘'],[FOREST,'林地'],[RIVER,'河流'],[FORD,'浅滩'],[ROAD,'道路'],[MARSH,'沮泽'],[CLIFF,'绝壁']];
const ECOL={[PLAIN]:'#e9e2cf',[HILL]:'#b3ad9b',[FOREST]:'#5d7a64',[RIVER]:'#9fc0d8',[FORD]:'#d8c79a',[ROAD]:'#c39e6b',[MARSH]:'#93aa94',[CLIFF]:'#2f2d2a'};
const TPL={
 events:{'军报':{t:10,do:'msg',text:'斥候来报……',kind:'warn'},'敌军来攻':{t:30,do:'spawn',text:'敌军来攻',units:[{side:2,type:'ji',n:5000,x:1,y:10,ai:{mode:'assault',point:0}}]},
  '变天':{t:120,do:'weather',type:'rain',wind:0,str:1,text:'天降大雨'},'粮队':{t:90,do:'convoy',from:[58,3],to:0,gain:35},'改令':{t:180,do:'retask',tag:'后队',ai:{mode:'assault',point:0},text:'敌军后队压上'}},
 triggers:{'夺旗后':{when:{type:'point',i:0,side:1},do:[{do:'msg',text:'已夺敌旗！',kind:'good'}]},'敌粮尽':{when:{type:'grain',side:2,below:0},do:[{do:'msg',text:'敌军粮尽',kind:'good'}]}},
 win:{'斩将':{type:'dead',side:2},'夺旗':{type:'point',i:0,side:1},'击溃':{type:'strength',side:2,below:25},'守到时限':{type:'time',hours:6}},
 lose:{'主将阵亡':{when:{type:'dead',side:1},text:'主将阵亡'},'失旗':{when:{type:'point',i:0,side:2},text:'帅旗被夺'},'超时':{when:{type:'time',hours:6},text:'日落未克'}},
 grain:{'我军耗粮':{side:1,start:70,drain:.2},'断敌粮道':{side:2,start:100,drain:.7,regen:.08,cutBy:0}},
 objectives:{'一条军令':{text:'夺取帅旗',done:{type:'point',i:0,side:1}}},
 unitTypes:{'战车':['che',{name:'战车',ch:'车',base:'qi',spd:74,atk:1.35,def:1.15,weapon:'驷马战车',charge:1.25,counters:{nu:1.6,ji:.75},weakTo:{ji:1.7}}],
  '长弓':['gong',{name:'长弓手',ch:'弓',base:'nu',range:260,atk:.45,def:.6,shot:.85,weapon:'长弓'}],'重甲':['jia',{name:'重甲士',ch:'甲',base:'dun',spd:36,atk:1,def:1.5,arrowDef:.7,weapon:'铁甲长剑'}]},
 sfx:{'号角':['horn',[['tone',110,116,1.3,'sawtooth',.08,0],['tone',165,170,1.3,'sawtooth',.04,.05]]]}};
function blankLevel(){return{id:'lv'+Date.now().toString(36),name:'新战役',ord:'自拟',role:'我军 主将',line:'一句话说明此战要做什么。',brief:'战前形势。',goals:['击破敌军主将'],tips:['敌军主力在东，先稳住阵脚。'],winText:'此战告捷。',
 seed:7,hour0:5,hourLen:50,face:{1:0,2:PI},cam:[12,19],weather:{type:'sun',wind:0,str:1},forts:[],camps:[],labels:[],points:[],
 units:[{side:1,type:'dun',n:4000,x:8,y:19,general:true,name:'主将亲卫'},{side:1,type:'ji',n:5000,x:10,y:17},{side:1,type:'nu',n:4000,x:8,y:21},{side:1,type:'qi',n:3000,x:7,y:15},
  {side:2,type:'dun',n:4000,x:50,y:19,general:true,name:'敌将亲卫',ai:{mode:'guard',leash:220}},{side:2,type:'ji',n:5000,x:46,y:18,ai:{mode:'assault',goal:[9,19]}}],
 grain:[],events:[{t:4,do:'msg',text:'斥候来报：敌军已动',kind:'warn'}],triggers:[],win:[{type:'dead',side:2},{type:'wiped',side:2}],lose:[{when:{type:'dead',side:1},text:'主将阵亡'}],objectives:[],unitTypes:{},music:{scale:'yu'},sfx:{}};}
function captureBuiltin(i){newGame(i);const g=G,M=g.M,grid=new Uint8Array(g.map);for(let k=0;k<grid.length;k++)if(grid[k]===WALL||grid[k]===GATE||grid[k]===CAMP)grid[k]=PLAIN;
 const L=blankLevel();Object.assign(L,{name:M.name+'（改）',role:M.role,line:M.line,brief:M.brief,goals:M.goals.slice(),tips:M.tips.slice(),winText:M.win,seed:M.seed,hour0:M.hour0,hourLen:M.hourLen,face:{1:M.face[1],2:M.face[2]},cam:M.cam.slice(),
  labels:JSON.parse(JSON.stringify(M.labels||[])),weather:{type:g.weather,wind:g.wind,str:g.windStr},
  forts:g.fortList.map(f=>({x0:f.x0,y0:f.y0,x1:f.x1,y1:f.y1,side:f.side,gates:f.gates.map(a=>a.slice())})),camps:g.campList.map(c=>Object.assign({},c)),
  points:g.points.map(p=>({x:p.x/TS,y:p.y/TS,side:p.side,name:p.name,time:p.time})),
  units:g.units.map(u=>{const o={side:u.side,type:u.kind,n:Math.round(u.nMax),x:u.x/TS|0,y:u.y/TS|0,name:u.name};if(u.general)o.general=true;if(u.hold)o.hold=true;if(u.holdT>=10)o.ambush=true;if(u.tag)o.tag=u.tag;if(u.fm!=='fang')o.fm=u.fm;
   if(u.ai)o.ai=u.ai.mode==='assault'?{mode:'assault',goal:[u.ai.goal.x/TS|0,u.ai.goal.y/TS|0],pref:u.ai.pref||'',focus:!!u.ai.focus}:{mode:u.ai.stay?'stay':'guard',leash:u.ai.leash};return o;}),events:[]});
 L.rows=rowsOf(grid);G=null;return L;}
function levelOut(){const L=JSON.parse(JSON.stringify(ED.L));delete L.draw;L.rows=rowsOf(ED.grid);return L;}
function edLoad(L,idx){const B=blankLevel();ED.L=JSON.parse(JSON.stringify(L));const E=ED.L;ED.grid=new Uint8Array(terrainOf(E));delete E.draw;delete E.rows;
 for(const k of['forts','camps','labels','points','units','grain','events','triggers','goals','tips'])if(!Array.isArray(E[k]))E[k]=[];
 for(const k of['unitTypes','sfx'])if(!E[k]||typeof E[k]!=='object')E[k]={};
 if(!E.id)E.id=B.id;if(!E.face)E.face=B.face;if(!Array.isArray(E.cam))E.cam=B.cam;if(!E.weather)E.weather=B.weather;if(E.hour0===undefined)E.hour0=5;if(!E.hourLen)E.hourLen=50;if(!E.seed)E.seed=7;
 for(const f of E.forts)if(!Array.isArray(f.gates))f.gates=[];
 ED.idx=idx===undefined?-1:idx;ED.sel=null;ED.drag=null;if(ED.tab==='obj')ED.tab='info';edPick();edKinds();edTab();edResize();edSay(ED.idx>=0?'正在编辑已保存的战役。':'这是未保存的新稿，点“保存”后才会出现在卷首。');}
function openEditor(L,idx){closeModal();$('title').hidden=true;$('game').hidden=true;$('editor').hidden=false;edLoad(L||blankLevel(),idx);}
function edSay(t){const m=$('emsg');if(m)m.textContent=t||'';}
function edPick(){const p=$('e_pick');if(!p)return;p.innerHTML='<option value="">打开战役…</option>'+LOCAL.map((L,i)=>'<option value="L'+i+'">'+esc(L.name||'无名')+'</option>').join('')+EMBED.map((L,i)=>'<option value="E'+i+'">〔随附〕'+esc(L.name||'无名')+'</option>').join('');}
function edKinds(){const k=$('e_kind');if(!k)return;const ut=ED.L.unitTypes||{};k.innerHTML=['ji','dun','nu','qi'].map(t=>'<option value="'+t+'">'+UT[t].name+'</option>').concat(Object.keys(ut).filter(t=>!UT[t]||UT[t].base).map(t=>'<option value="'+esc(t)+'">'+esc((ut[t]||{}).name||t)+'</option>')).join('');
 k.value=ED.kind;if(k.value!==ED.kind){ED.kind='ji';k.value='ji';}}
const kindOpts=()=>{const ut=ED.L.unitTypes||{};return[['ji','戟兵'],['dun','盾兵'],['nu','弩手'],['qi','骑兵']].concat(Object.keys(ut).filter(t=>!['ji','dun','nu','qi','liang'].includes(t)).map(t=>[t,(ut[t]||{}).name||t]));};
const edObj=s=>s?ED.L[s.k+'s'][s.i]:null;
const onEdge=(f,x,y)=>x>=f.x0&&x<=f.x1&&y>=f.y0&&y<=f.y1&&((x===f.x0||x===f.x1)!==(y===f.y0||y===f.y1));
function edHit(x,y){const L=ED.L;let i;
 if((i=L.units.findIndex(u=>(u.x|0)===x&&(u.y|0)===y))>=0)return{k:'unit',i};
 if((i=L.points.findIndex(p=>Math.abs(p.x-.5-x)<1&&Math.abs(p.y-.5-y)<1))>=0)return{k:'point',i};
 if((i=L.labels.findIndex(p=>Math.abs(p.x-.5-x)<1.2&&Math.abs(p.y-.5-y)<1.2))>=0)return{k:'label',i};
 for(i=L.forts.length-1;i>=0;i--){const f=L.forts[i];if(x>=f.x0&&x<=f.x1&&y>=f.y0&&y<=f.y1)return{k:'fort',i};}
 for(i=L.camps.length-1;i>=0;i--){const f=L.camps[i];if(x>=f.x0&&x<=f.x1&&y>=f.y0&&y<=f.y1)return{k:'camp',i};}
 return null;}
function edPaint(x,y){const r=ED.size-1;for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>r*r+.5)continue;const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;ED.grid[ny*MW+nx]=ED.brush;}}
function edSelect(s){ED.sel=s;if(s)ED.tab='obj';edTab();}
function edResize(){const cv=ED.cv;if(!cv)return;const s=ED.cell;ED.dpr=Math.min(2,window.devicePixelRatio||1);cv.width=MW*s*ED.dpr;cv.height=MH*s*ED.dpr;cv.style.width=MW*s+'px';cv.style.height=MH*s+'px';edDraw();}
function edDraw(){const c=ED.ctx,L=ED.L;if(!c||!L)return;const s=ED.cell,g=ED.grid;c.setTransform(ED.dpr,0,0,ED.dpr,0,0);
 for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){c.fillStyle=ECOL[g[y*MW+x]]||ECOL[PLAIN];c.fillRect(x*s,y*s,s,s);}
 c.lineWidth=1;c.strokeStyle='rgba(29,27,25,.07)';c.beginPath();for(let x=0;x<=MW;x++){c.moveTo(x*s+.5,0);c.lineTo(x*s+.5,MH*s);}for(let y=0;y<=MH;y++){c.moveTo(0,y*s+.5);c.lineTo(MW*s,y*s+.5);}c.stroke();
 c.strokeStyle='rgba(29,27,25,.25)';c.beginPath();for(let x=0;x<=MW;x+=10){c.moveTo(x*s+.5,0);c.lineTo(x*s+.5,MH*s);}for(let y=0;y<=MH;y+=10){c.moveTo(0,y*s+.5);c.lineTo(MW*s,y*s+.5);}c.stroke();
 c.fillStyle='rgba(29,27,25,.5)';c.font='10px sans-serif';c.textAlign='left';c.textBaseline='top';for(let x=0;x<MW;x+=10)c.fillText(x,x*s+2,1);for(let y=10;y<MH;y+=10)c.fillText(y,2,y*s+1);
 for(const f of L.camps){const w=(f.x1-f.x0+1)*s,h=(f.y1-f.y0+1)*s;c.fillStyle='rgba(143,106,63,.22)';c.fillRect(f.x0*s,f.y0*s,w,h);c.setLineDash([4,3]);c.strokeStyle=f.side===1?ZHU:QING;c.lineWidth=1.5;c.strokeRect(f.x0*s+1,f.y0*s+1,w-2,h-2);c.setLineDash([]);}
 for(const f of L.forts){c.fillStyle='rgba(224,211,176,.9)';c.fillRect(f.x0*s,f.y0*s,(f.x1-f.x0+1)*s,(f.y1-f.y0+1)*s);c.strokeStyle='#22201d';c.lineWidth=Math.max(3,s*.55);c.strokeRect((f.x0+.5)*s,(f.y0+.5)*s,(f.x1-f.x0)*s,(f.y1-f.y0)*s);
  c.strokeStyle=f.side===1?ZHU:QING;c.lineWidth=1.5;c.strokeRect((f.x0+1)*s+1,(f.y0+1)*s+1,(f.x1-f.x0-1)*s-2,(f.y1-f.y0-1)*s-2);for(const q of f.gates||[]){c.fillStyle='#c8974e';c.fillRect(q[0]*s+1,q[1]*s+1,s-2,s-2);}}
 c.textAlign='center';c.textBaseline='middle';
 for(const p of L.labels){c.fillStyle='rgba(29,27,25,.62)';c.font=Math.max(11,s*.95)+'px '+BRUSH;c.fillText(p.t,p.x*s,p.y*s);}
 L.points.forEach((p,i)=>{const x=p.x*s,y=p.y*s;c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();c.moveTo(x,y+s*.5);c.lineTo(x,y-s*.95);c.stroke();c.fillStyle=p.side===1?ZHU:QING;c.beginPath();c.moveTo(x,y-s*.95);c.lineTo(x+s*.9,y-s*.58);c.lineTo(x,y-s*.2);c.closePath();c.fill();
  c.fillStyle=INK;c.font='11px sans-serif';c.fillText(i+' '+p.name,x,y+s*1.05);});
 for(const u of L.units){const x=(u.x+.5)*s,y=(u.y+.5)*s,d=(L.unitTypes||{})[u.type]||UT[u.type]||UT.ji;c.fillStyle=u.side===1?ZHU:QING;c.beginPath();c.arc(x,y,s*.62,0,TAU);c.fill();if(u.general){c.strokeStyle='#c9a45a';c.lineWidth=2.5;c.stroke();}
  c.fillStyle='#f6f0e2';c.font=Math.max(9,s*.82)+'px '+BRUSH;c.fillText(u.general?(u.side===1?'帅':'将'):String(d.ch||'兵').slice(0,1),x,y+1);}
 const o=edObj(ED.sel);if(o){c.strokeStyle='#e0a400';c.lineWidth=2.5;c.setLineDash([5,3]);const k=ED.sel.k;
  if(k==='unit'){const x=(o.x+.5)*s,y=(o.y+.5)*s;c.beginPath();c.arc(x,y,s*.95,0,TAU);c.stroke();const a=o.ai;if(a&&a.mode==='assault'){const p=a.point!==undefined&&a.point!==''&&L.points[a.point]?L.points[a.point]:a.goal&&a.goal.length>=2?{x:a.goal[0]+.5,y:a.goal[1]+.5}:null;if(p){c.beginPath();c.moveTo(x,y);c.lineTo(p.x*s,p.y*s);c.stroke();}}
   else if(a&&a.mode==='guard'){c.lineWidth=1;c.beginPath();c.arc(x,y,(a.leash||220)/TS*s,0,TAU);c.stroke();}}
  else if(k==='point'||k==='label')c.strokeRect((o.x-1)*s,(o.y-1)*s,s*2,s*2);else c.strokeRect(o.x0*s,o.y0*s,(o.x1-o.x0+1)*s,(o.y1-o.y0+1)*s);c.setLineDash([]);}
 const d=ED.drag;if(d&&(ED.tool==='fort'||ED.tool==='camp')){c.strokeStyle='#e0a400';c.lineWidth=2;c.strokeRect(Math.min(d.x0,d.x)*s,Math.min(d.y0,d.y)*s,(Math.abs(d.x-d.x0)+1)*s,(Math.abs(d.y-d.y0)+1)*s);}}
const F=(l,h)=>'<label class="fr"><span>'+l+'</span>'+h+'</label>';
const I=(f,v,type,ex)=>'<input data-f="'+f+'" type="'+(type||'text')+'" value="'+esc(v===undefined?'':v)+'" '+(ex||'')+'>';
const TA=(f,v,ex)=>'<textarea data-f="'+f+'" rows="3" '+(ex||'')+'>'+esc(v)+'</textarea>';
const C=(f,v)=>'<input data-f="'+f+'" type="checkbox"'+(v?' checked':'')+'>';
const S=(f,v,opts,num)=>'<select data-f="'+f+'"'+(num?' data-num':'')+'>'+opts.map(o=>'<option value="'+esc(o[0])+'"'+((num&&o[0]!==''&&v!==''&&v!==undefined?Math.abs(Number(o[0])-Number(v))<1e-4:String(o[0])===String(v===undefined?'':v))?' selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>';
const J=(l,f,rows)=>'<div class="jf"><b>'+l+'</b><span class="tp">'+Object.keys(TPL[f]||{}).map(k=>'<button data-tpl="'+f+'|'+k+'">＋'+k+'</button>').join('')+'</span><textarea data-f="'+f+'" data-json rows="'+(rows||6)+'" spellcheck="false">'+esc(JSON.stringify(ED.L[f]===undefined?null:ED.L[f],null,1))+'</textarea></div>';
function edTab(t){if(t)ED.tab=t;const P=$('epane'),L=ED.L;if(!P||!L)return;let h='';ED.bind=L;
 const tb=$('etabs').children;for(let i=0;i<tb.length;i++)tb[i].classList.toggle('on',tb[i].dataset.t===ED.tab);
 if(ED.tab==='obj'){const o=edObj(ED.sel);ED.bind=o;
  if(!o)h='<p class="hint">用左侧“选取移动”点地图上的军阵、据点、题字、城垒，在这里改属性；拖动可挪位置。</p>';
  else if(ED.sel.k==='unit'){const a=o.ai||{};h='<h4>军阵</h4>'+F('归属',S('side',o.side,[[1,'我军'],[2,'敌军']],1))+F('兵种',S('type',o.type,kindOpts()))+F('兵力',I('n',o.n,'number','step="500" min="300"'))+F('名号',I('name',o.name||'','text','placeholder="留空自动取名"'))+
   F('主将',C('general',o.general))+F('开局镇守',C('hold',o.hold))+F('设伏',C('ambush',o.ambush))+F('阵形',S('fm',o.fm||'fang',Object.keys(FM).map(k=>[k,FM[k].name])))+F('攻城器',S('gear',o.gear||'',[['','无'],['ram','冲车'],['ladder','云梯'],['cata','发石车']]))+F('分组标签',I('tag',o.tag||'','text','placeholder="供“改令”事件使用"'))+
   (o.side===2?'<h4>敌军用兵</h4>'+F('方式',S('ai.mode',a.mode||'guard',[['guard','驻守，会追出一段'],['stay','死守不动'],['assault','进攻']]))+F('追击范围',I('ai.leash',a.leash===undefined?220:a.leash,'number','step="20"'))+
    F('进攻据点',S('ai.point',a.point===undefined?'':a.point,[['','不指定']].concat(L.points.map((p,i)=>[i,i+' '+p.name])),1))+F('或进攻坐标',I('ai.goal',(a.goal||[]).join(','),'text','data-csv placeholder="x,y"'))+F('优先打',S('ai.pref',a.pref||'',[['','无']].concat(kindOpts())))+F('只盯目标',C('ai.focus',a.focus)):'')+
   F('位置',I('x',o.x,'number','min="0" max="59"')+I('y',o.y,'number','min="0" max="37"'));}
  else if(ED.sel.k==='point')h='<h4>据点 '+ED.sel.i+'</h4>'+F('名称',I('name',o.name,'text','maxlength="4"'))+F('归属',S('side',o.side,[[1,'我军'],[2,'敌军']],1))+F('夺旗秒数',I('time',o.time||8,'number','min="1"'))+F('位置',I('x',o.x,'number','step="0.5"')+I('y',o.y,'number','step="0.5"'));
  else if(ED.sel.k==='label')h='<h4>题字</h4>'+F('文字',I('t',o.t))+F('字号',I('s',o.s||26,'number','min="12" max="60"'))+F('位置',I('x',o.x,'number','step="0.5"')+I('y',o.y,'number','step="0.5"'));
  else if(ED.sel.k==='fort')h='<h4>城垒</h4>'+F('归属',S('side',o.side,[[1,'我军'],[2,'敌军']],1))+F('范围',I('x0',o.x0,'number')+I('y0',o.y0,'number')+I('x1',o.x1,'number')+I('y1',o.y1,'number'))+'<div class="jf"><b>垒门 [x, y, 耐久]</b><textarea data-f="gates" data-json rows="3" spellcheck="false">'+esc(JSON.stringify(o.gates||[]))+'</textarea></div><p class="hint">用左侧“垒门”工具点墙即可加门、再点一次去掉。门内两侧自带箭楼。</p>';
  else h='<h4>营地</h4>'+F('归属',S('side',o.side,[[1,'我军'],[2,'敌军']],1))+F('范围',I('x0',o.x0,'number')+I('y0',o.y0,'number')+I('x1',o.x1,'number')+I('y1',o.y1,'number'));
  if(o)h+='<p><button data-e="delsel">删除此项</button></p>';}
 else if(ED.tab==='info'){const w=L.weather||{};h=F('战役名',I('name',L.name))+F('序',I('ord',L.ord||''))+F('我方主帅',I('role',L.role||''))+F('一句话任务',I('line',L.line||''))+F('战前形势',TA('brief',L.brief||''))+F('军令，每行一条',TA('goals',(L.goals||[]).join('\n'),'data-lines'))+F('献策，每行一条',TA('tips',(L.tips||[]).join('\n'),'data-lines'))+F('胜后题记',TA('winText',L.winText||''))+
  F('开局时辰',S('hour0',L.hour0,[...HN].map((c,i)=>[i,c+'时']),1))+F('每时辰秒数',I('hourLen',L.hourLen,'number','min="10"'))+F('天气',S('weather.type',w.type||'sun',[['sun','晴'],['rain','雨'],['fog','雾']]))+F('风向',S('weather.wind',w.wind||0,WD.map((n,i)=>[i*PI/4,n+'风']),1))+F('风力',S('weather.str',w.str||1,[[1,'微风'],[2,'大风']],1))+
  F('我军面向',S('_face',L.face[1],[[0,'东'],[PI,'西'],[-PI/2,'北'],[PI/2,'南']],1))+F('开局镜头',I('cam',(L.cam||[]).join(','),'text','data-csv placeholder="x,y"'))+F('难度影响时限',C('paceTime',L.paceTime));}
 else if(ED.tab==='rule')h='<p class="hint">规则用 JSON 写，点“＋”插入样例再改数字；写法见“格式”页。据点序号以地图上旗旁的数字为准。</p>'+J('取胜条件（满足其一）','win',4)+J('落败条件','lose',4)+J('定时事件','events',9)+J('条件触发','triggers',5)+J('粮草','grain',4)+J('左上角军令（可空）','objectives',4);
 else if(ED.tab==='mod')h='<p class="hint">自定兵种写好后，左侧“兵种”下拉里就能选。</p>'+J('自定兵种与兵器','unitTypes',9)+J('配乐','music',3)+'<p><button data-e="mus">试听配乐</button></p>'+J('音效（覆盖内置或新增）','sfx',5)+'<p class="tp">'+Object.keys(L.sfx||{}).map(k=>'<button data-sfx="'+esc(k)+'">试听 '+esc(k)+'</button>').join('')+'</p>';
 else if(ED.tab==='io')h='<p class="hint">整关就是一段 JSON：可以复制给别人或别的 agent，也可以把别处写好的 JSON 粘进来载入。</p><p class="tp"><button data-e="gen">生成当前战役的 JSON</button><button data-e="copy">复制</button><button data-e="load">载入文本框里的 JSON</button></p><textarea id="e_json" rows="14" spellcheck="false" placeholder="在此粘贴关卡 JSON"></textarea>'+
  '<h4>以原有战役为底</h4><p class="tp"><select id="e_base">'+MISSIONS.map((M,i)=>'<option value="'+i+'">'+M.ord+' '+M.name+'</option>').join('')+'</select><button data-e="base">复制其地图与布阵</button></p><p class="hint">只复制地形、城垒、军阵和文字；原战役的敌军增援、天气变化等事件需在“规则”页自己补。</p>';
 else h='<pre class="doc">'+esc(FORMAT_DOC)+'</pre>';
 P.innerHTML=h;edDraw();}
function edApply(el){const f=el.dataset.f,L=ED.L;if(!f||!ED.bind)return;let v;
 if(el.type==='checkbox')v=el.checked;
 else if(el.dataset.json!==undefined){try{v=JSON.parse(el.value.trim()||'null');el.classList.remove('bad');edSay('');}catch(e){el.classList.add('bad');edSay('这段 JSON 有误，尚未生效：'+e.message);return;}}
 else if(el.dataset.lines!==undefined)v=el.value.split('\n').map(s=>s.trim()).filter(Boolean);
 else if(el.dataset.csv!==undefined){const a=el.value.split(/[,，\s]+/).filter(Boolean).map(Number);v=a.length>=2&&a.every(isFinite)?a.slice(0,2):undefined;}
 else if(el.type==='number'||el.dataset.num!==undefined)v=el.value===''?undefined:Number(el.value);
 else v=el.value;
 if(f==='_face'){L.face={1:v,2:v>0?v-PI:v+PI};return;}
 if(f==='cam'&&!v)return;
 const path=f.split('.');let o=ED.bind;for(let i=0;i<path.length-1;i++)o=o[path[i]]=o[path[i]]||{};
 if(v===undefined)delete o[path[path.length-1]];else o[path[path.length-1]]=v;
 if(f==='unitTypes')edKinds();edDraw();}
function edAct(a,el){const L=ED.L;
 if(a==='new')edLoad(blankLevel(),-1);
 else if(a==='save'){const out=levelOut(),w=checkLevel(out);if(ED.idx>=0)LOCAL[ED.idx]=out;else{LOCAL.push(out);ED.idx=LOCAL.length-1;}const ok=saveLocal();edPick();
  edSay((ok?'已保存在本机浏览器，卷首可见。':'浏览器不让存，请到“导入导出”页复制 JSON 自行保管。')+(w.length?' 提醒：'+w.join('；'):''));}
 else if(a==='test'){const out=levelOut(),w=checkLevel(out);if(!out.units.some(u=>u.side===1)){edSay('至少要放一支我军军阵才能试玩。');return;}edSay(w.length?'提醒：'+w.join('；'):'');$('editor').hidden=true;showBrief(mkMission(out),true);}
 else if(a==='del'){if(ED.idx<0){edLoad(blankLevel(),-1);return;}modal('<h2>删除战役</h2><p>确定从本机删除“'+esc(L.name)+'”？此举无法撤回。</p>',[['留着',closeModal],['删除',()=>{LOCAL.splice(ED.idx,1);saveLocal();closeModal();edLoad(blankLevel(),-1);}]]);}
 else if(a==='exit'){$('editor').hidden=true;toTitle();}
 else if(a==='delsel'){if(ED.sel){L[ED.sel.k+'s'].splice(ED.sel.i,1);ED.sel=null;edTab();}}
 else if(a==='gen'){$('e_json').value=JSON.stringify(levelOut(),null,1);}
 else if(a==='copy'){const t=$('e_json');if(!t.value)t.value=JSON.stringify(levelOut(),null,1);try{navigator.clipboard.writeText(t.value).then(()=>edSay('已复制。'),()=>{t.select();edSay('浏览器不让自动复制，已全选，请手动复制。');});}catch(e){t.select();edSay('已全选，请手动复制。');}}
 else if(a==='load'){try{let o=JSON.parse($('e_json').value);if(Array.isArray(o))o=o[0];if(!o||typeof o!=='object')throw new Error('不是关卡对象');edLoad(o,-1);edSay('已载入，尚未保存。');}catch(e){edSay('载入失败：'+e.message);}}
 else if(a==='base'){const i=Number($('e_base').value)|0;edLoad(captureBuiltin(i),-1);edSay('已复制地图与布阵；事件请在“规则”页补上。');}
 else if(a==='mus'){setMusic(L.music);audio();[0,2,4,5,7,8].forEach((n,i)=>pluck(n,1,i*.28));}}
function edInit(){
 ED.cv=$('ecv');if(!ED.cv)return;ED.ctx=ED.cv.getContext('2d');
 $('etools').innerHTML='<h4>地形</h4><div class="tg">'+ETER.map(t=>'<button data-brush="'+t[0]+'"><i style="background:'+ECOL[t[0]]+'"></i>'+t[1]+'</button>').join('')+'</div><label class="fr"><span>笔粗</span><select id="e_size"><option>1</option><option>2</option><option>3</option></select></label>'+
  '<h4>工事</h4><div class="tg"><button data-tool="fort">城垒</button><button data-tool="gate">垒门</button><button data-tool="camp">营地</button></div>'+
  '<h4>布置</h4><div class="tg"><button data-tool="unit">军阵</button><button data-tool="point">据点</button><button data-tool="label">题字</button></div>'+
  '<label class="fr"><span>归属</span><select id="e_side"><option value="1">我军</option><option value="2" selected>敌军</option></select></label><label class="fr"><span>兵种</span><select id="e_kind"></select></label><label class="fr"><span>兵力</span><input id="e_n" type="number" step="500" min="300" value="4000"></label>'+
  '<h4>编辑</h4><div class="tg"><button data-tool="sel" class="on">选取移动</button><button data-tool="erase">删除</button></div><label class="fr"><span>缩放</span><select id="e_zoom"><option value="11">小</option><option value="16" selected>中</option><option value="22">大</option></select></label>';
 const mark=()=>{const bs=$('etools').querySelectorAll('button');for(const b of bs)b.classList.toggle('on',b.dataset.tool?b.dataset.tool===ED.tool:ED.tool==='paint'&&Number(b.dataset.brush)===ED.brush);};
 $('etools').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.brush!==undefined){ED.tool='paint';ED.brush=Number(b.dataset.brush);}else if(b.dataset.tool)ED.tool=b.dataset.tool;mark();
  edSay({paint:'在地图上拖动涂地形。',fort:'拖出一个矩形即成城垒（至少 3×3）。',gate:'点城垒的墙加门，再点一次去掉。',camp:'拖出一个矩形作无墙营地。',unit:'点地图放一支军阵，属性在右侧改。',point:'点地图放一面据点旗。',label:'点地图放题字，文字在右侧改。',sel:'点选或拖动地图上的东西。',erase:'点地图上的东西即删除。'}[ED.tool]);});
 $('etools').addEventListener('change',e=>{const t=e.target;if(t.id==='e_size')ED.size=Number(t.value);else if(t.id==='e_side')ED.side=Number(t.value);else if(t.id==='e_kind')ED.kind=t.value;else if(t.id==='e_n')ED.n=cl(Number(t.value)||4000,300,30000);else if(t.id==='e_zoom'){ED.cell=Number(t.value);edResize();}});
 const tile=e=>{const r=ED.cv.getBoundingClientRect();return{x:cl((e.clientX-r.left)/ED.cell|0,0,MW-1),y:cl((e.clientY-r.top)/ED.cell|0,0,MH-1)};};
 ED.cv.addEventListener('pointerdown',e=>{if(!ED.L)return;try{ED.cv.setPointerCapture(e.pointerId);}catch(_){}const t=tile(e),L=ED.L;ED.drag={x0:t.x,y0:t.y,x:t.x,y:t.y,lx:t.x,ly:t.y,moved:false};
  switch(ED.tool){
   case'paint':edPaint(t.x,t.y);break;
   case'unit':{const u={side:ED.side,type:ED.kind,n:ED.n,x:t.x,y:t.y};if(ED.side===2)u.ai={mode:'guard',leash:220};L.units.push(u);edSelect({k:'unit',i:L.units.length-1});break;}
   case'point':L.points.push({x:t.x+.5,y:t.y+.5,side:ED.side,name:'帅旗',time:8});edSelect({k:'point',i:L.points.length-1});break;
   case'label':L.labels.push({t:'地名',x:t.x+.5,y:t.y+.5,s:26});edSelect({k:'label',i:L.labels.length-1});break;
   case'gate':{const f=L.forts.find(f=>onEdge(f,t.x,t.y));if(!f){edSay('垒门须点在城垒的墙上，四角除外。');break;}const gi=f.gates.findIndex(q=>q[0]===t.x&&q[1]===t.y);if(gi>=0)f.gates.splice(gi,1);else f.gates.push([t.x,t.y,1500]);if(ED.tab==='obj')edTab();break;}
   case'erase':{const h=edHit(t.x,t.y);if(h){L[h.k+'s'].splice(h.i,1);ED.sel=null;edTab();}break;}
   case'sel':edSelect(edHit(t.x,t.y));break;}
  edDraw();});
 ED.cv.addEventListener('pointermove',e=>{if(!ED.L)return;const t=tile(e),d=ED.drag;if(!d){return;}if(t.x===d.x&&t.y===d.y)return;const dx=t.x-d.lx,dy=t.y-d.ly;d.x=t.x;d.y=t.y;
  if(ED.tool==='paint'){const n=Math.max(Math.abs(dx),Math.abs(dy));for(let k=1;k<=n;k++)edPaint(Math.round(d.lx+dx*k/n),Math.round(d.ly+dy*k/n));}
  else if(ED.tool==='sel'&&ED.sel){const o=edObj(ED.sel);if(o){d.moved=true;if(o.x0!==undefined){if(o.x0+dx>=0&&o.x1+dx<MW&&o.y0+dy>=0&&o.y1+dy<MH){o.x0+=dx;o.x1+=dx;o.y0+=dy;o.y1+=dy;for(const q of o.gates||[]){q[0]+=dx;q[1]+=dy;}}}else{o.x=cl(o.x+dx,0,MW-.5);o.y=cl(o.y+dy,0,MH-.5);}}}
  d.lx=t.x;d.ly=t.y;edDraw();});
 const up=()=>{const d=ED.drag;if(!d||!ED.L)return;ED.drag=null;const L=ED.L,x0=Math.min(d.x0,d.x),x1=Math.max(d.x0,d.x),y0=Math.min(d.y0,d.y),y1=Math.max(d.y0,d.y);
  if(ED.tool==='fort'){if(x1-x0>=2&&y1-y0>=2){L.forts.push({x0,y0,x1,y1,side:ED.side,gates:[]});edSelect({k:'fort',i:L.forts.length-1});edSay('城垒已建。用“垒门”工具在墙上开门。');}else edSay('城垒至少 3×3 格，请拖大一些。');}
  else if(ED.tool==='camp'){if(x1>x0||y1>y0){L.camps.push({x0,y0,x1,y1,side:ED.side});edSelect({k:'camp',i:L.camps.length-1});}}
  else if(ED.tool==='sel'&&d.moved)edTab();
  edDraw();};
 ED.cv.addEventListener('pointerup',up);ED.cv.addEventListener('pointercancel',()=>{ED.drag=null;});
 $('etabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)edTab(b.dataset.t);});
 const P=$('epane');
 P.addEventListener('input',e=>{const t=e.target;if(t.tagName==='SELECT'||t.type==='checkbox')return;edApply(t);});
 P.addEventListener('change',e=>{const t=e.target;if(t.tagName==='SELECT'||t.type==='checkbox'){edApply(t);if(t.dataset.f==='side'||t.dataset.f==='ai.mode')edTab();}else if(t.dataset.json!==undefined&&!t.classList.contains('bad')&&(t.dataset.f==='sfx'||t.dataset.f==='unitTypes'))edTab();});
 P.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.tpl){const[f,k]=b.dataset.tpl.split('|'),v=JSON.parse(JSON.stringify(TPL[f][k])),L=ED.L;if(f==='unitTypes'||f==='sfx'){L[f]=L[f]&&typeof L[f]==='object'&&!Array.isArray(L[f])?L[f]:{};L[f][v[0]]=v[1];if(f==='unitTypes')edKinds();}else{if(!Array.isArray(L[f]))L[f]=L[f]?[L[f]]:[];L[f].push(v);}edTab();}
  else if(b.dataset.sfx){audio();const ops=(ED.L.sfx||{})[b.dataset.sfx];if(Array.isArray(ops))playOps(ops,1);}
  else if(b.dataset.e)edAct(b.dataset.e,b);});
 $('etop').addEventListener('click',e=>{const b=e.target.closest('button');if(b&&b.dataset.e)edAct(b.dataset.e,b);});
 $('e_pick').addEventListener('change',e=>{const v=e.target.value;if(!v)return;const i=Number(v.slice(1));if(v[0]==='L'&&LOCAL[i])edLoad(LOCAL[i],i);else if(EMBED[i])edLoad(Object.assign({},EMBED[i],{id:'lv'+Date.now().toString(36),name:(EMBED[i].name||'')+'（改）'}),-1);});
}

if(typeof window!=='undefined'&&window.__TEST)window.__CP={newGame,update,render,hud,drawMini,MISSIONS,get G(){return G;},init,cmd,order,tactic,mkMission,checkLevel,captureBuiltin,levelOut,edLoad,blankLevel,terrainOf,UT,CT,setRun(){running=true;}};
else init();
})();
