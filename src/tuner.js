// 兵制调参器：网页里改规则参数 → 跑 tests/rules-suite.js → 出报告并与默认参数（或上一次）对比。
// 引擎（ENGINE）在无界面桩里运行，见 src/tuner.html；参数默认值来自 src/rules.json。
(function(){
'use strict';
const CP=ENGINE,RT=CP.RT,DEF=JSON.parse(JSON.stringify(RT.RULES0));
const $=id=>document.getElementById(id),esc=rulesReport.esc;
const clone=o=>JSON.parse(JSON.stringify(o));
{const st=document.createElement('style');st.textContent=rulesReport.CSS;document.head.prepend(st);}   // 报告样式在前，调参器样式覆盖其上

/* ---------- 参数说明：分组 → 键 → [名称, 说明] ---------- */
const META={
 elevation:['地势',{meleeUp:['居高近战加成','攻方每高一级，近战杀伤 +'],meleeDown:['仰攻近战减成','攻方每低一级，近战杀伤 −'],maxLv:['高差上限','加减成最多算几级'],
  shot:['居高射击加成','每高一级箭矢杀伤 +'],range:['居高射程加成','射手每高一级射程 +'],rangeTarget:['仰射射程减成','目标每高一级射程 −'],vision:['居高目力加成','每高一级目力 +'],
  upSpeed:['上坡速度','上坡每步速度 ×'],downSpeed:['下坡速度','下坡每步速度 ×'],chargeDown:['居高冲锋（势）','从高处冲下，冲锋再 ×']}],
 horse:['战马折损',{marsh:['沮泽','骑兵在沮泽每息折损 %'],forest:['林地','骑兵在林地每息折损 %'],hill2:['地势 2 的坡','每息折损 %'],hill3:['地势 3 的坡','每息折损 %'],
  rainForce:['雨中急行','平地雨中急行每息折损 %'],forceMul:['急行倍率','急行时折损 ×']}],
 march:['行军体力',{stamMarch:['常行耗体力','每息'],stamForce:['急行耗体力','每息'],stamFight:['接战耗体力','每息'],forceSpeed:['急行速度','×'],tiredAt:['疲惫线','体力低于此值行军变慢'],tiredSpeed:['疲惫速度','×']}],
 hold:['镇守设伏',{melee:['镇守受近战','×'],dugMelee:['深沟高垒受近战','×'],dugShot:['深沟高垒中箭','×'],dugTime:['成垒时间','镇守多少息成深沟高垒'],hideTime:['隐伏时间','林中镇守多少息隐身'],
  ambushMelee:['伏击近战','×'],ambushShot:['伏击射击','×'],ambushTime:['伏击时长（遇敌）','息'],ambushOrderTime:['伏击时长（出击）','息'],rest:['平时回体力','每息'],restHold:['镇守回体力','每息']}],
 terrain:['地形接战',{forestDef:['林中受近战','目标在林中 ×'],cavForest:['骑兵林沼作战','骑兵在林地/沮泽接战 ×'],fordTarget:['浅滩受近战','目标在浅滩 ×'],fordAttacker:['浅滩里打人','攻方在浅滩 ×'],
  marshTarget:['沮泽受近战','×'],wallTarget:['城上受近战','×'],wallAttacker:['城上打人','×'],campDef:['营中受近战','×'],forestShot:['林中中箭','×'],fordShot:['浅滩中箭','×'],wallShot:['城上中箭','×'],
  campShot:['营中中箭','×'],gapShot:['隘口中箭','×'],gapHighShot:['居高射隘口','再 ×'],frontageBase:['隘口接战基数','每阵至多 基数 + 每格 × 宽度 人'],frontagePer:['隘口每格人数','人'],gapSlow:['隘口挤行速度','大军在隘口 ×']}],
 charge:['冲锋',{cav:['骑兵冲锋','×'],inf:['步卒冲锋','×'],night:['夜袭冲锋','再 ×'],time:['冲锋持续','息'],run:['助跑时间','跑动多少息后接敌算冲锋']}],
 flank:['侧背',{side:['击侧杀伤','×'],rear:['击背杀伤','×'],sideMorale:['击侧士气打击','×'],rearMorale:['击背士气打击','×'],massMorale:['三阵围攻士气','再 ×']}],
 combat:['接战基础',{meleeBase:['近战基础杀伤','每千人每息'],sizeExp:['人数指数','杀伤 ∝ 人数^指数'],volleyBase:['箭矢基础杀伤','每千人每息'],volleyCd:['齐射间隔','息'],moveFight:['行进中接战','×'],
  moraleHit:['伤亡打击士气','每折损 1% 兵力掉士气'],stamMin:['近战体力下限','体力 0 时杀伤 ×'],moraleMin:['近战士气下限','士气 0 时 ×'],moraleSpan:['近战士气幅度','士气 100 时再 +'],
  shotStamMin:['射击体力下限','×'],shotMoraleMin:['射击士气下限','×'],shotMoraleSpan:['射击士气幅度','+'],deathFight:['死战','×'],routHit:['追击溃兵','×'],routShot:['射击溃兵','×'],
  restGap:['以逸待劳门槛','体力差超过多少'],restBonus:['以逸待劳','×']}],
 weather:['天时',{rainShot:['雨中箭矢','×'],rainPlainInf:['雨中步卒行军','平地 ×'],rainPlainCav:['雨中骑兵行军','平地 ×'],fogRange:['雾中射程','×'],fogVision:['雾中目力','×'],
  nightShot:['夜里箭矢减','杀伤 ×(1 − 此值)'],nightRange:['夜里射程减','射程 ×(1 − 此值)'],vision:['白昼目力','步'],nightVision:['夜里目力减','步']}],
 shield:['盾与圆阵',{dunArrow:['盾兵中箭','×'],dunYuanArrow:['盾兵圆阵中箭','×'],yuanArrow:['他兵圆阵中箭','×']}]};
const UN={ji:'戟兵',dun:'盾兵',nu:'弩手',qi:'骑兵',liang:'粮队'},FN={fang:'方阵',feng:'锋矢阵',yuan:'圆阵',yan:'雁行阵'};
const TN={plain:'平地',hill:'山丘',forest:'林地',ford:'浅滩',road:'道路',wall:'城墙',gate:'城门',camp:'营寨',burnt:'焦土',marsh:'沮泽',rubble:'残垣'};
// 表格型参数
const TABLES=[
 ['units','兵种',{rows:Object.keys(DEF.units),cols:['spd','atk','def','range'],rn:UN,cn:{spd:'速度',atk:'攻',def:'防',range:'射程'}}],
 ['counters','兵种相克',{rows:['ji','dun','nu','qi'],cols:['ji','dun','nu','qi','liang'],rn:UN,cn:UN,dflt:1,corner:'攻＼守'}],
 ['formations','阵形',{rows:Object.keys(DEF.formations),cols:['atk','def','spd','shot','rng'],rn:FN,cn:{atk:'攻',def:'守',spd:'速',shot:'箭矢',rng:'射程'},dflt:1}],
 ['formationCounters','阵形相克',{rows:['fang','feng','yuan','yan'],cols:['fang','feng','yuan','yan'],rn:FN,cn:FN,dflt:1,corner:'攻＼守'}],
 ['terrainSpeed','地形速度',{single:true,keys:Object.keys(DEF.terrainSpeed),kn:TN}],
 ['cavSpeed','骑兵地形速度',{single:true,keys:Object.keys(DEF.cavSpeed),kn:TN}]];

/* ---------- 状态 ---------- */
let cur=clone(DEF);
const get=(o,p)=>p.reduce((a,k)=>a==null?undefined:a[k],o);
const set=(o,p,v)=>{let a=o;for(let i=0;i<p.length-1;i++)a=a[p[i]]=a[p[i]]||{};a[p[p.length-1]]=v;};
const dflt=p=>{const v=get(DEF,p);if(v!==undefined)return v;const t=TABLES.find(t=>t[0]===p[0]);return t&&t[2].dflt!==undefined?t[2].dflt:undefined;};
// 改动：只收与默认不同的值
function diff(){const out={};const walk=(o,p)=>{for(const k in o){const v=o[k],q=p.concat(k);if(v&&typeof v==='object'&&!Array.isArray(v))walk(v,q);else if(v!==dflt(q))set(out,q,v);}};walk(cur,[]);return out;}
const nDiff=()=>{let n=0;const w=o=>{for(const k in o)typeof o[k]==='object'?w(o[k]):n++;};w(diff());return n;};
const merge=(a,b)=>{for(const k in b){if(b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])){a[k]=a[k]&&typeof a[k]==='object'?a[k]:{};merge(a[k],b[k]);}else a[k]=b[k];}return a;};
const store={get(){try{return JSON.parse(localStorage.getItem('zhulu-tuner')||'null');}catch(e){return null;}},put(v){try{localStorage.setItem('zhulu-tuner',JSON.stringify(v));}catch(e){}}};
{const s=store.get();if(s&&typeof s==='object')merge(cur,s);}

