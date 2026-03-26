import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building2, ShieldAlert, KeyRound, Mail, Lock, User, ArrowLeft, Ambulance, Shield } from 'lucide-react';
import { UserRole } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import Logo from '@/components/Logo';

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const role: UserRole = 'hospital';

  if (user) {
    navigate('/');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast({ title: 'Sign In Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!', description: 'Successfully signed in.' });
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp(email, password, fullName, role);
    if (error) {
      toast({ title: 'Sign Up Failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Account Created!', description: 'You can now sign in.' });
      navigate('/');
    }
    setLoading(false);
  };

  const demoAccounts = [
    {
      label: 'Driver Account',
      email: 'manthan@gmail.com',
      password: 'Manthan123',
      icon: Ambulance,
      color: 'text-emergency',
      bg: 'bg-emergency/10',
      border: 'border-emergency/30',
      hoverBg: 'hover:bg-emergency/20',
      emoji: '🚑',
    },
    {
      label: 'Hospital Account',
      email: 'puneet@gmail.com',
      password: 'Puneet123',
      icon: Building2,
      color: 'text-primary',
      bg: 'bg-primary/10',
      border: 'border-primary/30',
      hoverBg: 'hover:bg-primary/20',
      emoji: '🏥',
    },
    {
      label: 'Admin Account',
      email: 'hardik@gmail.com',
      password: 'Hardik123',
      icon: Shield,
      color: 'text-accent',
      bg: 'bg-accent/10',
      border: 'border-accent/30',
      hoverBg: 'hover:bg-accent/20',
      emoji: '👨‍💼',
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--gradient-hero)' }}
    >
      {/* ── Animated background orbs ── */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-accent/8 blur-[100px] animate-pulse pointer-events-none" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/4 blur-[120px] pointer-events-none" />

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(hsl(185 100% 50% / 1) 1px, transparent 1px), linear-gradient(90deg, hsl(185 100% 50% / 1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />

      {/* ── Back to home ── */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to home
      </Link>

      {/* ── Main card ── */}
      <div className="relative z-10 w-full max-w-md animate-fadeInUp">
        {/* Logo + heading */}
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size="lg" showText={false} className="!-mt-0 mb-4 [&_img]:!w-36 [&_img]:!h-36" />
          <h1 className="text-3xl font-extrabold text-foreground tracking-tight">MediRoute AI</h1>
          <p className="text-muted-foreground mt-1 text-sm">Smart Ambulance Navigation System</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border/60 bg-card/70 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">

          {/* ── Demo Access Section ── */}
          <div className="p-6 pb-4 border-b border-border/40">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
                <KeyRound className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground">Quick Demo Access</span>
              <span className="ml-auto text-xs text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full">Click to fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.label}
                  type="button"
                  onClick={() => { setEmail(acc.email); setPassword(acc.password); }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${acc.border} ${acc.bg} ${acc.hoverBg} transition-all duration-200 hover:scale-[1.04] hover:shadow-lg group cursor-pointer`}
                >
                  <span className="text-xl">{acc.emoji}</span>
                  <acc.icon className={`w-4 h-4 ${acc.color}`} />
                  <span className={`text-[10px] font-semibold ${acc.color} text-center leading-tight`}>
                    {acc.label.replace(' Account', '')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── Tabs ── */}
          <div className="p-6">
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/40 border border-border/40 rounded-xl p-1">
                <TabsTrigger
                  value="signin"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground font-semibold transition-all"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md text-muted-foreground font-semibold transition-all"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>

              {/* ── SIGN IN ── */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-email" className="text-sm font-medium text-foreground/80">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signin-password" className="text-sm font-medium text-foreground/80">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="pl-10 bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
                    style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Signing In…
                      </span>
                    ) : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* ── SIGN UP ── */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-name" className="text-sm font-medium text-foreground/80">
                      Full Name
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="pl-10 bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-email" className="text-sm font-medium text-foreground/80">
                      Email address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="pl-10 bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="signup-password" className="text-sm font-medium text-foreground/80">
                      Password
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pl-10 bg-muted/40 border-border/50 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all rounded-xl h-11"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <Building2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Hospital Staff Account</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        <ShieldAlert className="w-3 h-3 inline mr-1 text-warning" />
                        Ambulance driver accounts are pre-registered by administrators only.
                      </p>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-[1.02] transition-all duration-200"
                    style={{ background: 'var(--gradient-primary)', color: 'hsl(var(--primary-foreground))' }}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        Creating Account…
                      </span>
                    ) : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          By continuing, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  );
}
