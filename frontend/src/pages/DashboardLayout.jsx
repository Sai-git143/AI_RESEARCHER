import { Outlet, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, CreditCard, Shield } from 'lucide-react';

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px]" />
                <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-blue-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-cyan-900/10 rounded-full blur-[100px]" />
            </div>

            <nav className="relative z-10 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
                                <BookOpen className="h-6 w-6 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                AI Researcher
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            {user?.is_superuser && (
                                <Link to="/admin" className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-2 text-sm font-bold bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                                    <Shield className="h-4 w-4" /> Admin
                                </Link>
                            )}
                            <Link to="/subscription" className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-sm font-medium">
                                <CreditCard className="h-4 w-4" /> Subscription
                            </Link>
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-medium text-slate-200">{user?.full_name}</p>
                                <p className="text-xs text-slate-500">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-white/10"
                                title="Sign out"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </nav >
            <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
                {children || <Outlet />}
            </main>
        </div >
    );
}
