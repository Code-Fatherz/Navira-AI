import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Ambulance,
  Building2,
  MapPin,
  Radio,
  Zap,
  LogOut,
  Shield,
  Activity,
  Clock,
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Siren,
  Wifi,
  Brain,
  Navigation,
} from 'lucide-react';
import Logo from '@/components/Logo';

/* ---------------- FEATURE CONTENT ---------------- */

const FEATURES = {
  gps: {
    title: 'Live GPS Tracking',
    description: 'Real-time location tracking of ambulances with accurate positioning.',
    details:
      'Ambulances are tracked in real time using GPS modules.\n\nThe system continuously updates the location on the dashboard, allowing hospitals and traffic systems to monitor movement and predict arrival times accurately.',
  },
  signal: {
    title: 'Signal Priority',
    description: 'Automatic traffic signal control to clear the path for emergencies.',
    details:
      'Traffic signals automatically prioritize approaching ambulances.\n\nSignals switch to green to ensure uninterrupted movement, reducing response time and improving patient survival.',
  },
  updates: {
    title: 'Instant Updates',
    description: 'Real-time synchronization between ambulances, hospitals, and traffic signals.',
    details:
      'All stakeholders receive instant updates.\n\nHospitals, ambulance drivers, and traffic systems remain synchronized with real-time data to ensure coordinated emergency response.',
  },
} as const;

type FeatureKey = keyof typeof FEATURES;

/* ---------------- ANIMATED COUNTER ---------------- */

function useCountUp(target: number, duration = 2000, startOnView = false) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(!startOnView);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [started, target, duration]);

  return { count, ref };
}

/* ---------------- STAT ITEM ---------------- */
function StatItem({ value, suffix, label, icon: Icon }: { value: number; suffix: string; label: string; icon: any }) {
  const { count, ref } = useCountUp(value, 1800, true);
  return (
    <div ref={ref} className="flex flex-col items-center text-center group">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-all duration-300 group-hover:scale-110">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <div className="text-4xl font-extrabold text-foreground tabular-nums">
        {count.toLocaleString()}<span className="text-primary">{suffix}</span>
      </div>
      <div className="text-sm text-muted-foreground mt-1 font-medium">{label}</div>
    </div>
  );
}

/* =============== MAIN COMPONENT =============== */

