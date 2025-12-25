import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Sparkles, ArrowLeft } from 'lucide-react';

const ProjectHome = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center text-slate-400 hover:text-white mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back to Dashboard
                </button>

                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-2">
                    Project Workspace
                </h1>
                <p className="text-slate-400 mb-12 text-lg">
                    Choose how you want to interact with your research.
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Chat Assistant Option */}
                    <div
                        onClick={() => navigate(`/workspace/${projectId}/chat`)}
                        className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-6 h-6 rotate-180 text-blue-400" />
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-8 h-8 text-blue-400" />
                        </div>

                        <h2 className="text-2xl font-semibold mb-3 text-white group-hover:text-blue-300 transition-colors">
                            Chat Assistant
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            Interact with your documents using RAG. Ideal for quick questions, clarifications, and exploring specific details within your papers.
                        </p>
                    </div>

                    {/* Deep Researcher Option */}
                    <div
                        onClick={() => navigate(`/workspace/${projectId}/research`)}
                        className="group relative overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-8 cursor-pointer hover:bg-white/10 transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/20"
                    >
                        <div className="absolute top-0 right-0 p-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-6 h-6 rotate-180 text-purple-400" />
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                            <Sparkles className="w-8 h-8 text-purple-400" />
                        </div>

                        <h2 className="text-2xl font-semibold mb-3 text-white group-hover:text-purple-300 transition-colors">
                            Deep Researcher
                        </h2>
                        <p className="text-slate-400 leading-relaxed">
                            Generate comprehensive formatting reports. The AI agent analyzes multiple sources to identify gaps, trends, and future directions.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProjectHome;
