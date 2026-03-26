import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAmbulance } from '@/hooks/useAmbulance';
import { useTrafficSignals } from '@/hooks/useTrafficSignals';
import { useEmergencyTokens } from '@/hooks/useEmergencyTokens';
import { useHospitals } from '@/hooks/useHospitals';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, LogOut, Lock, Siren, Activity } from 'lucide-react';
import MediBot from '@/components/medibot';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

// Feature components
import { EmergencyBroadcastAlert } from '../features/ambulance-dashboard/components/EmergencyBroadcastAlert';
import { EmergencyTokenDisplay } from '../features/ambulance-dashboard/components/EmergencyTokenDisplay';
import { EmergencyCreationForm } from '../features/ambulance-dashboard/components/EmergencyCreationForm';
import { AmbulanceStatus } from '../features/ambulance-dashboard/components/AmbulanceStatus';
import { VehicleHealth } from '../features/ambulance-dashboard/components/VehicleHealth';
import { AmbulanceMap } from '../features/ambulance-dashboard/components/AmbulanceMap';

// Feature hooks
import { useGeolocation } from '../features/ambulance-dashboard/hooks/useGeolocation';
import { useEmergencyBroadcast } from '../features/ambulance-dashboard/hooks/useEmergencyBroadcast';

// Types
import { PickupLocation, EmergencyType } from '../features/ambulance-dashboard/types';

