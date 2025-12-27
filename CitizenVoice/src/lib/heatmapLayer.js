// Custom heatmap layer for react-leaflet using leaflet.heat
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const HeatmapLayerComponent = ({ points, options = {} }) => {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    // Convert points to the format expected by leaflet.heat [lat, lng, intensity]
    const heatPoints = points.map(point => [
      point.lat,
      point.lng,
      point.intensity || 1
    ]);

    // Default options
    const defaultOptions = {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      max: 1.0,
      gradient: {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        0.85: 'orange',
        1.0: 'red'
      }
    };

    const heatOptions = { ...defaultOptions, ...options };

    // Create heatmap layer
    const heatLayer = L.heatLayer(heatPoints, heatOptions);
    
    // Add to map
    heatLayer.addTo(map);

    // Cleanup function
    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, options]);

  return null;
};

export default HeatmapLayerComponent;
