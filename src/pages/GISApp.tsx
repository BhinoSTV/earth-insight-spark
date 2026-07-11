import { useRef, useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import useGIS from "@/hooks/useGIS";
import MapView from "@/components/gis/MapView";
import LayerPanel from "@/components/gis/LayerPanel";
import GISToolbar from "@/components/gis/GISToolbar";
import AttributeTable from "@/components/gis/AttributeTable";
import StatusBar from "@/components/gis/StatusBar";
import { Satellite, ArrowLeft, HelpCircle } from "lucide-react";

const GISApp = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [zoom, setZoom] = useState(3);

  const gis = useGIS();

  const handleFeatureAdd = useCallback(
    (feature: Parameters<typeof gis.addFeature>[0]) => {
      gis.addFeature(feature);
    },
    [gis.addFeature]
  );

  const handleExport = useCallback(() => {
    const data = gis.exportGeoJSON();
    const blob = new Blob([data], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "features.geojson";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "GeoJSON file downloaded." });
  }, [gis.exportGeoJSON, toast]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const json = JSON.parse(ev.target?.result as string);
          gis.importGeoJSON({ ...json, name: file.name.replace(/\.geojson?$/, "") });
          toast({ title: "Imported", description: `Loaded ${json.features?.length ?? 0} features.` });
        } catch {
          toast({ title: "Import failed", description: "Invalid GeoJSON file.", variant: "destructive" });
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [gis.importGeoJSON, toast]
  );

  const handleEscape = useCallback(() => {
    gis.setDrawingMode("pan");
    gis.clearSelection();
  }, [gis.setDrawingMode, gis.clearSelection]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key.toLowerCase()) {
        case "escape": handleEscape(); break;
        case "s": gis.setDrawingMode("select"); break;
        case "p": gis.setDrawingMode("pan"); break;
        case "m": gis.setDrawingMode("point"); break;
        case "l": gis.setDrawingMode("polyline"); break;
        case "g": gis.setDrawingMode("polygon"); break;
        case "r": gis.setDrawingMode("rectangle"); break;
        case "d": gis.setDrawingMode("measure"); break;
        case "delete":
        case "backspace":
          if (gis.selectedFeatureIds.length > 0) gis.deleteSelected();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [gis, handleEscape]);

  const totalFeatures = gis.layers.reduce((sum, l) => sum + l.features.length, 0);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      {/* App Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-card border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors text-xs">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">Earth Insight GIS</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="hidden sm:inline">Shortcuts: S=Select P=Pan M=Point L=Line G=Polygon R=Rect D=Measure Del=Delete</span>
          <Button variant="ghost" size="icon" className="h-6 w-6">
            <HelpCircle className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <GISToolbar
        mode={gis.drawingMode}
        onModeChange={gis.setDrawingMode}
        onDeleteSelected={gis.deleteSelected}
        onExport={handleExport}
        onImport={handleImportClick}
        onEscape={handleEscape}
        selectedCount={gis.selectedFeatureIds.length}
      />

      {/* Main body: sidebar + map */}
      <div className="flex flex-1 overflow-hidden">
        {/* Layer Panel */}
        <div className="w-56 flex-shrink-0 border-r border-border overflow-hidden">
          <LayerPanel
            layers={gis.layers}
            activeLayerId={gis.activeLayerId}
            onSelectLayer={gis.setActiveLayerId}
            onAddLayer={gis.addLayer}
            onRemoveLayer={gis.removeLayer}
            onToggleVisibility={gis.toggleLayerVisibility}
            onRenameLayer={gis.updateLayerName}
            onColorChange={gis.updateLayerColor}
            onOpacityChange={gis.updateLayerOpacity}
            onMoveUp={gis.moveLayerUp}
            onMoveDown={gis.moveLayerDown}
          />
        </div>

        {/* Map */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <MapView
            layers={gis.layers}
            activeLayerColor={gis.activeLayer?.color ?? "#3b82f6"}
            drawingMode={gis.drawingMode}
            selectedFeatureIds={gis.selectedFeatureIds}
            baseMap={gis.baseMap}
            onFeatureAdd={handleFeatureAdd}
            onCoordChange={(lat, lng) => setCoords({ lat, lng })}
            onZoomChange={setZoom}
            onFeatureSelect={gis.selectFeature}
            onClearSelection={gis.clearSelection}
          />
        </div>
      </div>

      {/* Attribute Table */}
      <AttributeTable
        layers={gis.layers}
        selectedFeatureIds={gis.selectedFeatureIds}
        onSelectFeature={gis.selectFeature}
        onUpdateProperties={gis.updateFeatureProperties}
        onRemoveFeature={gis.removeFeature}
      />

      {/* Status Bar */}
      <StatusBar
        lat={coords?.lat ?? null}
        lng={coords?.lng ?? null}
        zoom={zoom}
        baseMap={gis.baseMap}
        onBaseMapChange={gis.setBaseMap}
        featureCount={totalFeatures}
        layerCount={gis.layers.length}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".geojson,.json"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};

export default GISApp;
