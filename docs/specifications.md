# Sonar — TTS Model Specifications

**Project:** Sonar — Offline Text-to-Speech Application
**Version:** 1.0
**Status:** Draft
**Purpose:** Define the standard specification for all local TTS engines, models, and voices supported by the application.

---

## 1. Overview

The application uses a modular, model-driven architecture for local text-to-speech synthesis.

TTS engines and voices must be treated as independent resources wherever the underlying engine allows it. The application must not hard-code engine-specific assumptions into the user interface or core application logic.

Initial supported engines:

* **Kokoro**
* **Piper**
* **Windows voice**

Additional engines may be introduced later without requiring a redesign of the core TTS architecture.

The primary requirements are:

* Fully offline inference
* Natural-sounding speech
* CPU compatibility
* Optional hardware acceleration
* Modular model/voice installation
* Consistent application-level TTS API
* Easy addition of future engines and voices

---

# 2. Architecture

The application is divided into four conceptual layers:

```text
Application UI
      │
      ▼
TTS Service API
      │
      ▼
Engine Adapter
      │
 ┌────┴─────┐
 ▼          ▼
Kokoro    Piper
 │          │
 ▼          ▼
Model      Model
 │          │
 ▼          ▼
Voice      Voice
 └────┬─────┘
      ▼
   Audio Output
```

The UI must communicate with the **TTS Service API**, not directly with Kokoro, Piper, ONNX Runtime, or any other engine.

This ensures that engine changes do not require UI changes.

---

# 3. Model Directory Structure

The recommended model directory structure is:

```text
models/
│
├── kokoro/
│   ├── model.onnx
│   ├── model.json
│   ├── voices/
│   │   ├── voice_a.bin
│   │   ├── voice_b.bin
│   │   └── voice_c.bin
│   └── ...
│
└── piper/
    ├── voices/
    │   ├── voice_a/
    │   │   ├── model.onnx
    │   │   ├── config.json
    │   │   └── metadata.json
    │   │
    │   └── voice_b/
    │       ├── model.onnx
    │       ├── config.json
    │       └── metadata.json
    │
    └── model.json
```

The exact files may vary between engines.

The application must rely on model metadata rather than assuming a universal file layout.

---

# 4. Model Metadata

Every supported engine must provide a top-level `model.json`.

Example:

```json
{
  "id": "kokoro",
  "name": "Kokoro",
  "version": "1.0",
  "engine": "kokoro",
  "runtime": "onnx",
  "architecture": "82m",
  "format": "onnx",
  "offline": true,
  "hardware": {
    "cpu": true,
    "gpu": true
  },
  "languages": [
    "en"
  ],
  "voices": [
    "voice_a",
    "voice_b"
  ]
}
```

---

# 5. Required Metadata Fields

Each engine metadata file must provide:

| Field          | Required | Description                              |
| -------------- | -------- | ---------------------------------------- |
| `id`           | Yes      | Unique engine/model identifier           |
| `name`         | Yes      | Human-readable name                      |
| `version`      | Yes      | Model package version                    |
| `engine`       | Yes      | Engine implementation identifier         |
| `runtime`      | Yes      | Runtime used for inference               |
| `format`       | Yes      | Model format                             |
| `offline`      | Yes      | Whether inference works without internet |
| `hardware.cpu` | Yes      | CPU inference support                    |
| `hardware.gpu` | Yes      | GPU acceleration support                 |
| `languages`    | Yes      | Supported languages                      |
| `voices`       | Yes      | Available voice identifiers              |

Optional metadata may include:

* Model size
* Parameter count
* License
* Publisher
* Recommended RAM
* Recommended CPU
* GPU requirements
* Quantization
* Sample rate
* Supported speaking styles
* Supported controls
* Minimum runtime version

---

# 6. Voice Specification

A voice is an independently selectable speech profile.

Voice metadata should contain:

```json
{
  "id": "voice_a",
  "name": "Voice A",
  "language": "en-US",
  "gender": "female",
  "style": "natural",
  "sampleRate": 24000,
  "supports": {
    "speed": true,
    "pitch": false,
    "volume": true
  }
}
```

