import React from 'react';
import { Activity } from 'lucide-react';
import { Ambulance } from '../types';

interface VehicleHealthProps {
  ambulance: Ambulance | null;
}

function HealthBar({ label, value, colorFn }: {
  label: string;
  value: number;
  colorFn: (v: number) => string;
}) {
  const color = colorFn(value);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="font-semibold tabular-nums" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${value}%`,
            background: `linear-gradient(90deg, ${color}99, ${color})`,
            boxShadow: `0 0 8px ${color}80`
          }} />
      </div>
    </div>
  );
}

const fuelColor = (v: number) => v < 20 ? '#ef4444' : v < 40 ? '#f59e0b' : '#22c55e';
const battColor = (v: number) => v < 20 ? '#ef4444' : v < 40 ? '#f59e0b' : '#3b82f6';
const o2Color = (v: number) => v < 30 ? '#ef4444' : '#06b6d4';

export const VehicleHealth: React.FC<VehicleHealthProps> = ({ ambulance }) => {
  const fuel = ambulance?.vehicle_health?.fuel_percent ?? 70;
  const battery = ambulance?.vehicle_health?.battery_percent ?? 85;
  const oxygen = ambulance?.vehicle_health?.oxygen_percent ?? 60;
  const tyres = ambulance?.vehicle_health?.tyres;

  const tyreData = [
    { label: 'FL', pos: 'Front Left', value: tyres?.front_left ?? 32 },
    { label: 'FR', pos: 'Front Right', value: tyres?.front_right ?? 31 },
    { label: 'RL', pos: 'Rear Left', value: tyres?.rear_left ?? 33 },
    { label: 'RR', pos: 'Rear Right', value: tyres?.rear_right ?? 32 },
  ];

  return (
    <div className="rounded-2xl p-5 space-y-5"
      style={{
        background: 'rgba(13,21,37,0.7)',
        border: '1px solid rgba(59,130,246,0.15)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <span className="text-sm">🚑</span>
          </div>
          <span className="font-semibold text-white text-sm">Vehicle Health</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
          <Activity className="w-3 h-3 text-green-400" />
          <span className="text-[10px] font-bold text-green-400 tracking-widest">REAL-TIME</span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        </div>
      </div>

      {/* Health Bars */}
      <div className="space-y-4">
        <HealthBar label="⛽ Fuel Level" value={fuel} colorFn={fuelColor} />
        <HealthBar label="🔋 Battery" value={battery} colorFn={battColor} />
        <HealthBar label="🫁 Oxygen Cylinder" value={oxygen} colorFn={o2Color} />
      </div>

      {/* Tyre Pressure */}
      <div>
        <p className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1">
          🛞 <span>Tyre Pressure (PSI)</span>
        </p>
        <div className="grid grid-cols-2 gap-2">
          {tyreData.map(({ label, pos, value }) => {
            const ok = value >= 28 && value <= 36;
            const color = ok ? '#22c55e' : '#ef4444';
            return (
              <div key={label} className="rounded-xl px-3 py-2.5 flex items-center justify-between"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${ok ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.25)'}`,
                }}>
                <div>
                  <p className="text-xs text-slate-500">{pos}</p>
                  <p className="text-xs font-bold text-white">{label}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums" style={{ color }}>{value}</p>
                  <p className="text-[10px] text-slate-500">PSI</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};