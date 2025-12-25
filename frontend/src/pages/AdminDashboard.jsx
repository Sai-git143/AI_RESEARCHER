import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Check, X, Loader2, User } from 'lucide-react';
import { Button } from '../components/ui';

export default function AdminDashboard() {
    const { user } = useAuth();
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchPending();
    }, []);

    const fetchPending = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/admin/pending', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPendingUsers(data);
            }
        } catch (error) {
            console.error("Failed to fetch pending", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (userId) => {
        setActionLoading(userId);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/v1/admin/approve/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                // Remove from list
                setPendingUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert("Failed to approve");
            }
        } catch (error) {
            console.error("Approve failed", error);
        } finally {
            setActionLoading(null);
        }
    };

    if (!user?.is_superuser) {
        return (
            <div className="flex h-[80vh] items-center justify-center text-center">
                <div>
                    <Shield className="h-16 w-16 text-slate-700 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-slate-400">Access Restricted</h1>
                    <p className="text-slate-500">You do not have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="h-8 w-8 text-purple-500" /> Admin Dashboard
                    </h1>
                    <p className="text-slate-400">Manage pending subscription approvals</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-lg">
                    <span className="text-slate-400 text-sm">Pending Requests: </span>
                    <span className="font-bold text-white text-lg ml-2">{pendingUsers.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-500">Loading requests...</div>
            ) : pendingUsers.length === 0 ? (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-16 text-center">
                    <Check className="h-12 w-12 text-green-500/20 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-slate-300">All Caught Up!</h3>
                    <p className="text-slate-500 mt-2">No pending subscription requests found.</p>
                </div>
            ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-slate-950/50 text-slate-400 text-sm uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-medium">User</th>
                                <th className="p-4 font-medium">Transaction ID (UTR)</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                            {pendingUsers.map(u => (
                                <tr key={u.id} className="hover:bg-slate-800/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center">
                                                <User className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white">{u.full_name || 'No Name'}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-cyan-400">
                                        {u.transaction_id}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs font-medium border border-yellow-500/20">
                                            Pending Verification
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                onClick={() => handleApprove(u.id)}
                                                disabled={actionLoading === u.id}
                                                className="bg-green-600 hover:bg-green-500 text-white h-8 text-xs"
                                            >
                                                {actionLoading === u.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Check className="h-3 w-3 mr-1" />}
                                                Approve
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
