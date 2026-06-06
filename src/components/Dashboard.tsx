import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Diagnosis } from '../types';
import { Bug, AlertTriangle, Leaf, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Fix for default Leaflet marker icons in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom icons based on severity
const createCustomIcon = (color: string) => {
    return new L.DivIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: ${color}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.4);"></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });
};

const getSeverityColor = (severity: string) => {
    switch(severity.toLowerCase()) {
        case 'critical': return '#ef4444'; // red-500
        case 'high': return '#f97316'; // orange-500
        case 'medium': return '#eab308'; // yellow-500
        case 'low': return '#3b82f6'; // blue-500
        case 'none': return '#22c55e'; // green-500
        default: return '#6b7280'; // gray-500
    }
};

const RecenterAutomagically = ({ data }: { data: Diagnosis[] }) => {
    const map = useMap();
    useEffect(() => {
        if (data.length > 0) {
            // Find the most recent point (assuming last in array or largest timestamp)
            const latest = data[data.length - 1];
            if (latest.lat && latest.lng) {
                map.setView([latest.lat, latest.lng], map.getZoom(), {
                    animate: true,
                    duration: 1
                });
            }
        }
    }, [data, map]);
    return null;
};


export default function Dashboard({ diagnoses }: { diagnoses: Diagnosis[] }) {
  // Center roughly on US initially
  const center: [number, number] = [39.8283, -98.5795];

  return (
    <div className="h-full w-full relative h-[600px] flex flex-col">
       <div className="absolute top-4 left-4 z-[400] glass p-4 rounded-xl pointer-events-auto w-80 max-h-[90%] flex flex-col border-emerald-500/20">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-4 border-l-2 border-emerald-500 pl-2 flex items-center justify-between text-[#E4E4E7]">
                Live Detections
                <span className="font-mono text-[10px] text-emerald-500 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">{diagnoses.length} active</span>
            </h2>
            
            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {diagnoses.length === 0 ? (
                    <div className="text-xs text-zinc-500 italic py-4">No diagnoses recorded yet.</div>
                ) : (
                    [...diagnoses].reverse().slice(0, 5).map((d) => (
                        <div key={d.id} className="p-3 bg-white/5 rounded-lg border border-white/5 relative">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[10px] mono font-bold capitalize" style={{ color: getSeverityColor(d.severity) }}>
                                    {d.type}
                                </span>
                                <span className="text-[10px] text-zinc-500">{formatDistanceToNow(new Date(d.timestamp), { addSuffix: true })}</span>
                            </div>
                            <p className="text-xs font-semibold text-[#E4E4E7]">{d.disease}</p>
                            <p className="text-[10px] text-zinc-500 mt-1 truncate">Severity: {d.severity}</p>
                        </div>
                    ))
                )}
            </div>
       </div>

      <div className="flex-1 w-full z-0 relative">
        <MapContainer center={center} zoom={4} style={{ height: '100%', width: '100%', background: '#0A0A0C' }} zoomControl={false}>
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <RecenterAutomagically data={diagnoses} />
            
            {diagnoses.map((diagnosis) => (
                <Marker 
                    key={diagnosis.id} 
                    position={[diagnosis.lat, diagnosis.lng]}
                    icon={createCustomIcon(getSeverityColor(diagnosis.severity))}
                >
                    <Popup className="p-0 custom-popup">
                        <div className="p-4 w-60">
                            <div className="flex items-start justify-between mb-2">
                                <div className="font-semibold text-sm leading-tight text-[#E4E4E7]">
                                    {diagnosis.disease}
                                </div>
                                {diagnosis.severity.toLowerCase() === 'none' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 ml-2" />
                                )}
                            </div>
                            
                            <div className="flex gap-2 text-[10px] mono mb-3">
                                <span className="px-1.5 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/10 capitalize">
                                    {diagnosis.type}
                                </span>
                                <span className="px-1.5 py-0.5 rounded border capitalize font-bold" style={{ 
                                    borderColor: `${getSeverityColor(diagnosis.severity)}40`, 
                                    color: getSeverityColor(diagnosis.severity),
                                    backgroundColor: `${getSeverityColor(diagnosis.severity)}15`
                                }}>
                                    {diagnosis.severity}
                                </span>
                            </div>

                            <p className="text-[11px] text-zinc-300 mb-2 leading-relaxed">
                                {diagnosis.recommendation}
                            </p>
                            
                            <div className="text-[9px] text-zinc-500 border-t border-white/10 pt-2 mt-2">
                                {new Date(diagnosis.timestamp).toLocaleDateString()} {new Date(diagnosis.timestamp).toLocaleTimeString()}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
      </div>
    </div>
  );
}
