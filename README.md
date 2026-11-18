# 长平之战 水墨兵戏

中国古风水墨风格的即时战略游戏，单文件网页，无外部依赖（字体除外），电脑和手机浏览器都能玩。

- 三场长平战役（坚壁、拔垒、合围），外加一关纯数据写成的样板关“破釜”（巨鹿之战）
- 戟、盾、弩、骑互克，四种阵形，地势、隘口、昼夜风雨、士气粮草
- 攻城器、筑楼、火攻、列阵战术（两翼包抄、绕后夹击、侧翼包抄）
- 2.5D 斜俯视画面，音效与配乐全部即时合成
- 内置战役编辑器：一关就是一段 JSON

## 运行

直接用浏览器打开 `index.html`。把仓库开成 GitHub Pages（Settings → Pages → 从 main 分支根目录发布）即可在线玩。完整部署流程见 [`docs/DEPLOY.md`](docs/DEPLOY.md)。

## 目录

| 路径 | 内容 |
|---|---|
| `src/game.js` | 引擎、三关原战役、数据关卡加载器、编辑器 |
| `src/template.html` | 页面骨架与样式 |
| `levels/levels.json` | 随附的数据关卡（数组），构建时嵌进页面 |
| `build.py` | 把以上三者拼成 `index.html` |
| `index.html` | 构建产物，已提交，方便直接打开或用 Pages 发布 |
| `tests/` | 无界面测试脚本（Node） |

## 构建与测试

```sh
python3 build.py            # 改了 src/ 或 levels/ 之后重新生成 index.html
node tests/smoke.js smart   # 脚本玩家跑完原三关（idle 为挂机）
node tests/level.js         # 校验并试跑 levels.json 第一关
node tests/tactics.js       # 三种列阵战术的走位
```

测试只需要 Node，不需要安装任何包。脚本玩家很粗糙，胜负有随机波动（第二关尤其如此），
它们的用处是确认“能跑完、不报错、胜负条件会触发”，不是衡量平衡。

## 加一关

1. 在游戏卷首点“战役编辑器”，画地图、摆军阵、写规则，在“导入导出”页生成 JSON；
2. 把这段 JSON 作为一个对象加进 `levels/levels.json` 的数组；
3. `python3 build.py`，再 `node tests/level.js` 看有没有报错。

关卡格式的完整说明在 `src/game.js` 的 `FORMAT_DOC`（搜这个名字），编辑器的“格式”页显示的是同一份文字。
`levels/levels.json` 里的“破釜”用到了自定兵种、粮草、增援、条件触发、配乐和自定音效，可以照着改。

## 已知局限

- 原三关仍是代码写的（`MISSIONS`），没有转成数据。
- 自定兵种只能换数值和旗号，外形与基本规则沿用戟、盾、弩、骑之一。
- 地图固定 60×38 格。
- 平衡只用脚本粗调过。
