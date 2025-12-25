import { useState, useRef } from 'react';
import { Upload, File, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../components/ui';
import { workspaceService } from '../services/workspaceService';

export default function PDFUploader({ projectId, onUploadComplete }) {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(true);
        try {
            await workspaceService.uploadDocuments(projectId, files);
            if (onUploadComplete) onUploadComplete();
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload failed. Please check the files and try again.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900">Research Papers</h3>
                <div>
                    <input
                        type="file"
                        multiple
                        accept=".pdf"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        id="pdf-upload"
                    />
                    <label htmlFor="pdf-upload">
                        <Button
                            type="button"
                            variant="outline"
                            className="cursor-pointer"
                            disabled={uploading}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                            {uploading ? "Uploading..." : "Upload PDF"}
                        </Button>
                    </label>
                </div>
            </div>
        </div>
    );
}
