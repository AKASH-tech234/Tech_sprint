// CitizenVoice/src/components/Dashboard/Shared/HeatmapViewer.jsx
import { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import HeatmapLayerComponent from '../../../lib/heatmapLayer';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  MapPin, 
  Filter, 
  Layers, 
  Navigation,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp
} from 'lucide-react';
import { issueService } from '../../../services/issueService';

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different issue statuses
const createCustomIcon = (status) => {
  const colors = {
    reported: '#ef4444',
    acknowledged: '#f59e0b',
    'in-progress': '#3b82f6',
    resolved: '#10b981',
    rejected: '#6b7280'
  };
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${colors[status] || '#6b7280'};
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        <div style="
          transform: rotate(45deg);
          margin-top: 4px;
          margin-left: 5px;
        ">
          <div style="
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28]
  });
};

// Map controller to handle centering and zoom
const MapController = ({ center, zoom }) => {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  
  return null;
};

const HeatmapViewer = ({ 
  userRole = 'citizen',
  defaultCenter = [28.6139, 77.2090], // Delhi, India
  defaultZoom = 12,
  height = '600px'
}) => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  });
  
  // View options
  const [viewMode, setViewMode] = useState('heatmap'); // 'heatmap', 'markers', 'clusters'
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapZoom, setMapZoom] = useState(defaultZoom);

  // Fetch issues on mount and when filters change
  useEffect(() => {
    fetchIssues();
  }, [filters]);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await issueService.getAllIssues(filters);
      setIssues(response.data?.issues || []);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Prepare heatmap data
  const heatmapData = useMemo(() => {
    return issues
      .filter(issue => issue.location?.lat && issue.location?.lng)
      .map(issue => ({
        lat: issue.location.lat,
        lng: issue.location.lng,
        intensity: getPriorityWeight(issue.priority, issue.status)
      }));
  }, [issues]);

  // Get intensity based on priority and status
  const getPriorityWeight = (priority, status) => {
    let weight = 0.5;
    
    // Priority weight
    if (priority === 'high') weight = 1.0;
    else if (priority === 'medium') weight = 0.6;
    else weight = 0.3;
    
    // Status modifier
    if (status === 'reported') weight *= 1.2;
    else if (status === 'resolved') weight *= 0.5;
    
    return weight;
  };

  // Filter controls
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({ ...prev, [filterType]: value }));
  };

  // Locate user
  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter([latitude, longitude]);
          setMapZoom(14);
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to retrieve your location');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  // Stats by status
  const stats = useMemo(() => {
    const statuses = ['reported', 'acknowledged', 'in-progress', 'resolved'];
    return statuses.map(status => ({
      status,
      count: issues.filter(i => i.status === status).length
    }));
  }, [issues]);

  // Get status color and icon
  const getStatusInfo = (status) => {
    const statusMap = {
      reported: { color: 'text-red-600', bg: 'bg-red-50', Icon: AlertCircle },
      acknowledged: { color: 'text-yellow-600', bg: 'bg-yellow-50', Icon: Clock },
      'in-progress': { color: 'text-blue-600', bg: 'bg-blue-50', Icon: TrendingUp },
      resolved: { color: 'text-green-600', bg: 'bg-green-50', Icon: CheckCircle },
      rejected: { color: 'text-gray-600', bg: 'bg-gray-50', Icon: XCircle }
    };
    return statusMap[status] || statusMap.reported;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow">
        <div className="text-center text-red-600">
          <AlertCircle size={48} className="mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header with title and controls */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              {userRole === 'citizen' && 'Local Issues Heatmap'}
              {userRole === 'official' && 'Official Issues Dashboard Map'}
              {userRole === 'community' && 'Community Issues Overview'}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              {issues.length} issues displayed
            </p>
          </div>
          
          {/* View mode toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('heatmap')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'heatmap'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setViewMode('markers')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'markers'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Markers
            </button>
            <button
              onClick={() => setViewMode('clusters')}
              className={`px-4 py-2 rounded-lg transition-all ${
                viewMode === 'clusters'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'bg-blue-500 hover:bg-blue-400'
              }`}
            >
              Clusters
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Stats */}
      <div className="bg-gray-50 border-b p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="reported">Reported</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in-progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="pothole">Pothole</option>
              <option value="streetlight">Streetlight</option>
              <option value="graffiti">Graffiti</option>
              <option value="garbage">Garbage</option>
              <option value="water">Water</option>
              <option value="traffic">Traffic</option>
              <option value="parks">Parks</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              value={filters.priority}
              onChange={(e) => handleFilterChange('priority', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Locate Me Button */}
          <div className="flex items-end">
            <button
              onClick={locateUser}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <Navigation size={18} />
              Locate Me
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map(({ status, count }) => {
            const { color, bg, Icon } = getStatusInfo(status);
            return (
              <div key={status} className={`${bg} rounded-lg p-3`}>
                <div className="flex items-center gap-2">
                  <Icon className={`${color} w-5 h-5`} />
                  <div>
                    <p className="text-xs text-gray-600 capitalize">{status}</p>
                    <p className={`text-lg font-bold ${color}`}>{count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div style={{ height, position: 'relative' }}>
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <MapController center={mapCenter} zoom={mapZoom} />
          
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Heatmap Layer */}
          {viewMode === 'heatmap' && heatmapData.length > 0 && (
            <HeatmapLayerComponent
              points={heatmapData}
              options={{
                radius: 25,
                blur: 15,
                max: 1.0,
                gradient: {
                  0.0: 'blue',
                  0.5: 'lime',
                  0.7: 'yellow',
                  0.85: 'orange',
                  1.0: 'red'
                }
              }}
            />
          )}

          {/* Regular Markers */}
          {viewMode === 'markers' &&
            issues
              .filter(issue => issue.location?.lat && issue.location?.lng)
              .map((issue) => (
                <Marker
                  key={issue._id}
                  position={[issue.location.lat, issue.location.lng]}
                  icon={createCustomIcon(issue.status)}
                  eventHandlers={{
                    click: () => setSelectedIssue(issue),
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg mb-2">{issue.title}</h3>
                      <div className="space-y-1 text-sm">
                        <p className="text-gray-600">{issue.description?.substring(0, 100)}...</p>
                        <div className="flex gap-2 mt-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            issue.status === 'reported' ? 'bg-red-100 text-red-700' :
                            issue.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                            issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                            'bg-green-100 text-green-700'
                          }`}>
                            {issue.status}
                          </span>
                          <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {issue.category}
                          </span>
                        </div>
                        {issue.images && issue.images.length > 0 && (
                          <img 
                            src={issue.images[0]} 
                            alt="Issue" 
                            className="w-full h-24 object-cover rounded mt-2"
                          />
                        )}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* Clustered Markers */}
          {viewMode === 'clusters' && (
            <MarkerClusterGroup chunkedLoading>
              {issues
                .filter(issue => issue.location?.lat && issue.location?.lng)
                .map((issue) => (
                  <Marker
                    key={issue._id}
                    position={[issue.location.lat, issue.location.lng]}
                    icon={createCustomIcon(issue.status)}
                    eventHandlers={{
                      click: () => setSelectedIssue(issue),
                    }}
                  >
                    <Popup>
                      <div className="p-2 min-w-[200px]">
                        <h3 className="font-bold text-lg mb-2">{issue.title}</h3>
                        <div className="space-y-1 text-sm">
                          <p className="text-gray-600">{issue.description?.substring(0, 100)}...</p>
                          <div className="flex gap-2 mt-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              issue.status === 'reported' ? 'bg-red-100 text-red-700' :
                              issue.status === 'acknowledged' ? 'bg-yellow-100 text-yellow-700' :
                              issue.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {issue.status}
                            </span>
                            <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                              {issue.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
            </MarkerClusterGroup>
          )}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="bg-gray-50 p-4 border-t">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Legend</h3>
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>Reported</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>Acknowledged</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>Resolved</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-500 rounded-full"></div>
            <span>Rejected</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatmapViewer;
