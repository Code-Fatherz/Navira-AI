import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAmbulanceRealtime } from '@/hooks/useAmbulanceRealtime';
import { useTrafficSignals } from '@/hooks/useTrafficSignals';
import { useEmergencyTokens, RouteData } from '@/hooks/useEmergencyTokens';
import { useHospitals, Hospital } from '@/hooks/useHospitals';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Building2, 
  MapPin, 
  LogOut, 
  Navigation, 
  AlertTriangle, 
  Radio,
  LayoutDashboard,
  Ambulance,
  FileText,
  Map as MapIcon,
  Clock,
  RefreshCw,
  Eye,
  Ticket,
  Route,
  User,
  XCircle,
  Phone,
  Plus,
  Unlock,
  Settings,
  Bed,
  Activity,
  Heart,
  Bell,
  X,
  Lock
} from 'lucide-react';
import Map from '@/components/Map';
import TwoLegRouteMap from '@/components/TwoLegRouteMap';
import HospitalEmergencyCreator from '@/components/HospitalEmergencyCreator';
import EmergencyDisplay from '@/components/EmergencyDisplay';
import AmbulanceFleetManagement from '@/components/AmbulanceFleetManagement';
import { toast } from 'sonner';

type NavItem = 'dashboard' | 'ambulances' | 'tokens' | 'livemap' | 'create-emergency' | 'hospitals' | 'network';

