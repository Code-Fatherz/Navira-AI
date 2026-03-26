import React from 'react';
import { Button } from '@/components/ui/button';
import { Ticket, User, Building2, Play, CheckCircle, X, Ambulance } from 'lucide-react';
import { openGoogleMaps } from '../services/locationService';
import { Ambulance as AmbulanceType } from '../types';

interface EmergencyTokenDisplayProps {
  activeToken: any;
  ambulance: AmbulanceType | null;
  onStartJourney: () => void;
  onArrivedAtPatient: () => void;
  onStartToHospital: () => void;
  onCompleteEmergency: () => void;
  onCancelEmergency: () => void;
}

const STEPS = [
  { key: 'dispatch', label: 'Dispatched', icon: Ambulance },
  { key: 'patient', label: 'At Patient', icon: User },
  { key: 'hospital', label: 'Hospital', icon: Building2 },
];

function getStepIndex(status: string) {
  if (status === 'pending' || status === 'assigned' || status === 'route_selected') return 0;
  if (status === 'in_progress') return 1;
  if (status === 'at_patient') return 1;
  if (status === 'to_hospital') return 2;
  return 0;
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    pending: { label: '⏳ PENDING', color: '#fbbf24', bg: 'rgba(251,191,36,0.08)', border: 'rgba(251,191,36,0.3)' },
    assigned: { label: '✓ ACCEPTED', color: '#60a5fa', bg: 'rgba(96,165,250,0.08)', border: 'rgba(96,165,250,0.3)' },
    route_selected: { label: '✓ ROUTE READY', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.3)' },
    in_progress: { label: '🚑 EN ROUTE', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.4)' },
    at_patient: { label: '✅ AT PATIENT', color: '#34d399', bg: 'rgba(52,211,153,0.08)', border: 'rgba(52,211,153,0.3)' },
    to_hospital: { label: '🏥 TO HOSPITAL', color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.4)' },
  };
  const s = map[status] || { label: status.toUpperCase(), color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', border: 'rgba(148,163,184,0.3)' };
  return (
    <span className="text-xs font-bold px-3 py-1.5 rounded-full"
      style={{ color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

export const EmergencyTokenDisplay: React.FC<EmergencyTokenDisplayProps> = ({
  activeToken, ambulance,
  onStartJourney, onArrivedAtPatient, onStartToHospital, onCompleteEmergency, onCancelEmergency
}) => {
  const isPendingAssignment = activeToken?.status === 'pending';
  const isAccepted = activeToken?.status === 'assigned';
  const hasRouteSelected = activeToken?.status === 'route_selected';
  const isGoingToPatient = activeToken?.status === 'in_progress';
  const isAtPatient = activeToken?.status === 'at_patient';
  const isGoingToHospital = activeToken?.status === 'to_hospital';

  const showNavToPatient = activeToken?.status === 'route_selected' || activeToken?.status === 'in_progress';
  const showNavToHospital = activeToken?.status === 'at_patient' || activeToken?.status === 'to_hospital';

  const activeStep = getStepIndex(activeToken?.status);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(13,21,37,0.75)',
        border: '1px solid rgba(239,68,68,0.35)',
        backdropFilter: 'blur(24px)',
        boxShadow: '0 0 40px rgba(239,68,68,0.12), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
      }}>
      {/* Top accent bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316, #ef4444)' }} />

      <div className="p-5 space-y-5">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)' }}>
              <Ticket className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-widest">Emergency Token</p>
              <p className="font-black text-2xl text-white font-mono tracking-wider"
                style={{ textShadow: '0 0 20px rgba(239,68,68,0.5)' }}>
                {activeToken.token_code}
              </p>
            </div>
          </div>
          <StatusPill status={activeToken.status} />
        </div>

        {/* Journey Step Timeline */}
        <div className="rounded-xl p-4"
          style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Journey Progress</p>
          <div className="flex items-center gap-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i < activeStep;
              const active = i === activeStep;
              return (
                <React.Fragment key={step.key}>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500
                      ${active ? 'ring-2 ring-offset-2 ring-offset-transparent' : ''}`}
                      style={{
                        background: done ? 'rgba(34,197,94,0.2)' : active ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `2px solid ${done ? '#22c55e' : active ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                        boxShadow: active ? '0 0 16px rgba(239,68,68,0.5)' : done ? '0 0 12px rgba(34,197,94,0.3)' : 'none',
                        ringColor: active ? '#ef4444' : undefined
                      }}>
                      {done
                        ? <CheckCircle className="w-5 h-5 text-green-400" />
                        : <Icon className="w-4 h-4" style={{ color: active ? '#f87171' : '#475569' }} />}
                    </div>
                    <span className="text-[10px] font-medium text-center"
                      style={{ color: done ? '#4ade80' : active ? '#f87171' : '#475569' }}>
                      {step.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className="flex-1 h-0.5 mb-5 mx-1 rounded-full transition-all duration-700"
                      style={{ background: done ? 'linear-gradient(90deg,#22c55e,#16a34a)' : 'rgba(255,255,255,0.07)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Location cards */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-xl p-3.5"
            style={{
              background: isGoingToPatient ? 'rgba(239,68,68,0.08)' : isAtPatient || isGoingToHospital ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isGoingToPatient ? 'rgba(239,68,68,0.3)' : isAtPatient || isGoingToHospital ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`
            }}>
            <div className="flex items-center gap-1.5 mb-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs text-slate-400">Patient Location</span>
              {(isAtPatient || isGoingToHospital) && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }}>
                  ✓ Picked Up
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-white line-clamp-2">
              {activeToken.pickup_address || `${activeToken.pickup_lat?.toFixed(4)}, ${activeToken.pickup_lng?.toFixed(4)}`}
            </p>
            {activeToken.route_to_patient && (
              <p className="text-xs text-slate-500 mt-1">
                {((activeToken.route_to_patient_distance_meters || 0) / 1000).toFixed(1)} km •{' '}
                {Math.floor((activeToken.route_to_patient_duration_seconds || 0) / 60)} min
              </p>
            )}
          </div>

          {activeToken.hospital_name && (
            <div className="rounded-xl p-3.5"
              style={{
                background: isGoingToHospital ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isGoingToHospital ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`
              }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs text-slate-400">Destination Hospital</span>
              </div>
              <p className="text-sm font-medium text-white">{activeToken.hospital_name}</p>
              {activeToken.route_to_hospital && (
                <p className="text-xs text-slate-500 mt-1">
                  {((activeToken.route_to_hospital_distance_meters || 0) / 1000).toFixed(1)} km •{' '}
                  {Math.floor((activeToken.route_to_hospital_duration_seconds || 0) / 60)} min
                </p>
              )}
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {(showNavToPatient && activeToken.route_to_patient) && (
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <div>
              <p className="font-semibold text-blue-300 text-sm">🚑 Route to Patient</p>
              <p className="text-xs text-blue-400/60 mt-0.5">{activeToken.pickup_address}</p>
            </div>
            <Button size="sm"
              onClick={() => openGoogleMaps(activeToken.route_to_patient,
                { lat: ambulance?.current_lat || 0, lng: ambulance?.current_lng || 0 },
                { lat: activeToken.pickup_lat, lng: activeToken.pickup_lng })}
              style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', border: 'none', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
              Navigate
            </Button>
          </div>
        )}

        {(showNavToHospital && activeToken.route_to_hospital) && (
          <div className="rounded-xl p-4 flex items-center justify-between"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <div>
              <p className="font-semibold text-green-300 text-sm">🏥 Route to Hospital</p>
              <p className="text-xs text-green-400/60 mt-0.5">{activeToken.hospital_name}</p>
            </div>
            <Button size="sm"
              onClick={() => openGoogleMaps(activeToken.route_to_hospital,
                { lat: activeToken.pickup_lat, lng: activeToken.pickup_lng },
                { lat: activeToken.hospital_lat || 0, lng: activeToken.hospital_lng || 0 })}
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', border: 'none', boxShadow: '0 4px 12px rgba(34,197,94,0.3)' }}>
              Navigate
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2">
          {hasRouteSelected && (
            <button onClick={onStartJourney}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
              <Play className="w-4 h-4" />
              START JOURNEY TO PATIENT
            </button>
          )}
          {isGoingToPatient && (
            <button onClick={onArrivedAtPatient}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
              <CheckCircle className="w-4 h-4" />
              ARRIVED AT PATIENT
            </button>
          )}
          {isAtPatient && (
            <button onClick={onStartToHospital}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', boxShadow: '0 4px 20px rgba(239,68,68,0.4)' }}>
              <Play className="w-4 h-4" />
              START TO HOSPITAL
            </button>
          )}
          {isGoingToHospital && (
            <button onClick={onCompleteEmergency}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}>
              <CheckCircle className="w-4 h-4" />
              ARRIVED AT HOSPITAL
            </button>
          )}
          <button onClick={onCancelEmergency}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium text-slate-400 text-sm border border-slate-700 hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/08 transition-all">
            <X className="w-4 h-4" />
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};