export default function Index() {
  const navigate = useNavigate();
  const { user, profile, loading, signOut } = useAuth();

  const [open, setOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<FeatureKey | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'ambulance') navigate('/ambulance');
      else if (profile.role === 'hospital') navigate('/hospital');
      else if (profile.role === 'admin') navigate('/admin');
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--gradient-hero)' }}>
        <div className="text-center text-primary-foreground">
          <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-5" />
          <p className="text-primary font-medium tracking-wide">Initializing MediRoute AI…</p>
        </div>
      </div>
    );
  }

  /* ---------------- LANDING PAGE ---------------- */

  if (!user) {
    return (
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* ── NAVBAR ── */}
        <nav
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg shadow-black/20'
            : 'bg-transparent'
            }`}
        >
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <Logo size="md" className="!-mt-0 opacity-100" />
            <div className="flex items-center gap-3">
              <Link to="/learn-more">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  Learn More
                </Button>
              </Link>
              <Link to="/auth">
                <Button className="font-semibold px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                  Sign In <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-16 overflow-hidden">
          {/* Background gradient + grid */}
          <div
            className="absolute inset-0 -z-10"
            style={{ background: 'var(--gradient-hero)' }}
          />
          {/* Glowing orbs */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse -z-10" />
          <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent/10 blur-3xl animate-pulse -z-10" style={{ animationDelay: '1s' }} />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 -z-10 opacity-5"
            style={{
              backgroundImage: 'linear-gradient(hsl(185 100% 50% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />

          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-8 backdrop-blur-sm animate-fadeIn">
            <Siren className="w-4 h-4 animate-pulse" />
            AI-Powered Emergency Response System
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-extrabold text-center leading-tight max-w-5xl mx-auto px-4 animate-fadeInUp">
            <span className="text-foreground">Smart Ambulance</span>
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text' }}
            >
              Navigation & Priority
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mt-6 max-w-2xl mx-auto text-center px-4 leading-relaxed animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
            Real-time ambulance tracking with intelligent traffic signal control.
            Save lives by ensuring clear routes for every emergency vehicle.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 px-4 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <Link to="/auth">
              <Button
                size="lg"
                className="text-base px-8 py-6 font-bold rounded-xl shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-105 transition-all duration-200"
                style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}
              >
                Get Started Free
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
            <Link to="/learn-more">
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 font-semibold rounded-xl border-primary/40 text-primary hover:bg-primary/10 hover:border-primary backdrop-blur-sm transition-all duration-200"
              >
                Explore Features
              </Button>
            </Link>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-bounce opacity-60">
            <div className="w-5 h-8 rounded-full border-2 border-muted-foreground flex items-start justify-center pt-1.5">
              <div className="w-1 h-2 bg-muted-foreground rounded-full" />
            </div>
          </div>
        </section>



        {/* ── FEATURES ── */}
        <section className="py-24 container mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">Core Capabilities</p>
            <h2 className="text-3xl md:text-5xl font-extrabold text-foreground">
              Everything you need for{' '}
              <span
                className="bg-clip-text text-transparent"
                style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text' }}
              >
                rapid response
              </span>
            </h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
              Mediroute AI connects ambulances, hospitals, and traffic systems into one intelligent emergency network.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* GPS Tracking */}
            <div
              className="group relative bg-card border border-border rounded-2xl p-8 cursor-pointer hover:border-primary/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10"
              onClick={() => { setActiveFeature('gps'); setOpen(true); }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Live GPS Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Real-time location tracking of ambulances with sub-second accuracy and predictive ETA calculations.
              </p>
              <div className="flex items-center gap-1 mt-6 text-primary text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Signal Priority */}
            <div
              className="group relative bg-card border border-border rounded-2xl p-8 cursor-pointer hover:border-emergency/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emergency/10"
              onClick={() => { setActiveFeature('signal'); setOpen(true); }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emergency/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-emergency/10 border border-emergency/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emergency/20 transition-all duration-300">
                <Radio className="w-7 h-7 text-emergency" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Signal Priority</h3>
              <p className="text-muted-foreground leading-relaxed">
                Automatic traffic signal preemption to clear every intersection for approaching emergency vehicles.
              </p>
              <div className="flex items-center gap-1 mt-6 text-emergency text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Instant Updates */}
            <div
              className="group relative bg-card border border-border rounded-2xl p-8 cursor-pointer hover:border-success/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-success/10"
              onClick={() => { setActiveFeature('updates'); setOpen(true); }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-success/20 transition-all duration-300">
                <Zap className="w-7 h-7 text-success" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Instant Updates</h3>
              <p className="text-muted-foreground leading-relaxed">
                Real-time synchronization across ambulances, hospitals, and traffic infrastructure at the speed of life.
              </p>
              <div className="flex items-center gap-1 mt-6 text-success text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-24 border-t border-border/50" style={{ background: 'linear-gradient(180deg, transparent 0%, hsl(230 25% 10%) 100%)' }}>
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-primary font-semibold uppercase tracking-widest text-sm mb-3">How It Works</p>
              <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
                Three roles. One seamless network.
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Ambulance, title: 'Ambulance Driver', color: 'text-emergency', bg: 'bg-emergency/10', border: 'border-emergency/20', desc: 'Navigate with AI-optimized routes. Get real-time traffic signal status and ETA to hospital.' },
                { icon: Building2, title: 'Hospital Staff', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', desc: 'Monitor incoming ambulances, receive advance patient data, and prepare resources in advance.' },
                { icon: Brain, title: 'Admin Control', color: 'text-accent', bg: 'bg-accent/10', border: 'border-accent/20', desc: 'Oversee entire fleet, manage drivers, track performance metrics and system-wide analytics.' },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className={`w-16 h-16 rounded-2xl ${item.bg} border ${item.border} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                    <item.icon className={`w-8 h-8 ${item.color}`} />
                  </div>
                  <div className={`w-8 h-0.5 ${item.bg} rounded mb-1`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Step {i + 1}</span>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="py-20 container mx-auto px-6">
          <div
            className="relative rounded-3xl p-12 text-center overflow-hidden"
            style={{ background: 'var(--gradient-hero)' }}
          >
            <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-accent/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'linear-gradient(hsl(185 100% 50% / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 0.5) 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 text-primary text-sm font-semibold px-4 py-2 rounded-full mb-6">
                <Wifi className="w-4 h-4" /> Join the Network
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4">
                Ready to save more lives?
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg">
                Join hospitals and emergency services already using MediRoute AI to reduce response times and improve outcomes.
              </p>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="border-t border-border/50 py-8">
          <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <Logo size="sm" className="!-mt-0" />
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} MediRoute AI. All rights reserved.
            </p>

          </div>
        </footer>

        {/* ── FEATURE MODAL ── */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg bg-card border-border">
            {activeFeature && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">
                    {FEATURES[activeFeature].title}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-muted-foreground font-medium">
                  {FEATURES[activeFeature].description}
                </p>
                <p className="text-sm whitespace-pre-wrap text-foreground/80 leading-relaxed">
                  {FEATURES[activeFeature].details}
                </p>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  /* ---------------- DASHBOARD SELECTOR ---------------- */

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/80 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <Logo size="sm" className="!-mt-0" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile?.email}</span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-extrabold mb-2">Dashboard</h1>
        <p className="text-muted-foreground mb-8">Select your workspace to get started.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
          <Card
            onClick={() => navigate('/ambulance')}
            className="cursor-pointer group border-border hover:border-emergency/50 hover:shadow-xl hover:shadow-emergency/10 transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-emergency/10 border border-emergency/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Ambulance className="w-6 h-6 text-emergency" />
              </div>
              <CardTitle>Ambulance Dashboard</CardTitle>
              <CardDescription>Manage emergency status and track route</CardDescription>
            </CardHeader>
          </Card>

          <Card
            onClick={() => navigate('/hospital')}
            className="cursor-pointer group border-border hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1"
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Hospital Dashboard</CardTitle>
              <CardDescription>Monitor incoming ambulances and ETAs</CardDescription>
            </CardHeader>
          </Card>

          {profile?.role === 'admin' && (
            <Card
              onClick={() => navigate('/admin')}
              className="cursor-pointer group border-border hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300 hover:-translate-y-1"
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-amber-500" />
                </div>
                <CardTitle>Admin Dashboard</CardTitle>
                <CardDescription>Manage drivers and ambulances</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