export default function HospitalDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const { ambulances, activeEmergencies, loading: ambLoading } = useAmbulanceRealtime();
  const { signals } = useTrafficSignals();
  const { pendingTokens, assignedTokens, activeTokens, assignHospitalWithRoutes, declineEmergency, createHospitalEmergency, releaseAmbulance } = useEmergencyTokens();
  const { hospitals, loading: hospitalsLoading } = useHospitals();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard');
  const [selectedTokenForRoute, setSelectedTokenForRoute] = useState<string | null>(null);
  const [selectedTokenForDisplay, setSelectedTokenForDisplay] = useState<string | null>(null);
  const [declineTokenId, setDeclineTokenId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [showAddHospital, setShowAddHospital] = useState(false);
  
  // Emergency broadcast state
  const [emergencyBroadcast, setEmergencyBroadcast] = useState<string | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [hospitalForm, setHospitalForm] = useState({
    name: '',
    address: '',
    region: '',
    latitude: '',
    longitude: ''
  });
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedAmbulanceId, setSelectedAmbulanceId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const navItems = [
    { id: 'dashboard' as NavItem, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'network' as NavItem, icon: Activity, label: 'Hospital Network' },
    { id: 'create-emergency' as NavItem, icon: Phone, label: 'Create Emergency' },
    { id: 'tokens' as NavItem, icon: Ticket, label: `Tokens (${pendingTokens.length + assignedTokens.length})` },
    { id: 'ambulances' as NavItem, icon: Ambulance, label: 'Ambulances' },
    { id: 'hospitals' as NavItem, icon: Building2, label: 'Hospital Management' },
    { id: 'livemap' as NavItem, icon: MapIcon, label: 'Live Map' },
  ];

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
        .eq('dashboard_type', 'hospital')
        .single();
      
      if (data?.is_locked) {
        setIsLocked(true);
      }
    };
    
    checkLock();
    
    const subscription = supabase
      .channel('hospital_lock')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'dashboard_locks',
        filter: 'dashboard_type=eq.hospital'
      }, (payload: any) => {
        setIsLocked(payload.new?.is_locked || false);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Emergency broadcast listener
  useEffect(() => {
    const subscription = supabase
      .channel('system_control')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'system_control' },
        (payload) => {
          if (payload.new.broadcast_active && payload.new.emergency_broadcast) {
            setEmergencyBroadcast(payload.new.emergency_broadcast);
            setShowBroadcast(true);
            
            // Auto-hide after 1 minute
            setTimeout(() => {
              setShowBroadcast(false);
            }, 60000);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (authLoading || ambLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-red-500/20 border-t-red-500 animate-spin" />
            <div className="absolute inset-3 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-red-400 animate-pulse" />
            </div>
          </div>
          <p className="text-slate-400 text-sm animate-pulse">Loading Hospital Dashboard...</p>
        </div>
      </div>
    );
  }

  if (isLocked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-6 p-8 rounded-2xl border border-red-500/20 bg-red-500/5 max-w-sm w-full mx-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
            <div className="relative w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30">
              <Lock className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard Locked</h1>
            <p className="text-slate-400 mt-2 text-sm">Locked by an administrator.</p>
          </div>
          <Button onClick={signOut} className="bg-red-600 hover:bg-red-700 text-white w-full">Sign Out</Button>
        </div>
      </div>
    );
  }

  const handleRouteSelect = async (
    selectedHospital: Hospital,
    routeToPatient: RouteData,
    routeToHospital: RouteData
  ) => {
    if (!selectedTokenForRoute) {
      toast.error('No token selected');
      return;
    }
    if (!user) {
      toast.error('You must be logged in as a hospital to share routes');
      return;
    }

    try {
      const success = await assignHospitalWithRoutes(
        selectedTokenForRoute,
        user.id,
        selectedHospital.organization_name,
        selectedHospital.location_lat,
        selectedHospital.location_lng,
        routeToPatient,
        routeToHospital
      );
      
      if (success) {
        toast.success('Routes shared with ambulance!', {
          description: `Ambulance will first go to patient, then to ${selectedHospital.organization_name}`
        });
        setSelectedTokenForRoute(null);
        setActiveNav('dashboard');
      } else {
        toast.error('Failed to share routes. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing routes:', error);
      toast.error('Failed to share routes. Please try again.');
    }
  };

  const handleDeclineToken = async () => {
    if (!declineTokenId || !declineReason.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    
    const success = await declineEmergency(declineTokenId, declineReason);
    if (success) {
      toast.success('Emergency request declined', {
        description: 'The ambulance has been notified.'
      });
      setDeclineTokenId(null);
      setDeclineReason('');
    } else {
      toast.error('Failed to decline request');
    }
  };

  // Handle hospital-initiated emergency creation
  const handleCreateHospitalEmergency = async (
    ambulance: { id: string; vehicle_number: string; current_lat: number | null; current_lng: number | null },
    pickupLat: number,
    pickupLng: number,
    pickupAddress: string | undefined,
    hospital: Hospital,
    routeToPatient: RouteData,
    routeToHospital: RouteData,
    emergencyType?: string,
    medicalKeyword?: string
  ) => {
    if (!ambulance.current_lat || !ambulance.current_lng) {
      toast.error('Ambulance location not available');
      return;
    }
    if (!user) {
      toast.error('You must be logged in as a hospital to create emergencies');
      return;
    }

    try {
      const token = await createHospitalEmergency(
        ambulance.id,
        ambulance.current_lat,
        ambulance.current_lng,
        pickupLat,
        pickupLng,
        pickupAddress,
        user.id,
        hospital.organization_name,
        hospital.location_lat,
        hospital.location_lng,
        routeToPatient,
        routeToHospital,
        emergencyType || 'General Emergency',
        medicalKeyword || 'General'
      );

      if (token) {
        toast.success(`${emergencyType || 'Emergency'} Created: ${token.token_code}`, {
          description: `${ambulance.vehicle_number} dispatched to ${medicalKeyword || 'General'} emergency → ${hospital.organization_name}`
        });
        setActiveNav('dashboard');
      }
    } catch (error: any) {
      console.error('Emergency creation error:', error);
      toast.error('Failed to create emergency', {
        description: error.message || 'Please try again or select a different ambulance'
      });
    }
  };

  // Handle releasing an on-duty ambulance back to available
  const handleReleaseAmbulance = async (ambulanceId: string, vehicleNumber: string) => {
    const success = await releaseAmbulance(ambulanceId);
    if (success) {
      toast.success(`${vehicleNumber} Released`, {
        description: 'Ambulance is now available for new emergencies.'
      });
    } else {
      toast.error('Failed to release ambulance');
    }
  };

  // Get unique regions from hospitals (excluding 'all' and 'Unknown')
  const existingRegions = [...new Set(hospitals.map(h => h.address?.split(',').pop()?.trim()).filter(r => r && r !== 'Unknown'))];
  const regions = ['all', ...existingRegions];
  
  // Predefined regions for hospital creation
  const availableRegions = ['Punjab', 'Haryana', 'Delhi', 'Rajasthan', 'Uttar Pradesh', 'Himachal Pradesh', ...existingRegions].filter((r, i, arr) => arr.indexOf(r) === i);
  
  // Filter hospitals by selected region
  const filteredHospitals = selectedRegion === 'all' 
    ? hospitals 
    : hospitals.filter(h => h.address?.includes(selectedRegion));

  // Mock hospital capacity data (in real app, this would come from API)
  const getHospitalCapacity = (hospitalId: string) => {
    const mockData = {
      totalBeds: Math.floor(Math.random() * 200) + 50,
      icuBeds: Math.floor(Math.random() * 30) + 10,
    };
    const occupiedBeds = Math.floor(mockData.totalBeds * (0.3 + Math.random() * 0.6));
    const occupiedICU = Math.floor(mockData.icuBeds * (0.2 + Math.random() * 0.7));
    const occupancyRate = Math.round((occupiedBeds / mockData.totalBeds) * 100);
    
    return {
      ...mockData,
      occupiedBeds,
      availableBeds: mockData.totalBeds - occupiedBeds,
      occupiedICU,
      availableICU: mockData.icuBeds - occupiedICU,
      occupancyRate,
      loadLevel: occupancyRate < 60 ? 'low' : occupancyRate < 85 ? 'moderate' : 'critical',
      incomingAmbulances: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0
    };
  };

  // Calculate network totals using capacity engine data
  const networkStats = hospitals.reduce((acc, hospital) => {
    const capacity = hospital.capacity;
    if (!capacity) return acc;
    
    return {
      totalBeds: acc.totalBeds + capacity.total_beds,
      availableBeds: acc.availableBeds + capacity.available_beds,
      totalICU: acc.totalICU + capacity.icu_beds,
      availableICU: acc.availableICU + capacity.icu_available,
      incomingAmbulances: acc.incomingAmbulances + capacity.incoming_ambulances
    };
  }, { totalBeds: 0, availableBeds: 0, totalICU: 0, availableICU: 0, incomingAmbulances: 0 });

  const networkOccupancyRate = networkStats.totalBeds > 0 
    ? Math.round(((networkStats.totalBeds - networkStats.availableBeds) / networkStats.totalBeds) * 100)
    : 0;

  const handleAddHospital = async () => {
    if (!hospitalForm.name || !hospitalForm.address || !hospitalForm.region || !hospitalForm.latitude || !hospitalForm.longitude) {
      toast.error('Please fill all fields');
      return;
    }

    const lat = parseFloat(hospitalForm.latitude);
    const lng = parseFloat(hospitalForm.longitude);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Please enter valid coordinates');
      return;
    }

    // Here you would typically call an API to add the hospital
    // For now, just show success message
    toast.success('Hospital added successfully!', {
      description: `${hospitalForm.name} in ${hospitalForm.region}`
    });
    
    // Reset form
    setHospitalForm({ name: '', address: '', region: '', latitude: '', longitude: '' });
    setShowAddHospital(false);
  };

  const selectedToken = [...pendingTokens, ...assignedTokens].find(t => t.id === selectedTokenForRoute);

  // Get ambulance location for the selected token
  const getAmbulanceForToken = (tokenId: string) => {
    const token = [...pendingTokens, ...assignedTokens].find(t => t.id === tokenId);
    if (!token) return null;
    return ambulances.find(a => a.id === token.ambulance_id);
  };

  const renderContent = () => {

    // Route Selection View (shows Emergency Analysis & Assignment)
    if (selectedTokenForRoute && selectedToken) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Emergency Analysis & Hospital Assignment</h2>
            <Button variant="outline" onClick={() => setSelectedTokenForRoute(null)}>
              Back to Tokens
            </Button>
          </div>
          <EmergencyDisplay 
            token={selectedToken} 
            onAssignmentComplete={() => {
              setSelectedTokenForRoute(null);
              setActiveNav('dashboard');
            }}
          />
        </div>
      );
    }

    switch (activeNav) {
      case 'create-emergency':
        return (
          <HospitalEmergencyCreator
            ambulances={ambulances}
            hospitals={hospitals}
            onCreateEmergency={handleCreateHospitalEmergency}
            onCancel={() => setActiveNav('dashboard')}
          />
        );
        
      case 'tokens':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Emergency Tokens</h2>
            
            {/* Pending Tokens */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="destructive">{pendingTokens.length}</Badge>
                Pending Assignment
              </h3>
              {pendingTokens.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pending tokens</p>
              ) : (
                <div className="grid gap-4">
                  {pendingTokens.map(token => (
                    <Card key={token.id} className="border-emergency/30">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <Badge variant="outline" className="text-lg font-mono">{token.token_code}</Badge>
                            <p className="text-sm text-muted-foreground mt-1">
                              Created: {new Date(token.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                          <Badge variant="destructive">PENDING</Badge>
                        </div>
                        <div className="mb-3">
                          <p className="text-sm text-muted-foreground">Patient Pickup Location:</p>
                          <p className="font-medium text-sm">{token.pickup_address || `${token.pickup_lat.toFixed(4)}, ${token.pickup_lng.toFixed(4)}`}</p>
                          {token.emergency_type && (
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {token.emergency_type}
                              </Badge>
                              {token.medical_keyword && (
                                <Badge variant="secondary" className="text-xs">
                                  {token.medical_keyword}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {/* Decline reason input */}
                        {declineTokenId === token.id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Please provide a reason for declining this emergency request..."
                              value={declineReason}
                              onChange={(e) => setDeclineReason(e.target.value)}
                              className="min-h-[80px]"
                            />
                            <div className="flex gap-2">
                              <Button 
                                variant="destructive" 
                                onClick={handleDeclineToken}
                                disabled={!declineReason.trim()}
                                className="flex-1"
                              >
                                Confirm Decline
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setDeclineTokenId(null);
                                  setDeclineReason('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button onClick={() => setSelectedTokenForRoute(token.id)} variant="secondary" className="flex-1">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Assign Hospital & Route
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setDeclineTokenId(token.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Assigned Tokens (route selected) */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge>{assignedTokens.length}</Badge>
                Route Assigned
              </h3>
              {assignedTokens.map(token => (
                <Card key={token.id} className="border-primary/30">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-lg font-mono">{token.token_code}</Badge>
                      <Badge className="bg-green-500">{token.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span>Patient: {token.pickup_address || `${token.pickup_lat.toFixed(4)}, ${token.pickup_lng.toFixed(4)}`}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                        <span>Hospital: {token.hospital_name}</span>
                      </div>
                      {token.emergency_type && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span>Emergency: {token.emergency_type}</span>
                          {token.medical_keyword && (
                            <Badge variant="outline" className="text-xs ml-2">{token.medical_keyword}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                    <p className="text-success text-sm mt-2">✓ Routes shared with ambulance</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Active Journeys */}
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Badge variant="secondary">{activeTokens.length}</Badge>
                Active Journeys
              </h3>
              {activeTokens.map(token => (
                <Card key={token.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-lg font-mono">{token.token_code}</Badge>
                      <Badge variant="destructive">{token.status.replace(/_/g, ' ').toUpperCase()}</Badge>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {token.status === 'in_progress' && (
                        <p className="text-blue-500">🚑 Ambulance heading to patient...</p>
                      )}
                      {token.status === 'at_patient' && (
                        <p className="text-green-500">✓ Ambulance arrived at patient location</p>
                      )}
                      {token.status === 'to_hospital' && (
                        <p className="text-blue-500">🏥 Ambulance heading to {token.hospital_name}...</p>
                      )}
                      {token.emergency_type && (
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                          <span>Emergency: {token.emergency_type}</span>
                          {token.medical_keyword && (
                            <Badge variant="outline" className="text-xs ml-2">{token.medical_keyword}</Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Hospital Network Capacity</h2>
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Network
              </Button>
            </div>
            
            {/* Network Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card className="bg-blue-500/10 border-blue-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-blue-400" />
                    <span className="text-sm text-muted-foreground">Total Beds</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400">{networkStats.totalBeds}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-green-500/10 border-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Bed className="w-5 h-5 text-green-400" />
                    <span className="text-sm text-muted-foreground">Available</span>
                  </div>
                  <p className="text-2xl font-bold text-green-400">{networkStats.availableBeds}</p>
                </CardContent>
              </Card>
              
              <Card className={`${networkOccupancyRate < 60 ? 'bg-green-500/10 border-green-500/20' : networkOccupancyRate < 85 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Occupancy</span>
                  </div>
                  <p className={`text-2xl font-bold ${networkOccupancyRate < 60 ? 'text-green-400' : networkOccupancyRate < 85 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {networkOccupancyRate}%
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-purple-500/10 border-purple-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-purple-400" />
                    <span className="text-sm text-muted-foreground">ICU Beds</span>
                  </div>
                  <p className="text-2xl font-bold text-purple-400">{networkStats.totalICU}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-indigo-500/10 border-indigo-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm text-muted-foreground">ICU Available</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-400">{networkStats.availableICU}</p>
                </CardContent>
              </Card>
              
              <Card className="bg-orange-500/10 border-orange-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Ambulance className="w-5 h-5 text-orange-400" />
                    <span className="text-sm text-muted-foreground">Incoming</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-400">{networkStats.incomingAmbulances}</p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Hospital List */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Hospital Status</h3>
                <div className="space-y-3">
                  {hospitals.map(hospital => {
                    const capacity = hospital.capacity;
                    if (!capacity) return null;
                    
                    const loadLevel = capacity.occupancy_percentage < 60 ? 'low' : 
                                    capacity.occupancy_percentage < 85 ? 'moderate' : 'critical';
                    
                    return (
                      <Card 
                        key={hospital.id} 
                        className={`cursor-pointer transition-all hover:shadow-lg ${
                          selectedHospitalId === hospital.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => setSelectedHospitalId(hospital.id)}
                      >
                        <CardContent className="p-4">
                          {/* Incoming Ambulance Banner */}
                          {capacity.incoming_ambulances > 0 && (
                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Ambulance className="w-4 h-4 text-orange-400 animate-pulse" />
                                <span className="text-sm text-orange-400 font-medium">
                                  {capacity.incoming_ambulances} ambulance{capacity.incoming_ambulances > 1 ? 's' : ''} incoming
                                </span>
                                <Badge variant="outline" className="text-xs">ETA: 8-12 min</Badge>
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="font-semibold">{hospital.organization_name}</h4>
                              <p className="text-sm text-muted-foreground">{hospital.address}</p>
                            </div>
                            <Badge 
                              variant={loadLevel === 'low' ? 'default' : loadLevel === 'moderate' ? 'secondary' : 'destructive'}
                              className={`${
                                loadLevel === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                loadLevel === 'moderate' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                                'bg-red-500/20 text-red-400 border-red-500/30'
                              }`}
                            >
                              {loadLevel === 'low' ? 'Low Load' : loadLevel === 'moderate' ? 'Moderate Load' : 'Critical Load'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="text-center">
                              <p className="text-sm text-muted-foreground">Total Beds</p>
                              <p className="font-semibold">{capacity.total_beds}</p>
                            </div>
                            <div className="text-center bg-green-500/10 rounded p-2">
                              <p className="text-sm text-green-400">Available</p>
                              <p className="font-semibold text-green-400">{capacity.available_beds}</p>
                            </div>
                            <div className="text-center bg-purple-500/10 rounded p-2">
                              <p className="text-sm text-purple-400">ICU Beds</p>
                              <p className="font-semibold text-purple-400">{capacity.icu_beds}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Occupancy</span>
                              <span>{capacity.occupancy_percentage}%</span>
                            </div>
                            <Progress 
                              value={capacity.occupancy_percentage} 
                              className={`h-2 ${
                                capacity.occupancy_percentage < 60 ? '[&>div]:bg-green-500' :
                                capacity.occupancy_percentage < 85 ? '[&>div]:bg-yellow-500' :
                                '[&>div]:bg-red-500'
                              }`}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
              
              {/* Hospital Details Panel */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Hospital Details</h3>
                {selectedHospitalId ? (
                  (() => {
                    const hospital = hospitals.find(h => h.id === selectedHospitalId);
                    const capacity = hospital?.capacity;
                    return hospital && capacity ? (
                      <Card>
                        <CardContent className="p-4 space-y-4">
                          <div>
                            <h4 className="font-semibold text-lg">{hospital.organization_name}</h4>
                            <p className="text-sm text-muted-foreground">{hospital.address}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-500/10 rounded p-3">
                              <p className="text-sm text-blue-400">Total Beds</p>
                              <p className="text-xl font-bold text-blue-400">{capacity.total_beds}</p>
                            </div>
                            <div className="bg-green-500/10 rounded p-3">
                              <p className="text-sm text-green-400">Available</p>
                              <p className="text-xl font-bold text-green-400">{capacity.available_beds}</p>
                            </div>
                            <div className="bg-purple-500/10 rounded p-3">
                              <p className="text-sm text-purple-400">ICU Total</p>
                              <p className="text-xl font-bold text-purple-400">{capacity.icu_beds}</p>
                            </div>
                            <div className="bg-indigo-500/10 rounded p-3">
                              <p className="text-sm text-indigo-400">ICU Available</p>
                              <p className="text-xl font-bold text-indigo-400">{capacity.icu_available}</p>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <h5 className="font-medium">Specialties</h5>
                            <div className="flex flex-wrap gap-1">
                              {['Emergency', 'Cardiology', 'Neurology', 'Orthopedics'].map(specialty => (
                                <Badge key={specialty} variant="outline" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null;
                  })()
                ) : (
                  <Card className="h-64">
                    <CardContent className="p-4 h-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Select a hospital to view details</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );

      case 'hospitals':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Hospital Management</h2>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAddHospital(true)} className="mr-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Hospital
                </Button>
                <span className="text-sm text-muted-foreground">Region:</span>
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Regions</SelectItem>
                    {regions.slice(1).map(region => (
                      <SelectItem key={region} value={region}>{region}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Add Hospital Form */}
            {showAddHospital && (
              <Card className="border-primary/30 bg-primary/5">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Add New Hospital</span>
                    <Button variant="ghost" size="sm" onClick={() => setShowAddHospital(false)}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-name">Hospital Name</Label>
                      <Input
                        id="hospital-name"
                        placeholder="Enter hospital name"
                        value={hospitalForm.name}
                        onChange={(e) => setHospitalForm(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospital-region">Region</Label>
                      <Select value={hospitalForm.region} onValueChange={(value) => setHospitalForm(prev => ({ ...prev, region: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select region" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRegions.map(region => (
                            <SelectItem key={region} value={region}>{region}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="hospital-address">Full Address</Label>
                    <Textarea
                      id="hospital-address"
                      placeholder="Enter complete hospital address"
                      value={hospitalForm.address}
                      onChange={(e) => setHospitalForm(prev => ({ ...prev, address: e.target.value }))}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hospital-lat">Latitude</Label>
                      <Input
                        id="hospital-lat"
                        type="number"
                        step="any"
                        placeholder="e.g., 30.7333"
                        value={hospitalForm.latitude}
                        onChange={(e) => setHospitalForm(prev => ({ ...prev, latitude: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="hospital-lng">Longitude</Label>
                      <Input
                        id="hospital-lng"
                        type="number"
                        step="any"
                        placeholder="e.g., 76.7794"
                        value={hospitalForm.longitude}
                        onChange={(e) => setHospitalForm(prev => ({ ...prev, longitude: e.target.value }))}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddHospital} className="flex-1">
                      <Building2 className="w-4 h-4 mr-2" />
                      Add Hospital
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddHospital(false)}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Hospitals in {selectedRegion === 'all' ? 'All Regions' : selectedRegion}
                    <Badge variant="secondary">{filteredHospitals.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredHospitals.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">No hospitals found in selected region</p>
                  ) : (
                    <div className="grid gap-3">
                      {filteredHospitals.map(hospital => (
                        <Card key={hospital.id} className="border-muted">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg">{hospital.organization_name}</h3>
                                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>{hospital.address}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline">
                                    {hospital.location_lat?.toFixed(4)}, {hospital.location_lng?.toFixed(4)}
                                  </Badge>
                                  <Badge variant="secondary">
                                    {hospital.address?.split(',').pop()?.trim() || 'Unknown Region'}
                                  </Badge>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <Badge variant="default">Active</Badge>
                                <span className="text-xs text-muted-foreground">
                                  ID: {hospital.id.slice(0, 8)}...
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        );

      case 'ambulances': {
        return <AmbulanceFleetManagement />;
      }

      case 'livemap':
        return (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Live Map</h2>
            <Card>
              <CardContent className="p-0">
                <div className="h-[calc(100vh-200px)] rounded-xl overflow-hidden">
                  <Map 
                    center={[27.5, 76.0]}
                    zoom={5}
                    markers={[
                      // Hospital markers
                      ...hospitals.map(h => ({
                        position: [h.location_lat || 30.7333, h.location_lng || 76.7794] as [number, number],
                        popup: `${h.organization_name}${h.capacity ? ` - ${h.capacity.available_beds}/${h.capacity.total_beds} beds available` : ''}`,
                        icon: 'hospital' as const
                      })),
                      // Ambulance markers
                      ...ambulances.filter(a => a.current_lat).map(amb => ({
                        position: [amb.current_lat!, amb.current_lng!] as [number, number],
                        popup: amb.vehicle_number,
                        icon: 'ambulance' as const
                      })),
                      // Signal markers
                      ...signals.map(s => ({
                        position: [s.location_lat, s.location_lng] as [number, number],
                        popup: s.signal_name,
                        icon: 'signal' as const
                      }))
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {/* KPI Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Active Requests */}
              <div className="relative rounded-2xl p-px bg-gradient-to-br from-red-500/40 to-transparent">
                <div className="rounded-2xl bg-slate-900/90 backdrop-blur-sm p-4 h-full shadow-lg shadow-red-500/10 hover:shadow-red-500/20 transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-red-500/15 border border-red-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                    </div>
                    {pendingTokens.length > 0 && <span className="flex items-center gap-1 text-xs text-red-400 font-medium"><span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />URGENT</span>}
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums">{pendingTokens.length + activeTokens.length}</p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Active Requests</p>
                  <p className="text-xs text-red-400/80 mt-1">{pendingTokens.length} pending review</p>
                </div>
              </div>
              {/* Available Ambulances */}
              <div className="relative rounded-2xl p-px bg-gradient-to-br from-emerald-500/40 to-transparent">
                <div className="rounded-2xl bg-slate-900/90 backdrop-blur-sm p-4 h-full shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center">
                      <Ambulance className="w-5 h-5 text-emerald-400" />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">▲ READY</span>
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums">{ambulances.filter(a => a.emergency_status === 'inactive').length}</p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Available Ambulances</p>
                  <p className="text-xs text-slate-500 mt-1">{ambulances.length} total in fleet</p>
                </div>
              </div>
              {/* Partner Hospitals */}
              <div className="relative rounded-2xl p-px bg-gradient-to-br from-blue-500/40 to-transparent">
                <div className="rounded-2xl bg-slate-900/90 backdrop-blur-sm p-4 h-full shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                    <span className="text-xs text-blue-400 font-medium">NETWORK</span>
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums">{hospitals.length}</p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Partner Hospitals</p>
                  <p className="text-xs text-slate-500 mt-1">{networkStats.availableBeds} beds available</p>
                </div>
              </div>
              {/* Avg Response Time */}
              <div className="relative rounded-2xl p-px bg-gradient-to-br from-amber-500/40 to-transparent">
                <div className="rounded-2xl bg-slate-900/90 backdrop-blur-sm p-4 h-full shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/20 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-400" />
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">▲ 12%</span>
                  </div>
                  <p className="text-3xl font-bold text-white tabular-nums">4.2<span className="text-lg text-slate-400"> min</span></p>
                  <p className="text-slate-400 text-xs font-medium mt-0.5">Avg Response Time</p>
                  <p className="text-xs text-slate-500 mt-1">vs last 24h</p>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Active Emergency Requests */}
              <div className="lg:col-span-3">
                <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shadow-xl">
                  <div className="bg-gradient-to-r from-red-700 to-red-600 px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                        <AlertTriangle className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">Active Emergency Requests</h3>
                        <p className="text-red-200 text-xs">{[...pendingTokens, ...activeTokens].length} active</p>
                      </div>
                    </div>
                    <button onClick={() => window.location.reload()} className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <div className="p-4 space-y-3">
                    {[...pendingTokens, ...activeTokens].length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3">
                          <AlertTriangle className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm">No active emergency requests</p>
                      </div>
                    ) : (
                      [...pendingTokens, ...activeTokens].map((token) => {
                        const ambulance = ambulances.find(a => a.id === token.ambulance_id);
                        const isPending = token.status === 'pending';
                        const isCritical = token.status === 'in_progress' || token.status === 'to_hospital';
                        const elapsed = Math.floor((Date.now() - new Date(token.created_at).getTime()) / 60000);
                        return (
                          <div key={token.id} className={`flex items-center justify-between p-4 rounded-xl border transition-all hover:scale-[1.01] ${
                            isCritical ? 'bg-red-500/5 border-red-500/20' : isPending ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-800/60 border-slate-700/50'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-1 h-12 rounded-full flex-shrink-0 ${
                                isCritical ? 'bg-red-500' : isPending ? 'bg-amber-500' : 'bg-blue-500'
                              }`} />
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-white text-sm font-mono">{token.token_code}</span>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${isCritical ? 'bg-red-600/80 text-white' : isPending ? 'bg-amber-600/80 text-white' : 'bg-blue-600/80 text-white'}`}>
                                    {token.status.replace(/_/g, ' ').toUpperCase()}
                                  </Badge>
                                  {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />}
                                </div>
                                <p className="text-slate-400 text-xs">{token.pickup_address || `${token.pickup_lat.toFixed(4)}, ${token.pickup_lng.toFixed(4)}`}</p>
                                <p className="text-slate-600 text-xs mt-0.5">{ambulance?.vehicle_number || 'Unknown'} · {elapsed}m ago</p>
                              </div>
                            </div>
                            <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700 rounded-lg text-xs" onClick={() => setActiveNav('tokens')}>
                              <Eye className="w-3 h-3 mr-1" />Details
                            </Button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shadow-xl h-full">
                  <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-5 py-4">
                    <h3 className="font-bold text-white text-base">Recent Activity</h3>
                    <p className="text-emerald-200 text-xs">Latest token events</p>
                  </div>
                  <div className="p-4 space-y-1">
                    {[...pendingTokens, ...assignedTokens, ...activeTokens].slice(0, 6).map((token, idx, arr) => {
                      const isCritical = token.status === 'in_progress' || token.status === 'to_hospital';
                      const isNew = Date.now() - new Date(token.created_at).getTime() < 60000;
                      const dotColor = token.status === 'completed' ? 'bg-emerald-500' : token.status === 'cancelled' ? 'bg-red-500' : isCritical ? 'bg-blue-500' : 'bg-amber-500';
                      const textColor = token.status === 'completed' ? 'text-emerald-400' : token.status === 'cancelled' ? 'text-red-400' : isCritical ? 'text-blue-400' : 'text-amber-400';
                      return (
                        <div key={token.id} className="flex gap-3 py-2">
                          <div className="flex flex-col items-center">
                            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${dotColor} ${isCritical ? 'animate-pulse' : ''}`} />
                            {idx < arr.length - 1 && <div className="w-px flex-1 bg-slate-700/50 mt-1" />}
                          </div>
                          <div className="pb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-white text-xs font-mono font-bold">{token.token_code}</span>
                              {isNew && <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 rounded">NEW</span>}
                            </div>
                            <p className={`text-xs ${textColor}`}>{token.status.replace(/_/g, ' ')}</p>
                            <p className="text-slate-600 text-[10px]">{new Date(token.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      );
                    })}
                    {[...pendingTokens, ...assignedTokens, ...activeTokens].length === 0 && (
                      <p className="text-slate-500 text-xs text-center py-6">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Ambulance Fleet Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="rounded-2xl overflow-hidden border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shadow-xl">
                  <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Ambulance className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base">Ambulance Fleet Status</h3>
                      <p className="text-blue-200 text-xs">{ambulances.length} units registered</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    {ambulances.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-sm">No ambulances in fleet</div>
                    ) : (
                      ambulances.slice(0, 5).map((ambulance) => {
                        const activeToken = [...pendingTokens, ...assignedTokens, ...activeTokens].find(t => t.ambulance_id === ambulance.id);
                        const isOnDuty = ambulance.emergency_status === 'active' || ambulance.emergency_status === 'responding' || !!activeToken;
                        const fuelLevel = ambulance.vehicle_health?.fuel_percent ?? 75;
                        const batteryLevel = ambulance.vehicle_health?.battery_percent ?? 85;
                        return (
                          <div key={ambulance.id} className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60 transition-all hover:scale-[1.005]">
                            <div className="flex items-center gap-3">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOnDuty ? 'bg-blue-400 animate-pulse' : 'bg-emerald-400'}`} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-white text-sm">{ambulance.vehicle_number}</span>
                                  <Badge className={`text-[10px] px-1.5 py-0 ${isOnDuty ? 'bg-blue-600/70 text-white' : 'bg-emerald-600/70 text-white'}`}>
                                    {isOnDuty ? 'DISPATCHED' : 'AVAILABLE'}
                                  </Badge>
                                </div>
                                <p className="text-slate-500 text-xs">{ambulance.current_lat?.toFixed(4)}°N, {ambulance.current_lng?.toFixed(4)}°E</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-5">⛽</span>
                                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${fuelLevel > 60 ? 'bg-blue-400' : fuelLevel > 30 ? 'bg-amber-400' : 'bg-red-500'}`} style={{ width: `${fuelLevel}%` }} />
                                  </div>
                                  <span className="text-[10px] text-slate-400">{fuelLevel}%</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-500 w-5">🔋</span>
                                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all ${batteryLevel > 80 ? 'bg-emerald-400' : batteryLevel > 50 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${batteryLevel}%` }} />
                                  </div>
                                  <span className="text-[10px] text-slate-400">{batteryLevel}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="lg:col-span-1">
                <div className="rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-sm shadow-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-700/50">
                    <h3 className="font-bold text-white text-base">Quick Actions</h3>
                  </div>
                  <div className="p-4 space-y-2.5">
                    <button onClick={() => setActiveNav('create-emergency')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-medium text-sm transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/20">
                      <Plus className="w-4 h-4" /> Create Emergency
                    </button>
                    {pendingTokens.length > 0 && (
                      <button onClick={() => setActiveNav('tokens')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-medium text-sm transition-all hover:bg-amber-500/20 hover:scale-[1.02]">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                        Review {pendingTokens.length} Token{pendingTokens.length > 1 ? 's' : ''}
                      </button>
                    )}
                    <button onClick={() => setActiveNav('livemap')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 font-medium text-sm transition-all hover:bg-slate-700/80 hover:scale-[1.02]">
                      <MapIcon className="w-4 h-4" /> View Live Map
                    </button>
                    <button onClick={() => setActiveNav('ambulances')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 font-medium text-sm transition-all hover:bg-slate-700/80 hover:scale-[1.02]">
                      <Ambulance className="w-4 h-4" /> Manage Fleet
                    </button>
                    <button onClick={() => setActiveNav('network')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/50 text-slate-300 font-medium text-sm transition-all hover:bg-slate-700/80 hover:scale-[1.02]">
                      <Activity className="w-4 h-4" /> Hospital Network
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Journeys Overview */}
            {activeTokens.length > 0 && (
              <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Ambulance className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-white text-sm">Active Journeys</h3>
                  <Badge className="bg-blue-500/20 text-blue-400 text-xs">{activeTokens.length}</Badge>
                </div>
                <div className="space-y-2">
                  {activeTokens.map(token => {
                    const step = token.status === 'route_selected' ? 0 : token.status === 'in_progress' ? 1 : token.status === 'at_patient' ? 2 : 3;
                    const steps = ['Assigned', 'To Patient', 'At Patient', 'To Hospital'];
                    return (
                      <div key={token.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/40">
                        <Badge variant="outline" className="font-mono text-xs border-blue-500/30 text-blue-300">{token.token_code}</Badge>
                        <div className="flex-1 flex items-center gap-1">
                          {steps.map((s, i) => (
                            <div key={i} className="flex items-center gap-1 flex-1">
                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${i <= step ? 'bg-blue-500' : 'bg-slate-600'}`} />
                              <span className={`text-[10px] flex-1 ${i <= step ? 'text-blue-400' : 'text-slate-600'}`}>{s}</span>
                              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-blue-500' : 'bg-slate-700'}`} />}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 flex-shrink-0">{token.hospital_name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Emergency Broadcast Popup */}
      {showBroadcast && emergencyBroadcast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-lg w-full px-4">
          <div className="relative bg-gradient-to-r from-red-900/95 to-red-800/95 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 shadow-2xl shadow-red-900/50">
            <div className="absolute inset-0 rounded-2xl bg-red-500/5 animate-pulse pointer-events-none" />
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 border border-red-500/30">
                <Bell className="w-4 h-4 text-red-300 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-red-300 tracking-widest uppercase">Emergency Broadcast</span>
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
                </div>
                <p className="text-white text-sm leading-relaxed">{emergencyBroadcast}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowBroadcast(false)} className="text-red-300 hover:bg-red-500/20 p-1 h-auto">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Navigation */}
      <div className="md:hidden bg-slate-950 border-b border-slate-800">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-bold text-white text-sm">Hospital Control</span>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white">
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <div className="px-4 pb-4 flex gap-1 overflow-x-auto">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-xs font-medium transition-all flex-shrink-0 ${
                activeNav === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}>
              <item.icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="w-64 bg-slate-950/95 border-r border-slate-800/60 hidden md:flex flex-col shadow-2xl">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-white text-sm leading-tight">Hospital Control</p>
              <p className="text-slate-500 text-[10px]">MediRoute AI</p>
            </div>
          </div>
        </div>
        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveNav(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                activeNav === item.id
                  ? 'bg-gradient-to-r from-blue-600/80 to-blue-500/60 text-white shadow-md shadow-blue-500/10 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}>
              {activeNav === item.id && <div className="w-1 h-4 rounded-full bg-blue-400 flex-shrink-0" />}
              <item.icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'tokens' && pendingTokens.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">{pendingTokens.length}</span>
              )}
            </button>
          ))}
        </nav>
        {/* User Info */}
        <div className="p-4 border-t border-slate-800/60">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{(profile?.organization_name || 'H')[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-semibold truncate">{profile?.organization_name || 'Hospital'}</p>
              <p className="text-slate-500 text-[10px] truncate">{user?.email}</p>
            </div>
            <button onClick={signOut} className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 px-5 py-3.5 flex justify-between items-center flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-white font-bold text-base leading-tight">{profile?.organization_name || 'Hospital Dashboard'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[10px] font-medium tracking-wider uppercase">Live</span>
              <span className="text-slate-600 text-[10px]">·</span>
              <span className="text-slate-500 text-[10px]">{currentTime.toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pendingTokens.length > 0 && (
              <button onClick={() => setActiveNav('tokens')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium hover:bg-red-500/20 transition-colors">
                <AlertTriangle className="w-3 h-3" />
                {pendingTokens.length} Pending
              </button>
            )}
            <Button variant="ghost" size="sm" onClick={signOut} className="hidden md:flex text-slate-400 hover:text-white">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}