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

## 为什么值得学

| 🧭 完整工程链路 | 🧪 每章都能动手 | 🧠 真正形成闭环 | 🌍 双语且离线可读 |
| --- | --- | --- | --- |
| 模型 → 表示 → Runtime → Kernel → 内存/带宽 → 硬件 → 产品 | 历史脉络、类比图解、六步动画、实验、陷阱和三题测验 | 断点续学、错题复习、实验笔记、阶段徽章和随机彩蛋 | 30 个双语章节页完整预渲染，无 JavaScript 仍可读正文 |

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
