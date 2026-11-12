# 当当听写

个人自用的离线中文听写 PWA。当前仅完成阶段 0，不包含录入、朗读或 OCR 功能。
应用名称及界面文案统一位于 `src/i18n/zh-CN.ts`。

## 本机运行

使用 Node.js 22 LTS（`.nvmrc`）。若尚未安装系统 Node，可在本项目目录执行：

```sh
export PATH="$PWD/work/node-v22.16.0-darwin-arm64/bin:$PATH"
npm ci
npm test
npm run build
npm run dev
```

访问 http://127.0.0.1:5173/Dangdang/ 。生产构建可用 `npm run preview` 在 http://127.0.0.1:4173/Dangdang/ 验证。`work/` 不提交，其他机器需安装 Node.js 22.16+。

## 阶段边界

已提供 React/TypeScript、hash 路由、深色占位界面、PWA 预缓存配置、原创本地图标、Dexie v1 数据库和单元测试。
阶段 1–6 尚未实施；GitHub Pages 在阶段 1.5 配置，此前不会自动发布。PWA 在生产构建启用，开发环境不注册 service worker。
依赖通过 npm 构建进应用，不使用 CDN；OCR 与拼音依赖在相应阶段引入。

详见 `DATA_MODEL.md`。每次工作前读取 `AGENTS.md`。

## 本次环境说明

Documents 的 iCloud 占位文件曾导致读取阻塞；本次依赖安装于 `/private/tmp/dangdang-runtime/node_modules` 并通过未提交的 `node_modules` 符号链接引用。临时目录被清理后，用 Node.js 22.16+ 执行 `npm ci` 重新安装即可。`.npmrc` 固定 legacy-peer-deps，保证与锁文件的安装模式一致。

本次 npm audit：6 项（2 low、4 moderate），均属于 PWA 构建工具链（workbox-build、glob、minimatch、deepmerge、@rollup/plugin-node-resolve 及其上游）。应在后续依赖维护时处理；当前没有将这些构建工具的 Node 代码打进应用运行包。
