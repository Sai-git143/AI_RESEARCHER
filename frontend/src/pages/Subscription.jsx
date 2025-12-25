import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Check, Sparkles, Shield, Lock, CreditCard, Loader2 } from 'lucide-react';
import { Button, Input } from '../components/ui';

export default function Subscription() {
    const { user, login } = useAuth(); // We'll trigger a re-fetch if possible or just rely on reload
    const [utr, setUtr] = useState("");
    const [upgrading, setUpgrading] = useState(false);

    // CONFIGURATION FROM ENV
    const UPI_ID = import.meta.env.VITE_UPI_ID || "sai_aravind@upi";

    // Use local static image
    const qrUrl = "/upi_qr.png";

    const handleUpgrade = async () => {
        if (!utr || utr.length < 4) {
            alert("Please enter a valid Transaction ID / UTR");
            return;
        }

        setUpgrading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch('/api/v1/auth/upgrade', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ transaction_id: utr })
            });

            if (res.ok) {
                alert("Payment details submitted! Verification will take approx 5 mins. 🕒");
                window.location.reload(); // Reload to refresh user state
            } else {
                alert("Submission failed. Please try again.");
            }
        } catch (error) {
            console.error("Upgrade failed", error);
            alert("Payment failed. Please try again.");
        } finally {
            setUpgrading(false);
        }
    };

    const isPending = user?.transaction_id && !user?.is_premium;

    return (
        <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-cyan-400">
                    Subscription & Billing
                </h1>
                <p className="text-slate-400">
                    Manage your plan and access advanced research capabilities
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mt-8">
                {/* Free Plan Card */}
                <div className={`relative p-8 rounded-2xl border ${!user?.is_premium ? 'bg-slate-800/50 border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'bg-slate-900/30 border-white/5 opacity-50'} transition-all`}>
                    <div className="absolute top-4 right-4">
                        {!user?.is_premium && <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-xs font-bold border border-cyan-500/30">CURRENT PLAN</span>}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Free Plan</h3>
                    <div className="text-3xl font-bold text-slate-200 mb-6">₹0<span className="text-sm font-normal text-slate-500">/forever</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center text-slate-300"><Check className="h-5 w-5 text-cyan-400 mr-3" /> 2 Projects Limit</li>
                        <li className="flex items-center text-slate-300"><Check className="h-5 w-5 text-cyan-400 mr-3" /> Basic Research Agent</li>
                        <li className="flex items-center text-slate-300"><Check className="h-5 w-5 text-cyan-400 mr-3" /> Standard Support</li>
                    </ul>

                    <Button disabled className="w-full bg-slate-800 text-slate-400 cursor-not-allowed">
                        {!user?.is_premium ? "Active" : "Downgrade"}
                    </Button>
                </div>

                {/* Premium Plan Card */}
                <div className={`relative p-8 rounded-2xl border ${user?.is_premium ? 'bg-slate-800/80 border-purple-500 shadow-xl shadow-purple-500/20' : 'bg-gradient-to-br from-slate-900 via-slate-900 to-purple-900/20 border-purple-500/30'} transition-all`}>
                    {user?.is_premium && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                            ACTIVE SUBSCRIPTION
                        </div>
                    )}

                    <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        Premium Plan <Sparkles className="h-4 w-4 text-purple-400" />
                    </h3>
                    <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-6">₹1<span className="text-sm font-normal text-slate-500">/lifetime</span></div>

                    <ul className="space-y-4 mb-8">
                        <li className="flex items-center text-white"><Check className="h-5 w-5 text-purple-400 mr-3" /> Unlimited Projects</li>
                        <li className="flex items-center text-white"><Check className="h-5 w-5 text-purple-400 mr-3" /> Advanced Deep Research</li>
                        <li className="flex items-center text-white"><Check className="h-5 w-5 text-purple-400 mr-3" /> Priority Processing</li>
                        <li className="flex items-center text-white"><Check className="h-5 w-5 text-purple-400 mr-3" /> Premium Support</li>
                    </ul>

                    {user?.is_premium ? (
                        <Button className="w-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30">
                            Subscription Active
                        </Button>
                    ) : isPending ? (
                        <div className="w-full p-6 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-center">
                            <h4 className="text-yellow-400 font-bold mb-2 flex items-center justify-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin" /> Verification Pending
                            </h4>
                            <p className="text-sm text-yellow-200/70">
                                Your payment details have been received. Verification usually takes 5-10 minutes.
                            </p>
                            <p className="text-xs text-yellow-200/50 mt-2 font-mono">
                                Ref: {user?.transaction_id}
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-slate-950/50 rounded-xl border border-white/10">
                            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-green-400" /> Secure Payment Gateway
                            </h4>

                            <div className="flex flex-col items-center mb-4">
                                <div className="bg-white p-2 rounded-lg mb-2">
                                    <img src={qrUrl} alt="UPI QR" className="w-32 h-32" />
                                </div>
                                <p className="text-xs text-slate-500 font-mono">{UPI_ID}</p>
                            </div>

                            <div className="space-y-3">
                                <Input
                                    placeholder="Enter Transaction ID (UTR)"
                                    value={utr}
                                    onChange={(e) => setUtr(e.target.value)}
                                    className="bg-slate-900 border-slate-700 text-center"
                                />
                                <Button
                                    onClick={handleUpgrade}
                                    disabled={upgrading || !utr}
                                    className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white"
                                >
                                    {upgrading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                    Verify Payment
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-12 text-center text-slate-500 text-sm">
                <p className="flex items-center justify-center gap-2">
                    <Shield className="h-4 w-4" />
                    Payments are 100% secure and encrypted.
                </p>
            </div>
        </div>
    );
}