The UI must display human-readable voice names rather than internal model identifiers.

For example:

```text
Internal ID: af_heart
Display name: Heart
```

---

# 7. Engine Abstraction

Every engine must implement the application's common TTS interface.

Conceptually:

```js
tts.synthesize({
    text,
    voice,
    speed,
    pitch,
    volume
});
```

The application must not expose engine-specific APIs to the renderer.

For example, the renderer should never need to know how Kokoro's inference process differs from Piper's.

---

# 8. Required TTS Operations

Every engine adapter should support:

### Required

* `initialize()`
* `getVoices()`
* `synthesize()`
* `stop()`
* `dispose()`

### Recommended

* `pause()`
* `resume()`
* `estimateDuration()`
* `getCapabilities()`

Playback itself should preferably remain separate from inference.

The TTS engine generates audio; the audio service handles playback.

---

# 9. Text Processing

Text must be processed before being sent to the model.

The text pipeline should support:

```text
Raw Text
   ↓
Normalize
   ↓
Remove unnecessary whitespace
   ↓
Fix line breaks
   ↓
Preserve paragraph boundaries
   ↓
Sentence segmentation
   ↓
Chunking
   ↓
TTS Engine
```

The application should avoid sending extremely large documents to the model as a single inference request.

---

# 10. Chunking

Large text must be divided into manageable chunks.

Example:

```text
Document
   │
   ├── Paragraph 1
   ├── Paragraph 2
   ├── Paragraph 3
   └── Paragraph 4
```

Each paragraph may then be subdivided into sentence groups.

Chunking must attempt to preserve natural speech boundaries.

The system should avoid splitting:

* Names
* Abbreviations
* Decimal numbers
* URLs
* Common punctuation patterns

---

# 11. Streaming / Progressive Generation

The application should support progressive synthesis.

Instead of:

```text
10-page PDF
     ↓
Generate entire document
     ↓
Wait
     ↓
Play
```

The preferred architecture is:

```text
Chunk 1 → Generate → Play
Chunk 2 → Generate → Queue
Chunk 3 → Generate → Queue
Chunk 4 → Generate → Queue
```

This allows playback to begin before the entire document has finished generating.

---

# 12. Hardware Acceleration

CPU inference is mandatory for all primary V1 engines.

GPU acceleration is optional.

The application should detect available hardware and select an appropriate execution provider.

Conceptually:

```text
Hardware Detection
       │
       ├── Supported GPU → GPU
       │
       └── Otherwise → CPU
```

GPU acceleration must never be required for the application to function.

---

# 13. CPU Mode

CPU mode is a first-class execution mode.

The application should optimize for:

* Low memory usage
* Reasonable synthesis speed
* Low startup time
* Stable long-document generation
* Multithreaded inference where supported

The application must remain usable on integrated-graphics systems.

---

# 14. Model Variants

A single engine may provide multiple model variants.

Example:

```text
Kokoro
├── Quality
│   └── FP32
│
├── Balanced
│   └── Quantized / mixed precision
│
└── Lightweight
    └── INT8
```

The application may eventually expose this as:

```text
Quality:
○ Maximum
● Balanced
○ Lightweight
```

The exact model selected should remain an implementation detail unless advanced model management is enabled.

---

# 15. Model Validation

Before a model is loaded, the application should validate:

1. Required model files exist
2. Metadata exists
3. Metadata is valid
4. Engine is supported
5. Runtime is available
6. Model files are readable
7. Required voices exist
8. Model version is compatible

Invalid models must fail gracefully.

Example:

```text
Unable to load voice.

The required model files are missing or corrupted.
```

The application must not crash because of an invalid model package.

---

# 16. Offline Requirement

All V1 TTS functionality must work without an internet connection.

The application must not require:

* Cloud APIs
* Remote inference
* Authentication servers
* Online voice generation
* Runtime model downloads

Internet access may be introduced as an optional future feature, but it must not be required by the core TTS system.

---

# 17. PDF Integration

PDF support is an input layer, not a separate TTS system.

