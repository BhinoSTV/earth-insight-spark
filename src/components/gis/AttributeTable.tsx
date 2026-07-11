import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GISFeature, GISLayer } from "@/hooks/useGIS";
import { ChevronDown, ChevronUp, Plus, Trash2, Check, X } from "lucide-react";

interface AttributeTableProps {
  layers: GISLayer[];
  selectedFeatureIds: string[];
  onSelectFeature: (id: string, multi: boolean) => void;
  onUpdateProperties: (id: string, props: Record<string, string | number | boolean>) => void;
  onRemoveFeature: (id: string) => void;
}

const AttributeTable = ({
  layers,
  selectedFeatureIds,
  onSelectFeature,
  onUpdateProperties,
  onRemoveFeature,
}: AttributeTableProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [editCell, setEditCell] = useState<{ featureId: string; key: string } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [newKey, setNewKey] = useState('');
  const [addingKey, setAddingKey] = useState(false);

  const allFeatures: (GISFeature & { layerName: string; layerColor: string })[] = layers.flatMap(l =>
    l.features.map(f => ({ ...f, layerName: l.name, layerColor: l.color }))
  );

  const allKeys = Array.from(new Set(allFeatures.flatMap(f => Object.keys(f.properties))));

  const startEditCell = (featureId: string, key: string, value: string | number | boolean) => {
    setEditCell({ featureId, key });
    setCellValue(String(value));
  };

  const commitCell = (feature: GISFeature) => {
    if (!editCell) return;
    const parsed = isNaN(Number(cellValue)) ? cellValue : Number(cellValue);
    onUpdateProperties(feature.id, { ...feature.properties, [editCell.key]: parsed });
    setEditCell(null);
  };

  const addColumn = () => {
    if (!newKey.trim()) return;
    allFeatures.forEach(f => {
      if (!(newKey in f.properties)) {
        onUpdateProperties(f.id, { ...f.properties, [newKey]: '' });
      }
    });
    setNewKey('');
    setAddingKey(false);
  };

  return (
    <div className={`flex flex-col bg-card border-t border-border transition-all ${collapsed ? 'h-8' : 'h-48'}`}>
      <div
        className="flex items-center justify-between px-3 h-8 cursor-pointer select-none border-b border-border/50"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Attribute Table — {allFeatures.length} features
          {selectedFeatureIds.length > 0 && (
            <span className="ml-2 text-primary">{selectedFeatureIds.length} selected</span>
          )}
        </span>
        <div className="flex items-center gap-2">
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5"
              onClick={e => { e.stopPropagation(); setAddingKey(true); }}
            >
              <Plus className="w-3 h-3" />
            </Button>
          )}
          {collapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-auto">
          {allFeatures.length === 0 ? (
            <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
              No features yet. Use the drawing tools to add features to the map.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <tr>
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground w-6">#</th>
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground">Layer</th>
                  <th className="px-2 py-1 text-left font-medium text-muted-foreground">Type</th>
                  {allKeys.map(key => (
                    <th key={key} className="px-2 py-1 text-left font-medium text-muted-foreground whitespace-nowrap">
                      {key}
                    </th>
                  ))}
                  {addingKey && (
                    <th className="px-2 py-1">
                      <div className="flex items-center gap-1">
                        <Input
                          autoFocus
                          className="h-5 text-xs px-1 w-24"
                          placeholder="field name"
                          value={newKey}
                          onChange={e => setNewKey(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') addColumn(); if (e.key === 'Escape') setAddingKey(false); }}
                        />
                        <button onClick={addColumn}><Check className="w-3 h-3 text-green-500" /></button>
                        <button onClick={() => setAddingKey(false)}><X className="w-3 h-3 text-destructive" /></button>
                      </div>
                    </th>
                  )}
                  <th className="px-2 py-1 w-6" />
                </tr>
              </thead>
              <tbody>
                {allFeatures.map((feature, i) => {
                  const isSelected = selectedFeatureIds.includes(feature.id);
                  return (
                    <tr
                      key={feature.id}
                      className={`border-b border-border/30 cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10' : 'hover:bg-muted/30'
                      }`}
                      onClick={e => onSelectFeature(feature.id, e.ctrlKey || e.metaKey || e.shiftKey)}
                    >
                      <td className="px-2 py-0.5 text-muted-foreground">{i + 1}</td>
                      <td className="px-2 py-0.5">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: feature.layerColor }} />
                          <span className="truncate max-w-[80px]">{feature.layerName}</span>
                        </div>
                      </td>
                      <td className="px-2 py-0.5 text-muted-foreground">{feature.type}</td>
                      {allKeys.map(key => {
                        const val = feature.properties[key] ?? '';
                        const isEditing = editCell?.featureId === feature.id && editCell?.key === key;
                        return (
                          <td
                            key={key}
                            className="px-2 py-0.5 max-w-[120px]"
                            onClick={e => { e.stopPropagation(); startEditCell(feature.id, key, val); }}
                          >
                            {isEditing ? (
                              <Input
                                autoFocus
                                className="h-5 text-xs px-1 min-w-[80px]"
                                value={cellValue}
                                onChange={e => setCellValue(e.target.value)}
                                onBlur={() => commitCell(feature)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') commitCell(feature);
                                  if (e.key === 'Escape') setEditCell(null);
                                  e.stopPropagation();
                                }}
                                onClick={e => e.stopPropagation()}
                              />
                            ) : (
                              <span className="truncate block">{String(val)}</span>
                            )}
                          </td>
                        );
                      })}
                      {addingKey && <td />}
                      <td className="px-1">
                        <button
                          className="text-muted-foreground hover:text-destructive p-0.5"
                          onClick={e => { e.stopPropagation(); onRemoveFeature(feature.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default AttributeTable;
