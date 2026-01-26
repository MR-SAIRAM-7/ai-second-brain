import { useState, useRef } from "react";
import { Upload, X, Loader2, FileText } from "lucide-react";
import { Button } from "./ui/Button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "./ui/Card";
import api from "../api/axios";
import useNoteStore from "../store/useNoteStore";

export default function PDFUpload({ onClose }) {
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);
    const fetchNotes = useNoteStore((state) => state.fetchNotes);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.type === "application/pdf") {
            setFile(selectedFile);
            setError(null);
        } else {
            setError("Please select a PDF file");
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            await api.post("/upload", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            // Refresh notes to show the new one
            await fetchNotes();
            onClose(); // Close modal
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || "Failed to upload PDF");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <Card className="w-full max-w-md bg-gray-900 border-gray-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Upload PDF</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} disabled={uploading}>
                        <X size={20} />
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div
                        className="border-2 border-dashed border-gray-700 rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                        onClick={() => !uploading && fileInputRef.current?.click()}
                    >
                        {file ? (
                            <div className="flex flex-col items-center gap-2 text-blue-400">
                                <FileText size={40} />
                                <p className="text-sm text-center px-4 break-all">{file.name}</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-gray-500">
                                <Upload size={40} />
                                <p className="text-sm">Click to select PDF</p>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".pdf"
                            onChange={handleFileChange}
                            disabled={uploading}
                        />
                    </div>

                    {error && <p className="text-red-400 text-sm">{error}</p>}

                    <Button
                        onClick={handleUpload}
                        className="w-full"
                        disabled={!file || uploading}
                    >
                        {uploading ? (
                            <div className="flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin" />
                                <span>Processing...</span>
                            </div>
                        ) : (
                            "Upload"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
