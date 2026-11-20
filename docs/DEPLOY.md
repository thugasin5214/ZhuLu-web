# 部署 Runbook — 逐鹿 Web 版（ZhuLu-web）

本项目是**纯静态单文件网页**：构建产物只有根目录的 `index.html`（引擎、关卡数据、样式全部内联，只有字体从 Google Fonts 加载）。部署就是把这个文件放到任意静态托管上，默认方案是 GitHub Pages。

| 项目 | 值 |
|---|---|
| 仓库 | https://github.com/thugasin5214/ZhuLu-web |
| 发布分支 | `main`，根目录 `/` |
| 构建产物 | `index.html`（已提交进仓库） |
| 线上地址（开启 Pages 后） | https://thugasin5214.github.io/ZhuLu-web/ |
| 依赖 | Python 3（构建）、Node 18+（测试），都不需要装第三方包 |

---

## 0. 首次开启 GitHub Pages（只做一次）

> 仓库目前是**私有**的。私有仓库开 Pages 需要 GitHub Pro / Team / Enterprise 付费账号；免费账号需先把仓库改为公开：
> `gh repo edit thugasin5214/ZhuLu-web --visibility public --accept-visibility-change-consequences`

用命令行开启：

```sh
gh api -X POST repos/thugasin5214/ZhuLu-web/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

或在网页上：Settings → Pages → Build and deployment → Source 选 “Deploy from a branch” → Branch 选 `main` / `/ (root)` → Save。

确认已开启：

```sh
gh api repos/thugasin5214/ZhuLu-web/pages --jq '.html_url, .status'
```

---

## 1. 发布前检查

在仓库根目录执行：

```sh
git checkout main && git pull

# 1) 重新构建，确保 index.html 与 src/、levels/ 一致
python3 build.py
#   期望输出：index.html 已生成：引擎 N 字符，随附关卡 M 关

# 2) 跑无界面测试（每个都应跑完、不抛异常）
node tests/level.js          # 校验并试跑 levels.json 第一关
node tests/tactics.js        # 列阵战术走位
node tests/pvp.js            # 联机对战：两个引擎模拟联机打完一局
node tests/smoke.js smart    # 脚本玩家跑完原三关（较慢；胜负有随机波动，属正常）

# 3) 本地打开验证
open index.html              # macOS；或用浏览器直接打开
```

本地手动检查清单：

- [ ] 卷首页正常显示，水墨字体加载（若字体失败会回落到系统楷体/宋体，不影响游玩）
- [ ] 能进入一关并操作部队
- [ ] “战役编辑器”能打开，“破釜”数据关可以进入
- [ ] 手机宽度（浏览器开发者工具切换设备）下界面可用
- [ ] 浏览器控制台无报错

> 注意：如果改了 `src/` 或 `levels/` 却忘记跑 `build.py`，线上不会有任何变化——线上只认 `index.html`。

---

## 2. 发布

```sh
git status                    # 确认改动符合预期，index.html 已随源码一起变化
git add -A
git commit -m "发布：<简述改动>"
git push origin main
```

（可选）打版本标签，方便回滚定位：

```sh
git tag v<版本号> && git push origin v<版本号>
```

推送后 GitHub Pages 会自动构建，通常 1–2 分钟生效。查看构建状态：

```sh
gh api repos/thugasin5214/ZhuLu-web/pages/builds/latest --jq '.status, .commit, .error.message'
#   status 为 built 即成功；commit 应为刚推送的提交
```

---

## 3. 发布后验证

```sh
curl -sI https://thugasin5214.github.io/ZhuLu-web/ | head -1          # 期望 HTTP/2 200
curl -s  https://thugasin5214.github.io/ZhuLu-web/ | grep -c '<title>' # 期望 1
```

然后在浏览器里（建议无痕窗口，避开缓存）打开线上地址，按第 1 节的手动清单快速过一遍，电脑和手机各一次。

---

## 4. 回滚

线上内容完全由 `main` 上的 `index.html` 决定，回滚就是回退提交：

```sh
git log --oneline -10                 # 找到出问题的提交
git revert <坏提交的 hash>            # 生成反向提交，不改写历史
git push origin main
```

紧急情况下也可以只恢复产物文件：

```sh
git checkout <上一个好的提交或标签> -- index.html
git commit -m "回滚 index.html 到 <提交/标签>"
git push origin main
```

推送后按第 3 节重新验证。

---

## 5. 其他托管方式（可选）

因为只有一个文件，任何静态托管都可以：

- **Cloudflare Pages / Netlify / Vercel**：连接仓库，构建命令留空（或 `python3 build.py`），输出目录 `/`。
- **自有服务器 / 对象存储（OSS、COS、S3）**：只需上传 `index.html`，`Content-Type: text/html; charset=utf-8`。
- **国内访问**：Google Fonts 在国内可能加载不了，页面会回落到系统字体，仍可正常游玩；如需稳定的书法字体，可把 `src/template.html` 里的字体链接换成国内镜像或自托管字体后重新构建。

---

## 6. 常见问题

| 现象 | 原因 / 处理 |
|---|---|
| 推送后线上没变化 | 忘了 `python3 build.py`；或浏览器缓存——强制刷新 / 无痕窗口；查看 `pages/builds/latest` 是否 `built` |
| Pages 返回 404 | Pages 未开启（见第 0 节）；或仓库为私有且账号无付费计划 |
| `build.py` 报 `game.js 里不能出现 </script` | `src/game.js` 中出现了字面量 `</script`，改写为 `<\/script` |
| `build.py` 报 assert 占位符错误 | `src/template.html` 中的 `/*__GAME__*/` 或 `/*__LEVELS__*/` 被删改了，恢复即可 |
| `build.py` 报 JSON 错误 | `levels/levels.json` 格式不合法，用编辑器“导入导出”页重新导出，或 `python3 -m json.tool levels/levels.json` 定位 |
| 测试胜负结果每次不同 | 正常；脚本玩家有随机性，测试只确认能跑完、不报错 |
