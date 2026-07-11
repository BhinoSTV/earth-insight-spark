import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { GISLayer } from "@/hooks/useGIS";
import {
  Eye, EyeOff, Trash2, Plus, ChevronUp, ChevronDown,
  Layers, ChevronRight, Circle
} from "lucide-react";

interface LayerPanelProps {
  layers: GISLayer[];
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
  onAddLayer: () => void;
  onRemoveLayer: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onRenameLayer: (id: string, name: string) => void;
  onColorChange: (id: string, color: string) => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

const LayerPanel = ({
  layers,
  activeLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleVisibility,
  onRenameLayer,
  onColorChange,
  onOpacityChange,
  onMoveUp,
  onMoveDown,
}: LayerPanelProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const startEdit = (layer: GISLayer) => {
    setEditingId(layer.id);
    setEditingName(layer.name);
  };

  const commitEdit = (id: string) => {
    if (editingName.trim()) onRenameLayer(id, editingName.trim());
    setEditingId(null);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Layers</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddLayer}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {[...layers].reverse().map((layer, reversedIdx) => {
          const idx = layers.length - 1 - reversedIdx;
          const isActive = layer.id === activeLayerId;
          const isExpanded = expandedId === layer.id;

          return (
            <div
              key={layer.id}
              className={`rounded-md mb-1 border transition-colors ${
                isActive
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-transparent hover:bg-muted/50'
              }`}
            >
              <div
                className="flex items-center gap-1 px-2 py-1.5 cursor-pointer"
                onClick={() => onSelectLayer(layer.id)}
              >
                <button
                  className="p-0.5 hover:text-primary transition-colors"
                  onClick={e => { e.stopPropagation(); setExpandedId(isExpanded ? null : layer.id); }}
                >
                  <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </button>

                <button
                  className="p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={e => { e.stopPropagation(); onToggleVisibility(layer.id); }}
                >
                  {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>

                <Circle
                  className="w-3 h-3 flex-shrink-0"
                  style={{ color: layer.color, fill: layer.color }}
                />

                {editingId === layer.id ? (
                  <Input
                    className="h-5 text-xs px-1 py-0 flex-1"
                    value={editingName}
                    autoFocus
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => commitEdit(layer.id)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') commitEdit(layer.id);
                      if (e.key === 'Escape') setEditingId(null);
                      e.stopPropagation();
                    }}
                    onClick={e => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className={`text-xs flex-1 truncate ${!layer.visible ? 'text-muted-foreground line-through' : ''}`}
                    onDoubleClick={e => { e.stopPropagation(); startEdit(layer); }}
                  >
                    {layer.name}
                  </span>
                )}

                <span className="text-xs text-muted-foreground ml-auto mr-1">
                  {layer.features.length}
                </span>

                <div className="flex items-center gap-0">
                  <button
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={e => { e.stopPropagation(); onMoveUp(layer.id); }}
                    disabled={idx === layers.length - 1}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button
                    className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                    onClick={e => { e.stopPropagation(); onMoveDown(layer.id); }}
                    disabled={idx === 0}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <button
                    className="p-0.5 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    onClick={e => { e.stopPropagation(); onRemoveLayer(layer.id); }}
                    disabled={layers.length <= 1}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="px-3 pb-2 space-y-2 border-t border-border/50 pt-2" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">Color</span>
                    <input
                      type="color"
                      value={layer.color}
                      onChange={e => onColorChange(layer.id, e.target.value)}
                      className="h-5 w-12 rounded cursor-pointer border-0 bg-transparent"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">Opacity</span>
                    <Slider
                      className="flex-1"
                      min={0}
                      max={1}
                      step={0.05}
                      value={[layer.opacity]}
                      onValueChange={([v]) => onOpacityChange(layer.id, v)}
                    />
                    <span className="text-xs text-muted-foreground w-8 text-right">
                      {Math.round(layer.opacity * 100)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {layer.features.length} feature{layer.features.length !== 1 ? 's' : ''}
                    {layer.features.length > 0 && (
                      <span className="ml-2">
                        ({layer.features.filter(f => f.type === 'Point').length} pts,{' '}
                        {layer.features.filter(f => f.type === 'LineString').length} lines,{' '}
                        {layer.features.filter(f => f.type === 'Polygon').length} polys)
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {layers.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs">
            No layers. Click + to add one.
          </div>
        )}
      </div>
    </div>
  );
};

export default LayerPanel;
