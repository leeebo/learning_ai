const legacyZh = [
  [["🧠", "张量侦察员", "你已经能沿形状与数据类型追踪一次前向计算。"], ["🔌", "契约守门人", "输入、权重和输出的接口现在逃不过你的检查。"], ["✨", "神经元点亮", "第一组连接已经建立，继续把直觉变成工程能力。"]],
  [["🎯", "训练闭环完成", "你分清了训练状态、冻结产物与推理路径。"], ["📦", "导出许可已签发", "模型离开实验室前的契约检查已经通过。"], ["🧪", "实验账本解锁", "超参数、数据与评估证据已经进入同一条链。"]],
  [["🗂️", "格式翻译官", "你能区分图、权重、元数据与运行时约束。"], ["🧭", "模型包导航员", "面对 ONNX、LiteRT 与 GGUF，你会先寻找契约而不是扩展名。"], ["🔍", "元数据彩蛋", "一个可加载文件不再能冒充一个可交付模型。"]],
  [["🗜️", "量化炼金师", "你会用校准和误差证据换取更小的表示。"], ["⚖️", "精度预算官", "bit 数、质量和硬件支持已经放进同一张表。"], ["💎", "四比特宝石", "压缩不是魔法，而是经过验证的工程取舍。"]],
  [["⚙️", "Kernel 追踪者", "你已经能从算子一路追到布局、融合与硬件执行。"], ["🧩", "融合工匠", "少一次中间写回，也可能比多一串峰值算力更重要。"], ["🚀", "数据路径清障", "真正的热点藏不住了：形状、布局与搬运都会留下证据。"]],
  [["🤏", "TinyML 驯兽师", "小模型、arena 与 MCU 部署链已经闭环。"], ["📟", "端点推理许可", "你知道哪些模型适合留在 ESP32，哪些必须交给主机。"], ["🌱", "微型智能萌芽", "有限 SRAM 里也能长出经过验收的智能。"]],
  [["🧮", "内存预算大师", "Flash、SRAM、PSRAM 与带宽都已进入容量账本。"], ["🚧", "OOM 预警员", "你会在部署前发现峰值，而不是等设备重启。"], ["📏", "每个字节都有名字", "静态权重、激活和临时区终于各归其位。"]],
  [["📷", "像素流水线侦探", "从 DMA 到 NMS 的每次变换都有了可逆记录。"], ["🖼️", "帧缓冲守护者", "格式、stride 与所有权错误很难再躲过你。"], ["🎞️", "视觉事件导演", "模型输出已经被剪辑成稳定、可追踪的产品事件。"]],
  [["🔤", "Token 解码员", "文本、模板与整数序列之间的契约已经打通。"], ["🧵", "聊天模板织工", "特殊 token 和角色边界被你编进了正确位置。"], ["🗝️", "词表密钥找到", "同一句文本为何变成不同 token，你已经能解释。"]],
  [["🧠", "KV 仓库管理员", "你能为上下文状态计算容量、生命周期和复用收益。"], ["⏱️", "首字与逐字分离", "TTFT 和 ITL 不再混成一个模糊的速度数字。"], ["📚", "上下文保管员", "历史 token 无需重算，但每个缓存块都要付租金。"]],
  [["🛠️", "Runtime 调度员", "队列、KV、取消和 backend 已被放进同一个执行循环。"], ["🤝", "MCU/Host 边界清晰", "实时执行权与生成式推理终于各守其位。"], ["🧰", "推理引擎舱开启", "模型文件之外的调度与资源责任已经显形。"]],
  [["🪶", "GGUF 鉴定师", "你会沿 tensor 类型和质量证据挑选量化产物。"], ["🧊", "低比特冰雕", "尺寸缩小了，但关键层与输出质量仍被完整审视。"], ["📦", "模型包验货完成", "文件名中的 Q4 不再能替代逐项验证。"]],
  [["🧭", "Backend 路由专家", "CPU、GPU、NPU 与 fallback 的边界都有迹可循。"], ["🔧", "框架不再是黑盒", "你会看算子覆盖、编译产物和边界复制，而不是品牌。"], ["🛤️", "执行路径已点亮", "一次请求真正走过的 backend 现在可以被证明。"]],
  [["📈", "性能证据官", "TTFT、ITL、p95、能耗与热状态已经成套出现。"], ["🌡️", "热稳态观察员", "凉机峰值再也不能冒充长期产品体验。"], ["🔬", "Benchmark 显微镜", "变量被固定，均值、尾延迟与异常值都有了位置。"]],
  [["🛡️", "系统边界守护者", "模型建议与设备执行权被可靠地隔开。"], ["🚦", "验收闭环完成", "正常路径、故障降级、OTA 与回滚都已有证据。"], ["🗼", "塔台与飞控就位", "端侧 AI 已从演示成长为职责明确的系统。"]],
  [["🏗️", "集群拓扑建筑师", "你能把并行维度放进合适的互连层级。"], ["🚚", "KV 物流调度员", "Prefill、迁移和 Decode 的每一段成本都已入账。"], ["📡", "SLO 指挥台解锁", "峰值吞吐必须先通过 TTFT、ITL 与 goodput 的审问。"]],
  [["🚐", "端侧厨房主理人", "模型、delegate、内存、能量和散热已经装进同一辆餐车。"], ["🔋", "每个 Token 都有电费单", "你会用能耗与热稳态验收持续生成，而非只看 TOPS。"], ["🌍", "完整航线完成", "从 MCU 安全边界到集群与端侧 LLM Infra，你已拥有完整地图。"]]
];

