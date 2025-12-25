import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FileText, Sparkles, LayoutDashboard, MessageSquare, ArrowLeft, Loader2, Upload, Trash2, CheckSquare, Square } from 'lucide-react';
import { projectService } from '../services/projectService';
import { workspaceService } from '../services/workspaceService';
import ChatInterface from '../components/ChatInterface';
import DeepResearch from '../components/DeepResearch'; // Import the new component
import { useToast } from '../context/ToastContext';

export default function Workspace() {
    const { projectId } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [documents, setDocuments] = useState([]);
    const [selectedDocIds, setSelectedDocIds] = useState(new Set());
    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingDocs, setIsLoadingDocs] = useState(true);

    // Determine mode based on URL path
    const isResearchMode = location.pathname.endsWith('/research');
    const modeTitle = isResearchMode ? 'Deep Researcher' : 'Chat Assistant';

    useEffect(() => {
        loadDocuments();
    }, [projectId]);

    const loadDocuments = async () => {
        try {
            const docs = await workspaceService.getDocuments(projectId);
            setDocuments(docs);
            // Default select all new documents
            const allIds = new Set(docs.map(d => d.id));
            setSelectedDocIds(allIds);
        } catch (error) {
            console.error('Failed to load documents:', error);
            toast({
                title: "Error",
                description: "Failed to load documents",
                variant: "destructive",
            });
        } finally {
            setIsLoadingDocs(false);
        }
    };

    const toggleDocument = (docId) => {
        const newSelected = new Set(selectedDocIds);
        if (newSelected.has(docId)) {
            newSelected.delete(docId);
        } else {
            newSelected.add(docId);
        }
        setSelectedDocIds(newSelected);
    };

    const handleDeleteDocument = async (docId, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this document?")) return;

        try {
            await workspaceService.deleteDocument(projectId, docId);
            toast({ title: "Deleted", description: "Document removed." });
            loadDocuments();
        } catch (error) {
            console.error("Delete failed", error);
            toast({ title: "Error", description: "Failed to delete document", variant: "destructive" });
        }
    };

    const handleFileUpload = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length === 0) return;

        setIsUploading(true);
        try {
            await workspaceService.uploadDocuments(projectId, files);
            toast({
                title: "Success",
                description: "Documents uploaded successfully",
            });
            loadDocuments();
        } catch (error) {
            console.error('Upload failed:', error);
            toast({
                title: "Error",
                description: "Failed to upload documents",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden">
            {/* Left Sidebar - Documents */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-slate-900/50 backdrop-blur-xl">
                <div className="p-6 border-b border-white/10">
                    <button
                        onClick={() => navigate(`/workspace/${projectId}`)}
                        className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Switch Mode
                    </button>
                    <h2 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent flex items-center gap-2">
                        {isResearchMode ? <Sparkles className="w-5 h-5 text-purple-400" /> : <MessageSquare className="w-5 h-5 text-blue-400" />}
                        {modeTitle}
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Documents</h3>
                        <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded-full">{documents.length}</span>
                    </div>

                    {isLoadingDocs ? (
                        <div className="flex justify-center p-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {documents.map((doc) => {
                                const isSelected = selectedDocIds.has(doc.id);
                                return (
                                    <div key={doc.id}
                                        onClick={() => toggleDocument(doc.id)}
                                        className={`group flex items-center p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-white/10 border-white/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>

                                        <div className={`mr-3 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`}>
                                            {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                                        </div>

                                        <FileText className={`w-5 h-5 mr-3 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-600'}`} />

                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-medium truncate ${isSelected ? 'text-slate-200' : 'text-slate-500'}`}>{doc.filename}</p>
                                            <p className="text-xs text-slate-500">{new Date(doc.created_at).toLocaleDateString()}</p>
                                        </div>

                                        <button
                                            onClick={(e) => handleDeleteDocument(doc.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-500/20 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                                            title="Delete Document"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                );
                            })}

                            {documents.length === 0 && (
                                <div className="text-center py-8 px-4 rounded-xl border-2 border-dashed border-white/10">
                                    <p className="text-slate-500 text-sm">No documents uploaded yet</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-white/10 bg-slate-900/80">
                    <label className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-blue-500/25 group">
                        {isUploading ? (
                            <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        ) : (
                            <Upload className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                        )}
                        <span className="font-medium">{isUploading ? 'Uploading...' : 'Upload PDF'}</span>
                        <input
                            type="file"
                            accept=".pdf"
                            multiple
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                        />
                    </label>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-slate-950/50">
                {/* Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-lg font-semibold text-slate-200">
                            Research Workspace
                        </h1>
                        <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400">
                            Project ID: {projectId}
                        </span>
                    </div>
                </header>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {isResearchMode ? (
                        <DeepResearch projectId={projectId} />
                    ) : (
                        <ChatInterface projectId={projectId} selectedDocIds={Array.from(selectedDocIds)} />
                    )}
                </div>
            </div>
        </div>
    );
};
