(function () {
  'use strict';

  Object.assign(globalThis.chapterEnrichment ||= {}, {
    11: {
      readingMinutes: 18,
      history: {
        intro: '今天所谓的 LLM Runtime，并不是突然出现的一层“模型播放器”。它继承了编译器、操作系统调度、数值计算库与在线服务系统的思想：先让计算图可执行，再让状态可复用，最后让多个请求在受控资源里稳定完成。沿着这条脉络看，prefill、decode、KV cache、流式输出和取消就不再是零散 API，而是同一个生命周期的不同阶段。',
        milestones: [
          {
            year: '2017',
            title: 'Transformer 奠定并行 Prefill 与自回归 Decode 的结构基础',
            body: '《Attention Is All You Need》用纯注意力架构替代循环结构，使整段输入可以高度并行处理；生成端仍按已生成前缀逐步产生下一个 token。现代 runtime 因而天然分成一次吞吐导向的 prefill 与多次低延迟 decode。',
            source: {label: 'Transformer 原始论文', url: 'https://arxiv.org/abs/1706.03762'}
          },
          {
            year: '2022',
            title: 'FlashAttention 把注意力优化从 FLOPs 推向 I/O',
            body: 'FlashAttention 明确把 HBM 与片上 SRAM 之间的读写纳入算法设计，通过分块减少中间矩阵搬运。它提醒 runtime 工程师：数学结果相同并不代表耗时相同，kernel 的数据路径往往比名义计算量更能解释实际速度。',
            source: {label: 'FlashAttention 原始论文', url: 'https://arxiv.org/abs/2205.14135'}
          },
          {
            year: '2023',
            title: 'llama.cpp 推动通用硬件上的本地 LLM 运行',
            body: 'llama.cpp 以轻量 C/C++ 实现把模型加载、量化 kernel、CPU/GPU 混合执行和命令行生成循环放到同一工程里。本地推理由研究脚本变为可嵌入进程，也让 mmap、线程数、context 和后端选择成为普通部署参数。',
            source: {label: 'llama.cpp 官方仓库', url: 'https://github.com/ggml-org/llama.cpp'}
          },
          {
            year: '2023',
            title: 'PagedAttention 将 KV 管理变成类似虚拟内存的问题',
            body: 'vLLM 的 PagedAttention 以固定块组织 KV cache，降低连续大块分配造成的碎片与浪费，并支持更灵活的请求调度。至此，runtime 不只是跑算子，还要像操作系统一样管理会话状态、页面、批处理和回收。',
            source: {label: 'PagedAttention 原始论文', url: 'https://arxiv.org/abs/2309.06180'}
          },
          {
            year: '2024—至今',
            title: '本地 Runtime 逐渐具备完整服务语义',
            body: '现代 llama-server 已把并行解码、连续批处理、流式接口、监控、结构化输出与取消等能力放进服务层。工程重点从“能生成一句话”转向资源隔离、可观测性、协议兼容和不可信工具调用的安全边界。',
            source: {label: 'llama.cpp Server 官方文档', url: 'https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md'}
          }
        ],
        bridge: '这段历史把本章的两条主线连在一起：Transformer 决定了生成循环的计算形态，系统论文与本地运行框架决定了状态怎样分配、调度和回收。接下来应同时画出数据流与控制流，尤其关注取消、超时和异常释放，因为这些路径最容易让一次演示与可靠产品拉开差距。'
      },
      analogy: {
        title: '把 Runtime 想成一间不断接单的面馆',
        story: '模型权重像挂在墙上的固定配方，加载一次即可复用；每位客人的 prompt 是一张新订单，prefill 像厨师一次读完所有加料要求并备好案台，KV cache 是这桌专属的半成品托盘。随后 decode 每次只做一小步、端出一个 token；采样器决定从几种合格调味中怎样选择，流式输出则让客人不必等整桌菜齐才开吃。若客人离店，取消信号必须立刻让后厨停火并归还托盘。',
        illustration: [
          {icon: '📕', label: '固定配方', mapsTo: '模型权重与 tokenizer 在进程启动时加载并校验'},
          {icon: '🧾', label: '订单入队', mapsTo: '请求校验、模板化、tokenize 与 context 分配'},
          {icon: '🥣', label: '专属托盘', mapsTo: '每个会话独立持有并持续追加 KV cache'},
          {icon: '🔔', label: '叫停铃', mapsTo: '断连、超时、EOS 或用户取消触发资源回收'}
        ],
        boundary: '面馆类比会在并行细节上失效：GPU batch 不是多个厨师各做一碗，而是把不同请求的同类矩阵运算拼成一次执行；token 也不是独立菜品，它会改变下一步全部概率。类比只帮助理解生命周期与所有权，不能用来推导吞吐、显存布局或采样数学。'
      },
      lesson: [
        {
          title: '先分清进程级资源与会话级状态',
          body: '权重映射、backend、线程池通常属于进程，可跨请求复用；token 序列、KV cache、采样器状态和停止条件属于会话，必须隔离。实现时为两类对象分别画生命周期：进程退出才释放权重，请求结束就归还 context。若把会话指针塞进全局单例，并发时会串写历史；若每次请求重载权重，TTFT 又会被初始化成本吞没。'
        },
        {
          title: 'Prefill 与 Decode 是两种工作负载',
          body: 'Prefill 一次处理整段 prompt，矩阵较大，通常更容易吃满并行算力；decode 每步只新增一个或少量 token，却要遍历层并读取历史 KV，常受内存带宽和 kernel 启动开销限制。因此不能用一个平均 tokens/s 描述两者。应分别记录 prompt tokens/s、TTFT、逐 token 延迟，并用真实输入长度测试，否则优化可能只把不重要的阶段变快。'
        },
        {
          title: '采样器是一条可复现的决策管线',
          body: '模型输出 logits 后，重复惩罚、温度缩放、top-k、top-p 与随机抽样按既定顺序改变候选分布；顺序或随机种子不同，输出就可能分叉。调试正确性时先使用贪心或固定种子，保存采样参数和首若干步 logits 摘要。面向工具调用还应使用语法或 schema 约束，但约束只保证结构可解析，不能证明命令被授权。'
        },
        {
          title: '流式返回必须与取消共用控制路径',
          body: 'SSE、WebSocket 或分块 HTTP 只是输出通道；真正困难的是客户端断开后，decode 任务能否在下一安全点观察取消标志，停止排队并释放 KV。设计时让请求拥有明确状态机：排队、prefill、decode、完成、取消、失败，并保证每个终态只回收一次。用慢客户端、半包、超时和重复取消做故障注入，检查没有悬挂线程与内存泄漏。'
        },
        {
          title: 'ESP32 与主机之间保留确定性闸门',
          body: 'Linux 主机可负责 tokenizer、LLM runtime 和自然语言解释，ESP32 则保留采样、执行器互锁、看门狗与本地降级。模型产生的工具名和参数只是“提案”，设备必须再次检查白名单、数值范围、当前状态与请求 nonce。验证时回放越权 GPIO、重复序号、过期命令、主机掉线和乱码帧，确认设备拒绝并留下可关联的审计日志。'
        }
      ],
      visual: {
        title: '一条请求如何穿过可取消的生成循环',
        description: '播放器每前进一步，就同时更新请求数据、runtime 动作和可观察证据；走到 decode 后会形成循环，直到命中明确终止条件。',
        steps: [
          {icon: '📨', label: '请求入站', data: 'messages + max_tokens + request_id', action: '校验大小、模板与权限策略，拒绝无界请求', insight: '越早拒绝，越少占用昂贵的 context 与队列时间'},
          {icon: '🔢', label: '编码分配', data: '[BOS, 421, 87, …] + context slot', action: 'tokenize，检查总 token 预算并绑定取消句柄', insight: '字符数不能代替 token 数；此时即可发现 context 溢出'},
          {icon: '🏗️', label: 'Prefill', data: 'prompt tokens → 每层 K/V 块', action: '批量执行 prompt 并建立首轮 KV cache', insight: '这段主要影响 TTFT，适合单独统计 prompt tokens/s'},
          {icon: '🎲', label: '采样', data: 'logits → candidate distribution → token', action: '按确定顺序应用惩罚、温度与 top-k/top-p', insight: '固定种子与参数才能复现分叉位置'},
          {icon: '📡', label: 'Decode 与流送', data: 'new token + cached K/V → text chunk', action: '追加 KV、解码文本并向客户端发送增量', insight: '慢消费者需要背压，不能无限堆积待发送 token'},
          {icon: '🧹', label: '终止回收', data: 'EOS | stop | limit | cancel | error', action: '结束状态机，归还 slot、KV 页面和网络资源', insight: '所有退出路径都应汇合到幂等清理逻辑'}
        ],
        loop: '若没有命中 EOS、停止串、长度上限、错误或取消，就从“Decode 与流送”回到“采样”：以上一个 token 作为新输入，复用已有 KV，并在每圈检查 deadline 与连接状态。'
      }
    },

    12: {
      readingMinutes: 18,
      history: {
        intro: '低比特模型的历史并不是把 float 简单截成整数。早期压缩研究已经把剪枝、量化与编码视作不同层次；LLM 时代又暴露出离群通道、层敏感度和专用 kernel 的问题。GGUF 则解决另一个维度：怎样把张量、量化类型和解释模型所需的元数据可靠装进一个可快速读取的容器。',
        milestones: [
          {
            year: '2015',
            title: 'Deep Compression 将量化放进系统化模型压缩流程',
            body: 'Deep Compression 把剪枝、训练后量化与 Huffman 编码组合起来，说明“位宽降低”只是压缩链路的一环。它也确立了重要工程习惯：压缩后必须回到任务精度与实际存储收益验证，而不能只报告理论 bit 数。',
            source: {label: 'Deep Compression 原始论文', url: 'https://arxiv.org/abs/1510.00149'}
          },
          {
            year: '2022',
            title: 'LLM.int8 揭示大模型离群特征的代价',
            body: 'LLM.int8 观察到部分隐藏维度出现系统性大幅值，并以混合精度路径保留这些离群计算。这推动量化从“所有权重统一降位”走向按统计特征分流，也解释了为何同为 int8，不同算法的质量和 kernel 要求会明显不同。',
            source: {label: 'LLM.int8 原始论文', url: 'https://arxiv.org/abs/2208.07339'}
          },
          {
            year: '2022',
            title: 'GPTQ 让超大模型的一次性权重量化更实用',
            body: 'GPTQ 使用近似二阶信息逐层量化权重，在无需完整重新训练的条件下把大模型压到 3 至 4 bit 区间。它强化了“误差需按权重相互作用补偿”的认识，也让校准样本与量化顺序成为部署产物的一部分。',
            source: {label: 'GPTQ 原始论文', url: 'https://arxiv.org/abs/2210.17323'}
          },
          {
            year: '2023',
            title: 'GGUF 统一张量容器与可扩展元数据',
            body: 'GGUF 作为 GGML、GGMF、GGJT 的后继格式，用类型化键值元数据、对齐的 tensor 区和版本字段降低歧义，并面向 mmap 读取。它并不规定模型必须采用哪一种量化；同一容器中可以存放不同类型的张量。',
            source: {label: 'GGUF 官方规范', url: 'https://github.com/ggml-org/ggml/blob/master/docs/gguf.md'}
          },
          {
            year: '2023—至今',
            title: '混合量化配方成为面向目标硬件的构建步骤',
            body: 'llama.cpp 的量化工具支持 K-quants、importance matrix 与按 tensor 覆盖类型，实践由选择单个“Q4”标签转向保留敏感张量、匹配 kernel、检查困惑度代理并在目标硬件测量。重新量化低比特文件也被明确视为高风险操作。',
            source: {label: 'llama.cpp Quantize 官方文档', url: 'https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md'}
          }
        ],
        bridge: '因此，本章不能把 GGUF、Q4_K_M 与“4 bit 模型”画成同义词。应拆成三层：量化算法怎样选择码值，块格式怎样保存码值与 scale，GGUF 怎样描述并定位这些张量。只有三层都被目标 runtime 正确理解，文件变小才可能转化为可用的内存、速度与质量收益。'
      },
      analogy: {
        title: '把量化模型想成装进航运集装箱的压缩调色板',
        story: '原始 FP16 权重像画室里几万种细微颜料。量化时不是随手丢掉颜色，而是把相近色按一小块分组，为每块制作有限色卡；整数码是色卡编号，scale 与最小值是还原说明。敏感层像人物眼睛，可留用更细色卡。GGUF 则是带清单的集装箱：箱头记录架构、tokenizer 和对齐规则，货位表指明每块张量在哪里、用哪种编码，runtime 才能直接搬到正确 kernel。',
        illustration: [
          {icon: '🎨', label: '原始颜料', mapsTo: 'FP16/BF16 基线权重与可信来源'},
          {icon: '🧩', label: '分块色卡', mapsTo: '量化值与每块共享的 scale、min 等附加参数'},
          {icon: '👁️', label: '精细局部', mapsTo: '输出层、嵌入或高敏感 tensor 保留更高精度'},
          {icon: '📦', label: '货运清单', mapsTo: 'GGUF header、metadata、tensor 描述与对齐数据区'}
        ],
        boundary: '颜料类比没有体现矩阵乘 kernel：压缩率高并不自动加速，若硬件缺少对应解码与乘法实现，运行时可能先反量化再计算。感知上的“颜色接近”也不是语言模型质量；最终仍需困惑度或任务集、长文本稳定性和目标设备基准来判断。'
      },
      lesson: [
        {
          title: '先算真实 BPW，不要被 Q4 名字迷惑',
          body: '块量化除低比特码值外，还要保存每块的 scale、min、对齐填充，有些格式又混用不同 tensor 精度，所以文件平均 bits per weight 通常不等于名称中的数字。验算时读取 GGUF tensor 类型和元素数，分别汇总数据字节与元数据开销，再与 FP16 基线比较。容量预算还要另加 tokenizer、KV cache 和 runtime workspace，模型文件大小不是峰值 RAM。'
        },
        {
          title: '块大小决定压缩与局部适应能力',
          body: '一组权重共享量化参数时，块越大，scale 开销占比越低，却越难同时覆盖小值和离群值；块越小，更能贴合局部范围，但额外参数、索引与 kernel 处理成本上升。per-tensor、per-channel 与 block-wise 不是抽象标签，而是在统计适配和存储访问之间选粒度。应查看目标格式的准确布局，不能拿通用公式硬套所有 Q4。'
        },
        {
          title: '混合精度要由敏感度与 kernel 共同决定',
          body: '嵌入、输出投影、注意力或某些 MoE tensor 对误差的敏感度并不一致，K-quants 的后缀往往表示一套混合配方。选择时从高精度 GGUF 生成多个候选，使用相同校准样本与任务集比较，并确认 backend 对其中每种 tensor type 都有高效 kernel。若少数层频繁回退或反量化，省下的带宽可能被边界转换抵消。'
        },
        {
          title: 'GGUF 是自描述容器，不是质量证书',
          body: '加载器依据 magic、版本、alignment、tensor shape/type 和架构 metadata 解释文件，tokenizer 与 chat template 相关字段还决定输入语义。格式合法只说明字节可解析，不证明权重来源、量化过程或模型输出正确。部署前应保存源模型修订号、转换器 commit、量化命令与哈希，并用 dump 工具核对关键 metadata，防止“能打开但稳定答错”的静默故障。'
        },
        {
          title: '建立不可逆转换的单向发布链',
          body: '量化会丢失信息，从 Q4 再量化到 Q5 并不会恢复精度，反而加入第二轮舍入误差。工程仓库应保留可信 FP16/BF16 或官方原始权重，把转换和量化做成可重放构建：输入哈希固定、工具版本固定、产物另名输出。验收同时测文件大小、峰值常驻内存、PP/TG 速度、任务正确率和长输出异常，任一项退化都能追溯到配方。'
        }
      ],
      visual: {
        title: '一份高精度权重如何变成可验证的 GGUF',
        description: '动画把“转换容器”和“量化张量”分开显示，避免将格式、算法和最终部署性能混为一步。',
        steps: [
          {icon: '🔐', label: '冻结基线', data: 'BF16/FP16 weights + tokenizer + revision', action: '记录来源、许可证、哈希与基线输出', insight: '后续任何低比特产物都应可回溯到同一高精度起点'},
          {icon: '🗂️', label: '转换容器', data: 'named tensors + typed metadata', action: '写入 GGUF header、架构字段、词表和 tensor 目录', insight: '此时可仍是高精度；GGUF 与量化并非同一动作'},
          {icon: '📊', label: '采集敏感度', data: 'calibration tokens → activation/importance stats', action: '用代表性文本统计层与权重的重要性', insight: '校准域偏离真实请求会让混合精度配方失准'},
          {icon: '🧊', label: '分块量化', data: 'float block → codes + scale/min', action: '按目标类型编码，并为敏感 tensor 覆盖精度', insight: '平均 BPW 由码值和块附加数据共同组成'},
          {icon: '🔎', label: '结构核验', data: 'GGUF dump + tensor inventory + hash', action: '检查版本、shape、type、alignment 与必要 metadata', insight: '解析成功只是第一关，还未证明数值质量'},
          {icon: '🏁', label: '目标机验收', data: 'quality + RSS + PP/TG + energy', action: '以固定 prompt 和版本对比多个候选', insight: '只有真实 backend 能回答压缩是否转化成速度与能效收益'}
        ],
        loop: '若质量超限，回到“采集敏感度”扩大代表性样本或提高敏感 tensor 精度；若速度不升，回到“分块量化”检查 kernel 支持与反量化边界。始终从高精度基线重新生成，禁止串行重复量化。'
      }
    },

    13: {
      readingMinutes: 19,
      history: {
        intro: '端侧推理框架的演进，本质上是在回答同一难题：怎样把训练框架中的图，可靠地映射到不断变化的 CPU、GPU、NPU 与操作系统。开放中间表示解决交换，张量编译器解决自动优化，轻量 runtime 解决包体与依赖，delegate 则让厂商后端接入统一上层。今天的框架选择，是这些路线在具体产品约束下的组合。',
        milestones: [
          {
            year: '2017',
            title: 'ONNX 推动模型交换与算子版本契约',
            body: 'ONNX 用图、节点、initializer、类型与 opset 描述模型，使训练框架和执行器可以围绕共同 IR 协作。它解决的是“表达什么”，而非自动保证目标芯片上有高效实现；这种分层后来成为比较各种 runtime 的第一把尺子。',
            source: {label: 'ONNX 官方概念文档', url: 'https://onnx.ai/onnx/intro/'}
          },
          {
            year: '2018',
            title: 'TVM 展示端到端张量编译与多后端优化',
            body: 'TVM 将高层图优化、算子融合、硬件映射和低层 schedule 纳入自动编译流程，并覆盖低功耗 CPU、移动 GPU 等后端。它把“换硬件重写全套 kernel”的问题，改写为 IR lowering、搜索与目标代码生成问题。',
            source: {label: 'TVM OSDI 原始论文', url: 'https://www.usenix.org/conference/osdi18/presentation/chen'}
          },
          {
            year: '2023',
            title: 'llama.cpp 证明专用轻量 Runtime 的端侧价值',
            body: '面向自回归 LLM 的 llama.cpp 把 GGUF、量化 kernel、KV cache 和多种 CPU/GPU backend 紧密结合，以较少依赖覆盖桌面与边缘设备。它代表另一条路线：针对主工作负载做深度垂直整合，而不是追求任意训练图通吃。',
            source: {label: 'llama.cpp 官方仓库', url: 'https://github.com/ggml-org/llama.cpp'}
          },
          {
            year: '2023—2024',
            title: 'ExecuTorch 将 AOT 准备和 Backend Delegate 明确分层',
            body: 'ExecuTorch 把程序导出、Edge dialect、内存规划和后端 lowering 尽量前移到 AOT 阶段，设备上只保留精简 C++ runtime。被支持的子图交给 delegate，不支持部分留在可移植 kernel，端侧部署由此拥有清晰的分区与 fallback 模型。',
            source: {label: 'ExecuTorch 官方架构文档', url: 'https://docs.pytorch.org/executorch/stable/getting-started-architecture'}
          },
          {
            year: '至今',
            title: '框架竞争转向编译产物、异构分区与可观测性',
            body: 'MLC LLM 等系统将权重转换与目标模型库编译分开，按 WebGPU、移动 GPU 或本地平台生成推理逻辑。工程比较也从 API 风格转向：支持哪些图、何时编译、跨分区复制多少、能否回溯 fallback，以及升级后能否复现实测。',
            source: {label: 'MLC LLM 官方编译文档', url: 'https://github.com/mlc-ai/mlc-llm/blob/main/docs/compilation/compile_models.rst'}
          }
        ],
        bridge: '历史说明不存在脱离模型与硬件的“最快框架”。通用 IR、编译型系统与垂直 runtime 各自把复杂度放在不同阶段。选择时应从目标模型的算子集合、部署平台、包体、动态性和调试要求反推，而不是先按品牌站队；随后用同一输入与相同精度建立 CPU 基线，再逐段验证 offload。'
      },
      analogy: {
        title: '把推理框架想成一座多式联运货运站',
        story: '模型图是一列写着货物依赖的车厢，runtime 是总站调度室，CPU、GPU、NPU 是公路、铁路和水运三种承运商。partitioner 检查每段货物尺寸与规则，把连续可承运的车厢编成子图；delegate 像专线合同，把整段交给某后端。若一件货物不合规，就回到 CPU 普通线路。每次换线都要卸货、改包装和同步，因此“多数车厢走高速线”仍可能输给全程普通线。',
        illustration: [
          {icon: '🚆', label: '模型列车', mapsTo: '带 shape、dtype 和依赖关系的计算图'},
          {icon: '🧭', label: '调度分区', mapsTo: '按后端能力找出连续可 offload 子图'},
          {icon: '🚄', label: '专用快线', mapsTo: 'GPU/NPU delegate 与预编译二进制'},
          {icon: '🔄', label: '换装站', mapsTo: '跨 backend 的 copy、layout transform 与同步'}
        ],
        boundary: '货运类比暗示每段成本可以简单相加，但真实 runtime 会异步执行、复用 buffer、融合算子并与 CPU 并发；后端也可能只接受特定动态 shape 或量化参数。类比适合发现边界成本，不足以预测时延，最终仍要看 trace 和设备计数器。'
      },
      lesson: [
        {
          title: '用四层模型拆解框架宣传语',
          body: '先分别写出模型格式、runtime、backend 与 kernel：GGUF 或导出图负责表达；runtime 管生命周期与调度；backend 接入 CPU/GPU/NPU；kernel 执行具体布局和 dtype。框架声称“支持某芯片”时，要追问哪些模型架构、哪些算子和量化类型真的走专用 kernel。只要其中一层版本不匹配，就可能加载失败、静默 fallback 或产生额外转换。'
        },
        {
          title: 'Partition 的价值取决于边界而非节点占比',
          body: 'delegate 通常选择连续且受支持的子图，边界处可能发生 device copy、layout transform、量化与反量化以及同步等待。即使 90% 节点被标记到 NPU，若剩余节点夹在每层中间，来回搬运仍会主导时延。评估时记录分区数量、每区输入输出字节和执行时间，并人工关闭 delegate 做对照；节点覆盖率只能作为线索，不能作为性能结论。'
        },
        {
          title: 'AOT 与 JIT 是部署责任的重新分配',
          body: 'AOT 在发布前完成 lowering、融合和目标代码生成，能缩小设备 runtime、减少启动抖动，却要求按芯片与形状管理产物；JIT 在现场适配更多动态情况，但带来编译时延、缓存与工具链依赖。固件或离线产品通常偏向 AOT，桌面应用可接受 JIT。无论哪种，都要把编译器版本、目标特性和生成配置纳入产物清单。'
        },
        {
          title: '先建立可解释的 CPU 正确性基线',
          body: '不要第一次运行就开启所有 offload。先在可移植 CPU 路径固定输入、预处理和采样，保存输出或数值容差；再一次只启用一个 backend，比较分区图、中间边界与端到端结果。若结果偏离，先检查 dtype、layout、动态 shape 和量化参数，再定位 kernel。这样能把“模型转换错”和“加速器实现错”分开，避免在黑盒性能数据里猜原因。'
        },
        {
          title: '框架选择应落到可维护的验收矩阵',
          body: '为候选框架列出目标 OS/芯片、模型架构、最大 context、量化格式、包体、冷启动、峰值内存、PP/TG、功耗、许可证和调试能力。再准备正常、边界与失败模型：含一个不支持算子、动态 shape 和低内存场景，观察报错与 fallback 是否可见。版本升级后重跑同一矩阵；能持续解释回归的第二名，常比一次基准领先却不可诊断的方案更适合产品。'
        }
      ],
      visual: {
        title: '模型图如何被切分到 CPU、GPU 与 NPU',
        description: '逐步播放器把抽象的“硬件加速”展开为能力查询、分区、lowering、跨边界搬运和回退证据。',
        steps: [
          {icon: '🧾', label: '读取图契约', data: 'ops + shape + dtype + layout + quant params', action: '验证模型版本与 I/O，并建立 CPU 可运行基线', insight: '格式可读不等于每个节点都有目标后端实现'},
          {icon: '🧩', label: '查询能力', data: 'backend capability table', action: '逐节点匹配算子、属性、shape 与精度限制', insight: '只看算子名称会漏掉属性和动态维度约束'},
          {icon: '✂️', label: '形成分区', data: 'CPU graph + delegated subgraphs', action: '合并连续支持节点并标记 fallback 岛', insight: '分区越碎，跨设备边界通常越昂贵'},
          {icon: '🏭', label: 'Lower 与编译', data: 'subgraph → backend blob/kernel plan', action: '做融合、布局选择、内存规划与目标代码生成', insight: 'AOT 把复杂度移到构建期，也增加产物版本责任'},
          {icon: '🔁', label: '执行边界', data: 'host buffer ⇄ device buffer', action: '复制或映射数据、同步并执行 delegate', insight: 'copy 与 layout transform 必须进入端到端 trace'},
          {icon: '🔬', label: '比较证据', data: 'output diff + partition log + latency + memory', action: '与 CPU 基线核对正确性，再判断收益', insight: '只有正确且边界成本可解释的 offload 才算成功'}
        ],
        loop: '若某分区收益为负，回到“形成分区”尝试扩大连续子图、消除布局转换或干脆让该段留在 CPU；若结果不一致，回到“读取图契约”逐边界比对。每次只改变一个 backend 或编译选项。'
      }
    },

    14: {
      readingMinutes: 17,
      history: {
        intro: '性能分析远早于机器学习。它从“局部加速受整体串行部分限制”，发展到“算力与带宽共同限定上限”，再进入在线系统的尾延迟与标准化基准。LLM 又带来 prefill、decode、流式响应和每 token 能耗等阶段性指标。历史反复说明：没有工作负载、测量条件和分解视角的单个数字，几乎不能指导工程决策。',
        milestones: [
          {
            year: '1967',
            title: 'Amdahl 定律提醒局部加速受整体比例限制',
            body: 'Amdahl 的工作指出，并行部分无论提速多少，未被加速的部分仍限制总收益。映射到端侧 AI：kernel 快一倍不代表请求快一倍，tokenize、copy、采样、网络与同步都可能成为新的串行主项。',
            source: {label: 'Amdahl 原始论文', url: 'https://doi.org/10.1145/1465482.1465560'}
          },
          {
            year: '2009',
            title: 'Roofline 用算术强度连接算力与带宽上限',
            body: 'Roofline 模型把可达性能放在峰值计算能力和内存带宽两条“屋顶”下观察。它让工程师先判断 workload 是计算受限还是带宽受限，再决定优化 MAC、缓存复用或数据布局；decode 读取大量权重与 KV 的问题尤其适合这一直觉。',
            source: {label: 'Roofline 原始论文', url: 'https://escholarship.org/uc/item/6vv2j84j'}
          },
          {
            year: '2013',
            title: '尾延迟成为交互式服务的核心指标',
            body: '《The Tail at Scale》说明平均值会隐藏少量但显著的慢请求，而大型交互系统必须关注延迟分布尾部。端侧 LLM 即使只有少量并发，也会受冷启动、热降频、队列和网络抖动影响，因此 p50 不能替代 p95。',
            source: {label: 'The Tail at Scale 原始论文', url: 'https://research.google/pubs/the-tail-at-scale/'}
          },
          {
            year: '2019',
            title: 'MLPerf Inference 推动可比较的推理基准',
            body: 'MLPerf Inference 将模型、场景、准确率约束和提交规则组合成基准套件，强调性能数字必须绑定工作负载与质量门槛。它提供的工程启示是：改变模型精度、输入或正确率目标后，吞吐数字就不再属于同一次公平比较。',
            source: {label: 'MLPerf Inference 官方文档', url: 'https://docs.mlcommons.org/inference/index_gh/'}
          },
          {
            year: '2023—至今',
            title: '生成式模型形成 TTFT、ITL 与吞吐的专门指标组',
            body: '生成服务将 prompt 处理与逐 token 生成拆开，分别报告首 token、输出 token 间隔、请求吞吐和输入输出长度。工具开始把这些指标与并发、分位数和端点协议共同记录，性能分析由单次命令计时转为可重放的请求实验。',
            source: {label: 'NVIDIA GenAI-Perf 官方指标文档', url: 'https://github.com/triton-inference-server/perf_analyzer/blob/main/genai-perf/README.md'}
          }
        ],
        bridge: '本章将这四代思想合并成一张证据链：先定义产品体验指标，再把端到端时间拆成阶段，用 Roofline 和计数器解释瓶颈，最后用分布、功耗与热状态验证优化没有转移问题。报告任何数字时都附带输入长度、输出长度、并发、量化、线程、供电与软件版本。'
      },
      analogy: {
        title: '把性能分析想成追查一趟总迟到的高铁',
        story: '乘客只感受到总行程，这就是端到端延迟；进站安检像预处理，等首班车像 TTFT，途中每站间隔像 inter-token latency。平均到站时间看似正常，但少数暴雨天的严重晚点就是 p95。只把列车最高时速提高，若检票、换轨或进站仍占大头，总时间几乎不变；车厢空调全开还会提高每位乘客的能耗并触发温度保护。真正的优化要拿时刻表、轨迹和电表对账。',
        illustration: [
          {icon: '🎫', label: '进站等待', mapsTo: '排队、tokenize、预处理和 context 分配'},
          {icon: '🚄', label: '首班发车', mapsTo: 'Prefill 完成并返回首 token，即 TTFT'},
          {icon: '🚉', label: '站间节奏', mapsTo: 'Decode 的 inter-token latency 与 tokens/s'},
          {icon: '🌡️', label: '暴雨限速', mapsTo: '尾延迟、功耗、温度和热降频造成的长尾'}
        ],
        boundary: '列车各段通常近似串行，而推理可能流水化、异步复制或将多个请求合批；单请求阶段之和也不直接等于高并发吞吐。类比用于提醒分段和长尾，不能取代 trace 时间戳、硬件计数器与排队模型。'
      },
      lesson: [
        {
          title: '先写实验契约，再启动计时器',
          body: '一次可比较基准至少固定模型与哈希、量化格式、runtime commit、线程和绑核、prompt token 数、输出上限、采样、并发、供电及散热。先 warm-up，再执行足够重复次数并保留原始样本。若两轮测试的输入长度或温度不同，p95 与 tokens/s 没有直接可比性。把这些字段保存为机器可读 manifest，可让固件或模型升级后自动复跑。'
        },
        {
          title: 'TTFT 与生成速度必须拆开诊断',
          body: 'TTFT 包含排队、模板化、tokenize、context 准备、prefill 和首轮采样；稳定 decode 则主要反映逐步读取权重与 KV、执行小批矩阵和采样输出。长 prompt 会显著拉高前者，长 context 与带宽压力会拖慢后者。应在相同请求上打单调时钟时间戳，并报告 prompt tokens/s、ITL 分布和 output tokens/s，而不是只给总耗时。'
        },
        {
          title: '用瓶颈假设驱动下一项观测',
          body: '看到 CPU 利用率低，不应直接断言“算力富余”：线程可能等待内存、锁、GPU 同步或网络背压。先由 trace 找最长阶段，再提出可证伪假设。若怀疑带宽，改变量化或 context 并观察速度与 bytes moved；若怀疑计算，改变核心数或频率；若怀疑 copy，记录分区边界。每次只改一个变量，让证据能区分相关性与因果。'
        },
        {
          title: '分位数、热状态和能耗共同决定稳定性',
          body: '短跑 benchmark 常发生在冷芯片与满电源预算下，产品却可能连续运行数小时。记录每次请求而非只留平均值，至少给出中位数与 p95，并同步采集频率、温度、功率和峰值内存。对流式体验还要看最长 token 间隔。若 tokens/s 提高但 joules/token、温升或尾延迟恶化，应回到产品场景判断，而不能自动宣称优化成功。'
        },
        {
          title: '把性能回归变成可二分的版本证据',
          body: '基准结果应绑定模型、数据、编译选项、runtime 和固件版本，并保存阶段 trace 摘要。设置有噪声容忍度的阈值，例如相对基线连续多轮退化才告警，避免把偶然抖动当回归。出现问题时先确认环境，再按版本二分；同时用固定正确性样本防止“关掉工作换速度”。最终报告要能指出退化发生在哪个阶段、伴随何种资源变化。'
        }
      ],
      visual: {
        title: '从一条慢请求收敛到可验证瓶颈',
        description: '动画不是播放漂亮曲线，而是演示性能工程的推理顺序：锁定条件、分段、提出假设、做单变量实验、再回归验证。',
        steps: [
          {icon: '📌', label: '冻结条件', data: 'model/config/prompt/device/power manifest', action: '校验版本与输入，完成 warm-up', insight: '没有实验契约，后续差异无法归因'},
          {icon: '⏱️', label: '端到端采样', data: 'request timestamps × repeated runs', action: '收集原始延迟、TTFT、ITL 与吞吐样本', insight: '保留分布才能看见尾部，而非只看平均'},
          {icon: '🧱', label: '阶段拆分', data: 'queue | preprocess | prefill | decode | network', action: '用同一单调时钟标记阶段边界', insight: '先找到时间花在哪里，再讨论为什么'},
          {icon: '🕵️', label: '提出假设', data: 'utilization + bandwidth + cache + thermal counters', action: '把最长阶段关联到一个可证伪瓶颈', insight: '低利用率可能意味着等待，不等于没有瓶颈'},
          {icon: '🎛️', label: '单变量实验', data: 'one change → effect size', action: '只改变线程、量化、context 或 copy 中的一项', insight: '方向符合预测且重复出现，假设才获得支持'},
          {icon: '✅', label: '回归验收', data: 'quality + p50/p95 + energy + memory', action: '在长稳运行和边界输入下复测', insight: '端到端、质量与能效同时过线才是产品优化'}
        ],
        loop: '若单变量结果不支持假设，就回到“提出假设”选择下一项计数器；若优化只转移瓶颈，就回到“阶段拆分”重新排序热点。最终把新基线写回 manifest，并保留原始样本供版本二分。'
      }
    },

    15: {
      readingMinutes: 20,
      history: {
        intro: '端侧 AI 整合看似新颖，核心却来自几十年的分布式与嵌入式系统经验：正确性要放在真正理解语义的端点，重计算可以卸载到近端资源，微控制器需要专门的内存与 runtime 设计，AI 风险必须覆盖整个生命周期。把这些脉络拼起来，才能形成“ESP32 守住物理边界、Edge Host 提供推理能力”的可靠架构。',
        milestones: [
          {
            year: '1984',
            title: '端到端原则明确关键正确性应由端点保证',
            body: 'Saltzer、Reed 与 Clark 论证，一些功能即使在通信子系统中实现，最终仍需由真正掌握应用语义的端点检查。映射到 AI 控制链：传输层能保证帧完整，却不能判断“开阀 90%”是否在当前设备状态下安全。',
            source: {label: 'End-to-End Arguments 原始论文', url: 'https://groups.csail.mit.edu/ana/Publications/PubPDFs/End-to-End%20Arguments%20in%20System%20Design.pdf'}
          },
          {
            year: '2009',
            title: 'Cloudlet 描绘近端资源主机的卸载模式',
            body: 'Cloudlet 工作提出让资源受限移动设备通过低时延局域链路使用附近、资源丰富的计算节点，避开远端 WAN 的抖动与故障。今天 ESP32 加 Linux Edge Host 的分工延续这一思想：实时 I/O 留在端点，重推理放到一跳可达主机。',
            source: {label: 'Cloudlet 原始论文', url: 'https://elijah.cs.cmu.edu/DOCS/satya-ieeepvc-cloudlets-2009.pdf'}
          },
          {
            year: '2020',
            title: 'TinyML Runtime 让微控制器成为模型执行端',
            body: 'TensorFlow Lite Micro 的设计针对小内存、有限依赖和多类 MCU，展示模型解释器、静态内存规划与平台 kernel 如何进入固件。模型从云 API 变为设备模块，也让传感器前处理、arena、任务调度和确定性降级进入同一验收范围。',
            source: {label: 'TensorFlow Lite Micro 原始论文', url: 'https://arxiv.org/abs/2010.08678'}
          },
          {
            year: '2023',
            title: 'NIST AI RMF 将 AI 风险纳入全生命周期管理',
            body: 'AI RMF 1.0 用 Govern、Map、Measure、Manage 组织风险管理，强调系统情境、测量与持续治理。对端侧产品而言，准确率只是证据之一；权限、隐私、韧性、监控、供应链和退役路径也必须在设计与验收阶段有负责人。',
            source: {label: 'NIST AI RMF 1.0 官方发布', url: 'https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10'}
          },
          {
            year: '至今',
            title: '安全启动、签名 OTA 与回滚成为现场闭环',
            body: 'ESP-IDF 的 OTA 状态与回滚机制允许新镜像首启自检后再标记有效，并可结合 Secure Boot 与 anti-rollback。模型、固件和配置都在变化时，发布链必须拥有签名、兼容矩阵、健康检查和可恢复版本，而不是只传一个新文件。',
            source: {label: 'ESP-IDF OTA 官方文档', url: 'https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/ota.html'}
          }
        ],
        bridge: '这些里程碑共同给出终章架构：生成模型只提供概率性建议，端点状态机拥有最终权限；重计算可以在近端主机完成，但超时与断连必须降级；所有模型、协议和固件版本都要可度量、可追溯、可回滚。最终交付物不只是 demo，而是一套需求、接口、证据与故障恢复闭环。'
      },
      analogy: {
        title: '把整套端侧 AI 想成机场塔台与飞机的协作',
        story: 'Edge Host 上的 LLM 像塔台顾问：看得广、算得多，可以把自然语言意图整理成结构化航路建议；ESP32 像飞机上的飞控，直接读取传感器并掌握执行器。塔台发来的“下降到某高度”必须带航班号、序号和参数，飞控仍会检查高度包线、油量与当前模式。通信中断时，飞机不会失去基本控制，而会进入预先验证的本地程序。更新新模型或固件，则像更换航图：签名、版本兼容和回滚缺一不可。',
        illustration: [
          {icon: '🗼', label: '塔台顾问', mapsTo: 'Edge Host 上的 LLM、检索与重计算服务'},
          {icon: '✈️', label: '机载飞控', mapsTo: 'ESP32 传感器、状态机、白名单与执行器互锁'},
          {icon: '📻', label: '标准通话', mapsTo: '带版本、序号、校验、超时和幂等语义的消息协议'},
          {icon: '🗺️', label: '签名航图', mapsTo: '模型、配置、固件的版本化 OTA 与可回滚发布'}
        ],
        boundary: '真实航空系统有严格认证与确定性程序，而 LLM 本身无法达到飞控安全等级；类比绝不意味着模型可以参与硬实时闭环。它只说明职责分离与最终授权位置。任何可能伤人、损坏设备或违反法规的动作，都应由经过验证的确定性逻辑和必要的人类审批控制。'
      },
      lesson: [
        {
          title: '从验收指标反推系统边界',
          body: '先写产品必须满足的事件、端到端时延、离线时长、误报漏报、安全状态、功耗和成本，再决定模型放在 MCU、Edge Host 或云。若断网后仍须毫秒级停机，判断与执行就不能依赖主机 LLM；若任务需要大上下文，可把解释放主机，但设备保留阈值规则。每项需求都映射到一个责任组件和可测信号，避免架构图只有箭头没有承诺。'
        },
        {
          title: '把 Host 消息定义为提案而非指令',
          body: '消息应使用有版本的结构化 schema，包含 device_id、request_id、sequence、deadline、action、typed params 和认证信息。ESP32 收到后验证来源、版本、去重、时效、动作白名单、参数范围与当前状态，全部通过才转成内部事件。自然语言永远不直接驱动 GPIO。对重复帧、乱序、重放、半包和未知字段做协议测试，并让拒绝原因可审计。'
        },
        {
          title: '正常路径与降级路径必须共享状态机',
          body: '为在线、主机慢、链路断、模型失败、传感器异常和执行器故障定义显式状态与转换；不要在异常回调里临时拼补动作。超时后取消主机请求并丢弃迟到回复，设备切回本地阈值或安全保持模式；重连需重新握手和同步序号。通过断网、重启、包丢失、Host 满载与 watchdog 复位做故障注入，确认每条路径都能回到已知状态。'
        },
        {
          title: '模型、固件、协议和配置作为一组发布',
          body: '模型更新可能改变 tokenizer、模板、输出 schema 与资源需求，因此不能脱离固件兼容矩阵单独替换。发布清单应记录四类版本、哈希、最低硬件、内存预算、迁移步骤与回滚目标；下载后先验签，新槽首次启动运行自检，观测期通过才标记有效。灰度阶段同时监控拒绝率、TTFT、崩溃和设备安全事件，异常时可恢复上一组已知组合。'
        },
        {
          title: '用端到端追踪完成可交付证据闭环',
          body: '让 ESP32 事件、协议帧、Host 请求、模型版本、tool proposal 与最终执行共享 correlation_id，并使用各自单调时钟记录阶段时间。验收报告包含功能样本、性能分布、能耗、离线与越权测试、OTA 回滚和长期稳定性；日志需去除敏感原文并设置保留策略。最终应能从一次异常执行追到原始传感器证据、所有策略判断和发布版本。'
        }
      ],
      visual: {
        title: '从传感器事件到安全动作的端到端闭环',
        description: '动画同时展示上行数据、主机推理、下行提案与设备端授权；最后一步把结果反馈为下一轮可观测状态。',
        steps: [
          {icon: '🌡️', label: '采集成帧', data: 'sensor + timestamp + device state + sequence', action: 'ESP32 校准、范围检查并编码版本化消息', insight: '原始现实先经过确定性契约，不能直接拼进 prompt'},
          {icon: '📤', label: '可靠上行', data: 'authenticated frame + correlation_id', action: '校验、去重、超时重试并送达 Edge Host', insight: '传输可靠性不等于业务语义正确'},
          {icon: '🧠', label: '主机推理', data: 'structured context → model/tool proposal', action: '执行预处理、runtime 推理与 schema 约束', insight: '模型输出是带不确定性的候选，不拥有执行权'},
          {icon: '📥', label: '提案下行', data: 'action + typed params + deadline + request_id', action: '签名或认证后返回设备，并关联原请求', insight: '迟到、重复或无法关联的回复必须拒绝'},
          {icon: '🛡️', label: '本地授权', data: 'proposal + live state + safety policy', action: 'ESP32 检查白名单、范围、互锁与幂等条件', insight: '最终安全判断放在最理解物理状态的端点'},
          {icon: '⚙️', label: '执行与回证', data: 'actuator result + status + trace', action: '执行确定性动作、记录结果并上报健康状态', insight: '闭环证据用于监控、回归和下一轮决策'}
        ],
        loop: '执行结果与新传感器状态回到“采集成帧”，形成可观测闭环；若任何阶段超时或校验失败，则不继续向右，而是进入设备本地的安全降级状态，并记录同一 correlation_id 下的拒绝原因。'
      }
    }
  });
})();
