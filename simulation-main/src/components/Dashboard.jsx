import React, { useMemo } from 'react';

const PHASE_LABELS = {
  idle: { label: 'Standby', color: 'text-gray-400', bg: 'bg-gray-500/20', icon: '⏳' },
  to_patient: { label: 'En Route to Patient', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: '🚑' },
  pickup: { label: 'Patient Pickup', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: '🧑' },
  to_hospital: { label: 'En Route to Hospital', color: 'text-green-400', bg: 'bg-green-500/20', icon: '🏥' },
  arrived: { label: 'Delivered to Hospital', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: '✅' },
};

export default function Dashboard({ state, metrics, routes, isConnected, onCreateEmergency, onReset, loading, selectionInfo }) {
  const phaseInfo = PHASE_LABELS[state.phase] || PHASE_LABELS.idle;
  const corridorSignals = useMemo(() => (state.signals || []).filter(s => s.override_phase), [state.signals]);
  const etaDisplay = state.eta ? state.eta.display : '--';

  const displayMetrics = useMemo(() => {
    if (metrics.finalMetrics) return metrics.finalMetrics;
    return {
      normalTimeDisplay: metrics.normalTime > 0 ? formatSeconds(metrics.normalTime) : '--',
      optimizedTimeDisplay: metrics.optimizedTime > 0 ? formatSeconds(metrics.optimizedTime) : '--',
      timeSavedDisplay: metrics.timeSaved > 0 ? formatSeconds(metrics.timeSaved) : '--',
      percentage: metrics.normalTime > 0 ? `${Math.round((metrics.timeSaved / metrics.normalTime) * 100)}%` : '--',
    };
  }, [metrics]);

  const trafficStats = state.normalTrafficStats || {};

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-lg shadow-lg">🚑</div>
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">Mediroute AI</h1>
          <p className="text-[11px] text-white/40 font-medium tracking-wider uppercase">Smart Emergency Management</p>
        </div>
      </div>

      {/* Emergency / Stop / Reset Button */}
      {state.phase === 'idle' ? (
        <button id="create-emergency-btn" onClick={onCreateEmergency} disabled={loading}
          className="btn-emergency w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide animate-pulse-emergency cursor-pointer disabled:opacity-50 disabled:cursor-wait">
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> Calculating Routes...</>
            ) : (
              <><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg> CREATE EMERGENCY</>
            )}
          </span>
        </button>
      ) : state.phase === 'arrived' ? (
        <button id="reset-btn" onClick={onReset}
          className="w-full py-3.5 rounded-xl text-white font-bold text-sm tracking-wide cursor-pointer bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 transition-all hover:-translate-y-0.5 shadow-lg">
          🔄 RESET & NEW EMERGENCY
        </button>
      ) : (
        <button id="stop-emergency-btn" onClick={onReset}
          className="w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide cursor-pointer bg-gradient-to-r from-red-700 to-red-900 hover:from-red-600 hover:to-red-800 transition-all border border-red-500/30 shadow-lg">
          <span className="flex items-center justify-center gap-2">
            ⛔ STOP EMERGENCY
          </span>
        </button>
      )}

      {/* AI Selection Info */}
      {selectionInfo && (
        <div className="glass-light rounded-xl p-3 border border-blue-500/20 animate-fade-in">
          <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">AI Routing Decision</span>
          <div className="mt-2 space-y-1.5">
            {(selectionInfo.ambulanceOptions || []).slice(0, 4).map(a => (
              <div key={a.id} className={`flex items-center justify-between text-[11px] px-2 py-1 rounded ${a.selected ? 'bg-blue-500/15 text-blue-300 font-semibold' : 'text-white/35'}`}>
                <span className="flex items-center gap-1.5">
                  {a.selected ? <span className="text-blue-400">✓</span> : <span className="text-white/20">·</span>}
                  🚑 {a.label.replace('Ambulance ', 'Amb ')}
                </span>
                <span className="font-mono text-[10px]">{Math.round(a.duration / 60)}m · {(a.distance / 1000).toFixed(1)}km</span>
              </div>
            ))}
            <div className="border-t border-white/5 my-1"></div>
            {(selectionInfo.hospitalOptions || []).slice(0, 3).map(h => (
              <div key={h.id} className={`flex items-center justify-between text-[11px] px-2 py-1 rounded ${h.selected ? 'bg-green-500/15 text-green-300 font-semibold' : 'text-white/35'}`}>
                <span className="flex items-center gap-1.5">
                  {h.selected ? <span className="text-green-400">✓</span> : <span className="text-white/20">·</span>}
                  🏥 {h.label}
                </span>
                <span className="font-mono text-[10px]">{Math.round(h.duration / 60)}m</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Card */}
      <div className={`glass-light rounded-xl p-3.5 ${state.emergencyActive ? 'border border-white/10' : ''}`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Ambulance Status</span>
          <span className="text-lg">{phaseInfo.icon}</span>
        </div>
        <div className={`${phaseInfo.bg} ${phaseInfo.color} rounded-lg px-3 py-2 text-sm font-semibold text-center`}>{phaseInfo.label}</div>
        <div className="mt-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">ETA</span>
            <span className="text-sm font-mono font-semibold text-white/80">{etaDisplay}</span>
          </div>
          {state.routeProgress > 0 && state.phase !== 'idle' && state.phase !== 'arrived' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-white/40">Progress</span>
                <span className="text-xs font-mono text-white/60">{state.routeProgress}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-200"
                  style={{
                    width: `${state.routeProgress}%`,
                    background: state.phase === 'to_patient' ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : 'linear-gradient(90deg, #22c55e, #4ade80)',
                  }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Green Corridor */}
      {corridorSignals.length > 0 && (
        <div className="glass-light rounded-xl p-3.5 border border-green-500/20 corridor-active">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Green Corridor ETA Active</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {corridorSignals.map(sig => (
              <div key={sig.id} className="bg-green-500/15 text-green-400 text-[9px] font-semibold px-1.5 py-0.5 rounded">{sig.intersection_id}</div>
            ))}
          </div>
        </div>
      )}

      {/* Traffic Pulse - Normal Traffic Optimization */}
      <div className="glass-light rounded-xl p-3.5">
        <div className="flex items-center gap-2 mb-2.5">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Traffic Pulse</span>
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] text-cyan-400/60 ml-auto">All Traffic</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-white/30 uppercase">Avg Wait</div>
            <div className="metric-value text-sm text-yellow-400">{trafficStats.avgWaitAfter || 28}s</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-white/30 uppercase">Saved</div>
            <div className="metric-value text-sm text-cyan-400">{(trafficStats.avgWaitBefore || 45) - (trafficStats.avgWaitAfter || 28)}s</div>
          </div>
          <div className="bg-white/[0.03] rounded-lg px-2 py-1.5 text-center">
            <div className="text-[9px] text-white/30 uppercase">Faster</div>
            <div className="metric-value text-sm text-green-400">{trafficStats.throughputIncrease || 0}%</div>
          </div>
        </div>
        <p className="text-[10px] text-white/30 leading-relaxed">
          AI dynamically adjusts {(state.signals || []).length} signal timings based on real-time density.
          <span className="text-white/20"> View traffic on map →</span>
        </p>
      </div>

      {/* Emergency Performance */}
      <div className="glass-light rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white/50 uppercase tracking-wider">Emergency Performance</span>
          {state.phase === 'arrived' && <span className="text-[9px] font-bold text-green-400 bg-green-500/15 px-1.5 py-0.5 rounded">DONE</span>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="Normal" value={displayMetrics.normalTimeDisplay} color="text-red-400" />
          <MetricCard label="Optimized" value={displayMetrics.optimizedTimeDisplay} color="text-green-400" />
          <MetricCard label="Saved" value={displayMetrics.timeSavedDisplay} color="text-cyan-400" />
          <MetricCard label="Faster" value={displayMetrics.percentage} color="text-purple-400" />
        </div>
      </div>

      <div className="mt-auto pt-2 border-t border-white/5">
        <p className="text-[10px] text-white/20 text-center">Mediroute AI v2.0 • Hackathon Prototype</p>
      </div>
    </div>
  );
}

function MetricCard({ label, value, color }) {
  return (
    <div className="bg-white/[0.03] rounded-lg p-2 text-center">
      <div className="text-[9px] text-white/35 mb-0.5 uppercase tracking-wider">{label}</div>
      <div className={`metric-value text-sm ${color}`}>{value}</div>
    </div>
  );
}

function formatSeconds(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}
