// 冒烟测试：无界面跑完原三关。用法：node tests/smoke.js [idle|smart]
const fs=require('fs');
function ctxP(){const g={addColorStop(){}};const t={};return new Proxy(t,{get(o,k){if(k in o)return o[k];if(k==='createRadialGradient'||k==='createLinearGradient')return()=>g;if(k==='measureText')return()=>({width:10});return()=>{};},set(o,k,v){o[k]=v;return true;}});}
function el(){const o={style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],width:300,height:200,hidden:false,innerHTML:'',
 getContext(){return ctxP()},addEventListener(){},appendChild(){},remove(){},getBoundingClientRect(){return{left:0,top:0,width:1200,height:700}},closest(){return null},setPointerCapture(){}};return o;}
const els={};
global.document={getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),fonts:{load(){}}};
global.window={__TEST:true,addEventListener(){},devicePixelRatio:1};
global.localStorage={getItem(){return null},setItem(){}};
global.requestAnimationFrame=()=>{};
const realST=setTimeout;global.setTimeout=()=>0;global.clearTimeout=()=>{};
eval(fs.readFileSync(require('path').join(__dirname,'../src/game.js'),'utf8').replace('/*__RULES__*/null',()=>fs.readFileSync(require('path').join(__dirname,'../src/rules.json'),'utf8')));
const CP=window.__CP;CP.init();
const mode=process.argv[2]||'idle';
for(let mi=0;mi<3;mi++){
  CP.newGame(mi);const G=CP.G;G.paused=false;
  // sanity: spawn tiles
  let res=null;const t0=Date.now();
  // override endGame effect: detect via G.over
  for(let s=0;s<20*700&&!G.over;s++){
    if(mode==='smart'&&s%20===10){
      const mine=G.units.filter(u=>u.side===1&&!u.auto&&u.state!=='rout');
      const foes=G.units.filter(u=>u.side===2&&u.vis);
      const atkMove=(u,gx,gy,stopR)=>{let b=null,bd=230;for(const e of foes){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;b=e;}}
        if(b){if(u.target!==b){G.sel=[u];CP.order(b.x,b.y);}}
        else if(Math.hypot(u.x-gx,u.y-gy)>stopR){if(!u.path.length){G.sel=[u];CP.order(gx,gy);}}
        else if(!u.hold){G.sel=[u];CP.cmd('hold');}};
      if(mi===0){for(const u of mine){if(u.name==='戟兵丙阵'){if(Math.hypot(u.x-44.5*40,u.y-12*40)>30){if(!u.path.length&&!u.hold){G.sel=[u];CP.order(44.5*40,12*40);}}else if(!u.hold){G.sel=[u];CP.cmd('hold');}continue;}if(u.type==='qi')atkMove(u,52*40,12*40,80);else if(!u.hold&&!u.general&&u.type!=='nu'){if(Math.hypot(u.x-41*40,u.y-18.5*40)>90){if(!u.path.length){G.sel=[u];CP.order(41*40,18.5*40);}}else{G.sel=[u];CP.cmd('hold');}}}}
      if(mi===1){const gen=G.gen[1];for(const u of mine){if(u.general){if(G.t>150)atkMove(u,44*40,29*40,60);continue;}
         if(G.gates[1].hp>0)atkMove(u,46.5*40,23.5*40,40);else atkMove(u,46.5*40,18.5*40,70);}}
      if(mi===2){for(const u of mine){if(u.name.startsWith('奇兵'))atkMove(u,55.5*40,7.5*40,70);
         else if(G.flags.brk&&!u.general){if(u.hold){G.sel=[u];CP.cmd('hold');}atkMove(u,53*40,9*40,90);}
         else if(!u.hold&&!u.general&&u.type!=='nu'){if(Math.hypot(u.x-10.5*40,u.y-18.5*40)>110){if(!u.path.length){G.sel=[u];CP.order(10.5*40,18.5*40);}}else{G.sel=[u];CP.cmd('hold');}}}}
      G.sel=[];
    }
    CP.update(0.05);
    if(s%40===0){CP.render();CP.hud();CP.drawMini();}
    if(s%2000===0){let a=0,b=0;for(const u of G.units){if(u.side===1)a+=u.n;else b+=u.n;}console.log(' m'+mi,'t',G.t.toFixed(0),'P',a|0,'E',b|0,'units',G.units.length,'grain',G.grain.map(x=>x==null?'-':x.toFixed(0)).join('/'),'pts',G.points.map(p=>p.side).join(''),'gates',G.gates.map(g=>g.hp|0).join(','));}
  }
  console.log('M'+mi,mode,'=>',G.over,'t',G.t.toFixed(0),'ms',Date.now()-t0,'kill',G.stats.kill|0,'loss',G.stats.loss|0,'conv',G.convArr,G.convLost);
}
process.exit(0);
