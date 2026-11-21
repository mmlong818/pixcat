# Refto for Windows (`refto-win-cat`)

Windows 11 Fluent Design 风格的离线视觉参考库与 ACDSee 极速看图工作台。

## 核心特性

- **离线优先桌面架构（PWA + IndexedDB）**
  - 内置 Service Worker 离线资源缓存与 Web App Manifest，断网状态下可正常启动并安装为独立 Windows 桌面应用窗口。
  - 自定义合集、星标、1–5 星评级、颜色标签、设计笔记与导入素材全部本地持久化至 IndexedDB，支持 `.json` 一键导出/恢复备份。
- **本地磁盘目录直连**
  - 支持通过 File System Access API（及目录选择器回退）挂载电脑本地图片文件夹，免上传零拷贝极速浏览。
- **ACDSee 极速看图器（`Space` / 双击）**
  - 相邻图片后台预加载实现零延迟切换（`←` / `→` / `PageUp` / `PageDown`），底部带可折叠胶片缩略图带（`F`）。
  - 鼠标滚轮无级缩放（15%–800%）、拖拽平移、`1:1` 与适应窗口切换、透明棋盘格背景、全屏与幻灯片自动播放（`S`）。
- **ACDSee 图像编辑、双图对比与批处理**
  - `L` / `R` / `H` / `V` 快速旋转与翻转；`E` 打开 Canvas 调色与裁剪面板（亮度、对比度、饱和度、色温、黑白、裁剪比例、按住看原图），支持存为新副本或导出为 `JPEG / PNG / WebP`。
  - 支持双图并排/卷帘对比，以及模板化批量重命名与批量格式转换缩放。

## 本地运行

```bash
npm install
npm run dev
```

访问 `http://localhost:3000`。构建生产包：

```bash
npm run build
```
