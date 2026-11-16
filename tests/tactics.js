// 列阵战术测试：三种战术各走一遍并打印走位。用法：node tests/tactics.js
const fs=require('fs');let t=fs.readFileSync(require('path').join(__dirname,'smoke.js'),'utf8');
t=t.slice(0,t.indexOf("const mode="));
eval(t+`
for(const mode of ['wings','rear','side']){
 CP.newGame(0);const G=CP.G;G.paused=false;
 for(let s=0;s<20*40;s++)CP.update(.05);
 const e=G.units.find(u=>u.side===2&&u.type==='ji');const me=G.units.find(u=>u.side===1&&u.name==='戟兵甲阵');
 // 把敌军钉在原地便于观察
 e.ai={mode:'guard',post:{x:e.x,y:e.y},leash:10,stay:true};e.path=[];e.hold=true;
 G.sel=[me];const n0=G.units.length;CP.tactic(mode,e);
 const mine=G.sel.slice();console.log(mode,'units',n0,'->',G.units.length,'e at',(e.x/40).toFixed(1),(e.y/40).toFixed(1),'face',e.face.toFixed(2));
 for(let s=0;s<20*40;s++){CP.update(.05);if(s%40===0){CP.render();CP.hud();}
  if(s%160===0)console.log('  t+'+(s/20),mine.map(u=>u.alive?u.name+' '+(u.x/40).toFixed(1)+','+(u.y/40).toFixed(1)+(u.man?' 抄':'')+(u.hold?' 守':'')+(u.target?' >'+u.target.name:'')+' n'+(u.n|0):'x').join(' | '),'E n'+(e.n|0),'m'+(e.morale|0));}
}
// 多阵
CP.newGame(0);const G=CP.G;G.paused=false;for(let s=0;s<20*40;s++)CP.update(.05);
const e=G.units.find(u=>u.side===2&&u.type==='ji');G.sel=G.units.filter(u=>u.side===1&&(u.type==='ji'||u.type==='qi'));const n0=G.units.length;CP.tactic('rear',e);
console.log('multi',n0,G.units.length,G.sel.map(u=>u.name+(u.hold?' 守':'')+(u.man?' 抄':'')).join(' | '));
for(let s=0;s<20*30;s++)CP.update(.05);console.log(G.sel.map(u=>u.name+(u.man?' 抄':'')+(u.target?' >'+u.target.name:'')).join(' | '));
process.exit(0);`);
