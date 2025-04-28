import { useState, useRef, useEffect } from "react";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "next-themes";
import ModelList from "@/components/model-list";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import MODELS from "@/data/models.json";

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(425);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);
  const { theme, setTheme } = useTheme();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);

  // Count models per tag and sort tags by descending frequency
  const tagCounts = Object.values(MODELS)
    .flatMap((m) => m.tags)
    .reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
  const allTags = Object.keys(tagCounts).sort(
    (a, b) => tagCounts[b] - tagCounts[a],
  );

  // Filter models based on search query and active filters
  const filteredModels = Object.entries(MODELS).filter(([modelId, model]) => {
    const matchesSearch = modelId
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesFilters =
      activeFilters.length === 0 ||
      activeFilters.some((filter) => (model.tags as string[]).includes(filter));
    return matchesSearch && matchesFilters;
  });

  // Construct the URL for the Netron viewer
  const netronUrl = selectedFile
    ? `https://netron.app/?url=https://huggingface.co/datasets/onnx-community/model-explorer/resolve/main/${selectedModelId}/${selectedFile}`
    : "";

  // Toggle a tag filter
  const toggleFilter = (tag: string) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  // Handle file selection
  const handleFileSelect = (modelId: string, file: string) => {
    setSelectedModelId(modelId);
    setSelectedFile(file);
  };

  // Completely redesigned resize functionality
  useEffect(() => {
    const sidebar = sidebarRef.current;
    const dragHandle = dragHandleRef.current;

    if (!sidebar || !dragHandle) return;

    let startX: number;
    let startWidth: number;

    // Use pointer events with capture so dragging continues even if cursor moves fast
    const onPointerDown = (e: PointerEvent) => {
      e.preventDefault();
      startX = e.clientX;
      startWidth = sidebar.offsetWidth;
      sidebar.style.transition = "none";
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      dragHandle.setPointerCapture(e.pointerId);
      dragHandle.addEventListener("pointermove", onPointerMove);
      dragHandle.addEventListener("pointerup", onPointerUp);
    };

    const onPointerMove = (e: PointerEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(240, Math.min(600, startWidth + delta));
      sidebar.style.width = `${newWidth}px`;
    };

    const onPointerUp = (e: PointerEvent) => {
      sidebar.style.transition = "";
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      setSidebarWidth(sidebar.offsetWidth);
      dragHandle.releasePointerCapture(e.pointerId);
      dragHandle.removeEventListener("pointermove", onPointerMove);
      dragHandle.removeEventListener("pointerup", onPointerUp);
    };

    dragHandle.addEventListener("pointerdown", onPointerDown);

    return () => {
      dragHandle.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={`${sidebarOpen ? "" : "w-0"} h-full border-r overflow-hidden flex flex-col transition-[width] duration-300`}
        style={{ width: sidebarOpen ? `${sidebarWidth}px` : 0 }}
      >
        <div className="p-4 border-b">
          <div className="relative flex items-center gap-2 mb-4">
            <Search className="absolute ml-3 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 pl-9"
            />
            {searchQuery && (
              <X
                className="absolute right-3 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground"
                onClick={() => setSearchQuery("")}
              />
            )}
          </div>

          <div className="mb-3">
            <h3 className="text-sm font-medium mb-2">Tags</h3>
            <div className="relative">
              <div
                className={`flex flex-wrap gap-1.5 transition-[max-height] duration-200 ${
                  showAllTags ? "max-h-full" : "max-h-12 overflow-hidden"
                }`}
              >
                {allTags.map((tag) => (
                  <Toggle
                    key={tag}
                    pressed={activeFilters.includes(tag)}
                    onPressedChange={() => toggleFilter(tag)}
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 text-xs"
                  >
                    {tag} ({tagCounts[tag]})
                  </Toggle>
                ))}
              </div>
              {!showAllTags && (
                <div className="absolute bottom-0 left-0 w-full h-8 bg-gradient-to-t from-background to-transparent pointer-events-none" />
              )}
            </div>
            <div className="flex justify-center mt-1">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowAllTags((prev) => !prev)}
              >
                {showAllTags ? "Show less" : "Show more"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <ModelList
            models={filteredModels}
            onFileSelect={handleFileSelect}
            selectedFile={selectedFile}
            selectedModelId={selectedModelId}
          />
        </div>

        {/* Theme toggle at bottom of sidebar */}
        <div className="p-4 border-t flex justify-start">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Drag handle */}
      {sidebarOpen && (
        <div
          ref={dragHandleRef}
          className="w-2 h-full cursor-col-resize hover:bg-primary/20 active:bg-primary/40 z-10"
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col h-full">
        <div className="h-12 border-b flex items-center justify-between px-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center">
            {selectedFile && selectedModelId && (
              <div className="mr-4 text-sm flex items-center">
                <a
                  href={`https://huggingface.co/${selectedModelId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline flex items-center"
                >
                  {selectedModelId}
                  <ExternalLink className="h-3.5 w-3.5 ml-1" />
                </a>
                <span className="mx-1">/</span>
                <span>{selectedFile}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedFile ? (
            <iframe
              src={netronUrl}
              className="w-full h-full border-0"
              title="Netron Model Viewer"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <h2 className="text-2xl font-semibold mb-2">
                  Neural Network Visualizer
                </h2>
                <p>Select a model file from the sidebar to visualize it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
