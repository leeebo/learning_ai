<p align="center">
  <img src=".github/assets/readme-hero.svg" alt="Edge AI 15-day engineering path: neural foundations, edge deployment, LLM foundations, and LLM engineering" width="100%">
</p>

<h1 align="center">端侧 AI · 15 天工程路线</h1>

<p align="center">
  面向熟悉 ESP32、FreeRTOS、DMA 与网络协议栈的工程师，<br>
  从张量、算子和内存一路走到可交付的端侧 LLM 与大规模 Infra。
</p>

<p align="center">
  <a href="https://leeebo.github.io/learning_ai/"><strong>开始中文课程 →</strong></a>
  &nbsp;·&nbsp;
  <a href="https://leeebo.github.io/learning_ai/en/"><strong>Read in English →</strong></a>
</p>

<p align="center">
  <img alt="15 days" src="https://img.shields.io/badge/course-15%20days-2f66d7?style=flat-square">
  <img alt="Chinese and English" src="https://img.shields.io/badge/languages-简体中文%20%7C%20English-0d9488?style=flat-square">
  <img alt="Eleventy 3" src="https://img.shields.io/badge/Eleventy-3.1.6-111827?style=flat-square">
  <img alt="No backend" src="https://img.shields.io/badge/backend-none-7957d5?style=flat-square">
  <img alt="Verified on 2026-08-11" src="https://img.shields.io/badge/verified-2026--08--11-e87524?style=flat-square">
</p>

> 这不是“在 MCU 上硬跑大模型”的速成清单，而是一条尊重设备边界、数据移动与产品 SLO 的完整工程路线。

## 🌈 现在进行中

> 一个轻量的公开进度条：记录正在做什么、为什么做，以及下一步往哪里走。进度是手动更新的，不追求“每天满格”，只要持续向前就好。

<table>
  <tr>
    <td valign="top" width="50%">
      <h3>🔥 端侧 AI 学习路线</h3>
      <p>把模型、Runtime、Kernel、内存和硬件约束串成一条真正能落地的工程路线。</p>
      <p><strong>进度：15 / 15 章</strong><br>
      <code>████████████████████</code> <strong>100%</strong></p>
      <ul>
        <li><strong>状态：</strong>🟢 第一版完成，持续打磨</li>
        <li><strong>现在：</strong>补充实测案例和设备边界</li>
        <li><strong>入口：</strong><a href="https://leeebo.github.io/learning_ai/">开始 15 天课程 →</a></li>
      </ul>
    </td>
    <td valign="top" width="50%">
      <h3>🧩 双语学习网站</h3>
      <p>把学习路线做成中文 / English 双语、离线可读、能记录进度的轻量网站。</p>
      <p><strong>进度：可用版本</strong><br>
      <code>████████████████░░░░</code> <strong>80%</strong></p>
      <ul>
        <li><strong>状态：</strong>🟢 已上线，继续迭代</li>
        <li><strong>已完成：</strong>30 个双语章节页、浏览器本地进度、错题复习和实验笔记</li>
        <li><strong>下一步：</strong>让内容、交互和真实设备实验形成闭环</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td valign="top" width="50%">
      <h3>🛠️ ESP32 / TinyML 实验</h3>
      <p>把视觉、量化、内存预算和推理延迟放到真实设备上验证。</p>
      <p><strong>进度：探索中</strong><br>
      <code>██████░░░░░░░░░░░░░░</code> <strong>30%</strong></p>
      <ul>
        <li><strong>状态：</strong>🟡 兴趣项目</li>
        <li><strong>想做：</strong>选一个小模型，记录延迟、RAM 和功耗</li>
        <li><strong>下一步：</strong>从一个可重复的端侧视觉小实验开始</li>
      </ul>
    </td>
    <td valign="top" width="50%">
      <h3>🌱 感兴趣的方向</h3>
      <p>希望把“能跑起来”继续推进到“知道为什么、能测出来、能交付”。</p>
      <p>
        <code>Edge AI</code>　<code>TinyML</code>　<code>LLM Infra</code><br>
        <code>ESP32</code>　<code>Runtime</code>　<code>Developer Education</code>
      </p>
      <ul>
        <li>喜欢拆解复杂系统，再把它讲清楚</li>
        <li>喜欢有真实约束的实验，而不是只看 benchmark</li>
        <li>欢迎交流端侧 AI、嵌入式和学习工具</li>
      </ul>
    </td>
  </tr>
</table>

<p align="center"><sub>看板最后更新：2026-08-11 · 下一次更新时，只需要修改上面的状态、进度和“下一步”。</sub></p>

## 为什么值得学

| 🧭 完整工程链路 | 🧪 每章都能动手 | 🧠 真正形成闭环 | 🌍 双语且离线可读 |
| --- | --- | --- | --- |
| 模型 → 表示 → Runtime → Kernel → 内存/带宽 → 硬件 → 产品 | 历史脉络、类比图解、六步动画、实验、陷阱和三题测验 | 断点续学、错题复习、实验笔记、阶段徽章和随机彩蛋 | 30 个双语章节页完整预渲染，无 JavaScript 仍可读正文 |

课程明确区分三级设备边界：ESP32/MCU 负责传感器、实时 I/O、协议与执行器安全边界；Linux Edge Host、手机、PC 或 SBC 承担实际 LLM 推理；超出本地能力时才显式回退云端。技术事实截至 **2026-08-11** 核验，优先引用论文、官方文档与项目仓库。

## 15 天学什么

