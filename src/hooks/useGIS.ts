import { useState, useCallback } from 'react';

export type DrawingMode = 'select' | 'pan' | 'point' | 'polyline' | 'polygon' | 'rectangle' | 'measure';
export type BaseMap = 'osm' | 'satellite' | 'terrain';
export type GeometryType = 'Point' | 'LineString' | 'Polygon';

export interface GISFeature {
  id: string;
  type: GeometryType;
  // GeoJSON order: [lng, lat] for Point, [[lng,lat],...] for LineString, [[[lng,lat],...]] for Polygon
  coordinates: [number, number] | [number, number][] | [number, number][][];
  properties: Record<string, string | number | boolean>;
  selected: boolean;
}

export interface GISLayer {
  id: string;
  name: string;
  visible: boolean;
  color: string;
  opacity: number;
  features: GISFeature[];
}

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const useGIS = () => {
  const firstId = genId();
  const [layers, setLayers] = useState<GISLayer[]>([
    { id: firstId, name: 'Layer 1', visible: true, color: COLORS[0], opacity: 0.8, features: [] },
  ]);
  const [activeLayerId, setActiveLayerId] = useState<string>(firstId);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>('pan');
  const [selectedFeatureIds, setSelectedFeatureIds] = useState<string[]>([]);
  const [baseMap, setBaseMap] = useState<BaseMap>('osm');

  const addLayer = useCallback(() => {
    setLayers(prev => {
      const newLayer: GISLayer = {
        id: genId(),
        name: `Layer ${prev.length + 1}`,
        visible: true,
        color: COLORS[prev.length % COLORS.length],
        opacity: 0.8,
        features: [],
      };
      setActiveLayerId(newLayer.id);
      return [...prev, newLayer];
    });
  }, []);

  const removeLayer = useCallback((layerId: string) => {
    setLayers(prev => {
      const filtered = prev.filter(l => l.id !== layerId);
      return filtered.length > 0 ? filtered : prev;
    });
    setSelectedFeatureIds([]);
  }, []);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, visible: !l.visible } : l));
  }, []);

  const updateLayerName = useCallback((layerId: string, name: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, name } : l));
  }, []);

  const updateLayerColor = useCallback((layerId: string, color: string) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, color } : l));
  }, []);

  const updateLayerOpacity = useCallback((layerId: string, opacity: number) => {
    setLayers(prev => prev.map(l => l.id === layerId ? { ...l, opacity } : l));
  }, []);

  const moveLayerUp = useCallback((layerId: string) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === layerId);
      if (idx <= 0) return prev;
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
  }, []);

  const moveLayerDown = useCallback((layerId: string) => {
    setLayers(prev => {
      const idx = prev.findIndex(l => l.id === layerId);
      if (idx === -1 || idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
  }, []);

  const addFeature = useCallback((feature: Omit<GISFeature, 'id' | 'selected'>, targetLayerId?: string) => {
    const newFeature: GISFeature = { ...feature, id: genId(), selected: false };
    setLayers(prev => prev.map(l =>
      l.id === (targetLayerId ?? activeLayerId)
        ? { ...l, features: [...l.features, newFeature] }
        : l
    ));
    return newFeature.id;
  }, [activeLayerId]);

  const removeFeature = useCallback((featureId: string) => {
    setLayers(prev => prev.map(l => ({ ...l, features: l.features.filter(f => f.id !== featureId) })));
    setSelectedFeatureIds(prev => prev.filter(id => id !== featureId));
  }, []);

  const updateFeatureProperties = useCallback((featureId: string, properties: Record<string, string | number | boolean>) => {
    setLayers(prev => prev.map(l => ({
      ...l,
      features: l.features.map(f => f.id === featureId ? { ...f, properties } : f),
    })));
  }, []);

  const selectFeature = useCallback((featureId: string, multi = false) => {
    setSelectedFeatureIds(prev => {
      if (multi) return prev.includes(featureId) ? prev.filter(id => id !== featureId) : [...prev, featureId];
      return [featureId];
    });
  }, []);

  const clearSelection = useCallback(() => setSelectedFeatureIds([]), []);

  const deleteSelected = useCallback(() => {
    setLayers(prev => prev.map(l => ({
      ...l,
      features: l.features.filter(f => !selectedFeatureIds.includes(f.id)),
    })));
    setSelectedFeatureIds([]);
  }, [selectedFeatureIds]);

  const importGeoJSON = useCallback((geojson: { name?: string; features?: { geometry: { type: string; coordinates: unknown }; properties?: Record<string, string | number | boolean> }[] }) => {
    if (!geojson.features) return;
    setLayers(prev => {
      const newLayer: GISLayer = {
        id: genId(),
        name: geojson.name || 'Imported Layer',
        visible: true,
        color: COLORS[prev.length % COLORS.length],
        opacity: 0.8,
        features: geojson.features!
          .filter(f => ['Point', 'LineString', 'Polygon'].includes(f.geometry.type))
          .map(f => ({
            id: genId(),
            type: f.geometry.type as GeometryType,
            coordinates: f.geometry.coordinates as GISFeature['coordinates'],
            properties: f.properties || {},
            selected: false,
          })),
      };
      setActiveLayerId(newLayer.id);
      return [...prev, newLayer];
    });
  }, []);

  const exportGeoJSON = useCallback((layerId?: string) => {
    const toLayers = layerId ? layers.filter(l => l.id === layerId) : layers.filter(l => l.visible);
    return JSON.stringify({
      type: 'FeatureCollection',
      features: toLayers.flatMap(l =>
        l.features.map(f => ({
          type: 'Feature',
          geometry: { type: f.type, coordinates: f.coordinates },
          properties: f.properties,
        }))
      ),
    }, null, 2);
  }, [layers]);

  const activeLayer = layers.find(l => l.id === activeLayerId) ?? layers[0];
  const allFeatures = layers.flatMap(l => l.features);
  const selectedFeatures = allFeatures.filter(f => selectedFeatureIds.includes(f.id));

  return {
    layers,
    activeLayerId,
    activeLayer,
    drawingMode,
    selectedFeatureIds,
    selectedFeatures,
    allFeatures,
    baseMap,
    setBaseMap,
    setActiveLayerId,
    setDrawingMode,
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    updateLayerName,
    updateLayerColor,
    updateLayerOpacity,
    moveLayerUp,
    moveLayerDown,
    addFeature,
    removeFeature,
    updateFeatureProperties,
    selectFeature,
    clearSelection,
    deleteSelected,
    importGeoJSON,
    exportGeoJSON,
  };
};

export default useGIS;
