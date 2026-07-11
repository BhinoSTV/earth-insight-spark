import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Polygon,
  Rectangle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { DrawingMode, GISFeature, GISLayer, BaseMap } from "@/hooks/useGIS";

// Fix default icon paths broken by Vite bundling
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const selectedIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: "leaflet-marker-selected",
});

const TILE_URLS: Record<BaseMap, { url: string; attribution: string }> = {
  osm: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  },
};

// Converts GeoJSON [lng, lat] array to Leaflet [lat, lng]
const toLatLng = (coord: [number, number]): [number, number] => [coord[1], coord[0]];
const toLatLngs = (coords: [number, number][]): [number, number][] => coords.map(toLatLng);

interface DrawingControllerProps {
  mode: DrawingMode;
  activeLayerColor: string;
  onFeatureAdd: (f: Omit<GISFeature, "id" | "selected">) => void;
  onCoordChange: (lat: number, lng: number) => void;
  onZoomChange: (z: number) => void;
  layers: GISLayer[];
  selectedFeatureIds: string[];
  onFeatureSelect: (id: string, multi: boolean) => void;
  onCursorChange: (cursor: string) => void;
}

const DrawingController = ({
  mode,
  activeLayerColor,
  onFeatureAdd,
  onCoordChange,
  onZoomChange,
  layers,
  selectedFeatureIds,
  onFeatureSelect,
  onCursorChange,
}: DrawingControllerProps) => {
  const [drawCoords, setDrawCoords] = useState<[number, number][]>([]);
  const [mousePos, setMousePos] = useState<[number, number] | null>(null);
  const [rectStart, setRectStart] = useState<[number, number] | null>(null);
  const [measuring, setMeasuring] = useState<[number, number][]>([]);
  const [measureTotal, setMeasureTotal] = useState(0);

  const map = useMapEvents({
    mousemove(e) {
      setMousePos([e.latlng.lat, e.latlng.lng]);
      onCoordChange(e.latlng.lat, e.latlng.lng);
    },
    zoom() {
      onZoomChange(map.getZoom());
    },
    click(e) {
      if (mode === "point") {
        onFeatureAdd({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
          properties: { created: new Date().toISOString() },
        });
      } else if (mode === "polyline" || mode === "polygon") {
        setDrawCoords(prev => [...prev, [e.latlng.lat, e.latlng.lng]]);
      } else if (mode === "rectangle") {
        if (!rectStart) {
          setRectStart([e.latlng.lat, e.latlng.lng]);
        } else {
          const bounds: [[number, number], [number, number]] = [rectStart, [e.latlng.lat, e.latlng.lng]];
          const minLat = Math.min(bounds[0][0], bounds[1][0]);
          const maxLat = Math.max(bounds[0][0], bounds[1][0]);
          const minLng = Math.min(bounds[0][1], bounds[1][1]);
          const maxLng = Math.max(bounds[0][1], bounds[1][1]);
          onFeatureAdd({
            type: "Polygon",
            coordinates: [[
              [minLng, minLat],
              [maxLng, minLat],
              [maxLng, maxLat],
              [minLng, maxLat],
              [minLng, minLat],
            ]],
            properties: { created: new Date().toISOString(), shape: "rectangle" },
          });
          setRectStart(null);
        }
      } else if (mode === "measure") {
        setMeasuring(prev => {
          const next = [...prev, [e.latlng.lat, e.latlng.lng] as [number, number]];
          if (next.length > 1) {
            let total = 0;
            for (let i = 1; i < next.length; i++) {
              total += L.latLng(next[i - 1]).distanceTo(L.latLng(next[i]));
            }
            setMeasureTotal(total);
          }
          return next;
        });
      }
    },
    dblclick(e) {
      e.originalEvent.preventDefault();
      if (mode === "polyline" && drawCoords.length >= 2) {
        const coords = drawCoords.map(([lat, lng]) => [lng, lat] as [number, number]);
        onFeatureAdd({
          type: "LineString",
          coordinates: coords,
          properties: { created: new Date().toISOString() },
        });
        setDrawCoords([]);
      } else if (mode === "polygon" && drawCoords.length >= 3) {
        const ring = [...drawCoords, drawCoords[0]].map(([lat, lng]) => [lng, lat] as [number, number]);
        onFeatureAdd({
          type: "Polygon",
          coordinates: [ring],
          properties: { created: new Date().toISOString() },
        });
        setDrawCoords([]);
      } else if (mode === "measure" && measuring.length >= 2) {
        setMeasuring([]);
        setMeasureTotal(0);
      }
    },
  });

  useEffect(() => {
    setDrawCoords([]);
    setRectStart(null);
    setMeasuring([]);
    setMeasureTotal(0);
  }, [mode]);

  useEffect(() => {
    const cursors: Record<DrawingMode, string> = {
      pan: "grab",
      select: "default",
      point: "crosshair",
      polyline: "crosshair",
      polygon: "crosshair",
      rectangle: "crosshair",
      measure: "crosshair",
    };
    const container = map.getContainer();
    container.style.cursor = cursors[mode] || "default";
    onCursorChange(cursors[mode] || "default");
  }, [mode, map, onCursorChange]);

  const previewCoords = mousePos && drawCoords.length > 0
    ? [...drawCoords, mousePos]
    : drawCoords;

  const rectPreviewBounds: [[number, number], [number, number]] | null =
    rectStart && mousePos ? [rectStart, mousePos] : null;

  const currentSegment = mousePos && measuring.length > 0
    ? [...measuring, mousePos]
    : measuring;

  return (
    <>
      {(mode === "polyline" || mode === "polygon") && previewCoords.length >= 2 && (
        <Polyline
          positions={previewCoords}
          pathOptions={{ color: activeLayerColor, dashArray: "6 4", weight: 2, opacity: 0.8 }}
        />
      )}
      {mode === "polygon" && previewCoords.length >= 2 && (
        <Polygon
          positions={previewCoords}
          pathOptions={{ color: activeLayerColor, fillOpacity: 0.15, weight: 2, dashArray: "6 4", opacity: 0.8 }}
        />
      )}
      {rectPreviewBounds && (
        <Rectangle
          bounds={rectPreviewBounds}
          pathOptions={{ color: activeLayerColor, fillOpacity: 0.15, weight: 2, dashArray: "6 4" }}
        />
      )}
      {rectStart && !mousePos && (
        <Marker position={rectStart} icon={defaultIcon} />
      )}
      {mode === "measure" && currentSegment.length >= 2 && (
        <Polyline
          positions={currentSegment}
          pathOptions={{ color: "#f59e0b", weight: 2, dashArray: "6 4" }}
        />
      )}
    </>
  );
};