const legacyEn = [
  [["🧠", "Tensor scout", "You can now trace a forward pass through shapes and dtypes."], ["🔌", "Contract keeper", "Inputs, weights, and outputs can no longer hide an interface mismatch."], ["✨", "Neurons online", "Your first connections are active; keep turning intuition into engineering evidence."]],
  [["🎯", "Training loop closed", "You separated training state, frozen artifacts, and inference execution."], ["📦", "Export permit granted", "The model contract passed inspection before leaving the lab."], ["🧪", "Experiment ledger unlocked", "Hyperparameters, data, and evaluation evidence now share one chain."]],
  [["🗂️", "Format translator", "You can separate graphs, weights, metadata, and runtime constraints."], ["🧭", "Model-package navigator", "For ONNX, LiteRT, or GGUF, you now inspect contracts before extensions."], ["🔍", "Metadata discovered", "A loadable file can no longer impersonate a shippable model."]],
  [["🗜️", "Quantization alchemist", "You trade representation size through calibration and measured error."], ["⚖️", "Precision budget officer", "Bit width, quality, and hardware support now live in one ledger."], ["💎", "Four-bit gem", "Compression is not magic; it is a verified engineering tradeoff."]],
  [["⚙️", "Kernel tracker", "You can follow an operator through layout, fusion, and hardware execution."], ["🧩", "Fusion craftsperson", "Avoiding one intermediate write can matter more than another peak-FLOPS claim."], ["🚀", "Data path cleared", "Shapes, layouts, and movement now leave evidence at every hotspot."]],
  [["🤏", "TinyML tamer", "The small-model, arena, and MCU deployment loop is complete."], ["📟", "Endpoint inference permit", "You know what belongs on ESP32 and what must move to a host."], ["🌱", "Tiny intelligence sprout", "Validated intelligence can grow even inside constrained SRAM."]],
  [["🧮", "Memory budget master", "Flash, SRAM, PSRAM, and bandwidth all entered the capacity ledger."], ["🚧", "OOM early-warning system", "You find the peak before deployment instead of after a reboot."], ["📏", "Every byte has a name", "Weights, activations, and scratch buffers finally occupy explicit rows."]],
  [["📷", "Pixel-pipeline detective", "Every transformation from DMA to NMS now has a reversible record."], ["🖼️", "Frame-buffer guardian", "Format, stride, and ownership errors have nowhere left to hide."], ["🎞️", "Visual-event director", "Model outputs are now edited into stable, traceable product events."]],
  [["🔤", "Token decoder", "The contract among text, templates, and integer sequences is connected."], ["🧵", "Chat-template weaver", "Special tokens and role boundaries now land in the right places."], ["🗝️", "Vocabulary key found", "You can explain why the same text becomes different token sequences."]],
  [["🧠", "KV warehouse manager", "You can budget context state, lifetime, and reuse benefits."], ["⏱️", "First token separated", "TTFT and ITL can no longer hide inside one vague speed number."], ["📚", "Context custodian", "Old tokens avoid recomputation, but every cache block still pays rent."]],
  [["🛠️", "Runtime dispatcher", "Queues, KV, cancellation, and backends now share one execution loop."], ["🤝", "MCU/host boundary secured", "Real-time authority and generative inference each stay in their lane."], ["🧰", "Inference engine bay open", "Scheduling and resource ownership beyond the model file are visible."]],
  [["🪶", "GGUF appraiser", "You choose quantized artifacts through tensor types and quality evidence."], ["🧊", "Low-bit ice sculpture", "The footprint shrank while critical layers and output quality stayed under review."], ["📦", "Model package inspected", "A Q4 filename can no longer replace item-by-item validation."]],
  [["🧭", "Backend routing expert", "CPU, GPU, NPU, and fallback boundaries now leave a trace."], ["🔧", "Framework black box opened", "You inspect coverage, compiled artifacts, and boundary copies—not branding."], ["🛤️", "Execution path illuminated", "The backends actually traversed by a request can now be proven."]],
  [["📈", "Performance evidence officer", "TTFT, ITL, p95, energy, and thermal state now arrive together."], ["🌡️", "Thermal steady-state watcher", "A cool-device peak can no longer impersonate sustained experience."], ["🔬", "Benchmark microscope", "Variables are fixed, with averages, tails, and outliers in their places."]],
  [["🛡️", "System boundary guardian", "Model suggestions and device actuation authority are safely separated."], ["🚦", "Acceptance loop complete", "Nominal flow, degradation, OTA, and rollback all have evidence."], ["🗼", "Tower and flight control ready", "Edge AI has grown from a demo into a system with explicit responsibility."]],
  [["🏗️", "Cluster topology architect", "You can place every parallel dimension on an appropriate interconnect tier."], ["🚚", "KV logistics dispatcher", "Prefill, transfer, and decode costs have all entered the ledger."], ["📡", "SLO command desk unlocked", "Peak throughput must now answer to TTFT, ITL, and goodput."]],
  [["🚐", "Edge kitchen operator", "Model, delegates, memory, energy, and cooling now fit one food truck."], ["🔋", "Every token gets an energy bill", "You accept sustained generation with energy and thermal evidence, not TOPS alone."], ["🌍", "Full route complete", "From MCU safety boundaries to cluster and edge LLM infrastructure, the full map is yours."]]
];

