#!/usr/bin/env python3
"""把 src/template.html + src/game.js + levels/levels.json 拼成单文件 index.html。"""
import json, pathlib
root = pathlib.Path(__file__).resolve().parent
tpl = (root / "src/template.html").read_text(encoding="utf8")
js = (root / "src/game.js").read_text(encoding="utf8")
levels = json.loads((root / "levels/levels.json").read_text(encoding="utf8"))
lv = json.dumps(levels, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
assert "</script" not in js, "game.js 里不能出现 </script"
assert "/*__GAME__*/" in tpl and "/*__LEVELS__*/" in tpl
(root / "index.html").write_text(tpl.replace("/*__LEVELS__*/", lv).replace("/*__GAME__*/", js), encoding="utf8")
print(f"index.html 已生成：引擎 {len(js)} 字符，随附关卡 {len(levels)} 关")
