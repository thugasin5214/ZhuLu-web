// 多语言测试：英文模式下跑各关，收集军报、状态栏、简报、战报，查漏翻的中文。用法：node tests/i18n.js
// 允许保留中文的地方：孙子语录、士卒呼喝、旗上字、地图题字（都不经过这里），以及英文里括注的中文专名，如 South Wood (南林)。
const fs=require('fs');let t=fs.readFileSync(require('path').join(__dirname,'smoke.js'),'utf8');
t=t.slice(0,t.indexOf("const mode=")).replace('global.window={__TEST:true,',"global.window={__TEST:true,__LANG:'en',");
eval(t+`
const HAN=/[\\u4e00-\\u9fff]/;
const strip=s=>String(s).replace(/<(small|span|em)[^>]*lang="zh"[^>]*>[^<]*<\\/\\1>/g,'').replace(/<em class="seal[^>]*>[^<]*<\\/em>/g,'').replace(/<p class="seal[^>]*>[^<]*<\\/p>/g,'').replace(/[（(][^()（）]*[)）]/g,'').replace(/“[^”]{1,4}”/g,'').replace(/^[子丑寅卯辰巳午未申酉戌亥] /,'');
const bad=new Map();const chk=(where,s)=>{const r=strip(s);if(HAN.test(r)){const k=where+': '+r.slice(0,160);bad.set(k,(bad.get(k)||0)+1);}};
window.__onMsg=m=>chk('msg',m);
console.log('LANG',CP.LANG);
CP.buildTitle();
const levels=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../levels/levels.json'),'utf8'));
const runs=CP.MISSIONS.map((M,i)=>[M.name,()=>CP.newGame(i)]).concat(levels.map(L=>[L.name,()=>CP.newGame(CP.mkMission(L))]));
for(const [name,start] of runs){start();const G=CP.G;G.paused=false;chk(name+' brief',CP.briefHtml(G.M));
 for(let s=0;s<20*240&&!G.over;s++){
  if(s%20===5){const mine=G.units.filter(u=>u.side===1&&u.alive&&!u.auto&&u.state!=='rout');const foes=G.units.filter(u=>u.side===2&&u.alive&&u.vis);
   if(s%400===5&&mine.length){G.sel=[mine[(s/400|0)%mine.length]];CP.hud();for(const id of ['selinfo','objlist','clock','wx','force'])chk(name+' hud#'+id,els[id].innerHTML);
    for(const c of ['split','merge','build','fire','siege','ram','hold','march','stop'])CP.cmd(c);G.fireMode=false;CP.fireAt({x:G.sel[0].x+60,y:G.sel[0].y});}
   for(const u of mine){let b=null,bd=1e9;for(const e of foes){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;b=e;}}if(b&&!u.target){G.sel=[u];CP.order(b.x,b.y);}}G.sel=[];}
  CP.update(.05);}
 CP.hud();for(const id of ['objlist','clock','wx','force','selinfo'])chk(name+' hud#'+id,els[id].innerHTML);
 const r=G.M.check(G)||G.over||['lose','x'];G.over=null;CP.endGame(r[0]==='win'?r:['lose',r[1]]);chk(name+' end',els.mbody.innerHTML);
 G.over=null;CP.endGame(['win']);chk(name+' win',els.mbody.innerHTML);
 console.log('ran',name,'t',G.t.toFixed(0));}
for(const [k,n] of bad)console.log('LEAK x'+n,k);
console.log(bad.size?'FAIL '+bad.size+' leaks':'ok no leaks');process.exit(bad.size?1:0);`);
