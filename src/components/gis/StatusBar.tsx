import { BaseMap } from "@/hooks/useGIS";
import { Map, Satellite, Mountain } from "lucide-react";

interface StatusBarProps {
  lat: number | null;
  lng: number | null;
  zoom: number;
  baseMap: BaseMap;
  onBaseMapChange: (bm: BaseMap) => void;
  featureCount: number;
  layerCount: number;
}

const StatusBar = ({ lat, lng, zoom, baseMap, onBaseMapChange, featureCount, layerCount }: StatusBarProps) => {
  const baseMaps: { id: BaseMap; icon: React.ReactNode; label: string }[] = [
    { id: 'osm', icon: <Map className="w-3 h-3" />, label: 'Streets' },
    { id: 'satellite', icon: <Satellite className="w-3 h-3" />, label: 'Satellite' },
    { id: 'terrain', icon: <Mountain className="w-3 h-3" />, label: 'Terrain' },
  ];

  return (
    <div className="flex items-center gap-4 px-3 h-6 bg-muted/50 border-t border-border text-xs text-muted-foreground select-none">
      <div className="flex items-center gap-1">
        {baseMaps.map(bm => (
          <button
            key={bm.id}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
              baseMap === bm.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
            onClick={() => onBaseMapChange(bm.id)}
          >
            {bm.icon}
            <span>{bm.label}</span>
          </button>
        ))}
      </div>

      <div className="w-px h-3 bg-border" />

      <span>
        CRS: <strong className="text-foreground">WGS84</strong>
      </span>

      {lat !== null && lng !== null && (
        <>
          <div className="w-px h-3 bg-border" />
          <span>
            Lat: <strong className="text-foreground">{lat.toFixed(6)}</strong>
          </span>
          <span>
            Lng: <strong className="text-foreground">{lng.toFixed(6)}</strong>
          </span>
        </>
      )}

      <div className="w-px h-3 bg-border" />
      <span>
        Zoom: <strong className="text-foreground">{zoom}</strong>
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span>{layerCount} layer{layerCount !== 1 ? 's' : ''}</span>
        <span>{featureCount} feature{featureCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
};

export default StatusBar;
