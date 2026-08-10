module.exports = [
  {
    "n": 8,
    "t": "On-Device Vision Models",
    "s": "From camera frames to actionable events",
    "goal": "Learn how to choose among detection, classification, and segmentation, and understand the complete camera, color-format, resizing, and post-processing pipeline.",
    "concept": [
      "Classification, detection, and segmentation",
      "RGB/YUV, stride, and DMA",
      "ROI, resize, and letterboxing",
      "NMS, confidence, and temporal smoothing"
    ],
    "analogy": "A camera pipeline resembles the path from a USB camera driver to an application: if the frame format, stride, or buffer ownership is wrong at any stage, the model will be consistently wrong.",
    "diagram": "Camera DMA → Frame buffer → Crop/Resize → Normalize → CNN\n                                      └→ decode boxes → NMS → tracker",
    "code": "frame = camera.acquire()\nroi = letterbox(frame, 320, 320)\nboxes = detector(roi)\nboxes = nms(boxes, iou=0.45)\ncamera.release(frame)",
    "lab": "Use one test image to visualize the original frame, resized image, model input, candidate boxes, and post-NMS result step by step; record the latency of every stage.",
    "questions": [
      "Why must the letterbox scale be carried into post-processing?",
      "Is a detector's FPS necessarily the same as the camera frame rate?",
      "How should tearing caused by buffer reuse be handled?"
    ],
    "next": "Tokenizer",
    "lesson": [
      {
        "title": "Choose output granularity from the product requirement first",
        "body": "If the only requirement is to determine whether a flame is present and the target occupies a stable ROI, begin with classification. Use detection when position and count matter, and consider segmentation when pixel-level area, boundaries, or traversable regions are required. Finer outputs usually increase labeling cost, post-processing, and memory. Also specify the minimum target size in pixels, acceptable occlusion, and camera distance, because input resolution sets an upper bound on available information. Compare candidates by replaying real product events, not by ranking a single metric measured on different datasets."
      },
      {
        "title": "Treat a frame buffer as two-dimensional storage with a descriptor",
        "body": "A frame is more than width×height: it also has a format such as RGB565, YUV, or JPEG, a per-row stride, plane layout, alignment, and a valid region. JPEG must be decoded first, and YUV-to-RGB conversion must use the correct matrix and range. Treating padded rows as tightly packed pixels produces diagonal artifacts. Camera-driver buffers are usually pool-managed and must not be returned or overwritten before inference is complete. Verify the read path with color bars, checkerboards, and pixel probes before introducing the model; this isolates format errors quickly."
      },
      {
        "title": "Keep a reversible ledger for every geometric transform",
        "body": "Pre-processing should record the original dimensions, ROI origin, scale factor, padding, and model input size. Stretch resizing changes object shape; letterboxing preserves aspect ratio but adds border padding, and either choice must match training. To map a detection box or segmentation mask back to the source image, reverse the transforms in order: remove padding, divide by the scale, add the ROI offset, and clip to valid bounds. Unit tests using corner markers and known rectangles reveal half-pixel and rounding errors more reliably than inspecting a few boxes by eye."
      },
      {
        "title": "Post-processing turns dense predictions into stable events",
        "body": "A detection head usually emits many candidates. Decode centers, sizes, and classes according to the model definition, then apply confidence filtering and NMS. Filtering too early misses targets; filtering too late wastes time. Calibrate the IoU threshold and class policy against target size and occlusion. Across frames, lightweight tracking, consecutive-hit requirements, and miss tolerance can suppress flicker, but temporal smoothing adds response latency. Product events should carry timestamps, confidence, and tracking IDs rather than preserving only a final screenshot."
      },
      {
        "title": "Validate the real-time pipeline through staged replay",
        "body": "Save a legally shareable set of source frames and retain the model input, raw output, NMS result, and remapped result for each frame as golden records. Compute per-stage summaries on the board and compare them with the PC implementation, while timing acquisition, pre-processing, inference, post-processing, and queuing separately. Stress the pipeline by varying exposure, frame rate, and consumer speed; verify which frame is dropped when the queue fills and that every buffer is eventually returned. Final FPS depends on the slowest stage and pipeline concurrency, not merely the reciprocal of one inference call."
      }
    ],
    "pitfall": "Giving a frame buffer to pre-processing before DMA has completed, or returning it too early, causes tearing, intermittent false detections, and difficult-to-reproduce data races.",
    "references": [
      [
        "ESP-IDF Camera Controller",
        "https://docs.espressif.com/projects/esp-idf/en/latest/esp32p4/api-reference/peripherals/camera_driver.html"
      ],
      [
        "ESP-IDF Memory Types",
        "https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-guides/memory-types.html"
      ],
      [
        "ESP-DL Model Loading, Testing, and Profiling",
        "https://docs.espressif.com/projects/esp-dl/en/latest/tutorials/how_to_load_test_profile_model.html"
      ]
    ],
    "quiz": [
      {
        "prompt": "Why must scale and padding be preserved after letterboxing?",
        "options": [
          "To increase the model's parameter count",
          "To map detection-box coordinates back to the source frame correctly",
          "To change the tokenizer",
          "To disable DMA"
        ],
        "answer": 1,
        "explanation": "Letterboxing both scales and pads the image. Post-processing must invert both transforms, or box positions and sizes will be wrong relative to the source image."
      },
      {
        "prompt": "When is it safest to process a camera frame?",
        "options": [
          "Before DMA starts",
          "After the driver reports completion and transfers ownership of the buffer",
          "Inside any ISR",
          "While Flash is being erased"
        ],
        "answer": 1,
        "explanation": "DMA may still be writing frame data before the completion event. Explicit ownership and lifetime rules are the foundation for preventing tearing and concurrent access."
      },
      {
        "prompt": "Does a 10 FPS detector require the camera to run at 10 FPS?",
        "options": [
          "Yes; they are always identical",
          "No; acquisition, pre-processing, and inference can run independently, and frames may be dropped or the newest frame reused",
          "Yes; NMS determines the clock rate",
          "No; the model needs no input"
        ],
        "answer": 1,
        "explanation": "End-to-end throughput is determined by the whole pipeline. The camera may run faster, so the system must define backpressure, queue depth, and whether to process every frame or only the latest one."
      }
    ],
    "readingMinutes": 20,
    "keywords": [
      {
        "term": "Stride",
        "definition": "The memory distance between adjacent pixel data on the same row.",
        "espAnalogy": "Like the actual step of a DMA row transfer, which is not always equal to the visible width."
      },
      {
        "term": "Letterbox",
        "definition": "A resize method that preserves aspect ratio and pads the borders.",
        "espAnalogy": "Like placing payloads of different lengths into fixed-size frames while preserving their proportions."
      },
      {
        "term": "NMS",
        "definition": "Post-processing that removes highly overlapping candidate boxes.",
        "espAnalogy": "Like deduplicating and coalescing repeated interrupt events."
      },
      {
        "term": "Buffer ownership",
        "definition": "Rules defining who may read or write a buffer and when it must be returned.",
        "espAnalogy": "Like explicit resource ownership between DMA and a task."
      }
    ],
    "recap": "The previous chapter established memory and bandwidth budgets. This chapter applies those budgets to a camera stream: as a frame travels from DMA through the model to an event, a format or ownership error at any stage can reliably produce the wrong result.",
    "nextPreview": "The next chapter moves from vision frames to text streams and explains how a tokenizer converts text into integer sequences a model can consume. Both paths depend on a strict input contract.",
    "history": {
      "intro": "On-device vision evolved from answering “what class does this whole image belong to?” to determining what is where, where its outline lies, and whether it remains the same object across frames. Alongside algorithmic progress, camera formats, geometric transforms, and real-time post-processing became system components as important as the network itself.",
      "milestones": [
        {
          "year": "1989",
          "title": "Convolutional networks learn local patterns from pixels",
          "body": "Early postal-code recognition demonstrated how local receptive fields and shared weights could handle translational structure in images, establishing a basic paradigm for later end-to-end vision models.",
          "source": {
            "label": "Original paper by LeCun et al.",
            "url": "https://doi.org/10.1162/neco.1989.1.4.541"
          }
        },
        {
          "year": "2012",
          "title": "Deep CNNs and GPU training expand visual capability",
          "body": "AlexNet demonstrated striking ImageNet results with a deep convolutional network, accelerating the growth of vision backbones while confronting deployment teams with greater compute and memory pressure.",
          "source": {
            "label": "Original AlexNet paper",
            "url": "https://papers.nips.cc/paper/4824-imagenet-classification-with-deep-convolutional-neural-networks"
          }
        },
        {
          "year": "2015",
          "title": "YOLO unifies detection into one network pass",
          "body": "YOLO predicts bounding boxes and class probabilities directly from an entire image, moving detection from multi-stage proposal pipelines toward a single-stage real-time flow and highlighting the importance of end-to-end latency.",
          "source": {
            "label": "Original YOLO paper",
            "url": "https://arxiv.org/abs/1506.02640"
          }
        },
        {
          "year": "2017",
          "title": "MobileNet targets mobile and embedded vision",
          "body": "Depthwise separable convolutions substantially reduce the cost of conventional convolution, while width and resolution multipliers let one model family span different device budgets.",
          "source": {
            "label": "Original MobileNet paper",
            "url": "https://arxiv.org/abs/1704.04861"
          }
        },
        {
          "year": "Present",
          "title": "Vision models become part of complete device pipelines",
          "body": "Official projects such as ESP-WHO combine camera drivers, image processing, inference models, and sample applications, expanding deployment concerns from the network alone to the complete end-to-end path.",
          "source": {
            "label": "Official ESP-WHO repository",
            "url": "https://github.com/espressif/esp-who"
          }
        }
      ],
      "bridge": "A current engineering project should track more than model mAP or FPS. It must account for every transformation from exposure and DMA through color conversion, coordinate remapping, and event publication. Losing stride, scale, or buffer ownership at any point makes a correct model reliably produce incorrect results."
    },
    "visual": {
      "title": "From one image frame to one trustworthy event",
      "description": "The player preserves every pixel and coordinate transformation, making it easy to see how candidates are filtered and stabilized across frames.",
      "steps": [
        {
          "icon": "📷",
          "label": "Capture via DMA",
          "data": "YUV/RGB/JPEG + stride + timestamp",
          "action": "The camera fills a pooled buffer and transfers ownership",
          "insight": "Every frame must carry a format descriptor"
        },
        {
          "icon": "✂️",
          "label": "Crop and resize",
          "data": "ROI → letterbox tensor",
          "action": "Perform color conversion, resizing, padding, and normalization",
          "insight": "Preserve a ledger of scale, offset, and padding"
        },
        {
          "icon": "🧠",
          "label": "Model forward pass",
          "data": "tensor → logits/boxes/mask",
          "action": "Run on the target runtime and retain a raw-output summary",
          "insight": "The model has not yet produced a product event"
        },
        {
          "icon": "🧹",
          "label": "Decode and deduplicate",
          "data": "candidates → threshold → NMS",
          "action": "Decode according to the model head and merge overlapping candidates",
          "insight": "Post-processing parameters affect both accuracy and latency"
        },
        {
          "icon": "🧭",
          "label": "Remap coordinates",
          "data": "model xy → source xy",
          "action": "Undo padding, scaling, and ROI offset in reverse order",
          "insight": "The transform ledger determines whether a box returns to the real object"
        },
        {
          "icon": "🎯",
          "label": "Form a cross-frame event",
          "data": "track id + confidence + time",
          "action": "Apply temporal smoothing, publish the event, and return the frame buffer",
          "insight": "Stability, latency, and resource release close the loop together"
        }
      ],
      "loop": "The next frame returns to DMA capture. Tracking state persists across frames, while the pixel buffer is returned to the camera pool immediately after publishing the result; these lifetimes must never be confused."
    },
    "analogyDetail": {
      "title": "A multi-camera sports broadcast",
      "story": "Cameras first deliver raw pictures with row pitch and a color standard. The director crops the playing area and scales it onto an analysis monitor; an analyst circles candidate players, and the director removes duplicate selections, confirms identities across frames, and only then broadcasts a “goal” event. If the crop scale was never recorded, every circle returns to the wrong location.",
      "illustration": [
        {
          "icon": "🎥",
          "label": "Camera feed",
          "mapsTo": "Exposure, pixel format, stride, and DMA frame buffer"
        },
        {
          "icon": "🖼️",
          "label": "Director's crop",
          "mapsTo": "ROI, color conversion, resize, letterboxing, and normalization"
        },
        {
          "icon": "⭕",
          "label": "On-screen circles",
          "mapsTo": "Class scores, detection candidates, or segmentation masks"
        },
        {
          "icon": "📣",
          "label": "Match announcement",
          "mapsTo": "NMS, tracking, temporal smoothing, and product events"
        }
      ],
      "boundary": "The broadcast analogy explains geometry and timing, but it does not mean a vision model truly understands the match. Boxes, classes, and masks are statistical outputs; occlusion, glare, a dirty lens, or out-of-distribution objects can break the judgment. Critical actions still require confidence gates, sensor cross-checks, or human review."
    }
  },
  {
    "n": 9,
    "t": "Tokenizer",
    "s": "Understand how text becomes an integer stream a model can consume",
    "goal": "Explain vocabularies, merges, special tokens, padding, and token budgets, and locate the cost of tokenization on edge systems.",
    "concept": [
      "Unicode and normalization",
      "BPE and SentencePiece",
      "Special tokens and chat templates",
      "Token IDs, positional encoding, and context length"
    ],
    "analogy": "A tokenizer is the framing layer of a serial protocol: human text is first divided into stable numbered frames, and the model recognizes only those numbers—not the characters directly.",
    "diagram": "UTF-8 text → normalize → tokenize → [BOS, 1203, 88, EOS] → embedding lookup",
    "code": "ids = tokenizer.encode(\"temperature 28°C\")\nprint(ids, len(ids))\nprompt = template(system, user)\n# token budget = prompt_tokens + generated_tokens",
    "lab": "Choose one mixed Chinese-and-English sentence and compare its token count across tokenizers; measure the difference between encoding incrementally and encoding the complete text at once.",
    "questions": [
      "Why do Chinese text, code, and emoji have very different token costs?",
      "What problems can an inconsistent chat template cause?",
      "Does a context window limit characters or tokens?"
    ],
    "next": "KV Cache",
    "lesson": [
      {
        "title": "Trace strings back to bytes and fix normalization semantics first",
        "body": "Visually identical text can contain different Unicode code-point sequences, such as a precomposed character versus a base character plus a combining mark. Full-width forms, line endings, and invisible control characters also change tokens. Do not clean text separately in the application, template, and tokenizer, because training and inference will be difficult to align. Specify the normalization form, whitespace and case policy, and log boundary cases as hexadecimal code points. A byte-level tokenizer can cover arbitrary input, but that does not mean malformed UTF-8 or replacement characters should be accepted silently."
      },
      {
        "title": "Understand the exchange between vocabulary size and sequence length",
        "body": "BPE begins with base symbols and repeatedly merges adjacent fragments according to learned ranks. WordPiece and unigram/SentencePiece use different training objectives, so a vocabulary alone cannot reproduce their behavior. A large vocabulary shortens common text but enlarges the embedding and output layers; a small vocabulary offers easy coverage but longer sequences. Chinese, code, numbers, and emoji have different frequency structures, so character count cannot predict token count. Engineering comparisons should use the product corpus's length distribution, encoding time, and model quality—not one English sentence."
      },
      {
        "title": "Treat special tokens and the chat template as one indivisible ABI",
        "body": "A chat model is trained on a token sequence rendered from role/content messages by a template, not on the application's object array. The template defines system, user, and assistant boundaries, whether BOS/EOS tokens are inserted, and where the generation prompt ends. When text is rendered first and tokenized afterward, duplicate special-token insertion should normally be disabled. Switching models means switching the tokenizer and template together. User text must also be distinguished from permitted control tokens so ordinary content cannot accidentally cross message boundaries."
      },
      {
        "title": "Budget the encoding path as well as the context limit",
        "body": "Count tokens only after applying the template, including the system prompt, history, tool descriptions, and reserved output; character count is not a substitute. Re-encoding the entire text after each character is appended on an edge device creates quadratic repeated work. A stable prefix can be cached, or an incremental implementation used, but merges may cross the append boundary, so two token lists cannot be concatenated naively. Truncate long inputs by message or semantic block and regenerate the template; never cut through a UTF-8 byte sequence or special token."
      },
      {
        "title": "Use golden vectors to verify consistency across languages and implementations",
        "body": "Build a small corpus containing Chinese, English, spaces, line breaks, emoji, combining characters, code, and text resembling special tokens. Save the tokenizer hash, template version, expected IDs, and decoded result. Compare each case across Python, the host runtime, and the device implementation, and verify the documented encode→decode reversibility boundary. If IDs change after a library upgrade—even if decoded text looks identical—an old prompt/KV cache cannot safely be reused. Cache keys must include the complete tokenizer contract."
      },
      {
        "title": "Find the first wrong token through layered snapshots",
        "body": "When debugging token differences, do not print only final IDs. Save the source bytes and Unicode code points, then snapshot the normalized text, rendered template, pre-tokenized pieces, and every token ID. Align on the first divergence: if strings differ, inspect line endings, Jinja whitespace control, and BOS/EOS; if strings match but pieces differ, inspect tokenizer.json and merge ranks; if IDs match but model behavior differs, inspect positions and the attention mask. This localizes the fault to a specific protocol layer."
      }
    ],
    "pitfall": "Sending the 'same sentence' directly to different chat models, or inserting BOS/EOS twice, often causes role confusion, abnormal first tokens, or a distorted context budget.",
    "references": [
      [
        "Hugging Face Chat Templates",
        "https://huggingface.co/docs/transformers/en/chat_templating"
      ],
      [
        "GGUF Format Specification",
        "https://github.com/ggerganov/ggml/blob/master/docs/gguf.md"
      ]
    ],
    "quiz": [
      {
        "prompt": "What does an LLM context window normally limit?",
        "options": [
          "The number of UTF-8 bytes",
          "The number of visible characters",
          "The number of tokens",
          "The number of HTTP packets"
        ],
        "answer": 2,
        "explanation": "Embeddings and positional encodings operate on tokens. A Chinese character, emoji, or code fragment does not occupy a fixed number of tokens."
      },
      {
        "prompt": "Why should you use the chat template shipped with the model?",
        "options": [
          "It trains the model automatically",
          "Different models use different role-control tokens and input formats",
          "It reduces every KV cache",
          "It affects only web-page layout"
        ],
        "answer": 1,
        "explanation": "Even different chat fine-tunes of the same base model may require different formats. Incorrect control tokens shift the input away from the distribution seen during training."
      },
      {
        "prompt": "What should you usually watch for when tokenizing after apply_chat_template(tokenize=False)?",
        "options": [
          "Force the tokenizer to add more special tokens",
          "Avoid adding special tokens that the template already included",
          "Delete all spaces",
          "Convert tokens to float32"
        ],
        "answer": 1,
        "explanation": "The official documentation warns that duplicate special tokens are often harmful. Using tokenize=True directly is generally safer because templating and tokenization occur in one call."
      }
    ],
    "readingMinutes": 17,
    "keywords": [
      {
        "term": "Vocabulary",
        "definition": "A mapping from tokens to integer IDs.",
        "espAnalogy": "Like a table of protocol command codes."
      },
      {
        "term": "BPE",
        "definition": "An algorithm that constructs tokens by merging frequent substrings.",
        "espAnalogy": "Like defining frequently occurring byte fragments as shorter frame types."
      },
      {
        "term": "Special token",
        "definition": "A token carrying control meaning such as beginning, end, or role.",
        "espAnalogy": "Like a frame header, trailer, or control word."
      },
      {
        "term": "Chat template",
        "definition": "A template that formats a message list into the string expected during model training.",
        "espAnalogy": "Like the distinct command-frame format used by each device."
      }
    ],
    "recap": "The previous chapter made images enter the model under a strict format contract. This chapter addresses the same issue for text: a model does not read strings directly; it consumes token IDs governed by vocabulary and boundary rules.",
    "nextPreview": "The next chapter explains why a generative model retains K/V state for historical tokens and how a growing context turns into RAM and bandwidth pressure.",
    "history": {
      "intro": "The history of tokenization is a search for balance among a finite vocabulary, the need to encode any text, and the need to keep sequences short. Repeated-fragment substitution from general compression gradually became the input protocol of language models and then took on the framing of conversation roles and tool messages.",
      "milestones": [
        {
          "year": "1994",
          "title": "BPE begins by repeatedly replacing frequent byte pairs",
          "body": "Philip Gage's Byte Pair Encoding repeatedly replaced the most frequent adjacent byte pair with a new symbol, originally to compress data using a simple substitution table.",
          "source": {
            "label": "Original BPE paper",
            "url": "https://www.derczynski.com/papers/archive/BPE_Gage.pdf"
          }
        },
        {
          "year": "2015",
          "title": "BPE is adapted into a subword algorithm for neural translation",
          "body": "Sennrich and colleagues represented rare and unseen words as subword sequences, so a fixed vocabulary no longer collapsed every unknown form into the same UNK token.",
          "source": {
            "label": "Original Subword NMT paper",
            "url": "https://arxiv.org/abs/1508.07909"
          }
        },
        {
          "year": "2016",
          "title": "WordPiece enters large-scale translation systems",
          "body": "GNMT split words into a finite set of common sub-word units, covering open-ended text with a controlled vocabulary and making subword tokenization a core part of neural language systems.",
          "source": {
            "label": "Original GNMT paper",
            "url": "https://arxiv.org/abs/1609.08144"
          }
        },
        {
          "year": "2018",
          "title": "SentencePiece trains directly from raw sentences",
          "body": "SentencePiece removes the need to split on spaces first and provides a language-independent tokenizer/detokenizer, making workflows for languages without spaces and multilingual data more consistent.",
          "source": {
            "label": "Original SentencePiece paper",
            "url": "https://aclanthology.org/D18-2012/"
          }
        },
        {
          "year": "2019",
          "title": "GPT-2 adopts byte-level BPE to cover arbitrary text",
          "body": "GPT-2 reported using byte-level BPE, balancing byte coverage with reusable subwords and reducing the blind spots that traditional word-level vocabularies had around unusual characters.",
          "source": {
            "label": "Original GPT-2 technical report",
            "url": "https://cdn.openai.com/better-language-models/language-models.pdf"
          }
        },
        {
          "year": "2023–Present",
          "title": "Chat templates bring message structure into the tokenizer contract",
          "body": "Modern chat models render role/content messages into a single sequence containing control tokens. The template is stored with the tokenizer, so applications should no longer guess separators by hand.",
          "source": {
            "label": "Official Hugging Face Chat Templates documentation",
            "url": "https://huggingface.co/docs/transformers/chat_templating"
          }
        }
      ],
      "bridge": "A tokenizer is therefore not an interchangeable text utility; it is part of the model ABI. A one-byte change in vocabulary, merge/rank rules, normalization, special tokens, or the template can alter every subsequent token ID, position, and KV-cache entry."
    },
    "visual": {
      "title": "How a conversation becomes a train of integers",
      "description": "The step-by-step player shows what each protocol layer adds or changes, then reconstructs text incrementally from token fragments.",
      "steps": [
        {
          "icon": "💬",
          "label": "Organize messages",
          "data": "[{role, content}, …]",
          "action": "Preserve the structure of roles, turns, and tool fields",
          "insight": "The object structure is not yet model input"
        },
        {
          "icon": "🧾",
          "label": "Apply the template",
          "data": "role tokens + content + generation marker",
          "action": "Insert control boundaries using the model's own template",
          "insight": "The same message can yield a different sequence under another template"
        },
        {
          "icon": "🔤",
          "label": "Normalize and pre-tokenize",
          "data": "Unicode text → pieces/bytes",
          "action": "Apply the tokenizer's declared character and regular-expression rules",
          "insight": "Invisible characters are part of the protocol too"
        },
        {
          "icon": "🧲",
          "label": "Merge subwords",
          "data": "base symbols → ranked merges",
          "action": "Form fragments according to BPE, WordPiece, or SentencePiece rules",
          "insight": "Vocabulary size and sequence length trade against each other"
        },
        {
          "icon": "🔢",
          "label": "Look up IDs",
          "data": "[1, 2457, 93, …]",
          "action": "Map through the vocabulary and calculate the context budget",
          "insight": "The model consumes only positioned integer sequences"
        },
        {
          "icon": "📤",
          "label": "Decode incrementally",
          "data": "token bytes → UTF-8 text",
          "action": "Accumulate complete byte boundaries before sending text to the interface",
          "insight": "One token may not be independently displayable as a character"
        }
      ],
      "loop": "A new turn returns to “Organize messages” and reapplies the template. Reusing a prefix requires the template, tokenizer hash, token sequence, and positions all to match."
    },
    "analogyDetail": {
      "title": "Ticketing and train assembly at an international station",
      "story": "Travelers speaking different languages and carrying emoji and code fragments arrive at the station. The ticket desk first validates their documents under one set of rules, then groups common traveling fragments into short numbered cars. The stationmaster inserts control cars for “train begins,” “passenger speaks,” and “train ends”; the model sees only the final sequence of numbers.",
      "illustration": [
        {
          "icon": "🪪",
          "label": "Document check",
          "mapsTo": "Unicode handling, normalization, and raw-byte boundaries"
        },
        {
          "icon": "🧩",
          "label": "Car assembly",
          "mapsTo": "BPE merges, WordPiece, or SentencePiece subword segmentation"
        },
        {
          "icon": "🎫",
          "label": "Numbered ticket",
          "mapsTo": "Stable token IDs in the vocabulary"
        },
        {
          "icon": "🚉",
          "label": "Stationmaster's control cars",
          "mapsTo": "BOS/EOS, role tokens, and the chat template"
        }
      ],
      "boundary": "The analogy can suggest that every token is a readable word, but a real token may be a word, a leading-space fragment, several UTF-8 bytes, or even a piece spanning characters. IDs have no universal meaning across tokenizers, and segmentation does not directly reveal how well the model understands a concept."
    }
  },
  {
    "n": 10,
    "t": "KV Cache",
    "s": "Trade memory for less repeated work during decoding",
    "goal": "Understand prefill and decode, K/V tensor layouts, cache sizing, and the cost of long contexts.",
    "concept": [
      "Attention Q, K, and V",
      "Prefill and autoregressive decode",
      "Cache shape by layer and head",
      "Paged KV, sliding windows, and quantization"
    ],
    "analogy": "It is like caching already validated protocol headers: a new token contributes only its new Q/K/V increment, so the complete historical payload does not need to be parsed again.",
    "diagram": "Prompt tokens ──Prefill──► K,V cache\nNew token ──Q + cached K,V──► attention ─► next token ─► append cache",
    "code": "kv_bytes ≈ layers * 2 * tokens * kv_heads * head_dim * bytes_per_value\n# 2 = K + V; batch, dtype, and GQA change the actual value",
    "lab": "Build a KV-cache calculator: vary context length, layer count, KV heads, head dimension, and dtype, then observe PSRAM or VRAM usage.",
    "questions": [
      "Why is decode often limited by memory bandwidth?",
      "How do GQA and MQA reduce KV-cache size?",
      "What capabilities does a sliding window sacrifice?"
    ],
    "next": "LLM Runtime",
    "lesson": [
      {
        "title": "Use one layer of causal attention to see why K and V are stored",
        "body": "Linear projections turn each token's hidden state into Q, K, and V. The current Q is compared with all visible historical K values; after the causal mask and softmax, the resulting scores weight historical V values. With fixed model weights, an old token's K/V at that layer does not change when a new token arrives, so it can be cached. Q serves only the current computation and normally need not be retained. The cache avoids recomputing historical K/V projections, but attention still reads the historical cache and its cost grows with context length."
      },
      {
        "title": "Prefill and decode have different resource profiles",
        "body": "Prefill processes the entire prompt at once, can parallelize across tokens, often achieves high compute utilization, and writes each layer's K/V contiguously. Decode handles only one new token per round but reads an ever-growing history, so it often becomes memory-bandwidth bound. Time to first token reflects queuing and prefill, while later responsiveness reflects inter-token latency. Measure them separately: shortening a prompt mainly helps prefill, whereas reducing KV bytes or improving locality affects long-context decode more directly."
      },
      {
        "title": "Calculate the cache slope from the model architecture first",
        "body": "A common approximation is batch×layers×2×tokens×kv_heads×head_dim×bytes per element, where 2 represents K and V; implementations add alignment and paging metadata. Do not substitute attention heads for kv_heads, because they differ in GQA/MQA models. Express the formula as “bytes added per new token per session,” then add weights, temporary workspace, and runtime overhead. If the measured slope differs, inspect the cache dtype, sliding-window policy, and preallocation."
      },
      {
        "title": "Compression and management policies sacrifice different things",
        "body": "MQA and GQA reduce KV heads in the model architecture and cannot be switched on losslessly for any trained model. Low-bit KV caches reduce capacity and bandwidth, but long-context quality and kernel support must be validated. A sliding window limits access to distant history; paging primarily reduces fragmentation without changing the tensor volume per valid token; a prefix cache reuses prefill only when tokens and positions match exactly. These strategies can be combined, but record the source of each saving so paging is not misreported as numerical compression."
      },
      {
        "title": "Validate the runtime with growth curves and state-disruption tests",
        "body": "Hold the model and sampling parameters fixed, increase prompt length in steps, and record prefill time, per-token latency, used and reserved KV bytes, and output consistency. Then raise concurrency and observe fragmentation, eviction, and tail latency. State tests must cover reclamation after cancellation, session reset, prefix hits and misses, context shifting, and EOS. For the same token sequence, a reference path with caching disabled should produce the same logits within tolerance. If an edited history still hits the old cache, the position or cache key is wrong—it is not a performance optimization."
      },
      {
        "title": "Use a capacity example to catch a kv_heads error",
        "body": "For 32 layers, 8 KV heads, head_dim 128, and FP16, each token consumes 32×2×8×128×2=131072 bytes, or 128 KiB. A 4096-token context is about 512 MiB, and four sessions are about 2 GiB before alignment and other overhead. Substituting 32 query heads would overestimate the total fourfold. Read layers and kv_heads from model metadata, compare the formula with runtime allocations, and distinguish live usage from reserved capacity."
      },
      {
        "title": "Validate a paged cache as a concurrent state machine",
        "body": "A paged runtime maps each sequence's logical positions to fixed-size KV blocks. Large blocks waste space in the final partially used block; small blocks increase page-table and scheduling overhead. Continuous batching must find a free slot for every new token on every round. Prefix sharing needs reference counts on shared pages and copy-on-write when any session continues, so one sequence cannot overwrite another's prefix. Cancellation, timeout, and EOS must use the same release path. Randomly start, grow, and cancel sessions under stress; verify that the free-block count returns to baseline and eviction never corrupts another sequence's positions or contents. Also measure page lookup, copy, and reclamation time across concurrency levels so a capacity optimization does not create new tail latency."
      }
    ],
    "pitfall": "Budgeting RAM from the weight file alone and ignoring the KV cache for a long prompt produces a model that loads successfully but runs out of memory as soon as the request grows.",
    "references": [
      [
        "Original GQA paper",
        "https://arxiv.org/pdf/2305.13245"
      ],
      [
        "Original Prompt Cache paper",
        "https://arxiv.org/pdf/2311.04934"
      ],
      [
        "llama.cpp llama-bench",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench/README.md"
      ]
    ],
    "quiz": [
      {
        "prompt": "What is the main benefit of a KV cache?",
        "options": [
          "It removes the need for weights",
          "It avoids recomputing the entire history's K/V for every generated token",
          "It automatically reduces tokenization time",
          "It converts the model to int8"
        ],
        "answer": 1,
        "explanation": "The cache preserves attention state for processed tokens. A new token still computes its own state and attends to history, but historical K/V is not rebuilt."
      },
      {
        "prompt": "How does KV-cache capacity usually relate to context length?",
        "options": [
          "They are completely unrelated",
          "It grows approximately linearly",
          "It must grow quadratically",
          "It halves every time"
        ],
        "answer": 1,
        "explanation": "Every added token normally contributes one K and one V vector at every layer, so storage grows approximately linearly with token count."
      },
      {
        "prompt": "How does GQA reduce the KV cache?",
        "options": [
          "It removes every query head",
          "Multiple query heads share a smaller number of K/V heads",
          "Every token uses one shared embedding",
          "It compresses HTTP responses"
        ],
        "answer": 1,
        "explanation": "GQA sits between MHA and MQA, grouping query heads around shared K/V heads to trade quality against capacity and bandwidth."
      }
    ],
    "readingMinutes": 19,
    "keywords": [
      {
        "term": "Prefill",
        "definition": "The phase that processes the existing prompt at once and builds the KV cache.",
        "espAnalogy": "Like parsing and caching the complete handshake state up front."
      },
      {
        "term": "Decode",
        "definition": "The phase that generates one token at a time and appends state.",
        "espAnalogy": "Like a real-time loop continuously receiving incremental events."
      },
      {
        "term": "KV cache",
        "definition": "Key/value tensors retained for historical tokens.",
        "espAnalogy": "Like caching parsed headers to avoid reparsing the historical payload."
      },
      {
        "term": "GQA",
        "definition": "An attention design in which multiple query heads share fewer K/V heads.",
        "espAnalogy": "Like several consumers sharing one set of read-only indexes to save memory."
      }
    ],
    "recap": "The previous chapter turned a prompt into token IDs. This chapter follows the historical state of those IDs during generation: why a new token need not recompute the entire prefix, yet requires memory to retain K/V.",
    "nextPreview": "The next chapter places the KV cache, model weights, and sampling loop inside an LLM runtime and examines cancellation, concurrency, and the responsibility boundary between an ESP32 and its host.",
    "history": {
      "intro": "The history of the KV cache reflects autoregressive generation's transition from mathematical feasibility to system scalability. The Transformer defined attention; MQA and GQA then reduced state per token, while paging, reuse, and quantization began addressing the memory-management problems of dynamic sessions.",
      "milestones": [
        {
          "year": "2017",
          "title": "The Transformer establishes scaled dot-product and multi-head attention",
          "body": "The Transformer replaced recurrence with scaled dot-product attention over Q, K, and V, and used a causal mask so a decoder could access only positions up to the current one.",
          "source": {
            "label": "Original Attention Is All You Need paper",
            "url": "https://arxiv.org/abs/1706.03762"
          }
        },
        {
          "year": "2019",
          "title": "MQA targets incremental-decoding bandwidth directly",
          "body": "Multi-Query Attention lets multiple query heads share one set of K/V heads, substantially shrinking the K/V tensors repeatedly read during incremental decoding.",
          "source": {
            "label": "Original MQA paper",
            "url": "https://arxiv.org/abs/1911.02150"
          }
        },
        {
          "year": "2023",
          "title": "GQA adds a step between quality and cache size",
          "body": "Grouped-Query Attention lets a group of query heads share one K/V head, providing a tunable compromise between conventional multi-head attention and single-group MQA.",
          "source": {
            "label": "Original GQA paper",
            "url": "https://arxiv.org/abs/2305.13245"
          }
        },
        {
          "year": "2023",
          "title": "PagedAttention addresses fragmentation from dynamic sessions",
          "body": "Borrowing from virtual-memory paging, PagedAttention maps the variably growing KV cache of each request onto non-contiguous blocks and supports more flexible sharing.",
          "source": {
            "label": "Original PagedAttention paper",
            "url": "https://arxiv.org/abs/2309.06180"
          }
        },
        {
          "year": "2024",
          "title": "KV quantization becomes an optimization area of its own",
          "body": "KIVI analyzes the numerical distributions of keys and values and quantizes them along different dimensions, showing that cache precision can be budgeted independently, just like weight precision.",
          "source": {
            "label": "Original KIVI paper",
            "url": "https://arxiv.org/abs/2402.02750"
          }
        },
        {
          "year": "Present",
          "title": "Local runtimes expose cache types and offload policies",
          "body": "Executors such as llama.cpp make K/V data types, offload, context length, and cache reuse configurable; the cache is now a deployment setting rather than a hidden implementation detail.",
          "source": {
            "label": "Official llama.cpp CLI documentation",
            "url": "https://github.com/ggml-org/llama.cpp/blob/master/tools/cli/README.md"
          }
        }
      ],
      "bridge": "When selecting a model today, the weight file is only a static admission ticket; the KV cache is what grows with tokens and sessions. Capacity, read bandwidth, positional semantics, eviction policy, and resource reclamation on cancellation must all be determined during runtime design."
    },
    "visual": {
      "title": "How a new token reads and extends the KV cache",
      "description": "The player separates the one-time prefill from repeated decode and shows the cache growing step by step.",
      "steps": [
        {
          "icon": "📜",
          "label": "Prefill the prompt",
          "data": "N prompt tokens",
          "action": "Process the existing sequence in parallel and generate K/V at every layer",
          "insight": "The first pass concentrates computation and establishes historical state"
        },
        {
          "icon": "🗃️",
          "label": "Write the layered cache",
          "data": "[layer, seq, pos, kv_head, dim]",
          "action": "Store the prompt's keys and values by position",
          "insight": "Cache size grows approximately linearly with token count"
        },
        {
          "icon": "✨",
          "label": "Produce a new query",
          "data": "1 new token → Q, K, V",
          "action": "Compute this round's projections only for the newest token",
          "insight": "Old tokens' K/V projections need not be repeated"
        },
        {
          "icon": "🔎",
          "label": "Scan history",
          "data": "Q × Kᵀ → weights → V",
          "action": "Read all visible cache entries and compute causal attention",
          "insight": "Avoiding recomputation does not eliminate historical reads"
        },
        {
          "icon": "🎲",
          "label": "Sample the next token",
          "data": "logits → token id",
          "action": "Apply the sampling policy and emit incremental text",
          "insight": "Sampling changes the sequence; cache management does not change model semantics"
        },
        {
          "icon": "➕",
          "label": "Append and repeat",
          "data": "tokens = N + 1",
          "action": "Place the new K/V at the next position and enter another decode round",
          "insight": "Longer contexts create greater capacity and read-bandwidth pressure"
        }
      ],
      "loop": "“Append and repeat” returns to “Produce a new query” until EOS, a length limit, or cancellation. Cancellation must release the pages or slots owned by that sequence."
    },
    "analogyDetail": {
      "title": "A detective's growing case-file index cards",
      "story": "After reading each page of testimony, the detective does not reread the case from page one. Instead, every layer of analysis produces two index cards: one says how to locate this clue in the future, and the other says what content to retrieve when it is found. A new question carries a query card across the historical index, forms a judgment, and appends the new testimony's cards.",
      "illustration": [
        {
          "icon": "❓",
          "label": "Current query card",
          "mapsTo": "The Query produced by the new token at each layer"
        },
        {
          "icon": "🗂️",
          "label": "Clue index card",
          "mapsTo": "The Key cache for historical tokens"
        },
        {
          "icon": "📝",
          "label": "Clue content card",
          "mapsTo": "The Value cache for historical tokens"
        },
        {
          "icon": "📚",
          "label": "Layered file cabinet",
          "mapsTo": "Cache organized by layer, sequence, position, and KV head"
        }
      ],
      "boundary": "A KV cache is not a readable summary, fact database, or lossless copy of the source tokens. It contains intermediate tensors specific to model weights, positional encoding, and precision. Changing the model, moving prefix positions, or editing any history generally invalidates the old cards, and caching does not make attention itself constant-cost."
    }
  },
  {
    "n": 11,
    "t": "LLM Runtime",
    "s": "Orchestrate the model, cache, and generation loop",
    "goal": "Understand the runtime lifecycle, computation graph, sampler, and memory management, and divide responsibilities between an ESP32 and a Linux host.",
    "concept": [
      "Model loading and mmap",
      "Prefill/decode scheduling",
      "Sampling: temperature, top-k, and top-p",
      "Thread, batch, and context management",
      "Streaming output and cancellation"
    ],
    "analogy": "A runtime is like a real-time bus scheduler: it manages buffers, operators, timeouts, and event callbacks, while the model is only one application module attached to the bus.",
    "diagram": "Load model → allocate context → prefill → decode loop → sample → stream token\n                                  └── stop/EOS/cancel ──┘",
    "code": "llama-cli -m model.gguf -p \"Explain UART framing\" -n 64\nllama-server -m model.gguf --host 0.0.0.0 --port 8080",
    "lab": "Start a local server and send HTTP requests from an ESP32; test time to first token, streaming output, request cancellation, and concurrency limits.",
    "questions": [
      "Which stages dominate time to first token and tokens per second?",
      "Why must a generation loop support cancellation?",
      "Where is the security boundary for tool calling from a device?"
    ],
    "next": "LLM Quantization",
    "lesson": [
      {
        "title": "Distinguish process resources from session state first",
        "body": "Weight mappings, backends, and thread pools usually belong to the process and can be shared across requests. Token sequences, KV caches, sampler state, and stopping conditions belong to a session and must be isolated. Draw separate lifecycles for both object classes: weights are released when the process exits, while a context is returned as soon as its request ends. Putting session pointers into a global singleton causes histories to overwrite each other under concurrency; reloading weights for every request lets initialization dominate TTFT."
      },
      {
        "title": "Prefill and decode are two different workloads",
        "body": "Prefill processes a whole prompt at once, creates larger matrices, and usually uses parallel compute more effectively. Decode adds only one or a few tokens per step, yet traverses every layer and reads historical KV, so memory bandwidth and kernel-launch overhead often dominate. One average tokens/s value cannot describe both. Record prompt tokens/s, TTFT, and per-token latency separately, using realistic input lengths; otherwise an optimization may accelerate only the stage that matters least."
      },
      {
        "title": "The sampler is a reproducible decision pipeline",
        "body": "After the model emits logits, repetition penalties, temperature scaling, top-k, top-p, and random selection alter the candidate distribution in a defined order. A different order or random seed can make output diverge. For correctness debugging, begin with greedy decoding or a fixed seed and preserve sampling parameters plus summaries of the first few logits. Tool calling should also use grammar or schema constraints, but parseable structure does not prove that a command is authorized."
      },
      {
        "title": "Streaming and cancellation must share one control path",
        "body": "SSE, WebSocket, and chunked HTTP are only output channels. The harder question is whether a decode task observes a cancellation flag at its next safe point after the client disconnects, then leaves the queue and releases KV resources. Give every request an explicit state machine: queued, prefill, decode, completed, cancelled, and failed, with each terminal state reclaiming resources exactly once. Inject slow consumers, partial packets, timeouts, and repeated cancellation, and check for hanging threads and memory leaks."
      },
      {
        "title": "Keep a deterministic gate between the ESP32 and the host",
        "body": "The Linux host can handle tokenization, the LLM runtime, and natural-language interpretation, while the ESP32 retains sensing, actuator interlocks, watchdogs, and local fallback. A tool name and arguments generated by the model are only a proposal. The device must recheck an allowlist, numeric ranges, current state, and the request nonce. Replay unauthorized GPIO access, duplicate sequence numbers, expired commands, host disconnection, and malformed frames; verify that the device rejects them and leaves a correlatable audit trail."
      }
    ],
    "pitfall": "Treating LLM output as a GPIO or motor command that can execute directly bypasses the embedded system's safety boundary; running the model locally does not change this fact.",
    "references": [
      [
        "llama.cpp Server",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md"
      ],
      [
        "Hugging Face Chat Templates",
        "https://huggingface.co/docs/transformers/en/chat_templating"
      ],
      [
        "Original Prompt Cache paper",
        "https://arxiv.org/pdf/2311.04934"
      ]
    ],
    "quiz": [
      {
        "prompt": "Which stages contribute most directly to TTFT?",
        "options": [
          "Decode sampling only",
          "Request handling, tokenization, prefill, and all work before the first token",
          "Network DNS only",
          "Model download only"
        ],
        "answer": 1,
        "explanation": "The input must be processed and prompt prefill must complete before the first token can be returned. TTFT and subsequent tokens/s are therefore dominated by different workloads."
      },
      {
        "prompt": "Why does a generation loop need cancellation?",
        "options": [
          "Cancellation improves model accuracy",
          "It releases compute and KV-cache resources after a user disconnects or times out",
          "The tokenizer cannot process long text",
          "It retrains the weights"
        ],
        "answer": 1,
        "explanation": "Without cancellation, invalid requests continue consuming memory and compute. In a multi-request runtime, this directly worsens latency for other requests."
      },
      {
        "prompt": "What is the safest response when an ESP32 receives an LLM tool call?",
        "options": [
          "Execute the generated string directly",
          "Authorize it again using a local allowlist, parameter ranges, and the device state machine",
          "Write the command into the bootloader",
          "Disable the watchdog"
        ],
        "answer": 1,
        "explanation": "Model output is untrusted input. The hardware side must preserve deterministic policy and least privilege; a model cannot replace the safety controller."
      }
    ],
    "readingMinutes": 18,
    "keywords": [
      {
        "term": "Context",
        "definition": "The tokens and KV state held by one inference session.",
        "espAnalogy": "Like the protocol-state block for one connection."
      },
      {
        "term": "Sampling",
        "definition": "The policy used to choose the next token from logits.",
        "espAnalogy": "Like choosing one output from candidate actions under a policy."
      },
      {
        "term": "Streaming",
        "definition": "Sending output while it is generated instead of waiting for a complete response.",
        "espAnalogy": "Like segmented UART output that improves perceived first-response latency."
      },
      {
        "term": "Cancellation",
        "definition": "A mechanism that aborts an obsolete request and releases its resources.",
        "espAnalogy": "Like reclaiming DMA and task resources after a socket closes."
      }
    ],
    "recap": "The previous chapter quantified the resource implications of a KV cache. This chapter places that cache in a real runtime: who loads the model, who allocates context, who streams output, and which controller should perform the final action.",
    "nextPreview": "The next chapter compresses LLM weights, separates the GGUF container from block-quantization formats, and selects deployment artifacts using measurable quality and resource criteria.",
    "history": {
      "intro": "What we now call an LLM runtime did not suddenly appear as a “model player.” It inherits ideas from compilers, operating-system scheduling, numerical libraries, and online serving systems: make a computation graph executable, make state reusable, and then complete many requests reliably within controlled resources. Seen along this timeline, prefill, decode, KV cache, streaming, and cancellation are not unrelated APIs but stages of one lifecycle.",
      "milestones": [
        {
          "year": "2017",
          "title": "The Transformer establishes parallel prefill and autoregressive decode",
          "body": "Attention Is All You Need replaces recurrence with an attention-only architecture, allowing an entire input to be processed with high parallelism while generation still emits the next token from the accumulated prefix. Modern runtimes therefore divide naturally into one throughput-oriented prefill and many latency-sensitive decode rounds.",
          "source": {
            "label": "Original Transformer paper",
            "url": "https://arxiv.org/abs/1706.03762"
          }
        },
        {
          "year": "2022",
          "title": "FlashAttention moves attention optimization from FLOPs to I/O",
          "body": "FlashAttention explicitly includes transfers between HBM and on-chip SRAM in algorithm design and uses tiling to reduce intermediate movement. It reminds runtime engineers that mathematically equivalent work need not take equal time; a kernel's data path often explains real speed better than nominal arithmetic.",
          "source": {
            "label": "Original FlashAttention paper",
            "url": "https://arxiv.org/abs/2205.14135"
          }
        },
        {
          "year": "2023",
          "title": "llama.cpp advances local LLM execution on general-purpose hardware",
          "body": "With a lightweight C/C++ implementation, llama.cpp brings model loading, quantized kernels, mixed CPU/GPU execution, and the command-line generation loop into one project. Local inference moves from research script to embeddable process, and mmap, thread count, context, and backend become ordinary deployment parameters.",
          "source": {
            "label": "Official llama.cpp repository",
            "url": "https://github.com/ggml-org/llama.cpp"
          }
        },
        {
          "year": "2023",
          "title": "PagedAttention turns KV management into a virtual-memory problem",
          "body": "vLLM's PagedAttention organizes the KV cache into fixed blocks, reducing fragmentation and waste from large contiguous allocations while enabling more flexible request scheduling. A runtime now manages session state, pages, batching, and reclamation like an operating system, in addition to executing operators.",
          "source": {
            "label": "Original PagedAttention paper",
            "url": "https://arxiv.org/abs/2309.06180"
          }
        },
        {
          "year": "2024–Present",
          "title": "Local runtimes acquire complete service semantics",
          "body": "Modern llama-server versions include parallel decoding, continuous batching, streaming APIs, monitoring, structured output, and cancellation in the service layer. Engineering emphasis moves from “generate one sentence” to resource isolation, observability, protocol compatibility, and the safety boundary around untrusted tool calls.",
          "source": {
            "label": "Official llama.cpp Server documentation",
            "url": "https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md"
          }
        }
      ],
      "bridge": "This history connects the chapter's two main threads: the Transformer determines the computational shape of generation, while systems research and local runtimes determine how state is allocated, scheduled, and reclaimed. Draw both data flow and control flow, paying particular attention to cancellation, timeout, and exceptional cleanup—the paths that most clearly separate a demonstration from a reliable product."
    },
    "visual": {
      "title": "How a request passes through a cancellable generation loop",
      "description": "At every step, the player updates request data, runtime action, and observable evidence together. Decode forms a loop until an explicit termination condition is met.",
      "steps": [
        {
          "icon": "📨",
          "label": "Receive request",
          "data": "messages + max_tokens + request_id",
          "action": "Validate size, template, and authorization policy; reject unbounded requests",
          "insight": "Early rejection avoids consuming expensive context and queue time"
        },
        {
          "icon": "🔢",
          "label": "Encode and allocate",
          "data": "[BOS, 421, 87, …] + context slot",
          "action": "Tokenize, verify the total token budget, and attach a cancellation handle",
          "insight": "Character count cannot replace token count; context overflow is visible here"
        },
        {
          "icon": "🏗️",
          "label": "Prefill",
          "data": "prompt tokens → K/V blocks per layer",
          "action": "Run the prompt in a batch and establish the initial KV cache",
          "insight": "This stage mainly affects TTFT and deserves a separate prompt-tokens/s metric"
        },
        {
          "icon": "🎲",
          "label": "Sample",
          "data": "logits → candidate distribution → token",
          "action": "Apply penalties, temperature, and top-k/top-p in a deterministic order",
          "insight": "A fixed seed and parameters are required to reproduce the divergence point"
        },
        {
          "icon": "📡",
          "label": "Decode and stream",
          "data": "new token + cached K/V → text chunk",
          "action": "Append KV, decode text, and send an increment to the client",
          "insight": "Slow consumers need backpressure; unsent tokens cannot accumulate without bound"
        },
        {
          "icon": "🧹",
          "label": "Terminate and reclaim",
          "data": "EOS | stop | limit | cancel | error",
          "action": "Finish the state machine and return the slot, KV pages, and network resources",
          "insight": "Every exit path should converge on idempotent cleanup logic"
        }
      ],
      "loop": "If no EOS, stop string, length limit, error, or cancellation is reached, return from “Decode and stream” to “Sample.” Use the previous token as new input, reuse existing KV, and check the deadline and connection state on every turn."
    },
    "analogyDetail": {
      "title": "Think of the runtime as a busy noodle shop",
      "story": "Model weights are the fixed recipes on the wall and can be loaded once for reuse. Each customer's prompt is a new order; prefill is the cook reading every customization at once and preparing the work surface, while the KV cache is that table's private tray of partially prepared ingredients. Decode then performs one small step and serves one token at a time. The sampler chooses among acceptable seasonings, and streaming lets the customer begin eating before the whole meal is finished. If the customer leaves, a cancellation bell must stop the kitchen immediately and return the tray.",
      "illustration": [
        {
          "icon": "📕",
          "label": "Fixed recipes",
          "mapsTo": "Model weights and tokenizer loaded and verified at process startup"
        },
        {
          "icon": "🧾",
          "label": "Order queue",
          "mapsTo": "Request validation, templating, tokenization, and context allocation"
        },
        {
          "icon": "🥣",
          "label": "Private tray",
          "mapsTo": "A KV cache owned and continuously extended by one session"
        },
        {
          "icon": "🔔",
          "label": "Stop bell",
          "mapsTo": "Disconnection, timeout, EOS, or user cancellation triggering resource reclamation"
        }
      ],
      "boundary": "The noodle-shop analogy breaks down for parallel execution: a GPU batch is not several cooks each preparing one bowl, but one operation combining similar matrix work from different requests. A token is not an independent dish either; it changes every probability in the next step. The analogy explains lifecycle and ownership, not throughput, VRAM layout, or sampling mathematics."
    }
  },
  {
    "n": 12,
    "t": "LLM Quantization and GGUF",
    "s": "Compress weights into a deployable model file",
    "goal": "Understand block quantization, mixed precision, weight metadata, and their relationship to the GGUF container.",
    "concept": [
      "Q4 does not mean exactly 4 bits per parameter",
      "Block scales and overhead",
      "Tradeoffs among Q4_K_M, Q5_K_M, and IQ",
      "W4A16, W8A8, and weight-only quantization",
      "GGUF metadata and mmap"
    ],
    "analogy": "Quantization does not simply truncate every byte. It compresses groups of values and attaches a dictionary for interpreting them, while sensitive layers can retain greater precision.",
    "diagram": "FP16 tensor → blocks → quantized values + scales/mins → GGUF tensor + metadata → runtime kernel",
    "code": "python convert_hf_to_gguf.py ./model --outfile model-f16.gguf\nllama-quantize model-f16.gguf model-q4_k_m.gguf Q4_K_M\nllama-cli -m model-q4_k_m.gguf -p \"hello\"",
    "lab": "Compare the same model in F16, Q8, and Q4 by file size, a perplexity proxy, time to first token, and peak memory.",
    "questions": [
      "Why does requantization damage quality?",
      "Is GGUF a container or a quantization algorithm?",
      "Which tensors are worth retaining at higher precision?"
    ],
    "next": "Inference Frameworks",
    "lesson": [
      {
        "title": "Calculate real BPW instead of trusting the Q4 name",
        "body": "In addition to low-bit codes, block quantization stores each block's scale, minimum, and alignment padding; some formats also mix tensor precisions. The file's average bits per weight therefore usually differs from the number in the name. Verify it by reading GGUF tensor types and element counts and summing data bytes and metadata overhead separately, then compare with an FP16 baseline. The capacity budget must also add the tokenizer, KV cache, and runtime workspace: model-file size is not peak RAM."
      },
      {
        "title": "Block size controls compression and local adaptability",
        "body": "When a group of weights shares quantization parameters, a larger block lowers scale overhead but struggles to cover small values and outliers at once. A smaller block adapts more closely to local ranges but adds parameters, indexes, and kernel-processing cost. Per-tensor, per-channel, and block-wise are not abstract labels; they choose granularity between statistical fit and storage access. Inspect the exact target-format layout rather than forcing one generic formula onto every Q4 scheme."
      },
      {
        "title": "Let sensitivity and kernels determine mixed precision together",
        "body": "Embeddings, output projections, attention, and some MoE tensors differ in their sensitivity to error; K-quant suffixes often denote a mixed recipe. Generate several candidates from the same high-precision GGUF, compare them on identical calibration samples and task sets, and confirm that the backend has efficient kernels for every tensor type in the recipe. If a few layers repeatedly fall back or dequantize, boundary conversion can erase the bandwidth savings."
      },
      {
        "title": "GGUF is a self-describing container, not a quality certificate",
        "body": "A loader interprets a file from its magic, version, alignment, tensor shapes and types, and architecture metadata; tokenizer- and chat-template-related fields also determine input semantics. A valid format proves only that the bytes can be parsed, not that the weights have a trustworthy source, the quantization was correct, or the model output is sound. Preserve the source revision, converter commit, quantization command, and hash, and inspect critical metadata with a dump tool before deployment to prevent silent “loads correctly but answers consistently wrong” failures."
      },
      {
        "title": "Build a one-way release pipeline for irreversible conversion",
        "body": "Quantization discards information. Requantizing Q4 into Q5 cannot restore precision and instead adds another round of rounding error. Keep trusted FP16/BF16 or official source weights and make conversion and quantization reproducible builds with a fixed input hash, fixed tool versions, and separately named outputs. Acceptance must measure file size, peak resident memory, PP/TG speed, task correctness, and long-output anomalies together so every regression can be traced back to a recipe."
      }
    ],
    "pitfall": "Requantizing an already quantized GGUF accumulates error. Generate every target quantization from an F16/BF16 or higher-precision source artifact.",
    "references": [
      [
        "GGUF Format Specification",
        "https://github.com/ggerganov/ggml/blob/master/docs/gguf.md"
      ],
      [
        "llama.cpp llama-bench",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench/README.md"
      ]
    ],
    "quiz": [
      {
        "prompt": "What is an important use of GGUF metadata?",
        "options": [
          "Replacing every model weight",
          "Describing model and quantization information so an executor can load it correctly",
          "Improving Wi-Fi RSSI",
          "Recording the full training dataset"
        ],
        "answer": 1,
        "explanation": "GGUF key-value metadata provides extensible identifiers and configuration, while the runtime must still read the actual tensor data."
      },
      {
        "prompt": "Why does “Q4” not necessarily mean exactly 4 bits per parameter?",
        "options": [
          "Quantization never compresses a file",
          "Block quantization also stores auxiliary data such as scale and minimum values",
          "GPUs cannot process integers",
          "The tokenizer changes the bit width"
        ],
        "answer": 1,
        "explanation": "Block codes use a low bit width, but every block carries parameters needed to interpret those codes. Actual bits per weight depend on the specific format."
      },
      {
        "prompt": "Which metric alone is least sufficient when comparing two GGUF quantizations?",
        "options": [
          "File size",
          "Latency and a quality proxy under a fixed prompt",
          "Peak memory",
          "Throughput under identical parameters"
        ],
        "answer": 0,
        "explanation": "A smaller file is not necessarily faster or accurate enough on the target device. Deployment decisions must measure quality, memory, power, and stage-level performance together."
      }
    ],
    "readingMinutes": 18,
    "keywords": [
      {
        "term": "GGUF",
        "definition": "A model-container format used by GGML-family executors.",
        "espAnalogy": "Like a firmware image with an extensible descriptor area."
      },
      {
        "term": "Block quantization",
        "definition": "Low-bit encoding in which values in a block share parameters such as a scale.",
        "espAnalogy": "Like compressing a batch of samples and attaching that batch's range."
      },
      {
        "term": "Weight-only",
        "definition": "A strategy that quantizes weights while keeping activations at higher precision.",
        "espAnalogy": "Like compressing firmware constants while preserving compute-workspace precision."
      },
      {
        "term": "mmap",
        "definition": "Mapping a file into virtual memory for on-demand access.",
        "espAnalogy": "Like reading firmware resources by page to avoid copying everything at once."
      }
    ],
    "recap": "The previous chapter established the runtime lifecycle and host/MCU division of work. This chapter addresses the model file itself: how to package high-precision weights in GGUF and understand the real space and quality cost of a quantization format.",
    "nextPreview": "The next chapter moves from one model file to multiple inference frameworks and backends, comparing CPU/GPU/NPU partitioning, ahead-of-time compilation, and fallback.",
    "history": {
      "intro": "The history of low-bit models is not a story of simply truncating floating-point values into integers. Early compression research already treated pruning, quantization, and coding as separate layers. The LLM era then exposed outlier channels, layer sensitivity, and specialized-kernel requirements. GGUF addresses another dimension: reliably packaging tensors, quantization types, and the metadata needed to interpret a model into one quickly readable container.",
      "milestones": [
        {
          "year": "2015",
          "title": "Deep Compression places quantization in a systematic compression pipeline",
          "body": "Deep Compression combines pruning, post-training quantization, and Huffman coding, demonstrating that reduced bit width is only one stage of a compression pipeline. It also establishes an important engineering discipline: validate both task accuracy and actual storage savings after compression rather than reporting theoretical bit counts alone.",
          "source": {
            "label": "Original Deep Compression paper",
            "url": "https://arxiv.org/abs/1510.00149"
          }
        },
        {
          "year": "2022",
          "title": "LLM.int8 reveals the cost of large-model outlier features",
          "body": "LLM.int8 observes systematic large magnitudes in certain hidden dimensions and keeps those outlier computations on a mixed-precision path. This moves quantization beyond reducing every weight uniformly and explains why algorithms labeled int8 can have very different quality and kernel requirements.",
          "source": {
            "label": "Original LLM.int8 paper",
            "url": "https://arxiv.org/abs/2208.07339"
          }
        },
        {
          "year": "2022",
          "title": "GPTQ makes one-shot weight quantization practical for very large models",
          "body": "GPTQ uses approximate second-order information to quantize weights layer by layer, bringing large models into the 3- to 4-bit range without complete retraining. It strengthens the view that error must be compensated according to weight interactions and makes calibration samples and quantization order part of the deployment artifact.",
          "source": {
            "label": "Original GPTQ paper",
            "url": "https://arxiv.org/abs/2210.17323"
          }
        },
        {
          "year": "2023",
          "title": "GGUF unifies the tensor container and extensible metadata",
          "body": "As the successor to GGML, GGMF, and GGJT, GGUF reduces ambiguity through typed key-value metadata, an aligned tensor area, and explicit version fields, while supporting mmap access. It does not require one particular quantization; tensors of different types can coexist in the same container.",
          "source": {
            "label": "Official GGUF specification",
            "url": "https://github.com/ggml-org/ggml/blob/master/docs/gguf.md"
          }
        },
        {
          "year": "2023–Present",
          "title": "Mixed-quantization recipes become target-hardware build steps",
          "body": "llama.cpp quantization tools support K-quants, importance matrices, and per-tensor type overrides. Practice moves from choosing one “Q4” label to retaining sensitive tensors, matching kernels, checking a perplexity proxy, and measuring on the target hardware. Requantizing a low-bit file is also explicitly treated as high risk.",
          "source": {
            "label": "Official llama.cpp Quantize documentation",
            "url": "https://github.com/ggml-org/llama.cpp/blob/master/tools/quantize/README.md"
          }
        }
      ],
      "bridge": "GGUF, Q4_K_M, and a “4-bit model” must not be drawn as synonyms. Separate three layers: the quantization algorithm chooses codes, the block format stores codes and scales, and GGUF describes and locates those tensors. Only when the target runtime interprets all three correctly can a smaller file become useful memory, speed, and quality gains."
    },
    "visual": {
      "title": "How high-precision weights become a verifiable GGUF",
      "description": "The animation separates container conversion from tensor quantization so format, algorithm, and final deployment performance are not conflated into one step.",
      "steps": [
        {
          "icon": "🔐",
          "label": "Freeze the baseline",
          "data": "BF16/FP16 weights + tokenizer + revision",
          "action": "Record source, license, hash, and baseline outputs",
          "insight": "Every later low-bit artifact must trace back to the same high-precision starting point"
        },
        {
          "icon": "🗂️",
          "label": "Convert the container",
          "data": "named tensors + typed metadata",
          "action": "Write the GGUF header, architecture fields, vocabulary, and tensor directory",
          "insight": "The file may still be high precision; GGUF and quantization are not the same operation"
        },
        {
          "icon": "📊",
          "label": "Collect sensitivity",
          "data": "calibration tokens → activation/importance stats",
          "action": "Measure layer and weight importance on representative text",
          "insight": "A calibration domain unlike real requests makes a mixed-precision recipe unreliable"
        },
        {
          "icon": "🧊",
          "label": "Quantize blocks",
          "data": "float block → codes + scale/min",
          "action": "Encode with the target type and override precision for sensitive tensors",
          "insight": "Average BPW includes both codes and per-block auxiliary data"
        },
        {
          "icon": "🔎",
          "label": "Verify structure",
          "data": "GGUF dump + tensor inventory + hash",
          "action": "Check version, shape, type, alignment, and required metadata",
          "insight": "Successful parsing is only the first gate and proves nothing about numerical quality"
        },
        {
          "icon": "🏁",
          "label": "Accept on target",
          "data": "quality + RSS + PP/TG + energy",
          "action": "Compare candidates under fixed prompts and software versions",
          "insight": "Only the real backend reveals whether compression produces speed and efficiency gains"
        }
      ],
      "loop": "If quality exceeds its error budget, return to “Collect sensitivity” and broaden representative samples or raise precision for sensitive tensors. If speed does not improve, return to “Quantize blocks” and inspect kernel support and dequantization boundaries. Always regenerate from the high-precision baseline; never chain requantization."
    },
    "analogyDetail": {
      "title": "A compressed paint palette packed into a shipping container",
      "story": "The original FP16 weights resemble tens of thousands of subtly different studio paints. Quantization does not discard colors at random: it groups similar colors into small blocks and creates a finite swatch card for each block. Integer codes are swatch numbers, while scale and minimum are the restoration instructions. Sensitive layers, like a portrait's eyes, can retain a finer palette. GGUF is the shipping container with a manifest: its header records architecture, tokenizer, and alignment rules, while the cargo map says where every tensor lives and which encoding it uses so the runtime can move it to the correct kernel.",
      "illustration": [
        {
          "icon": "🎨",
          "label": "Original pigments",
          "mapsTo": "Trusted FP16/BF16 baseline weights and provenance"
        },
        {
          "icon": "🧩",
          "label": "Block palette",
          "mapsTo": "Quantized values plus per-block scale, minimum, and other parameters"
        },
        {
          "icon": "👁️",
          "label": "Fine-detail region",
          "mapsTo": "Output, embedding, or other sensitive tensors retained at higher precision"
        },
        {
          "icon": "📦",
          "label": "Cargo manifest",
          "mapsTo": "GGUF header, metadata, tensor descriptors, and aligned data area"
        }
      ],
      "boundary": "The paint analogy omits matrix-multiplication kernels: a higher compression ratio does not automatically improve speed. Without a hardware implementation for the encoding, a runtime may dequantize before computing. Perceptually “similar colors” are not a measure of language-model quality either; perplexity or task sets, long-text stability, and target-device benchmarks still decide."
    }
  },
  {
    "n": 13,
    "t": "On-Device LLM Inference Frameworks",
    "s": "Compare runtimes, backends, and compiler-based frameworks",
    "goal": "Build a layered model of GGUF/computation graph/runtime/backend/kernel and learn when to choose llama.cpp, MLC, ONNX Runtime GenAI, or ExecuTorch.",
    "concept": [
      "CPU/GPU/NPU backends",
      "Layer offload and subgraph partitioning",
      "Ahead-of-time and runtime compilation",
      "CLI, HTTP server, and benchmarks",
      "Fallback and observability"
    ],
    "analogy": "A framework resembles an RTOS plus a driver abstraction: upper-layer scheduling stays uniform, while the backend is replaced for each target chip, and unsupported instructions need an explicit fallback path.",
    "diagram": "Model format → Runtime graph → Backend partition\n                         ├─ CPU kernels\n                         ├─ GPU kernels\n                         └─ NPU compiled subgraph",
    "code": "llama-bench -m model-q4_k_m.gguf\n# Watch pp (prompt processing) and tg (token generation)\n# Increase GPU layers gradually; record VRAM, pp/tg, and fallback",
    "lab": "Run the same model through CPU, GPU offload, or an NPU delegate, then organize the results into three columns: available memory, throughput, and power.",
    "questions": [
      "Why do prefill and decode favor different kernels?",
      "How does subgraph partitioning introduce extra copies?",
      "When should a compiler-based framework be preferred?"
    ],
    "next": "Performance Analysis",
    "lesson": [
      {
        "title": "Use a four-layer model to unpack framework claims",
        "body": "Write down model format, runtime, backend, and kernel separately. GGUF or an exported graph expresses the model; the runtime manages lifecycle and scheduling; the backend connects CPU/GPU/NPU; kernels execute concrete layouts and dtypes. When a framework claims to “support” a chip, ask which model architectures, operators, and quantization types actually use specialized kernels. A version mismatch at any layer can cause load failure, silent fallback, or extra conversion."
      },
      {
        "title": "A partition's value depends on boundaries, not node coverage",
        "body": "A delegate usually selects contiguous supported subgraphs. Boundaries may require device copies, layout transforms, quantization or dequantization, and synchronization. Even if 90% of nodes are assigned to an NPU, unsupported nodes interleaved through every layer can make transfers dominate latency. Record the partition count, input and output bytes for each partition, and execution time, then disable the delegate for a control run. Node coverage is a clue, not a performance conclusion."
      },
      {
        "title": "AOT and JIT redistribute deployment responsibility",
        "body": "Ahead-of-time compilation completes lowering, fusion, and target-code generation before release. It can shrink the device runtime and reduce startup jitter, but requires per-chip and per-shape artifact management. JIT adapts to more dynamic situations on site but adds compilation latency, caches, and toolchain dependencies. Firmware and offline products often favor AOT, whereas desktop applications can tolerate JIT. In both cases, record compiler versions, target features, and generation settings in the artifact manifest."
      },
      {
        "title": "Establish an explainable CPU correctness baseline first",
        "body": "Do not enable every offload path on the first run. Fix the input, pre-processing, and sampling on a portable CPU path and preserve outputs or numeric tolerances. Then enable one backend at a time and compare the partition graph, intermediate boundaries, and end-to-end result. If output diverges, inspect dtype, layout, dynamic shape, and quantization parameters before blaming a kernel. This separates model-conversion errors from accelerator-implementation errors instead of guessing from black-box performance numbers."
      },
      {
        "title": "Make framework selection a maintainable acceptance matrix",
        "body": "For every candidate, list target OS and chip, model architecture, maximum context, quantization formats, package size, cold start, peak memory, PP/TG, power, license, and debugging facilities. Prepare normal, boundary, and failing models, including an unsupported operator, a dynamic shape, and a low-memory case; observe whether errors and fallback are visible. Rerun the matrix after every upgrade. A consistent second-place framework whose regressions remain explainable is often a better product choice than a one-time benchmark winner that cannot be diagnosed."
      }
    ],
    "pitfall": "Recording only that “GPU/NPU is enabled” without checking the execution provider, graph partitions, and fallback can make CPU execution look like successful hardware acceleration.",
    "references": [
      [
        "ONNX Runtime Execution Providers",
        "https://onnxruntime.ai/docs/execution-providers/"
      ],
      [
        "ExecuTorch Delegates",
        "https://docs.pytorch.org/executorch/stable/compiler-delegate-and-partitioner.html"
      ],
      [
        "llama.cpp llama-bench",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench/README.md"
      ]
    ],
    "quiz": [
      {
        "prompt": "What does an ONNX Runtime Execution Provider do?",
        "options": [
          "Train a tokenizer",
          "Identify and execute nodes or subgraphs it supports",
          "Generate GitHub Pages",
          "Encrypt Flash"
        ],
        "answer": 1,
        "explanation": "An EP claims executable graph regions through a capability interface and connects different hardware through the same runtime API. Unsupported regions may remain on the CPU."
      },
      {
        "prompt": "When is a compiler-based delegate or backend especially valuable?",
        "options": [
          "When the target hardware and supported operators are fixed and AOT optimization can produce a deployment artifact",
          "When the graph must change randomly and performance does not matter",
          "When no model file exists",
          "When only web navigation is needed"
        ],
        "answer": 0,
        "explanation": "A fixed target allows a subgraph to be prepared and compiled into a deployment binary. The tradeoff is a stricter support matrix and build process that must be validated before release."
      },
      {
        "prompt": "Why can subgraph partitioning reduce end-to-end performance?",
        "options": [
          "It always deletes every operator",
          "Boundaries add device copies, synchronization, and scheduling overhead",
          "It turns weights into text",
          "It disables every cache automatically"
        ],
        "answer": 1,
        "explanation": "Every boundary can move activations and synchronize executors. A few unsupported operators can fragment the accelerated path, so inspect a trace rather than a marketing page."
      }
    ],
    "readingMinutes": 19,
    "keywords": [
      {
        "term": "Backend",
        "definition": "The implementation layer that maps runtime requests onto specific hardware.",
        "espAnalogy": "Like a concrete peripheral driver behind a common driver interface."
      },
      {
        "term": "Offload",
        "definition": "Assigning some layers or subgraphs to an accelerator.",
        "espAnalogy": "Like handing a computation to a coprocessor."
      },
      {
        "term": "Partition",
        "definition": "The process of dividing a graph according to backend capabilities.",
        "espAnalogy": "Like routing tasks onto different buses according to peripheral capabilities."
      },
      {
        "term": "Fallback",
        "definition": "Using the default implementation when an accelerator lacks support.",
        "espAnalogy": "Like returning to a software path when a driver is unavailable."
      }
    ],
    "recap": "The previous chapter selected a model container and weight quantization. This chapter chooses the software stack that actually executes it: how a runtime assigns the graph to CPU, GPU, or NPU, when to precompile, and when fallback is unavoidable.",
    "nextPreview": "The next chapter replaces subjective framework comparisons with a common performance-analysis method built around TTFT, tokens/s, p95, and energy.",
    "history": {
      "intro": "The evolution of edge inference frameworks repeatedly answers one problem: how can a graph from a training framework be mapped reliably onto changing CPUs, GPUs, NPUs, and operating systems? Open intermediate representations enable exchange, tensor compilers automate optimization, lightweight runtimes reduce package size and dependencies, and delegates connect vendor backends to a common upper layer. Today's framework choice combines these paths under specific product constraints.",
      "milestones": [
        {
          "year": "2017",
          "title": "ONNX advances model exchange and operator-version contracts",
          "body": "ONNX describes a model with graphs, nodes, initializers, types, and opsets, allowing training frameworks and executors to collaborate around a common IR. It answers “what is expressed,” not whether the target chip has an efficient implementation. This separation later becomes the first yardstick for comparing runtimes.",
          "source": {
            "label": "Official ONNX concepts documentation",
            "url": "https://onnx.ai/onnx/intro/"
          }
        },
        {
          "year": "2018",
          "title": "TVM demonstrates end-to-end tensor compilation and multi-backend optimization",
          "body": "TVM brings high-level graph optimization, operator fusion, hardware mapping, and low-level scheduling into an automated compilation flow spanning low-power CPUs and mobile GPUs. It reframes “rewrite every kernel for new hardware” as IR lowering, search, and target-code generation.",
          "source": {
            "label": "Original TVM OSDI paper",
            "url": "https://www.usenix.org/conference/osdi18/presentation/chen"
          }
        },
        {
          "year": "2023",
          "title": "llama.cpp proves the value of a specialized lightweight edge runtime",
          "body": "For autoregressive LLMs, llama.cpp tightly integrates GGUF, quantized kernels, KV caching, and multiple CPU/GPU backends, covering desktops and edge devices with relatively few dependencies. It represents another path: deep vertical integration for a primary workload rather than support for arbitrary training graphs.",
          "source": {
            "label": "Official llama.cpp repository",
            "url": "https://github.com/ggml-org/llama.cpp"
          }
        },
        {
          "year": "2023–2024",
          "title": "ExecuTorch separates AOT preparation from backend delegation",
          "body": "ExecuTorch moves program export, the Edge dialect, memory planning, and backend lowering as far as possible into the AOT stage, leaving a compact C++ runtime on the device. Supported subgraphs go to delegates while unsupported regions remain on portable kernels, creating a clear partition-and-fallback model for edge deployment.",
          "source": {
            "label": "Official ExecuTorch architecture documentation",
            "url": "https://docs.pytorch.org/executorch/stable/getting-started-architecture"
          }
        },
        {
          "year": "Present",
          "title": "Competition shifts to compiled artifacts, heterogeneous partitioning, and observability",
          "body": "Systems such as MLC LLM separate weight conversion from compiling a target model library and generate inference logic for WebGPU, mobile GPUs, or native platforms. Engineering comparisons shift from API style to which graphs are supported, when compilation happens, how much crosses partitions, whether fallback is traceable, and whether measurements remain reproducible after an upgrade.",
          "source": {
            "label": "Official MLC LLM compilation documentation",
            "url": "https://github.com/mlc-ai/mlc-llm/blob/main/docs/compilation/compile_models.rst"
          }
        }
      ],
      "bridge": "History shows that no framework is “fastest” independently of model and hardware. General IRs, compiler systems, and vertical runtimes place complexity at different stages. Work backward from the target model's operator set, deployment platform, package-size limit, dynamism, and debugging requirements rather than choosing a brand first. Then establish a CPU baseline with identical inputs and precision and verify offload one region at a time."
    },
    "visual": {
      "title": "How a model graph is partitioned across CPU, GPU, and NPU",
      "description": "The step-by-step player expands abstract “hardware acceleration” into capability queries, partitioning, lowering, boundary transfers, and fallback evidence.",
      "steps": [
        {
          "icon": "🧾",
          "label": "Read the graph contract",
          "data": "ops + shape + dtype + layout + quant params",
          "action": "Validate model version and I/O, then establish a runnable CPU baseline",
          "insight": "A readable format does not mean every node has a target-backend implementation"
        },
        {
          "icon": "🧩",
          "label": "Query capabilities",
          "data": "backend capability table",
          "action": "Match every node's operator, attributes, shape, and precision limits",
          "insight": "Checking only operator names misses attribute and dynamic-dimension constraints"
        },
        {
          "icon": "✂️",
          "label": "Form partitions",
          "data": "CPU graph + delegated subgraphs",
          "action": "Merge contiguous supported nodes and mark fallback islands",
          "insight": "More fragmented partitions generally make device boundaries more expensive"
        },
        {
          "icon": "🏭",
          "label": "Lower and compile",
          "data": "subgraph → backend blob/kernel plan",
          "action": "Fuse, choose layouts, plan memory, and generate target code",
          "insight": "AOT shifts complexity to build time and increases artifact-version responsibility"
        },
        {
          "icon": "🔁",
          "label": "Execute boundaries",
          "data": "host buffer ⇄ device buffer",
          "action": "Copy or map data, synchronize, and execute the delegate",
          "insight": "Copies and layout transforms belong in the end-to-end trace"
        },
        {
          "icon": "🔬",
          "label": "Compare evidence",
          "data": "output diff + partition log + latency + memory",
          "action": "Verify correctness against the CPU baseline before judging gains",
          "insight": "Offload succeeds only when it is correct and its boundary cost is explainable"
        }
      ],
      "loop": "If a partition loses performance, return to “Form partitions” and try to enlarge a contiguous subgraph, remove layout conversion, or keep that region on CPU. If results disagree, return to “Read the graph contract” and compare every boundary. Change only one backend or compiler option at a time."
    },
    "analogyDetail": {
      "title": "Think of an inference framework as an intermodal freight terminal",
      "story": "The model graph is a train whose cars list cargo dependencies, the runtime is the terminal dispatch office, and CPU, GPU, and NPU are road, rail, and water carriers. The partitioner checks cargo dimensions and rules and groups consecutive compatible cars into a subgraph; a delegate is an express-carrier contract that hands the whole group to one backend. An incompatible item returns to the ordinary CPU route. Every route change requires unloading, repacking, and synchronization, so “most cars use the express route” can still lose to one ordinary route from end to end.",
      "illustration": [
        {
          "icon": "🚆",
          "label": "Model train",
          "mapsTo": "A computation graph with shape, dtype, and dependency contracts"
        },
        {
          "icon": "🧭",
          "label": "Dispatch partition",
          "mapsTo": "Contiguous offloadable subgraphs found from backend capabilities"
        },
        {
          "icon": "🚄",
          "label": "Dedicated express line",
          "mapsTo": "A GPU/NPU delegate and its precompiled binary"
        },
        {
          "icon": "🔄",
          "label": "Transfer terminal",
          "mapsTo": "Cross-backend copies, layout transforms, and synchronization"
        }
      ],
      "boundary": "The freight analogy suggests that each segment's cost adds simply, but real runtimes execute asynchronously, reuse buffers, fuse operators, and overlap work with the CPU. A backend may also accept only specific dynamic shapes or quantization parameters. The analogy is useful for identifying boundary costs, not predicting latency; traces and device counters remain decisive."
    }
  },
  {
    "n": 14,
    "t": "Performance Analysis",
    "s": "Turn “it feels slow” into a budget you can localize",
    "goal": "Locate bottlenecks with end-to-end metrics, stage-level timing, hardware counters, and power measurements.",
    "concept": [
      "TTFT, tokens/s, and p50/p95",
      "Operator-level profiles and traces",
      "CPU utilization, cache misses, and bandwidth",
      "Power, temperature, and throttling",
      "The three-way accuracy–latency–energy tradeoff"
    ],
    "analogy": "Treat it like debugging a USB or network protocol: inspect end-to-end timing first, then narrow down to stages, packets, and handlers. Average throughput alone hides tail latency.",
    "diagram": "Request → preprocess → prefill → decode×N → postprocess\n  | wall time | p50/p95 | bytes moved | joules/token | thermal state",
    "code": "time_to_first_token = prefill_end - request_start\ntokens_per_second = generated_tokens / decode_seconds\njoules_per_token = energy_j / generated_tokens",
    "lab": "Build a benchmark table with a fixed prompt, temperature, thread count, and power conditions. Repeat at least 5 times and report the median and p95.",
    "questions": [
      "Why must the prompt and warm-up conditions be fixed?",
      "If tokens/s rises but joules/token worsens, is that a successful optimization?",
      "How can you distinguish a slow model, slow memory, and a slow streaming network?"
    ],
    "next": "System Integration",
    "lesson": [
      {
        "title": "Write the experiment contract before starting the timer",
        "body": "A comparable benchmark fixes at least the model and hash, quantization format, runtime commit, threads and CPU affinity, prompt-token count, output limit, sampling, concurrency, power supply, and cooling. Warm up first, run enough repetitions, and retain raw samples. If two tests use different input lengths or temperatures, their p95 and tokens/s are not directly comparable. Save these fields as a machine-readable manifest so firmware or model upgrades can rerun the test automatically."
      },
      {
        "title": "Diagnose TTFT and generation speed separately",
        "body": "TTFT includes queuing, templating, tokenization, context setup, prefill, and the first sampling round. Steady-state decode mainly reflects incremental reads of weights and KV, small matrix operations, and sampling. A long prompt raises the former; a long context and bandwidth pressure slow the latter. Place monotonic-clock timestamps on the same request and report prompt tokens/s, the inter-token-latency distribution, and output tokens/s rather than one total duration."
      },
      {
        "title": "Let a bottleneck hypothesis drive the next observation",
        "body": "Low CPU utilization does not prove that compute is abundant: threads may be waiting on memory, a lock, GPU synchronization, or network backpressure. Use a trace to find the longest stage and then state a falsifiable hypothesis. If bandwidth is suspected, change quantization or context and observe speed and bytes moved; for compute, vary core count or frequency; for copies, record partition boundaries. Change one variable at a time so the evidence can distinguish correlation from causation."
      },
      {
        "title": "Percentiles, thermal state, and energy jointly determine stability",
        "body": "A short benchmark often runs on a cool chip with full power headroom, while a product may operate continuously for hours. Record every request instead of preserving only an average; report at least median and p95, alongside frequency, temperature, power, and peak memory. For streaming experience, track the longest token gap too. If tokens/s improves while joules/token, heat, or tail latency worsens, return to the product scenario rather than automatically declaring success."
      },
      {
        "title": "Turn a performance regression into bisectable version evidence",
        "body": "Tie benchmark results to model, data, compiler options, runtime, and firmware versions, and preserve a summary of the stage trace. Use thresholds tolerant of noise—for example, alert only after several consecutive runs regress relative to baseline—to avoid treating random jitter as a regression. When a problem appears, verify the environment first and then bisect versions. Keep fixed correctness samples to prevent “speeding up” by disabling work. The final report should identify the stage that regressed and the accompanying resource change."
      }
    ],
    "pitfall": "Reporting only average tokens/s hides long prompts, thermal throttling, first-load cost, and p95 tail latency. Product experience is often determined by these non-average paths.",
    "references": [
      [
        "NVIDIA GenAI-Perf Metrics",
        "https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2700/user-guide/docs/perf_benchmark/genai-perf-README.html"
      ],
      [
        "llama.cpp llama-bench",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/llama-bench/README.md"
      ],
      [
        "ESP-DL Model Loading, Testing, and Profiling",
        "https://docs.espressif.com/projects/esp-dl/en/latest/tutorials/how_to_load_test_profile_model.html"
      ]
    ],
    "quiz": [
      {
        "prompt": "Which definition best describes Time to First Token?",
        "options": [
          "The interval between two output tokens",
          "The time from sending a request until receiving the first response token",
          "The complete model download time",
          "The number of camera frames per second"
        ],
        "answer": 1,
        "explanation": "TTFT is first-response latency and includes the request and prompt-processing path. It is not the same as the token-generation rate during decode."
      },
      {
        "prompt": "Why should a benchmark warm up and run repeatedly?",
        "options": [
          "To let the model add parameters automatically",
          "To reduce first-load/cache and transient-frequency bias and to measure tail latency",
          "To avoid a fixed prompt",
          "To skip correctness checks"
        ],
        "answer": 1,
        "explanation": "The first run and thermal state often differ from steady state. Repetition supports median and p95 reporting instead of letting one accidental value determine the conclusion."
      },
      {
        "prompt": "If tokens/s rises but joules/token worsens, is the optimization necessarily successful?",
        "options": [
          "Yes; speed is the only metric",
          "No; judge it against product targets for latency, energy, temperature, and quality",
          "Yes; energy cannot be measured",
          "No; the tokenizer has failed"
        ],
        "answer": 1,
        "explanation": "Edge systems are constrained by multiple objectives. Higher throughput is not a product-level success if battery life, temperature, or quality misses its requirement."
      }
    ],
    "readingMinutes": 17,
    "keywords": [
      {
        "term": "TTFT",
        "definition": "The time from request submission to the first returned token.",
        "espAnalogy": "Like the delay from the first interrupt to the first valid status message."
      },
      {
        "term": "p95",
        "definition": "The tail-latency percentile that 95% of requests do not exceed.",
        "espAnalogy": "Like the latency budget for the slowest small fraction of field events."
      },
      {
        "term": "Warm-up",
        "definition": "Priming the runtime, caches, and clock frequency before formal measurement.",
        "espAnalogy": "Like measuring performance only after the device has stabilized following power-on."
      },
      {
        "term": "Joules/token",
        "definition": "The energy consumed to generate one token.",
        "espAnalogy": "Like the energy budget for one control action."
      }
    ],
    "recap": "The previous chapter selected a framework and backend. This chapter builds an evidence chain for that choice, turning “it feels slow” into measurable request stages, resource counters, and power rather than one tokens/s number.",
    "nextPreview": "The next chapter first combines the model, runtime, device I/O, permissions, OTA, and acceptance criteria into a deployable edge system—a phase integration before large-scale and on-device LLM infrastructure.",
    "history": {
      "intro": "Performance analysis predates machine learning. It progressed from the insight that serial work limits local acceleration, to recognizing that compute and bandwidth jointly cap performance, and then to tail latency and standardized benchmarks for online systems. LLMs add phase-specific measures such as prefill, decode, streaming response, and energy per token. History repeatedly shows that a lone number without a workload, measurement conditions, and decomposition offers almost no engineering guidance.",
      "milestones": [
        {
          "year": "1967",
          "title": "Amdahl's law shows that total speedup is limited by the unaccelerated fraction",
          "body": "Amdahl's work explains that no matter how fast the parallel part becomes, the unaccelerated part still limits total gain. On edge AI, a kernel becoming twice as fast does not make a request twice as fast; tokenization, copies, sampling, networking, and synchronization may become the new serial terms.",
          "source": {
            "label": "Original Amdahl paper",
            "url": "https://doi.org/10.1145/1465482.1465560"
          }
        },
        {
          "year": "2009",
          "title": "Roofline connects arithmetic intensity to compute and bandwidth ceilings",
          "body": "The Roofline model places attainable performance below ceilings imposed by peak compute and memory bandwidth. It lets engineers first ask whether a workload is compute- or bandwidth-bound, then choose among optimizing MACs, cache reuse, or data layout. Decode's repeated reads of weights and KV fit this intuition particularly well.",
          "source": {
            "label": "Original Roofline paper",
            "url": "https://escholarship.org/uc/item/6vv2j84j"
          }
        },
        {
          "year": "2013",
          "title": "Tail latency becomes a primary metric for interactive services",
          "body": "The Tail at Scale shows how averages conceal a small but significant set of slow requests and why large interactive systems must examine the tail of the latency distribution. Even an on-device LLM with little concurrency is affected by cold starts, thermal throttling, queues, and network jitter, so p50 cannot replace p95.",
          "source": {
            "label": "Original The Tail at Scale paper",
            "url": "https://research.google/pubs/the-tail-at-scale/"
          }
        },
        {
          "year": "2019",
          "title": "MLPerf Inference advances comparable inference benchmarks",
          "body": "MLPerf Inference combines models, scenarios, accuracy constraints, and submission rules into a benchmark suite, emphasizing that performance numbers must be tied to a workload and quality threshold. Its engineering lesson is that throughput no longer belongs to the same fair comparison once model precision, input, or the accuracy target changes.",
          "source": {
            "label": "Official MLPerf Inference documentation",
            "url": "https://docs.mlcommons.org/inference/index_gh/"
          }
        },
        {
          "year": "2023–Present",
          "title": "Generative models develop a dedicated metric family around TTFT, ITL, and throughput",
          "body": "Generation services separate prompt processing from token-by-token output and report first-token latency, output-token intervals, request throughput, and input/output length. Tools record these metrics together with concurrency, percentiles, and endpoint protocols, turning performance analysis from timing one command into a replayable request experiment.",
          "source": {
            "label": "Official NVIDIA GenAI-Perf metrics documentation",
            "url": "https://github.com/triton-inference-server/perf_analyzer/blob/main/genai-perf/README.md"
          }
        }
      ],
      "bridge": "This chapter combines four generations of ideas into one evidence chain: define product-experience metrics, split end-to-end time into stages, use Roofline and counters to explain the bottleneck, and finally use distributions, power, and thermal state to verify that the optimization did not merely move the problem. Every reported number should include input and output lengths, concurrency, quantization, threads, power conditions, and software versions."
    },
    "visual": {
      "title": "Converging from one slow request to a verifiable bottleneck",
      "description": "The animation does not merely play attractive charts. It demonstrates the reasoning order of performance engineering: lock conditions, segment the path, state a hypothesis, run a single-variable experiment, and validate again.",
      "steps": [
        {
          "icon": "📌",
          "label": "Freeze conditions",
          "data": "model/config/prompt/device/power manifest",
          "action": "Verify versions and input, then complete warm-up",
          "insight": "Without an experiment contract, later differences cannot be attributed"
        },
        {
          "icon": "⏱️",
          "label": "Sample end to end",
          "data": "request timestamps × repeated runs",
          "action": "Collect raw latency, TTFT, ITL, and throughput samples",
          "insight": "Keeping the distribution exposes the tail instead of only the average"
        },
        {
          "icon": "🧱",
          "label": "Split into stages",
          "data": "queue | preprocess | prefill | decode | network",
          "action": "Mark stage boundaries with the same monotonic clock",
          "insight": "Find where time is spent before asking why"
        },
        {
          "icon": "🕵️",
          "label": "Form a hypothesis",
          "data": "utilization + bandwidth + cache + thermal counters",
          "action": "Associate the longest stage with one falsifiable bottleneck",
          "insight": "Low utilization can mean waiting; it does not mean there is no bottleneck"
        },
        {
          "icon": "🎛️",
          "label": "Change one variable",
          "data": "one change → effect size",
          "action": "Change only one of threads, quantization, context, or copies",
          "insight": "A hypothesis gains support only when the predicted direction repeats"
        },
        {
          "icon": "✅",
          "label": "Accept the regression test",
          "data": "quality + p50/p95 + energy + memory",
          "action": "Retest during long-running operation and on boundary inputs",
          "insight": "It is a product optimization only when end-to-end, quality, and efficiency all pass"
        }
      ],
      "loop": "If a single-variable result does not support the hypothesis, return to “Form a hypothesis” and select another counter. If an optimization merely moves the bottleneck, return to “Split into stages” and reorder the hotspots. Finally write the new baseline into the manifest and retain raw samples for version bisection."
    },
    "analogyDetail": {
      "title": "Investigating a high-speed train that is always late",
      "story": "Passengers feel only total journey time—end-to-end latency. Security screening resembles pre-processing, waiting for the first departure resembles TTFT, and the intervals between stations resemble inter-token latency. The average arrival may look normal while a handful of severe storm delays form p95. Raising the train's maximum speed accomplishes little if ticket checks, track changes, or station entry dominate. Running every carriage's air conditioning at full power can also increase energy per passenger and trigger thermal limits. Real optimization reconciles the timetable, route trace, and power meter.",
      "illustration": [
        {
          "icon": "🎫",
          "label": "Station wait",
          "mapsTo": "Queuing, tokenization, pre-processing, and context allocation"
        },
        {
          "icon": "🚄",
          "label": "First departure",
          "mapsTo": "Prefill completing and returning the first token: TTFT"
        },
        {
          "icon": "🚉",
          "label": "Station-to-station rhythm",
          "mapsTo": "Decode inter-token latency and tokens/s"
        },
        {
          "icon": "🌡️",
          "label": "Storm speed limit",
          "mapsTo": "Long tails caused by latency, power, temperature, and thermal throttling"
        }
      ],
      "boundary": "Train segments are usually approximately serial, while inference can pipeline, copy asynchronously, or batch multiple requests. The sum of single-request stages also does not directly predict high-concurrency throughput. The analogy highlights segmentation and tails but cannot replace trace timestamps, hardware counters, and queueing models."
    }
  },
  {
    "n": 15,
    "t": "Integration: The Edge-AI Engineering Pipeline",
    "s": "Turn 14 days of knowledge into a deliverable project",
    "goal": "Design a complete system spanning data and models, device and host, performance, and product constraints.",
    "concept": [
      "Requirements → model → format → quantization → runtime → hardware",
      "Division of work between ESP32 and Linux Edge Host",
      "Tool calling over USB or a network",
      "Fault degradation, OTA, and monitoring",
      "Acceptance metrics and reproducible reports"
    ],
    "analogy": "An edge-AI product resembles a distributed embedded system: the ESP32 owns real-time I/O and the safety boundary, a Linux host performs heavy inference, and a network protocol connects the two.",
    "diagram": "Sensor/USB/ESP32 → framed message → Linux Edge Host\n       ↑ status/actuator ← tool policy ← LLM runtime\n                     model → backend → accelerator",
    "code": "POST /v1/chat/completions\n{\"messages\":[{\"role\":\"user\",\"content\":\"Read the temperature\"}],\"stream\":true}\n\n# Acceptance: function, latency, energy, offline behavior, faults, upgrades, logs",
    "lab": "Build a minimal closed loop: an ESP32 samples temperature and sends it over USB or HTTP, the host model proposes a controlled command, and the ESP32 executes it only after checking its allowlist.",
    "questions": [
      "Which commands must be authorized again on the ESP32?",
      "How should the system fall back to deterministic logic when the model is unavailable?",
      "How can a performance regression be made reproducible?"
    ],
    "next": "Large-Scale LLM Infrastructure: From Chips to Clusters",
    "lesson": [
      {
        "title": "Work backward from acceptance criteria to system boundaries",
        "body": "First specify required events, end-to-end latency, offline duration, false-positive and false-negative budgets, safe states, power, and cost. Then decide whether the model belongs on the MCU, an Edge Host, or the cloud. If an emergency stop must still occur in milliseconds without a network, neither the decision nor actuation can depend on a host LLM. If the task needs a large context, interpretation can live on the host while the device retains threshold rules. Map every requirement to a responsible component and a measurable signal so the architecture diagram contains commitments, not just arrows."
      },
      {
        "title": "Define host messages as proposals, not commands",
        "body": "Use a versioned structured schema containing device_id, request_id, sequence, deadline, action, typed parameters, and authentication data. On receipt, the ESP32 verifies source, version, deduplication, freshness, the action allowlist, parameter ranges, and current state before converting the message into an internal event. Natural language must never drive GPIO directly. Test duplicate frames, reordering, replay, partial packets, and unknown fields, and make rejection reasons auditable."
      },
      {
        "title": "Normal and degraded paths must share one state machine",
        "body": "Define explicit states and transitions for online operation, a slow host, link failure, model failure, sensor anomalies, and actuator faults; do not improvise actions inside exception callbacks. After a timeout, cancel the host request, discard late replies, and switch the device to a local threshold or safe-hold mode. Reconnection requires a fresh handshake and sequence synchronization. Inject network loss, restarts, packet loss, host saturation, and watchdog resets to verify that every path returns to a known state."
      },
      {
        "title": "Release model, firmware, protocol, and configuration as one set",
        "body": "A model update can change the tokenizer, template, output schema, and resource requirements, so it cannot be replaced independently of the firmware compatibility matrix. The release manifest should record all four versions, hashes, minimum hardware, memory budget, migration steps, and rollback target. Verify the signature after download, run a self-test on the first boot of a new slot, and mark it valid only after an observation period. During staged rollout, monitor rejection rate, TTFT, crashes, and device-safety events, and restore the previous known combination on anomalies."
      },
      {
        "title": "Close the deliverable evidence loop with end-to-end tracing",
        "body": "Give the ESP32 event, protocol frame, host request, model version, tool proposal, and final execution one shared correlation_id, and record stage times using each component's monotonic clock. The acceptance report includes functional samples, performance distributions, energy, offline and unauthorized-action tests, OTA rollback, and long-run stability. Logs must redact sensitive source text and define a retention policy. A single abnormal action should be traceable back to source sensor evidence, every policy decision, and the deployed release versions."
      }
    ],
    "pitfall": "Demonstrating only a happy path with normal Wi-Fi and a normal prompt hides the most important field risks: network jitter, model hallucination, duplicate commands, and interrupted upgrades.",
    "references": [
      [
        "Getting Started with ESP-DL",
        "https://docs.espressif.com/projects/esp-dl/en/latest/getting_started/readme.html"
      ],
      [
        "llama.cpp Server",
        "https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md"
      ],
      [
        "NVIDIA GenAI-Perf Metrics",
        "https://docs.nvidia.com/deeplearning/triton-inference-server/archives/triton-inference-server-2700/user-guide/docs/perf_benchmark/genai-perf-README.html"
      ]
    ],
    "quiz": [
      {
        "prompt": "In an ESP32 + Edge Host architecture, what should remain inside the ESP32's deterministic boundary?",
        "options": [
          "Every LLM weight",
          "The actuator allowlist, range checks, and fallback on lost connectivity",
          "The cloud training loop",
          "The GGUF conversion script"
        ],
        "answer": 1,
        "explanation": "Safety constraints governing interaction with the physical world must be enforced locally and deterministically. A host model's recommendation is only a constrained input."
      },
      {
        "prompt": "What is a reasonable fallback when the model service is unavailable?",
        "options": [
          "Retry forever while blocking the control task",
          "Return to a predefined threshold or state machine and report the fault",
          "Open all actuator permissions",
          "Erase the model partition"
        ],
        "answer": 1,
        "explanation": "Fallback must remain predictable and safe. Retries can be bounded, but the control system needs a validated local policy when the host fails."
      },
      {
        "prompt": "What must at least be fixed for a reproducible performance regression?",
        "options": [
          "Only the product name",
          "The model, input/tokens, runtime parameters, hardware, and measurement conditions",
          "Only the screen resolution",
          "Only the Git branch name"
        ],
        "answer": 1,
        "explanation": "Every variable that changes the execution path should be recorded, allowing model changes, runtime changes, hardware thermal state, and network effects to be distinguished."
      }
    ],
    "readingMinutes": 20,
    "keywords": [
      {
        "term": "Safety boundary",
        "definition": "Permission and range constraints that a deterministic component must enforce.",
        "espAnalogy": "Like hardware interlocks and a state machine before a GPIO or motor driver."
      },
      {
        "term": "Graceful degradation",
        "definition": "Switching to safe, limited functionality when a dependency is unavailable.",
        "espAnalogy": "Like retaining local control logic after Wi-Fi disconnects."
      },
      {
        "term": "OTA",
        "definition": "A delivery mechanism for remotely updating firmware or models.",
        "espAnalogy": "Like versioned firmware slots with a rollback process."
      },
      {
        "term": "Acceptance report",
        "definition": "Evidence recording the conditions of functional, performance, energy, and fault tests.",
        "espAnalogy": "Like whole-product testing and traceable records before mass production."
      }
    ],
    "recap": "The previous chapter produced reproducible performance evidence. This chapter combines 14 days of knowledge about models, formats, resources, runtimes, and hardware into a system design and validates its behavior under real-world fault paths.",
    "nextPreview": "The next chapter expands this single-system delivery ledger into large-scale LLM training and serving, tracing cost through chips, memory, interconnects, parallel strategies, the KV data plane, and SLOs.",
    "history": {
      "intro": "Edge-AI integration may look new, but its core comes from decades of distributed- and embedded-systems practice: correctness belongs at the endpoints that understand semantics, heavy computation can be offloaded to nearby resources, microcontrollers need specialized memory and runtime design, and AI risk spans the entire lifecycle. Only by combining these threads can we build a reliable architecture in which the ESP32 guards the physical boundary and an Edge Host supplies inference.",
      "milestones": [
        {
          "year": "1984",
          "title": "The end-to-end principle puts critical correctness at the endpoints",
          "body": "Saltzer, Reed, and Clark argue that some functions, even when implemented inside the communication subsystem, still require checks by the endpoints that truly understand application semantics. In an AI control path, the transport can prove that a frame arrived intact but cannot decide whether “open valve to 90%” is safe in the device's current state.",
          "source": {
            "label": "Original End-to-End Arguments paper",
            "url": "https://groups.csail.mit.edu/ana/Publications/PubPDFs/End-to-End%20Arguments%20in%20System%20Design.pdf"
          }
        },
        {
          "year": "2009",
          "title": "Cloudlets describe an offload pattern using nearby resource-rich hosts",
          "body": "The Cloudlet work proposes that resource-constrained mobile devices use a nearby, capable compute node over a low-latency local link, avoiding WAN jitter and failures. Today's ESP32 plus Linux Edge Host division follows the same idea: real-time I/O remains at the endpoint while heavy inference runs one hop away.",
          "source": {
            "label": "Original Cloudlet paper",
            "url": "https://elijah.cs.cmu.edu/DOCS/satya-ieeepvc-cloudlets-2009.pdf"
          }
        },
        {
          "year": "2020",
          "title": "TinyML runtimes make the microcontroller a model-execution endpoint",
          "body": "TensorFlow Lite Micro targets tiny memory, limited dependencies, and diverse MCUs, demonstrating how model interpreters, static memory planning, and platform kernels fit into firmware. As the model moves from cloud API to device module, sensor pre-processing, the arena, task scheduling, and deterministic fallback enter the same acceptance scope.",
          "source": {
            "label": "Original TensorFlow Lite Micro paper",
            "url": "https://arxiv.org/abs/2010.08678"
          }
        },
        {
          "year": "2023",
          "title": "NIST AI RMF brings AI risk into lifecycle management",
          "body": "AI RMF 1.0 organizes risk management around Govern, Map, Measure, and Manage, emphasizing system context, measurement, and continuous governance. For an edge product, accuracy is only one piece of evidence; permissions, privacy, resilience, monitoring, supply chain, and retirement also need named owners during design and acceptance.",
          "source": {
            "label": "Official NIST AI RMF 1.0 publication",
            "url": "https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-ai-rmf-10"
          }
        },
        {
          "year": "Present",
          "title": "Secure boot, signed OTA, and rollback close the field-deployment loop",
          "body": "ESP-IDF OTA states and rollback let a new image perform self-tests on first boot before it is marked valid and can be combined with Secure Boot and anti-rollback. When models, firmware, and configuration all change, the release chain needs signatures, a compatibility matrix, health checks, and a recoverable version—not just one newly transferred file.",
          "source": {
            "label": "Official ESP-IDF OTA documentation",
            "url": "https://docs.espressif.com/projects/esp-idf/en/stable/esp32/api-reference/system/ota.html"
          }
        }
      ],
      "bridge": "Together, these milestones define the final architecture: a generative model offers only probabilistic suggestions while the endpoint state machine retains final authority; heavy computation can happen on a nearby host, but timeouts and disconnections require degradation; every model, protocol, and firmware version must be measurable, traceable, and reversible. The deliverable is not merely a demo but a closed loop of requirements, interfaces, evidence, and fault recovery."
    },
    "visual": {
      "title": "The end-to-end loop from sensor event to safe action",
      "description": "The animation shows upstream data, host inference, a downstream proposal, and device-side authorization together. The last step feeds the result back as observable state for the next round.",
      "steps": [
        {
          "icon": "🌡️",
          "label": "Sample and frame",
          "data": "sensor + timestamp + device state + sequence",
          "action": "The ESP32 calibrates, range-checks, and encodes a versioned message",
          "insight": "Raw reality first passes through a deterministic contract; it must not be pasted directly into a prompt"
        },
        {
          "icon": "📤",
          "label": "Reliable uplink",
          "data": "authenticated frame + correlation_id",
          "action": "Validate, deduplicate, retry within a deadline, and deliver to the Edge Host",
          "insight": "Transport reliability does not guarantee correct product semantics"
        },
        {
          "icon": "🧠",
          "label": "Host inference",
          "data": "structured context → model/tool proposal",
          "action": "Run pre-processing, runtime inference, and schema constraints",
          "insight": "Model output is an uncertain candidate and has no authority to execute"
        },
        {
          "icon": "📥",
          "label": "Proposal downlink",
          "data": "action + typed params + deadline + request_id",
          "action": "Return an authenticated or signed proposal tied to the source request",
          "insight": "Late, duplicate, or uncorrelated replies must be rejected"
        },
        {
          "icon": "🛡️",
          "label": "Local authorization",
          "data": "proposal + live state + safety policy",
          "action": "The ESP32 checks allowlists, ranges, interlocks, and idempotency",
          "insight": "The endpoint that understands physical state makes the final safety decision"
        },
        {
          "icon": "⚙️",
          "label": "Execute and attest",
          "data": "actuator result + status + trace",
          "action": "Perform the deterministic action, record its result, and report health",
          "insight": "Closed-loop evidence supports monitoring, regression tests, and the next decision"
        }
      ],
      "loop": "The execution result and new sensor state return to “Sample and frame,” forming an observable loop. If any stage times out or fails validation, flow stops instead of continuing rightward; the device enters a local safe-degradation state and records the rejection reason under the same correlation_id."
    },
    "analogyDetail": {
      "title": "The complete edge-AI system as cooperation between air traffic control and an aircraft",
      "story": "The LLM on the Edge Host is like an air-traffic-control adviser: it sees broadly, computes heavily, and can turn natural-language intent into a structured route proposal. The ESP32 is the aircraft's flight-control system, reading sensors directly and owning actuators. A tower request to descend to an altitude must carry a flight number, sequence, and parameters, while flight control still checks the safe envelope, fuel, and current mode. If communication fails, the aircraft retains basic control and enters a validated local procedure. Updating the model or firmware is like replacing navigation charts: signature, version compatibility, and rollback are all mandatory.",
      "illustration": [
        {
          "icon": "🗼",
          "label": "Tower adviser",
          "mapsTo": "The LLM, retrieval, and heavy-compute services on the Edge Host"
        },
        {
          "icon": "✈️",
          "label": "Flight control",
          "mapsTo": "ESP32 sensors, state machine, allowlists, and actuator interlocks"
        },
        {
          "icon": "📻",
          "label": "Standard radio exchange",
          "mapsTo": "A message protocol with version, sequence, validation, timeout, and idempotency"
        },
        {
          "icon": "🗺️",
          "label": "Signed navigation chart",
          "mapsTo": "Versioned, rollback-capable OTA for models, configuration, and firmware"
        }
      ],
      "boundary": "Real aviation systems use rigorous certification and deterministic procedures; an LLM cannot meet a flight-control safety level. The analogy never implies that a model may participate in a hard real-time loop. It only identifies responsibility separation and the location of final authorization. Any action that could injure people, damage equipment, or violate regulations must remain under validated deterministic logic and, where necessary, human approval."
    }
  }
];
