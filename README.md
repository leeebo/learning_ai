# 端侧 AI · 15 天工程路线

> 面向已具备 ESP32、FreeRTOS、DMA 和网络协议栈经验的嵌入式开发者，系统进入端侧 AI 与边缘 LLM 工程。

## 在线课程

- [简体中文](https://leeebo.github.io/learning_ai/)
- [English](https://leeebo.github.io/learning_ai/en/)

这是一个由 Eleventy 3 构建的中英双语静态学习网站。课程不把 ESP32 误写成通用 LLM 主机：ESP32 负责传感器、实时 I/O、协议与执行器安全边界；较重的推理由 Linux Edge Host 或适配的加速平台承担。

## 课程结构

15 个章节沿着完整工程链路推进：

1. 神经网络基础与张量契约
2. 训练、推理与模型导出
3. ONNX、LiteRT、GGUF 等模型格式
4. 端侧量化与校准
5. 算子、kernel、布局与融合
6. 非 LLM 小模型的训练和 ESP32 部署
7. 内存、带宽、MCU/NPU 预算
8. 摄像头和端侧视觉流水线
9. Tokenizer 与聊天模板
10. KV Cache、Prefill 与 Decode
11. LLM Runtime 与 ESP32/Host 分工
12. LLM 量化与 GGUF
13. 推理框架、后端与 fallback
14. 性能、功耗与尾延迟分析
15. 端侧 AI 系统整合与验收

每章提供历史发展时间轴、具象类比与边界说明、交互式数据流动画、静态流程全景图、动手实验、工程陷阱、三道测试题和官方或原始参考资料。中文和英文页面均在构建阶段完整预渲染；禁用 JavaScript 时仍可阅读全部正文和静态流程图。

## 本地开发

需要 Node.js 18 或更新版本。

```bash
npm ci
npm run serve
```

Eleventy 会在终端显示本地预览地址。站点配置了 GitHub Project Pages 的 `/learning_ai/` 路径前缀，请从该入口预览页面。

完整验证命令：

```bash
npm run check
```

该命令会检查 JavaScript 语法、构建 Eleventy、同步发布文件并运行双语数据与页面测试。

## 内容与模板

```text
src/
├── _data/
│   ├── course/          # 中英文 15 章课程数据
│   └── i18n.cjs         # 两种语言的界面文案
├── _includes/           # 首页、章节和基础 HTML 模板
├── zh-CN/               # 中文页面入口，发布到站点根路径
├── en/                  # 英文页面入口，发布到 /en/
└── assets/              # 共享交互脚本和样式
```

修改源数据或模板后运行：

```bash
npm run build
npm test
```

`npm run build` 先生成 `_site/`，确认 32 个双语页面和共享资源完整后，再把部署文件同步到仓库根目录。根目录的 `index.html`、`dayNN.html`、`en/`、`app.js` 和 `styles.css` 都是生成物，不应直接修改。

详细的内容约束、翻译一致性、无障碍要求和新增语言流程见 [AGENTS.md](AGENTS.md)。

## 部署到 GitHub Pages

仓库继续提交构建后的静态文件，因此不需要服务器端运行时：

1. 合并前运行 `npm run check` 并提交同步后的生成文件。
2. 在仓库 `Settings → Pages` 中选择 `Deploy from a branch`。
3. 选择 `master` 分支和 `/(root)` 目录。

发布地址为 <https://leeebo.github.io/learning_ai/>，英文入口为 <https://leeebo.github.io/learning_ai/en/>。