| 阶段 | 章节 | 你将建立的能力 |
| --- | --- | --- |
| **01 · 神经网络基础** | Day 1–3 | 张量与梯度、训练/推理、模型产物和量化 |
| **02 · 端侧部署** | Day 4–6 | 算子与 Kernel、TinyML 部署、资源预算和视觉流水线 |
| **03 · LLM 原理** | Day 7–10 | LLM 发展脉络、Tokenizer、独立的 Transformer 与 Attention 章节 |
| **04 · LLM 工程** | Day 11–15 | KV Cache、GGUF、Runtime/推理框架、跨尺度性能与产品闭环 |

<details>
<summary><strong>展开全部 15 章目录</strong></summary>

1. 神经网络基础 — 从张量、层与损失函数建立神经网络直觉
2. 训练与推理 — 把可学习状态冻结为可移植、可验证的模型产物
3. 模型量化 — 用更少的 bit 换取更低的存储与带宽
4. 算子与 Kernel — 从数学定义走到布局、融合与硬件执行路径
5. 端侧模型部署 — 把非 LLM 视觉、音频与传感器模型真正烧进设备
6. 端侧视觉流水线 — 在资源与实时约束中把摄像头帧变成稳定事件
7. LLM 基础 — 从语言模型起源建立发展脉络、工作原理与关键术语地图
8. Tokenizer — 理解文本如何变成模型可消费的整数流
9. Transformer 架构 — 先看清整座模型，再深入 Attention 数据流
10. Attention 机制 — 把序列依赖变成可并行计算的显式数据流
11. KV Cache — 用会话内存复用 Decode 阶段的历史投影
12. LLM 量化与 GGUF — 把低比特权重与 metadata 封装成可部署模型包
13. LLM Runtime — 组织生成循环、端侧推理框架与异构 backend
14. LLM 性能与 Infra — 从单机指标追到集群数据移动、拓扑与 SLO
15. 端侧 LLM 产品化 — 收束模型、硬件、安全边界与运营证据

</details>

每章的三题测验全对后，会从该章独立的本地化奖励池中随机解锁一个页面彩蛋；15 章的奖励主题各不相同。

## 学习体验不是“读完即忘”

启用 JavaScript 时，网站会在当前浏览器中维护学习状态：

| 功能 | 学习价值 |
| --- | --- |
| **断点续学 + 阅读进度** | 回到上次位置，长章节也不迷路 |
| **全文课程搜索** | 按主题、关键词或工程问题定位章节 |
| **错题复习** | 自动收集答错题目，答对后从下一轮移除 |
| **实验笔记 + Markdown 导出** | 用统一模板保留设备、版本、命令、实测与结论 |
| **阶段徽章 + 连续学习** | 把 15 天拆成清晰、可完成的里程碑 |
| **随机章节彩蛋** | 每次全对都有一份属于该章的小奖励 |
| **学习档案导入 / 导出** | 用经过校验的 JSON 在浏览器之间迁移进度、错题和笔记 |
| **完课纪念证书** | 15 章全部满分后解锁，可打印或保存为 PDF |

这些数据只使用版本化的 `localStorage` 键保存在当前浏览器：**不上传、不追踪、不要求账号**。你可以主动导出学习档案进行备份；清理站点数据仍会清除尚未导出的进度、错题和实验笔记。完课证书是基于本机记录生成的个人纪念，不是第三方可验证的资质证书。

GitHub 登录评论区使用 Giscus 和 GitHub Discussions；公开学习者墙与学习打卡暂未启用，后续设计记录见 [学习打卡与公开学习者墙](docs/learning-check-in.md)。

<p align="center">
  <a href="https://leeebo.github.io/learning_ai/"><strong>现在开始 Day 1</strong></a>
  &nbsp;·&nbsp;
  <a href="https://leeebo.github.io/learning_ai/day07.html"><strong>从 LLM 基础开始</strong></a>
  &nbsp;·&nbsp;
  <a href="https://leeebo.github.io/learning_ai/day10.html"><strong>研读独立 Attention 章节</strong></a>
</p>

---

## 给贡献者

### 本地开发

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

### 内容与模板

```text
src/
├── _data/
│   ├── course/          # 中英文 15 章课程规划与内容数据
│   ├── courseMeta.cjs   # 总章数、连续编号与技术核验日期
│   └── i18n.cjs         # 两种语言的界面文案
├── _includes/           # 首页、章节、复习页和基础 HTML 模板
├── zh-CN/               # 中文页面入口，发布到站点根路径
├── en/                  # 英文页面入口，发布到 /en/
└── assets/              # 共享交互脚本和样式
```

修改源数据或模板后运行：

```bash
npm run build
npm test
```

`npm run build` 先生成 `_site/`，确认 36 个页面、3 个共享资源和 `.nojekyll` 完整后，再把 40 个部署文件同步到仓库根目录。根目录的 `index.html`、`review.html`、`certificate.html`、`dayNN.html`、`en/`、`app.js`、`favicon.svg`、`styles.css` 和 `.nojekyll` 都是生成物，不应直接修改。

详细的内容约束、翻译一致性、无障碍要求和新增语言流程见 [AGENTS.md](AGENTS.md)。

### 部署到 GitHub Pages

仓库继续提交构建后的静态文件，因此不需要服务器端运行时：

1. 合并前运行 `npm run check` 并提交同步后的生成文件。
2. 在仓库 `Settings → Pages` 中选择 `Deploy from a branch`。
3. 选择 `master` 分支和 `/(root)` 目录。

根目录的 `.nojekyll` 会让 GitHub Pages 直接提供 Eleventy 生成的静态文件，避免把 `src/` 下的 Nunjucks 模板交给 Jekyll/Liquid 渲染。

发布地址为 <https://leeebo.github.io/learning_ai/>，英文入口为 <https://leeebo.github.io/learning_ai/en/>。
