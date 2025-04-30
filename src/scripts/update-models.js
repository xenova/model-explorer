import { listModels, listFiles } from "@huggingface/hub";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// 1. Get the task for each ONNX model
const idToTask = {};
const onnxModels = listModels({
  search: {
    tags: ["onnx"],
  },
  sort: "downloads",
  direction: "desc",
});
for await (const model of onnxModels) {
  idToTask[model.name] = model.task;
}

// 2. Get all files in the dataset repo
const repoId = "datasets/onnx-community/model-explorer";
const files = listFiles({ repo: repoId, recursive: true });
const modelMapping = {};
for await (const file of files) {
  if (file.type === "file" && file.path.endsWith(".onnx")) {
    const parts = file.path.split("/");
    if (parts.length >= 3) {
      const modelId = parts.slice(0, 2).join("/");
      if (!modelMapping[modelId]) {
        modelMapping[modelId] = {
          files: [],
          tags: [],
        };
        if (idToTask[modelId]) {
          modelMapping[modelId].tags.push(idToTask[modelId]);
        }
      }
      modelMapping[modelId].files.push(parts[2]);
    }
  }
}

// 3. Sort models by a priority score, defined below
const PRIORITY_MODELS = [
  "HuggingFaceTB/SmolLM2-1.7B-Instruct", // SmolLM2 (Llama)
  "onnx-community/Qwen3-0.6B-ONNX", // Qwen3
  "onnx-community/whisper-large-v3-ONNX", // Whisper
  "onnx-community/DeepSeek-R1-Distill-Qwen-1.5B-ONNX", // DeepSeek-R1 (Qwen2)
  "onnx-community/gemma-3-1b-it-ONNX-GQA", // Gemma
  "onnx-community/Phi-3.5-mini-instruct-ONNX-GQA", // Phi-3.5
  "onnx-community/orpheus-3b-0.1-ft-ONNX", // Orpheus (Llama)
  "onnx-community/Janus-Pro-1B-ONNX", // Janus Pro
  // "onnx-community/Qwen2.5-0.5B-Instruct-ONNX-GQA", // Qwen2
  "onnx-community/Qwen2.5-0.5B-Instruct-ONNX-MHA", // Qwen2
  "onnx-community/Phi-4-mini-instruct-ONNX-GQA", // Phi-4
  // "onnx-community/Phi-4-mini-instruct-ONNX-MHA", // Phi-4
  "onnx-community/Kokoro-82M-v1.0-ONNX", // Kokoro
  "Xenova/clip-vit-base-patch32", // CLIP
  "Xenova/gpt2", // GPT2
  "mixedbread-ai/mxbai-embed-large-v1", // BERT
  "Alibaba-NLP/gte-base-en-v1.5", // GTE
  "nomic-ai/nomic-embed-text-v1", // NomicBERT
  "Xenova/sam-vit-base", // SAM
  "lightonai/modernbert-embed-large", // ModernBERT
  "onnx-community/Florence-2-base-ft", // Florence-2
  "onnx-community/Qwen2-VL-2B-Instruct", // Qwen2-VL
  "onnx-community/ultravox-v0_5-llama-3_2-1b-ONNX", // UltraVox (Llama)
  "onnx-community/paligemma2-3b-pt-224", // PaliGemma2
  "onnx-community/depth-anything-v2-small", // Depth Anything
  "Xenova/vit-base-patch16-224", // ViT
  "briaai/RMBG-1.4", // IS-Net
  "onnx-community/BiRefNet-ONNX", // BiRefNet
  "onnx-community/vitpose-base-simple", // ViTPose
  "Xenova/distilbert-base-uncased-finetuned-sst-2-english", // DistilBERT
  "Xenova/musicgen-small", // MusicGen
  "Xenova/detr-resnet-50", // DETR
];
const MODELS_SORTED_BY_DOWNLOADS = Object.keys(idToTask);
function getPriorityScore(modelId) {
  const priority = PRIORITY_MODELS.indexOf(modelId);
  // const priority = PRIORITY_MODELS.findIndex((model) => modelId.startsWith(model));
  if (priority >= 0) {
    return priority;
  }
  const downloads = MODELS_SORTED_BY_DOWNLOADS.indexOf(modelId);
  return downloads === -1 ? Infinity : PRIORITY_MODELS.length + downloads;
}

const sortedModelIds = Object.keys(modelMapping).sort((a, b) => {
  const scoreA = getPriorityScore(a);
  const scoreB = getPriorityScore(b);
  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }
  return a.localeCompare(b);
});
const sortedModelMapping = Object.fromEntries(
  sortedModelIds.map((modelId) => [modelId, modelMapping[modelId]]),
);

// 4. Write the model mapping to a JSON file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(path.dirname(__filename));
const outputDir = path.join(__dirname, "data");
const outputPath = path.join(outputDir, "models.json");
fs.writeFileSync(outputPath, JSON.stringify(sortedModelMapping));
console.log(modelMapping);
