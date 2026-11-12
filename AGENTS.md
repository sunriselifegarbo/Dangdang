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

## 用户补充授权与模型规则
- 用户已授权后续阶段自动衔接，常规问题自行决定；不再逐阶段等待确认。每阶段仍测试、build、在 Mac 运行 dev 并推送 main。真机验收由用户醒来后进行，未实测项不得记为通过。
- 未听写：无 WordStat 的新词进入 missed；已有统计保持原状态、streak、wrongCount、lastReviewedAt，历史记录 unwritten。优先级未掌握 > 错过的词 > 已掌握，不因未听写覆盖已有状态。
- 仅三种复习类型的答对累计连胜，普通听写答对不累计。
- 历史条目同时保存 wordId 和 textSnapshot；备份保留稳定 id，导入预览后合并，不清库或覆盖现有记录。text+language 去重在代码完成，除主键外不加唯一约束。
