#!/usr/bin/env python3
"""把 src/template.html + src/game.js + src/rules.json + levels/levels.json 拼成单文件 index.html；
再把引擎、规则测试集与 src/tuner.* 拼成调参器 tuner.html。"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent
tpl = (root / "src/template.html").read_text(encoding="utf8")
js = (root / "src/game.js").read_text(encoding="utf8")
levels = json.loads((root / "levels/levels.json").read_text(encoding="utf8"))
rules = json.dumps(json.loads((root / "src/rules.json").read_text(encoding="utf8")), ensure_ascii=False, separators=(",", ":"))
lv = json.dumps(levels, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
assert "</script" not in js, "game.js 里不能出现 </script"
assert "/*__GAME__*/" in tpl and "/*__LEVELS__*/" in tpl
assert js.count("/*__RULES__*/null") == 1, "game.js 里应有且只有一处 /*__RULES__*/null"
js = js.replace("/*__RULES__*/null", rules)
(root / "index.html").write_text(tpl.replace("/*__LEVELS__*/", lv).replace("/*__GAME__*/", js), encoding="utf8")
print(f"index.html 已生成：引擎 {len(js)} 字符，随附关卡 {len(levels)} 关")

# 调参器：引擎 + 测试集 + 报告模板 + 界面
tt = (root / "src/tuner.html").read_text(encoding="utf8")
parts = {"/*__GAME__*/": js, "/*__SUITE__*/": (root / "tests/rules-suite.js").read_text(encoding="utf8"),
         "/*__REPORT__*/": (root / "tests/rules-report-template.js").read_text(encoding="utf8"),
         "/*__TUNER__*/": (root / "src/tuner.js").read_text(encoding="utf8")}
for k, v in parts.items():
    assert k in tt, f"tuner.html 缺占位符 {k}"
    assert "</script" not in v, f"{k} 的内容里不能出现 </script"
    tt = tt.replace(k, v)
(root / "tuner.html").write_text(tt, encoding="utf8")
print(f"tuner.html 已生成：{len(tt)} 字符")