/* ---------- 参数面板 ---------- */
const stepOf=v=>{v=Math.abs(v);return v>=100?10:v>=10?1:v>=2?.1:.01;};
const fmtV=v=>v===undefined?'—':String(+Number(v).toFixed(4));
function inp(p,v){const d=dflt(p),ch=v!==d;
 return '<input type="number" inputmode="decimal" step="'+stepOf(d||v||1)+'" value="'+fmtV(v)+'" data-p="'+esc(p.join('.'))+'" aria-label="'+esc(p.join('.'))+'"'+(ch?' class="ch"':'')+' title="默认 '+fmtV(d)+'">';}
const wide=()=>{try{return matchMedia('(min-width:861px)').matches;}catch(e){return true;}};   // 手机上参数组默认收起，免得结果被挤到很下面
function renderParams(){
 const q=($('q').value||'').trim().toLowerCase();
 const hit=(...s)=>!q||s.some(x=>String(x).toLowerCase().includes(q));
 let h='';
 for(const g in META){const[gn,items]=META[g];let rows='';
  for(const k in items){if(!(k in DEF[g]))continue;const[ln,hint]=items[k];if(!hit(gn,ln,hint,k))continue;const p=[g,k],v=get(cur,p),d=dflt(p),ch=v!==d;
   rows+='<div class="pr'+(ch?' ch':'')+'"><label><span class="ln">'+esc(ln)+'</span><span class="hint">'+esc(hint)+'</span><code>'+esc(g+'.'+k)+'</code></label>'+inp(p,v)+
    '<button type="button" class="rs" data-reset="'+esc(p.join('.'))+'" aria-label="恢复默认"'+(ch?'':' hidden')+' title="恢复默认 '+fmtV(d)+'">↺</button><span class="dv">'+(ch?'原 '+fmtV(d):'')+'</span></div>';}
  if(rows)h+='<details class="pg"'+(q||(wide()&&(g==='elevation'||g==='horse'||g==='march'||g==='hold'))?' open':'')+'><summary>'+esc(gn)+'<small>'+esc(g)+'</small><b class="cnt" data-g="'+g+'"></b></summary><div class="prs">'+rows+'</div></details>';}
 for(const[g,gn,t]of TABLES){if(!hit(gn,g,...(t.keys||[]).map(k=>t.kn[k]),...(t.rows||[]).map(k=>t.rn[k])))continue;let tb;
  if(t.single)tb='<table><tbody>'+t.keys.map(k=>'<tr><th>'+esc(t.kn[k]||k)+'</th><td>'+inp([g,k],get(cur,[g,k]))+'</td></tr>').join('')+'</tbody></table>';
  else tb='<table><thead><tr><th>'+esc(t.corner||'')+'</th>'+t.cols.map(c=>'<th>'+esc(t.cn[c]||c)+'</th>').join('')+'</tr></thead><tbody>'+
   t.rows.map(r=>'<tr><th>'+esc(t.rn[r]||r)+'</th>'+t.cols.map(c=>{const p=[g,r,c],v=get(cur,p);return '<td>'+inp(p,v===undefined?dflt(p):v)+'</td>';}).join('')+'</tr>').join('')+'</tbody></table>';
  h+='<details class="pg"'+(q?' open':'')+'><summary>'+esc(gn)+'<small>'+esc(g)+'</small><b class="cnt" data-g="'+g+'"></b></summary><div class="ptbl">'+tb+'</div></details>';}
 $('params').innerHTML=h||'<p class="empty">没有匹配“'+esc(q)+'”的参数。</p>';counts();}