interface FeatureLayerProps {
  layer: GISLayer;
  selectedFeatureIds: string[];
  onFeatureSelect: (id: string, multi: boolean) => void;
  mode: DrawingMode;
}

const FeatureLayer = ({ layer, selectedFeatureIds, onFeatureSelect, mode }: FeatureLayerProps) => {
  if (!layer.visible) return null;

  const color = layer.color;
  const opacity = layer.opacity;

  return (
    <>
      {layer.features.map(feature => {
        const isSelected = selectedFeatureIds.includes(feature.id);
        const weight = isSelected ? 3 : 2;
        const pathOptions = {
          color: isSelected ? "#f97316" : color,
          fillColor: isSelected ? "#f97316" : color,
          fillOpacity: opacity * 0.4,
          weight,
          opacity,
        };

        if (feature.type === "Point") {
          const coords = feature.coordinates as [number, number];
          return (
            <Marker
              key={feature.id}
              position={toLatLng(coords)}
              icon={isSelected ? selectedIcon : defaultIcon}
              eventHandlers={{
                click: e => {
                  L.DomEvent.stopPropagation(e);
                  if (mode === "select") onFeatureSelect(feature.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
                },
              }}
            />
          );
        }

        if (feature.type === "LineString") {
          const coords = feature.coordinates as [number, number][];
          return (
            <Polyline
              key={feature.id}
              positions={toLatLngs(coords)}
              pathOptions={pathOptions}
              eventHandlers={{
                click: e => {
                  L.DomEvent.stopPropagation(e);
                  if (mode === "select") onFeatureSelect(feature.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
                },
              }}
            />
          );
        }

        if (feature.type === "Polygon") {
          const coords = feature.coordinates as [number, number][][];
          return (
            <Polygon
              key={feature.id}
              positions={toLatLngs(coords[0])}
              pathOptions={pathOptions}
              eventHandlers={{
                click: e => {
                  L.DomEvent.stopPropagation(e);
                  if (mode === "select") onFeatureSelect(feature.id, e.originalEvent.ctrlKey || e.originalEvent.metaKey);
                },
              }}
            />
          );
        }

        return null;
      })}
    </>
  );
};

interface MapViewProps {
  layers: GISLayer[];
  activeLayerColor: string;
  drawingMode: DrawingMode;
  selectedFeatureIds: string[];
  baseMap: BaseMap;
  onFeatureAdd: (f: Omit<GISFeature, "id" | "selected">) => void;
  onCoordChange: (lat: number, lng: number) => void;
  onZoomChange: (z: number) => void;
  onFeatureSelect: (id: string, multi: boolean) => void;
  onClearSelection: () => void;
  initialZoom?: number;
}

const MapView = ({
  layers,
  activeLayerColor,
  drawingMode,
  selectedFeatureIds,
  baseMap,
  onFeatureAdd,
  onCoordChange,
  onZoomChange,
  onFeatureSelect,
  onClearSelection,
  initialZoom = 3,
}: MapViewProps) => {
  const tile = TILE_URLS[baseMap];

  return (
    <div className="relative flex-1 h-full">
      <style>{`
        .leaflet-marker-selected {
          filter: hue-rotate(120deg) saturate(200%);
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
      <MapContainer
        center={[20, 0]}
        zoom={initialZoom}
        style={{ height: "100%", width: "100%" }}
        zoomControl={true}
        doubleClickZoom={false}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} key={baseMap} />

        {layers.map(layer => (
          <FeatureLayer
            key={layer.id}
            layer={layer}
            selectedFeatureIds={selectedFeatureIds}
            onFeatureSelect={onFeatureSelect}
            mode={drawingMode}
          />
        ))}

        <DrawingController
          mode={drawingMode}
          activeLayerColor={activeLayerColor}
          onFeatureAdd={onFeatureAdd}
          onCoordChange={onCoordChange}
          onZoomChange={onZoomChange}
          layers={layers}
          selectedFeatureIds={selectedFeatureIds}
          onFeatureSelect={onFeatureSelect}
          onCursorChange={() => {}}
        />
      </MapContainer>
    </div>
  );
};

export default MapView;
