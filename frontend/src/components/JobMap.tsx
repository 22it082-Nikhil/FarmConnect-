import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';
import { Truck, Users, Wrench, MapPin } from 'lucide-react';

// Fix for default Leaflet marker icon not showing
const customIcon = new Icon({
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Known city coordinates for fallback (Central India focus)
const CITY_COORDS: { [key: string]: [number, number] } = {
    'nagpur': [21.1458, 79.0882],
    'mumbai': [19.0760, 72.8777],
    'pune': [18.5204, 73.8567],
    'nashik': [19.9975, 73.7898],
    'aurangabad': [19.8762, 75.3433],
    'amravati': [20.9320, 77.7523],
    'bhopal': [23.2599, 77.4126],
    'indore': [22.7196, 75.8577],
    'delhi': [28.6139, 77.2090],
    'bangalore': [12.9716, 77.5946],
    'hyderabad': [17.3850, 78.4867]
};

const DEFAULT_CENTER: [number, number] = [21.1458, 79.0882]; // Nagpur (Central India)

interface JobMapProps {
    jobs: any[];
}

const JobMap = ({ jobs }: JobMapProps) => {
    return (
        <div className="h-[500px] w-full rounded-xl overflow-hidden shadow-lg border border-gray-200 z-0 relative">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />

                {jobs.map((job) => {
                    let position: [number, number] = DEFAULT_CENTER;
                    let isExact = false;

                    // 1. Try Exact Coordinates
                    if (job.coordinates?.lat && job.coordinates?.lng) {
                        position = [job.coordinates.lat, job.coordinates.lng];
                        isExact = true;
                    }
                    // 2. Try City Lookup from Location String
                    else if (job.location) {
                        const cityKey = job.location.toLowerCase().split(',')[0].trim();
                        // Check if any key exists in the cityKey string (e.g. "Nagpur" in "Nagpur, MH")
                        const foundCity = Object.keys(CITY_COORDS).find(k => cityKey.includes(k));

                        if (foundCity) {
                            const baseParams = CITY_COORDS[foundCity];
                            // Add random offset to prevent stacking (approx 5-10km radius)
                            // Seed random based on ID so it stays consistent across renders
                            const seed = job._id.charCodeAt(job._id.length - 1);
                            const latOffset = (Math.sin(seed) * 0.05);
                            const lngOffset = (Math.cos(seed) * 0.05);
                            position = [baseParams[0] + latOffset, baseParams[1] + lngOffset];
                        } else {
                            // Fallback: Use center + larger random scatter if city unknown
                            const seed = job._id.charCodeAt(job._id.length - 1);
                            position = [DEFAULT_CENTER[0] + (Math.sin(seed) * 2), DEFAULT_CENTER[1] + (Math.cos(seed) * 2)];
                        }
                    }

                    return (
                        <Marker
                            key={job._id}
                            position={position}
                            icon={customIcon}
                        >
                            <Popup>
                                <div className="p-2 min-w-[200px]">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <span className={`p-1.5 rounded-lg ${job.type === 'Vehicle' ? 'bg-blue-100 text-blue-600' :
                                                job.type === 'Manpower' ? 'bg-green-100 text-green-600' :
                                                    'bg-orange-100 text-orange-600'
                                            }`}>
                                            {job.type === 'Vehicle' ? <Truck className="w-4 h-4" /> :
                                                job.type === 'Manpower' ? <Users className="w-4 h-4" /> :
                                                    <Wrench className="w-4 h-4" />}
                                        </span>
                                        <h3 className="font-bold text-gray-900">{job.type} Request</h3>
                                    </div>

                                    <p className="text-sm text-gray-600 mb-1 line-clamp-2">{job.description}</p>

                                    <div className="flex items-center text-xs text-gray-500 mb-2">
                                        <MapPin className="w-3 h-3 mr-1" />
                                        {job.location} {isExact ? '(Exact)' : '(Approx)'}
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                                        <span className="font-bold text-green-600">{job.budget || 'Negotiable'}</span>
                                        <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
                                            View details
                                        </button>
                                    </div>
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
};

export default JobMap;
