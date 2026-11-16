// 数据关卡测试：校验并试跑 levels/levels.json 的第一关，再测“内置战役抓取”往返。用法：node tests/level.js
const fs=require('fs');let t=fs.readFileSync(require('path').join(__dirname,'smoke.js'),'utf8');
t=t.slice(0,t.indexOf("const mode="));
eval(t+`
const LV=JSON.parse(fs.readFileSync(require('path').join(__dirname,'../levels/levels.json'),'utf8'))[0];
console.log('check:',CP.checkLevel(LV));
for(const mode of ['idle','rush','plan']){
 const M=CP.mkMission(LV);CP.newGame(M);const G=CP.G;G.paused=false;
 if(mode==='idle'&&true){const ch='.^f~=-#G:x%A*';for(let y=0;y<38;y+=1){let r='';for(let x=0;x<60;x++){const i=y*60+x;let c=ch[G.map[i]];for(const u of G.units)if((u.x/40|0)===x&&(u.y/40|0)===y)c=u.side===1?'O':'X';r+=c;}if(y%2===0)console.log(r);}
  console.log(G.units.map(u=>u.side+u.name+'('+u.kind+'/'+u.type+')').join(' '));console.log('ctr sishi>che',CP.CT.sishi.che,'ji>che',CP.CT.ji.che,'che>nu',CP.CT.che.nu,'UT.che',JSON.stringify(CP.UT.che));}
 for(let s=0;s<20*700&&!G.over;s++){
  if(mode!=='idle'&&s%20===10){const mine=G.units.filter(u=>u.side===1&&u.state!=='rout');const foes=G.units.filter(u=>u.side===2&&u.vis);
   for(const u of mine){if(u.general)continue;let gx=34*40,gy=10*40;if(mode==='plan'&&G.points[0].side!==1&&(u.type==='qi'||u.name==='死士乙阵'))(gx=13.5*40,gy=9.5*40);else if(mode==='plan'&&G.points[0].side===1&&u.name==='死士乙阵'){if(!u.hold&&Math.hypot(u.x-gx,u.y-gy)>60){}; gx=13.5*40;gy=9.5*40;}
    let b=null,bd=230;for(const e of foes){const d=Math.hypot(e.x-u.x,e.y-u.y);if(d<bd){bd=d;b=e;}}
    if(b){if(u.target!==b){G.sel=[u];CP.order(b.x,b.y);}}else if(Math.hypot(u.x-gx,u.y-gy)>70&&!u.path.length){G.sel=[u];CP.order(gx,gy);}}
   G.sel=[];}
  CP.update(.05);if(s%40===0){CP.render();CP.hud();CP.drawMini();}
  if(s%2400===0){let a=0,b=0;for(const u of G.units){if(u.side===1)a+=u.n;else b+=u.n;}console.log(' ',mode,'t',G.t.toFixed(0),'P',a|0,'E',b|0,'grain',G.grain.map(x=>x==null?'-':x.toFixed(0)).join('/'),'pt',G.points[0].side,'obj',JSON.stringify(G.M.obj(G).map(o=>o[1])));}
 }
 console.log(mode,'=>',G.over,'t',G.t.toFixed(0),'kill',G.stats.kill|0,'loss',G.stats.loss|0,'surr',G.stats.surr|0);
}
// 往返：内置关卡抓取 → 关卡对象 → 再生成
const cap=CP.captureBuiltin(1);console.log('capture',cap.name,cap.units.length,'units',cap.forts.length,'forts',cap.points.length,'pts rows',cap.rows.length,cap.rows[0].length,CP.checkLevel(cap));
const M2=CP.mkMission(cap);CP.newGame(M2);let G2=CP.G;G2.paused=false;for(let s=0;s<20*60;s++)CP.update(.05);CP.render();console.log('captured level runs, units',G2.units.length,'gates',G2.gates.length,'over',G2.over);
process.exit(0);`);
