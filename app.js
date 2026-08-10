const referenceLibrary = {
  espdl: ['ESP-DL 入门', 'https://docs.espressif.com/projects/esp-dl/en/latest/getting_started/readme.html'],
  espQuant: ['ESP-DL 量化', 'https://docs.espressif.com/projects/esp-dl/en/latest/tutorials/how_to_quantize_model.html'],
  espProfile: ['ESP-DL 加载、测试与性能分析', 'https://docs.espressif.com/projects/esp-dl/en/latest/tutorials/how_to_load_test_profile_model.html'],
  espMemory: ['ESP-IDF 内存类型', 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/memory-types.html'],
  espCamera: ['ESP-IDF Camera Controller', 'https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/camera_driver.html'],
  onnx: ['ONNX Concepts', 'https://onnx.ai/onnx/intro/concepts.html'],
  onnxVersion: ['ONNX Versioning', 'https://onnx.ai/onnx/repo-docs/Versioning.html'],
  pytorchExport: ['PyTorch ONNX 导出', 'https://docs.pytorch.org/tutorials/beginner/onnx/export_simple_model_to_onnx_tutorial.html'],
  litertQuant: ['LiteRT PTQ', 'https://ai.google.dev/edge/litert/models/post_training_quantization'],
  litertMicro: ['LiteRT for Microcontrollers', 'https://ai.google.dev/edge/litert/microcontrollers/get_started'],
  hfTemplate: ['Hugging Face Chat Templates', 'https://huggingface.co/docs/transformers/en/chat_templating'],
  gguf: ['GGUF 格式规范', 'https://github.com/ggerganov/ggml/blob/master/docs/gguf.md'],
  llamaBench: ['llama.cpp llama-bench', 'https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench/README.md'],
  llamaServer: ['llama.cpp server', 'https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md'],
  ort: ['ONNX Runtime Execution Providers', 'https://onnxruntime.ai/docs/execution-providers/'],
  executorch: ['ExecuTorch Delegates', 'https://docs.pytorch.org/executorch/stable/compiler-delegate-and-partitioner.html'],
  gqa: ['GQA 原始论文', 'https://arxiv.org/pdf/2305.13245'],
  promptCache: ['Prompt Cache 原始论文', 'https://arxiv.org/pdf/2311.04934'],
  perf: ['NVIDIA GenAI-Perf 指标', 'https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2700/user-guide/docs/perf_benchmark/genai-perf-README.html'],
};

const q = (prompt, options, answer, explanation) => ({prompt, options, answer, explanation});
const section = (title, body) => ({title, body});
const days=[
{n:1,t:'神经网络基础',s:'从张量、层与损失函数建立直觉',goal:'理解神经网络如何把输入张量变成可优化的预测，并能读懂一次前向与反向传播。',concept:['张量形状、权重与偏置','激活函数与非线性','损失函数、梯度与反向传播','参数量与 MACs 的粗略估算'],analogy:'把网络看成一条数据管线：张量是 USB buffer，层是协议转换模块，权重是固件常量，梯度则像现场采集的误差反馈。',diagram:'输入 x\n  │ Linear(Wx+b)\n  ▼\n激活 f(·) ──► 预测 ŷ ──► Loss(ŷ,y)\n  ▲                         │\n  └────── 梯度反传 ◄─────────┘',code:'y = x @ W.T + b\ny = relu(y)\nloss = mean((y - target) ** 2)\nloss.backward()',lab:'用一个 2→3→1 的 MLP，手算每层形状、参数量和一次 MSE；再用任意框架验证梯度方向。',questions:['为什么没有激活函数时，多层线性层仍等价于一层线性层？','输入 shape 为 [1,3,32,32] 时，第一层卷积的输出 shape 如何计算？','参数量和 MACs 分别更接近哪一种资源成本？'],next:'训练与推理'},
{n:2,t:'训练与推理',s:'理解离线训练与设备端执行的边界',goal:'区分训练图、推理图和部署图，知道哪些状态必须保留、哪些可以折叠。',concept:['epoch、batch、学习率与优化器','训练态与推理态','BatchNorm folding、常量折叠','端侧只执行 forward 的原因'],analogy:'训练像在实验室调试协议栈，推理像把确定好的状态机烧进设备；设备不应携带训练时的梯度、优化器和临时统计。',diagram:'数据集 → 训练循环 → checkpoint → 导出/优化 → runtime → 输入 → 输出',code:'model.eval()\nwith no_grad():\n    output = model(input)\nexport(model, example_input, format="onnx")',lab:'对比训练态/推理态的 BatchNorm 输出；导出前后固定随机种子，验证误差与算子列表。',questions:['为什么 dropout 在推理时关闭？','哪些训练状态不能直接带到 MCU？','导出模型时为什么需要 example input？'],next:'模型格式'},
{n:3,t:'模型格式',s:'让模型成为可移植的中间表示',goal:'能从计算图、权重张量、元数据三个角度阅读 ONNX、TFLite、GGUF 等格式。',concept:['计算图与拓扑排序','权重布局与 dtype','opset、metadata 与版本兼容','转换器、runtime 与后端的职责'],analogy:'模型格式类似 USB 描述符 + 数据包协议：描述符说明端点与能力，权重是 payload，runtime 负责把它落到具体控制器。',diagram:'Framework → Export IR → Converter → Optimizer → Runtime → Backend\n PyTorch       ONNX/TFLite/GGUF                     CPU/GPU/NPU',code:'onnx.checker.check_model(model)\nprint(model.graph.input, model.graph.output)\n# tflite / gguf 还要检查量化类型与 tokenizer metadata',lab:'选一个小模型，分别列出输入输出、算子、权重 dtype、动态维度和 metadata。',questions:['为什么同一个模型换格式后大小和精度会变化？','opset 不兼容时，问题通常出在导出端还是 runtime 端？','为什么元数据对 LLM 比对普通 CNN 更关键？'],next:'量化'},
{n:4,t:'量化',s:'用更少的 bit 换取更低的存储与带宽',goal:'掌握对称/非对称量化、scale/zero-point，并能判断误差来源。',concept:['int8 与 float 的映射','per-tensor、per-channel','校准集与激活范围','量化误差、饱和与反量化'],analogy:'像把高精度传感器值映射成有限 ADC 码：scale 是量程，zero-point 是零点，校准集决定量程是否覆盖真实信号。',diagram:'float x ──(x/scale)+zp──► int8 q ──runtime kernel──► int8/float output',code:'q = round(x / scale + zero_point)\nq = clip(q, -128, 127)\nx_hat = (q - zero_point) * scale',lab:'写一个 numpy/Python 量化器，比较 per-tensor 与 per-channel 的 MSE，并找出饱和比例。',questions:['为什么权重常用 per-channel 而激活常用 per-tensor？','校准集为什么不能只取一张“平均图片”？','量化后速度一定更快吗？'],next:'算子'},
{n:5,t:'算子',s:'从数学定义走到可执行 kernel',goal:'理解算子语义、内存布局、kernel 选择和算子融合之间的关系。',concept:['Conv/GEMM/Softmax/LayerNorm','算子输入输出契约','NHWC/NCHW 与 contiguous','fusion、tiling、SIMD'],analogy:'算子是协议栈里的单个命令，kernel 是针对某种芯片的驱动实现；同一个命令可以有不同硬件后端。',diagram:'Graph: Conv → BN → ReLU\nOptimizer: Conv+BN+ReLU fusion\nKernel: tile → load → MAC → store',code:'for (m_tile : M)\n  for (n_tile : N)\n    acc = 0\n    for (k_tile : K) acc += A * B\n    C = acc + bias',lab:'分别计算一个 1x1 Conv 与 GEMM 的等价关系；记录转置、cache miss 和融合前后访存次数。',questions:['为什么算子融合常常比减少 FLOPs 更重要？','布局转换何时会吞掉 kernel 加速收益？','NPU 不支持某算子时，runtime 应如何回退？'],next:'非 LLM 模型'},
{n:6,t:'非 LLM 端侧模型训练与部署',s:'把视觉/音频/传感器模型真正烧进设备',goal:'完成数据、训练、导出、量化、部署、验证的闭环，重点覆盖 MCU 常见小模型。',concept:['数据切分与数据增强','小模型结构选择','代表性数据集校准','TFLite Micro/ESP-DL 部署','设备端前后处理与阈值'],analogy:'模型只是固件中的一个模块；采样率、DMA buffer、任务优先级和 watchdog 与准确率同样决定产品体验。',diagram:'Sensor → DMA/RingBuffer → Preprocess → Inference → Postprocess → Event/Actuator',code:'idf.py build flash monitor\n# 设备端关注：arena、tensor arena、输入归一化、推理耗时\nESP_LOGI(TAG, "latency=%d ms", elapsed_ms);',lab:'用 IMU/声音/图像任选其一，做一个 2~4 类分类器；在 PC 与 ESP32 上对比输入归一化、延迟和混淆矩阵。',questions:['为什么设备端准确率下降常来自前处理不一致？','arena 太小与 stack 太小的故障表现有何不同？','什么时候应把模型放到 Linux host 而不是 ESP32？'],next:'内存与带宽'},
{n:7,t:'内存、带宽、MCU/NPU',s:'从“能跑”进化到“跑得稳”',goal:'用峰值 RAM、持续带宽和算力预算解释端侧性能，而不是只看参数量。',concept:['Flash/RAM/PSRAM/Cache','峰值活跃内存','算力 roofline 直觉','DMA、对齐与零拷贝','NPU delegate 与 fallback'],analogy:'Flash 像仓库，RAM 像工作台，cache 像手边料盒，带宽是搬运工速度；模型小不代表工作台峰值小。',diagram:'Flash weights ─mmap/copy─► RAM/PSRAM ─► cache ─► MAC unit\n                              ▲ DMA / zero-copy',code:'peak = weights + activations + workspace + io_buffers\nif peak > available_ram:\n    reduce_resolution_or_batch()\n    enable_streaming_or_tiling()',lab:'给定模型层表，估算每层 activation 与 workspace 峰值；用不同输入分辨率画 RAM/latency 曲线。',questions:['为什么带宽受限模型加大算力未必提速？','PSRAM 能否完全替代内部 SRAM？','NPU delegate 的边界为什么会影响性能？'],next:'视觉模型'},
{n:8,t:'端侧视觉模型',s:'从摄像头帧到可用事件',goal:'掌握检测/分类/分割的选择，以及摄像头、颜色格式、缩放和后处理的流水线。',concept:['分类、检测、分割','RGB/YUV、stride 与 DMA','ROI、resize 与 letterbox','NMS、置信度与时序平滑'],analogy:'摄像头流水线像 USB 摄像头驱动到应用层：帧格式、stride、buffer ownership 任一环节错位，模型就会“稳定地错”。',diagram:'Camera DMA → Frame buffer → Crop/Resize → Normalize → CNN\n                                      └→ decode boxes → NMS → tracker',code:'frame = camera.acquire()\nroi = letterbox(frame, 320, 320)\nboxes = detector(roi)\nboxes = nms(boxes, iou=0.45)\ncamera.release(frame)',lab:'用一张测试图逐步可视化原图、resize、模型输入、候选框、NMS 后结果，记录每步耗时。',questions:['letterbox 为什么要把缩放比例带入后处理？','检测模型的 FPS 是否等于摄像头帧率？','如何处理 buffer 复用导致的撕裂？'],next:'Tokenizer'},
{n:9,t:'Tokenizer',s:'理解文本如何变成模型可消费的整数流',goal:'能解释 vocabulary、merges、special tokens、padding 与 token budget，并定位端侧分词开销。',concept:['Unicode 与规范化','BPE/SentencePiece','特殊 token 与 chat template','token id、位置编码与上下文长度'],analogy:'Tokenizer 是串口协议的 framing 层：人类文本先被切成稳定的帧编号，模型只认编号，不直接认字。',diagram:'UTF-8 text → normalize → tokenize → [BOS, 1203, 88, EOS] → embedding lookup',code:'ids = tokenizer.encode("温度 28°C")\nprint(ids, len(ids))\nprompt = template(system, user)\n# token budget = prompt_tokens + generated_tokens',lab:'选同一句中英文混合文本，比较不同 tokenizer 的 token 数；测量逐 token 编码与整段编码的差异。',questions:['为什么中文、代码和 emoji 的 token 成本差异很大？','chat template 不一致会造成什么问题？','上下文窗口限制的是字符数还是 token 数？'],next:'KV Cache'},
{n:10,t:'KV Cache',s:'用内存换取 Decode 阶段的重复计算',goal:'理解 Prefill/Decode、K/V 张量布局、cache 量级与长上下文代价。',concept:['Attention 的 Q/K/V','Prefill 与 autoregressive Decode','cache shape 与 layer/head','paged KV、滑窗与量化'],analogy:'像网络协议缓存已确认的 header：新 token 只带来新的 Q/K/V 增量，不必重新解析整段历史 payload。',diagram:'Prompt tokens ──Prefill──► K,V cache\nNew token ──Q + cached K,V──► attention ─► next token ─► append cache',code:'kv_bytes ≈ layers * 2 * tokens * kv_heads * head_dim * bytes_per_value\n# 2 = K + V; batch、dtype、GQA 会改变实际值',lab:'做一个 KV cache 计算器：改变 context、层数、KV heads、head_dim、dtype，观察 PSRAM/显存占用。',questions:['为什么 Decode 常受内存带宽限制？','GQA/MQA 如何减少 KV Cache？','滑动窗口会牺牲哪类能力？'],next:'LLM Runtime'},
{n:11,t:'LLM Runtime',s:'把模型、缓存和生成循环组织起来',goal:'理解 runtime 的生命周期、计算图、采样器和内存管理，并能划分 ESP32 与 Linux 主机职责。',concept:['模型加载与 mmap','Prefill/Decode 调度','采样：temperature、top-k、top-p','线程、batch 与 context 管理','streaming output 与取消'],analogy:'Runtime 像一个实时总线调度器：管理 buffer、算子、超时和事件回调，模型只是挂载在总线上的业务模块。',diagram:'Load model → allocate context → prefill → decode loop → sample → stream token\n                                  └── stop/EOS/cancel ──┘',code:'llama-cli -m model.gguf -p "Explain UART framing" -n 64\nllama-server -m model.gguf --host 0.0.0.0 --port 8080',lab:'启动本地 server，用 ESP32 发送 HTTP 请求；测试首 token 延迟、流式输出、取消请求与并发限制。',questions:['首 token 延迟与每秒 token 由哪些阶段主导？','为什么生成循环要支持取消？','设备侧 tool calling 的安全边界在哪里？'],next:'LLM 量化'},
{n:12,t:'LLM 量化与 GGUF',s:'把权重压到可部署的模型文件',goal:'理解 block quantization、混合精度、权重元数据及 GGUF 容器的关系。',concept:['Q4 不等于每参数 4 bit','block scale 与额外开销','Q4_K_M/Q5_K_M/IQ 的取舍','W4A16、W8A8 与 weight-only','GGUF metadata 与 mmap'],analogy:'不是把每个字节硬截短，而是把一批数据压缩并附带解释字典；敏感层可保留更高精度。',diagram:'FP16 tensor → blocks → quantized values + scales/mins → GGUF tensor + metadata → runtime kernel',code:'python convert_hf_to_gguf.py ./model --outfile model-f16.gguf\nllama-quantize model-f16.gguf model-q4_k_m.gguf Q4_K_M\nllama-cli -m model-q4_k_m.gguf -p "hello"',lab:'对同一模型比较 F16/Q8/Q4 的文件大小、困惑度代理指标、首 token 延迟和峰值内存。',questions:['为什么重复量化会损伤质量？','GGUF 是容器还是量化算法？','哪些 tensor 值得保留更高精度？'],next:'推理框架'},
{n:13,t:'端侧 LLM 推理框架',s:'比较 Runtime、Backend 与编译型框架',goal:'建立 GGUF/计算图/runtime/backend/kernel 的分层模型，知道如何选择 llama.cpp、MLC、ONNX Runtime GenAI 或 ExecuTorch。',concept:['CPU/GPU/NPU backend','layer offload 与子图切分','预编译与运行时编译','CLI、HTTP server、benchmark','fallback 与可观测性'],analogy:'框架像 RTOS + 驱动抽象：上层调度统一，下层按目标芯片替换 backend；不支持的指令需要明确回退。',diagram:'Model format → Runtime graph → Backend partition\n                         ├─ CPU kernels\n                         ├─ GPU kernels\n                         └─ NPU compiled subgraph',code:'llama-bench -m model-q4_k_m.gguf\n# 关注 pp (prompt processing) 与 tg (token generation)\n# 逐步增加 GPU layers，记录 VRAM、pp/tg 与 fallback',lab:'对同一模型分别跑 CPU、GPU offload 或 NPU delegate，整理“可用内存—吞吐—功耗”三列结果。',questions:['为什么 Prefill 与 Decode 适合不同 kernel？','子图切分如何产生额外 copy？','何时应优先选编译型框架？'],next:'性能分析'},
{n:14,t:'性能分析',s:'把“感觉慢”变成可定位的预算',goal:'用端到端指标、分阶段计时、硬件计数器和功耗测量定位瓶颈。',concept:['TTFT、tokens/s、p50/p95','算子级 profile 与 trace','CPU 利用率、cache miss、带宽','功耗、温度、降频','准确率—延迟—能耗三维权衡'],analogy:'像抓 USB/网络协议问题：先看端到端时序，再缩小到阶段、包和 handler；单看平均吞吐会掩盖尾延迟。',diagram:'Request → preprocess → prefill → decode×N → postprocess\n  | wall time | p50/p95 | bytes moved | joules/token | thermal state',code:'time_to_first_token = prefill_end - request_start\ntokens_per_second = generated_tokens / decode_seconds\njoules_per_token = energy_j / generated_tokens',lab:'建立固定 prompt/温度/线程/电源条件的 benchmark 表；至少重复 5 次，报告中位数与 p95。',questions:['为什么必须固定 prompt 与 warm-up？','tokens/s 上升但 joules/token 变差，是否算优化成功？','如何区分模型慢、内存慢和串流网络慢？'],next:'整合网站'},
{n:15,t:'整合：端侧 AI 工程链路',s:'把 14 天知识收束成可交付项目',goal:'完成从数据与模型到设备、主机、性能和产品约束的系统设计。',concept:['需求→模型→格式→量化→runtime→硬件','ESP32 + Linux Edge Host 分工','USB/网络 Tool Calling','故障降级、OTA、监控','验收指标与可复现报告'],analogy:'端侧 AI 产品像一套分布式嵌入式系统：ESP32 负责实时 I/O 与安全边界，Linux host 负责重推理，网络协议连接两者。',diagram:'Sensor/USB/ESP32 → framed message → Linux Edge Host\n       ↑ status/actuator ← tool policy ← LLM runtime\n                     model → backend → accelerator',code:'POST /v1/chat/completions\n{"messages":[{"role":"user","content":"读取温度"}],"stream":true}\n\n# 验收：功能、延迟、能耗、离线、异常、升级、日志',lab:'做一个最小闭环：ESP32 采集温度并通过 USB/HTTP 发送，主机模型生成受控命令，ESP32 校验白名单后执行。',questions:['哪些命令必须在 ESP32 侧再次鉴权？','模型不可用时系统如何降级为确定性逻辑？','如何让一次性能回归可复现？'],next:null}
];

const curriculum = [
  {
    lesson: [
      section('先把张量当作带 shape 的 buffer', 'ESP32 中一个 I2S DMA buffer 的字节数取决于采样数、通道和位宽；张量同样必须同时看 shape 与 dtype。先写出 [batch, channel, height, width]，再讨论模型，能避免把 RGB565、RGB888 和归一化后的 float 数据混为一谈。'),
      section('层是有契约的变换', '线性层和卷积层读取固定布局的输入 buffer，输出另一个 buffer；权重和偏置是可优化参数。激活函数让两层组合不再能被合并为单一线性映射。反向传播只属于离线训练阶段，设备端通常只保留前向路径。'),
    ],
    pitfall: '只比较参数量会漏掉激活张量和工作区。MCU 上让系统崩溃的往往是推理瞬间的峰值 RAM，而不是 Flash 中权重文件的大小。',
    references: [referenceLibrary.pytorchExport, referenceLibrary.litertMicro],
    quiz: [
      q('为什么两个线性层之间没有激活函数时可合并？', ['每层都会自动归一化', '线性映射的复合仍是线性映射', '权重会在推理时消失', 'MAC 数必然为零'], 1, '没有非线性时，W₂(W₁x+b₁)+b₂ 可整理成一个新的 W 和 b；增加层数并没有增加可表达的非线性边界。'),
      q('输入 shape 为 [1, 3, 32, 32] 最先应该确认什么？', ['只确认总字节数', '通道位置和 dtype 是否与模型契约一致', '先把 batch 改成 32', '先把它上传到 NPU'], 1, 'shape 的维度语义和 dtype 是模型 I/O 契约的一部分。NCHW/NHWC 或 int8/float 不匹配时，模型可运行却会稳定地产生错误结果。'),
      q('对端侧延迟更直接的粗略计算指标是什么？', ['模型文件名长度', '参数量', 'MACs 与数据搬运量', '训练 epoch 数'], 2, '参数量主要影响权重存储；MACs 描述计算量，但还必须结合激活读写、缓存与带宽，才能解释真实延迟。'),
    ],
  },
  {
    lesson: [
      section('训练固件与推理固件不是同一个产物', '训练需要样本、梯度、优化器状态和随机扰动；推理只需要确定的计算图、权重和必要的运行时 buffer。把它类比为实验室里可改寄存器的调试环境，和烧录到量产板上的确定状态机。'),
      section('导出前先固定推理语义', 'PyTorch 的 model.eval() 会让 Dropout 和 BatchNorm 使用推理行为。导出用的 example input 不是装饰：它帮助捕获图、shape 和算子路径；随后要用相同输入比较源框架与 runtime 输出。'),
    ],
    pitfall: '只在 PC 上比较模型文件而没有比较设备端前处理，会把颜色空间、量化和 resize 的错误误判为“模型精度下降”。',
    references: [referenceLibrary.pytorchExport, referenceLibrary.onnx],
    quiz: [
      q('为什么推理前要调用 model.eval()？', ['释放所有权重', '使 Dropout、BatchNorm 使用推理行为', '自动量化为 int8', '把模型转换为 GGUF'], 1, 'eval() 不会量化或删除参数；它切换受训练状态影响的模块，避免 Dropout 随机置零或 BatchNorm 使用训练批统计。'),
      q('哪项通常不应随 MCU 推理产物部署？', ['权重张量', '输入输出元数据', '优化器动量与梯度', '算子执行顺序'], 2, '优化器状态和梯度用于更新参数，端侧推理只执行已确定模型的前向计算，携带它们会浪费有限存储与内存。'),
      q('导出模型的 example input 最主要的作用是什么？', ['给模型增加训练样本', '帮助导出器捕获输入 shape 与实际算子路径', '替代代表性校准集', '设定设备 CPU 频率'], 1, 'example input 用于图捕获和 shape 推断；量化校准还需要覆盖真实输入范围的代表性数据。'),
    ],
  },
  {
    lesson: [
      section('格式是模型的交接协议', 'ONNX 把图、初始化权重、输入输出和 opset 放进 ModelProto；它像 USB 描述符加 payload，而不是“任何 runtime 都必然能执行”的保证。runtime 必须支持该图声明的每个算子语义。'),
      section('容器、IR 与后端要分层思考', 'ONNX 是交换 IR，TFLite/LiteRT 面向轻量 runtime，GGUF 是供 GGML 系执行器快速加载的模型容器。格式转换会改变 dtype、布局、常量折叠和算子版本，因此每一步都要检查 I/O 与数值误差。'),
    ],
    pitfall: '“能用 Netron 打开”只说明文件可解析；不等于目标 runtime 支持该 opset、动态维度或自定义算子。',
    references: [referenceLibrary.onnx, referenceLibrary.onnxVersion, referenceLibrary.gguf],
    quiz: [
      q('ONNX opset 主要声明什么？', ['模型训练轮数', '图中算子应遵循的语义版本', '芯片时钟频率', '权重压缩比'], 1, 'opset 是算子集合的版本。相同 Add 在不同 opset 可能遵循不同定义，runtime 必须支持模型声明的域和版本。'),
      q('GGUF 最准确的描述是？', ['一种唯一的量化算法', '用于 GGML 执行器推理的模型容器格式', '训练框架', 'NPU 驱动'], 1, 'GGUF 保存张量和可扩展 metadata；张量可采用不同量化方案，因此容器格式与具体量化算法不能混为一谈。'),
      q('转换后最可靠的第一项验证是什么？', ['只比较文件大小', '用固定输入比较源模型与目标 runtime 输出', '只检查扩展名', '只看模型卡参数量'], 1, '固定测试向量可以直接发现 I/O 布局、数值类型或算子语义变化；文件大小无法证明推理结果正确。'),
    ],
  },
  {
    lesson: [
      section('量化是受控的编码，不是截断', 'int8 通过 scale 与 zero-point 表示有限范围，类似把模拟传感器映射为 ADC 码。量程过小会饱和，量程过大则把有效细节挤进很少的码位。'),
      section('校准决定激活量程', '权重是常量，激活取决于真实输入。LiteRT 的全整数量化要求 representative dataset 运行若干次以估计激活范围；它应覆盖光照、姿态、噪声和真实边界条件。'),
    ],
    pitfall: '量化为 int8 不保证更快：若目标后端没有 int8 kernel，或频繁插入 dequantize/quantize，转换开销可能抵消收益。',
    references: [referenceLibrary.litertQuant, referenceLibrary.espQuant],
    quiz: [
      q('全整数量化为何需要 representative dataset？', ['用来重新训练所有权重', '估计会随输入变化的激活范围', '生成模型名称', '提高摄像头帧率'], 1, '权重本身可直接扫描，输入和中间激活需要运行代表性样本来估计 min/max 或其他量程统计。'),
      q('量化饱和最接近 ADC 的哪种问题？', ['采样率过高', '输入超过量程而被夹到最大/最小码', '串口波特率不匹配', 'Flash 擦写'], 1, '超过 scale 覆盖范围的数值会被 clip 到 int8 边界，反量化后原始差异已经丢失。'),
      q('ESP-DL 文档中 ESP32 与 ESP32-S3 常使用的策略是？', ['所有 Conv 必为 per-channel', 'per-tensor 量化', '仅支持 float32', '不支持任何量化'], 1, 'ESP-DL 的平台策略受 ISA 与实现限制影响；课程应检查目标芯片而非把 P4 的 per-channel 能力泛化到所有 ESP32。'),
    ],
  },
  {
    lesson: [
      section('算子语义与 kernel 实现分开看', 'Conv、GEMM、Softmax 是图中的数学契约；kernel 是在特定 CPU/GPU/NPU 上实现该契约的代码。就像同一 SPI API 可以落到不同控制器驱动，速度由布局、tile 和缓存命中决定。'),
      section('搬运次数常比公式更关键', '融合 Conv+Bias+ReLU 能少写一次中间 buffer。布局转换则可能额外读写整个张量，尤其在 MCU/DRAM 带宽紧张时，即使 MAC 数减少也未必更快。'),
    ],
    pitfall: '把不支持的 NPU 子图与 CPU fallback 交错，会引入切分边界 copy；仅看 NPU 峰值 TOPS 无法预测端到端速度。',
    references: [referenceLibrary.onnx, referenceLibrary.ort],
    quiz: [
      q('算子融合经常提速的主要原因是？', ['改变模型训练标签', '减少中间张量读写与调度开销', '增加 batch 到无限大', '自动增加 NPU SRAM'], 1, '融合通常保留数学语义，却避免把中间结果落到慢内存；这对带宽受限设备往往比少量 FLOPs 更重要。'),
      q('NCHW 到 NHWC 转换的风险是什么？', ['只会改变文件扩展名', '可能增加完整张量 copy 并破坏连续布局', '必然提高准确率', '能消除所有动态 shape'], 1, 'layout transform 是实际的内存读写；若夹在加速 kernel 两侧，copy 成本可能超过 kernel 的收益。'),
      q('ONNX Runtime 多个 Execution Provider 的常见回退行为是？', ['不支持节点时删除节点', '按优先级将支持的子图交给 EP，其余可由 CPU 执行', '把模型重新训练', '把所有节点复制到 Flash'], 1, 'EP 通过能力探测领取节点/子图；未支持部分常由 CPU provider 接管，所以必须测量分区与数据转移。'),
    ],
  },
  {
    lesson: [
      section('先做可复现的数据链路', '传感器窗口、标签、训练增强、设备端采样率与归一化必须有明确版本。把它当成通信协议：训练端和固件端的字段顺序、比例和单位有一项不同，分类器仍会输出答案却不再代表同一输入。'),
      section('模型只是 ESP-IDF 工程的一部分', 'ESP-DL 支持将量化后的 .espdl 模型加载并运行；还要为输入、输出和中间结果安排内存。设备日志应记录 latency、arena/heap 水位和错误路径，而非只打印置信度。'),
    ],
    pitfall: 'PC 端把 float 图像直接喂给模型而固件端错误地喂 RGB565 或漏掉归一化，是设备准确率突然下降的高频原因。',
    references: [referenceLibrary.espdl, referenceLibrary.espProfile, referenceLibrary.litertMicro],
    quiz: [
      q('设备端精度明显低于 PC 时，最先比对什么？', ['网页 CSS', '前处理：颜色、resize、归一化与量化', '模型文件的修改时间', 'Wi-Fi SSID'], 1, '同一个权重在不同输入分布上会给出不同结果；前处理应通过保存的测试向量逐项对齐。'),
      q('Tensor arena 不足通常意味着什么？', ['模型一定训练过拟合', '输入、输出或中间张量无法完成内存分配', 'Flash 分区表被删除', '网络 API 返回 404'], 1, 'LiteRT Micro 将张量放进预分配 arena；不足会在 AllocateTensors 或运行前后暴露，是模型峰值内存预算问题。'),
      q('何时应把通用 LLM 放到 Linux Edge Host？', ['ESP32 有 GPIO 时', '模型与 KV cache 超出 MCU RAM/算力预算时', '温度传感器存在时', '只要使用 USB'], 1, 'ESP32 可保持采集、协议与安全控制；通用 LLM 的权重和 KV cache 通常需要 Linux 主机或适配的加速器。'),
    ],
  },
  {
    lesson: [
      section('RAM 是工作台，不是仓库', 'Flash 中的权重、RAM 中的激活、workspace、I/O buffer 和任务栈共同形成峰值。模型文件能放入 Flash 并不表示推理瞬间有足够可用 SRAM。'),
      section('DMA、PSRAM 与 cache 有不同契约', 'ESP-IDF 指出 DMA buffer 通常需位于可 DMA 的 DRAM 且对齐；PSRAM 通过 cache 访问，大块访问会受带宽和 cache 驱逐影响。涉及 DMA 的系统还需按芯片和 API 处理 cache 同步。'),
    ],
    pitfall: '把“PSRAM 容量大”当作“可替代内部 SRAM”会导致 DMA 不可用、带宽下降或 cache 一致性问题，尤其在相机和显示流同时运行时。',
    references: [referenceLibrary.espMemory, referenceLibrary.litertMicro],
    quiz: [
      q('端侧推理峰值 RAM 预算应至少包含？', ['仅权重', '权重、激活、workspace 与 I/O buffer', '仅模型名称', '仅 FreeRTOS tick'], 1, '峰值由同时存活的缓冲区决定。权重可能在 Flash，激活和临时 workspace 才常常决定能否稳定运行。'),
      q('ESP-IDF 的 MALLOC_CAP_DMA 对经典 ESP32 的含义更接近？', ['优先分配外部 PSRAM', '分配适合硬件 DMA 的内存，通常排除外部 PSRAM', '强制分配 Flash', '禁用 cache'], 1, '官方文档明确说明该 capability 适合 DMA 且排除外部 PSRAM；实际能力仍应按所用 SoC/外设文档核对。'),
      q('为什么带宽受限模型增加 MAC 单元未必变快？', ['MAC 单元会删掉权重', '处理器仍在等待权重和激活从内存搬运', '输入 shape 自动缩小', '量化会自动失败'], 1, '当瓶颈是每秒可搬运字节数，额外算力处于空闲等待；应优先减少读写、改善布局或融合算子。'),
    ],
  },
  {
    lesson: [
      section('摄像头到模型是一条带所有权的流水线', '相机 DMA、frame buffer、颜色转换、crop/letterbox、resize、归一化、推理和 NMS 都要定义输入输出格式与 buffer owner。ESP-IDF 的 camera controller 要求满足对齐约束的 buffer，并在传输完成事件后使用帧数据。'),
      section('检测后处理需要坐标账本', 'letterbox 产生缩放比和 padding；模型输出框必须反变换回原图坐标后再 NMS。若只保留 320×320 输入坐标，画到原始摄像头帧上就会系统性偏移。'),
    ],
    pitfall: '未等 DMA 传输完成就把同一个 frame buffer 交给预处理，或提前归还它，会造成撕裂、偶现误检和难以复现的数据竞争。',
    references: [referenceLibrary.espCamera, referenceLibrary.espMemory, referenceLibrary.espProfile],
    quiz: [
      q('letterbox 后为什么必须保存缩放和 padding？', ['为了增加模型参数', '把检测框坐标正确映射回原始帧', '为了改变 tokenizer', '为了关闭 DMA'], 1, 'letterbox 同时缩放和填充；后处理必须做逆变换，否则框的位置和大小会相对原始图像错误。'),
      q('相机帧最安全的处理时机是？', ['DMA 启动前', '驱动报告传输完成并取得 buffer 所有权后', '任意 ISR 中', 'Flash 擦写期间'], 1, '帧数据在完成事件前仍可能被 DMA 写入。明确所有权和生命周期是防止撕裂与并发访问的基础。'),
      q('检测模型 10 FPS 是否意味着相机必须为 10 FPS？', ['是，二者永远相等', '否，采集、预处理和推理可独立，并可能丢帧或复用最新帧', '是，因为 NMS 决定时钟', '否，因为模型不需要输入'], 1, '端到端吞吐由流水线决定。相机可能更快，系统应定义背压、队列深度和取最新帧或逐帧处理的策略。'),
    ],
  },
  {
    lesson: [
      section('模型读 token id，不读 UTF-8 字符', 'Tokenizer 把文本规范化并编码为整数序列，类似串口协议先 framing 再解析 payload。中文、emoji 和代码的 token 成本由词表与编码规则决定，不能用字符数估算上下文。'),
      section('聊天模板是模型输入协议', '不同 instruct 模型可能使用不同控制 token。Hugging Face 文档强调错误模板会显著降低表现，并提醒模板已包含 special tokens 时不要在二次 tokenize 时重复添加。'),
    ],
    pitfall: '把“同一句文本”直接拼接给不同聊天模型，或重复插入 BOS/EOS，常会造成模型角色混乱、首 token 异常或上下文预算失真。',
    references: [referenceLibrary.hfTemplate, referenceLibrary.gguf],
    quiz: [
      q('LLM 的上下文窗口通常限制什么？', ['UTF-8 字节数', '屏幕字符数', 'token 数', 'HTTP 包数'], 2, '模型的 embedding 与位置编码按 token 工作。一个汉字、emoji 或代码片段占用的 token 数并不固定。'),
      q('为什么应使用模型自带 chat template？', ['它会自动训练模型', '不同模型的角色控制 token 和输入格式不同', '它能减少所有 KV cache', '它只影响网页排版'], 1, '同一基础模型的不同对话微调也可能要求不同格式；错误控制 token 会破坏训练时的上下文分布。'),
      q('先 apply_chat_template(tokenize=False) 再 tokenize 时通常要注意？', ['强制添加更多 special tokens', '避免再次添加模板已经包含的 special tokens', '删除所有空格', '把 token 变成 float32'], 1, '官方文档警告重复 special tokens 往往有害。直接 tokenize=True 通常更安全，因为模板与分词在同一调用中完成。'),
    ],
  },
  {
    lesson: [
      section('KV cache 把时间换成空间', '自回归生成中，历史 token 的 K/V 不必每轮重算；Prefill 建立 prompt 的 cache，Decode 每步读取历史并追加一个 token。它像缓存已经解析的协议头，新包只处理增量。'),
      section('用公式先做容量预算', '近似字节数为 layers × 2(K+V) × tokens × kv_heads × head_dim × bytes_per_value，再乘 batch/并发等因素。GQA 通过减少 kv_heads 降低容量和读带宽，但这是模型架构选择，不是 runtime 随手能开启的开关。'),
    ],
    pitfall: '只按权重文件估 RAM 而忽略长 prompt 的 KV cache，会导致模型“加载成功、请求一长就 OOM”。',
    references: [referenceLibrary.gqa, referenceLibrary.promptCache, referenceLibrary.llamaBench],
    quiz: [
      q('KV cache 的核心收益是什么？', ['不再需要权重', '避免每生成一个 token 都重算整个历史的 K/V', '自动减少 tokenizer 时间', '把模型转换为 int8'], 1, 'cache 保存已处理 token 的 attention state；新 token 仍需计算自身状态并对历史做 attention，但不重复构造历史 K/V。'),
      q('KV cache 容量与 context length 的关系通常是？', ['完全无关', '近似线性增长', '必然平方增长', '每次减半'], 1, '每增加一个 token，通常每层要新增 K 与 V 向量，因此存储量随 token 数近似线性增长。'),
      q('GQA 如何降低 KV cache？', ['删除所有 query head', '多个 query head 共享较少的 K/V head', '让所有 token 使用同一个 embedding', '压缩 HTTP 响应'], 1, 'GQA 位于 MHA 与 MQA 之间，以分组共享 K/V head，在质量和容量/带宽之间取折中。'),
    ],
  },
  {
    lesson: [
      section('Runtime 管的是生命周期与调度', '加载模型、分配 context、tokenize、prefill、decode、采样、流式输出和取消构成一次请求。它更像 RTOS 调度器而不是“调用一个 predict()”：必须管理 buffer、并发、超时和资源回收。'),
      section('ESP32 与 Host 明确分工', 'ESP32 负责采集、协议 framing、离线兜底和执行器安全策略；Linux Edge Host 可承载模型、KV cache 与 LLM runtime。ESP32 接收到的模型建议只能通过白名单、范围检查和状态机后才能执行。'),
    ],
    pitfall: '把 LLM 输出当成可直接执行的 GPIO/电机指令，会绕过嵌入式系统的安全边界；即使模型在本地运行也不改变这一点。',
    references: [referenceLibrary.llamaServer, referenceLibrary.hfTemplate, referenceLibrary.promptCache],
    quiz: [
      q('TTFT 主要包含哪些阶段？', ['仅 Decode 采样', '请求处理、tokenize、prefill 与首 token 产生前的工作', '仅网络 DNS', '仅模型下载'], 1, '首 token 前必须处理输入并执行 prompt prefill；因此 TTFT 和后续 tokens/s 受不同工作负载主导。'),
      q('生成循环为什么需要取消机制？', ['取消会提高模型准确率', '用户断开或超时后可释放计算与 KV cache 资源', '因为 tokenizer 不支持长文本', '为了重新训练权重'], 1, '没有取消，已失效请求仍持续占用内存和计算。对多请求 runtime，这会直接恶化其他请求的延迟。'),
      q('ESP32 接收 LLM 工具调用后最安全的做法是？', ['直接执行模型生成字符串', '依据本地白名单、参数范围和状态机再次授权', '把命令写入 bootloader', '关闭 watchdog'], 1, '模型输出是不可信输入。硬件侧必须保留确定性策略与最小权限，模型不可替代安全控制器。'),
    ],
  },
  {
    lesson: [
      section('GGUF 是自描述容器', 'GGUF 保存张量与 key-value metadata，旨在让 GGML 系执行器快速加载；规范中的 alignment 和 quantization_version 是兼容性信息。它不是 Q4_K_M 等某一种量化方法。'),
      section('权重量化是块级的工程折中', '许多 GGML 量化格式为一块值保存低 bit 编码及 scale 等辅助数据，所以“Q4”不等于文件中每个参数恰好 4 bit。比较应同时记录文件大小、质量代理、prefill/decode 和峰值内存。'),
    ],
    pitfall: '从已经量化的 GGUF 再量化会累积误差；应从 F16/BF16 或更高精度源产物生成各个目标量化版本。',
    references: [referenceLibrary.gguf, referenceLibrary.llamaBench],
    quiz: [
      q('GGUF metadata 的重要用途是什么？', ['替代所有模型权重', '描述模型与量化等信息以便执行器正确加载', '提高 Wi-Fi RSSI', '记录训练数据原文'], 1, 'GGUF 的 key-value metadata 让模型包含可扩展的标识与配置；runtime 仍需读取真正的张量数据。'),
      q('“Q4”为何不必然等于每参数精确 4 bit？', ['量化不会压缩文件', '块量化还需要 scale、min 等辅助数据', 'GPU 不支持整数', 'tokenizer 会修改位数'], 1, '块的编码值以低 bit 保存，但每块还有解释这些值的额外参数；实际 bits-per-weight 取决于具体格式。'),
      q('比较两种 GGUF 量化时最不充分的指标是？', ['文件大小', '固定提示下的延迟与质量代理', '峰值内存', '相同参数下的吞吐'], 0, '文件更小不代表在目标设备上更快或质量可接受。部署决策必须同时测量质量、内存、功耗和分阶段性能。'),
    ],
  },
  {
    lesson: [
      section('Runtime、backend、kernel 是三层', 'Runtime 管图与请求，backend 把可支持子图交给 CPU/GPU/NPU，kernel 执行具体算子。ONNX Runtime 的 EP 按能力分区；ExecuTorch delegate 也经过 AOT 预处理和 runtime 初始化/执行。'),
      section('先测 CPU，再测卸载', '官方 ONNX Runtime 移动端指南建议量化模型先从 CPU EP 开始；若不满足目标，再尝试 NNAPI/CoreML 等。模型分区过碎时 copy 可能让“用了 NPU”反而变慢。'),
    ],
    pitfall: '只记录“已启用 GPU/NPU”而不检查执行 provider、子图分区与 fallback，会把 CPU 运行误判成硬件加速成功。',
    references: [referenceLibrary.ort, referenceLibrary.executorch, referenceLibrary.llamaBench],
    quiz: [
      q('ONNX Runtime Execution Provider 的职责是？', ['训练 tokenizer', '识别并执行自己支持的节点或子图', '生成 GitHub Pages', '为 Flash 加密'], 1, 'EP 通过能力接口领取可执行部分，并以相同 runtime API 接入不同硬件；未支持部分可能留给 CPU。'),
      q('何时编译型 delegate/后端尤其有价值？', ['目标硬件与支持算子固定，需要 AOT 优化与部署产物', '需要随机修改模型图且不关心性能', '没有任何模型文件', '只需网页导航'], 0, '固定目标允许预处理/编译子图为部署二进制；代价是支持矩阵和构建流程更严格，需要在部署前验证。'),
      q('为什么子图切分可能降低端到端性能？', ['它必然删除所有算子', '边界会增加设备间 copy、同步与调度开销', '它会让权重变成文本', '它自动禁用 cache'], 1, '每个切分边界都可能搬运激活并同步执行器。少量不支持算子也能把加速路径打碎，所以要看 trace 而非宣传页。'),
    ],
  },
  {
    lesson: [
      section('先定义可复现的基准合同', '固定模型版本、量化、prompt、输出上限、采样、线程、context、温度和供电状态。没有这些，两个 tokens/s 数字不可比较，就像未固定波特率和 payload 的吞吐测试。'),
      section('分阶段测量才能定位', 'TTFT 覆盖首响应体验，inter-token latency 反映流式生成节奏，output token throughput 衡量整体产出。还要拆出预处理、prefill、decode、网络与后处理，并同时记录能耗和热状态。'),
    ],
    pitfall: '只报告平均 tokens/s 会掩盖长 prompt、热降频、首次加载和 p95 尾延迟；产品体验常由这些“非平均”路径决定。',
    references: [referenceLibrary.perf, referenceLibrary.llamaBench, referenceLibrary.espProfile],
    quiz: [
      q('Time to First Token 的定义最接近？', ['相邻两个输出 token 间隔', '请求发出到收到第一个响应 token 的时间', '整个模型下载时间', '每秒摄像头帧数'], 1, 'TTFT 是首响应延迟，包含请求与 prompt 处理路径；它不等同于 decode 阶段每秒生成 token 的速度。'),
      q('为何基准测试要 warm-up 并重复多次？', ['让模型自动增加参数', '减少首次加载/cache 与瞬态频率造成的偏差，并报告尾延迟', '避免使用固定 prompt', '跳过正确性检查'], 1, '首次运行与热状态往往不同；多次运行可报告中位数和 p95，避免单次偶然值主导结论。'),
      q('tokens/s 上升但 joules/token 变差，是否必然是成功优化？', ['是，速度是唯一指标', '否，需按产品的延迟、能耗、温度和质量目标判断', '是，因为能耗无法测量', '否，因为 tokenizer 失效'], 1, '端侧是多目标约束。更高吞吐若导致续航、温升或质量不达标，不能直接称为产品层优化成功。'),
    ],
  },
  {
    lesson: [
      section('把产品当作分布式嵌入式系统', '传感器和 ESP32 处理实时 I/O、协议与执行器；Linux Edge Host 提供模型与高内存 runtime。两侧以带版本的帧协议、超时、幂等请求和状态回执连接，而不是把自然语言直接接到硬件。'),
      section('验收必须覆盖故障路径', '除了准确率和延迟，还应验证断网、Host 不可用、模型超时、错误命令、OTA 回滚和日志可追溯性。模型不可用时应退回确定性本地逻辑，安全关键控制不可依赖生成结果。'),
    ],
    pitfall: '只演示正常 Wi-Fi 和正常 prompt 的“happy path”会掩盖最重要的现场风险：网络抖动、模型幻觉、重复命令和升级中断。',
    references: [referenceLibrary.espdl, referenceLibrary.llamaServer, referenceLibrary.perf],
    quiz: [
      q('ESP32 + Edge Host 架构中，哪项应留在 ESP32 的确定性边界内？', ['LLM 的所有权重', '执行器白名单、范围检查和失联降级', '云端训练循环', 'GGUF 转换脚本'], 1, '与物理世界交互的安全约束必须在本地确定性实现；Host 的模型建议只能作为受限输入。'),
      q('模型服务不可用时合理的降级策略是？', ['无限重试并阻塞控制任务', '回退到预定义阈值/状态机并上报故障', '放开所有执行器权限', '擦除模型分区'], 1, '降级应保持可预测和安全。重试可有上限，但控制系统需要在 Host 失效时继续执行经过验证的本地策略。'),
      q('一次可复现的性能回归至少需要固定什么？', ['仅产品名称', '模型、输入/token、运行参数、硬件和测量条件', '只固定屏幕分辨率', '只固定 Git 分支名'], 1, '任何会影响路径的变量都应记录。这样才能区分模型变化、runtime 变化、硬件热状态或网络因素。'),
    ],
  },
];

const longFormProfiles = [
  {recap:'这是课程起点。你已经熟悉 ESP32 中“外设产生数据、DMA 搬运数据、任务消费数据”的链路；本章把这条链路抽象为神经网络的输入、层和输出，为后续讨论训练与部署建立共同语言。', next:'下一章将把本章的前向计算拆出训练期与推理期：哪些状态属于实验室，哪些状态可以像稳定固件一样烧录到目标设备。', focus:'张量不是神秘对象，而是带 shape、dtype 和布局的连续数据块。每一次层计算都应像驱动 API 一样写清输入输出契约；只有契约稳定，后续量化、转换和设备端复现才有依据。', workflow:'从传感器样本开始，先写出 shape 和单位，再经过线性层或卷积层、激活函数和损失函数。训练用损失反传更新参数，部署时只保留确定的前向路径。', decision:'面对模型时先问三件事：输入 buffer 多大、每层激活何时同时存活、计算时会搬运多少字节。这样能避免仅凭参数量判断“ESP32 一定跑得动”。', keywords:[['张量','带形状与数据类型的多维数值块，是模型输入、权重和中间结果的统一表示。','像注明采样数、通道数和位宽的 DMA buffer。'],['Shape','描述各维长度及其语义，例如 NCHW 的 batch、通道、高和宽。','像协议帧的字段布局，顺序错了数据仍存在但含义全错。'],['激活函数','在线性变换后加入非线性，使多层网络能表达复杂边界。','像状态机中的条件分支，不能被简单合并。'],['MAC','一次乘加运算；常用于粗略估算计算量。','像内层 DSP 循环的工作次数，还需结合取数成本。']]},
  {recap:'上一章把网络看作有输入输出契约的数据管线。本章继续追问：谁来修改权重、何时停止修改、设备端到底需要保留哪些状态。', next:'下一章会把已经固定的推理图装进 ONNX、LiteRT 或 GGUF 等格式，重点检查格式是否保留了本章确定下来的输入输出契约。', focus:'训练与推理的分界不是“是否使用 GPU”，而是是否需要梯度、优化器和随机训练行为。端侧运行时应尽量只装载推理所需的图、常量和工作内存。', workflow:'数据集经过 batch 和 epoch 被反复喂入模型；loss 产生梯度，优化器据此修改权重；验证完成后切换 eval，导出固定图，并在目标 runtime 上复算同一测试向量。', decision:'把训练视为实验室里的可观测控制回路，把推理视为量产固件。导出前后都应固定随机种子、输入 shape 与容差，不能只看“文件生成成功”。', keywords:[['Epoch','训练集完整遍历一次。','像对一组整机测试用例完整跑一轮。'],['Batch','一次用于计算梯度的一小批样本。','像把多帧传感器窗口攒成一次 DSP 处理。'],['eval 模式','让 Dropout、BatchNorm 使用推理语义的模式。','像从调试配置切换到量产配置。'],['优化器','依据梯度更新参数的算法及其状态。','像自动调参器；部署后不应留在固件里。']]},
  {recap:'上一章已经把模型固定为推理图和权重。本章关注这份产物如何跨框架、转换器与硬件后端传递，以及传递过程中什么会失真。', next:'下一章会在格式契约稳定的前提下压缩数值精度：量化的 scale、zero-point 和校准数据都依赖本章确认的 tensor 语义。', focus:'模型格式是交换协议，不是万能驱动。ONNX 的图和 opset、LiteRT 的算子集、GGUF 的 metadata 都必须由目标执行器理解；打开文件或转换成功不等于可以正确推理。', workflow:'框架导出计算图和权重，转换器检查算子与 dtype，优化器做常量折叠或布局变换，runtime 为后端分配 kernel。每个阶段都要记录 I/O 名称、shape、dtype、动态维度和数值误差。', decision:'把格式检查纳入 CI：固定样本在源框架、导出 IR 和目标 runtime 上的输出都要比较。发生差异时先查预处理、布局、opset 和 fallback，而不是立即怀疑模型本身。', keywords:[['计算图','以节点和边描述张量如何经过算子得到输出。','像固件的数据流图或任务依赖图。'],['ONNX opset','模型声明的算子语义版本。','像通信协议版本；收发两端必须兼容。'],['Metadata','随模型保存的名称、词表、量化或配置说明。','像 USB 描述符，帮助主机正确解释 payload。'],['Runtime','加载模型并调度算子执行的程序。','像 RTOS 加驱动抽象层，而非模型文件本身。']]},
  {recap:'上一章确认了模型格式、算子语义和 I/O 契约。本章在这些契约不变的前提下，将 float 数值映射到更少 bit，并量化误差的来源。', next:'下一章会从量化后的图继续进入算子与 kernel：同样的 int8 图在不同布局、融合和后端上可能有完全不同的延迟。', focus:'量化本质是给连续数值选择有限码本。scale 定义一个码位代表多少真实值，zero-point 定义整数零点；选择不当会出现饱和、分辨率不足或额外转换开销。', workflow:'先取得 float 基线，再用代表性输入跑校准，统计激活范围，导出目标芯片支持的量化模型，最后分别比较 PC、runtime 和设备端结果。校准集必须覆盖真实光照、姿态、噪声和边界输入。', decision:'不要问“int8 会不会更快”，而要问“目标 backend 是否有整数量化 kernel、I/O 是否也能保持整数、是否出现 dequantize 边界”。速度、精度和峰值内存必须一起验收。', keywords:[['Scale','整数码与真实数值之间的比例系数。','像 ADC 的量程和每个码的物理含义。'],['Zero-point','映射中代表真实零值的整数偏移。','像传感器零偏校正后的基准码。'],['校准集','用于估计激活范围的代表性输入样本。','像用真实工况标定 ADC，而非只输入中间值。'],['Per-channel','为不同权重通道分别使用量化参数。','像为不同传感器通道分别做增益标定。']]},
  {recap:'上一章得到的是带量化约束的图与张量。本章将图中的数学算子落到实际 kernel，理解为什么“同样的 FLOPs”也可能有不同的端侧表现。', next:'下一章会把算子、量化和 I/O 链组合为非 LLM 小模型的完整部署闭环，从数据采集到 ESP32 上的事件输出。', focus:'算子定义数学语义，kernel 定义某个 CPU、GPU 或 NPU 怎样访问内存并计算语义。你需要同时理解 Conv/GEMM 的公式、NHWC/NCHW 的布局，以及 cache、SIMD、tile 和融合的执行代价。', workflow:'runtime 读取图后选择 backend；backend 为支持的节点选 kernel；kernel 以 tile 读取输入和权重、累加结果，再写回输出。优化器可把 Conv、Bias、ReLU 融合，避免中间张量反复落到慢内存。', decision:'分析慢路径时先数 copy 与同步，再数 MAC。若 NPU 只接管少量子图，CPU/NPU 之间的 layout transform 和 buffer copy 可能比计算本身更贵。', keywords:[['Kernel','针对具体硬件实现一个算子的低层计算代码。','像同一外设 API 的芯片专用驱动。'],['Layout','张量维度在内存中的排列方式，如 NCHW 或 NHWC。','像结构体字段和对齐规则。'],['Fusion','将多个连续算子合并为一次执行。','像把多个小 DMA 事务合并以减少中断和搬运。'],['Tiling','把大计算分块以适配寄存器或 cache。','像用分块 buffer 处理长数据流。']]},
  {recap:'上一章说明图最终由算子和 kernel 执行。本章把这些部件放回完整产品链路，完成一个可部署的视觉、音频或传感器小模型。', next:'下一章将解释为何模型“能跑”仍不够：Flash、SRAM、PSRAM、带宽和 DMA 限制决定它能否长期稳定地跑。', focus:'非 LLM 模型通常不是直接接收“现实世界”，而是接收严格定义的窗口、图像或特征。训练数据、设备前处理、量化输入和阈值策略必须像通信协议一样逐字节一致。', workflow:'确定产品事件和采样窗口，采集并标注数据，训练小模型，导出和量化，部署到 ESP-DL 或 LiteRT Micro，再在板上记录延迟、混淆矩阵、堆内存与异常输入结果。', decision:'优先做最小闭环：两到四类任务、可回放的原始样本、明确的阈值和 fallback。先证明设备输入与 PC 输入一致，再扩大数据集或替换更大模型。', keywords:[['代表性数据','覆盖真实设备工况的数据集合。','像整机测试必须覆盖温湿度、电源和负载边界。'],['Tensor arena','为 MCU 推理预分配输入、输出和中间张量的内存区。','像启动时规划好的静态工作区。'],['前处理','将原始传感器数据变成模型输入的步骤。','像协议栈的 framing、字节序和校验。'],['混淆矩阵','按真实类别与预测类别统计的表。','像按故障类型统计误报和漏报。']]},
  {recap:'上一章证明了一个小模型的功能闭环。本章把关注点从准确率转到资源预算：哪些 buffer 同时活着、数据搬运是否成为瓶颈、NPU delegate 是否真的被使用。', next:'下一章会以相机为例把这些预算放进实时流水线，观察 DMA、frame buffer、颜色格式和后处理如何共同影响结果。', focus:'端侧资源不是一个总 RAM 数字。权重可能放在 Flash，激活和 workspace 却要在推理峰值同时放进可访问的 RAM；PSRAM 的容量优势也不能消除 DMA、cache 和带宽约束。', workflow:'为每层列出输入、输出和 workspace 大小，计算生命周期重叠后的峰值，再测量实际 heap/arena。接着通过 trace 判断计算受限还是带宽受限，并检查 NPU 子图分区和 fallback。', decision:'把 Flash 当仓库、SRAM 当工作台、cache 当手边料盒、带宽当搬运工。工作台不够时先缩小分辨率、流式处理或复用 buffer，而不是盲目把一切挪到 PSRAM。', keywords:[['峰值活跃内存','某一时刻同时需要保留的所有 buffer 总量。','像任务切换时同时占用的栈与 DMA 描述符。'],['带宽','单位时间可搬运的数据量。','像 SPI/I2S 总线吞吐，快算力也会等数据。'],['PSRAM','通过外部接口连接的大容量 RAM。','像扩展仓库，容量大但访问和 DMA 规则不同。'],['Delegate','将支持子图交给专用加速器的后端机制。','像把支持的外设请求转交给协处理器。']]},
  {recap:'上一章完成了内存和带宽预算。本章把预算应用到摄像头流：一帧从 DMA 到模型再到事件，任何一步的格式或所有权错误都会稳定地产生错误结果。', next:'下一章会从视觉帧转向文本流，解释文本怎样经由 tokenizer 变成模型可消费的整数序列；二者都依赖严格的输入契约。', focus:'视觉部署的核心不是“调用 detector”，而是维护帧格式、stride、buffer 生命周期和坐标系。分类、检测与分割的输出不同，后处理必须保留 resize、crop、letterbox 的变换参数。', workflow:'相机 DMA 填充 frame buffer，完成事件后交给预处理；预处理完成颜色转换、ROI、resize、归一化；模型输出候选结果；decode、NMS 与时序平滑将结果变成业务事件，最后释放 buffer。', decision:'先用一张离线图逐阶段保存中间结果：原图、模型输入、raw output、NMS 后框、回映射结果。这样可区分模型问题、前处理问题和 buffer 并发问题。', keywords:[['Stride','同一行相邻像素数据在内存中的跨度。','像 DMA 行传输的实际步长，不总等于可见宽度。'],['Letterbox','保持比例缩放并填充边缘的 resize 方法。','像把不同长度 payload 装进固定帧但保留原比例。'],['NMS','去除高度重叠候选框的后处理。','像对重复中断事件做去重和合并。'],['Buffer ownership','规定谁可读写、何时归还 buffer 的规则。','像 DMA 和任务之间明确的资源所有权。']]},
  {recap:'上一章让图像按严格格式进入模型。本章处理文本的同一问题：模型不直接理解字符串，而只读取有词表和边界规则的 token id。', next:'下一章将说明生成模型为何会保留历史 token 的 K/V 状态，以及 context 增长怎样转化为 RAM 和带宽压力。', focus:'Tokenizer 是文本协议层。Unicode 规范化、BPE 或 SentencePiece、special token 和 chat template 一起决定“同一段人类文本”如何变成整数流；字符数无法代替 token 数。', workflow:'应用先组织 role/content 消息，chat template 插入控制 token，tokenizer 将字符串映射为 id，runtime 查 embedding 并分配位置。生成时还要为输入 token 和预计输出 token 留出 context budget。', decision:'把 chat template 视为模型 ABI。切换模型时同时切换 tokenizer、模板和 special token；不要把两个模型的 prompt 格式混用，也不要在模板后重复添加 BOS/EOS。', keywords:[['Vocabulary','token 到整数 id 的映射表。','像协议中的命令码表。'],['BPE','通过合并常见子串构建 token 的算法。','像把常见字节片段定义为更短的帧类型。'],['Special token','表示开始、结束、角色等控制含义的 token。','像帧头、帧尾和控制字。'],['Chat template','将消息列表格式化为模型训练期预期字符串的模板。','像不同设备各自的命令帧格式。']]},
  {recap:'上一章把 prompt 变成 token id。本章跟踪这些 id 在生成过程中的历史状态：为什么新 token 不必重算全部前缀，却要用内存保存 K/V。', next:'下一章会把 KV cache、模型权重和采样循环放入 LLM runtime，讨论请求取消、并发与 ESP32/Host 的责任边界。', focus:'KV cache 用空间换取 decode 速度。Prefill 一次处理 prompt 并写入 K/V；每一步 decode 只计算新 token 的投影，读取历史 K/V 做 attention，再把新状态追加到 cache。', workflow:'输入 token 先 prefill，按层和 head 写 K/V；采样得到下一个 token；token 转回文本并追加；重复直到 EOS、长度上限或取消。context、kv heads、head dim、dtype 和并发共同决定 cache 占用。', decision:'在选择模型前先计算 KV 预算，而非只看 GGUF 文件大小。长上下文、多个会话和高精度 cache 会迅速超出 RAM；GQA、滑窗或 cache 量化都是质量、容量和带宽之间的明确取舍。', keywords:[['Prefill','一次处理已有 prompt 并建立 KV cache 的阶段。','像先解析并缓存整段握手状态。'],['Decode','逐 token 生成并追加状态的阶段。','像持续接收增量事件的实时循环。'],['KV cache','保存历史 token 的 key/value 张量。','像缓存已解析报头，避免反复解析历史 payload。'],['GQA','多个 query head 共享较少 K/V head 的注意力设计。','像多个消费者共享一组只读索引以省内存。']]},
  {recap:'上一章量化了 KV cache 的资源含义。本章把它放进实际 runtime：谁加载模型、谁分配 context、谁负责流式返回，以及哪个控制器应当执行最终动作。', next:'下一章将继续压缩 LLM 权重，区分 GGUF 容器和块量化格式，并用可测的质量与资源指标选择部署产物。', focus:'LLM runtime 是请求调度器。它加载权重、创建 context、调度 prefill/decode、调用采样器并流式输出；模型只是它管理的一项资源，正如任务函数只是 RTOS 管理的一项工作。', workflow:'收到请求后先验证大小和策略，tokenize 并分配 context，执行 prefill，进入可取消的 decode loop，按温度/top-k/top-p 采样，流式发送 token，最后释放 cache 和会话状态。', decision:'ESP32 应负责传感器、帧协议、看门狗、白名单和确定性降级；Linux Edge Host 承载通用 LLM。任何来自模型的工具调用都必须经过 ESP32 本地的权限、范围和状态检查。', keywords:[['Context','一次推理会话持有的 token 和 KV 状态。','像一个连接会话的协议状态块。'],['Sampling','从 logits 选择下一个 token 的策略。','像从候选动作中按策略选择一个输出。'],['Streaming','边生成边发送输出而非等待完整回复。','像 UART 分段输出，改善首响应体验。'],['Cancellation','中止已失效请求并释放资源的机制。','像关闭 socket 后回收 DMA 与任务资源。']]},
  {recap:'上一章建立了 runtime 生命周期与主机/MCU 分工。本章继续处理模型文件本身：怎样把高精度权重装入 GGUF，并理解量化格式的真实空间和质量代价。', next:'下一章将从单一模型文件走到不同推理框架与后端，比较 CPU/GPU/NPU 分区、预编译与 fallback 的选择。', focus:'GGUF 是包含张量和 metadata 的容器；Q4、Q5、IQ 等是张量的块量化编码。将二者混为一谈会导致错误决策：同是 GGUF 文件，量化、词表、架构和 runtime 支持都可能不同。', workflow:'从可信的 FP16/BF16 或原始权重开始转换，写入 GGUF metadata，生成若干量化候选，使用固定 prompt 和版本测试质量、首 token、生成速度与峰值内存，再选择满足产品预算的版本。', decision:'不要重复量化已经低比特的模型；每次编码都会增加不可逆误差。对重要 tensor 保留较高精度，且在目标硬件上而非只在桌面 GPU 上做最终基准。', keywords:[['GGUF','GGML 系执行器使用的模型容器格式。','像固件镜像加可扩展的描述区。'],['Block quantization','按块共享 scale 等参数的低比特编码。','像压缩一批采样值并附带该批量程。'],['Weight-only','只量化权重、激活保持较高精度的策略。','像压缩固件常量而保留计算工作区精度。'],['mmap','将文件映射到虚拟内存按需访问。','像按页读取固件资源，减少一次性复制。']]},
  {recap:'上一章完成模型容器与权重量化选择。本章选择真正运行它的软件栈：runtime 如何把图交给 CPU、GPU 或 NPU，何时应该预编译，何时必须接受 fallback。', next:'下一章将不再凭感觉比较框架，而是建立 TTFT、tokens/s、p95、能耗等统一性能分析方法。', focus:'“端侧框架”由模型格式、runtime、backend 和 kernel 共同组成。llama.cpp、ONNX Runtime GenAI、MLC、ExecuTorch 的差异不只在 API，而在支持算子、编译时机、硬件分区、可观测性和包体积。', workflow:'加载模型后 runtime 查询 backend 能力，按节点或层划分子图，可能预编译为设备二进制，再在运行时分配 buffer、执行 kernel 和处理不支持节点的 fallback。每个分区边界都可能产生 copy。', decision:'先在 CPU 路径建立正确性与基准，再逐步启用 offload。若 NPU 只接管少量节点或产生频繁跨设备 copy，应优先简化图或选择更匹配的 runtime，而非只增加加速器层数。', keywords:[['Backend','把 runtime 请求映射到特定硬件的实现层。','像统一驱动接口下的具体外设驱动。'],['Offload','把部分层或子图交给加速器执行。','像将计算任务卸载给协处理器。'],['Partition','按支持能力切分图的过程。','像把任务按外设能力分配到不同总线。'],['Fallback','加速器不支持时转由默认实现执行。','像驱动缺失时回退到软件路径。']]},
  {recap:'上一章完成框架和 backend 选择。本章为这些选择建立证据链：把“感觉慢”拆成可测的请求阶段、资源计数和功耗，而不是只报一个 tokens/s。', next:'最后一章将把模型、runtime、设备 I/O、权限、OTA 和验收指标收束为一个可交付的端侧 AI 系统。', focus:'性能不是单一吞吐。TTFT 决定首次响应体验，inter-token latency 决定流式节奏，p95 反映尾部风险；同时还要看输入长度、并发、热状态、功耗和准确率。', workflow:'固定模型、量化、prompt、输出长度、线程、温度和供电条件；先 warm-up，再多次测量；把总时间拆为预处理、prefill、decode、网络和后处理；记录中位数、p95、内存与 joules/token。', decision:'遇到退化时先用 trace 定位阶段：TTFT 增大多与 prompt/preprocess 有关，decode 变慢常与 KV 带宽、线程或热降频有关。不要通过改变 prompt 或采样参数来“优化”不一致的比较。', keywords:[['TTFT','从请求发出到首个 token 返回的时间。','像首次中断到第一条有效状态消息的延迟。'],['p95','95% 请求不超过的尾延迟分位数。','像对最慢一小部分现场事件的时延预算。'],['Warm-up','正式测量前预热 runtime、cache 和频率。','像设备上电稳定后再测性能。'],['Joules/token','每生成一个 token 的能耗。','像每次执行控制动作的能量预算。']]},
  {recap:'上一章给出了可复现的性能证据。本章把前 14 天的模型、格式、资源、runtime 与硬件知识组合为系统设计，并用故障路径验证它能在真实现场工作。', next:'课程到此收束。后续迭代应从具体产品约束重新走一遍：先定义安全和验收，再选择模型与硬件，而不是从某个热门模型倒推产品。', focus:'端侧 AI 产品是分布式嵌入式系统：ESP32 保持与物理世界的实时联系和安全边界，Edge Host 提供重推理与模型更新能力，协议层把不确定的生成结果变成可审计、可拒绝的命令请求。', workflow:'需求先定义事件、时延、离线与安全约束；选择模型和格式；完成量化与 runtime 集成；定义 ESP32—Host 消息帧、鉴权和超时；压测正常与故障路径；最后把模型、配置、数据和报告版本化。', decision:'验收不应只写“回答正确”。它还应覆盖网络中断、Host 超时、模型越权建议、重复命令、OTA 回滚、内存不足和热降频。模型不可用时，确定性状态机必须仍能保持安全服务。', keywords:[['安全边界','必须由确定性组件强制执行的权限和范围限制。','像 GPIO/电机驱动前的硬件互锁与状态机。'],['降级','依赖不可用时切换到安全且有限的功能。','像 Wi-Fi 断开后保留本地控制逻辑。'],['OTA','远程更新固件或模型的交付机制。','像版本化的固件分区与回滚流程。'],['验收报告','记录功能、性能、能耗和故障测试条件的证据。','像量产前的整机测试和可追溯记录。']]},
];

function longFormLesson(day, profile) {
  return [
    section('承上：回顾与定位', profile.recap),
    section('从 ESP32 系统心智模型进入', `${profile.focus} 处理时不要把 AI 概念与已有嵌入式经验割裂：先确定生产者、消费者、buffer 所有权和失败后的可观测性，再讨论数学或框架。这样可以把抽象问题落回熟悉的任务、队列、DMA、cache 和协议边界。实际设计时请为每个边界写下一句不变量，例如“输入必须是何种 dtype”“谁负责释放帧”“失败时是否允许复用上一次结果”。这些不变量日后会成为单元测试、断言和现场日志的共同依据。`),
    section('核心机制：沿着数据和控制路径推演', `${profile.workflow} 阅读实现时建议像排查一条外设数据链一样逐点画出“数据从哪里来、在哪个阶段改写、由谁持有、何时释放”。任何无法回答的节点，都是需要补日志、断言或测试向量的位置。特别要区分配置期、初始化期和稳态运行期：配置错误多在启动时暴露，生命周期错误常在长时间运行或异常路径才出现，二者不能靠同一种测试覆盖。`),
    section('资源、时序与硬件边界', `${profile.decision} 对 ESP32 而言，正确性必须先于吞吐：确认 stack、heap、DMA 能力和 watchdog 影响后，再用测量决定是否缩减输入、复用 buffer、量化，或将重任务移到 Edge Host。把每个优化看成一次资源交换：减少内存可能增加计算，减少延迟可能增加功耗，转移到主机可能增加网络依赖。先写出产品不可突破的约束，再选择交换方向。`),
    section('工程化验证：把直觉变成证据', `为本章建立最小可复现实验：固定输入、版本和配置，记录中间张量或阶段时间，并人为构造一个边界样本。将 PC 结果、转换后结果和设备结果并排比较；若不一致，先检查数据契约和资源生命周期，再调整模型。验证记录应包含成功标准和失败信号：例如误差容差、最大峰值内存、允许的首响应时间，以及发生超限时该看哪一段日志。这样同一实验可以在模型、固件或 SDK 更新后重复执行。`),
    section('从流程图到实现检查单', `把本章流程图逐边翻译成检查单。每条边至少回答三件事：传递的数据格式是什么，哪一侧拥有该数据，发生超时或错误时下一状态是什么。对 ESP32 工程师而言，这与审查 ISR 到任务队列、DMA 到应用 buffer 的方式完全一致。只有把“正常路径”与“异常路径”同时写下，模型推理才会成为可维护组件，而不是一次性演示。`),
    section('本章收束：可迁移的设计习惯', `本章真正需要带走的不是某个命令，而是把模型视为受资源、接口和故障策略约束的软件组件。下一章会直接复用本章的输入输出契约与测量方法，因此请把实验中的 shape、dtype、版本、内存与延迟数据写入工程记录。复盘时应能回答：本章消除了上一章的哪项不确定性，又为下一章提供了哪份可验证的输入。这条叙事链能防止课程知识变成互不相干的工具清单。`),
  ];
}

days.forEach((day, index) => {
  const profile = longFormProfiles[index];
  Object.assign(day, curriculum[index], {
    readingMinutes: 10,
    keywords: profile.keywords.map(([term, definition, espAnalogy]) => ({term, definition, espAnalogy})),
    recap: profile.recap,
    nextPreview: profile.next,
    lesson: longFormLesson(day, profile),
  });

  const enrichment = globalThis.chapterEnrichment?.[day.n];
  if (enrichment) {
    const {analogy, ...details} = enrichment;
    Object.assign(day, details);
    day.analogyDetail = analogy;
  }
});

const escapeMarkup = value => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

function nav(n){return `<div class="nav">${n>1?`<a class="button secondary" href="day${String(n-1).padStart(2,'0')}.html">← Day ${n-1}</a>`:'<span></span>'}${n<15?`<a class="button" href="day${String(n+1).padStart(2,'0')}.html">Day ${n+1} →</a>`:'<a class="button" href="index.html">回到首页</a>'}</div>`}

function historyMarkup(day) {
  if (!day.history) return '';
  const milestones = day.history.milestones.map(item => `<article class="timeline-item">
    <div class="timeline-year">${escapeMarkup(item.year)}</div>
    <div class="timeline-content"><h3>${escapeMarkup(item.title)}</h3><p>${escapeMarkup(item.body)}</p><a href="${escapeMarkup(item.source.url)}" target="_blank" rel="noopener noreferrer">${escapeMarkup(item.source.label)} ↗</a></div>
  </article>`).join('');
  return `<section class="history-section" id="history"><div class="section-heading"><span class="section-kicker">从源头看今天</span><h2>历史发展脉络</h2></div><p class="section-lead">${escapeMarkup(day.history.intro)}</p><div class="timeline">${milestones}</div><div class="history-bridge"><strong>今天为什么仍然重要：</strong>${escapeMarkup(day.history.bridge)}</div></section>`;
}

function analogyMarkup(day) {
  const analogy = day.analogyDetail;
  if (!analogy) return `<section><h2>嵌入式类比</h2><p>${escapeMarkup(day.analogy)}</p></section>`;
  const illustration = analogy.illustration.map((item, index) => `<div class="analogy-piece">
    <span class="analogy-icon" aria-hidden="true">${escapeMarkup(item.icon)}</span>
    <strong>${escapeMarkup(item.label)}</strong>
    <span class="analogy-arrow" aria-hidden="true">${index === analogy.illustration.length - 1 ? '↔' : '→'}</span>
    <span>${escapeMarkup(item.mapsTo)}</span>
  </div>`).join('');
  return `<section class="analogy-section" id="analogy"><div class="section-heading"><span class="section-kicker">借熟悉的系统建立直觉</span><h2>类比图解</h2></div><div class="analogy-card"><div class="analogy-copy"><h3>${escapeMarkup(analogy.title)}</h3><p>${escapeMarkup(analogy.story)}</p></div><div class="analogy-illustration" aria-label="${escapeMarkup(analogy.title)}">${illustration}</div><p class="analogy-boundary"><strong>类比的边界：</strong>${escapeMarkup(analogy.boundary)}</p></div></section>`;
}

function processVisualMarkup(day) {
  if (!day.visual) return `<section><h2>流程图</h2><pre class="diagram">${escapeMarkup(day.diagram)}</pre></section>`;
  const loopNote = typeof day.visual.loop === 'string' ? `<p class="process-loop"><strong>循环 / 返回条件：</strong>${escapeMarkup(day.visual.loop)}</p>` : '';
  const steps = day.visual.steps.map((step, index) => {
    const payload = encodeURIComponent(JSON.stringify(step));
    return `<li class="process-step${index === 0 ? ' is-active' : ''}" data-index="${index}"><button type="button" class="process-node" data-process-select data-payload="${escapeMarkup(payload)}"${index === 0 ? ' aria-current="step"' : ''}><span class="process-icon" aria-hidden="true">${escapeMarkup(step.icon)}</span><strong>${escapeMarkup(step.label)}</strong><span>${escapeMarkup(step.data)}</span></button></li>`;
  }).join('');
  const first = day.visual.steps[0];
  return `<section class="visual-section" id="process"><div class="section-heading"><span class="section-kicker">让数据真正跑起来</span><h2>动态过程演示</h2></div><div class="process-visual" data-process-visual data-loop="${day.visual.loop === false ? 'false' : 'true'}" role="region" aria-label="${escapeMarkup(day.visual.title)}">
    <div class="process-heading"><div><h3>${escapeMarkup(day.visual.title)}</h3><p>${escapeMarkup(day.visual.description)}</p></div><button type="button" class="visual-toggle" data-process-toggle>暂停自动播放</button></div>
    <ol class="process-track" style="--step-count:${day.visual.steps.length}">${steps}</ol>
    <div class="process-detail"><div class="process-detail-copy"><span data-process-counter>步骤 1 / ${day.visual.steps.length}</span><h3 data-process-title>${escapeMarkup(first.label)} · ${escapeMarkup(first.data)}</h3><p data-process-action>${escapeMarkup(first.action)}</p></div><div class="process-insight"><span>观察点</span><p data-process-insight>${escapeMarkup(first.insight)}</p></div></div>
    ${loopNote}
    <div class="process-controls"><button type="button" class="button secondary" data-process-prev>← 上一步</button><div class="process-progress" aria-hidden="true"><span data-process-progress style="width:${100 / day.visual.steps.length}%"></span></div><button type="button" class="button secondary" data-process-next>下一步 →</button></div>
    <p class="sr-only" aria-live="polite" data-process-status></p>
  </div><details class="static-diagram" open><summary>查看静态全景图</summary><pre class="diagram">${escapeMarkup(day.diagram)}</pre></details></section>`;
}

function quizMarkup(day){
  return `<section class="quiz" aria-labelledby="quiz-title"><h2 id="quiz-title">核心测试</h2><p>完成 3 道单选题后提交；提交前不会显示答案。</p><form id="quiz-form" novalidate>${day.quiz.map((item,index)=>`<fieldset class="question-card" data-question="${index}"><legend>${index+1}. ${escapeMarkup(item.prompt)}</legend>${item.options.map((option,optionIndex)=>`<label class="quiz-option"><input type="radio" name="question-${index}" value="${optionIndex}"> <span>${escapeMarkup(option)}</span></label>`).join('')}<div class="answer-explanation" hidden></div></fieldset>`).join('')}<p class="quiz-feedback" id="quiz-feedback" role="status" aria-live="polite"></p><button class="button" type="submit">提交本章测试</button><button class="button secondary" id="retry-quiz" type="button" hidden>重新作答</button></form></section>`;
}
function gradeQuiz(quiz, answers){
  const correct=quiz.map((question,index)=>answers[index]===question.answer);
  return {score:correct.filter(Boolean).length,correct};
}
function renderDay(n){
  const d=days[n-1];
  document.title=`Day ${String(n).padStart(2,'0')} · ${d.t}`;
  document.querySelector('#app').innerHTML=`<header class="top"><div class="brand">端侧 AI · 15 天工程路线</div><a href="index.html">目录首页</a></header><main class="wrap day-layout"><aside class="toc panel"><span class="eyebrow">学习导航</span>${days.map(x=>`<a class="${x.n===n?'active':''}" href="day${String(x.n).padStart(2,'0')}.html">Day ${String(x.n).padStart(2,'0')} · ${escapeMarkup(x.t)}</a>`).join('')}</aside><article class="content" data-day="${n}"><div class="eyebrow">DAY ${String(n).padStart(2,'0')}</div><h1>${escapeMarkup(d.t)}</h1><p class="hero-sub">${escapeMarkup(d.s)}</p><p class="reading-time">建议阅读：约 ${d.readingMinutes} 分钟</p><section><h2>学习目标</h2><div class="callout">${escapeMarkup(d.goal)}</div></section><section><h2>本章关键词</h2><div class="table-scroll"><table class="keyword-table"><thead><tr><th>关键词</th><th>解释</th><th>ESP32 工程类比</th></tr></thead><tbody>${d.keywords.map(item=>`<tr><th scope="row">${escapeMarkup(item.term)}</th><td>${escapeMarkup(item.definition)}</td><td>${escapeMarkup(item.espAnalogy)}</td></tr>`).join('')}</tbody></table></div></section><section><h2>承上：回顾与定位</h2><p>${escapeMarkup(d.recap)}</p></section>${historyMarkup(d)}${analogyMarkup(d)}<section><h2>本章讲解</h2>${d.lesson.map(item=>`<h3>${escapeMarkup(item.title)}</h3><p>${escapeMarkup(item.body)}</p>`).join('')}</section>${processVisualMarkup(d)}<section><h2>代码或命令示例</h2><pre class="code"><code>${escapeMarkup(d.code)}</code></pre></section><section><h2>动手实验</h2><div class="callout">${escapeMarkup(d.lab)}</div></section><section><h2>工程陷阱</h2><div class="pitfall"><strong>避免误判：</strong>${escapeMarkup(d.pitfall)}</div></section>${quizMarkup(d)}<section><h2>延伸阅读</h2><ul class="reference-list">${d.references.map(ref=>`<li><a href="${escapeMarkup(ref[1])}" target="_blank" rel="noopener noreferrer">${escapeMarkup(ref[0])}（官方/原始资料）</a></li>`).join('')}</ul></section><section><h2>启下：下一章如何使用本章能力</h2><p>${escapeMarkup(d.nextPreview)}</p>${d.next?`<p>下一天：<a href="day${String(n+1).padStart(2,'0')}.html">Day ${n+1} · ${escapeMarkup(d.next)}</a></p>`:''}</section>${nav(n)}</article></main><footer><div class="wrap">离线可用 · 面向熟悉 ESP32、USB 与网络协议栈的嵌入式工程师</div></footer>`;
  bindQuiz(d);
  bindProcessVisuals();
  revealActiveNavigation();
}
function bindQuiz(day){
  const form=document.querySelector('#quiz-form');
  if(!form) return;
  const feedback=document.querySelector('#quiz-feedback');
  const retry=document.querySelector('#retry-quiz');
  form.addEventListener('submit', event=>{
    event.preventDefault();
    const selected=day.quiz.map((_,index)=>form.querySelector(`input[name="question-${index}"]:checked`));
    const missing=selected.findIndex(choice=>!choice);
    if(missing!==-1){
      feedback.textContent=`请先完成第 ${missing+1} 题。`;
      form.querySelector(`input[name="question-${missing}"]`).focus();
      return;
    }
    const result=gradeQuiz(day.quiz,selected.map(choice=>Number(choice.value)));
    selected.forEach((choice,index)=>{
      const question=day.quiz[index];
      const card=form.querySelector(`[data-question="${index}"]`);
      const correct=result.correct[index];
      card.classList.toggle('is-correct',correct);
      card.classList.toggle('is-incorrect',!correct);
      const answer=card.querySelector('.answer-explanation');
      answer.hidden=false;
      answer.innerHTML=`<strong>${correct?'回答正确。':'回答错误。'} 正确答案：${escapeMarkup(question.options[question.answer])}</strong><p>${escapeMarkup(question.explanation)}</p>`;
    });
    feedback.textContent=`本章得分：${result.score} / ${day.quiz.length}。请阅读每题解析，再决定是否重做。`;
    form.querySelector('button[type="submit"]').hidden=true;
    retry.hidden=false;
  });
  retry.addEventListener('click',()=>{
    form.reset();
    feedback.textContent='';
    form.querySelectorAll('.question-card').forEach(card=>{
      card.classList.remove('is-correct','is-incorrect');
      const answer=card.querySelector('.answer-explanation');
      answer.hidden=true;
      answer.textContent='';
    });
    form.querySelector('button[type="submit"]').hidden=false;
    retry.hidden=true;
  });
}

function bindProcessVisuals(){
  document.querySelectorAll('[data-process-visual]').forEach(root=>{
    const steps=[...root.querySelectorAll('.process-step')];
    if(!steps.length || root.dataset.bound === 'true') return;
    root.dataset.bound='true';
    const payloads=steps.map(step=>JSON.parse(decodeURIComponent(step.querySelector('[data-payload]').dataset.payload)));
    const counter=root.querySelector('[data-process-counter]');
    const title=root.querySelector('[data-process-title]');
    const action=root.querySelector('[data-process-action]');
    const insight=root.querySelector('[data-process-insight]');
    const progress=root.querySelector('[data-process-progress]');
    const status=root.querySelector('[data-process-status]');
    const toggle=root.querySelector('[data-process-toggle]');
    const loop=root.dataset.loop!=='false';
    const motionQuery=typeof matchMedia==='function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    let reduceMotion=motionQuery?.matches ?? false;
    let index=0;
    let timer=null;
    let inView=typeof IntersectionObserver!=='function';
    let autoPlaying=!reduceMotion;

    const updateToggle=()=>{
      if(reduceMotion){
        toggle.textContent='系统已减少动态效果';
        toggle.disabled=true;
        return;
      }
      toggle.disabled=false;
      const finished=!loop && index===steps.length-1;
      toggle.textContent=autoPlaying?'暂停自动播放':finished?'从头播放':'继续自动播放';
    };
    const render=(nextIndex,announce=false)=>{
      index=(nextIndex+steps.length)%steps.length;
      steps.forEach((step,stepIndex)=>{
        step.classList.toggle('is-active',stepIndex===index);
        step.classList.toggle('is-complete',stepIndex<index);
        const button=step.querySelector('[data-process-select]');
        if(stepIndex===index) button.setAttribute('aria-current','step');
        else button.removeAttribute('aria-current');
      });
      const payload=payloads[index];
      counter.textContent=`步骤 ${index+1} / ${steps.length}`;
      title.textContent=`${payload.label} · ${payload.data}`;
      action.textContent=payload.action;
      insight.textContent=payload.insight;
      progress.style.width=`${((index+1)/steps.length)*100}%`;
      if(announce) status.textContent=`已切换到步骤 ${index+1}：${payload.label}。${payload.action}`;
      updateToggle();
    };
    const clearTimer=()=>{
      if(timer!==null) window.clearInterval(timer);
      timer=null;
    };
    const schedule=()=>{
      clearTimer();
      if(!autoPlaying || !inView) return;
      timer=window.setInterval(()=>{
        if(!loop && index===steps.length-1){
          autoPlaying=false;
          clearTimer();
          updateToggle();
          return;
        }
        render(index+1);
      },3200);
    };
    const pauseForInspection=nextIndex=>{
      autoPlaying=false;
      clearTimer();
      render(nextIndex,true);
    };

    steps.forEach((step,stepIndex)=>step.querySelector('[data-process-select]').addEventListener('click',()=>pauseForInspection(stepIndex)));
    root.querySelector('[data-process-prev]').addEventListener('click',()=>pauseForInspection(index-1));
    root.querySelector('[data-process-next]').addEventListener('click',()=>pauseForInspection(index+1));
    toggle.addEventListener('click',()=>{
      if(!autoPlaying && !loop && index===steps.length-1) render(0);
      autoPlaying=!autoPlaying;
      updateToggle();
      schedule();
    });

    if(typeof IntersectionObserver==='function'){
      const observer=new IntersectionObserver(entries=>{
        inView=entries[0].isIntersecting;
        schedule();
      },{threshold:.2});
      observer.observe(root);
    }
    const handleMotionPreference=event=>{
      reduceMotion=event.matches;
      if(reduceMotion){
        autoPlaying=false;
        clearTimer();
      }
      updateToggle();
    };
    if(motionQuery){
      if(typeof motionQuery.addEventListener==='function') motionQuery.addEventListener('change',handleMotionPreference);
      else if(typeof motionQuery.addListener==='function') motionQuery.addListener(handleMotionPreference);
    }
    const staticDiagram=root.nextElementSibling;
    if(staticDiagram?.classList.contains('static-diagram')) staticDiagram.open=false;
    render(0);
    schedule();
  });
}

function revealActiveNavigation(){
  const navigation=document.querySelector('.toc');
  const active=navigation?.querySelector('.active');
  if(!active || navigation.scrollWidth<=navigation.clientWidth) return;
  navigation.scrollLeft=Math.max(0,active.offsetLeft-(navigation.clientWidth-active.offsetWidth)/2);
}

function homeMarkup(){return `<header class="top"><div class="brand">端侧 AI · 15 天工程路线</div><span>离线静态学习网站</span></header><main class="wrap"><section class="hero"><div class="eyebrow">EMBEDDED AI FIELD GUIDE</div><h1>从神经网络到可交付的端侧 AI 系统</h1><p>为熟悉 ESP32、USB、网络协议栈的嵌入式工程师设计。每天一个主题，沿着“模型 → 表示 → Runtime → Kernel → 内存/带宽 → 硬件 → 产品”逐层收束；每章用历史时间轴说明来路，用类比图解建立直觉，再让数据在可交互动画里真正跑一遍。</p><a class="button" href="day01.html">从 Day 1 开始 →</a></section><section class="grid">${days.map(d=>`<a class="card" href="day${String(d.n).padStart(2,'0')}.html"><span class="tag">DAY ${String(d.n).padStart(2,'0')}</span><h3>${escapeMarkup(d.t)}</h3><p>${escapeMarkup(d.s)}</p><span class="card-meta">约 ${d.readingMinutes} 分钟 · 历史 + 图解 + 动画</span></a>`).join('')}</section></main><footer><div class="wrap">15 天 · 15 个独立页面 · 无外部依赖 · 双击即可打开</div></footer>`}
function renderHome(){document.title='端侧 AI · 15 天工程路线';document.querySelector('#app').innerHTML=homeMarkup()}
const match=location.pathname.match(/day(\d{2})\.html$/i);
if(match&&document.querySelector('#quiz-form')){
  bindQuiz(days[Number(match[1])-1]);
  bindProcessVisuals();
  revealActiveNavigation();
}else if(match){
  renderDay(Number(match[1]));
}else{
  renderHome();
}
