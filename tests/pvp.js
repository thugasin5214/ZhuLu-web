// 联机对战测试：同一进程里起两个互相隔离的引擎（主机、客机），用模拟的 BroadcastChannel 连起来，
// 走完握手、传战图、开局、客机下令、主机广播战况、分出胜负。用法：node tests/pvp.js [en]
const fs=require('fs'),path=require('path'),vm=require('vm');
const SRC=fs.readFileSync(path.join(__dirname,'../src/game.js'),'utf8');
const LV=JSON.parse(fs.readFileSync(path.join(__dirname,'../levels/levels.json'),'utf8'));
const EN=process.argv.includes('en');
// 模拟通道：消息先排队，由测试循环统一投递，并做一次 JSON 往返（等同结构化克隆）
const chans={},queue=[];
class BC{constructor(n){this.n=n;this.onmessage=null;(chans[n]=chans[n]||[]).push(this);}
 postMessage(o){const d=JSON.stringify(o);for(const c of chans[this.n])if(c!==this)queue.push([c,d]);}
 close(){chans[this.n]=chans[this.n].filter(c=>c!==this);}}
let sent=0;
function flush(){let k=0;while(queue.length&&k++<5000){const[c,d]=queue.shift();sent+=d.length;if(c.onmessage)c.onmessage({data:JSON.parse(d)});}}
function ctxP(){const g={addColorStop(){}};return new Proxy({},{get(o,k){if(k in o)return o[k];if(k==='createRadialGradient'||k==='createLinearGradient')return()=>g;if(k==='measureText')return()=>({width:10});return()=>{};},set(o,k,v){o[k]=v;return true;}});}
function el(){return{style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return false}},children:[],width:300,height:200,hidden:false,innerHTML:'',value:'',
 getContext(){return ctxP()},addEventListener(){},appendChild(){},remove(){},getBoundingClientRect(){return{left:0,top:0,width:1200,height:700}},closest(){return null},setPointerCapture(){},querySelectorAll(){return[]},querySelector(){return null},setAttribute(){}};}
function engine(lang){const els={levels:Object.assign(el(),{textContent:JSON.stringify(LV)})},log=[];
 const win={__TEST:true,addEventListener(){},devicePixelRatio:1,__onMsg:(t,k)=>log.push(t)};if(lang)win.__LANG=lang;
 const ctx={window:win,document:{getElementById:id=>els[id]||(els[id]=el()),createElement:()=>el(),fonts:{load(){}},documentElement:el(),querySelectorAll(){return[]}},
  localStorage:{getItem(){return null},setItem(){}},requestAnimationFrame(){},setTimeout(){return 0},clearTimeout(){},setInterval(){return 0},clearInterval(){},
  BroadcastChannel:BC,TextEncoder,TextDecoder,CompressionStream,DecompressionStream,Response,btoa,atob,Uint8Array,performance:{now:()=>Date.now()},console,Promise,navigator:{}};
 vm.createContext(ctx);vm.runInContext(SRC,ctx);const CP=win.__CP;CP.init();return{CP,log,win};}
const tick=()=>new Promise(r=>setImmediate(r));
let fails=0;const ok=(c,t)=>{if(!c){fails++;console.log('✗ '+t);}else console.log('✓ '+t);};

