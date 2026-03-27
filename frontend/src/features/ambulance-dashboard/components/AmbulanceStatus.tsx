import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Wifi } from 'lucide-react';
import { Ambulance } from '../types';
import { toast } from 'sonner';
import { SimulationModal } from '@/components/SimulationModal';

interface AmbulanceStatusProps {
  ambulance: Ambulance | null;
  isSimulating: boolean;
  onStartSimulation: () => void;
  onStopSimulation: () => void;
  onUpdateLocation: (lat: number, lng: number, heading: number, speed: number) => void;
}

export const AmbulanceStatus: React.FC<AmbulanceStatusProps> = ({
  ambulance,
  isSimulating,
  onStartSimulation,
  onStopSimulation,
  onUpdateLocation
}) => {
  const [showSimulation, setShowSimulation] = useState(false);

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          onUpdateLocation(
            position.coords.latitude,
            position.coords.longitude,
            position.coords.heading || 0,
            (position.coords.speed || 0) * 3.6
          );
          toast.success('Location updated successfully!');
        },
        () => { toast.error('Failed to get location. Please enable location access.'); },
        { enableHighAccuracy: true }
      );
    } else {
      toast.error('Geolocation not supported by this browser.');
    }
  };

  return (
    <div className="rounded-2xl p-5 space-y-5"
      style={{
        background: 'rgba(13,21,37,0.7)',
        border: '1px solid rgba(59,130,246,0.2)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <MapPin className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-semibold text-white text-sm">Current Location</span>
        </div>
        {/* Online indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <Wifi className="w-3 h-3 text-green-400" />
          <span className="text-xs font-medium text-green-400">ONLINE</span>
        </div>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Latitude', value: ambulance?.current_lat?.toFixed(6) ?? '—' },
          { label: 'Longitude', value: ambulance?.current_lng?.toFixed(6) ?? '—' },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl px-3 py-2.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs text-slate-500 mb-0.5">{label}</p>
            <p className="font-mono text-xs text-blue-300 truncate">{value}</p>
          </div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button size="sm" onClick={() => setShowSimulation(true)}
          className="flex-1 text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            border: 'none',
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
          }}>
          🚦 Traffic Sim
        </Button>
        <Button size="sm" variant="outline" onClick={handleShareLocation}
          className="flex-1 text-xs border-slate-600 text-slate-300 hover:text-white hover:bg-white/10">
          📍 Share Location
        </Button>
      </div>

      <SimulationModal open={showSimulation} onClose={() => setShowSimulation(false)} />
    </div>
  );
};