function counts(){const d=diff();for(const b of document.querySelectorAll('.cnt')){const g=b.dataset.g;let n=0;const w=o=>{for(const k in o)typeof o[k]==='object'?w(o[k]):n++;};w(d[g]||{});b.textContent=n?n+' 处改动':'';}
 const n=nDiff();$('nchg').textContent=n?'已改 '+n+' 项':'全部为默认值';$('nchg').classList.toggle('on',n>0);store.put(d);}
$('params').addEventListener('input',e=>{const t=e.target;if(!t.dataset.p)return;const p=t.dataset.p.split('.'),v=parseFloat(t.value);if(!isFinite(v))return;
 set(cur,p,v);const ch=v!==dflt(p);t.classList.toggle('ch',ch);const row=t.closest('.pr');
 if(row){row.classList.toggle('ch',ch);row.querySelector('.rs').hidden=!ch;row.querySelector('.dv').textContent=ch?'原 '+fmtV(dflt(p)):'';}counts();stale();});
$('params').addEventListener('click',e=>{const b=e.target.closest('[data-reset]');if(!b)return;const p=b.dataset.reset.split('.');set(cur,p,dflt(p));renderParams();stale();});
$('q').addEventListener('input',renderParams);

/* ---------- 跑测试 ---------- */
let BASE=null,PREV=null,LAST=null,running=false;
const suite=rulesSuite(CP),N=suite.tests.length;
const tick=()=>new Promise(r=>setTimeout(r,0));
async function runAll(over,label){const out=[];
 RT.setRules(over);
 for(let i=0;i<N;i++){const t=suite.tests[i];prog(label+'　'+t.id+' '+t.name.replace(/^(模拟|发现)：/,''),i/N);await tick();out.push(suite.runOne(t));}
 RT.setRules(over);return out;}
