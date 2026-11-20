// 规则数值测试：把战斗、行军、地势、战马、镇守等规则写成可复现的数字测试。测试本身在 tests/rules-suite.js（与网页调参器 tuner.html 共用）。
// 用法：node tests/rules.js                     跑全部测试，打印结果，并生成 docs/rules-report.html
//       node tests/rules.js --no-html           只打印
//       node tests/rules.js --rules 改动.json    先用这份参数覆盖 src/rules.json 的默认值再跑（可以只写改动的项），报告里对比默认参数
//       node tests/rules.js --fragment <文件>    另存一份不带 html/head/body 外壳的页面片段（用于发布）
const fs=require('fs'),path=require('path');
{let t=fs.readFileSync(path.join(__dirname,'smoke.js'),'utf8');t=t.slice(0,t.indexOf('const mode='));eval(t);}
const CP=window.__CP,RT=CP.RT;
const suite=require('./rules-suite.js')(CP),tpl=require('./rules-report-template.js');
const arg=k=>{const i=process.argv.indexOf(k);return i>0?process.argv[i+1]:null;};
const runAll=()=>suite.tests.map(t=>{const r=suite.runOne(t);console.log((r.pass?'ok  ':'FAIL')+' '+r.id+' '+r.name+(r.measured&&!r.table?'  →  '+String(r.measured):''));return r;});

let BASE=null,over=null;
if(arg('--rules')){over=JSON.parse(fs.readFileSync(arg('--rules'),'utf8'));console.log('— 默认参数 —');BASE=runAll();RT.setRules(over);console.log('\n— 覆盖参数 '+arg('--rules')+' —');}
const RES=runAll();
const pass=RES.filter(r=>r.pass).length;
console.log('\n'+pass+'/'+RES.length+' 项通过');
if(!process.argv.includes('--no-html')){
 const data={RES,BASE,CP,RT,over,date:new Date().toISOString().slice(0,10)};
 fs.writeFileSync(path.join(__dirname,'../docs/rules-report.html'),tpl.page(data),'utf8');console.log('报告已写入 docs/rules-report.html');
 const fr=arg('--fragment');if(fr){fs.writeFileSync(fr,tpl.page(data,{fragment:true}),'utf8');console.log('页面片段已写入 '+fr);}}
process.exit(pass===RES.length?0:1);
