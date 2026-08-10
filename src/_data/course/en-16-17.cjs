module.exports = [
  {
    "n": 16,
    "t": "Large-Scale LLM Infrastructure: From Chips to Clusters",
    "s": "Place one training iteration and one online request back inside real data movement, parallel topology, and serving SLOs",
    "goal": "Build one cost model spanning registers, HBM, scale-up links, networks, storage, and schedulers. Explain what DP, TP, PP, CP, EP, and FSDP/ZeRO partition, what each moves, and where it belongs. Judge training and serving designs with TTFT, ITL, goodput, and tail latency rather than substituting peak FLOPS or project names for system analysis. Fast-moving project facts were verified on 2026-08-11.",
    "concept": [
      "Data-movement hierarchy and topology affinity",
      "DP, TP, PP, CP, EP, and fully sharded parallelism",
      "Checkpoints, recovery, and training goodput",
      "KV cache, continuous batching, and prefix caching",
      "Prefill/decode disaggregation, control planes, and SLOs"
    ],
    "analogy": "Treat the cluster as a network of printing plants across cities: compute is press speed, but moving paper and work-in-progress among shelves, rooms, campuses, and cities determines whether orders finish on time.",
    "diagram": "Request → admission/tokenize → KV-aware route → Prefill mesh\n                                              │\n                                              └─ KV blocks ─→ Decode mesh → token stream\nTraining: batches → DP ranks ─ TP/PP/CP/EP → sharded gradient reduction → checkpoint\nHierarchy: register/SRAM ↔ HBM ↔ scale-up fabric ↔ scale-out network ↔ local/remote storage",
    "code": "# CPU-only: two-process collective microscope\npython -m torch.distributed.run --standalone --nproc_per_node=2 collective_lab.py \\\n  --backend gloo --sizes 1024,1048576,16777216 --warmup 10 --iters 50\n\n# Report p50/p95 for every collective, not one best sample\n# all_reduce: every rank receives the reduced result\n# all_gather: every rank receives the complete shard set\n# reduce_scatter: reduce, then retain one result shard per rank",
    "lab": "Build a two-process Gloo collective microscope. Pin the machine, PyTorch version, thread count, and process placement. For 1 KiB, 1 MiB, and 16 MiB tensors, warm up ten times and measure at least fifty all-reduce, all-gather, and reduce-scatter calls. Use barriers to align ranks, but exclude barrier time from the operation itself; report p50/p95, effective bandwidth, and bytes contributed per rank. Predict the startup-latency region for small messages and bandwidth-limited region for large ones before interpreting results. State why CPU Gloo numbers cannot be extrapolated to NCCL, RDMA, or multi-node GPUs. As an optional extension, hold model, prompts, and concurrency fixed in vLLM and record TTFT, ITL, output throughput, and prefix hits together—never tokens/s alone.",
    "pitfall": "Do not place Kubernetes, NCCL, vLLM, and FlashAttention in one horizontal 'which is faster' ranking: they occupy control-plane, communication, runtime, and kernel or algorithm layers. Do not use a vendor peak or a single README result to predict your cluster. Without model, dtype, sequence distribution, concurrency, topology, power, and SLO, the comparison has no valid boundary.",
    "questions": [
      "Why does FSDP2 need both all-gather and reduce-scatter around forward and backward computation?",
      "Why is tensor parallelism usually kept inside a fast scale-up interconnect domain?",
      "When can prefill/decode disaggregation become slower because of KV transfer and extra queues?"
    ],
    "next": "On-Device LLM Infrastructure: Adapting Cloud Lessons to Device Constraints",
    "lesson": [
      {
        "title": "Draw the data-movement hierarchy before discussing compute",
        "body": "A kernel's hottest scalar may remain in a register, while a thread block reuses tiles in on-chip SRAM or shared memory. Weights, activations, and KV cache primarily occupy HBM. Cross-accelerator tensors traverse PCIe or a dedicated scale-up fabric; cross-node collectives traverse NICs and switches; checkpoints finally reach local NVMe or remote object and parallel file systems. Moving outward generally offers more capacity but raises latency, energy, and contention. Arithmetic intensity asks how much computation is performed for every byte moved, and attention, MoE dispatch, and embedding lookup can have radically different limits. A useful engineering diagram labels every edge with bytes, frequency, contenders, and topology instead of saying only that the GPU is fast. HBM capacity determines whether state fits, HBM bandwidth caps many token-by-token kernels, the intra-node fabric shapes TP collectives, and the scale-out network shapes DP, EP, and recovery. Peak FLOPS becomes useful throughput only when operands arrive in time, kernel shapes use the machine well, and communication can be hidden."
      },
      {
        "title": "Six parallel dimensions cut different axes of the same training graph",
        "body": "Data parallelism replicates the model, partitions the input batch, and reduces gradients after backward. Tensor parallelism cuts matrices or attention heads inside a layer, so each layer may need an all-reduce or reduce-scatter/all-gather pair; that fine-grained critical path prefers a low-latency, high-bandwidth scale-up domain. Pipeline parallelism assigns contiguous layers to stages, moves boundary activations, and feeds microbatches through the pipeline; bubbles and stage imbalance are its central costs. Context parallelism partitions a long sequence and exchanges the keys, values, or intermediates required for attention. Expert parallelism distributes MoE experts and moves routed tokens with all-to-all dispatch and combine; routing skew lets a few experts stall everyone. FSDP/ZeRO partitions parameters, gradients, and optimizer states: gather parameters for computation, reduce-scatter gradients afterward, then release full replicas. These are not mutually exclusive toggles. Production jobs combine dimensions in a device mesh, but every dimension adds layout transitions, failure surface, and tuning choices."
      },
      {
        "title": "Measure training efficiency as useful completed work",
        "body": "Training data travels from object storage through host caches and loaders to accelerators, then through forward, backward, and optimizer updates. Device utilization alone misses input starvation, recomputation, blocked communication, and replay after failures. Goodput counts samples or tokens that contribute to convergence within the target time and correctness policy. Checkpoint too frequently and writes pause or contend with training; checkpoint too rarely and a failure destroys more progress. A distributed checkpoint must encode the logical coordinates of shards, dtypes, model and optimizer versions, and use temporary objects, checksums, and an atomic commit so a partial write is never advertised as recoverable. Recovery also needs the data cursor, random-number state, schedule state, and a policy for a changed world size. A successful save is not recovery evidence. Periodically restore into an isolated job, execute several steps, and measure recovery-time objective, read hotspots, and resharding cost."
      },
      {
        "title": "Online inference has two phases, two latency families, and growing state",
        "body": "Prefill processes prompt tokens in parallel and often forms large matrix multiplies; it strongly influences Time To First Token. Decode emits a small number of tokens per iteration but repeatedly reads layer weights and historical keys and values; memory bandwidth and scheduling overhead often dominate, while Inter-Token Latency determines streaming feel. KV cache avoids recomputing attention for old tokens, but capacity grows with concurrency, context length, layers, KV heads, head dimension, and dtype. PagedAttention maps a logically contiguous sequence to physical blocks, reducing external fragmentation and enabling controlled sharing. Prefix caches reuse identical leading blocks, but hits depend on normalized templates, tenant isolation, and routing locality. Continuous batching admits and retires requests at decode iterations, eliminating empty slots left by static batches while turning queuing, preemption, and fairness into first-class decisions. Throughput must be reported under a TTFT/ITL SLO; tokens produced after a request's deadline are not useful serving capacity."
      },
      {
        "title": "Prefill/decode disaggregation is conditional optimization, not free acceleration",
        "body": "Prefill tends to be compute-intensive, while decode tends to be memory-bandwidth and small-step scheduling intensive. Independent pools can reduce interference, scale the phases separately, and use different parallel layouts for long prompts and sustained generation. A scheduler chooses a decode owner using load, prefix or KV location, and the request SLO, then invokes a prefill mesh only when useful. Prefill produces potentially large KV blocks that must be transferred into space reserved at the decode worker. The extra network hop, serialization, transfer, reservation, and queues all enter TTFT. A short prompt, a hot prefix already at decode, a congested fabric, or KV bytes more expensive than recomputation can make disaggregation slower. The right policy chooses colocated or separated execution per request and measures the crossover. Failure semantics matter too: if decode dies after prefill, decide whether KV is reusable, recomputed, or discarded; deduplicate retries by request ID and define when in-flight blocks become reclaimable."
      },
      {
        "title": "Keep the control plane, runtime, communication libraries, and kernels in their layers",
        "body": "Kubernetes and its gateway or scheduling extensions declare resources, place replicas, probe health, and expose traffic: they are control-plane foundations. llm-d and Dynamo assemble KV-aware routing, disaggregated serving, and tiered caching into distributed serving data planes. vLLM, SGLang, and TensorRT-LLM are model-serving runtimes that own queues, batches, KV state, and execution loops. PyTorch FSDP2/DTensor, Megatron Core, and DeepSpeed primarily provide training graph partitioning and parallel mechanisms. NCCL/RCCL execute collectives; DeepEP targets MoE token dispatch; NIXL abstracts movement across memory tiers and nodes; Triton and FlashAttention sit closer to kernel and algorithm implementation. Adjacent layers integrate, but shared claims about LLM performance do not make them peers. Investigate a regression by following one request trace through queueing, runtime scheduling, collectives, kernels, and link counters before replacing an entire stack."
      },
      {
        "title": "Close capacity planning with SLOs, observability, and failure drills",
        "body": "At ingress, record input and output token counts, model and tokenizer versions, sampling parameters, tenant, deadline, and trace ID. The router records its selection reason, prefix hit, and queue estimate. Workers expose TTFT, per-token ITL, batch width, KV block use, preemption, OOM, and errors. Network telemetry covers collective or point-to-point bytes, congestion, and retries. Capacity models must separate short chat, long-context, batch, and multi-turn traffic because average arrival rate hides the impact of long prompts on prefill and KV. Load tests should replay arrival processes and length distributions, then report p50, p95, p99, and SLO goodput. Drills should kill workers, throttle networks, fill KV capacity, corrupt a checkpoint shard, and roll through an incompatible runtime change. Peak benchmark numbers become operational evidence only when the service rejects, degrades, rolls back, and leaves an auditable trace under these conditions."
      }
    ],
    "references": [
      ["Megatron-LM: parallel training of large Transformers", "https://arxiv.org/abs/2104.04473"],
      ["ZeRO: eliminating memory redundancy in data parallelism", "https://arxiv.org/abs/1910.02054"],
      ["The vLLM and PagedAttention paper", "https://arxiv.org/abs/2309.06180"]
    ],
    "quiz": [
      {
        "prompt": "What is the characteristic communication pair around layer computation in FSDP2/ZeRO-style full sharding?",
        "options": ["Broadcast inputs before forward, then write only to disk", "All-gather parameters for computation, then reduce-scatter gradients after backward", "Run expert all-to-all for every token", "Run a single all-reduce only when the job ends"],
        "answer": 1,
        "explanation": "Parameters remain sharded across ranks at rest. Computation needs a usable gathered view, and gradients produced by backward are reduced and repartitioned. Prefetch and release timing can change, but the data dependency remains."
      },
      {
        "prompt": "Why is tensor parallelism normally confined to a fast local interconnect domain?",
        "options": ["TP performs no communication", "TP supports convolutional networks only", "Frequent in-layer collectives put link latency and bandwidth directly on every layer's critical path", "Scale-out networks cannot carry floating-point values"],
        "answer": 2,
        "explanation": "TP divides one layer among ranks, so partial results must be combined repeatedly. Crossing a slower network repeats its cost through many layers. This is a critical-path cost, not a protocol restriction."
      },
      {
        "prompt": "Which case is most likely to make prefill/decode disaggregation slower than colocation?",
        "options": ["A long prompt, idle fast KV fabric, and badly imbalanced phases", "A short prompt, a prefix already hot at decode, and a congested KV-transfer link", "Pools that can scale independently", "Different optimal batch shapes for the two phases"],
        "answer": 1,
        "explanation": "The short prompt leaves little prefill work, while the hot prefix removes recomputation. Extra queues, hops, and KV transfer can exceed any phase-specialization benefit, so policy should keep this request colocated."
      }
    ],
    "readingMinutes": 28,
    "keywords": [
      {"term": "Goodput", "definition": "Useful work completed within correctness and SLO constraints, rather than raw peak throughput.", "espAnalogy": "Count only CRC-valid frames delivered before their deadline, not late or corrupt traffic."},
      {"term": "Collective", "definition": "A coordinated data exchange or reduction across ranks, such as all-reduce or all-gather.", "espAnalogy": "Like a multi-node bus transaction whose participants, topology, and byte volume all determine cost."},
      {"term": "KV cache", "definition": "Stored attention keys and values for prior tokens, allowing decode to avoid recomputing old context.", "espAnalogy": "High-speed session state whose capacity and lifetime must be explicitly controlled."},
      {"term": "PD disaggregation", "definition": "Placing prefill and decode in worker pools that can be scheduled and scaled independently.", "espAnalogy": "Like separating batch preprocessing and real-time tasks onto cores, while still paying queue and copy costs."}
    ],
    "recap": "Day 15 closed the model, runtime, ESP32 safety boundary, release, and acceptance loop into a shippable edge system. It is a phase-integration chapter rather than the end: when one model must train at greater scale and serve many simultaneous requests, the single-machine memory and latency ledger must expand into a cluster ledger for movement, parallelism, and SLOs.",
    "nextPreview": "The next chapter carries I/O awareness, paged state, topology awareness, and operability back to devices, but tests each idea against batch-one traffic, unified memory, energy, and thermal limits instead of copying cluster defaults.",
    "history": {
      "intro": "Large-scale LLM infrastructure was not produced by faster GPUs alone. The chip track continually changes the ratios among compute, memory, and interconnect; the system track uses sharding, I/O-aware algorithms, and request scheduling to turn that hardware into a usable service. Read the tracks together.",
      "tracks": [
        {
          "title": "Chips and interconnects",
          "milestones": [
            {"year": "2012", "title": "GPU deep learning demonstrates the scaling value of throughput computing", "body": "AlexNet used GPUs to train a large convolutional network and helped establish general-purpose parallel accelerators as the deep-learning workhorse. The systems problem quickly expanded from one kernel to feeding and synchronizing many devices.", "source": {"label": "Original AlexNet paper", "url": "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks.pdf"}},
            {"year": "2017", "title": "TPUs and Tensor Cores create dedicated matrix-multiply paths", "body": "The TPU paper shows a systolic array and on-chip buffers organized around neural inference. At the same time, Tensor Cores accelerated mixed-precision matrix operations, pushing models and kernels to co-design around specialized paths.", "source": {"label": "Original TPU paper", "url": "https://arxiv.org/abs/1704.04760"}},
            {"year": "2018", "title": "Mixed precision turns number format into a systems lever", "body": "FP16 computation with FP32 accumulation and loss scaling reduced bandwidth and storage pressure while preserving useful training behavior. BF16, FP8, and quantization continue the model-hardware co-design direction.", "source": {"label": "Original mixed-precision training paper", "url": "https://arxiv.org/abs/1710.03740"}},
            {"year": "2020s", "title": "HBM and scale-up links jointly define an accelerator domain", "body": "Single-device capacity and bandwidth cannot independently solve very large models. HBM plus intra-node fabrics let accelerators share fine-grained layer work at lower cost, making topology affinity a parallel-planning input.", "source": {"label": "Official NCCL user guide", "url": "https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/overview.html"}},
            {"year": "Today", "title": "Rack-scale AI systems co-design fabric, power, and cooling", "body": "Accelerators are no longer interchangeable PCIe cards. In-rack networks, switches, CPUs, storage tiers, power, and cooling bound sustainable throughput together, so comparisons must be tied to a workload and complete configuration.", "source": {"label": "Official MLPerf Training results and rules", "url": "https://mlcommons.org/benchmarks/training/"}}
          ]
        },
        {
          "title": "Parallel algorithms and serving systems",
          "milestones": [
            {"year": "2012", "title": "Parameter servers decouple model state from workers", "body": "DistBelief demonstrated parameter services and asynchronous methods for training deep networks across many machines, establishing an early frame for data parallelism, fault handling, and cluster scheduling.", "source": {"label": "Original DistBelief paper", "url": "https://research.google/pubs/large-scale-distributed-deep-networks/"}},
            {"year": "2019", "title": "Megatron scales tensor parallelism inside Transformer layers", "body": "Megatron-LM systematically partitions attention and MLP matrices and composes tensor, pipeline, and data parallelism, exposing the relationship between parallel dimensions and physical topology.", "source": {"label": "Original Megatron-LM paper", "url": "https://arxiv.org/abs/2104.04473"}},
            {"year": "2020", "title": "ZeRO removes replicated data-parallel state", "body": "ZeRO progressively partitions optimizer state, gradients, and parameters, exchanging communication for substantial memory capacity and providing a foundation for FSDP-style implementations.", "source": {"label": "Original ZeRO paper", "url": "https://arxiv.org/abs/1910.02054"}},
            {"year": "2022", "title": "FlashAttention reduces HBM traffic with I/O-aware tiling", "body": "It does not approximate attention. It reorganizes exact computation around on-chip storage capacity and avoids intermediate matrix traffic, proving that equal algorithmic complexity does not imply equal hardware cost.", "source": {"label": "Original FlashAttention paper", "url": "https://arxiv.org/abs/2205.14135"}},
            {"year": "2023–today", "title": "After PagedAttention, KV becomes a cluster scheduling object", "body": "vLLM pages KV to reduce fragmentation and enable sharing. Prefix-aware routing, tiered caching, and prefill/decode disaggregation then bring state location, transfer, and SLOs into the serving control plane.", "source": {"label": "Original vLLM and PagedAttention paper", "url": "https://arxiv.org/abs/2309.06180"}}
          ]
        }
      ],
      "bridge": "The chip track supplies bandwidth, capacity, and topology limits; the system track decides how to partition models, place state, queue requests, and recover. Any architecture showing only one misses a critical path: parallel algorithms obey interconnects, scheduling must know where KV lives, and capacity conclusions obey SLOs."
    },
    "visual": {
      "title": "One request through a disaggregated prefill/decode cluster",
      "description": "Follow tokens, KV blocks, and scheduling metadata along different paths; every stage can change TTFT, ITL, or cache locality.",
      "steps": [
        {"icon": "🚪", "label": "Admission and tokenization", "data": "prompt + tenant + deadline → token IDs", "action": "Enforce quotas, apply a versioned chat template, and estimate prompt and output budgets", "insight": "A wrong tokenizer or template breaks semantics, capacity estimates, and prefix hits together"},
        {"icon": "🧭", "label": "KV-aware routing", "data": "token hash + cache index + queue state", "action": "Balance prefix locality, load, and deadline to choose a decode owner and whether prefill should be remote", "insight": "The shortest queue is not necessarily fastest when it discards an expensive hot prefix"},
        {"icon": "🏗️", "label": "Prefill model mesh", "data": "prompt blocks → logits + KV blocks", "action": "Process the input context with a TP/PP layout suited to large matrix operations", "insight": "Prefill primarily shapes TTFT and determines the volume of KV state created"},
        {"icon": "🚚", "label": "KV transfer", "data": "block IDs + K/V payload + ownership", "action": "Move KV over the point-to-point data plane into reserved decode capacity and commit ownership", "insight": "Bytes, contention, and failed-transfer cleanup set the disaggregation crossover"},
        {"icon": "🔁", "label": "Continuous-batch decode", "data": "active sequences + paged KV → next tokens", "action": "Admit new requests and retire completed ones at iterations while sampling per sequence", "insight": "Throughput gains cannot come by violating per-request ITL or fairness"},
        {"icon": "📡", "label": "Stream and reclaim", "data": "token stream + finish reason + metrics", "action": "Send with backpressure, commit the trace, and release or retain KV according to session policy", "insight": "Cancellation and disconnects must reach workers quickly enough to stop ghost computation"}
      ],
      "loop": "A multi-turn session enters routing again with a stable prefix and may skip part of prefill on a hit. Completion, cancellation, eviction, or version changes must atomically release KV ownership and invalidate the corresponding routing index."
    },
    "analogyDetail": {
      "title": "Think of the cluster as printing plants cooperating across cities",
      "story": "A central desk validates each order's pages, deadline, and reusable common plates. The layout plant resembles prefill: it processes a large manuscript at once and creates trays of prepared plates. High-speed presses resemble decode: they repeatedly read fixed machinery and those trays, streaming pages out. HBM is the fastest and most expensive shelf beside a press, the scale-up fabric is the plant conveyor, and the scale-out network is intercity freight. TP lets nearby presses share one page, PP puts consecutive stages in different plants, DP duplicates a line for different orders, ZeRO stores expensive dies in distributed warehouses, and EP routes special pages to expert shops. The scheduler must know where a KV tray sits, not merely which plant has the shortest visible queue.",
      "illustration": [
        {"icon": "🏭", "label": "Plant machines and shelves", "mapsTo": "Compute units, registers/SRAM, HBM, and fast scale-up fabrics"},
        {"icon": "🧩", "label": "Page and process division", "mapsTo": "TP/PP/DP/CP plus ZeRO/FSDP state sharding"},
        {"icon": "🧑‍🔧", "label": "Expert shops", "mapsTo": "MoE routing, EP all-to-all, and load skew"},
        {"icon": "📦", "label": "Plate trays and dispatch", "mapsTo": "KV blocks, prefix indices, PD disaggregation, and SLO-aware routing"}
      ],
      "boundary": "The logistics story reveals hierarchy, capacity, ownership, and queues, but it cannot predict collective algorithms, communication overlap, kernel occupancy, tail latency, or expert skew. Measure the target model, sequence distribution, concurrency, and topology. A nearby plant does not automatically make a particular collective faster."
    },
    "infra": {
      "verifiedOn": "2026-08-11",
      "intro": "This representative open-source map is organized by responsibility, not as a performance ranking. Versions, hardware support, and APIs change; return to the linked official docs or repositories and retest with your model, topology, and SLO.",
      "layers": [
        {"layer": "Training sharding and parallelism", "projects": [
          {"name": "PyTorch FSDP2 / DTensor", "url": "https://docs.pytorch.org/docs/main/distributed.fsdp.fully_shard.html", "problem": "Express parameter and tensor sharding on a device mesh while reducing fully sharded training redundancy.", "mechanism": "Keep parameters as sharded DTensors, all-gather before computation, reduce-scatter after backward, and compose two-dimensional meshes.", "boundary": "It does not choose network topology, checkpoint policy, or model-parallel dimensions; peak memory still depends on prefetch and activations."},
          {"name": "Megatron Core", "url": "https://github.com/NVIDIA/Megatron-LM", "problem": "Compose TP, PP, CP, EP, and DP for large Transformers.", "mechanism": "Partition matrices, layers, sequences, and experts around Transformer structure, with schedules and communication-overlap paths.", "boundary": "Performance depends on supported models, layout, and accelerator topology; example throughput does not transfer to another cluster."},
          {"name": "DeepSpeed", "url": "https://github.com/deepspeedai/DeepSpeed", "problem": "Provide ZeRO, pipeline, mixed-precision, and broader training or inference systems capabilities.", "mechanism": "Shard model states and coordinate communication, offload, and execution schedules.", "boundary": "Broad feature coverage does not make every combination optimal; pin versions and validate contracts with model code."}
        ]},
        {"layer": "Communication and kernels", "projects": [
          {"name": "NCCL / RCCL", "url": "https://github.com/NVIDIA/nccl", "problem": "Execute topology-aware collectives across GPUs.", "mechanism": "Select ring, tree, and transport paths and expose all-reduce, all-gather, reduce-scatter, and related primitives.", "boundary": "A communication library cannot fix a poor upper-level partition. RCCL is the corresponding AMD implementation; consult each hardware support matrix."},
          {"name": "Triton / FlashAttention", "url": "https://github.com/Dao-AILab/flash-attention", "problem": "Reduce custom-operator effort and attention's intermediate HBM traffic.", "mechanism": "Compile tiled kernels; FlashAttention uses I/O-aware tiling for exact attention.", "boundary": "Shape, dtype, architecture, and compiler version affect gains; one faster kernel is not end-to-end throughput."},
          {"name": "DeepEP / NIXL", "url": "https://github.com/deepseek-ai/DeepEP", "problem": "Handle advanced data planes such as MoE token dispatch and cross-tier or cross-node movement.", "mechanism": "DeepEP optimizes expert all-to-all; NIXL abstracts transfers of objects such as KV across heterogeneous memory tiers.", "boundary": "They move different objects and replace neither general collectives, routing control planes, nor consistency protocols."}
        ]},
        {"layer": "Model-serving runtimes", "projects": [
          {"name": "vLLM", "url": "https://docs.vllm.ai/en/stable/", "problem": "Improve KV utilization and dynamic request throughput for generation serving.", "mechanism": "PagedAttention, continuous batching, prefix cache, parallel modes, and connectors.", "boundary": "Feature toggles are not universal gains; validate TTFT, ITL, tail latency, and device memory for the workload."},
          {"name": "SGLang", "url": "https://github.com/sgl-project/sglang", "problem": "Organize structured generation programs and high-throughput model serving.", "mechanism": "Connect front-end language and reuse with back-end scheduling, attention kernels, and distributed serving.", "boundary": "APIs and backends evolve quickly; validate tokenizer, sampling, and output semantics during migration."},
          {"name": "TensorRT-LLM", "url": "https://github.com/NVIDIA/TensorRT-LLM", "problem": "Build optimized LLM engines and serving paths on NVIDIA platforms.", "mechanism": "Graph optimization, specialized kernels, quantization, parallel execution, and in-flight batching.", "boundary": "Platform coupling and engine artifact management are costs; never compare vendor results outside their environment."}
        ]},
        {"layer": "Distributed serving orchestration", "projects": [
          {"name": "llm-d", "url": "https://github.com/llm-d/llm-d", "problem": "Organize KV-aware routing, tiered caching, and disaggregated serving on Kubernetes.", "mechanism": "Connect gateway scheduling, vLLM, KV indices, and point-to-point transfer to select workers using cache and load.", "boundary": "It is not another attention runtime. Components evolve quickly; production deployments must pin versions and drill failures."},
          {"name": "Dynamo", "url": "https://github.com/ai-dynamo/dynamo", "problem": "Build composable distributed inference data planes and KV-aware serving pipelines.", "mechanism": "Organize routing, workers, KV transfer or offload, and separated prefill/decode execution.", "boundary": "Reference configurations are not universally optimal across models; extra hops and state coordination enter the SLO budget."}
        ]}
      ],
      "matrix": [
        {"source": "Data-movement hierarchy", "lesson": "Place weights, activations, gradients, KV, and checkpoints on their actual memory and network tiers.", "boundary": "Capacity alone is insufficient; measure access frequency, contention, and tails."},
        {"source": "Multidimensional parallelism", "lesson": "Keep frequent fine-grained communication on the fastest topology and cross nodes with coarser exchanges.", "boundary": "The best mesh changes with model shape, sequence length, and cluster topology."},
        {"source": "Paged KV and disaggregation", "lesson": "Make state location and ownership scheduling inputs and define failed-transfer semantics.", "boundary": "Cache hits and phase separation help only under the target workload."},
        {"source": "SLO goodput", "lesson": "Plan capacity around useful training tokens or requests completed before deadlines.", "boundary": "Average tokens/s says nothing about tails, fairness, or recovery."}
      ]
    }
  },
  {
    "n": 17,
    "t": "On-Device LLM Infrastructure: Adapting Cloud Lessons to Device Constraints",
    "s": "Adapt I/O awareness, paged state, and operability to phones, PCs, SBCs, and MCU-coordinated systems",
    "goal": "Draw the boundary among ESP32-class MCUs, Linux edge hosts, and the cloud before selecting quantization, packaging, compilation or delegation, runtimes, and fallback for one checkpoint. Measure quality, TTFT, ITL, peak RSS, energy per token, temperature, and thermal throttling together, and explain why fitting weights in RAM or advertising high NPU TOPS does not guarantee an acceptable product. Fast-moving project facts were verified on 2026-08-11.",
    "concept": [
      "Three responsibility tiers: MCU, edge host, and cloud",
      "Quantized formats, model packages, and runtime contracts",
      "CPU/GPU/NPU lowering, partitioning, and fallback",
      "On-device KV, cold and warm startup, energy, and thermal state",
      "Explicit cloud fallback, versioning, and fleet observability"
    ],
    "analogy": "Putting a hotel kitchen into a food truck is not a scale-down operation: the menu and workflow must be redesigned around the truck's power, storage, appliances, and cooling.",
    "diagram": "Request → budget gate → quantized package → IR lowering / delegate partition\n                                              ↓\nStorage → map/load → warmup → Prefill → Decode ↔ paged KV → stream\n                                              ↓\n                         RSS / J·token⁻¹ / temperature / fallback trace\nESP32: sensors and safe actuation ←protocol→ Edge Host: LLM ←explicit policy→ cloud",
    "code": "# Compare Q4/Q8 from one checkpoint and one prompt set; confirm flags with local --help\ngit -C llama.cpp rev-parse HEAD\nsha256sum model-q4.gguf model-q8.gguf\nllama-bench -m model-q4.gguf -p 512 -n 128 -r 5 -o json\nllama-bench -m model-q8.gguf -p 512 -n 128 -r 5 -o json\n\n# Also capture peak RSS, power or energy, temperature, backend, and cold/warm startup\n# Never compare different checkpoints, contexts, or thermal states as if controlled",
    "lab": "Choose Q4 and Q8 GGUF files converted from the same source checkpoint. Fix the llama.cpp commit, build options, backend, threads, context, prompt tokens, and generation length. For each model measure a documented cold-start condition, warmed loading, pp512 prefill, tg128 decode, peak RSS, and a small output-quality suite. If the platform allows it, sample energy and temperature and run long enough to reach thermal steady state. Save model SHA-256 hashes and complete commands, repeat at least five times, and report distributions. Without a suitable device, perform the capacity fallback instead: estimate weight file, runtime, KV, temporary buffers, OS reserve, and load-time peak. Clearly label measurements versus bounds and do not invent speed results.",
    "pitfall": "Do not substitute model file size for peak memory, or NPU TOPS and one cool-run tokens/s for product experience. A cross-runtime or cross-device comparison must hold checkpoint, quantization, context, backend, threads, power mode, and thermal state constant. Vendor or repository benchmarks are reproducibility leads, not rankings outside their original workloads.",
    "questions": [
      "Why can runtime still OOM when quantized weights fit in RAM?",
      "Why can a high-TOPS NPU still deliver slow end-to-end generation?",
      "Why should data-center continuous batching not be copied by default to a single-user device?"
    ],
    "next": null,
    "lesson": [
      {
        "title": "Draw three tiers first: the MCU acts, the edge host infers, and cloud fallback is controlled",
        "body": "ESP32-class MCUs excel at sensor sampling, real-time control, low-power residency, device authentication, and actuator safety boundaries. They can run small classifiers, wake-word models, or anomaly detectors, but usually lack the RAM, storage bandwidth, and operator stack of a general chat LLM. Phones, PCs, SBCs, and Linux edge hosts provide gigabytes of memory, virtual memory, CPU SIMD, GPU or NPU engines, and a full operating system; they are the practical local generation tier. The cloud can handle longer contexts, larger models, or centralized knowledge, but fallback must be explicit: establish user consent, fields permitted to leave the device, time and cost ceilings, offline behavior, and whether a remote result has actuation authority. Tiers exchange versioned structured messages. The MCU never drives an actuator directly from free text, the edge host does not make cloud reachability a safety prerequisite, and the cloud cannot bypass local policy. This separation keeps physical permissions stable across model upgrades and turns disconnection into deterministic degradation."
      },
      {
        "title": "An edge chip is a heterogeneous memory system, not a TOPS label",
        "body": "The CPU owns control flow, tokenization, sampling, and unsupported operators. A GPU suits regular parallel work but command submission, shader compilation, buffer conversion, and contention with graphics all enter latency. A DSP or NPU can execute supported dtype, shape, and graph patterns at low energy, but may require static dimensions, specific quantization, or vendor compilation. Unified memory removes some explicit PCIe copies; it does not make movement free, because cache coherence, page migration, bandwidth contention, and layout conversion still consume time and energy. Advertised TOPS is usually an arithmetic peak at one low precision and includes neither tokenization, KV management, nor sampling. It also says nothing about operators falling back to CPU. Inspect runtime traces for subgraph placement, copied bytes at every boundary, first-compilation latency, and interference from camera or UI work before explaining TTFT and ITL."
      },
      {
        "title": "A model file is only part of the delivery contract",
        "body": "GGUF packages tensors, quantization types, and inference metadata for llama.cpp's low-dependency, multi-backend ecosystem. ExecuTorch exports a PyTorch model ahead of time into a .pte artifact and uses partitioners and delegates for target backends. MLC LLM compiles model representations into platform code and parameters. LiteRT-LM assembles tokenizers, decoders, and cross-platform APIs over LiteRT. MNN-LLM connects a mobile runtime, multiple backends, and product integration. A format name does not guarantee equal semantics: tokenizer assets, chat templates, RoPE settings, special tokens, per-tensor scales, KV dtype, and sampling defaults belong to the package contract. Release metadata must capture the source checkpoint, conversion-tool commit, command, hashes, license, supported context, and verification prompts. Validate schema and compatibility before loading so a runtime cannot silently choose a wrong default. Successful parsing proves that bytes are readable, not that output, speed, and permissions satisfy the product."
      },
      {
        "title": "Treat lowering, partitioning, and fallback as an observable compilation process",
        "body": "On-device deployment usually captures or exports a graph, normalizes operators, fuses patterns, inserts quantize or dequantize boundaries, and asks a partitioner to assign supported subgraphs to CPU, GPU, or NPU delegates. Each boundary may convert layout, dtype, or memory domain. One unsupported operator can fragment a graph into several regions, introduce repeated synchronization and copies, and make an enabled NPU slower than CPU-only execution. Preserve a compiler report: delegated nodes, fallback nodes, subgraph input contracts, workspace, and first-run compilation caches. Dynamic sequence lengths may need shape buckets, chunked prefill, or dedicated decode graphs, with boundary tests. A delegate failure path must be tested rather than merely theoretically runnable; define its capacity limit, timeout, logs, and recoverable model version. Join compiler logs, runtime traces, and system power samples with one request ID."
      },
      {
        "title": "Reshape cloud techniques for batch one and small memory",
        "body": "I/O-aware kernels such as FlashAttention, operator fusion, avoiding intermediate materialization, and reducing CPU-to-accelerator copies transfer directly because bandwidth and battery energy are especially scarce on devices. Paged KV can reduce fragmentation among sessions of different lengths, prefix reuse can preserve a stable system prompt, and chunked prefill can break long prompts into schedulable pieces that yield to interactive work. Data-center continuous batching, however, derives value from many queued requests. A personal device often has no queue to fill, so scheduling may add waiting and energy without useful occupancy. Cross-node TP or PP should not be copied mechanically either: CPU, GPU, and NPU boundaries are not homogeneous ranks, and operator coverage, shared memory, and synchronization determine whether a partition helps. The common edge baseline is one request, low batch, quantized weights, controlled context, and selective delegation. Adopt continuous batching only for a measured multi-session gateway workload."
      },
      {
        "title": "The capacity equation includes every live object beyond weights",
        "body": "A Q4 file fitting inside 4 GB of RAM does not prove the model will run. Mapped pages, quantization block metadata, unpack or reordered buffers, runtime arenas, graph caches, temporary activations, tokenizers, the UI, and the operating system consume memory. KV cache continues growing with layers, KV heads, head dimension, context, and sessions. Some backends retain host weights and a device copy simultaneously. Unified-memory pressure may cause compression or paging and extreme tail latency. A capacity table separates static footprint, load peak, prefill peak, per-token or per-session increment, and system safety reserve, then measures peak RSS at worst allowed context. Quantization is not simply an average bit count: tensor classes may use different types, embeddings or output heads can remain more precise, and headers and alignment add bytes. Under pressure, reject requests, cap context, or unload sessions before the OS kills the process."
      },
      {
        "title": "Accept quality, experience, energy, temperature, and recoverability together",
        "body": "An edge benchmark pins the checkpoint, quantization, prompt suite, backend, threads, power mode, ambient conditions, and software versions. Report cold versus cache-warm loading, prefill throughput and TTFT, decode throughput and ITL, peak RSS, joules per token or average power, device temperature, and frequency after sustained use. Generation speed must remain paired with task quality, format compliance, and refusal policy. Telemetry carries the model hash, delegate-partition summary, and trace ID so a fleet can compare releases. Ship signed model bundles with a compatibility matrix, staged rollout percentage, health gates, and rollback. Drill offline operation, delegate initialization failures, excess temperature, memory exhaustion, and cloud-fallback timeout. The deliverable is not the highest tokens/s from one cool prototype; it is evidence that the target device population maintains experience and safety across real thermal state, networking, and foreground load."
      }
    ],
    "references": [
      ["Official llama.cpp and GGUF repository", "https://github.com/ggml-org/llama.cpp"],
      ["Original MLC LLM paper", "https://arxiv.org/abs/2306.05685"],
      ["Official ExecuTorch LLM deployment guide", "https://docs.pytorch.org/executorch/stable/llm/getting-started.html"]
    ],
    "quiz": [
      {
        "prompt": "A Q4 weight file is smaller than available device RAM. Why can runtime still OOM?",
        "options": ["Q4 weights always expand automatically to Q16", "KV, temporary buffers, device copies, runtime, and the OS consume memory, and load peak can exceed steady state", "Only the tokenizer uses remaining memory", "mmap makes OOM impossible"],
        "answer": 1,
        "explanation": "File size approximates static weights only. KV grows with context, a backend may reorder or duplicate weights, prefill creates temporary peaks, and the application and OS need reserve. mmap changes mapping and paging behavior, not the capacity requirement."
      },
      {
        "prompt": "An NPU advertises high TOPS but end-to-end decode remains slow. What is the most credible explanation?",
        "options": ["TOPS completely measures tokenization, sampling, and memory access", "Generative models perform no matrix operations", "Unsupported operations fall back to CPU while delegate copies, KV bandwidth, and small-step synchronization dominate", "NPUs can execute floating-point models only"],
        "answer": 2,
        "explanation": "TOPS is an arithmetic peak at a specified precision. Actual graph coverage, shapes, memory bandwidth, cross-delegate copies, and control overhead determine TTFT and ITL, so partition and runtime traces are required."
      },
      {
        "prompt": "Why should continuous batching not be enabled by default on a single-user phone?",
        "options": ["A phone can never execute two requests", "There is usually too little concurrency to fill a dynamic batch, while scheduling and waiting can worsen TTFT, energy, and interaction", "Continuous batching changes model weights", "It applies to training only"],
        "answer": 1,
        "explanation": "Continuous batching reuses iteration slots across many requests. With a batch-one workload, that source of benefit is absent and interactive work may wait. Request distributions and measurements must justify it."
      }
    ],
    "readingMinutes": 28,
    "keywords": [
      {"term": "Delegate", "definition": "An interface that compiles and runs a partitioned subgraph on a CPU, GPU, NPU, or other backend.", "espAnalogy": "Like handing supported work to a peripheral while still matching entry format, DMA ownership, and synchronization."},
      {"term": "Peak RSS", "definition": "The maximum resident physical memory reached by a process during measurement, exposing load or prefill peaks.", "espAnalogy": "Record the heap high-water mark, not merely firmware image size."},
      {"term": "Energy per token", "definition": "Energy spent per processed or generated token, linking power consumption to useful work.", "espAnalogy": "Assess battery life with joules per valid sample rather than one instantaneous current reading."},
      {"term": "Explicit fallback", "definition": "Moving to another backend or the cloud only under defined permission, privacy, deadline, and failure policy.", "espAnalogy": "Enter an accepted backup state machine after a primary link failure instead of retrying arbitrarily."}
    ],
    "recap": "The previous chapter established data movement, paged KV, phase disaggregation, SLO goodput, and observability at cluster scale. This final chapter shrinks those principles back to the device: preserve mechanisms that can be evidenced, but redesign them for heterogeneous delegates, batch one, RAM, energy, and thermal constraints rather than copying data-center settings.",
    "nextPreview": "Day 17 is the new final chapter. Begin the next product with a target-device and workload baseline: draw safety and privacy boundaries, freeze the model-package contract, measure compiler partitioning, memory, latency, energy, and thermal steady state layer by layer, then turn a demonstration into a maintainable product with staged rollout, rollback, and failure drills.",
    "history": {
      "intro": "On-device LLMs also arise from two tracks. Chips move from CPU SIMD toward mobile GPUs, DSPs, NPUs, and MCU accelerators. Software moves from lightweight interpreters and graph compilers toward quantized formats, AOT delegates, and complete generation pipelines. Hardware creates possibilities; software determines whether a model ships consistently across devices.",
      "tracks": [
        {"title": "Edge chips and heterogeneous compute", "milestones": [
          {"year": "1990s–2000s", "title": "CPU SIMD brings data parallelism into general processors", "body": "Vector instructions map quantized dot products, activations, and preprocessing onto wide registers. Current edge CPU backends still rely on layout, thread placement, and cache reuse.", "source": {"label": "Official Arm SIMD documentation", "url": "https://developer.arm.com/Architectures/Neon"}},
          {"year": "2000s–2010s", "title": "Mobile GPUs and DSPs take on media and machine-learning flows", "body": "Programmable shaders, compute APIs, and signal processors offer higher parallelism than CPUs while introducing command submission, buffer domains, and operator-coverage boundaries.", "source": {"label": "Official Khronos OpenCL registry", "url": "https://registry.khronos.org/OpenCL/"}},
          {"year": "2010s", "title": "NPUs make low-precision neural graphs a dedicated execution path", "body": "Mobile SoCs add neural engines. Real gains depend on graph coverage, supported shapes and dtypes, and the conversion cost at partition boundaries.", "source": {"label": "Official Android NNAPI documentation", "url": "https://developer.android.com/ndk/guides/neuralnetworks"}},
          {"year": "2020", "title": "MCU accelerators keep TinyML at milliwatt endpoints", "body": "Designs such as Ethos-U target constrained SRAM, low-precision operators, and real-time embedded systems. They suit small models and do not imply that a general LLM belongs on a microcontroller.", "source": {"label": "Official Arm Ethos-U55 material", "url": "https://developer.arm.com/Processors/Ethos-U55"}},
          {"year": "Today", "title": "Generative-AI SoCs strengthen unified memory and heterogeneous cooperation", "body": "CPU, GPU, NPU, and shared-memory controllers share a package, reducing some discrete transfers while bandwidth, coherence, power budget, and thermal throttling still bound sustained generation.", "source": {"label": "MLCommons MLPerf Client benchmark", "url": "https://mlcommons.org/benchmarks/client/"}}
        ]},
        {"title": "Edge software and model delivery", "milestones": [
          {"year": "2017–2019", "title": "TensorFlow Lite brings conversion, an interpreter, and delegates to mobile", "body": "A lightweight runtime, quantization, and platform delegates establish the core edge pattern: preserve model semantics, partition around hardware capability, and retain a CPU path.", "source": {"label": "Original TensorFlow Lite paper", "url": "https://arxiv.org/abs/1905.08166"}},
          {"year": "2018", "title": "TVM separates model graphs from hardware schedules", "body": "An end-to-end compiler uses intermediate representations, automated or templated scheduling, and multi-target code generation. Portability requires explicit lowering rather than one kernel binary for every device.", "source": {"label": "Original TVM paper", "url": "https://arxiv.org/abs/1802.04799"}},
          {"year": "2023", "title": "llama.cpp and GGUF lower the barrier to local quantized LLMs", "body": "A low-dependency C/C++ runtime, quantization tools, and multiple backends let ordinary PCs, Macs, SBCs, and mobile devices run open-weight models and provide a reproducible experimental entry point.", "source": {"label": "Official llama.cpp repository", "url": "https://github.com/ggml-org/llama.cpp"}},
          {"year": "2023–2024", "title": "MLC LLM and ExecuTorch strengthen AOT, partitioning, and portable delivery", "body": "Compiler-generated platform code or PyTorch export with delegated subgraphs brings model optimization closer to application SDKs and device backends.", "source": {"label": "Original MLC LLM paper", "url": "https://arxiv.org/abs/2306.05685"}},
          {"year": "2025–today", "title": "LiteRT-LM, MNN, and peers fill out generation pipelines and product APIs", "body": "Edge frameworks increasingly package tokenizers, sessions, KV, language bindings, multimodal components, and CPU/GPU/NPU backends as a generation delivery surface instead of executing one static graph only.", "source": {"label": "Official LiteRT-LM repository", "url": "https://github.com/google-ai-edge/LiteRT-LM"}}
        ]}
      ],
      "bridge": "The chip track says which computation may be efficient; the software track says how a particular model reaches that engine safely. Their junction is the delegate boundary. Every graph cut, layout conversion, cache allocation, and fallback must be visible, measured, and versioned."
    },
    "visual": {
      "title": "The lifecycle of an on-device token, from budget to telemetry",
      "description": "The animation joins offline conversion, first load, and each request into one path, showing why edge performance belongs to more than the model kernel.",
      "steps": [
        {"icon": "🚦", "label": "Budget gate", "data": "device tier + privacy + context + deadline", "action": "Choose a local model, reduced task, or explicit cloud fallback using capability, permission, temperature, and network policy", "insight": "Routing is a product and safety decision before it is a performance decision"},
        {"icon": "🧳", "label": "Quantize and package", "data": "checkpoint → Q4/Q8 tensors + tokenizer + metadata", "action": "Convert with pinned tools and record quantization policy, template, license, and SHA-256", "insight": "Identical quantization names do not guarantee equal per-tensor policy, quality, or compatibility"},
        {"icon": "🧱", "label": "Lower and delegate", "data": "graph IR → CPU/GPU/NPU partitions", "action": "Normalize, fuse, and divide subgraphs by backend capability, emitting fallback and boundary-copy reports", "insight": "One unsupported operator can fragment the graph and consume all NPU benefit"},
        {"icon": "🔥", "label": "Load and warm", "data": "storage → mapped weights + caches + compiled kernels", "action": "Verify the package, allocate KV and workspace, create compile caches, and distinguish cold from warm startup", "insight": "Load peaks, first shader compilation, and page faults can dominate the first experience"},
        {"icon": "📚", "label": "Prefill", "data": "prompt tokens → logits + local KV", "action": "Run I/O-aware attention within context budget, chunking input and yielding to foreground work when needed", "insight": "High prefill throughput does not automatically mean low TTFT; queues and thermal state remain on path"},
        {"icon": "🌡️", "label": "Decode and observe", "data": "paged KV → token stream + RSS + joules + temperature", "action": "Generate tokens while recording ITL, memory high-water mark, energy, temperature, fallback, and finish reason", "insight": "Thermal steady state after sustained use predicts product experience better than one cool-device peak"}
      ],
      "loop": "A multi-turn session returns to the budget gate. Remaining context, resident KV, temperature, battery, and privacy policy decide whether to continue, compact, unload, or explicitly request cloud use. Stop generation before reclaiming KV and delegate resources on cancellation or model switches."
    },
    "analogyDetail": {
      "title": "Put a hotel kitchen into a food truck",
      "story": "A cloud hotel kitchen can serve many tables with a giant pantry, rows of appliances, and dedicated runners. An edge food truck has finite battery, storage, burners, and cooling. A quantized model package is a standardized compact ingredient case. IR and delegates assign recipe steps to a cutting board, stove, or specialized oven; CPU, GPU, and NPU each suit different work. KV cache is the prep box reserved for the current customer, prefill prepares ingredients in one pass, and decode streams dishes one at a time. If the special oven cannot perform one step, carrying food back and forth to the ordinary stove may be slower. A long order can fill every prep box. An ESP32 is the truck's sensor and safety controller; the main LLM belongs on the more capable host.",
      "illustration": [
        {"icon": "🧳", "label": "Standard ingredient case", "mapsTo": "Quantized weights, tokenizer, metadata, and a verifiable model bundle"},
        {"icon": "🗺️", "label": "Recipe process chart", "mapsTo": "Graph IR, partitioners, delegates, and fallback boundaries"},
        {"icon": "🍱", "label": "Preparation boxes", "mapsTo": "Paged KV cache bounded by RAM and context budgets"},
        {"icon": "🔋", "label": "Battery and exhaust", "mapsTo": "Energy per token, temperature, throttling, and sustained performance"}
      ],
      "boundary": "The food-truck story clarifies capacity, heterogeneous work, and thermal budget. It cannot convert TOPS to tokens/s or predict quantization quality, delegate coverage, and OS scheduling. End-to-end results depend on model, shape, backend, memory path, software version, and thermal state; remeasure on target hardware."
    },
    "infra": {
      "verifiedOn": "2026-08-11",
      "intro": "This project map follows delivery paths rather than ranking products. Supported models, backends, quantization, and CLIs move quickly. The boundaries identify what to verify and do not claim cross-vendor performance.",
      "layers": [
        {"layer": "Low-dependency quantized runtimes", "projects": [
          {"name": "llama.cpp / GGUF", "url": "https://github.com/ggml-org/llama.cpp", "problem": "Run quantized open-weight LLMs with few dependencies on desktops, SBCs, and mobile platforms.", "mechanism": "GGUF packages tensors and metadata; ggml kernels target CPU, Metal, CUDA, Vulkan, and other backends, with conversion and llama-bench tools.", "boundary": "Backends and CLI flags evolve. Loading GGUF does not prove template semantics, quality, power, or device compatibility."},
          {"name": "bitnet.cpp", "url": "https://github.com/microsoft/BitNet", "problem": "Explore coordinated 1-bit or low-bit models and specialized kernels.", "mechanism": "Optimize BitNet model structure, weight representation, and CPU kernels together.", "boundary": "It is not a lossless compressor for arbitrary checkpoints; value depends on model-to-kernel co-design."}
        ]},
        {"layer": "Compiler and AOT deployment", "projects": [
          {"name": "MLC LLM", "url": "https://github.com/mlc-ai/mlc-llm", "problem": "Compile and deploy LLMs to multiple CPU/GPU platforms and application APIs.", "mechanism": "Use an ML compiler to generate target code, quantized model libraries, and platform bindings.", "boundary": "Model and toolchain support are versioned; a compiled artifact is not a universal cross-device binary."},
          {"name": "ExecuTorch", "url": "https://docs.pytorch.org/executorch/stable/llm/getting-started.html", "problem": "Export PyTorch models ahead of time into mobile and embedded runtimes.", "mechanism": "Export .pte and use partitioners for XNNPACK, Core ML, Qualcomm, and other delegates, then run through C++, Swift, or Java APIs.", "boundary": "Delegate coverage and dynamic shapes set boundary costs; a model fitting PyTorch does not automatically fit a device."}
        ]},
        {"layer": "On-device generation pipelines", "projects": [
          {"name": "LiteRT-LM", "url": "https://github.com/google-ai-edge/LiteRT-LM", "problem": "Provide cross-platform on-device generation pipelines and application SDKs.", "mechanism": "Compose tokenizers, model components, sessions, and CPU/GPU/NPU backends on LiteRT.", "boundary": "Platform and NPU support change by release; use the official matrix for the exact target version."},
          {"name": "MNN-LLM", "url": "https://github.com/alibaba/MNN", "problem": "Integrate lightweight multi-backend LLMs and multimodal applications across phones, PCs, and IoT.", "mechanism": "Connect the MNN runtime, CPU and Metal/OpenCL/Vulkan backends, model conversion, and mobile application APIs.", "boundary": "Repository benchmarks cannot rank runtimes outside the stated device, model, threads, and thermal conditions."}
        ]},
        {"layer": "Platform-specific paths", "projects": [
          {"name": "MLX-LM", "url": "https://github.com/ml-explore/mlx-lm", "problem": "Run and fine-tune LLMs on Apple silicon unified-memory systems.", "mechanism": "Use MLX arrays, the Metal backend, and platform memory behavior for quantization, generation, and training tools.", "boundary": "Platform-specific optimization does not extrapolate to Android, discrete GPUs, or MCUs; memory pressure and thermal steady state still require measurement."}
        ]}
      ],
      "matrix": [
        {"source": "I/O-aware kernels, fusion, fewer copies", "lesson": "Transfer directly: device bandwidth and battery make intermediate materialization especially expensive.", "boundary": "Choose or generate kernels for the target shape and backend, not merely by algorithm name."},
        {"source": "Paged KV, prefix reuse, chunked prefill", "lesson": "Adapt for batch one and bounded context to reduce fragmentation, duplicate work, and peak blocking.", "boundary": "Paging metadata and scheduling cost something; prefixes need versioning and privacy isolation."},
        {"source": "Continuous batching and cross-node TP/PP", "lesson": "Do not transfer by default; prove a real queue or beneficial heterogeneous partition first.", "boundary": "CPU/GPU/NPU are not cheap homogeneous ranks, and boundary copies can exceed computation savings."},
        {"source": "Data-center topology awareness", "lesson": "Map it to delegate coverage, shared memory, coherence, and CPU/GPU/NPU boundaries.", "boundary": "Unified memory reduces explicit copies; it does not provide infinite bandwidth or zero synchronization."},
        {"source": "SLOs, versioning, rollback, observability", "lesson": "Transfer fully, then add joules/token, peak RSS, temperature, and thermal throttling.", "boundary": "Cool-device laboratory averages cannot represent sustained fleet experience or battery life."}
      ]
    }
  }
];