function prog(txt,f){$('prog').hidden=false;$('progt').textContent=txt;$('progb').style.width=Math.round(f*100)+'%';}
function stale(){if(LAST)$('stale').hidden=false;}
async function go(){if(running)return;running=true;$('run').disabled=true;$('stale').hidden=true;const t0=performance.now();
 try{
  if(!BASE)BASE=await runAll({},'默认参数');
  const over=diff(),dflt=!Object.keys(over).length;
  const res=dflt?BASE:await runAll(over,'当前参数');
  if(LAST&&LAST.res!==res)PREV=LAST;
  LAST={res,over:dflt?null:clone(over),at:new Date()};
  show((performance.now()-t0)/1000);
 }catch(e){$('report').innerHTML='<p class="err">运行出错：'+esc(e&&e.message)+'</p>';console.error(e);}
 finally{RT.setRules(diff());$('prog').hidden=true;running=false;$('run').disabled=false;}}
function show(sec){
 const cmp=$('cmp').value,ref=cmp==='prev'&&PREV?PREV.res:BASE,isBase=LAST.res===BASE;
 RT.setRules(LAST.over||{});
 const data={RES:LAST.res,BASE:isBase&&cmp!=='prev'?null:ref,CP,RT,over:LAST.over,date:''};
 $('report').innerHTML=rulesReport.body(data,{embed:true});
 RT.setRules(diff());
 const pass=LAST.res.filter(r=>r.pass).length;
 $('meta').textContent=(isBase?'默认参数':'当前参数（'+(LAST.over?nDiffOf(LAST.over):0)+' 处改动）')+'　'+pass+'/'+N+' 通过'+(sec?'　用时 '+sec.toFixed(1)+' 秒':'')+(data.BASE?'　对比：'+(cmp==='prev'&&PREV?'上一次运行':'默认参数'):'');}
const nDiffOf=o=>{let n=0;const w=x=>{for(const k in x)typeof x[k]==='object'?w(x[k]):n++;};w(o);return n;};
$('run').addEventListener('click',go);
$('cmp').addEventListener('change',()=>{if(LAST)show();});
$('reset').addEventListener('click',()=>{if(!$('reset').dataset.armed){$('reset').dataset.armed='1';$('reset').textContent='再点一次确认';setTimeout(()=>{delete $('reset').dataset.armed;$('reset').textContent='全部恢复默认';},2500);return;}
 delete $('reset').dataset.armed;$('reset').textContent='全部恢复默认';cur=clone(DEF);renderParams();stale();});