const zh = [
  legacyZh[0],
  legacyZh[1],
  legacyZh[3],
  legacyZh[4],
  legacyZh[5],
  legacyZh[7],
  [["🗺️", "LLM 地图绘制者", "从语言模型起源到指令对齐，关键概念已经各归其位。"], ["🧭", "生成边界领航员", "概率生成、参数与上下文的边界现在清晰可见。"], ["📜", "语言模型史学家", "你已经能沿典型时刻解释 LLM 如何走到今天。"]],
  legacyZh[8],
  [["🧩", "Transformer 架构师", "Embedding、block、FFN、残差与输出头已经拼成完整模型。"], ["🏗️", "层堆叠设计师", "Encoder、Decoder 与 decoder-only 的信息流现在各归其位。"], ["🗺️", "模型总图读者", "你会先读完整架构，再进入某个子层的公式。"]],
  [["🔎", "Attention 解构师", "Q、K、V、mask 与多头数据流已经不再神秘。"], ["📐", "对齐矩阵分析员", "缩放、softmax 与可见性边界都经得起小矩阵验证。"], ["⚡", "并行路径侦察员", "你能同时看见短依赖路径与长序列二次代价。"]],
  legacyZh[9],
  legacyZh[11],
  [["🛠️", "Runtime 调度员", "加载、Prefill、Decode、采样与取消已经进入同一执行循环。"], ["🧭", "Backend 路由专家", "CPU、GPU、NPU 与 fallback 的实际路径都有证据。"], ["🔧", "框架黑盒拆解员", "编译、分区、边界复制和资源回收现在都可观测。"]],
  legacyZh[15],
  [["🚐", "端侧厨房主理人", "模型、backend、内存、能量和安全边界已经装进同一辆餐车。"], ["🛡️", "产品闭环守护者", "回退、故障演练、OTA 与回滚都进入了验收证据。"], ["🌍", "十五日航线完成", "从神经网络到端侧 LLM Infra，你已拥有一张完整工程地图。"]],
];

const en = [
  legacyEn[0],
  legacyEn[1],
  legacyEn[3],
  legacyEn[4],
  legacyEn[5],
  legacyEn[7],
  [["🗺️", "LLM mapmaker", "From language-model origins to instruction alignment, every key concept has a place."], ["🧭", "Generation-boundary navigator", "The boundaries among probability, parameters, and context are now visible."], ["📜", "Language-model historian", "You can explain how LLMs reached today through their defining milestones."]],
  legacyEn[8],
  [["🧩", "Transformer architect", "Embeddings, blocks, FFNs, residuals, and the output head now form one model."], ["🏗️", "Layer-stack designer", "Encoder, decoder, and decoder-only information flows each have a clear place."], ["🗺️", "Model-map reader", "You now read the whole architecture before opening one sublayer's formula."]],
  [["🔎", "Attention analyst", "Q, K, V, masks, and multi-head dataflow are no longer mysterious."], ["📐", "Alignment-matrix analyst", "Scaling, softmax, and visibility boundaries all survive tiny-matrix checks."], ["⚡", "Parallel-path scout", "You can see both short dependency paths and quadratic long-sequence cost."]],
  legacyEn[9],
  legacyEn[11],
  [["🛠️", "Runtime dispatcher", "Loading, Prefill, Decode, sampling, and cancellation now share one loop."], ["🧭", "Backend routing expert", "CPU, GPU, NPU, and fallback paths now leave concrete evidence."], ["🔧", "Framework black box opened", "Compilation, partitioning, boundary copies, and reclamation are observable."]],
  legacyEn[15],
  [["🚐", "Edge kitchen operator", "Models, backends, memory, energy, and safety boundaries now fit one food truck."], ["🛡️", "Product-loop guardian", "Fallback, failure drills, OTA, and rollback all entered the acceptance evidence."], ["🌍", "Fifteen-day route complete", "From neural networks to edge LLM infrastructure, you now hold the complete engineering map."]],
];

const normalize = entries => entries.map(day => day.map(([icon, title, message]) => ({ icon, title, message })));

module.exports = { "zh-CN": normalize(zh), en: normalize(en) };
