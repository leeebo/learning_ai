# 端侧 AI · 15 天工程路线

> 面向已具备 ESP32、FreeRTOS、DMA 和网络协议栈经验的嵌入式开发者，系统进入端侧 AI 与边缘 LLM 工程。

## [进入学习网站](https://leeebo.github.io/learning_ai/)

> 网站发布后，可直接从此入口开始 Day 1。若链接暂不可用，请按下方“部署到 GitHub Pages”启用 Pages。

这是一个无需构建、无需后端的中文静态学习网站。课程不把 ESP32 误写成通用 LLM 主机：ESP32 负责传感器、实时 I/O、协议与执行器安全边界；较重的推理由 Linux Edge Host 或适配的加速平台承担。

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

每章提供：

- 约 16–20 分钟的渐进阅读内容
- 关键词、解释和 ESP32 工程类比表
- 至少 4 个带原始/官方来源的历史里程碑，说明概念如何演进到今天
- 带图解和适用边界的生活化/嵌入式类比
- 可自动播放、暂停和逐步查看的数据流动画，并保留静态全景图
- 承上启下说明、动手实验和工程陷阱
- 3 道单选测试题；提交后显示得分、正确答案和解析
- 官方文档、项目规范或原始论文的延伸阅读

## 本地预览

无需安装依赖：

```bash
python3 -m http.server 8000
```

打开 <http://localhost:8000/>，或直接访问 <http://localhost:8000/day01.html>。

章节是独立静态页面，范围为 [`day01.html`](day01.html) 到 [`day15.html`](day15.html)。

## 内容更新与验证

课程基础数据与交互逻辑位于 [`app.js`](app.js)，历史、类比、扩展讲解和动画步骤按章节拆分在 `content/enrichment-*.js`。修改内容后，重新生成静态章节页：

```bash
node scripts/generate-chapters.cjs
node --test tests/course-data.test.cjs
```

生成器会同步更新 15 个 `dayNN.html` 页面；测试会检查关键词表、章节衔接、历史来源、类比图解、动画步骤、测试题和阅读深度。动画遵循系统的“减少动态效果”设置，关闭自动播放后仍可手动逐步查看。

## 部署到 GitHub Pages

1. 将变更合并到 `master`。
2. 在仓库 `Settings → Pages` 中选择：
   - Source：`Deploy from a branch`
   - Branch：`master`
   - Folder：`/(root)`
3. 保存并等待 GitHub 发布完成。

发布地址为 <https://leeebo.github.io/learning_ai/>。
