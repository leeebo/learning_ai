(() => {
  Object.assign(globalThis.chapterEnrichment ||= {}, {
    6: {
      readingMinutes: 19,
      history: {
        intro: '把小模型放进 MCU，并不是把桌面推理代码缩小后复制过去。它经历了“结构更省算力—kernel 更贴硬件—runtime 更少依赖—产品验证更可重复”的共同演进，最终才形成今天从数据到固件的闭环。',
        milestones: [
          {
            year: '1989',
            title: '结构化卷积网络走向真实任务',
            body: 'LeCun 等人把局部连接、权重共享与反向传播用于邮政编码识别，说明可以让网络直接处理像素，同时用结构约束压低参数与计算需求。',
            source: {label: 'LeCun 等原始论文', url: 'https://doi.org/10.1162/neco.1989.1.4.541'},
          },
          {
            year: '2017',
            title: 'MobileNet 把硬件预算写进网络设计',
            body: 'MobileNet 以深度可分离卷积和宽度、分辨率系数显式交换准确率与延迟，“先定设备预算再选模型”由经验做法变成可调设计方法。',
            source: {label: 'MobileNet 原始论文', url: 'https://arxiv.org/abs/1704.04861'},
          },
          {
            year: '2017',
            title: '生产级 ML 开始强调系统测试',
            body: 'Google 的 ML Test Score 将数据、特征、模型、基础设施与监控拆成具体测试项，指出离线指标只是上线准备度的一部分。',
            source: {label: 'Google Research 原始论文', url: 'https://research.google/pubs/the-ml-test-score-a-rubric-for-ml-production-readiness-and-technical-debt-reduction/'},
          },
          {
            year: '2018',
            title: 'CMSIS-NN 让量化模型贴近 Cortex-M',
            body: 'CMSIS-NN 提供面向 Cortex-M 的卷积、全连接等优化 kernel，并用部分 im2col 等办法同时降低运行时间和峰值内存。',
            source: {label: 'CMSIS-NN 原始论文', url: 'https://arxiv.org/abs/1801.06601'},
          },
          {
            year: '2020',
            title: 'TFLite Micro 固化微控制器运行时范式',
            body: 'TFLite Micro 面向没有虚拟内存、资源紧张且平台碎片化的设备，采用小型解释器和预规划工作区，让同一模型能进入多种 MCU。',
            source: {label: 'TFLite Micro 原始论文', url: 'https://arxiv.org/abs/2010.08678'},
          },
          {
            year: '现在',
            title: 'ESP-DL 串起量化、格式、内存规划与分析',
            body: '当前 ESP-DL 用 ESP-PPQ、.espdl 格式、静态内存规划和设备侧 profiling 把模型转换、加载、执行与测量放进同一工具链。',
            source: {label: 'ESP-DL 官方介绍', url: 'https://docs.espressif.com/projects/esp-dl/en/latest/introduction/readme.html'},
          },
        ],
        bridge: '这条脉络留下的工程结论很明确：模型结构只决定“可能跑多快”，前处理契约、量化导出、kernel 覆盖、任务调度和板端回归测试才决定它是否真的成为产品功能。',
      },
      analogy: {
        title: '一座把鲜果变成果汁的微型工厂',
        story: '果园每天送来的果子并不整齐：大小、成熟度、泥点都不同。实验室先制定验收样本和清洗配方，再训练“质检员”；量产线必须照同一配方切块、称重，质检结果还要经过阈值与复核，才会真正打开装瓶阀门。',
        illustration: [
          {icon: '🧺', label: '果筐与留样', mapsTo: '真实设备采集、标签规范、训练/验证/测试切分'},
          {icon: '🚿', label: '清洗切块配方', mapsTo: '采样、resize、归一化、量化输入等前处理契约'},
          {icon: '🔬', label: '微型质检员', mapsTo: '量化后的模型、设备 kernel 与 tensor arena'},
          {icon: '🚦', label: '装瓶放行灯', mapsTo: '阈值、去抖、fallback 与业务事件'},
        ],
        boundary: '类比能解释闭环和契约，却不能把模型当成固定规则质检机：它输出的是依赖数据分布的概率或分数。现场出现训练集未覆盖的新工况时，配方完全一致也不保证判断正确，仍需漂移监控、拒识与安全状态机。',
      },
      lesson: [
        {
          title: '从产品事件反推数据，而不是从现成数据集寻找用途',
          body: '先写出设备最终要发布的事件、允许的漏报和误报、响应时限以及无法判断时的动作，再据此定义采样窗口和标签。训练集要按设备或采集批次切分，避免同一段连续信号泄漏到训练与测试两侧；负类不能只有“安静背景”，还要包含容易混淆的动作、噪声和传感器异常。每条样本应保留固件版本、采样率与环境元数据，才能在回归时定位数据漂移。',
        },
        {
          title: '把前处理做成可校验的二进制契约',
          body: 'PC 训练管线与固件必须对采样率、通道顺序、裁剪窗口、插值方式、颜色空间、归一化常数、舍入和饱和规则逐项一致。不要只比较最终类别；选若干黄金样本，在原始 buffer、预处理浮点张量、量化整数张量三个边界计算摘要并抽查元素。若部署工具要求 int8 输入，还要确认 scale 与 zero-point 的方向，避免把已经量化的数据再次量化。',
        },
        {
          title: '把导出和转换看作编译链，而不是文件另存为',
          body: '训练 checkpoint 先切换推理语义，再导出含固定 I/O 契约的图；转换器随后折叠常量、替换算子、量化并生成目标格式。每一阶段都可能改变布局或数值，因此要锁定工具版本，保存算子清单、输入输出名称和量化参数，并用同一批输入做逐阶段差分。转换成功只证明文件可生成；目标 runtime 没有对应 kernel、发生浮点 fallback 或 shape 超界时仍会失败。',
        },
        {
          title: '让推理成为受调度约束的固件任务',
          body: '设备端需要同时安排传感器生产者、DMA、预处理、推理和事件消费者。采用有界队列并明确满队列策略：实时任务通常丢旧帧比无限等待更合理；推理期间若占用长时间 CPU，应分片、降低频率或喂狗，但不能用喂狗掩盖死锁。arena、模型和 I/O buffer 尽量在初始化期分配，稳态路径避免碎片化；错误分支必须归还帧并发布可观察的降级状态。',
        },
        {
          title: '用四层证据完成部署验收',
          body: '验收依次比较源框架、导出模型、目标 runtime 和真实板端，既测固定黄金向量，也回放整段原始采集。结果至少包含混淆矩阵、按类别阈值曲线、p50/p95 延迟、峰值 arena、长时间运行与异常输入。业务层还要验证迟滞、连续命中次数和冷却时间，避免分数在阈值附近抖动成事件风暴。升级模型或 SDK 后重跑同一清单，才能区分精度回归与系统回归。',
        },
      ],
      visual: {
        title: '一条样本如何变成设备事件',
        description: '播放器逐步点亮数据形态和责任边界，并在最后把现场失败样本送回数据集。',
        steps: [
          {icon: '🎙️', label: '采集与标注', data: 'raw window + label + metadata', action: '按设备与场景记录原始样本，冻结标签规则', insight: '数据来源决定模型能识别的世界'},
          {icon: '🧽', label: '等价前处理', data: 'tensor[shape, dtype, range]', action: '在 PC 与固件执行同一裁剪、缩放和量化规则', insight: '输入契约比 API 名称更重要'},
          {icon: '🧠', label: '训练与导出', data: 'checkpoint → graph → quantized model', action: '固定推理态并逐阶段比较输出', insight: '每次转换都是潜在语义边界'},
          {icon: '📟', label: '板端执行', data: 'arena + kernels + latency', action: '加载模型、调度 kernel 并记录内存和阶段耗时', insight: '能加载不等于稳态能运行'},
          {icon: '🚨', label: '事件决策', data: 'score → threshold → state', action: '应用迟滞、去抖和 fallback 后再驱动物理动作', insight: '模型分数不是最终控制命令'},
          {icon: '🔁', label: '现场回流', data: 'false positive / false negative', action: '保存误报漏报及其原始上下文，进入下一轮数据审查', insight: '闭环让部署从演示变成可维护系统'},
        ],
        loop: '现场回流的样本经过人工复核后重新进入“采集与标注”，但旧测试集保持冻结，用来判断新版本是否真的改善。',
      },
    },

    7: {
      readingMinutes: 18,
      history: {
        intro: '端侧性能史反复证明：乘加单元只是厨房里的炉灶，数据怎样到达炉灶、在哪里暂存、是否反复搬运，往往更决定吞吐与能耗。MCU/NPU 工程因此从“数 FLOPs”走向“联合规划计算与数据流”。',
        milestones: [
          {
            year: '1982',
            title: '脉动阵列让数据在计算单元间流动',
            body: 'H. T. Kung 系统阐述脉动架构：规则排列的处理单元按节拍复用并传递数据，为后来矩阵加速器的数据流设计奠定重要基础。',
            source: {label: 'Why Systolic Architectures 原始论文', url: 'https://doi.org/10.1109/MC.1982.1653825'},
          },
          {
            year: '2009',
            title: 'Roofline 把算力上限与带宽上限画在一起',
            body: 'Roofline 用运算强度连接峰值计算和可持续内存带宽，使“该优化算术还是减少搬运”成为可以测量和讨论的问题。',
            source: {label: 'UC Berkeley Roofline 原始报告', url: 'https://www2.eecs.berkeley.edu/Pubs/TechRpts/2008/EECS-2008-134.pdf'},
          },
          {
            year: '2016',
            title: 'Eyeriss 量化了数据移动的能耗代价',
            body: 'Eyeriss 提出 row-stationary 数据流，利用局部存储和处理单元间通信复用权重、激活与部分和，强调少搬数据本身就是加速。',
            source: {label: 'Eyeriss 原始论文页面', url: 'https://research.nvidia.com/publication/2016-06_eyeriss-spatial-architecture-energy-efficient-dataflow-convolutional-neural'},
          },
          {
            year: '2018',
            title: 'MCU kernel 同时优化时间和工作区',
            body: 'CMSIS-NN 展示 SIMD、定点计算与部分 im2col 如何在 Cortex-M 上提高吞吐并降低内存占用，说明 kernel 选择会改变峰值工作集。',
            source: {label: 'CMSIS-NN 原始论文', url: 'https://arxiv.org/abs/1801.06601'},
          },
          {
            year: '2020',
            title: 'MCUNet 把网络与推理引擎协同设计',
            body: 'MCUNet 用 TinyNAS 在设备约束内搜索网络，并让 TinyEngine 按整图生命周期调度内存，推动模型、runtime 和硬件联合优化。',
            source: {label: 'MCUNet 原始论文', url: 'https://arxiv.org/abs/2007.10319'},
          },
          {
            year: '现在',
            title: '内存能力与一致性成为显式 API',
            body: 'ESP-IDF 通过 capability allocator 区分 DMA、字节访问等内存属性；在带 cache 与 DMA 的芯片上，还必须显式处理同步和所有权。',
            source: {label: 'ESP-IDF 官方内存分配文档', url: 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/system/mem_alloc.html'},
          },
        ],
        bridge: '今天的资源分析应同时回答四个问题：哪些 buffer 同时活跃、每个字节跨过几次总线、每段子图由谁执行、测到的瓶颈是否随输入和温度变化。只报参数量或峰值 TOPS 会漏掉最昂贵的路径。',
      },
      analogy: {
        title: '晚餐高峰期的一间小餐馆',
        story: '冷库里食材很多，不代表厨房能同时做很多桌菜。切配台面积决定多少盘子能同时摊开，狭窄过道决定服务员搬菜的速度，专用烤炉虽然很快，却只接收合适的烤盘；每次把菜改盘、送进送出都会消耗时间。',
        illustration: [
          {icon: '🧊', label: '外部冷库', mapsTo: 'Flash/PSRAM 中容量大但访问代价更高的权重和数据'},
          {icon: '🔪', label: '切配台', mapsTo: '内部 SRAM 中同时活跃的输入、输出与 workspace'},
          {icon: '🛎️', label: '传菜过道', mapsTo: '内存总线、DMA、cache line 与持续带宽'},
          {icon: '🔥', label: '专用烤炉', mapsTo: '只支持部分算子、布局与 dtype 的 NPU delegate'},
        ],
        boundary: '餐馆类比适合解释容量、吞吐和换盘成本，但真实存储层次并非互斥房间：cache 会自动替换，DMA 与 CPU 还可能并发访问同一物理内存。是否需要 flush、invalidate 或对齐，必须以芯片手册和实测为准。',
      },
      lesson: [
        {
          title: '峰值内存来自生命周期重叠，不是文件大小相加',
          body: '为计算图列出每个 tensor 的产生节点、最后一次消费、大小和内存能力，画出活跃区间后才能求峰值。权重常可留在映射 Flash，激活、累加器和 kernel workspace 却可能在同一层同时存在；相机双缓冲、任务栈和网络包也要纳入系统峰值。规划器能复用生命周期不重叠的区域，但动态 shape、分支与 fallback 会改变计划，必须用运行时 high-water mark 校验静态估算。',
        },
        {
          title: '用运算强度判断等待的是乘加器还是内存',
          body: '粗算每个算子执行的 MAC 与从慢层级搬运的字节，得到“每字节做多少运算”的直觉；低运算强度路径更可能受带宽约束。提高主频或增加 NPU 单元只有在计算受限时才直接见效，带宽受限时应优先融合算子、分块复用、避免中间张量落地和改变布局。理论带宽是上限，连续读写、cache miss、总线争用与刷新协议决定可持续值，所以必须用接近真实访问模式的基准测量。',
        },
        {
          title: '零拷贝是一份所有权协议，不是一处指针转换',
          body: '让相机 DMA 写入模型输入可省一次复制，但前提是 buffer 的地址能力、对齐、stride、cache 一致性和生命周期都满足双方要求。CPU 在 DMA 完成前不能读取，DMA 复用前推理也必须释放；带 cache 的系统还需在正确方向做同步。建议用明确状态机标记 FREE、FILLING、READY、IN_USE，并把超时与丢帧计数写入日志。没有这些约束的“零拷贝”常变成偶发撕裂或陈旧数据。',
        },
        {
          title: 'NPU 加速要看整个分区边界的净收益',
          body: 'delegate 会按算子、shape、dtype 和布局能力切分子图。若只有中间几层被接管，CPU→NPU 的量化、layout transform、buffer copy 与同步可能吞掉 kernel 节省的时间；不支持节点还可能静默 fallback。检查运行时分区日志，分别计时加速子图和边界转换，并与纯 CPU 基线比较。选择模型时宁可让较小网络完整落入 NPU，也不要只依据宣称 TOPS 选择产生碎片化分区的大网络。',
        },
        {
          title: '以稳态曲线而不是单次最快值验收资源方案',
          body: '在固定输入、频率和编译选项下预热，再记录各阶段周期、总线或 cache 计数、峰值堆和功耗；逐步改变分辨率与采样率，画出延迟和内存曲线。连续运行要覆盖 Wi‑Fi、摄像头与 OTA 等竞争负载，并观察热降频和尾延迟。优化前后若输出发生变化，应先做数值一致性检查。最终预算要留出碎片、异常日志和固件升级余量，而不是把实验室空闲内存全部承诺给模型。',
        },
      ],
      visual: {
        title: '一块激活张量的资源旅行',
        description: '每一步显示张量所在层级、发生的搬运和此刻真正限制吞吐的资源。',
        steps: [
          {icon: '🗄️', label: '取得权重', data: 'Flash/PSRAM → cache', action: '按 tile 读取本轮需要的权重', insight: '容量够用仍可能被慢层级带宽限制'},
          {icon: '📥', label: '接收输入', data: 'DMA buffer → SRAM', action: '确认对齐、所有权并同步 cache', insight: '零拷贝先是一份一致性契约'},
          {icon: '🧩', label: '规划活跃区', data: 'input + output + workspace', action: '根据生命周期复用不重叠区域', insight: '峰值由同一时刻的工作集决定'},
          {icon: '⚙️', label: '执行 kernel', data: 'tile × weights → partial sums', action: '在寄存器和局部存储中尽量复用数据', insight: '少搬一次可能比多做几次 MAC 更划算'},
          {icon: '🚧', label: '跨后端边界', data: 'CPU layout ↔ NPU layout', action: '转换 dtype/布局并同步子图', insight: 'delegate 边界有可见的通行费'},
          {icon: '📈', label: '测量并重排', data: 'cycles + bytes + peak RAM', action: '用实测瓶颈选择融合、分块或降分辨率', insight: '优化对象应由证据而不是 TOPS 决定'},
        ],
        loop: '测量结果返回内存规划：若带宽占主导就减少搬运，若工作集溢出就缩小 tile 或输入，若计算饱和才替换更快 kernel。',
      },
    },

    8: {
      readingMinutes: 20,
      history: {
        intro: '端侧视觉从“整张图属于哪一类”发展到“哪里有什么、轮廓在哪里、连续帧中是否仍是同一目标”。算法进步之外，相机格式、几何变换和实时后处理逐渐成为与网络同等重要的系统组成。',
        milestones: [
          {
            year: '1989',
            title: '卷积网络从像素学习局部模式',
            body: '早期邮政编码识别展示了局部感受野与共享权重如何处理图像平移结构，为后来端到端视觉模型建立基本范式。',
            source: {label: 'LeCun 等原始论文', url: 'https://doi.org/10.1162/neco.1989.1.4.541'},
          },
          {
            year: '2012',
            title: '深层 CNN 与 GPU 训练扩大视觉能力',
            body: 'AlexNet 在 ImageNet 上以深层卷积网络展示显著效果，推动视觉主干快速加深，也让部署侧开始面对更大的算力与内存压力。',
            source: {label: 'AlexNet 原始论文', url: 'https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks'},
          },
          {
            year: '2015',
            title: 'YOLO 将检测统一为一次网络前向',
            body: 'YOLO 直接从整图预测边界框和类别概率，把检测从多阶段候选流程推向单阶段实时管线，突出端到端延迟的重要性。',
            source: {label: 'YOLO 原始论文', url: 'https://arxiv.org/abs/1506.02640'},
          },
          {
            year: '2017',
            title: 'MobileNet 面向移动与嵌入式视觉',
            body: '深度可分离卷积显著降低常规卷积的计算量，宽度和分辨率系数又让同一模型家族覆盖不同设备预算。',
            source: {label: 'MobileNet 原始论文', url: 'https://arxiv.org/abs/1704.04861'},
          },
          {
            year: '现在',
            title: '视觉模型被封装进完整设备流水线',
            body: 'ESP-WHO 等官方工程把摄像头驱动、图像处理、推理模型和示例应用组合起来，部署关注点从单个网络扩展到端到端链路。',
            source: {label: 'ESP-WHO 官方仓库', url: 'https://github.com/espressif/esp-who'},
          },
        ],
        bridge: '当前工程不应只问模型 mAP 或 FPS，而要追踪一帧从曝光、DMA、颜色转换到坐标回映射和事件发布的全部变换。任何一步丢失 stride、比例或 buffer 所有权，都会让一个正确模型稳定地产生错误结果。',
      },
      analogy: {
        title: '一场多机位体育直播',
        story: '摄像机先送来带行距和色彩制式的原始画面，导播裁出比赛区域并缩放到分析屏；解说员在屏上圈出候选球员，导播去掉重复圈选、跨帧确认身份，最后才播出“进球”事件。任何裁切比例没有记账，圈都会回到错误位置。',
        illustration: [
          {icon: '🎥', label: '摄像机信号', mapsTo: '曝光、像素格式、stride、DMA frame buffer'},
          {icon: '🖼️', label: '导播裁屏', mapsTo: 'ROI、颜色转换、resize、letterbox 与归一化'},
          {icon: '⭕', label: '画面圈选', mapsTo: '分类分数、检测候选框或分割 mask'},
          {icon: '📣', label: '赛事播报', mapsTo: 'NMS、跟踪、时序平滑与业务事件'},
        ],
        boundary: '直播类比能解释几何和时序，却不能代表视觉模型真的“理解比赛”。框、类别和 mask 都是统计输出；遮挡、逆光、镜头污渍或分布外物体会破坏判断，关键动作仍需置信门控、传感器交叉验证或人工复核。',
      },
      lesson: [
        {
          title: '先按业务需要选择输出粒度',
          body: '只需判断“画面中是否有火焰”且目标占据稳定 ROI，可从分类开始；需要位置与数量才使用检测；需要像素级面积、边缘或可通行区域才考虑分割。输出越细，标签成本、后处理和内存通常越高。还要写明最小目标像素、允许遮挡和相机距离，因为输入分辨率决定信息上限。用业务事件回放比较候选方案，而不是拿不同数据集上的单一指标横向排名。',
        },
        {
          title: '把 frame buffer 当成带描述符的二维存储',
          body: '一帧不只有 width×height：还包含 RGB565、YUV 或 JPEG 等格式、每行 stride、平面排列、对齐和有效区域。JPEG 必须先解码，YUV 转 RGB 时要确认矩阵与范围；直接把有 padding 的行当连续像素会产生斜纹。相机驱动交出的 buffer 通常由池管理，推理完成前不得归还或覆盖。先用彩条、棋盘格和像素探针验证读取路径，再让模型介入，可快速隔离格式错误。',
        },
        {
          title: '为每次几何变换保留可逆账本',
          body: '预处理应记录原图尺寸、ROI 原点、缩放比例、填充宽度和模型输入尺寸。拉伸 resize 会改变物体形状；letterbox 保持比例却引入边缘填充，两者必须与训练配置一致。检测框或分割 mask 回到原图时，按变换逆序先去 padding、再除比例、再加 ROI 偏移，并裁剪到有效边界。用四角标记和已知矩形做单元测试，比肉眼看几个框更能发现半像素与取整偏差。',
        },
        {
          title: '后处理把稠密预测变成稳定事件',
          body: '检测头输出的通常是大量候选，需要按模型定义解码中心、尺寸和类别，再做置信过滤与 NMS；阈值过早会漏目标，过晚则浪费时间。NMS 的 IoU 与类别策略应通过目标尺寸和遮挡场景校准。连续帧中可用轻量跟踪、连续命中和丢失容忍抑制闪烁，但时序平滑会增加响应延迟。业务事件应携带时间戳、置信度与追踪 ID，不能只留一张最终截图。',
        },
        {
          title: '以分阶段回放验证实时流水线',
          body: '保存一组可合法分享的原始帧，并为每帧留存模型输入、raw output、NMS 结果和回映射结果作为黄金记录。板端逐阶段计算摘要，与 PC 实现比较；同时记录采集、预处理、推理、后处理和排队耗时。压力测试要改变曝光、帧率和消费者速度，确认队列满时丢哪一帧、buffer 是否总能归还。最终 FPS 取决于最慢阶段和流水并发，并不等于模型单次推理的倒数。',
        },
      ],
      visual: {
        title: '一帧图像到一个可信事件',
        description: '播放器保留每次像素与坐标变换，直观看见候选如何被筛选并跨帧稳定。',
        steps: [
          {icon: '📷', label: 'DMA 采帧', data: 'YUV/RGB/JPEG + stride + timestamp', action: '相机填充池中 buffer 并移交所有权', insight: '一帧必须携带格式描述符'},
          {icon: '✂️', label: '裁剪与缩放', data: 'ROI → letterbox tensor', action: '执行颜色转换、resize、padding 和归一化', insight: '同时保存比例、偏移与填充账本'},
          {icon: '🧠', label: '模型前向', data: 'tensor → logits/boxes/mask', action: '在目标 runtime 运行并保留 raw output 摘要', insight: '模型尚未输出业务事件'},
          {icon: '🧹', label: '解码与去重', data: 'candidates → threshold → NMS', action: '按模型头定义解码并合并重叠候选', insight: '后处理参数会改变精度和耗时'},
          {icon: '🧭', label: '坐标回映射', data: 'model xy → source xy', action: '逆序撤销 padding、缩放和 ROI 偏移', insight: '变换账本决定框能否落回原物体'},
          {icon: '🎯', label: '跨帧成事件', data: 'track id + confidence + time', action: '时序平滑后发布事件并归还 frame buffer', insight: '稳定性、延迟和资源释放同时闭环'},
        ],
        loop: '下一帧回到 DMA 采帧；跟踪状态跨帧保留，而像素 buffer 在发布结果后立即归还相机池，二者生命周期不可混淆。',
      },
    },

    9: {
      readingMinutes: 17,
      history: {
        intro: 'Tokenizer 的演进是一段在“词表有限、任何文本都要可编码、序列不能太长”之间寻找平衡的历史。它从通用压缩中的重复片段替换，逐步变成语言模型输入协议，并进一步承担对话角色与工具消息的 framing。',
        milestones: [
          {
            year: '1994',
            title: 'BPE 从反复替换高频字节对开始',
            body: 'Philip Gage 描述的 Byte Pair Encoding 反复以新符号替换最高频相邻字节对，原本目标是用简单替换表压缩数据。',
            source: {label: 'BPE 原始论文', url: 'https://www.derczynski.com/papers/archive/BPE_Gage.pdf'},
          },
          {
            year: '2015',
            title: 'BPE 被改造成神经翻译的子词算法',
            body: 'Sennrich 等人用子词序列表示稀有词和未登录词，让固定词表不再把所有未知形式压成同一个 UNK。',
            source: {label: 'Subword NMT 原始论文', url: 'https://arxiv.org/abs/1508.07909'},
          },
          {
            year: '2016',
            title: 'WordPiece 进入大规模翻译系统',
            body: 'GNMT 将词切成有限的 common sub-word units，在受控词表规模下覆盖开放文本，子词分词成为神经语言系统的关键部件。',
            source: {label: 'GNMT 原始论文', url: 'https://arxiv.org/abs/1609.08144'},
          },
          {
            year: '2018',
            title: 'SentencePiece 直接从原始句子训练',
            body: 'SentencePiece 不要求先按空格切词，并提供语言无关的 tokenizer/detokenizer，使无空格语言和跨语言流程更一致。',
            source: {label: 'SentencePiece 原始论文', url: 'https://aclanthology.org/D18-2012/'},
          },
          {
            year: '2019',
            title: 'GPT-2 采用字节级 BPE 覆盖任意文本',
            body: 'GPT-2 报告使用 byte-level BPE，在字节覆盖与可复用子词之间折中，减少传统词级词表面对异常字符的盲区。',
            source: {label: 'GPT-2 原始技术报告', url: 'https://cdn.openai.com/better-language-models/language-models.pdf'},
          },
          {
            year: '2023–现在',
            title: 'Chat template 把消息结构纳入 tokenizer 契约',
            body: '现代聊天模型把 role/content 渲染为带控制 token 的单一序列；模板随 tokenizer 保存，应用不再适合手工猜测分隔符。',
            source: {label: 'Hugging Face 官方 Chat Template 文档', url: 'https://huggingface.co/docs/transformers/chat_templating'},
          },
        ],
        bridge: '因此，tokenizer 不是可随意替换的文本工具，而是模型 ABI 的一部分。词表、merge/rank、规范化、特殊 token 和模板中的一个字节发生变化，都可能改变后续全部 token id、位置与 KV cache。',
      },
      analogy: {
        title: '跨国车站的检票与编组系统',
        story: '旅客说着不同语言、带着 emoji 和代码片段来到车站。检票处先按统一规则核验证件，再把常见同行片段编成短车厢编号；站长插入“列车开始、乘客发言、列车结束”等控制车厢，模型只看到最终编号序列。',
        illustration: [
          {icon: '🪪', label: '证件核验', mapsTo: 'Unicode 处理、规范化与原始字节边界'},
          {icon: '🧩', label: '车厢编组', mapsTo: 'BPE merge、WordPiece 或 SentencePiece 子词切分'},
          {icon: '🎫', label: '编号车票', mapsTo: 'vocabulary 中稳定的 token id'},
          {icon: '🚉', label: '站长控制车厢', mapsTo: 'BOS/EOS、角色 token 与 chat template'},
        ],
        boundary: '类比容易让人误以为一个 token 就对应一个可读词；实际 token 可能是词、空格前缀、若干 UTF‑8 字节甚至跨字符片段。编号也没有跨 tokenizer 的通用含义，拆分结果更不直接代表模型对概念的理解程度。',
      },
      lesson: [
        {
          title: '从字符串追到字节，先固定规范化语义',
          body: '视觉上相同的文本可能由不同 Unicode 码点序列组成，例如预组合字符与组合附加符；全角、换行和不可见控制字符也会改变 token。不要在应用、模板和 tokenizer 三处分别做清洗，否则训练与推理难以对齐。明确输入采用哪种规范化、是否保留空白与大小写，并用十六进制码点记录边界样本。字节级 tokenizer 虽能覆盖任意输入，也不意味着损坏的 UTF‑8 或替换字符可以被悄悄接受。',
        },
        {
          title: '理解子词算法在词表与序列长度间的交换',
          body: 'BPE 从基础符号出发，按学习到的 rank 反复合并相邻片段；WordPiece 与 unigram/SentencePiece 的训练准则不同，不能只靠同一份词表复现。大词表可缩短常见文本，却增大 embedding 和输出层；小词表覆盖容易但序列更长。中文、代码、数字和 emoji 的频率结构不同，所以字符数无法预测 token 数。工程比较应使用产品语料的长度分布、编码耗时和模型质量，而非只试一句英文。',
        },
        {
          title: '把 special token 与 chat template 当成不可拆的 ABI',
          body: '聊天模型训练时看到的是 role/content 经模板渲染后的 token 序列，不是应用中的对象数组。模板决定 system、user、assistant 的边界，是否插入 BOS/EOS，以及生成提示停在哪里。先渲染字符串再 tokenize 时，通常应关闭重复的 special token 添加；切换模型必须连同 tokenizer 和模板一起切换。对用户文本还要区分普通字符与允许的控制 token，防止文本意外越过消息边界。',
        },
        {
          title: '预算的不只是 context 上限，还有编码路径本身',
          body: '请求预算应先套模板再计数，包含系统提示、历史消息、工具描述和预留输出，不能用字符数估算。端侧逐字符追加后每次重新编码整段会形成平方级重复工作；可缓存稳定前缀或使用支持增量的实现，但合并可能跨越追加边界，不能天真地把两段 token 列表直接拼接。限制超长输入时应按消息或语义块截断，并重新生成模板，避免从 UTF‑8 字节或 special token 中间切开。',
        },
        {
          title: '用金向量验证跨语言、跨实现的一致性',
          body: '建立包含中文、英文、空白、换行、emoji、组合字符、代码和疑似 special token 的小型语料，保存 tokenizer 哈希、模板版本、期望 id 与解码结果。在 Python、Host runtime 和设备实现上逐项比较，额外检查 encode→decode 是否满足声明的可逆边界。升级库后若 id 改变，即使解码文本相同也不能直接复用旧 prompt/KV cache；缓存键应包含完整 tokenizer 契约。',
        },
        {
          title: '沿分层快照定位第一个错误 token',
          body: '调试 token 差异时，不要只打印最终 ids。保存原始字节和 Unicode 码点，再快照规范化结果、模板字符串、预切分片段及各 token 的 id。按首个差异对齐：字符串不同就查换行、Jinja 空白控制和 BOS/EOS；字符串相同而片段不同，查 tokenizer.json 与 merge ranks；ids 相同而模型行为不同，再查 position 和 attention mask。这样能把问题定位到具体协议层。',
        },
      ],
      visual: {
        title: '一段对话如何变成整数列车',
        description: '逐步播放器展示人类消息在每个协议层增加或改变了什么，最后再从 token 片段流式还原文本。',
        steps: [
          {icon: '💬', label: '组织消息', data: '[{role, content}, …]', action: '保留角色、轮次和工具字段的结构', insight: '对象结构尚不是模型输入'},
          {icon: '🧾', label: '应用模板', data: 'role tokens + content + generation marker', action: '按模型自带模板插入控制边界', insight: '同一消息可因模板不同产生不同序列'},
          {icon: '🔤', label: '规范化与预切分', data: 'Unicode text → pieces/bytes', action: '执行 tokenizer 声明的字符与正则规则', insight: '不可见字符也会参与协议'},
          {icon: '🧲', label: '子词合并', data: 'base symbols → ranked merges', action: '按 BPE/WordPiece/SentencePiece 规则形成片段', insight: '词表大小与序列长度在交换'},
          {icon: '🔢', label: '查表成 ID', data: '[1, 2457, 93, …]', action: '映射词表并计算 context budget', insight: '模型只消费带位置的整数序列'},
          {icon: '📤', label: '增量解码', data: 'token bytes → UTF-8 text', action: '累积完整字节边界后向界面输出', insight: '单个 token 未必能独立显示为字符'},
        ],
        loop: '新一轮消息回到“组织消息”并重套模板；若要复用前缀，必须同时匹配模板、tokenizer 哈希、token 序列与位置。',
      },
    },

    10: {
      readingMinutes: 19,
      history: {
        intro: 'KV cache 的历史是自回归生成从“数学上可行”走向“系统上可承载”的缩影。Transformer 定义了注意力，随后 MQA/GQA 减少每个 token 的状态，分页、复用与量化又开始解决动态会话带来的内存管理问题。',
        milestones: [
          {
            year: '2017',
            title: 'Transformer 建立缩放点积与多头注意力',
            body: 'Transformer 用 Q、K、V 的缩放点积注意力替代循环结构，并以 causal mask 支持解码器只访问当前位置之前的状态。',
            source: {label: 'Attention Is All You Need 原始论文', url: 'https://arxiv.org/abs/1706.03762'},
          },
          {
            year: '2019',
            title: 'MQA 直接瞄准增量解码带宽',
            body: 'Multi-Query Attention 让多个 query head 共享一组 K/V head，显著缩小增量解码反复读取的 K/V 张量。',
            source: {label: 'MQA 原始论文', url: 'https://arxiv.org/abs/1911.02150'},
          },
          {
            year: '2023',
            title: 'GQA 在质量与 cache 规模间增加档位',
            body: 'Grouped-Query Attention 让若干 query head 共享一个 K/V head，在传统多头注意力与单组 MQA 之间提供可调折中。',
            source: {label: 'GQA 原始论文', url: 'https://arxiv.org/abs/2305.13245'},
          },
          {
            year: '2023',
            title: 'PagedAttention 处理动态会话碎片',
            body: 'PagedAttention 借鉴虚拟内存分页，把每个请求增长不定的 KV cache 映射到非连续块，并支持更灵活的共享。',
            source: {label: 'PagedAttention 原始论文', url: 'https://arxiv.org/abs/2309.06180'},
          },
          {
            year: '2024',
            title: 'KV 量化成为独立优化方向',
            body: 'KIVI 分析 key 与 value 的数值分布并采用不同量化维度，说明 cache 精度可以像权重一样被单独纳入容量和质量预算。',
            source: {label: 'KIVI 原始论文', url: 'https://arxiv.org/abs/2402.02750'},
          },
          {
            year: '现在',
            title: '本地 runtime 暴露 cache 类型与 offload 策略',
            body: 'llama.cpp 等执行器把 K/V 数据类型、offload、上下文与缓存复用变成可配置项，cache 已是部署配置而非隐藏实现细节。',
            source: {label: 'llama.cpp 官方 CLI 文档', url: 'https://github.com/ggml-org/llama.cpp/blob/master/tools/cli/README.md'},
          },
        ],
        bridge: '今天选择模型时，权重文件只是静态门票；真正随 token 和会话增长的是 KV cache。容量、读带宽、位置语义、淘汰策略和取消时的资源回收必须在 runtime 设计阶段一并确定。',
      },
      analogy: {
        title: '侦探桌上不断增长的案卷索引卡',
        story: '侦探读完每页证词后，不再每次从第一页重读，而是为每层分析保存两类索引卡：一类写“将来怎样找到这条线索”，另一类写“找到后取出什么内容”。新问题拿着查询卡扫过历史索引，形成判断，再把新证词的索引追加进去。',
        illustration: [
          {icon: '❓', label: '当前查询卡', mapsTo: '新 token 在每层产生的 Query'},
          {icon: '🗂️', label: '线索目录卡', mapsTo: '历史 token 的 Key cache'},
          {icon: '📝', label: '线索内容卡', mapsTo: '历史 token 的 Value cache'},
          {icon: '📚', label: '分层案卷柜', mapsTo: '按 layer、sequence、position、KV head 管理的缓存'},
        ],
        boundary: 'KV cache 不是可读摘要、事实数据库，也不是原始 token 的无损副本；它是特定模型权重、位置编码和精度下的中间张量。换模型、改前缀位置或任意编辑历史后，旧卡片通常不能直接沿用，缓存也不会让注意力本身变成常数成本。',
      },
      lesson: [
        {
          title: '从一层因果注意力看懂为什么要存 K 和 V',
          body: '每个 token 的隐藏状态在线性投影后得到 Q、K、V。当前 Q 与所有可见历史 K 计算相似度，经 causal mask 和 softmax 加权历史 V；模型权重固定时，旧 token 在该层的 K/V 不会因新 token 到来而改变，因此可以缓存。Q 只服务当前计算，通常无需长期保存。缓存省掉的是对历史 token 重做各层 K/V 投影，却仍要读取历史 cache 并完成随上下文增长的注意力计算。',
        },
        {
          title: 'Prefill 与 Decode 是两种资源画像',
          body: 'Prefill 一次处理整段 prompt，可在 token 维度并行，常有较高计算利用率，并连续写入每层 K/V；Decode 每轮只有新 token，却要读取不断变长的历史 cache，容易转为内存带宽受限。首 token 看排队和 prefill，后续看 inter-token latency。优化时必须分开计时：缩短 prompt 主要改善 prefill，降低 KV 字节数或提高局部性更直接影响长上下文 decode。',
        },
        {
          title: '先用模型结构计算 cache 斜率',
          body: '常见近似为 batch×layers×2×tokens×kv_heads×head_dim×每元素字节数，其中 2 代表 K 和 V；实现还含对齐和分页元数据。不要用 attention heads 代替 kv_heads，GQA/MQA 模型二者不同。把公式化成“每新增一个 token、一个会话增加多少字节”，再叠加权重、临时 workspace 与 runtime 开销。若实测斜率不符，检查 cache dtype、滑窗和预分配。',
        },
        {
          title: '压缩与管理策略各自牺牲不同能力',
          body: 'MQA/GQA 从模型结构上减少 KV heads，不能在任意已训练模型上无损切换；低比特 KV cache 减少容量和带宽，但需验证长上下文质量与 kernel 支持。滑动窗口限制可访问的远端历史，分页主要减少碎片而不改变每个有效 token 的张量量，prefix cache 则只在 token 与位置完全匹配时复用 prefill。策略可组合，但必须分别记录节省来自哪里，避免把分页误报成数值压缩。',
        },
        {
          title: '用增长曲线与状态破坏测试验证 runtime',
          body: '固定模型和采样参数，逐级增加 prompt 长度，记录 prefill、每 token 延迟、已用/预留 KV 字节和输出一致性；再提高并发，观察碎片、驱逐和尾延迟。状态测试要覆盖取消后回收、会话复位、prefix 命中与未命中、上下文移位以及 EOS。对同一 token 序列，关闭 cache 的参考路径应在容差内给出同样 logits；若编辑历史却仍命中旧 cache，则是位置或缓存键错误，而不是性能优化。',
        },
        {
          title: '用一个容量算例识别 kv_heads 误算',
          body: '以 32 层、8 个 KV head、head_dim 128、FP16 为例，每 token cache 为 32×2×8×128×2=131072 字节，即 128 KiB；4096 token 约 512 MiB，四会话约 2 GiB，未计对齐等开销。若误把 32 个 query head 代入，估算会放大四倍。应从模型元数据读取 layers 与 kv_heads，用 runtime 分配值校核，并区分有效占用和预留容量。',
        },
        {
          title: '把分页缓存当作并发状态机验证',
          body: '分页 runtime 把每个序列的逻辑位置映射到固定大小 KV block。块太大造成尾块内部碎片，太小则增加页表和调度开销；连续批处理还要在每轮为新 token 找空槽。prefix sharing 应对共享页维护引用计数，任一会话续写时采取 copy-on-write，不能覆盖别人的前缀。取消、超时和 EOS 必须走同一释放路径；压力测试可随机启动、增长、取消会话，核对空闲块总数回到基线，并验证驱逐不会串改其他序列的位置与内容。还要按不同并发记录页表查找、复制和回收耗时，避免容量优化制造新的尾延迟。',
        },
      ],
      visual: {
        title: '一个新 token 如何读取并扩展 KV Cache',
        description: '播放器区分只发生一次的 prefill 与重复发生的 decode，并让缓存随步数增长。',
        steps: [
          {icon: '📜', label: 'Prefill 提示', data: 'N prompt tokens', action: '并行处理已有序列，在每层生成 K/V', insight: '首轮集中计算并建立历史状态'},
          {icon: '🗃️', label: '写入分层缓存', data: '[layer, seq, pos, kv_head, dim]', action: '按位置保存 prompt 的 key 与 value', insight: 'cache 大小随 token 近似线性增长'},
          {icon: '✨', label: '产生新 Query', data: '1 new token → Q, K, V', action: '只为最新 token 计算本轮投影', insight: '旧 token 的 K/V 不必重新投影'},
          {icon: '🔎', label: '扫描历史', data: 'Q × Kᵀ → weights → V', action: '读取所有可见 cache 并计算因果注意力', insight: '省重算不等于免去历史读取'},
          {icon: '🎲', label: '采样下一个 token', data: 'logits → token id', action: '应用采样策略并输出增量文本', insight: '采样改变序列，cache 管理不改变模型语义'},
          {icon: '➕', label: '追加并循环', data: 'tokens = N + 1', action: '把新 K/V 放入下一位置并进入下一轮 decode', insight: '上下文越长，容量和读带宽压力越大'},
        ],
        loop: '“追加并循环”回到“产生新 Query”，直到 EOS、长度上限或取消；取消必须释放该序列占用的页或槽位。',
      },
    },
  });
})();