/* ---------- 导入导出 ---------- */
const dlg=$('dlg');
// 被嵌在别的页面里（例如预览框）时浏览器多半不让下载，只留“复制”
const canDL=(()=>{try{return window.top===window;}catch(e){return false;}})();
function openDlg(title,text,mode){$('dlgt').textContent=title;$('dlgx').value=text;$('dlgx').readOnly=mode!=='import';$('dlgok').hidden=mode!=='import';$('dlgcopy').hidden=mode==='import';
 $('dlgdl').hidden=mode!=='report'||!canDL;$('dlgmsg').textContent=mode==='import'?'粘贴参数 JSON：可以只写改动的项（如 {"charge":{"inf":1}}），也可以是整份 rules.json。':
  mode==='diff'?'只含改动的项。存成文件后可在命令行复现：node tests/rules.js --rules 文件.json':mode==='full'?'整份参数。确定要采用时，替换仓库里的 src/rules.json，再 python3 build.py。':'整页报告 HTML，可存成 .html 文件分享。';
 dlg.hidden=false;$('dlgx').focus();if(mode!=='import')$('dlgx').select();}
$('exdiff').addEventListener('click',()=>openDlg('导出改动',JSON.stringify(diff(),null,2),'diff'));
$('exfull').addEventListener('click',()=>openDlg('导出整份 rules.json',fullJson(),'full'));
$('exrep').addEventListener('click',()=>{if(!LAST){$('meta').textContent='先跑一次测试，才能导出报告。';return;}RT.setRules(LAST.over||{});
 const h=rulesReport.page({RES:LAST.res,BASE:LAST.res===BASE?null:BASE,CP,RT,over:LAST.over,date:new Date().toISOString().slice(0,10)});RT.setRules(diff());openDlg('导出报告',h,'report');});
$('imp').addEventListener('click',()=>openDlg('导入参数','','import'));
$('dlgclose').addEventListener('click',()=>{dlg.hidden=true;});
dlg.addEventListener('click',e=>{if(e.target===dlg)dlg.hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dlg.hidden)dlg.hidden=true;});
$('dlgcopy').addEventListener('click',async()=>{const x=$('dlgx');try{await navigator.clipboard.writeText(x.value);$('dlgmsg').textContent='已复制。';}catch(e){x.select();$('dlgmsg').textContent='浏览器不让直接复制，已全选，请按 Ctrl/⌘+C。';}});
$('dlgdl').addEventListener('click',()=>{try{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([$('dlgx').value],{type:'text/html'}));a.download='zhulu-rules-report.html';document.body.appendChild(a);a.click();a.remove();}catch(e){$('dlgmsg').textContent='这里不能下载，请复制后自己存成 .html。';}});
$('dlgok').addEventListener('click',()=>{let o;try{o=JSON.parse($('dlgx').value);}catch(e){$('dlgmsg').textContent='JSON 格式不对：'+e.message;return;}
 if(!o||typeof o!=='object'||Array.isArray(o)){$('dlgmsg').textContent='需要一个 JSON 对象。';return;}
 const unknown=[];const chk=(x,p)=>{for(const k in x){const q=p.concat(k);if(x[k]&&typeof x[k]==='object')chk(x[k],q);else if(dflt(q)===undefined)unknown.push(q.join('.'));else if(typeof x[k]!=='number')unknown.push(q.join('.')+'（不是数字）');}};chk(o,[]);
 if(unknown.length){$('dlgmsg').textContent='这些键不认识：'+unknown.slice(0,6).join('、')+(unknown.length>6?' 等':'');return;}
 cur=merge(clone(DEF),o);renderParams();stale();dlg.hidden=true;});
// 整份 rules.json：沿用仓库里的排版习惯，每组一行或一表一行
function fullJson(){const L=['{'],ks=Object.keys(cur);ks.forEach((k,i)=>{const v=cur[k],tail=i<ks.length-1?',':'';
 const sub=Object.values(v).some(x=>x&&typeof x==='object');
 if(sub){L.push('  '+JSON.stringify(k)+': {');const sk=Object.keys(v);sk.forEach((s,j)=>L.push('    '+JSON.stringify(s)+': '+JSON.stringify(v[s]).replace(/,"/g,', "').replace(/":/g,'": ')+(j<sk.length-1?',':'')));L.push('  }'+tail);}
 else L.push('  '+JSON.stringify(k)+': '+JSON.stringify(v).replace(/,"/g,', "').replace(/":/g,'": ')+tail);});L.push('}');return L.join('\n')+'\n';}

renderParams();
// 打开即跑一遍（先默认，有改动再跑当前）
setTimeout(go,60);
})();