```text
PDF
 ↓
Text Extraction
 ↓
Text Processing
 ↓
TTS Service
 ↓
Selected Engine
```

V1 supports **text-based PDFs only**.

OCR is explicitly out of scope for V1.

Scanned/image-only PDFs should produce a clear message indicating that the document does not contain extractable text.

OCR may be introduced in a future release.

---

# 18. Audio Output

The TTS layer should produce a standardized audio representation that the application can pass to the playback/export system.

Preferred output:

* WAV
* PCM

Additional formats such as MP3 may be generated by a separate audio encoding layer.

The TTS engine should not be responsible for application-level audio playback.

---

# 19. Initial Engine Specifications

## 19.1 Kokoro

**Role:** Primary natural-quality engine

Target characteristics:

* Neural TTS
* Approximately 82M parameters
* ONNX-compatible implementation
* CPU inference
* Optional GPU acceleration
* Multiple voices
* Strong naturalness-to-resource ratio
* Fully offline

Preferred V1 variants:

```text
Kokoro Quality
Kokoro Balanced
Kokoro Lightweight
```

The exact model variant should be selected after benchmarking.

---

## 19.2 Piper

**Role:** Lightweight/high-performance engine

Target characteristics:

* Local neural TTS
* CPU-friendly
* Low resource requirements
* Large voice selection
* Multiple languages
* Offline operation
* Fast synthesis

Piper should be available as a second engine rather than merely a fallback.

This allows users to prioritize:

```text
Naturalness → Kokoro

Performance / Low Resources → Piper
```

---

# 20. Engine Selection

The application should support explicit engine selection.

Example:

```text
Engine
──────────────
Kokoro
Piper
──────────────

Voice
──────────────
Heart
...
```

A future automatic mode may select the best engine based on:

* Hardware
* Document size
* Voice availability
* User preference
* Performance requirements

---

# 21. Model Independence

The core application must not assume:

* A specific TTS engine
* A specific model format
* A specific voice architecture
* A specific sample rate
* A specific inference runtime

Engine-specific behavior belongs inside the corresponding adapter.

```text
core/
└── tts/

engines/
├── kokoro/
│   └── KokoroAdapter
│
└── piper/
    └── PiperAdapter
```

---

# 22. Future Compatibility

The architecture should allow future engines to be added without changing:

* PDF extraction
* Text processing
* UI architecture
* Audio playback
* Audio export
* History
* Settings

Adding a new engine should primarily require:

1. Engine adapter
2. Model package
3. Metadata
4. Voice metadata
5. Capability mapping

Example future structure:

```text
engines/
├── kokoro/
├── piper/
├── engine3/
└── engine4/
```

---

# 23. V1 Non-Goals

The following are explicitly outside the V1 model specification:

* OCR
* Cloud TTS
* Online model downloading
* Voice cloning
* Custom voice training
* User voice cloning
* Real-time voice conversion
* Emotion generation
* Conversational AI
* Automatic translation

These may be considered in future versions.

---

# 24. Design Principle

The fundamental rule of the TTS architecture is:

> **The application owns the experience. The model owns the synthesis.**

The UI, PDF system, text processor, playback system, and export system must remain independent from individual TTS engines.

This ensures that Kokoro, Piper, and future engines can coexist within the same application without creating architectural dependencies.

---

# 25. V1 Target

The first production implementation should deliver:

```text
             ┌─────────────────┐
             │      INPUT      │
             │                 │
             │ Text / PDF      │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ TEXT PROCESSOR  │
             └────────┬────────┘
                      │
                      ▼
             ┌─────────────────┐
             │   TTS SERVICE   │
             └────────┬────────┘
                      │
              ┌───────┴───────┐
              ▼               ▼
           Kokoro           Piper
              │               │
              └───────┬───────┘
                      ▼
             ┌─────────────────┐
             │ AUDIO PIPELINE  │
             └───────┬─────────┘
                     │
              ┌──────┴──────┐
              ▼             ▼
           Playback       Export
```

The system must be **offline-first, modular, hardware-aware, model-independent, and optimized for natural speech**.
