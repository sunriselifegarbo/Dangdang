# 项目规则（Codex 每次工作前必读）

## 项目
儿童中文听写 PWA，仓库名 Dangdang，部署到 GitHub Pages，线上路径 /Dangdang/。
个人自用，非商业。

## 技术栈
Vite + React + TypeScript、Dexie(IndexedDB)、vite-plugin-pwa、pinyin-pro、tesseract.js。
所有依赖打包进项目，不使用 CDN，运行时不请求任何外部服务。

## 红线
- 无账号、无统计、无广告、无内购、无付费墙、无试用词数限制
- 不使用任何第三方 App 的名称、图标、文案；应用名称集中在 i18n 文件，便于改名
- 所有界面文案简体中文，集中在一个 i18n 文件
- 数据库使用版本化迁移；Word 同时存 autoPinyin 与 customPinyin
- 目标设备：iPad、iPhone 的 Safari 与「添加到主屏幕」两种模式
- 部署：GitHub Pages，Vite base 为 /Dangdang/，manifest 的 start_url/scope、service worker 范围、图标与所有资源路径都基于该子路径，使用 hash 路由
- 构建产物单文件小于 25MiB；Tesseract 中文语言包用体积小的 fast 版本并随项目打包

## 工作方式
- 严格分阶段；每阶段结束必须能 build 并运行，然后停下来等我确认，不要提前做下一阶段
- 核心逻辑（切词、拼音、掌握度、OCR 后处理）写单元测试
- 每阶段输出：改动文件清单、运行与测试方法、已知问题
- 用中文回复

## 阶段安排（用户最新确认）
- 阶段 0：前置检查、脚手架与数据模型；完成后停下确认。
- 阶段 1：核心听写流程。
- 阶段 1.5：提前部署 GitHub Pages。核对 /Dangdang/ base、manifest 和 service worker 子路径；配置 GitHub Actions 自动发布；尝试通过授权设置 Pages 来源为 GitHub Actions，无法设置则说明手动步骤；编写新手版 DEPLOY.md；给出线上地址和朗读、拼音、完整听写流程的真机验收清单，Safari 与主屏幕模式各测一遍。
- 阶段 2：拼音纠正。
- 阶段 3：拍照识别导入。
- 阶段 4：错词本、历史、词单。
- 阶段 5：设置、数据安全、移动端打磨。
- 阶段 6：仅保留收尾：更新提示、离线验证、构建文件大小检查、完整真机验收清单。
- 每阶段结束先在 Mac 运行 npm run dev，完成测试与构建，然后推送 main；阶段 1.5 上线后由用户在 iPad 验收，用户确认后才进入下一阶段。阶段 1.5 前不提前部署。