(async()=>{
 const H=engine(EN?'en':''),Gst=engine(EN?'en':'');
 const maps=H.CP.pvpMaps();ok(maps.length>=1,'有对战图：'+maps.map(L=>L.name).join('、'));
 ok(!LV.filter(L=>!L.pvp&&!L.first).some(L=>L.pvp),'对战图不进战役列表');
 await H.CP.netHost(maps[0],'test');await Gst.CP.netJoin('test');
 for(let i=0;i<10;i++){flush();await tick();}
 const hg=H.CP.G,gg=Gst.CP.G;
 ok(hg&&hg.pvp&&H.CP.ME===1,'主机开局，执一号阵营');
 ok(gg&&gg.pvp&&Gst.CP.ME===2,'客机入局，执二号阵营');
 ok(gg.units.every(u=>u.side===2),'客机开局只知道自己的军阵');
 const step=n=>{for(let i=0;i<n;i++){H.CP.update(.05);H.CP.netHostTick(.05);Gst.CP.guestTick(.05);flush();}};
 step(40);
 // 客机下令：全军向西压上
 const gMine=()=>Gst.CP.G.units.filter(u=>u.side===2&&u.alive&&!u.auto&&u.state!=='rout');
 const before=hg.units.filter(u=>u.side===2&&!u.general).map(u=>u.x);
 Gst.CP.G.sel=gMine().filter(u=>!u.general);Gst.CP.order(28*40,19*40);Gst.CP.G.sel=[];
 step(200);
 const after=hg.units.filter(u=>u.side===2&&!u.general).map(u=>u.x);
 ok(after.filter((x,i)=>x<before[i]-40).length>=4,'客机号令在主机上生效（青旗多阵西移）');
 const hu=hg.units.find(u=>u.side===2&&!u.general&&u.alive),gu=Gst.CP.G.units.find(u=>u.id===hu.id);
 ok(gu&&Math.hypot(gu.x-hu.x,gu.y-hu.y)<60,'客机看到的位置与主机一致（误差 '+(gu?Math.hypot(gu.x-hu.x,gu.y-hu.y).toFixed(0):'—')+'）');
 {const seen=Gst.CP.G.units.filter(u=>u.side===1).length,all=hg.units.filter(u=>u.side===1&&u.alive).length,vis=hg.units.filter(u=>u.side===1&&u.alive&&u.vis).length;
  ok(seen<=vis+1&&seen<all,'客机只收到看得见的朱旗军阵（看见 '+seen+'，主机上可见 '+vis+'，共 '+all+'）');}
 // 客机不能暂停
 Gst.CP.cmd('pause');ok(!Gst.CP.G.paused,'联机对战不能暂停');
 // 双方全军压向对方主将，直到分出胜负
 for(let s=0;s<20*900&&!(hg.over&&Gst.CP.G.over);s++){
  if(s%40===0){const hgen=hg.units.find(u=>u.side===2&&u.general);
   if(hgen){hg.sel=hg.units.filter(u=>u.side===1&&u.alive&&!u.auto&&u.state!=='rout');H.CP.order(hgen.x,hgen.y);hg.sel=[];}
   const tgt=Gst.CP.G.units.find(u=>u.side===1&&u.alive)||{x:8*40,y:19*40};Gst.CP.G.sel=gMine();Gst.CP.order(tgt.x,tgt.y);Gst.CP.G.sel=[];}
  step(1);}
 const ho=hg.over,go=Gst.CP.G.over;
 console.log('  结局 主机',JSON.stringify(ho),JSON.stringify(hg.pvpEnd),'客机',JSON.stringify(go),JSON.stringify(Gst.CP.G.pvpEnd),'t',hg.t.toFixed(0),'流量',(sent/1024|0)+'KB');
 ok(ho&&go,'双方都收到结局');
 ok(ho&&go&&hg.pvpEnd.w===Gst.CP.G.pvpEnd.w,'胜方一致');
 ok(ho&&go&&(ho[0]==='win')!==(go[0]==='win')||hg.pvpEnd&&hg.pvpEnd.w===0,'一胜一负');
 const zh=/[一-鿿]{3,}/;
 if(EN)ok(!H.log.concat(Gst.log).some(t=>zh.test(t)&&!/[A-Za-z]/.test(t)),'英文模式下战报没有纯中文（士卒呼喝除外）');
 // 直连码：打包解包
 const sdp={type:'offer',sdp:'v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n'.repeat(20)};
 const code=await H.CP.packSdp(sdp),back=await H.CP.unpackSdp(code);
 ok(back.sdp===sdp.sdp&&back.type==='offer','邀请码打包、解包往返一致（'+code.length+' 字）');
 let bad=false;try{await H.CP.unpackSdp('CP1.@@@');}catch(e){bad=true;}ok(bad,'坏邀请码会报错');
 console.log(fails?'FAIL '+fails:'ok');process.exit(fails?1:0);
})();
