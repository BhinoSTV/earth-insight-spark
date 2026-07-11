import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DrawingMode } from "@/hooks/useGIS";
import {
  MousePointer2, Hand, MapPin, Minus, Pentagon, Square,
  Ruler, Trash2, Download, Upload, Undo2
} from "lucide-react";

interface GISToolbarProps {
  mode: DrawingMode;
  onModeChange: (mode: DrawingMode) => void;
  onDeleteSelected: () => void;
  onExport: () => void;
  onImport: () => void;
  onEscape: () => void;
  selectedCount: number;
}

interface ToolItem {
  mode?: DrawingMode;
  icon: React.ReactNode;
  label: string;
  action?: () => void;
  variant?: 'default' | 'destructive';
}

const GISToolbar = ({
  mode,
  onModeChange,
  onDeleteSelected,
  onExport,
  onImport,
  onEscape,
  selectedCount,
}: GISToolbarProps) => {
  const tools: ToolItem[] = [
    { mode: 'select', icon: <MousePointer2 className="w-4 h-4" />, label: 'Select features (S)' },
    { mode: 'pan', icon: <Hand className="w-4 h-4" />, label: 'Pan map (P)' },
  ];

  const drawTools: ToolItem[] = [
    { mode: 'point', icon: <MapPin className="w-4 h-4" />, label: 'Add point (M)' },
    { mode: 'polyline', icon: <Minus className="w-4 h-4" />, label: 'Draw line — click, dbl-click to finish (L)' },
    { mode: 'polygon', icon: <Pentagon className="w-4 h-4" />, label: 'Draw polygon — click, dbl-click to finish (G)' },
    { mode: 'rectangle', icon: <Square className="w-4 h-4" />, label: 'Draw rectangle — click & drag (R)' },
    { mode: 'measure', icon: <Ruler className="w-4 h-4" />, label: 'Measure distance (D)' },
  ];

  const actionTools: ToolItem[] = [
    { icon: <Undo2 className="w-4 h-4" />, label: 'Cancel drawing (Esc)', action: onEscape },
    { icon: <Trash2 className="w-4 h-4" />, label: `Delete selected (${selectedCount})`, action: onDeleteSelected, variant: 'destructive' },
    { icon: <Upload className="w-4 h-4" />, label: 'Import GeoJSON', action: onImport },
    { icon: <Download className="w-4 h-4" />, label: 'Export GeoJSON', action: onExport },
  ];

  const ToolBtn = ({ item }: { item: ToolItem }) => {
    const isActive = item.mode !== undefined && item.mode === mode;
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={item.variant === 'destructive' && selectedCount === 0 ? 'ghost' : isActive ? 'default' : 'ghost'}
            size="icon"
            className={`h-8 w-8 ${isActive ? 'bg-primary text-primary-foreground' : ''} ${item.variant === 'destructive' && selectedCount > 0 ? 'text-destructive hover:bg-destructive hover:text-destructive-foreground' : ''}`}
            onClick={() => item.action ? item.action() : item.mode && onModeChange(item.mode)}
            disabled={item.variant === 'destructive' && selectedCount === 0}
          >
            {item.icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{item.label}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-card border-b border-border">
      {tools.map((t, i) => <ToolBtn key={i} item={t} />)}
      <div className="w-px h-6 bg-border mx-1" />
      {drawTools.map((t, i) => <ToolBtn key={i} item={t} />)}
      <div className="w-px h-6 bg-border mx-1" />
      {actionTools.map((t, i) => <ToolBtn key={i} item={t} />)}

      <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        {mode !== 'pan' && mode !== 'select' && (
          <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
            {mode === 'polyline' || mode === 'polygon' ? 'Click to add points · Double-click to finish · Esc to cancel' :
             mode === 'rectangle' ? 'Click twice to draw · Esc to cancel' :
             mode === 'measure' ? 'Click to measure distance · Double-click to finish' :
             'Click on map to place'}
          </span>
        )}
        {selectedCount > 0 && (
          <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-medium">
            {selectedCount} selected
          </span>
        )}
      </div>
    </div>
  );
};

export default GISToolbar;
