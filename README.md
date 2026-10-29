# 暮塔之主

一款中文奇幻王国管理游戏。你将走进高塔，接见来客，派遣骑士，决定王国十四日后的命运。

本项目参考 [Sovereign Tower](https://wildwits.itch.io/sovereign-tower) 的玩法与画面布局，重新制作代码和图像素材。开场使用创作者提供的原作截图文案的中文翻译，其余章节为原创内容；本项目并非原作的完整移植。

## 玩法

- 接见来访者，在各方诉求和国库之间做出决定。
- 根据骑士属性、装备和信任度安排派遣；任务有期限，也可能持续数日。
- 建设塔楼、制作装备，与骑士交谈。
- 回到经历过的日子重新选择，已发现的见闻会保留。

## 本地运行

需要 Node.js 和星匣 CLI。在项目目录执行：

```bash
npm test
npm run check
star-letter check .
star-letter dev game --restart --open
```

从星匣预览页体验游戏。也可以用任意静态文件服务器提供 `game/` 目录：

```bash
python3 -m http.server 8080 --directory game
```

然后访问 `http://127.0.0.1:8080/`。独立本机页面只保留本次页面的进度；星匣环境使用 GameSDK 云存档，实际读写依赖平台能力和玩家授权。

## 项目结构

- `game/app.mjs`、`game/style.css`：界面和交互。
- `game/opening.mjs`、`game/opening.css`：中文序章及转场。
- `game/engine.mjs`、`game/content.mjs`：游戏规则和故事内容。
- `game/save.mjs`、`game/save-codec.mjs`：存档接口和版本转换。
- `game/assets/`：生成的场景和人物素材。
- `tests/`：核心规则及存档检查。
- `star-letter.json`：星匣项目配置。

本地检查与星匣平台上的实际游玩、存档验证是不同的步骤。
