module.exports = [
  {
    "n": 16,
    "t": "大规模 LLM Infra：从芯片到集群",
    "s": "把一次训练迭代与一次在线请求放回真实的数据移动、并行拓扑和服务 SLO 中",
    "goal": "建立跨越寄存器、HBM、互连、网络、存储与调度器的统一成本模型；能解释 DP、TP、PP、CP、EP、FSDP/ZeRO 分别切什么、搬什么；能用 TTFT、ITL、goodput 与尾延迟判断训练或服务方案，而不是用峰值 FLOPS 或项目名称代替系统分析。文中易变项目状态截至 2026-08-11 核验。",
    "concept": [
      "数据移动层级与拓扑亲和性",
      "DP、TP、PP、CP、EP 与全分片并行",
      "Checkpoint、故障恢复与训练 goodput",
      "KV Cache、连续批处理与 Prefix Cache",
      "Prefill/Decode 解耦、控制面与 SLO"
    ],
    "analogy": "把集群看作跨城协同印刷厂：算力只是印刷机速度，纸张与半成品在仓库、车间、园区和城市之间的搬运，才决定订单能否按时交付。",
    "diagram": "请求 → 准入/分词 → KV 感知路由 → Prefill 网格\n                                      │\n                                      └─ KV blocks ─→ Decode 网格 → token stream\n训练：数据批次 → DP ranks ─ TP/PP/CP/EP → 梯度分片/规约 → checkpoint\n层级：寄存器/SRAM ↔ HBM ↔ 节点内互连 ↔ 节点间网络 ↔ 本地/远端存储",
    "code": "# CPU-only: two-process collective microscope\npython -m torch.distributed.run --standalone --nproc_per_node=2 collective_lab.py \\\n  --backend gloo --sizes 1024,1048576,16777216 --warmup 10 --iters 50\n\n# 记录每个 collective 的 p50/p95，而不是只保留一次最快值\n# all_reduce: 每个 rank 得到规约结果\n# all_gather: 每个 rank 收集完整分片集合\n# reduce_scatter: 规约后每个 rank 只保留一个分片",
    "lab": "用两进程 Gloo 写一个 collective 显微镜：固定机器、PyTorch 版本、线程数与进程绑定，分别对 1 KiB、1 MiB、16 MiB 张量预热 10 次并测量至少 50 次 all-reduce、all-gather、reduce-scatter；用 barrier 对齐但不要把 barrier 时间算入操作本体，报告 p50/p95、有效带宽与每 rank 数据量。先预测启动延迟主导的小消息区与带宽主导的大消息区，再解释为什么结果不能外推到 NCCL、RDMA 或多机 GPU。可选实验是在固定模型、prompt 和并发下用 vLLM 分别记录 TTFT、ITL、输出吞吐与 prefix 命中，禁止只报 tokens/s。",
    "pitfall": "不要把 Kubernetes、NCCL、vLLM 或 FlashAttention 放进一张“谁更快”的横向榜单：它们分别处在控制面、通信、runtime 与 kernel/算法层。也不要抄录厂商峰值或某个项目 README 的单点数字来推断自己的集群；模型、dtype、序列分布、并发、拓扑、功率与 SLO 缺一项，比较就失去边界。",
    "questions": [
      "FSDP2 在一次前向/反向附近为什么既需要 all-gather，又需要 reduce-scatter？",
      "为什么张量并行通常优先放在拥有高速 scale-up 互连的节点内部？",
      "Prefill/Decode 解耦在什么条件下会因 KV 迁移和额外排队而变慢？"
    ],
    "next": "端侧 LLM Infra：从云端经验到设备约束",
    "lesson": [
      {
        "title": "先画数据移动层级，再谈算力",
        "body": "一个 kernel 中最热的标量可能停在寄存器，线程块复用的数据进入片上 SRAM/shared memory，模型权重、激活与 KV cache 主要驻留 HBM；跨卡张量经 PCIe 或专用 scale-up 互连，跨节点 collective 经过网卡与交换网络，checkpoint 最终落到本地 NVMe 或远端对象/并行文件系统。每向外一层，容量往往更大，但延迟、能耗和争用也上升。算术强度描述每搬一个字节能完成多少计算；Attention、MoE dispatch 和 embedding lookup 的瓶颈可能完全不同。工程分析应给每条边标注字节数、频率、并发者与拓扑，而不是笼统地说“GPU 很快”。HBM 容量决定模型能否放下，HBM 带宽决定许多逐 token kernel 的上限，节点内互连影响 TP collective，节点间网络影响 DP、EP 与 checkpoint 恢复。峰值 FLOPS 只有在数据及时到达计算单元、kernel 形状合适且通信被隐藏时才可能转化为有效吞吐。"
      },
      {
        "title": "六种并行是在不同维度切同一个训练图",
        "body": "数据并行 DP 复制模型、切输入 batch，并在反向后规约梯度；张量并行 TP 在单层内部切矩阵或 attention head，因此每层都可能触发 all-reduce 或 reduce-scatter/all-gather，最依赖低延迟高带宽节点内互连；流水线并行 PP 按连续层切 stage，搬运 stage 边界激活，并以 microbatch 填充流水线，气泡和负载不均是关键成本。上下文并行 CP 切长序列维度，需要交换 attention 所需的 K/V 或中间结果；专家并行 EP 把 MoE 专家分散到 rank，通过 all-to-all dispatch/combine 搬 token，路由倾斜会让少数专家拖住全局。FSDP/ZeRO 则切参数、梯度与优化器状态：计算前 all-gather 所需参数，反向后 reduce-scatter 梯度，再释放完整副本。它们不是互斥按钮，真实作业常用多维 device mesh 组合，但每新增一维都增加布局转换、故障面与调参空间。"
      },
      {
        "title": "训练效率应以完成有效工作衡量",
        "body": "训练数据从对象存储进入主机缓存、数据加载器、加速器，再经过前向、反向、优化器更新。只看设备利用率会漏掉数据饥饿、重算、通信阻塞与失败重跑。goodput 是在目标时间内完成并对收敛有贡献的样本或 token 比例：为了容错而频繁 checkpoint 会暂停计算，太少 checkpoint 又会在故障后丢掉更多进度。分布式 checkpoint 必须描述每个分片的逻辑坐标、dtype、模型与优化器版本，并通过临时对象、校验和与原子提交避免把半写入快照标成可恢复。恢复路径还要处理 world size 变化、数据游标、随机数状态和学习率调度。一次成功保存不等于可恢复；应定期从隔离环境恢复并跑过若干步，测量 RTO、读取热点与重新分片成本。"
      },
      {
        "title": "在线推理有两个阶段、两类延迟和一个持续增长的状态",
        "body": "Prefill 并行处理 prompt token，通常能形成较大的矩阵乘，决定 Time To First Token；Decode 每轮只生成少量 token，却要读取所有层的权重和历史 K/V，常受内存带宽与调度开销约束，Inter-Token Latency 决定流式体验。KV cache 让系统不必为旧 token 重算 attention，但其容量随并发、上下文长度、层数、head 数和 dtype 增长。PagedAttention 把逻辑连续序列映射到可分页物理 block，降低外部碎片并支持灵活共享；prefix cache 复用相同前缀 block，但命中率取决于模板规范化、租户隔离与路由局部性。continuous batching 在每个 decode 迭代接纳和移除请求，减少静态 batch 的空槽，却使排队策略、抢占与尾延迟成为一等问题。吞吐必须在给定 TTFT/ITL SLO 下报告，超时后才完成的 token 不属于有效服务能力。"
      },
      {
        "title": "Prefill/Decode 解耦是一个条件优化，不是免费加速",
        "body": "Prefill 偏计算密集，Decode 偏内存带宽与小步调度；把两类 worker 独立扩缩容，可减少互相干扰，并让长 prompt 与持续生成使用不同并行配置。请求先由调度器根据负载、prefix/KV 位置和 SLO 选择 decode，再在需要时发送到 prefill 网格；Prefill 完成后必须把可能很大的 KV blocks 移交 Decode。额外网跳、序列化、KV 传输、目标预留与两边排队都进入 TTFT。如果 prompt 很短、prefix 已在 Decode 命中、互连拥塞，或 KV 大于重算代价，解耦反而更慢。正确策略应按请求选择共置或解耦，并测交叉点。故障处理也要定义：Prefill 完成而 Decode 失效时，KV 是否可重用、重算还是丢弃；重复请求如何用 request id 去重；传输中的 block 何时释放。"
      },
      {
        "title": "把控制面、运行时、通信库与 kernel 放在正确层次",
        "body": "Kubernetes 及其网关、调度扩展负责声明资源、放置副本、健康检查和流量入口，是控制面基础；llm-d 与 Dynamo 在其上组织 KV 感知路由、解耦服务和多层缓存等分布式数据面策略。vLLM、SGLang、TensorRT-LLM 是模型服务 runtime，管理请求队列、batch、KV 与执行循环。PyTorch FSDP2/DTensor、Megatron Core、DeepSpeed 主要提供训练图分片和并行机制。NCCL/RCCL 执行 collective，DeepEP 面向 MoE token dispatch，NIXL 抽象跨内存层和节点的数据移动；Triton 与 FlashAttention 更接近 kernel/算法实现。相邻层会集成，但不能因为都“提升 LLM 性能”就当成同层竞品。一次性能回归应沿请求 trace 下钻到排队、runtime 调度、collective、kernel 和链路计数，而不是先更换整个栈。"
      },
      {
        "title": "用 SLO、可观测性和故障演练闭环容量规划",
        "body": "服务入口应记录输入/输出 token、模型和 tokenizer 版本、采样参数、租户、deadline 与 trace id；路由器记录选择原因、prefix 命中和队列估计；worker 暴露 TTFT、逐 token ITL、batch 宽度、KV block 使用率、抢占、OOM 与错误；网络侧观察 collective 或点对点传输字节、拥塞和重试。容量模型至少区分短问答、长上下文、批处理与多轮会话，因为均值流量会掩盖长 prompt 对 Prefill 和 KV 的冲击。压测要回放到达过程与长度分布，并同时报告 p50/p95/p99 和 SLO goodput。故障演练包括杀 worker、降速网络、填满 KV、破坏一个 checkpoint 分片以及滚动升级不兼容 runtime。只有当系统在这些条件下能拒绝、降级、回滚并留下证据，峰值 benchmark 才能变成可运营的容量结论。"
      }
    ],
    "references": [
      ["Megatron-LM：大规模 Transformer 的并行训练", "https://arxiv.org/abs/2104.04473"],
      ["ZeRO：消除数据并行内存冗余", "https://arxiv.org/abs/1910.02054"],
      ["vLLM / PagedAttention 原始论文", "https://arxiv.org/abs/2309.06180"]
    ],
    "quiz": [
      {
        "prompt": "FSDP2/ZeRO 风格的全分片训练，在一层计算附近最典型的通信配对是什么？",
        "options": ["前向前广播输入，反向后只写磁盘", "计算前 all-gather 参数，反向后 reduce-scatter 梯度", "每个 token 都执行 all-to-all 专家路由", "只在作业结束时做一次 all-reduce"],
        "answer": 1,
        "explanation": "参数平时按 rank 分片；计算一组参数前需要聚合出可用视图，反向产生的梯度再规约并分片。具体预取与释放时机可优化，但数据依赖不会消失。"
      },
      {
        "prompt": "为什么张量并行通常优先限制在同一高速互连域内？",
        "options": ["因为 TP 不需要任何通信", "因为 TP 只能用于卷积网络", "因为层内 collective 频繁，链路延迟和带宽直接进入每层关键路径", "因为节点间网络不能传浮点数"],
        "answer": 2,
        "explanation": "TP 把一个层的计算切到多个 rank，层内结果必须频繁合并。把它跨越较慢网络会把通信延迟重复叠加到许多层；这不是协议限制，而是关键路径成本。"
      },
      {
        "prompt": "哪种情况最可能让 Prefill/Decode 解耦比共置更慢？",
        "options": ["长 prompt、空闲高速 KV 链路且两阶段负载失衡", "短 prompt、Decode 已命中前缀且 KV 迁移链路拥塞", "两类 worker 能独立扩缩容", "Prefill 与 Decode 使用不同的最优 batch 形状"],
        "answer": 1,
        "explanation": "短 prompt 的 Prefill 工作很少，已有 prefix 又减少重算；此时额外排队、网跳和 KV 迁移很可能超过分离阶段带来的收益，策略应选择共置。"
      }
    ],
    "readingMinutes": 28,
    "keywords": [
      {"term": "Goodput", "definition": "在给定正确性与 SLO 约束内完成的有效工作量，而非原始峰值吞吐。", "espAnalogy": "像只统计按 deadline 校验通过的数据帧，不把迟到或 CRC 错误帧算成绩。"},
      {"term": "Collective", "definition": "一组 rank 共同参与的数据交换与规约操作，如 all-reduce、all-gather。", "espAnalogy": "像多节点总线事务，但参与者、拓扑和字节量共同决定代价。"},
      {"term": "KV Cache", "definition": "保存历史 token 的 attention Key/Value，避免 Decode 重算旧上下文。", "espAnalogy": "像为持续会话保留的高速状态缓存，容量与生命周期必须受控。"},
      {"term": "PD 解耦", "definition": "把 Prefill 与 Decode 放到可独立调度和扩缩容的 worker 池。", "espAnalogy": "像把批量预处理与实时控制任务分到不同核，但跨核队列与复制仍有成本。"}
    ],
    "recap": "Day 15 已把模型、runtime、ESP32 安全边界与发布验收闭成一套可交付系统。它是端侧主线的阶段整合章，而不是课程终点：当同一模型要训练到更大规模、同时服务许多请求时，必须把单机的内存与延迟账本扩展为集群的数据移动、并行和 SLO 账本。",
    "nextPreview": "下一章把集群得到的 I/O-aware、分页状态、拓扑意识和可运营性经验带回设备，但会逐项判断哪些可迁移、哪些必须针对 batch=1、统一内存、功耗与热约束重写。",
    "history": {
      "intro": "大规模 LLM Infra 不是一条由更快 GPU 单独推动的路线。芯片线持续改变计算、内存与互连比例；系统线则用分片、I/O-aware 算法和请求调度把这些硬件拼成可用服务。两条线必须同时阅读。",
      "tracks": [
        {
          "title": "芯片与互连线",
          "milestones": [
            {"year": "2012", "title": "GPU 深度学习证明高吞吐并行计算的规模效应", "body": "AlexNet 用 GPU 训练大规模卷积网络，让通用并行加速器成为深度学习主力；后续系统问题随即从单 kernel 扩展到多卡供数与同步。", "source": {"label": "AlexNet 原始论文", "url": "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks.pdf"}},
            {"year": "2017", "title": "TPU 与 Tensor Core 把矩阵乘变为专用快速路径", "body": "TPU 论文展示 systolic array 与片上缓冲如何围绕神经网络推理组织；同一时期 Tensor Core 推动混合精度矩阵运算，模型与 kernel 开始共同适配专用数据路径。", "source": {"label": "TPU 原始论文", "url": "https://arxiv.org/abs/1704.04760"}},
            {"year": "2018", "title": "混合精度把数值格式变成系统杠杆", "body": "FP16 计算配合 FP32 累加与 loss scaling，在维持训练可用性的同时减少带宽和存储压力；BF16、FP8 与量化延续了模型—硬件协同方向。", "source": {"label": "混合精度训练原始论文", "url": "https://arxiv.org/abs/1710.03740"}},
            {"year": "2020s", "title": "HBM 与 scale-up 互连共同定义加速器域", "body": "单卡容量和带宽不能独立解决超大模型；高带宽内存与节点内互连让多个加速器能以更低代价共享层内工作，拓扑亲和性进入并行规划。", "source": {"label": "NCCL 官方用户指南", "url": "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/overview.html"}},
            {"year": "至今", "title": "机架级 AI 系统把互连、供电与散热一起设计", "body": "加速器不再只是可互换的 PCIe 卡；机架内网络、交换芯片、CPU、存储层、功率和冷却共同约束可持续吞吐，因此比较必须绑定具体工作负载与系统配置。", "source": {"label": "MLPerf Training 官方结果与规则", "url": "https://mlcommons.org/benchmarks/training/"}}
          ]
        },
        {
          "title": "并行算法与服务系统线",
          "milestones": [
            {"year": "2012", "title": "参数服务器把模型状态与工作进程解耦", "body": "DistBelief 展示跨大量机器训练深度网络的参数服务与异步方法，为后来的数据并行、容错与集群调度提供早期系统框架。", "source": {"label": "DistBelief 原始论文", "url": "https://research.google/pubs/large-scale-distributed-deep-networks/"}},
            {"year": "2019", "title": "Megatron 让 Transformer 层内张量并行可规模化", "body": "Megatron-LM 系统化切分 attention 与 MLP 矩阵，并将张量、流水线和数据并行组合，清晰暴露了并行维度与互连拓扑的关系。", "source": {"label": "Megatron-LM 原始论文", "url": "https://arxiv.org/abs/2104.04473"}},
            {"year": "2020", "title": "ZeRO 消除数据并行的状态冗余", "body": "ZeRO 分阶段切分优化器状态、梯度和参数，以额外通信换取显著内存容量，后来成为 FSDP 类实现的重要设计基础。", "source": {"label": "ZeRO 原始论文", "url": "https://arxiv.org/abs/1910.02054"}},
            {"year": "2022", "title": "FlashAttention 用 I/O-aware 分块减少 HBM 往返", "body": "它没有把 attention 近似掉，而是按片上存储容量组织精确计算，减少中间矩阵读写，说明算法复杂度相同并不代表真实硬件成本相同。", "source": {"label": "FlashAttention 原始论文", "url": "https://arxiv.org/abs/2205.14135"}},
            {"year": "2023–至今", "title": "PagedAttention 之后，KV 成为集群级调度对象", "body": "vLLM 将 KV 分页以减少碎片并支持共享；随后 prefix-aware 路由、分层缓存与 Prefill/Decode 解耦把状态位置、传输和 SLO 带入服务控制面。", "source": {"label": "vLLM / PagedAttention 原始论文", "url": "https://arxiv.org/abs/2309.06180"}}
          ]
        }
      ],
      "bridge": "芯片线给出带宽、容量和拓扑边界，系统线决定如何切模型、放状态、排请求并在失败后恢复。任何只讲其中一条的架构图都会漏掉关键路径：并行算法必须服从互连，服务调度必须知道 KV 在哪里，容量结论必须服从 SLO。"
    },
    "visual": {
      "title": "一次请求穿过 Prefill/Decode 解耦服务集群",
      "description": "逐步观察 token、KV blocks 与调度元数据走不同路径；每一步都可能改变 TTFT、ITL 或缓存命中。",
      "steps": [
        {"icon": "🚪", "label": "准入与分词", "data": "prompt + tenant + deadline → token IDs", "action": "网关校验限额、套用版本化聊天模板并估算 prompt/output 预算", "insight": "错误 tokenizer 或模板会同时破坏语义、容量估算与 prefix 命中"},
        {"icon": "🧭", "label": "KV 感知路由", "data": "token hash + cache index + queue state", "action": "在 prefix 局部性、负载和 deadline 之间选择 Decode 归属与是否远程 Prefill", "insight": "最短队列未必最快；丢掉热 prefix 可能付出更高重算成本"},
        {"icon": "🏗️", "label": "Prefill 模型网格", "data": "prompt blocks → logits + KV blocks", "action": "用适合长矩阵的 TP/PP 配置并行处理输入上下文", "insight": "Prefill 主要影响 TTFT，也决定将产生多少 KV 状态"},
        {"icon": "🚚", "label": "KV 迁移", "data": "block IDs + K/V payload + ownership", "action": "通过点对点数据面把 KV 传给已预留空间的 Decode worker 并提交所有权", "insight": "传输字节、链路争用和失败清理决定解耦交叉点"},
        {"icon": "🔁", "label": "连续批 Decode", "data": "active sequences + paged KV → next tokens", "action": "每轮把新请求加入 batch、移除完成请求，并逐序列采样", "insight": "吞吐提升不能以破坏单请求 ITL 和公平性为代价"},
        {"icon": "📡", "label": "流式返回与回收", "data": "token stream + finish reason + metrics", "action": "按背压发送 token，提交 trace，并按会话策略释放或保留 KV blocks", "insight": "客户端断开、超时与取消必须尽快传到 worker，避免幽灵计算"}
      ],
      "loop": "多轮会话携带稳定 prefix 再次进入路由；缓存命中时可跳过部分 Prefill。完成、取消、驱逐或版本变化时，KV 所有权必须原子释放，路由索引也要同步失效。"
    },
    "analogyDetail": {
      "title": "把集群想成一组跨城协同的印刷厂",
      "story": "客户订单先由总调度台确认页数、时限与复用的公共版面。排版厂像 Prefill，一次处理大量原稿并产出装版托盘；高速印刷线像 Decode，反复读取固定机器与托盘，逐页流式出货。HBM 是机器旁最昂贵、最快的纸架，节点内互连是厂区传送带，节点间网络是跨城货运。TP 把同一页交给邻近机器协作，PP 把工序分厂，DP 复制整条线处理不同订单，ZeRO 把昂贵模具分仓保管，EP 则把特殊页送给不同专家车间。KV 托盘所在位置会影响调度，不能只选排队最短的厂。",
      "illustration": [
        {"icon": "🏭", "label": "厂内机器与纸架", "mapsTo": "计算单元、寄存器/SRAM、HBM 与高速 scale-up 互连"},
        {"icon": "🧩", "label": "拆页与分工", "mapsTo": "TP/PP/DP/CP 以及 ZeRO/FSDP 的状态分片"},
        {"icon": "🧑‍🔧", "label": "专家车间", "mapsTo": "MoE 路由、EP all-to-all 与负载倾斜"},
        {"icon": "📦", "label": "装版托盘与调度台", "mapsTo": "KV blocks、prefix 索引、PD 解耦和 SLO-aware 路由"}
      ],
      "boundary": "物流故事能提示层级、容量、所有权和排队，却不能预测 collective 算法、链路重叠、kernel occupancy、尾延迟或专家倾斜。真实系统必须用目标模型、序列分布、并发与拓扑测量；“同城更近”也不自动等于某个 collective 更快。"
    },
    "infra": {
      "verifiedOn": "2026-08-11",
      "intro": "以下是按职责层级整理的代表性开源项目，不是性能排名。版本、硬件支持和接口会变化；选型时应回到链接的官方文档或仓库，并用自己的模型、拓扑和 SLO 复测。",
      "layers": [
        {"layer": "训练分片与并行", "projects": [
          {"name": "PyTorch FSDP2 / DTensor", "url": "https://docs.pytorch.org/docs/main/distributed.fsdp.fully_shard.html", "problem": "以设备网格表达参数和张量分片，降低全分片训练的内存冗余。", "mechanism": "参数以 DTensor 分片保存，在计算前 all-gather，反向后 reduce-scatter，并支持二维 mesh 组合。", "boundary": "它不替你选择网络拓扑、checkpoint 策略或模型并行维度；峰值内存仍取决于预取与激活。"},
          {"name": "Megatron Core", "url": "https://github.com/NVIDIA/Megatron-LM", "problem": "为大型 Transformer 组合 TP、PP、CP、EP 与 DP。", "mechanism": "按 Transformer 结构切矩阵、层、序列与专家，并提供调度和通信重叠路径。", "boundary": "性能依赖受支持模型、并行布局和加速器拓扑，不能把示例吞吐直接搬到另一集群。"},
          {"name": "DeepSpeed", "url": "https://github.com/deepspeedai/DeepSpeed", "problem": "提供 ZeRO、流水线、混合精度与训练/推理系统能力。", "mechanism": "分片模型状态并协调通信、offload 和执行调度。", "boundary": "功能覆盖广不等于每个组合都最优；需锁定版本并验证与模型代码的契约。"}
        ]},
        {"layer": "通信与 Kernel", "projects": [
          {"name": "NCCL / RCCL", "url": "https://github.com/NVIDIA/nccl", "problem": "在 GPU 间执行拓扑感知 collective。", "mechanism": "选择 ring/tree 等算法与传输路径，暴露 all-reduce、all-gather、reduce-scatter 等原语。", "boundary": "通信库不会决定上层切分是否合理；RCCL 是 AMD 平台对应实现，应按硬件阅读各自支持矩阵。"},
          {"name": "Triton / FlashAttention", "url": "https://github.com/Dao-AILab/flash-attention", "problem": "减少算子实现成本与 attention 的 HBM 中间数据往返。", "mechanism": "编译专用 tile kernel；FlashAttention 用 I/O-aware 分块实现精确 attention。", "boundary": "形状、dtype、架构和编译版本影响收益，不能把单 kernel 加速等同于端到端吞吐。"},
          {"name": "DeepEP / NIXL", "url": "https://github.com/deepseek-ai/DeepEP", "problem": "处理 MoE token dispatch 与跨内存/节点数据移动等进阶数据面。", "mechanism": "DeepEP 优化专家 all-to-all；NIXL 为 KV 等对象提供跨异构内存层的传输抽象。", "boundary": "二者解决的对象不同，也不替代通用 collective、路由控制面或一致性协议。"}
        ]},
        {"layer": "模型服务 Runtime", "projects": [
          {"name": "vLLM", "url": "https://docs.vllm.ai/en/stable/", "problem": "提高生成式服务的 KV 利用率与动态请求吞吐。", "mechanism": "PagedAttention、continuous batching、prefix cache 与多类并行/连接器。", "boundary": "功能开关并非普遍增益；必须按 workload 验证 TTFT、ITL、尾延迟与显存。"},
          {"name": "SGLang", "url": "https://github.com/sgl-project/sglang", "problem": "组织结构化生成程序与高吞吐模型服务。", "mechanism": "将前端语言/缓存复用与后端调度、attention kernel 和分布式 serving 结合。", "boundary": "API 与后端快速演化；迁移前要验证 tokenizer、采样和输出语义一致。"},
          {"name": "TensorRT-LLM", "url": "https://github.com/NVIDIA/TensorRT-LLM", "problem": "在 NVIDIA 平台构建优化的 LLM 推理 engine 与服务执行路径。", "mechanism": "图优化、专用 kernel、量化、并行和 in-flight batching。", "boundary": "平台绑定和构建产物管理是成本；不可与跨厂商结果脱离环境比较。"}
        ]},
        {"layer": "分布式服务编排", "projects": [
          {"name": "llm-d", "url": "https://github.com/llm-d/llm-d", "problem": "在 Kubernetes 上组织 KV-aware 路由、分层缓存与解耦服务。", "mechanism": "连接 Gateway 调度、vLLM、KV 索引和点对点传输，按缓存与负载选择 worker。", "boundary": "它不是另一个 attention runtime；组件和能力仍快速演化，生产使用要锁版本并演练故障。"},
          {"name": "Dynamo", "url": "https://github.com/ai-dynamo/dynamo", "problem": "构建可组合的分布式推理数据面和 KV-aware 服务流水线。", "mechanism": "组织路由、worker、KV 传输/卸载以及 Prefill/Decode 分离。", "boundary": "参考配置不是跨模型通用最优解；额外服务跳数与状态协调必须进入 SLO 预算。"}
        ]}
      ],
      "matrix": [
        {"source": "数据移动层级", "lesson": "把权重、激活、梯度、KV 和 checkpoint 分别标到实际内存/网络层。", "boundary": "不能只用容量判断；还要测访问频率、争用与尾延迟。"},
        {"source": "多维并行", "lesson": "让高频、细粒度通信留在最快拓扑，低频、大粒度通信再跨节点。", "boundary": "最佳 mesh 随模型形状、序列长度和集群拓扑变化。"},
        {"source": "分页 KV 与解耦服务", "lesson": "状态位置和所有权必须进入调度决策，并对传输失败负责。", "boundary": "缓存命中和阶段分离只有在目标 workload 下才构成收益。"},
        {"source": "SLO goodput", "lesson": "以 deadline 内完成的请求或有效训练 token 做容量目标。", "boundary": "平均 tokens/s 无法代表尾延迟、公平性或故障恢复。"}
      ]
    }
  },
  {
    "n": 17,
    "t": "端侧 LLM Infra：从云端经验到设备约束",
    "s": "把 I/O-aware、分页状态与可运营性迁移到手机、PC、SBC 和 MCU 协同系统",
    "goal": "能先划清 ESP32/MCU、Linux Edge Host 与云端的能力边界，再为同一 checkpoint 选择量化、打包、编译/委派、runtime 与回退路径；能同时测量质量、TTFT、ITL、峰值 RSS、能耗/token、温度和热降频，并解释为什么权重能装入 RAM 或 NPU TOPS 很高仍不保证端到端可用。易变项目状态截至 2026-08-11 核验。",
    "concept": [
      "MCU、Edge Host 与云端的三级职责边界",
      "量化格式、模型包与 Runtime 契约",
      "CPU/GPU/NPU lowering、分区与 fallback",
      "端侧 KV、冷暖启动、功耗与热状态",
      "显式云回退、版本化与设备可观测性"
    ],
    "analogy": "把酒店厨房装进餐车：不能把整间厨房缩放后直接搬走，而要按车内电力、储藏、炉具和散热重新设计菜单与工序。",
    "diagram": "请求 → 预算门 → 量化模型包 → IR lowering / delegate partition\n                                      ↓\n存储 → mmap/加载 → 预热 → Prefill → Decode ↔ paged KV → stream\n                                      ↓\n                    RSS / J·token⁻¹ / 温度 / fallback trace\nESP32: 传感器与安全执行 ←协议→ Edge Host: LLM ←显式策略→ 云",
    "code": "# 同一 checkpoint、同一 prompt 集，比较 Q4/Q8；命令参数以本地版本 --help 为准\ngit -C llama.cpp rev-parse HEAD\nsha256sum model-q4.gguf model-q8.gguf\nllama-bench -m model-q4.gguf -p 512 -n 128 -r 5 -o json\nllama-bench -m model-q8.gguf -p 512 -n 128 -r 5 -o json\n\n# 同时从系统工具记录 peak RSS、功耗/能量、温度、backend 和冷/暖启动\n# 不允许拿不同 checkpoint、不同 context 或不同热状态的数字直接比较",
    "lab": "选择同一原始 checkpoint 转换出的 Q4 与 Q8 GGUF，固定 llama.cpp commit、编译选项、backend、线程、context、prompt tokens 与生成长度。每种模型分别测冷启动（清楚说明缓存条件）、预热后加载、pp512 Prefill、tg128 Decode、峰值 RSS 和输出质量样本；在设备允许时同步采样能量与温度，连续运行到稳态以观察热降频。保存模型 SHA-256 与完整命令，至少重复 5 次并报告分布。若没有合适设备，则做容量回退：估算权重文件、runtime、KV、临时 buffer、OS 余量与内存峰值，明确哪些是实测、哪些是上界估算，不能伪造速度。",
    "pitfall": "不要用模型文件大小代替峰值内存，也不要用 NPU TOPS 或一次凉机 tokens/s 代替产品体验。跨 runtime 或跨设备比较必须固定 checkpoint、量化、上下文、backend、线程、供电和热状态；仓库中的厂商 benchmark 只能作为可复现实验线索，不能脱离原始工作负载做排名。",
    "questions": [
      "为什么量化权重文件可以装入 RAM，运行时仍可能 OOM？",
      "为什么 NPU 的高 TOPS 仍可能得到较慢的端到端生成？",
      "为什么数据中心 continuous batching 不应默认迁移到单用户端侧？"
    ],
    "next": null,
    "lesson": [
      {
        "title": "先划三级边界：MCU 执行，Edge Host 推理，云端受控回退",
        "body": "ESP32/MCU 擅长传感器采样、实时控制、低功耗常驻、设备认证与执行器安全边界；它可以运行小分类器、唤醒词或异常检测，却通常没有通用聊天 LLM 所需的 RAM、存储带宽和算子栈。手机、PC、SBC 或 Linux Edge Host 拥有 GB 级内存、虚拟内存、CPU SIMD、GPU/NPU 与完整操作系统，才是本地生成式推理的主要承载层。云端可处理超长上下文、更大模型或集中知识，但回退必须显式：用户是否同意上传、哪些字段可离开设备、超时与费用上限、断网行为、结果是否拥有执行权。三级之间用版本化结构消息通信；MCU 不接收自由文本就直接驱动执行器，Edge Host 不把云端可用当作安全前提，云也不应绕过本地策略。这个边界让模型升级不会改变物理权限，让离线失败能进入确定性降级。"
      },
      {
        "title": "端侧芯片是异构内存系统，不是一串 TOPS",
        "body": "CPU 负责控制流、tokenizer、采样与不被 delegate 支持的算子；GPU 适合规则的大规模并行，但命令提交、shader 编译、buffer 转换和共享资源争用会进入延迟；DSP/NPU 在受支持的 dtype、shape 与图模式上能以较低能耗运行，却可能要求静态维度、特定量化或厂商编译器。统一内存减少显式 PCIe 复制，不等于数据免费移动：缓存一致性、页面迁移、带宽争用和布局转换仍消耗时间与能量。宣称的 TOPS 通常是特定低精度算术峰值，既不包括 tokenizer、KV 管理和 sampling，也不说明模型有多少算子 fallback 到 CPU。应从 runtime trace 查每个子图落在哪个 backend、边界复制多少字节、首次编译多长、并发 UI/相机是否抢资源，再解释端到端 TTFT 与 ITL。"
      },
      {
        "title": "模型文件只是交付契约的一部分",
        "body": "GGUF 把张量、量化类型和推理元数据打包，适合 llama.cpp 的低依赖多后端生态；ExecuTorch 把 PyTorch 模型 AOT 导出为 .pte，并通过 partitioner/delegate 把子图交给目标后端；MLC LLM 从模型表示经编译器生成平台代码与参数；LiteRT-LM 在 LiteRT 之上组合 tokenizer、解码器与跨平台 API；MNN-LLM 把移动 runtime、多 backend 与应用集成连接起来。格式名不能保证语义相同：tokenizer 文件、chat template、RoPE 参数、special token、量化尺度、KV dtype 和采样默认值都属于模型包契约。发布时要记录原 checkpoint、转换工具 commit、命令、hash、license、支持的 context 与验证 prompt；加载前验证 schema 和兼容矩阵，避免 runtime 静默采用错误默认值。模型可加载只证明字节能解析，不证明输出、速度或权限符合产品要求。"
      },
      {
        "title": "把 lowering、分区与 fallback 当作可观测编译过程",
        "body": "端侧部署通常先捕获或导出计算图，再规范化算子、融合 pattern、插入量化/反量化，最后由 partitioner 将支持的子图交给 CPU、GPU、NPU delegate。边界两侧可能需要 layout、dtype 或内存域转换；一个孤立的不支持算子会把图切碎，导致多次同步与复制，甚至让“启用 NPU”比纯 CPU 更慢。正确做法是保存编译报告：哪些节点被委派、哪些 fallback、每个子图的输入契约、workspace 和首次编译缓存。对动态序列长度，可使用 shape bucket、chunked prefill 或专用 decode 图，但要验证边界值。若 delegate 失败，fallback 必须是受测路径而非“理论上能跑”；它需要容量上限、超时、日志和可恢复的模型版本。编译器日志、runtime trace 和系统功耗采样必须用同一 request id 对齐。"
      },
      {
        "title": "云端技巧要按 batch=1 和小内存重新定形",
        "body": "FlashAttention 一类 I/O-aware kernel、算子融合、避免中间物化与减少 CPU—加速器复制可以直接迁移，因为端侧的带宽和能耗更加宝贵。Paged KV 也能减少长短会话混杂造成的碎片；prefix reuse 可复用系统 prompt；chunked prefill 能把长 prompt 拆成可调度块，避免一次峰值挤掉界面任务。但数据中心 continuous batching 的价值来自许多并发请求，单用户设备通常没有足够队列来摊薄开销，反而可能增加调度、功耗和首 token 等待。跨节点 TP/PP 更不应机械复制：设备内 CPU/GPU/NPU 的边界不是同质 rank，算子覆盖、共享内存和同步成本决定是否分区。端侧更常见的选择是单请求、低 batch、量化权重、受控上下文和局部 delegate；只有多会话网关等真实 workload 才考虑 continuous batching。"
      },
      {
        "title": "容量公式必须包含权重之外的所有活状态",
        "body": "Q4 权重能塞进 4 GB RAM 并不意味着模型能运行：文件映射页、量化 block 元数据、反量化或重排 buffer、runtime arena、图编译缓存、临时激活、tokenizer、应用 UI、操作系统都占内存；KV cache 还按层数、KV heads、head dimension、上下文和并发持续增长。某些 backend 会同时保留主机权重与设备副本，统一内存也可能在压力下发生压缩或换页，造成极长尾延迟。容量表应分静态、加载峰值、Prefill 峰值、每 token/每会话增量与系统安全余量，并在最坏 context 下实测 peak RSS。量化也不是只看平均 bit：不同 tensor 可使用不同类型，embedding/output 可能更高精度，文件头与对齐有额外成本。发生内存压力时应提前限制 context、卸载会话或拒绝请求，而不是等待 OS 杀进程。"
      },
      {
        "title": "以质量、体验、能量、温度和可恢复性共同验收",
        "body": "端侧 benchmark 必须固定 checkpoint、量化、prompt 集、backend、线程、功耗模式、环境温度和软件版本。分别报告加载冷启动与缓存暖启动、Prefill tokens/s 与 TTFT、Decode tokens/s 与 ITL、峰值 RSS、J/token 或平均功率、设备温度与持续运行后的频率变化；生成速度还要与任务质量、格式遵循和拒答策略一起看。观测数据带模型 hash、delegate 分区摘要与 trace id，便于在设备群中比较版本。发布采用签名模型包、兼容矩阵、灰度比例、健康门槛与回滚；离线、delegate 初始化失败、温度过高、内存不足和云回退超时都要演练。最终交付不是某台凉爽样机的一次最高 tokens/s，而是目标设备分布在真实热状态、网络和前台负载下仍满足体验与安全边界的证据。"
      }
    ],
    "references": [
      ["llama.cpp / GGUF 官方仓库", "https://github.com/ggml-org/llama.cpp"],
      ["MLC LLM 原始论文", "https://arxiv.org/abs/2306.05685"],
      ["ExecuTorch LLM 官方部署文档", "https://docs.pytorch.org/executorch/stable/llm/getting-started.html"]
    ],
    "quiz": [
      {
        "prompt": "一个 Q4 权重文件小于设备可用 RAM，为什么运行时仍可能 OOM？",
        "options": ["Q4 文件在加载后一定自动变成 Q16", "除权重外还有 KV、临时 buffer、设备副本、runtime 与 OS；加载峰值也可能高于稳态", "只有 tokenizer 会占用其余内存", "只要使用 mmap 就永远不会 OOM"],
        "answer": 1,
        "explanation": "文件大小只是静态权重近似。KV 随 context 增长，backend 可能重排或复制权重，Prefill 有临时峰值，应用与 OS 还需余量；mmap 只改变映射和按需调页方式。"
      },
      {
        "prompt": "NPU 标称 TOPS 很高但端到端 Decode 仍慢，最可信的解释是什么？",
        "options": ["TOPS 同时完整衡量 tokenizer、采样和所有内存访问", "生成模型不做矩阵计算", "算子覆盖不足导致 CPU fallback，且 delegate 边界复制、KV 带宽和小步同步主导", "NPU 只能运行浮点模型"],
        "answer": 2,
        "explanation": "TOPS 是特定精度下的算术峰值。实际图的覆盖率、shape、内存带宽、跨 delegate 复制与控制开销共同决定 TTFT/ITL，所以必须查看分区和 trace。"
      },
      {
        "prompt": "为什么不应默认把数据中心 continuous batching 搬到单用户手机？",
        "options": ["手机永远不能运行两个请求", "单用户通常没有足够并发可填充动态 batch，调度开销和等待可能恶化 TTFT、功耗与交互响应", "continuous batching 会改变模型权重", "它只适用于训练"],
        "answer": 1,
        "explanation": "continuous batching 为多请求复用每轮执行槽位。若真实 workload 接近 batch=1，收益来源不存在，还可能让交互任务等待；应由请求分布和测量决定。"
      }
    ],
    "readingMinutes": 28,
    "keywords": [
      {"term": "Delegate", "definition": "接收已分区子图并在 CPU/GPU/NPU 等特定后端编译执行的接口。", "espAnalogy": "像把一段受支持的工作交给硬件外设，但入口格式、DMA 和同步都要匹配。"},
      {"term": "Peak RSS", "definition": "进程在测量期间达到的最大常驻物理内存，用于发现加载或 Prefill 峰值。", "espAnalogy": "像同时记录 heap 高水位，而不是只看固件镜像大小。"},
      {"term": "能耗/token", "definition": "每生成或处理一个 token 消耗的能量，比瞬时功率更能联系有效工作。", "espAnalogy": "像用每次有效采样的焦耳数评估电池寿命，而非只读某一刻电流。"},
      {"term": "显式回退", "definition": "在权限、隐私、时限与失败行为已定义的条件下转到另一 backend 或云端。", "espAnalogy": "像主链路失败后进入经过验收的备份状态机，而非任意重试。"}
    ],
    "recap": "上一章在集群尺度建立了数据移动、分页 KV、阶段解耦、SLO goodput 与可观测性。终章把这些原则缩回设备：不是把数据中心配置复制到手机，而是保留可证明的机制，并针对异构 delegate、batch=1、RAM、能量与温度重新设计。",
    "nextPreview": "Day 17 是新的终章。后续项目应从目标设备与工作负载建立基线：先划安全和隐私边界，再固定模型包契约，逐层测量编译分区、内存、延迟、能量和热稳态，最后用灰度、回滚与故障演练把一次演示变成可维护产品。",
    "history": {
      "intro": "端侧 LLM 同样来自两条历史线：芯片从 CPU SIMD 走向移动 GPU、DSP、NPU 与 MCU 加速器，软件则从轻量解释器和图编译器走向量化格式、AOT delegate 与生成式 pipeline。硬件提供可能性，软件决定模型能否跨设备稳定交付。",
      "tracks": [
        {"title": "端侧芯片与异构计算线", "milestones": [
          {"year": "1990s–2000s", "title": "CPU SIMD 让多数据并行进入通用处理器", "body": "向量指令把量化点积、激活和预处理映射到宽寄存器；今天的端侧 CPU backend 仍依赖正确的数据布局、线程绑定和缓存复用。", "source": {"label": "Arm SIMD 官方文档", "url": "https://developer.arm.com/Architectures/Neon"}},
          {"year": "2000s–2010s", "title": "移动 GPU 与 DSP 承担媒体和机器学习数据流", "body": "可编程 shader、计算 API 与信号处理器提供比 CPU 更高的并行度，但也引入命令提交、buffer 域和算子覆盖边界。", "source": {"label": "Khronos OpenCL 官方规范", "url": "https://registry.khronos.org/OpenCL/"}},
          {"year": "2010s", "title": "NPU 把低精度神经网络图变为专用执行路径", "body": "移动 SoC 开始加入神经网络引擎；真正收益取决于编译器能覆盖多少图、支持哪些 shape/dtype，以及边界是否需要昂贵转换。", "source": {"label": "Android NNAPI 官方文档", "url": "https://developer.android.com/ndk/guides/neuralnetworks"}},
          {"year": "2020", "title": "MCU 级加速器把 TinyML 留在毫瓦级端点", "body": "Ethos-U 等设计面向受限 SRAM、低精度算子与实时嵌入式系统，适合小模型，不等同于把通用 LLM 直接塞进微控制器。", "source": {"label": "Arm Ethos-U55 官方资料", "url": "https://developer.arm.com/Processors/Ethos-U55"}},
          {"year": "至今", "title": "生成式 AI SoC 强化统一内存与异构协同", "body": "CPU、GPU、NPU 与共享内存控制器被放在同一封装中，减少某些离散传输，但带宽、缓存一致性、功耗预算和热降频仍限制持续生成。", "source": {"label": "MLCommons MLPerf Client 基准", "url": "https://mlcommons.org/benchmarks/client/"}}
        ]},
        {"title": "端侧软件与模型交付线", "milestones": [
          {"year": "2017–2019", "title": "TensorFlow Lite 把转换、解释器与 delegate 带到移动端", "body": "轻量 runtime、量化与平台 delegate 形成端侧部署基本模式：统一模型语义，按硬件能力分区执行，并保留 CPU 路径。", "source": {"label": "TensorFlow Lite 原始论文", "url": "https://arxiv.org/abs/1905.08166"}},
          {"year": "2018", "title": "TVM 把模型图与硬件 schedule 分离", "body": "端到端编译器用中间表示、自动/模板化调度和多硬件代码生成，说明 portability 需要显式 lowering，而不是期待同一 kernel 二进制通吃。", "source": {"label": "TVM 原始论文", "url": "https://arxiv.org/abs/1802.04799"}},
          {"year": "2023", "title": "llama.cpp 与 GGUF 降低本地量化 LLM 的部署门槛", "body": "低依赖 C/C++ runtime、量化工具和多 backend 让普通 PC、Mac、SBC 与移动设备可以在本地运行开放权重模型，并形成可复现实验入口。", "source": {"label": "llama.cpp 官方仓库", "url": "https://github.com/ggml-org/llama.cpp"}},
          {"year": "2023–2024", "title": "MLC LLM 与 ExecuTorch 强化 AOT、分区和跨平台交付", "body": "编译器驱动生成平台代码，或从 PyTorch 导出并把子图交给 delegate，使模型优化与应用 SDK、设备后端连接得更紧。", "source": {"label": "MLC LLM 原始论文", "url": "https://arxiv.org/abs/2306.05685"}},
          {"year": "2025–至今", "title": "LiteRT-LM、MNN 等补齐生成式 pipeline 与产品接口", "body": "端侧框架开始把 tokenizer、会话、KV、跨语言 API、多模态组件和 CPU/GPU/NPU backend 作为整套生成式交付面，而不再只执行一张静态图。", "source": {"label": "LiteRT-LM 官方仓库", "url": "https://github.com/google-ai-edge/LiteRT-LM"}}
        ]}
      ],
      "bridge": "芯片线解释“哪些计算可能高效”，软件线解释“如何把特定模型安全地送到这些计算单元”。二者交会处是 delegate 边界：每一次图切分、布局转换、缓存分配和 fallback 都必须被看见、测量并版本化。"
    },
    "visual": {
      "title": "一个端侧 Token 从预算到遥测的生命周期",
      "description": "动画把离线转换、首次加载与每次请求放在同一链路，展示端侧性能为何不只属于模型 kernel。",
      "steps": [
        {"icon": "🚦", "label": "预算门", "data": "device tier + privacy + context + deadline", "action": "根据设备能力、权限、温度和网络策略选择本地模型、降级任务或显式云回退", "insight": "路由首先是产品与安全决策，其次才是性能决策"},
        {"icon": "🧳", "label": "量化与打包", "data": "checkpoint → Q4/Q8 tensors + tokenizer + metadata", "action": "用锁定版本的工具转换，记录量化策略、模板、license 与 SHA-256", "insight": "同名量化不保证逐 tensor 策略、质量或 runtime 兼容性相同"},
        {"icon": "🧱", "label": "Lowering 与委派", "data": "graph IR → CPU/GPU/NPU partitions", "action": "规范化、融合并按 backend 能力切子图，输出 fallback 和边界复制报告", "insight": "一个不支持的算子可能把图切碎并吞掉 NPU 收益"},
        {"icon": "🔥", "label": "加载与预热", "data": "storage → mapped weights + caches + compiled kernels", "action": "验证包、分配 KV/workspace、建立编译缓存并区分冷暖启动", "insight": "加载峰值、首次 shader 编译和页面错误都可能主导首次体验"},
        {"icon": "📚", "label": "Prefill", "data": "prompt tokens → logits + local KV", "action": "在上下文预算内执行 I/O-aware attention，必要时 chunk 输入并让出前台资源", "insight": "较高 Prefill 吞吐不自动等于较短 TTFT，排队和热状态也在路径中"},
        {"icon": "🌡️", "label": "Decode 与遥测", "data": "paged KV → token stream + RSS + joules + temperature", "action": "逐 token 生成并记录 ITL、内存高水位、能量、温度、fallback 与 finish reason", "insight": "持续运行后的热稳态比一轮凉机峰值更接近产品体验"}
      ],
      "loop": "多轮会话回到预算门：根据剩余 context、KV 驻留、温度、电量与隐私策略继续、压缩、卸载或明确请求云端。取消和切换模型时先停止生成，再回收 KV 与 delegate 资源。"
    },
    "analogyDetail": {
      "title": "把酒店厨房装进一辆餐车",
      "story": "云端酒店厨房可以同时接很多桌订单，有巨型冷库、成排灶台和专门传菜员；端侧餐车只有有限电池、储藏、炉具与散热。量化模型包像把食材压成适合车载的标准箱，IR 和 delegate 像把菜单步骤分给刀台、炉灶和专用烤箱，CPU/GPU/NPU 各有擅长工序。KV cache 是为当前顾客保留的备菜盒，Prefill 是一次备齐原料，Decode 是一道道流式出餐。若专用烤箱不支持某一步，来回搬到普通炉灶可能更慢；订单过长还会占满备菜空间。ESP32 像车上的安全与传感控制器，LLM 主体运行在更有能力的车载主机。",
      "illustration": [
        {"icon": "🧳", "label": "标准食材箱", "mapsTo": "量化权重、tokenizer、元数据与可校验模型包"},
        {"icon": "🗺️", "label": "菜单工序表", "mapsTo": "图 IR、partitioner、delegate 与 fallback 边界"},
        {"icon": "🍱", "label": "备菜盒", "mapsTo": "受 RAM 与 context 预算约束的 paged KV cache"},
        {"icon": "🔋", "label": "电池和排风", "mapsTo": "能耗/token、温度、热降频与持续性能"}
      ],
      "boundary": "餐车类比能说明容量、异构分工和热预算，却不能把 TOPS 换算为 tokens/s，也不能预测量化质量、delegate 覆盖或 OS 调度。真实端到端速度取决于模型、shape、backend、内存路径、软件版本与热状态；所有结论必须在目标设备上复测。"
    },
    "infra": {
      "verifiedOn": "2026-08-11",
      "intro": "项目图谱按交付路线而非榜单排列。支持的模型、backend、量化和 CLI 会快速变化；以下边界用于决定从哪里验证，不构成跨厂商性能结论。",
      "layers": [
        {"layer": "低依赖量化 Runtime", "projects": [
          {"name": "llama.cpp / GGUF", "url": "https://github.com/ggml-org/llama.cpp", "problem": "在桌面、SBC 与移动平台低依赖运行量化开放权重 LLM。", "mechanism": "GGUF 打包张量和元数据，ggml kernel 配合 CPU、Metal、CUDA、Vulkan 等 backend，并提供转换与 llama-bench。", "boundary": "backend 与 CLI 快速变化；GGUF 能加载不等于 chat template、质量、功耗和设备兼容性已验证。"},
          {"name": "bitnet.cpp", "url": "https://github.com/microsoft/BitNet", "problem": "探索 1-bit/低比特模型与专用 kernel 的协同推理。", "mechanism": "围绕 BitNet 模型结构、权重表示和 CPU kernel 联合优化。", "boundary": "不是任意 checkpoint 的无损压缩器；收益依赖模型从训练到 kernel 的共同设计。"}
        ]},
        {"layer": "编译器与 AOT 部署", "projects": [
          {"name": "MLC LLM", "url": "https://github.com/mlc-ai/mlc-llm", "problem": "把 LLM 编译并部署到多类 GPU/CPU 平台与应用 API。", "mechanism": "基于机器学习编译器生成目标代码、量化模型库和平台绑定。", "boundary": "模型支持和目标工具链有明确版本矩阵；编译产物不是跨设备通用二进制。"},
          {"name": "ExecuTorch", "url": "https://docs.pytorch.org/executorch/stable/llm/getting-started.html", "problem": "把 PyTorch 模型 AOT 导出到移动/嵌入式 runtime。", "mechanism": "导出 .pte，使用 partitioner 将子图交给 XNNPACK、Core ML、Qualcomm 等 delegate，并通过 C++/Swift/Java 运行。", "boundary": "delegate 覆盖与动态 shape 决定边界成本；PyTorch 中能运行的模型不自动满足端侧内存。"}
        ]},
        {"layer": "生成式端侧 Pipeline", "projects": [
          {"name": "LiteRT-LM", "url": "https://github.com/google-ai-edge/LiteRT-LM", "problem": "提供跨平台端侧生成式推理 pipeline 与应用 SDK。", "mechanism": "在 LiteRT 之上组合 tokenizer、模型组件、会话与 CPU/GPU/NPU backend。", "boundary": "平台和 NPU 支持状态随版本变化；应以目标 release 的官方矩阵为准。"},
          {"name": "MNN-LLM", "url": "https://github.com/alibaba/MNN", "problem": "在手机、PC 和 IoT 上集成轻量多 backend LLM 与多模态应用。", "mechanism": "MNN runtime 连接 CPU、Metal、OpenCL/Vulkan 等后端、模型转换和移动应用接口。", "boundary": "仓库 benchmark 不能脱离设备、模型、线程和热条件与其他 runtime 排名。"}
        ]},
        {"layer": "平台专用路线", "projects": [
          {"name": "MLX-LM", "url": "https://github.com/ml-explore/mlx-lm", "problem": "在 Apple silicon 统一内存平台运行和微调 LLM。", "mechanism": "基于 MLX 数组框架、Metal 后端与平台内存模型提供量化、生成和训练工具。", "boundary": "平台专用优化不可直接外推到 Android、离散 GPU 或 MCU；仍要测内存压力和热稳态。"}
        ]}
      ],
      "matrix": [
        {"source": "I/O-aware kernel、融合、少复制", "lesson": "直接迁移；端侧带宽和电池使每次中间物化更昂贵。", "boundary": "必须针对目标 shape/backend 生成或选择 kernel，不能只看算法名。"},
        {"source": "Paged KV、prefix reuse、chunked prefill", "lesson": "按 batch=1 与受控 context 改造，可降低碎片、重复计算和峰值阻塞。", "boundary": "分页元数据与调度也有成本；prefix 必须版本化并隔离隐私域。"},
        {"source": "Continuous batching、跨节点 TP/PP", "lesson": "默认不迁移；先证明设备上确有并发队列或可获益的异构分区。", "boundary": "CPU/GPU/NPU 不是低成本同质 rank，边界复制可能超过计算收益。"},
        {"source": "数据中心拓扑意识", "lesson": "映射为 delegate 覆盖、共享内存、缓存一致性和 CPU/GPU/NPU 边界。", "boundary": "统一内存减少显式复制，不等于无限带宽或零同步。"},
        {"source": "SLO、版本化、回滚、可观测性", "lesson": "完整迁移，并增加 J/token、peak RSS、温度与热降频。", "boundary": "实验室凉机均值不能代表设备群中的持续体验和电池寿命。"}
      ]
    }
  }
];
