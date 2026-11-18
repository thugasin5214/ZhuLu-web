// 教学关“讲武”测试：脚本玩家按教示逐课操作，确认每一课都能触发、最终取胜。用法：node tests/tutorial.js
const fs=require('fs');let t=fs.readFileSync(require('path').join(__dirname,'smoke.js'),'utf8');
t=t.slice(0,t.indexOf("const mode="));
eval(t+`
const LV=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../levels/levels.json'),'utf8')).find(l=>l.id==='jiangwu');
if(!LV){console.log('FAIL 找不到教学关');process.exit(1);}
console.log('check:',CP.checkLevel(LV));
CP.newGame(CP.mkMission(LV));const G=CP.G;G.paused=false;
const U=n=>G.units.find(u=>u.name===n&&u.alive);
const mine=()=>G.units.filter(u=>u.side===1&&u.alive&&!u.auto&&u.state!=='rout');
const flag=n=>!!G.flags['f_'+n];
let step=0,failed=false;
function run(until,max,act){for(let s=0;s<max*20;s++){if(act&&s%20===0)act();CP.update(.05);if(s%200===0){CP.render();CP.hud();}if(until())return true;if(G.over)return until();}return false;}
function lesson(name,ok){console.log((ok?'ok  ':'FAIL')+' '+name+'  t='+G.t.toFixed(0));if(!ok)failed=true;}
G.sel=[U('前军')];CP.order(22.5*40,19.5*40);
lesson('一 行军',run(()=>flag('一'),120));
CP.cmd('all');CP.order(22*40,19*40);
lesson('二 统众',run(()=>flag('二'),120));
CP.cmd('all');for(const f of ['fang','feng','yuan','yan'])CP.cmd(f);
lesson('三 四阵',run(()=>flag('三'),5));
for(const f of ['fang'])CP.cmd(f);
lesson('四 接战',run(()=>flag('四'),300,()=>{const e=G.units.find(u=>u.tag==='靶'&&u.alive);if(e){G.sel=mine();CP.order(e.x,e.y);}}));
G.sel=[U('弩营')];CP.order(32*40,27*40);
lesson('五 火攻',run(()=>flag('五'),120,()=>{const a=U('弩营');if(a&&Math.hypot(a.x-32*40,a.y-27*40)<80){G.sel=[a];CP.fireAt({x:36.5*40,y:27.5*40});}}));
const foe=()=>G.units.find(u=>u.tag==='敌'&&u.alive);
G.sel=mine().filter(u=>!u.general&&u.type!=='nu');CP.tactic('wings',foe());
lesson('六 合击（用战术）',!!G.used.tac);
lesson('七 击破秦军',run(()=>G.over&&G.over[0]==='win',600,()=>{const e=foe();if(e)for(const u of mine())if(!u.man&&!u.target){G.sel=[u];CP.order(e.x,e.y);}}));
console.log('over',JSON.stringify(G.over),'obj',JSON.stringify(G.M.obj(G).map(o=>o[1])),'kill',G.stats.kill|0,'loss',G.stats.loss|0,'fires burnt',[...G.burnt].filter(x=>x).length);
process.exit(failed?1:0);`);
