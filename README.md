# 当当听写

个人自用的儿童中文听写 PWA。深色界面，适配 iPad / iPhone Safari 与添加到主屏幕模式。

线上：https://sunriselifegarbo.github.io/Dangdang/

## 功能

录入、系统语音输入、离线拍照识别、拼音显示和纠正、系统中文朗读、逐词听写与核对、状态词库重练、词单管理、历史记录、朗读设置、JSON 备份导入导出。

无账号、同步、统计追踪、广告、付费墙或词数限制；OCR 在本机 Worker 运行。应用资源本地打包，不使用 CDN；生产页面策略禁止向外部域名发起资源请求。系统语音输入属于设备系统能力，其联网行为由系统控制；主屏幕模式隐藏网页语音识别入口。

## 本机开发

Node.js 22.16+（建议当前 22 LTS）与 git：

```sh
npm ci
npm test
npm run build
npm run dev
```

本机打开 http://127.0.0.1:5173/Dangdang/ 。生产预览：`npm run preview`，打开 http://127.0.0.1:4173/Dangdang/。
构建自动准备本地 OCR 资源并核查文件大小及 manifest 路径。`node_modules` 不提交；本次 Mac 因 Documents iCloud 占位问题，将依赖临时安装在 /private/tmp/dangdang-runtime，通过符号链接使用；目录被清理后需要重新 npm ci。

## 项目结构

- src/i18n/zh-CN.ts：应用名和全部界面文案。
- src/domain：模型、切词、拼音词典、掌握规则、OCR 后处理、备份合并逻辑与测试。
- src/services：数据库写入、朗读、OCR Provider、设置与备份。
- src/components：拼音纠正、识别确认、词库、历史、备份、更新提示。
- src/data/db.ts：Dexie v1→v2→v3 版本化迁移；更新不可删除已发布版本。
- public/ocr：官方 fast 中文语言包、来源与许可证；构建时复制锁定版本的引擎。
- .github/workflows/deploy-pages.yml：推送 main 后自动测试构建发布。

详见 DATA_MODEL.md、DEPLOY.md 与 outputs 下各阶段报告和真机验收清单。开发前必读 AGENTS.md。

## 已知限制

- OCR 是辅助录入，需要确认错字和词序。真实课本、阴影、倾斜、小字号等需真机实测；合成双列样例出现过错字。
- 显示拼音的手动纠正不修改系统 TTS 发音，朗读仍读取词语。
- Safari 和主屏幕模式可能有独立存储，请分别确认数据并定期导出备份。设置保存在本机；JSON 备份覆盖四张数据表，不含朗读偏好和输入草稿。
- 清除网站数据会丢失本机记录。完成听写并确认保存后才写入历史，正在进行的听写不保存中途进度。
- 尚未完成 iPad/iPhone 真机、静音拨片、3～5 页真实课本验收；不能将 Mac 检查替代这些项目。

## 依赖维护

收尾时 npm audit 为 0 项。构建工具链通过 overrides 锁定 glob 14.0.6、minimatch 11.0.8、deepmerge 4.1.1 以避开当前审计影响范围；升级需重新审计并验证 service worker 生成。所有实际版本由 package-lock.json 锁定。
