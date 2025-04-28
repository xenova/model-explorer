import { useState } from "react";
import { ChevronDown, ChevronRight, FileIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ModelData = {
  tags: string[];
  files: string[];
};

type ModelListProps = {
  models: [string, ModelData][];
  onFileSelect: (modelId: string, file: string) => void;
  selectedFile: string | null;
  selectedModelId: string | null;
};

export default function ModelList({
  models,
  onFileSelect,
  selectedFile,
  selectedModelId,
}: ModelListProps) {
  const [expandedModels, setExpandedModels] = useState<Record<string, boolean>>(
    {},
  );

  const toggleExpand = (modelId: string) => {
    setExpandedModels((prev) => ({
      ...prev,
      [modelId]: !prev[modelId],
    }));
  };

  return (
    <div className="space-y-1">
      {models.length === 0 ? (
        <div className="py-4 text-center text-muted-foreground">
          No models match your search criteria
        </div>
      ) : (
        models.map(([modelId, model]) => (
          <div key={modelId} className="rounded-md overflow-hidden">
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-accent rounded-md"
              onClick={() => toggleExpand(modelId)}
              title={modelId}
            >
              {expandedModels[modelId] ? (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="truncate font-medium">{modelId}</span>
            </button>

            {expandedModels[modelId] && (
              <div className="ml-6 pl-2 border-l space-y-1 py-1">
                {model.files.map((file) => (
                  <button
                    key={file}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-1.5 text-left text-sm rounded-md",
                      selectedFile === file && selectedModelId === modelId
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent",
                    )}
                    onClick={() => onFileSelect(modelId, file)}
                  >
                    <FileIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{file}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
