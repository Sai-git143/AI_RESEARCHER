import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Loader2, AlertTriangle } from 'lucide-react';
import { Button, Input } from '../components/ui';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, logout } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Perform standard login to get token
            const data = await login(email, password);

            // 2. We need to verify if this user is actually an admin
            // The login function in AuthContext already calls fetchUser to update state
            // But we might need to manually check the response if login returns data
            // However, fetchUser updates the state asynchronously.

            // Let's manually fetch 'me' to be absolutely sure before redirecting
            const items = localStorage.getItem('user');
            let isAdmin = false;

            if (data && data.access_token) {
                const res = await fetch('/api/v1/auth/me', {
                    headers: { 'Authorization': `Bearer ${data.access_token}` }
                });
                if (res.ok) {
                    const userData = await res.json();
                    if (userData.is_superuser) {
                        isAdmin = true;
                    }
                }
            }

            if (isAdmin) {
                navigate('/admin');
            } else {
                // Not an admin - kick them out
                logout();
                setError('Access Denied: You do not have administrator privileges.');
            }
        } catch (err) {
            setError('Invalid credentials or server error.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-red-900/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-md w-full bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex p-4 rounded-full bg-slate-800/50 mb-4 border border-slate-700 shadow-inner">
                        <Shield className="h-10 w-10 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Portal</h1>
                    <p className="text-slate-500 text-sm mt-2">Restricted Access Authorization</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400 text-sm animate-in slide-in-from-top-2">
                        <AlertTriangle className="h-5 w-5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">ADMIN EMAIL</label>
                        <div className="relative">
                            <Shield className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <Input
                                type="email"
                                placeholder="admin@domain.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 bg-slate-950 border-slate-800 focus:border-red-500/50 focus:ring-red-500/20"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-slate-400 ml-1">PASSPHRASE</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 bg-slate-950 border-slate-800 focus:border-red-500/50 focus:ring-red-500/20"
                                required
                            />
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 shadow-lg shadow-red-900/20 transition-all border border-red-500/50"
                    >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Lock className="mr-2 h-4 w-4" />}
                        {loading ? 'Authenticating...' : 'Secure Login'}
                    </Button>
                </form>

                <div className="mt-8 text-center border-t border-slate-800 pt-6">
                    <p className="text-xs text-slate-600">
                        Unauthorized access attempts will be logged and reported.
                    </p>
                </div>
            </div>
        </div>
    );
}
