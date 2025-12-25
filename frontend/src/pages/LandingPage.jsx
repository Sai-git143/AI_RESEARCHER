import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Brain, Sparkles, Search, FileText, Database, Zap } from 'lucide-react';
import { Button } from '../components/ui';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-slate-950 text-white selection:bg-cyan-500/30">

            {/* Navbar */}
            <nav className="fixed w-full z-50 glass-panel border-b-0 border-white/5 bg-slate-950/80">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-lg">
                            <Brain className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            AI Researcher
                        </span>
                    </div>
                    <div className="flex gap-4">
                        <Link to="/login">
                            <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5">
                                Login
                            </Button>
                        </Link>
                        <Link to="/register">
                            <Button className="bg-cyan-600 hover:bg-cyan-500 text-white border-0 shadow-lg shadow-cyan-500/20">
                                Get Started
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute inset-0 hero-gradient animate-pulse" />

                <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col items-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-button mb-8 text-sm text-cyan-400">
                            <Sparkles className="w-4 h-4" />
                            <span>Next-Gen Research Assistant</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight">
                            Research <span className="text-gradient">Faster</span> <br />
                            Than Ever Before.
                        </h1>

                        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                            Ingest academic papers, identify critical research gaps, and generate
                            future directions instantly using our advanced RAG pipeline.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link to="/register">
                                <Button className="h-12 px-8 text-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 border-0 shadow-xl shadow-blue-500/20">
                                    Start Researching
                                    <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link to="/login">
                                <Button variant="outline" className="h-12 px-8 text-lg glass-button border-slate-700 text-slate-300 hover:text-white">
                                    Live Demo
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Database className="w-8 h-8 text-purple-400" />}
                            title="Smart Ingestion"
                            description="Upload PDFs and let our optimized RAG pipeline chunk, index, and organize your literature automatically."
                        />
                        <FeatureCard
                            icon={<Search className="w-8 h-8 text-cyan-400" />}
                            title="Gap Analysis"
                            description="Instantly compare multiple papers to find missing metrics, unexplored scenarios, and common threads."
                        />
                        <FeatureCard
                            icon={<Zap className="w-8 h-8 text-pink-400" />}
                            title="Future Directions"
                            description="Get evidence-based suggestions for your next breakthrough, grounded strictly in the provided context."
                        />
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 text-center text-slate-600 text-sm border-t border-white/5">
                <p>© 2025 AI Project Researcher. Built with FastAPI & React.</p>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass-panel p-8 rounded-2xl hover:border-cyan-500/30 transition-colors group"
    >
        <div className="mb-6 p-4 rounded-xl bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-slate-200">{title}</h3>
        <p className="text-slate-400 leading-relaxed">{description}</p>
    </motion.div>
);

export default LandingPage;
