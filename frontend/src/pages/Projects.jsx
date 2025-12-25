import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText, Sparkles, Loader2 } from 'lucide-react';
import { projectService } from '../services/projectService';
import { Button, Input } from '../components/ui';

export default function Projects() {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', description: '' });

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const [utr, setUtr] = useState("");

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await projectService.getAll();
            setProjects(data);
        } catch (error) {
            console.error('Failed to load projects', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newProject.title) return;
        try {
            await projectService.create(newProject.title, newProject.description);
            setNewProject({ title: '', description: '' });
            setShowCreate(false);
            loadProjects();
        } catch (error) {
            if (error.response && error.response.status === 402) {
                setShowPaymentModal(true);
            } else {
                console.error('Failed to create project', error);
            }
        }
    };

    // CONFIGURATION: Replace with your actual UPI ID and Name
    const UPI_ID = "saiaravind@upi";
    const PAYEE_NAME = "AI Researcher";
    const AMOUNT = "1.00";

    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(PAYEE_NAME)}&am=${AMOUNT}&cu=INR`;

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
                setShowPaymentModal(false);
                alert("Payment Verified! Premium Unlocked. 🚀");
                await projectService.create(newProject.title, newProject.description);
                setNewProject({ title: '', description: '' });
                setShowCreate(false);
                loadProjects();
            } else {
                alert("Verification failed. Please check the ID.");
            }
        } catch (error) {
            console.error("Upgrade failed", error);
            alert("Payment failed. Please try again.");
        } finally {
            setUpgrading(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.preventDefault(); // Prevent navigation
        if (!window.confirm('Are you sure?')) return;
        try {
            await projectService.delete(id);
            loadProjects();
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    if (loading) return <div>Loading projects...</div>;

    return (
        <div className="space-y-8 animate-fade-in relative">
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in zoom-in duration-200">
                    <div className="bg-slate-900 border border-purple-500/30 p-8 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden flex flex-col items-center">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-cyan-500 to-purple-500" />

                        <h2 className="text-xl font-bold text-white mb-6">Scan to Pay ₹1</h2>

                        <div className="bg-white p-4 rounded-xl shadow-lg shadow-purple-500/10 mb-6">
                            <img src={qrUrl} alt="UPI QR Code" className="w-48 h-48 mix-blend-multiply" />
                        </div>

                        <div className="space-y-4 w-full">
                            <div className="text-center">
                                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">To UPI ID</p>
                                <div className="flex justify-center items-center gap-2 bg-slate-800 py-2 px-4 rounded-lg border border-slate-700">
                                    <span className="text-cyan-400 font-mono select-all">{UPI_ID}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs text-slate-400 block ml-1">Enter Transaction ID / UTR</label>
                                <Input
                                    placeholder="e.g. 123456789012"
                                    value={utr}
                                    onChange={(e) => setUtr(e.target.value)}
                                    className="bg-slate-800 border-slate-700 text-white text-center tracking-widest"
                                />
                            </div>

                            <Button
                                onClick={handleUpgrade}
                                disabled={upgrading || !utr}
                                className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold h-11"
                            >
                                {upgrading ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                {upgrading ? "Verifying..." : "Verify Payment"}
                            </Button>

                            <Button
                                onClick={() => setShowPaymentModal(false)}
                                variant="ghost"
                                className="w-full text-slate-500 text-xs hover:text-white"
                            >
                                Cancel Transaction
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-purple-500">
                        My Projects
                    </h1>
                    <p className="text-slate-400 mt-1">Manage and access your research workspaces</p>
                </div>
                <Button
                    onClick={() => setShowCreate(!showCreate)}
                    className="bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 text-white border-0"
                >
                    <Plus className="mr-2 h-4 w-4" /> New Project
                </Button>
            </div>

            {showCreate && (
                <div className="glass-panel p-6 rounded-2xl border-white/10 animate-slide-up">
                    <h2 className="text-lg font-semibold mb-4 text-white">Create New Project</h2>
                    <form onSubmit={handleCreate} className="space-y-4">
                        <Input
                            placeholder="Project Title"
                            value={newProject.title}
                            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                            required
                            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50"
                        />
                        <Input
                            placeholder="Description (Optional)"
                            value={newProject.description}
                            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                            className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 focus:ring-cyan-500/50"
                        />
                        <div className="flex justify-end space-x-3">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setShowCreate(false)}
                                className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700"
                            >
                                Cancel
                            </Button>
                            <Button type="submit" className="bg-cyan-600 hover:bg-cyan-500">
                                Create Project
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((project) => (
                    <Link
                        key={project.id}
                        to={`/workspace/${project.id}`}
                        className="group relative p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/5 hover:border-cyan-500/30 hover:bg-white/[0.07] transition-all duration-300 hover:-translate-y-1 shadow-lg hover:shadow-cyan-500/10"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/10 to-blue-600/10 border border-white/5 group-hover:from-cyan-500/20 group-hover:to-blue-600/20 transition-colors">
                                <FileText className="h-6 w-6 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                            </div>
                            <button
                                onClick={(e) => handleDelete(project.id, e)}
                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete Project"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>

                        <h3 className="font-semibold text-lg text-slate-100 group-hover:text-cyan-400 transition-colors truncate mb-2">
                            {project.title}
                        </h3>

                        <p className="text-sm text-slate-400 line-clamp-2 h-10">
                            {project.description || "No description provided."}
                        </p>

                        <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-slate-500">
                            <span>Last updated</span>
                            <span>{new Date(project.created_at).toLocaleDateString()}</span>
                        </div>
                    </Link>
                ))}
                {projects.length === 0 && !showCreate && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Plus className="h-8 w-8 text-slate-600" />
                        </div>
                        <p className="text-lg font-medium text-slate-400">No projects yet</p>
                        <p className="text-sm mb-6">Create your first research project to get started</p>
                        <Button onClick={() => setShowCreate(true)} variant="outline" className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
                            Create Project
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
