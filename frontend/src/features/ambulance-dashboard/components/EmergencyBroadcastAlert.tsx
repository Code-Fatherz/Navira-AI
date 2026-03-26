import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EmergencyBroadcastAlertProps {
  message: string;
  onClose: () => void;
}

export const EmergencyBroadcastAlert: React.FC<EmergencyBroadcastAlertProps> = ({
  message,
  onClose
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.transform = 'translateY(-100%)';
      ref.current.style.opacity = '0';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (ref.current) {
            ref.current.style.transition = 'transform 0.45s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease';
            ref.current.style.transform = 'translateY(0)';
            ref.current.style.opacity = '1';
          }
        });
      });
    }
  }, []);

  return (
    <div ref={ref} className="fixed top-0 left-0 right-0 z-[9998]"
      style={{ willChange: 'transform, opacity' }}>
      <div className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(90deg, #7f1d1d 0%, #991b1b 40%, #b91c1c 60%, #991b1b 100%)',
          borderBottom: '2px solid rgba(239,68,68,0.6)',
          boxShadow: '0 4px 40px rgba(239,68,68,0.5)'
        }}>
        {/* Animated shine strip */}
        <div className="absolute inset-0 opacity-20"
          style={{
            background: 'repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(255,255,255,0.15) 40px, rgba(255,255,255,0.15) 41px)',
            animation: 'slide 3s linear infinite'
          }} />

        <div className="relative container mx-auto px-4 py-3 flex items-center gap-4">
          {/* Siren icons */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xl animate-bounce" style={{ animationDuration: '0.6s' }}>🚨</span>
            <span className="text-xl animate-bounce" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }}>🔔</span>
          </div>

          {/* Text */}
          <div className="flex-1 min-w-0">
            <p className="font-black text-white text-xs tracking-[0.2em] uppercase mb-0.5">
              ⚡ Emergency Broadcast
            </p>
            <p className="text-red-100 text-sm font-medium truncate">{message}</p>
          </div>

          {/* Dismiss */}
          <Button size="sm" variant="ghost" onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10 shrink-0 rounded-lg">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <style>{`
        @keyframes slide {
          from { background-position-x: 0; }
          to { background-position-x: 82px; }
        }
      `}</style>
    </div>
  );
};