import { useState, useRef, useEffect } from 'react';
import { Send, User as UserIcon, Bot, Loader2, FileText } from 'lucide-react';
import { Button, Input } from './ui';
import { workspaceService } from '../services/workspaceService';
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatInterface({ projectId, selectedDocIds = [] }) {
    const [messages, setMessages] = useState([]);
    const [query, setQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        loadHistory();
    }, [projectId]);

    const loadHistory = async () => {
        try {
            const history = await workspaceService.getMessages(projectId, 'chat');
            setMessages(history);
        } catch (error) {
            console.error("Failed to load history", error);
        }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setQuery("");
        setLoading(true);

        try {
            const data = await workspaceService.chat(projectId, userMsg.content, selectedDocIds);
            const aiMsg = { role: 'assistant', content: data.answer };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            console.error("Chat error", error);
            setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I encountered an error providing an answer." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 rounded-2xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-cyan-400" />
                    <h3 className="font-medium text-slate-200">Chat Assistant</h3>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.length === 0 && (
                    <div className="text-center text-slate-500 mt-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bot className="h-8 w-8 opacity-50" />
                        </div>
                        <p>Ask questions about your research papers.</p>
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                        <div className={clsx(
                            "max-w-[85%] rounded-2xl p-4 text-sm",
                            msg.role === 'user'
                                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                                : "bg-slate-800 text-slate-200"
                        )}>
                            <div className="flex items-center gap-2 mb-2 opacity-50 text-xs uppercase tracking-wider font-semibold">
                                {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                                <span>{msg.role}</span>
                            </div>



                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50">
                                {msg.role === 'assistant' ? (
                                    // Custom rendering for Assistant to support citations
                                    <div>
                                        {msg.content.split(/(\[Source: .*?, Page: \d+\])/g).map((part, i) => {
                                            const match = part.match(/\[Source: (.*?), Page: (\d+)\]/);
                                            if (match) {
                                                const [_, source, page] = match;
                                                return (
                                                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 mx-1 rounded-md bg-cyan-900/30 border border-cyan-500/30 text-cyan-200 text-xs font-medium cursor-help hover:bg-cyan-900/50 transition-colors" title={`Source: ${source}, Page: ${page}`}>
                                                        <FileText size={10} className="text-cyan-400" />
                                                        {source} <span className="text-cyan-500">p.{page}</span>
                                                    </span>
                                                );
                                            }
                                            // Render regular text as Markdown
                                            return <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={{ p: ({ node, ...props }) => <span {...props} /> }}>{part}</ReactMarkdown>;
                                        })}
                                    </div>
                                ) : (
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-slate-800 rounded-2xl p-4 flex items-center gap-3">
                            <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                            <span className="text-sm text-slate-400">Thinking...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/5 bg-slate-900/50 backdrop-blur-md">
                <form onSubmit={handleSend} className="flex space-x-2 relative">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a quick question..."
                        disabled={loading}
                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                    <Button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="bg-cyan-600 hover:bg-cyan-500"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