export default function AmbulanceDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { ambulance, loading: ambLoading, updateLocation, isSimulating, startSimulation, stopSimulation } = useAmbulance();
  const { signals, checkSignalsForAmbulance } = useTrafficSignals();
  const { hospitals } = useHospitals();
  const [clock, setClock] = useState(new Date());

  const {
    activeToken,
    createToken,
    startJourney,
    arrivedAtPatient,
    startToHospital,
    completeEmergency,
    cancelEmergency
  } = useEmergencyTokens();

  // Feature hooks
  const { emergencyBroadcast, showBroadcast, setShowBroadcast } = useEmergencyBroadcast();
  const { watchId } = useGeolocation(ambulance, activeToken?.status, updateLocation);

  // Emergency creation state
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [pickupLocation, setPickupLocation] = useState<PickupLocation | null>(null);
  const [isCreatingToken, setIsCreatingToken] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Check dashboard lock
  useEffect(() => {
    const checkLock = async () => {
      const { data } = await supabase
        .from('dashboard_locks')
        .select('is_locked')
        .eq('dashboard_type', 'ambulance')
        .single();

      if (data?.is_locked) {
        setIsLocked(true);
      }
    };

    checkLock();

    const subscription = supabase
      .channel('ambulance_lock')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'dashboard_locks',
        filter: 'dashboard_type=eq.ambulance'
      }, (payload: any) => {
        setIsLocked(payload.new?.is_locked || false);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Check signals when ambulance moves during active journey
  useEffect(() => {
    if (ambulance && (activeToken?.status === 'in_progress' || activeToken?.status === 'to_hospital')) {
      checkSignalsForAmbulance(ambulance);
    }
  }, [ambulance?.current_lat, ambulance?.current_lng, activeToken?.status]);

  // Simulated movement
  useEffect(() => {
    if (!isSimulating || !ambulance) return;

    const interval = setInterval(() => {
      const newLat = ambulance.current_lat + (Math.random() - 0.3) * 0.001;
      const newLng = ambulance.current_lng + (Math.random() - 0.3) * 0.001;
      const heading = Math.random() * 360;
      const speed = 40 + Math.random() * 30;
      updateLocation(newLat, newLng, heading, speed);
    }, 2000);

    return () => clearInterval(interval);
  }, [isSimulating, ambulance]);

  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setPickupLocation({ lat, lng, address });
    setShowLocationPicker(false);
    toast.success('Location selected on map');
  };

  const handleCreateToken = async (location: PickupLocation, emergencyType: string, customType?: string) => {
    if (!ambulance) {
      toast.error('Ambulance not available');
      return;
    }

    setIsCreatingToken(true);
    try {
      const token = await createToken(
        ambulance.id,
        location.lat,
        location.lng,
        location.address,
        ambulance.current_lat,
        ambulance.current_lng
      );

      if (token) {
        const displayType = emergencyType === 'custom' ? customType : emergencyType;
        toast.success(`Emergency Created: ${token.token_code}`, {
          description: `${displayType}`
        });
        setShowLocationPicker(false);
        setPickupLocation(null);
      } else {
        toast.error('Failed to create emergency token');
      }
    } catch (error) {
      console.error('Token creation error:', error);
      toast.error('Failed to create emergency token');
    } finally {
      setIsCreatingToken(false);
    }
  };

  const handleStartJourney = async () => {
    if (!activeToken) return;
    const success = await startJourney(activeToken.id);
    if (success) {
      toast.success('Journey Started!', {
        description: 'Heading to patient location. Green corridor is now active.'
      });
    }
  };

  const handleArrivedAtPatient = async () => {
    if (!activeToken) return;
    const success = await arrivedAtPatient(activeToken.id);
    if (success) {
      toast.success('Arrived at Patient Location!', {
        description: 'Patient pickup confirmed.'
      });
    }
  };

  const handleStartToHospital = async () => {
    if (!activeToken) return;
    const success = await startToHospital(activeToken.id);
    if (success) {
      toast.success('Heading to Hospital!', {
        description: 'Green corridor active for hospital route.'
      });
    }
  };

  const handleCompleteEmergency = async () => {
    if (!activeToken || !ambulance) return;
    const success = await completeEmergency(activeToken.id, ambulance.id);
    if (success) {
      toast.success('Arrived at Hospital - Emergency Completed!');
    }
  };

  const handleCancelEmergency = async () => {
    if (!activeToken || !ambulance) return;
    const success = await cancelEmergency(activeToken.id, ambulance.id);
    if (success) {
      toast.info('Emergency Cancelled');
    }
  };

  if (authLoading || ambLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1525 50%, #0a0e1a 100%)' }}>
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
            <div className="absolute inset-3 rounded-full border-4 border-blue-500/20 border-b-blue-500 animate-spin"
              style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
            <div className="absolute inset-6 rounded-full bg-red-500/20 animate-pulse" />
          </div>
          <div>
            <p className="text-white font-semibold text-lg tracking-wide">Loading Dashboard</p>
            <p className="text-slate-400 text-sm mt-1 animate-pulse">Connecting to dispatch...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #1a0505 50%, #0a0e1a 100%)' }}>
        <div className="text-center space-y-6 p-8 rounded-2xl"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(239,68,68,0.3)', backdropFilter: 'blur(20px)' }}>
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto animate-pulse">
            <Lock className="w-10 h-10 text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Locked</h1>
            <p className="text-slate-400 mt-2">This dashboard has been locked by an administrator.</p>
          </div>
          <Button onClick={signOut}
            className="bg-red-600 hover:bg-red-700 text-white px-8">
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  const hasActiveEmergency = !!activeToken;

  const getCurrentRoute = () => {
    if (activeToken?.status === 'to_hospital') {
      return activeToken?.route_to_hospital;
    }
    if (activeToken?.route_to_patient) {
      return activeToken.route_to_patient;
    }
    return activeToken?.selected_route || null;
  };

  const mapMarkers = [
    ...(ambulance ? [{
      position: [ambulance.current_lat, ambulance.current_lng] as [number, number],
      popup: `Ambulance ${ambulance.vehicle_number}`,
      icon: 'ambulance' as const
    }] : []),
    ...signals.map(signal => ({
      position: [signal.location_lat, signal.location_lng] as [number, number],
      popup: signal.signal_name,
      icon: 'signal' as const
    })),
    ...hospitals.map(hospital => ({
      position: [hospital.location_lat, hospital.location_lng] as [number, number],
      popup: hospital.organization_name,
      icon: 'hospital' as const
    })),
    ...(activeToken?.pickup_lat && activeToken?.pickup_lng ? [{
      position: [activeToken.pickup_lat, activeToken.pickup_lng] as [number, number],
      popup: 'Patient Pickup',
      icon: 'signal' as const
    }] : []),
    ...(activeToken?.hospital_lat && activeToken?.hospital_lng ? [{
      position: [activeToken.hospital_lat, activeToken.hospital_lng] as [number, number],
      popup: activeToken.hospital_name || 'Hospital',
      icon: 'hospital' as const
    }] : [])
  ];

  const emergencyCreationMarkers = [
    ...(ambulance ? [{
      position: [ambulance.current_lat, ambulance.current_lng] as [number, number],
      popup: `Ambulance ${ambulance.vehicle_number}`,
      icon: 'ambulance' as const
    }] : []),
    ...hospitals.map(hospital => ({
      position: [hospital.location_lat, hospital.location_lng] as [number, number],
      popup: hospital.organization_name,
      icon: 'hospital' as const
    })),
    ...(pickupLocation ? [{
      position: [pickupLocation.lat, pickupLocation.lng] as [number, number],
      popup: 'Patient Pickup Location',
      icon: 'signal' as const,
      highlighted: true
    }] : [])
  ];

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: 'var(--gradient-hero)' }}>

      {/* Animated background orbs matching login page */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-primary/8 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] w-80 h-80 rounded-full bg-accent/8 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        {hasActiveEmergency && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-emergency/5 blur-[100px] animate-pulse" style={{ animationDuration: '2s' }} />
        )}
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(185 100% 50% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Emergency Broadcast Alert */}
      {showBroadcast && emergencyBroadcast && (
        <EmergencyBroadcastAlert
          message={emergencyBroadcast}
          onClose={() => setShowBroadcast(false)}
        />
      )}

      {/* Premium Navbar */}
      <nav className="relative z-20 sticky top-0 border-b border-border/30"
        style={{
          background: hasActiveEmergency
            ? 'hsl(var(--emergency) / 0.12)'
            : 'hsl(var(--card) / 0.65)',
          backdropFilter: 'blur(24px)',
          borderBottomColor: hasActiveEmergency
            ? 'hsl(var(--emergency) / 0.35)'
            : undefined,
          boxShadow: hasActiveEmergency
            ? '0 0 30px hsl(var(--emergency) / 0.15)'
            : '0 4px 24px rgba(0,0,0,0.4)'
        }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          {/* Left: Identity */}
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-9 h-9 rounded-xl
              ${hasActiveEmergency ? 'bg-red-500/20' : 'bg-blue-500/10'}
              border ${hasActiveEmergency ? 'border-red-500/40' : 'border-blue-500/20'}`}>
              {hasActiveEmergency
                ? <Siren className="w-5 h-5 text-red-400 animate-pulse" />
                : <Activity className="w-5 h-5 text-blue-400" />}
              {hasActiveEmergency && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm tracking-wide">Ambulance Dashboard</span>
                {ambulance?.vehicle_number && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-mono"
                    style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
                    {ambulance.vehicle_number}
                  </span>
                )}
              </div>
              {hasActiveEmergency && (
                <p className="text-xs text-red-400 animate-pulse font-medium mt-0.5">🚨 ACTIVE EMERGENCY IN PROGRESS</p>
              )}
            </div>
          </div>

          {/* Right: User + Clock + Actions */}
          <div className="flex items-center gap-3">
            {/* Live Clock */}
            <div className="hidden md:flex flex-col items-end">
              <span className="font-mono text-xs text-white/80 tabular-nums">
                {clock.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-xs text-slate-500">
                {clock.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
              </span>
            </div>

            {/* Driver badge */}
            {profile?.full_name && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-slate-300 font-medium">{profile.full_name}</span>
              </div>
            )}

            <Button variant="ghost" size="sm" onClick={() => navigate('/')}
              className="text-slate-400 hover:text-white hover:bg-white/10 hidden sm:inline-flex text-xs">
              Home
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut}
              className="text-slate-400 hover:text-red-400 hover:bg-red-500/10">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2 text-xs">Sign Out</span>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">

        {/* MediBot */}
        <div className="fixed bottom-6 right-6 z-[9999]">
          <MediBot />
        </div>

        {/* Active Emergency Token */}
        {hasActiveEmergency && (
          <EmergencyTokenDisplay
            activeToken={activeToken}
            ambulance={ambulance}
            onStartJourney={handleStartJourney}
            onArrivedAtPatient={handleArrivedAtPatient}
            onStartToHospital={handleStartToHospital}
            onCompleteEmergency={handleCompleteEmergency}
            onCancelEmergency={handleCancelEmergency}
          />
        )}

        {/* Create New Emergency */}
        {!hasActiveEmergency && (
          <EmergencyCreationForm
            onCreateToken={handleCreateToken}
            onCancel={() => {
              setShowLocationPicker(false);
              setPickupLocation(null);
            }}
            isCreating={isCreatingToken}
            onEnableMapSelection={() => setShowLocationPicker(true)}
            pickupLocation={pickupLocation}
          />
        )}

        {/* Status grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-4">
            <AmbulanceStatus
              ambulance={ambulance}
              isSimulating={isSimulating}
              onStartSimulation={startSimulation}
              onStopSimulation={stopSimulation}
              onUpdateLocation={updateLocation}
            />
            <VehicleHealth ambulance={ambulance} />
          </div>

          <AmbulanceMap
            ambulance={ambulance}
            showLocationPicker={showLocationPicker}
            pickupLocation={pickupLocation}
            mapMarkers={showLocationPicker ? emergencyCreationMarkers : mapMarkers}
            currentRoute={getCurrentRoute()}
            onLocationSelect={showLocationPicker ? handleLocationSelect : undefined}
            onLocationUpdate={(lat, lng) => updateLocation(lat, lng, 0, 0)}
          />
        </div>
      </div>
    </div>
  );
}