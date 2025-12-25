import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Loader2, Bot, FileText } from 'lucide-react';
import { Button, Input } from './ui';
import { workspaceService } from '../services/workspaceService';
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function DeepResearch({ projectId }) {
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        loadHistory();
    }, [projectId]);

    const loadHistory = async () => {
        try {
            const history = await workspaceService.getMessages(projectId, 'research');
            // Map DB role 'assistant'/'user' to UI format if needed, though they match
            setMessages(history.map(msg => ({
                role: msg.role,
                content: msg.content
            })));
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleResearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery("");
        setLoading(true);

        try {
            const data = await workspaceService.deepResearch(projectId, userMsg.content);
            const aiMsg = { role: 'assistant', content: data.report };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Research error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "## Error\nSorry, I failed to generate the research report." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-900/10 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-purple-900/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    <h3 className="font-medium text-purple-100">Deep Research Agent</h3>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                    Pro
                </span>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-16 px-6">
                        <div className="w-20 h-20 bg-purple-500/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-purple-500/20">
                            <FileText className="h-10 w-10 text-purple-400 opacity-80" />
                        </div>
                        <h4 className="text-lg font-medium text-slate-300 mb-2">Detailed Research Reports</h4>
                        <p className="max-w-sm mx-auto leading-relaxed">
                            Enter a complex problem statement. I will read multiple documents, synthesize the information, and write a structured report for you.
                        </p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex flex-col", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={clsx(
                            "max-w-[90%] rounded-2xl p-5 text-sm my-2",
                            msg.role === 'user'
                                ? "bg-slate-800 text-slate-200 border border-white/5"
                                : "bg-white/5 border border-purple-500/20 text-slate-200 w-full"
                        )}>
                            <div className="flex items-center gap-2 mb-3 opacity-60 text-xs uppercase tracking-wider font-bold">
                                {msg.role === 'user' ? "Problem Statement" : "Research Report"}
                            </div>



                            <div className="prose prose-invert prose-sm max-w-none prose-headings:text-purple-200 prose-a:text-purple-400 prose-strong:text-slate-100 leading-relaxed">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {msg.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-center py-8">
                        <div className="flex flex-col items-center gap-3 animate-pulse">
                            <Sparkles className="h-8 w-8 text-purple-500 spin-slow" />
                            <span className="text-sm text-purple-300 font-medium">Synthesizing comprehensive report...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-slate-900/80 backdrop-blur-md">
                <form onSubmit={handleResearch} className="flex gap-3">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Define your research problem statement..."
                        disabled={loading}
                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:ring-purple-500/50"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
