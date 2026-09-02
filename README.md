# Neon Drift

一个零依赖、支持键盘与触控的 Canvas 霓虹街机小游戏。

## 玩法

- 使用 `A` / `D` 或左右方向键移动。
- 使用空格发动短暂无敌的相位冲刺。
- 避开红色裂片，收集绿色能量核心。
- 手机端可使用画布下方的触控按钮。
- 首次点击开始后会播放程序化背景音乐；冲刺、拾取和撞击均有独立音效，可在页头一键静音。

## 本地验证

```bash
npm ci
npm run check
npm test
npx serve .
```

每次向 `main` 分支推送及每个 Pull Request 都会触发 GitHub Actions。Vercel Git 集成负责为提交和 PR 自动生成对应部署。
