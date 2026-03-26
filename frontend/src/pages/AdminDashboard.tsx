import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, LogOut, Command, Users, Settings } from "lucide-react";
import { toast } from "sonner";

import AdminCommandCenter from "./AdminCommandCenter";
import AmbulanceFleetManagement from "@/components/AmbulanceFleetManagement";
import DashboardLockManager from "@/components/DashboardLockManager";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  React.useEffect(() => {
    if (
      !loading &&
      (!user || profile?.role !== 'admin')
    ) {
      toast.error("Access Denied - Admin privileges required");
      navigate("/");
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-3 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground text-sm animate-pulse">Loading Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>

      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div className="fixed inset-0 opacity-[0.04] pointer-events-none" style={{
        backgroundImage: 'linear-gradient(hsl(185 100% 50% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 1) 1px, transparent 1px)',
        backgroundSize: '50px 50px'
      }} />

      {/* Header */}
      <nav className="relative z-20 sticky top-0 border-b border-border/30" style={{ background: 'hsl(var(--card) / 0.6)', backdropFilter: 'blur(24px)' }}>
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className="font-bold text-foreground text-sm tracking-wide">Admin Dashboard</span>
              <Badge variant="outline" className="ml-2 text-xs border-primary/30 text-primary">
                {profile?.role?.toUpperCase()}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">{profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-muted-foreground hover:text-foreground">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Control Panel</h1>
          <p className="text-muted-foreground">City-wide emergency monitoring &amp; operational overview</p>
        </div>

        <Tabs defaultValue="command" className="space-y-4">
          <TabsList className="bg-card/60 border border-border/40 backdrop-blur-xl rounded-xl p-1">
            <TabsTrigger value="command" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground font-semibold transition-all">
              <Command className="w-4 h-4 mr-2" />
              Command Center
            </TabsTrigger>
            <TabsTrigger value="fleet" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground font-semibold transition-all">
              <Users className="w-4 h-4 mr-2" />
              Fleet Management
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground font-semibold transition-all">
              <Settings className="w-4 h-4 mr-2" />
              System Overview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="command">
            <AdminCommandCenter />
          </TabsContent>

          <TabsContent value="fleet">
            <AmbulanceFleetManagement />
          </TabsContent>

          <TabsContent value="settings">
            <div className="space-y-6">
              <DashboardLockManager />
              <Card className="bg-card/60 border border-border/40 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-foreground">System Configuration Overview</CardTitle>
                  <CardDescription className="text-muted-foreground">Current operational rules</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <InfoSection title="🚨 Emergency Management" items={["System is globally ACTIVE","Green corridors are auto-managed","Manual override available to admins"]} />
                  <InfoSection title="🏥 Hospital Policies" items={["Hospital approval required for all emergencies","ICU & bed availability tracked in real time","Overloaded hospitals are deprioritized"]} />
                  <InfoSection title="🚑 Ambulance Permissions" items={["Drivers can initiate emergency requests","All driver requests require hospital approval","Live GPS tracking is mandatory"]} />
                  <InfoSection title="🔐 Security & Audit" items={["All admin actions are logged","Role-based access control enforced","System changes restricted during live emergencies"]} />
                  <InfoSection title="🎨 Interface" items={["Dark theme enforced for all dashboards","Optimized for low-light control rooms"]} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ================= Info Section Component ================= */

function InfoSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-slate-900/60 border border-slate-700 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-2">{title}</h3>
      <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
