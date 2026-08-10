(() => {
  Object.assign(globalThis.chapterEnrichment ||= {}, {
    1: {
      readingMinutes: 18,
      history: {
        intro: '神经网络并不是突然从“大模型”时代出现的。它经历了从逻辑化神经元、可学习的线性分类器，到多层网络的信用分配，再到 GPU 上的大规模表示学习这一条长线。今天在端侧工程里看到的张量、算子、自动微分和部署图，正是这条历史逐步沉淀出的分层接口。',
        milestones: [
          {
            year: '1943',
            title: '神经元第一次被写成可计算的逻辑单元',
            body: 'McCulloch 与 Pitts 用阈值化单元和连接网络描述神经活动，证明一组简单单元可以组合出逻辑行为。它没有现代训练算法，却奠定了“复杂功能可由大量统一小单元连接而成”的计算视角。',
            source: {
              label: 'McCulloch 与 Pitts 原始论文',
              url: 'https://www.cs.cmu.edu/~epxing/Class/10715/reading/McCulloch.and.Pitts.pdf',
            },
          },
          {
            year: '1958',
            title: '感知机把“连接”变成可由样本修正的权重',
            body: 'Rosenblatt 的感知机引入依据分类误差调整连接权重的机制，使神经网络从手工逻辑结构走向数据驱动学习。它主要解决线性可分问题，也让“模型参数是训练结果”成为后来网络的核心观念。',
            source: {
              label: 'Rosenblatt 感知机原始论文',
              url: 'https://doi.org/10.1037/h0042519',
            },
          },
          {
            year: '1986',
            title: '反向传播让隐藏层收到可计算的误差信号',
            body: 'Rumelhart、Hinton 与 Williams 展示了误差反向传播如何逐层计算导数并调整权重。隐藏单元不再依赖人工指定含义，而能为任务形成内部表示；这让多层非线性网络拥有了实用的统一训练方法。',
            source: {
              label: 'Nature 反向传播原始论文',
              url: 'https://www.nature.com/articles/323533a0',
            },
          },
          {
            year: '2012',
            title: 'AlexNet 把深层表示学习推入大数据与 GPU 时代',
            body: 'AlexNet 在大规模图像数据上训练深卷积网络，并用 GPU 承担密集张量计算。突破不只来自网络结构，还来自数据、并行计算和正则化共同到位；从此参数量、MAC、显存与吞吐成为同一套工程预算。',
            source: {
              label: 'AlexNet 原始论文',
              url: 'https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks',
            },
          },
          {
            year: '2019',
            title: '命令式张量程序与自动微分成为日常工具',
            body: 'PyTorch 论文总结了命令式前端、动态图与高性能张量后端的组合。研究者可以像普通程序一样写控制流，同时由系统记录运算关系并求梯度；今天导出前先确认动态图路径，也源自这种灵活性。',
            source: {
              label: 'PyTorch 系统原始论文',
              url: 'https://papers.neurips.cc/paper/2019/hash/bdbca288fee7f92f2bfa9f7012727740-Abstract.html',
            },
          },
        ],
        bridge: '历史留下的工程启示是：网络能力来自可组合的非线性单元，学习来自可追踪的误差链，而性能来自张量程序对硬件的有效映射。端侧阅读一个模型时，应同时沿“数值如何变换”“梯度曾如何塑造权重”“部署时 buffer 如何存活”三条线检查。',
      },
      analogy: {
        title: '一座会根据试音记录自动调节的连锁调音台',
        story: '想象一支乐队的多轨录音进入几排调音台。每排先按旋钮比例混合声道，再经过只允许某些信号通过的噪声门；末端监听员把成品与参考录音比较，并把“哪里偏响、哪里偏弱”的修正便签沿线路反向传回。重复试音后，旋钮位置就是学到的权重。',
        illustration: [
          {icon: '🎚️', label: '成排旋钮', mapsTo: '权重与偏置决定各输入对下一层的贡献'},
          {icon: '🚪', label: '噪声门', mapsTo: '激活函数加入非线性并改变可表达的边界'},
          {icon: '🎧', label: '参考监听', mapsTo: '损失函数把预测与目标压缩成可优化的误差'},
          {icon: '📝', label: '反向便签', mapsTo: '链式法则把输出误差分摊到每个参数'},
        ],
        boundary: '这个类比只帮助理解信号变换与误差反馈。真实网络的一个“旋钮”会参与高维批量运算，梯度是局部导数的精确组合而不是主观意见；类比也无法表示参数共享、卷积布局和数值精度造成的耦合。',
      },
      lesson: [
        {
          title: 'Shape 之外还要读 stride 与轴语义',
          body: '同样是 3072 个数，[1,3,32,32] 与 [1,32,32,3] 的物理含义完全不同；即使 shape 相同，转置后的 view 也可能不连续。层通常按约定的轴做归一化、卷积或归约，广播又可能让错误 shape “合法运行”。读网络时应给每一轴标注 N/C/H/W、单位和 dtype，并在边界打印 stride，避免把可执行误当作语义正确。',
        },
        {
          title: '非线性真正改变的是可组合的决策边界',
          body: '仿射层只做旋转、缩放和平移，多层仿射映射仍可折成一次矩阵乘法。ReLU 等激活把输入空间切成多个区域，不同区域使用不同线性关系，于是层叠才会增长表达能力。工程上还要关注激活的输出范围：大面积恒为零可能意味着输入偏移或坏初始化，过大数值则可能在低精度部署时饱和。',
        },
        {
          title: '损失是目标接口，梯度是逐层信用账本',
          body: '损失函数规定什么差异值得惩罚；链式法则再把总误差对每个中间量的敏感度逐层相乘。梯度为零不等于已经学好，可能是饱和激活、断开的计算图或数值下溢；梯度爆大也会使一次更新越过有效区域。训练实验应同时记录 loss、梯度范数与参数更新量，而不是只盯最终准确率。',
        },
        {
          title: '参数、MAC 与峰值激活回答三种不同问题',
          body: '参数量近似回答权重需要多少存储，MAC 粗略回答进行了多少乘加，激活生命周期才决定运行时工作台有多大。卷积的权重可很少，却可能产生巨大的特征图；逐元素算子几乎没有参数，仍会完整读写张量。端侧预算应按执行顺序画出存活区间，再把 workspace、对齐填充和 I/O buffer 加入峰值。',
        },
        {
          title: '用有限差分和中间张量验证“会算”',
          body: '为一个极小网络固定权重与输入，保存每层输出、损失和解析梯度；再让单个参数增加与减少一个很小的 ε，用两次损失差近似导数。两者不符时，常见原因是转置、批量归约、原地修改或激活边界。部署侧不需要反向传播，但这份 golden tensor 可继续验证导出、量化和 kernel 是否保持前向语义。',
        },
      ],
      visual: {
        title: '一拍训练脉冲：数据如何变成一次权重更新',
        description: '播放器每前进一步就点亮一个张量及其所有者；前半程信号向右流，后半程梯度向左回传，最后权重刻度发生细小移动。',
        steps: [
          {icon: '📥', label: '装载样本', data: 'x:[B,2]，y:[B,1]', action: '高亮 batch 轴，并把输入送入第一层', insight: '先确定 shape、dtype 与轴语义，后续计算才有共同契约'},
          {icon: '🧮', label: '仿射变换', data: 'z = xWᵀ + b', action: '连线按权重粗细汇入每个输出单元', insight: 'W 决定混合方向，b 平移边界；此步仍是线性的'},
          {icon: '⚡', label: '通过激活', data: 'a = ReLU(z)', action: '负值节点熄灭，正值节点保持亮度', insight: '非线性让多层组合无法被折成单一矩阵'},
          {icon: '🎯', label: '计算损失', data: 'L = mean((ŷ-y)²)', action: '预测点与目标点之间出现误差尺', insight: '标量损失把任务目标变成可求导的优化接口'},
          {icon: '↩️', label: '反传梯度', data: '∂L/∂W = ∂L/∂ŷ · …', action: '误差信号沿已记录的运算边反向传播', insight: '链式法则分配责任；shape 必须与对应参数一致'},
          {icon: '🔧', label: '更新参数', data: 'W ← W − η∇W', action: '旋钮移动一小格并刷新下一轮预测', insight: '学习率决定步长，更新后必须用新前向结果验证方向'},
        ],
        loop: '更新后的权重重新接收下一批样本；动画回到装载样本，并保留一条逐步下降的 loss 轨迹作为跨轮次状态。',
      },
    },
    2: {
      readingMinutes: 17,
      history: {
        intro: '训练与推理的分界，是随着网络从实验装置走向可复用软件逐渐清晰的。早期学习规则一边接收样本一边改权重；多层训练引入完整梯度状态，随后 Dropout、BatchNorm 等模块又让“训练态”和“推理态”出现不同语义。移动端 runtime 的出现，最终把部署产物收束为稳定前向图。',
        milestones: [
          {
            year: '1958',
            title: '感知机学习规则形成最小训练循环',
            body: '感知机依据预测错误修改连接权重，把样本、预测、误差、更新连接成闭环。虽然模型简单，它已经区分了“正在被样本改变的参数”和“使用当前参数给出判断”这两个时刻。',
            source: {
              label: 'Rosenblatt 感知机原始论文',
              url: 'https://doi.org/10.1037/h0042519',
            },
          },
          {
            year: '1986',
            title: '反向传播扩大了训练期状态与计算',
            body: '多层网络需要保留前向中间量，并在反向阶段计算各参数梯度。训练由此成为一条比推理更长的计算图：除了权重，还有激活、梯度和更新过程；部署只保留结果参数的理由随之明确。',
            source: {
              label: 'Nature 反向传播原始论文',
              url: 'https://www.nature.com/articles/323533a0',
            },
          },
          {
            year: '2014',
            title: 'Dropout 明确展示同一模块的两套运行语义',
            body: 'Dropout 在训练时随机丢弃单元，以降低共适应；测试时则使用完整网络的确定性近似。它使工程师必须显式切换模式，否则同一输入会因训练期随机行为而得到不稳定输出。',
            source: {
              label: 'Dropout 原始论文',
              url: 'https://www.jmlr.org/papers/v15/srivastava14a.html',
            },
          },
          {
            year: '2015',
            title: 'BatchNorm 增加了可学习参数之外的运行统计',
            body: 'Batch Normalization 在训练批次上计算统计量，并在推理时使用累积统计与已学习的缩放、偏移。checkpoint 因而不只是权重矩阵，还包含会改变推理结果的 buffer；导出前固定模式成为必要步骤。',
            source: {
              label: 'Batch Normalization 原始论文',
              url: 'https://proceedings.mlr.press/v37/ioffe15.html',
            },
          },
          {
            year: '2017',
            title: '轻量 runtime 把设备端职责收束为低延迟前向执行',
            body: 'TensorFlow Lite 的开发者预览面向移动和嵌入式设备，强调轻量、快速初始化与硬件加速。模型从训练框架转换为受限部署格式，训练状态、调试便利性与设备运行约束开始由工具链明确分工。',
            source: {
              label: 'TensorFlow Lite 官方发布说明',
              url: 'https://developers.googleblog.com/en/announcing-tensorflow-lite/',
            },
          },
        ],
        bridge: '今天的可靠部署不是简单调用 eval 后保存文件，而是建立训练 checkpoint、评估模型、导出图、优化图和设备二进制之间的可追溯关系。每个产物都有自己的状态与版本，任何一步折叠或替换节点，都要用固定输入证明它仍代表同一个任务函数。',
      },
      analogy: {
        title: '从风洞试飞到封装进无人机的飞控程序',
        story: '训练像在风洞中反复试飞：工程师改变参数，注入扰动，记录每次偏航并调整控制律。推理像量产无人机起飞，机上只带定型的控制表、传感器接口和必要状态，不会把整座风洞、试验日志与调参团队一同装进去。导出则是把试验配置审定为可烧录版本。',
        illustration: [
          {icon: '🌬️', label: '风洞与扰动', mapsTo: '数据批次、增强和 Dropout 等训练随机性'},
          {icon: '🧑‍🔧', label: '调参工程师', mapsTo: '优化器读取梯度并维护动量等更新状态'},
          {icon: '📋', label: '审定配置', mapsTo: 'eval 模式、checkpoint 选择与导出图冻结'},
          {icon: '🛩️', label: '机载飞控', mapsTo: '设备 runtime 只执行受验证的前向路径'},
        ],
        boundary: '飞控通常由明确物理模型和安全论证构成，而神经网络是统计模型，不能因“已定型”就视为覆盖所有现场条件。类比也不代表导出后图永远不变：常量折叠、量化与后端分区仍会改变数值和资源行为。',
      },
      lesson: [
        {
          title: '训练循环同时推进参数状态与优化器状态',
          body: '一次 step 不只是执行 forward 与减去梯度：Adam 等优化器还维护每个参数的历史统计，学习率调度器也有自己的步数。若只恢复权重却遗漏优化器和 epoch，续训轨迹会改变；而这些状态对纯推理毫无用途。工程上应把“可续训 checkpoint”和“可部署权重”作为两种产物命名、校验和归档。',
        },
        {
          title: '模式切换必须逐模块验证，不能只相信一个布尔值',
          body: 'eval 会递归切换 Dropout、BatchNorm 等模块的行为，但自定义层可能仍读取 training 标志或随机数。BatchNorm 的 running mean/variance 还可能因小批次、数据漂移而失真。导出前应对同一输入连续运行多次确认输出确定，并逐项检查随机算子、统计 buffer 和 requires-grad 状态是否符合预期。',
        },
        {
          title: '部署图是经变换后的新产物，不是 checkpoint 的复印件',
          body: '导出器可能内联函数、删除反向节点、折叠常量，把 Conv 与 BatchNorm 的参数合并，或依据 example input 固化控制流。这样能降低调度和内存开销，却也可能只捕获示例走过的分支。若模型包含依赖数据的循环、动态 shape 或自定义算子，应明确导出策略，不能假设源程序的所有路径都被保存。',
        },
        {
          title: '训练、验证与现场输入必须有三份边界说明',
          body: '训练集用于更新参数，验证集用于选择超参数和 checkpoint，测试或现场回放用于估计最终泛化；三者混用会让指标乐观。设备部署还增加传感器量程、颜色转换和采样时序等分布因素。应保存原始现场样本及标签规则，让导出后的模型在不启动训练代码的情况下也能重复跑同一套验收。',
        },
        {
          title: '用分层等价测试定位导出误差发生在哪一站',
          body: '先在源框架的 train/eval 两种模式比较，确认差异来自预期模块；再以固定输入比较 eval 模型与导出 runtime；最后把设备端原始 buffer 回传到 PC 重放。每层设置绝对与相对误差容差，并记录首个超差节点。这样能区分模式错误、图转换错误、量化误差和设备前处理错误。',
        },
      ],
      visual: {
        title: '一份 checkpoint 如何瘦身为设备前向图',
        description: '动画把训练态携带的对象画成一列可拆卸舱段；进入导出闸门后，只允许确定的前向语义和必要常量继续流向设备。',
        steps: [
          {icon: '🧺', label: '组成训练批次', data: 'samples → batch[B,…]', action: '样本被打乱、增强并组成一个 batch', insight: 'batch 既影响梯度估计，也可能影响训练态统计'},
          {icon: '🔄', label: '完成训练 step', data: 'loss → grad → optimizer state', action: '前向、反向与参数更新三个环依次转动', insight: '优化器动量和梯度属于续训状态，不属于推理输入'},
          {icon: '🔒', label: '切换评估语义', data: 'Dropout=off，BN=running stats', action: '随机开关停止闪烁，统计表被锁定', insight: '同一层在训练态与推理态可能执行不同公式'},
          {icon: '✂️', label: '导出并优化', data: 'checkpoint → inference graph', action: '梯度、优化器舱段脱离，常量节点被合并', insight: '导出会变换图，必须验证动态分支和折叠结果'},
          {icon: '📟', label: '设备只做前向', data: 'input → runtime → output', action: '固定图在目标 backend 上逐节点点亮', insight: '设备资源预算只覆盖权重、激活、workspace 与 I/O'},
          {icon: '🔍', label: '对齐固定向量', data: 'Δ = output_source − output_device', action: '两条输出曲线叠加并标出首个超差点', insight: '按层对比比只看最终类别更容易定位语义漂移'},
        ],
        loop: '新 checkpoint 只有在评估语义、导出图和设备输出三道校验都通过后，才替换上一版部署产物；失败则回到对应阶段而非直接重训。',
      },
    },
    3: {
      readingMinutes: 18,
      history: {
        intro: '模型格式的演化，本质上是在回答“如何把一个框架内部对象交给另一套软件和硬件”。早期模型常依赖训练代码才能解释，随后数据流图、统一算子语义和轻量二进制容器逐渐分离。格式没有消灭差异，而是把差异从隐蔽的源代码依赖变成可检查的 schema、opset 和 metadata。',
        milestones: [
          {
            year: '2014',
            title: 'Caffe 用声明式网络与权重文件推动模型复用',
            body: 'Caffe 将网络结构、训练配置与学习到的参数组织为可交换产物，并以层为扩展单元。它展示了模型可以脱离单个研究脚本被分享和部署，也暴露了框架专属层与格式绑定的问题。',
            source: {
              label: 'Caffe 原始论文',
              url: 'https://arxiv.org/abs/1408.5093',
            },
          },
          {
            year: '2015',
            title: 'TensorFlow 把训练与推理统一表达为数据流图',
            body: 'TensorFlow 白皮书用带状态的 dataflow graph 表达异构系统上的机器学习计算。节点、边、设备放置与张量流成为系统级接口，为后续图优化、序列化和跨设备执行提供了清晰基础。',
            source: {
              label: 'TensorFlow 2015 白皮书',
              url: 'https://research.google/pubs/tensorflow-large-scale-machine-learning-on-heterogeneous-distributed-systems/',
            },
          },
          {
            year: '2017',
            title: 'ONNX v1 将互操作写成公开的图与算子契约',
            body: 'ONNX v1 面向多个框架发布生产就绪版本，以开放图格式和算子集推动模型转移。导出器、转换器和 runtime 从此可以围绕共同 IR 协作，但每一方仍必须支持模型声明的域与 opset。',
            source: {
              label: 'ONNX v1 官方发布说明',
              url: 'https://engineering.fb.com/2017/12/08/ml-applications/onnx-v1-released/',
            },
          },
          {
            year: '2017',
            title: 'TensorFlow Lite 为移动与嵌入式运行收紧格式边界',
            body: 'TensorFlow Lite 面向小二进制、快速启动和设备加速，模型转换不再只为交换，也为受限 runtime 准备可直接读取的结构。支持算子、静态内存规划和硬件委托开始反向影响模型设计。',
            source: {
              label: 'TensorFlow Lite 官方发布说明',
              url: 'https://developers.googleblog.com/en/announcing-tensorflow-lite/',
            },
          },
          {
            year: '2023',
            title: 'GGUF 强化单文件、可扩展与快速加载',
            body: 'GGUF 作为 GGML 系执行器的模型格式，把张量与键值 metadata 放入可扩展的二进制容器，并取代早期 GGML、GGMF、GGJT 格式。它说明 LLM 部署不仅要保存权重，还要可靠携带架构和 tokenizer 等解释信息。',
            source: {
              label: 'GGUF 官方规范',
              url: 'https://github.com/ggml-org/ggml/blob/master/docs/gguf.md',
            },
          },
        ],
        bridge: '现代格式形成了两类互补路线：ONNX 一类 IR 强调通用计算图与算子语义，LiteRT、GGUF 等部署容器更贴近特定 runtime 的加载和资源约束。工程选择不应从扩展名开始，而应从目标后端支持矩阵、输入契约、可变 shape 与随模型必须携带的资产开始。',
      },
      analogy: {
        title: '跨国运输中的集装箱、舱单与港口规则',
        story: '模型像一批要跨国转运的精密设备。权重是箱内货物，计算图是装卸顺序和连接说明，metadata 是舱单，opset 是这一版作业规则。文件顺利抵港只代表箱子能被识别；目标港口还必须有对应吊具和工人，才能按规则真正完成装配。',
        illustration: [
          {icon: '📦', label: '集装箱', mapsTo: '二进制模型文件封装张量与结构'},
          {icon: '🗺️', label: '装卸路线图', mapsTo: '计算图规定节点依赖与张量流向'},
          {icon: '📑', label: '舱单与版本册', mapsTo: 'metadata、IR version、opset 和自定义域'},
          {icon: '🏗️', label: '港口吊具', mapsTo: 'runtime 与 backend 必须实现所需算子和 dtype'},
        ],
        boundary: '真实模型转换并非密封箱原样转运：转换器可能改布局、拆算子、折叠常量甚至量化张量。运输类比也无法表达浮点非结合性和动态控制流，因此“货物齐全”仍不能替代固定输入的数值比对。',
      },
      lesson: [
        {
          title: '把格式拆成语法、语义与随附资产三层',
          body: 'schema 只回答字段如何编码，算子规范才回答节点应算什么，tokenizer、标签表或归一化参数则可能存在 metadata 或外部文件中。解析成功只证明语法有效；缺少算子语义会导致 runtime 拒绝，缺少资产则可能运行却解释错输出。交付清单应逐层列出校验方式，而不是只记录一个模型文件哈希。',
        },
        {
          title: '读图时追踪值的来源、生命周期与可变性',
          body: 'Graph 的输入来自调用者，initializer 通常保存常量权重，中间 value 由节点产生；动态维度则用符号或未知值表达。拓扑顺序说明依赖，却不等于最终执行顺序，runtime 还会做内存复用和并行调度。检查模型时应标出每个输出由哪条路径产生、哪些维度可变，以及 shape 推断失败的位置。',
        },
        {
          title: 'IR、opset 与 runtime 版本是三把不同的锁',
          body: 'IR version 约束模型容器与图结构，opset 约束特定域中算子的签名和语义，runtime 版本决定实现覆盖。降 opset 不是改一个整数：若旧集合没有等价表达，转换器必须分解节点或直接失败。自定义 domain 还要求随部署提供实现。兼容表应记录三者组合及目标芯片，而非笼统写“支持 ONNX”。',
        },
        {
          title: '转换器会重写表达，必须审计差异清单',
          body: '转换可能把一个高层算子展开为子图、把常量计算提前、把 NCHW 换成 NHWC，或将权重存为不同 dtype。数学上等价的重写仍可能改变舍入、workspace 和 backend 分区。应在转换日志中保存新增、删除、替换的节点统计，并对关键中间张量建立名称映射，避免最终输出异常时只能盲猜。',
        },
        {
          title: '建立模型 ABI 测试包，而不只保存模型本体',
          body: '为每个模型版本附上输入名称、shape 范围、dtype、量纲、前后处理版本和数个 golden 样本；样本应包含正常值、边界 shape 与非法输入。CI 先做 schema/checker 校验，再由目标 runtime 加载并比较输出容差。若模型使用外部权重或 tokenizer 文件，还要校验相对路径与哈希，防止“主文件没变、配套资产已漂移”。',
        },
      ],
      visual: {
        title: '模型穿越五道格式闸门',
        description: '同一组测试数据伴随模型从训练框架走到目标 backend；每道闸门检查一种契约，任何红灯都会停在最接近根因的位置。',
        steps: [
          {icon: '🧩', label: '框架对象', data: 'modules + parameters + control flow', action: '展开实际执行过的模块与参数引用', insight: '源程序可以包含无法直接序列化的动态行为'},
          {icon: '🕸️', label: '导出计算图', data: 'nodes + edges + initializers', action: '控制路径被捕获，张量依赖连成有向图', insight: 'example input 可能决定捕获到的分支与 shape'},
          {icon: '📜', label: '核对规范', data: 'IR vN + domain/opset', action: '每个节点在版本册中寻找签名与语义', insight: '能解析文件不等于 runtime 支持所有算子'},
          {icon: '🔁', label: '转换部署格式', data: 'layout/dtype/metadata changes', action: '节点被折叠、拆分或换布局，差异表同步更新', insight: '转换是语义保持的重写，不是字节级复制'},
          {icon: '🧱', label: 'runtime 分区', data: 'supported subgraphs → backend', action: '支持节点流向加速器，其余节点标出回退路径', insight: '格式兼容之后仍有 kernel、copy 与内存约束'},
          {icon: '✅', label: '固定输入验收', data: 'golden input → Δoutput', action: '源端与目标端输出叠加，显示误差和首个分歧节点', insight: '数值证据才闭合“同一个模型”的交接声明'},
        ],
        loop: '当 runtime、opset、转换器或配套资产升级时，从受影响的闸门重新播放；golden 输入始终随模型同行，形成可回归的格式护照。',
      },
    },
    4: {
      readingMinutes: 19,
      history: {
        intro: '神经网络量化并非简单追随移动芯片而出现。早期数字与模拟神经硬件就必须面对有限字长；深度学习扩大模型后，研究从“有限精度能否工作”转向压缩、低比特训练与整数算子协同设计。今天的 PTQ、QAT、per-channel 和代表性校准，是数十年精度—存储—硬件权衡的工程化结果。',
        milestones: [
          {
            year: '1990',
            title: '有限字长被作为神经计算的系统设计问题',
            body: 'Neural Network Number Systems 比较了数字神经网络中的定点、浮点和指数数值表示。早期工作已经意识到，位宽选择同时影响电路成本、动态范围和计算误差，而不是单纯更换文件 dtype。',
            source: {
              label: 'Neural Network Number Systems 原始论文记录',
              url: 'https://stars.library.ucf.edu/scopus1990/1465/',
            },
          },
          {
            year: '2015',
            title: 'Deep Compression 把量化放进完整模型压缩流水线',
            body: 'Deep Compression 将剪枝、训练后权值共享式量化和 Huffman 编码组合，展示模型存储与内存访问可大幅削减。它强化了一个工程事实：压缩方案必须连同编码开销、解码路径和目标硬件一起评估。',
            source: {
              label: 'Deep Compression 原始论文',
              url: 'https://arxiv.org/abs/1510.00149',
            },
          },
          {
            year: '2016–2017',
            title: '低比特权重与激活进入训练过程',
            body: 'Quantized Neural Networks 在前向和反向计算中引入低精度权重与激活，并研究极低 bit 表示。量化不再只是模型训练完成后的包装，而可以在训练时显式暴露误差，让参数适应离散码本。',
            source: {
              label: 'Quantized Neural Networks 原始论文',
              url: 'https://www.jmlr.org/papers/v18/16-456.html',
            },
          },
          {
            year: '2018',
            title: '整数算术从输入贯穿到输出',
            body: 'Jacob 等人给出面向整数算术推理的量化方案与训练流程，同时量化权重和激活，并处理比例因子、zero-point 与累加。算法设计开始明确对接 ARM CPU 和整数加速器，而非只报告文件缩小。',
            source: {
              label: 'CVPR 整数推理原始论文',
              url: 'https://openaccess.thecvf.com/content_cvpr_2018/html/Jacob_Quantization_and_Training_CVPR_2018_paper.html',
            },
          },
          {
            year: '2020s',
            title: 'PTQ 校准成为端侧工具链的标准阶段',
            body: 'LiteRT 的全整数量化流程使用代表性数据估计输入与中间激活范围，并允许把模型 I/O 也设为整数。当前实践因而强调校准数据、算子覆盖和目标硬件实测，而不把 int8 标签当作性能保证。',
            source: {
              label: 'LiteRT 全整数量化官方教程',
              url: 'https://ai.google.dev/edge/litert/models/post_training_integer_quant',
            },
          },
        ],
        bridge: '发展脉络从“有限精度是否可用”走到“训练、格式、kernel 与芯片共同设计”。在 ESP32 一类平台上，正确问题不是浮点能压成几 bit，而是目标 ISA 支持什么量化轴、累加位宽与算子组合，以及校准样本是否覆盖真实传感器的长尾范围。',
      },
      analogy: {
        title: '把连续山景印成一张只有有限色阶的版画',
        story: '摄影师拥有层次丰富的原片，但印刷机每种颜色只有有限档位。制版师先观察整组照片的最暗与最亮区域，再决定每一格色阶覆盖多大范围；落在两格之间的颜色要舍入，超出纸张量程的高光和阴影只能压成同一个极值。分色制版则像为每个通道单独选量程。',
        illustration: [
          {icon: '🏔️', label: '原始山景', mapsTo: '连续或高精度的 float 权重与激活'},
          {icon: '🎨', label: '有限调色板', mapsTo: '整数码本及由 scale 决定的格距'},
          {icon: '🖼️', label: '分色版', mapsTo: 'per-channel 为不同输出通道选择量化参数'},
          {icon: '☀️', label: '高光溢出', mapsTo: '超出校准范围的数值被 clip 后不可恢复'},
        ],
        boundary: '图像色阶主要诉诸视觉感受，模型误差却会在多层算子中累积，并以任务指标而非“看起来相似”衡量。真实整数 kernel 还涉及偏置尺度、int32 累加、requantize 和硬件指令，版画类比无法说明这些算术约束。',
      },
      lesson: [
        {
          title: '先从可逆近似公式看清三个误差入口',
          body: '仿射量化用 q=round(x/scale)+zero_point，再把 q 限制到整数范围；反量化只得到格点上的近似值。误差分别来自格距造成的舍入、范围不足造成的饱和，以及统计范围被异常值拉宽后的分辨率浪费。实现时应分别统计量化 MSE、上下界命中率与零点映射，三者混成一个准确率数字很难定位。',
        },
        {
          title: '对称、非对称与 per-channel 是后端契约选择',
          body: '对称量化通常令 zero-point 为零，乘法路径更简单；非对称量化能更充分利用偏斜分布的整数范围。per-channel 可为每个输出通道设置 scale，常能缓解权重通道间幅度差异，却要求 kernel 知道量化轴并加载多组参数。选择前应查询目标 runtime 的 dtype、轴和算子限制，不能只凭 PC 精度。',
        },
        {
          title: '校准不是抽几张“典型图”，而是覆盖激活状态空间',
          body: '权重范围可以直接扫描，中间激活却由输入和前置层共同决定。代表性数据应覆盖光照、静默、饱和传感器、类别边界和设备噪声，并沿真实前处理进入模型。可按层查看直方图与裁剪比例，发现少量离群值是否支配 scale；若生产分布改变，原校准表也应视为需要重新验证的版本化资产。',
        },
        {
          title: '整数卷积仍需要高位累加与正确的尺度接力',
          body: 'int8 输入与 int8 权重的乘积通常进入更宽的累加器，偏置尺度应与输入 scale×权重 scale 对齐，输出再经 multiplier、shift 或等价操作 requantize。任何一处零点补偿、舍入规则或饱和次序不同，都可能造成系统偏差。用极小矩阵手算累加与边界值，是验证自定义 kernel 最有效的单元测试之一。',
        },
        {
          title: '把精度回归与性能验收放在同一张层级报告里',
          body: '先比较 float 与量化模型的最终任务指标，再对输出漂移最大的样本逐层定位 SQNR、余弦相似度或最大绝对误差；同时从 profile 检查是否出现 Quantize/Dequantize 岛和 float fallback。若文件缩小却执行更慢，问题可能是缺少整数 kernel、布局转换或频繁重标度，而不是量化算法本身失败。',
        },
      ],
      visual: {
        title: '浮点波形如何落入 256 个整数格',
        description: '动画先伸缩一把覆盖实测数据的标尺，再让每个浮点点吸附到最近格位；超界点会撞上红色挡板，随后整数流进入累加器。',
        steps: [
          {icon: '📊', label: '扫描分布', data: 'activation samples → min/max/histogram', action: '样本点铺开成直方图，长尾以另一颜色标出', insight: '激活范围必须由代表性真实输入估计'},
          {icon: '📏', label: '设置格距', data: 'scale，zero_point', action: '整数标尺平移并缩放到选定范围', insight: 'scale 控制分辨率，zero-point 决定真实零映射到哪个码'},
          {icon: '🧲', label: '舍入到格点', data: 'q = round(x/scale)+zp', action: '每个浮点点吸附到最近整数刻度', insight: '格内细节在此变成不可恢复的舍入误差'},
          {icon: '🧱', label: '执行饱和', data: 'q = clip(q,qmin,qmax)', action: '越界点撞到两侧红色挡板并重叠', insight: '饱和会把多个不同原值永久映成同一码'},
          {icon: '⚙️', label: '整数 kernel', data: 'int8 × int8 → int32 accumulate', action: '整数码进入乘加阵列，累加槽变宽', insight: '低位输入不表示所有中间计算都使用同一位宽'},
          {icon: '🔬', label: '重标度并比对', data: 'requantize → q_out；Δ vs float', action: '输出回到目标尺度，与 float 曲线叠加', insight: '同时检查数值误差、饱和率和真实 kernel 延迟'},
        ],
        loop: '若误差或饱和超限，播放器回到分布扫描，可切换校准样本、量化轴或范围策略；若性能不达标，则回到整数 kernel 检查 fallback 与转换边界。',
      },
    },
    5: {
      readingMinutes: 18,
      history: {
        intro: '算子的历史有两条交织路线：一条发明能表达任务的网络结构，另一条把这些数学结构变成可高效执行的 kernel。卷积网络从层级感受野走到端到端训练后，GPU 原语库把优化实现与框架分开，编译器又把融合、布局和调度自动化。现代 runtime 的职责正位于数学图与异构硬件之间。',
        milestones: [
          {
            year: '1980',
            title: 'Neocognitron 展示层级局部感受野与位移鲁棒性',
            body: 'Fukushima 的 Neocognitron 以层级结构处理视觉模式，并追求位置变化下的识别。它不是今天以反向传播训练的 Conv kernel，却把局部连接、特征层级和空间复用带入了卷积网络谱系。',
            source: {
              label: 'Neocognitron 原始论文',
              url: 'https://pubmed.ncbi.nlm.nih.gov/7370364/',
            },
          },
          {
            year: '1998',
            title: 'LeNet 把卷积、下采样与梯度训练连成应用系统',
            body: 'LeCun 等人的文档识别工作系统化展示了卷积网络及端到端梯度学习。算子不再是孤立公式，而是与输入几何、权重共享和任务后处理共同构成可运行流水线。',
            source: {
              label: 'LeNet 文档识别原始论文',
              url: 'https://bottou.org/papers/lecun-98h',
            },
          },
          {
            year: '2014',
            title: 'cuDNN 将深度学习原语做成可复用高性能库',
            body: 'cuDNN 提供面向 GPU 的卷积等优化原语，使框架不必随每代并行硬件重写全部 kernel。论文把深度学习算子库类比 BLAS，并展示算法选择、内存使用与硬件优化可以隐藏在稳定接口之后。',
            source: {
              label: 'cuDNN 原始论文',
              url: 'https://arxiv.org/abs/1410.0759',
            },
          },
          {
            year: '2018',
            title: 'TVM 把图融合与低层调度纳入统一编译搜索',
            body: 'TVM 同时处理高层算子融合、硬件原语映射与内存延迟隐藏，并用成本模型搜索低层优化。kernel 选择从厂商手写库扩展到可针对 CPU、GPU、FPGA 和加速器生成的调度空间。',
            source: {
              label: 'TVM OSDI 原始论文',
              url: 'https://www.usenix.org/conference/osdi18/presentation/chen',
            },
          },
          {
            year: '2020s',
            title: 'Execution Provider 让同一图按能力切给异构后端',
            body: 'ONNX Runtime 以 Execution Provider 接入不同硬件实现，并把支持的节点或子图分配给相应后端。现代部署因此不只问“有没有 NPU”，还要检查领取了哪些节点、边界搬运多少数据以及哪些路径回退 CPU。',
            source: {
              label: 'ONNX Runtime Execution Providers 官方文档',
              url: 'https://onnxruntime.ai/docs/execution-providers/',
            },
          },
        ],
        bridge: '从结构发明到 kernel 库，再到图编译与异构分区，核心问题始终是保持算子语义的同时减少无效搬运。端侧优化应从具体 shape、layout、量化参数和支持矩阵出发；峰值 TOPS 只有在子图足够完整、数据已位于正确内存时才可能兑现。',
      },
      analogy: {
        title: '同一份菜谱如何落到一间拥挤的专业厨房',
        story: '算子像菜谱中的“切丁、翻炒、收汁”，只规定输入、动作和成品；kernel 是某位厨师在特定灶台上的具体手法。食材按取用顺序摆盘是 layout，把切丁和腌制合在同一案板上是 fusion，把一大锅拆成刚好放进炒锅的小份则是 tiling。菜谱没变，出餐速度可以相差数倍。',
        illustration: [
          {icon: '📖', label: '标准菜谱', mapsTo: '算子名称、属性、输入输出和数值语义'},
          {icon: '👨‍🍳', label: '厨师与灶台', mapsTo: '针对 CPU、GPU、NPU 的不同 kernel 实现'},
          {icon: '🥬', label: '备菜托盘', mapsTo: 'NHWC/NCHW、连续性、对齐和 buffer 所在内存'},
          {icon: '🍳', label: '分锅快炒', mapsTo: 'tiling 让工作集适配寄存器或 cache'},
        ],
        boundary: '厨房类比不能表达并行线程、向量指令和浮点舍入，也容易让人误以为融合总是有利；真实 fusion 会受量化尺度、分支复用和 backend 支持限制，数值等价与性能收益都必须用目标硬件验证。',
      },
      lesson: [
        {
          title: '算子契约包含属性、边界与数值约定',
          body: 'Conv 不只是一条求和公式，还包括 stride、padding、dilation、groups、权重维度顺序和输出 shape 规则；Softmax 还必须指定归一化 axis 与稳定计算方式。两个 runtime 都声称支持同名算子，也可能只覆盖部分 dtype 或属性组合。模型接入时应从真实节点导出契约表，并用非对称 shape 与边界输入验证。',
        },
        {
          title: '同一 Conv 可以对应多种算法与 workspace 交换',
          body: '直接卷积、im2col+GEMM、Winograd 或硬件专用路径具有不同适用区间。im2col 便于复用成熟矩阵乘 kernel，却可能展开出大 buffer；Winograd 可减少部分乘法，但对尺寸、数值精度和变换开销敏感。backend 的算法选择必须连同实际 shape、可用 workspace 和量化模式测量，不能只比较理论 MAC。',
        },
        {
          title: 'Layout 决定相邻数据是谁，也决定向量单元吃得顺不顺',
          body: 'NCHW 与 NHWC 改变通道和空间维在内存中的邻接关系；即使维度名称一致，stride 不连续也可能触发隐式 copy。某个 kernel 偏好通道连续，另一个加速器却要求块化布局，边界转换便会整张读写激活。profile 时应把 transpose、reorder 和 memcpy 当作正式节点计时，而非归入无法解释的框架开销。',
        },
        {
          title: 'Tiling 的目标是让重复使用发生在最快的存储层',
          body: 'GEMM 将 M、N、K 分块后，把小块输入和权重装入寄存器或 cache，多次 MAC 后才写回；tile 过大会溢出工作集，过小又增加循环与边界开销。SIMD 还要求对齐，并为尾部元素处理 mask 或标量路径。在 ESP32 上应测试真实地址、对齐和 DMA 来源，因为桌面数组的理想连续性不会自动出现。',
        },
        {
          title: '融合与加速器分区要用“少落地几次”来验收',
          body: 'Conv、Bias、ReLU 融合可让中间值留在寄存器或片上 SRAM，但若某输出还被旁路节点消费，或相邻算子的量化尺度不兼容，融合可能受限。NPU 子图两侧同样会产生同步、布局变化和 copy。验收报告应列出融合前后节点、分区边界、搬运字节与端到端时间，避免用单个 kernel 加速比替代系统收益。',
        },
      ],
      visual: {
        title: 'Conv–BN–ReLU 如何落成一次分块执行',
        description: '动画从抽象图逐层下钻到内存：先核对算子契约，再选择融合与布局，最后让 tile 在片上缓冲区中循环装载、计算和写回。',
        steps: [
          {icon: '🧾', label: '展开算子契约', data: 'Conv(stride,pad,groups) → BN → ReLU', action: '属性卡附着到节点，输入输出 shape 同步变化', insight: '同名算子只有属性、axis 与 dtype 都匹配才算语义兼容'},
          {icon: '🧬', label: '判断可融合区', data: 'Conv + folded BN + activation', action: '可融合节点收拢为一个彩色子图，旁路消费者保留边界', insight: '融合依赖图结构、量化尺度与 backend 能力'},
          {icon: '🧱', label: '选择内存布局', data: 'NCHW ⇄ NHWC / blocked', action: '张量小方格重新排列，并显示一次转换字节数', insight: '布局能帮助 kernel，也可能在边界制造完整张量 copy'},
          {icon: '📥', label: '装载一个 tile', data: 'input tile + weight tile → local SRAM/cache', action: '一小块数据从慢内存滑入片上工作区', insight: 'tile 尺寸决定复用率、cache 命中与 workspace 峰值'},
          {icon: '⚙️', label: '乘加并就地激活', data: 'acc += A×B；acc=max(acc,0)', action: 'SIMD lanes 并行闪动，累加后直接经过激活门', insight: '中间结果不落到慢内存是融合的主要收益'},
          {icon: '📤', label: '写回与 profile', data: 'output tile；bytes/time/fallback', action: '结果只写回一次，计数器累加搬运量和耗时', insight: '端到端证据必须包含 copy、同步和未接管节点'},
        ],
        loop: 'tile 沿输出空间循环直到完成；切换 layout、tile 大小或 backend 时，动画重置计数器并并排保留上一轮的字节数、workspace 与延迟。',
      },
    },
  });
})();
