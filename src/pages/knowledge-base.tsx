import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Trash2,
  FileText,
  Search,
  XCircle,
} from "lucide-react";

type Document = {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
};

export default function KnowledgeBasePage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents when component mounts
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      // Using mock data as in the original
      const mockDocuments: Document[] = [
        { id: '1', name: 'company_policy.pdf', type: 'pdf', size: '1.2 MB', uploadedAt: '2025-02-15T10:30:00Z' },
        { id: '2', name: 'product_manual.txt', type: 'txt', size: '256 KB', uploadedAt: '2025-02-20T14:15:00Z' },
        { id: '3', name: 'customer_data.csv', type: 'csv', size: '3.4 MB', uploadedAt: '2025-03-05T09:45:00Z' },
        { id: '4', name: 'technical_specs.txt', type: 'txt', size: '512 KB', uploadedAt: '2025-03-10T16:20:00Z' },
      ];
      setDocuments(mockDocuments);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();
    let validFiles = true;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';

      if (!['txt', 'pdf', 'csv'].includes(fileType)) {
        setUploadError('Only TXT, PDF, and CSV files are allowed.');
        validFiles = false;
        break;
      }
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size should not exceed 10MB.');
        validFiles = false;
        break;
      }
      formData.append('files', file);
    }

    if (!validFiles) {
      setIsUploading(false);
      // Clear file input if validation failed for one of the files
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call

      const newDocuments: Document[] = Array.from(files).map((file, index) => ({
        id: `new-${Date.now()}-${index}`,
        name: file.name,
        type: file.name.split('.').pop()?.toLowerCase() || '',
        size: formatFileSize(file.size),
        uploadedAt: new Date().toISOString()
      }));

      setDocuments(prevDocs => [...prevDocs, ...newDocuments]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const getFileIcon = (fileType: string) => {
    // Consistent icon styling, align-middle helps with vertical centering next to text-sm.
    const iconClass = "inline-block mr-2 h-4 w-4 align-middle text-muted-foreground";
    switch (fileType.toLowerCase()) {
      case 'pdf': return <FileText className={iconClass} />;
      case 'csv': return <FileText className={iconClass} />; // Could use a different icon for CSV if available
      case 'txt': return <FileText className={iconClass} />;
      default: return <FileText className={iconClass} />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-8 md:px-6 md:py-10"> {/* Adjusted padding for responsiveness */}
      <div className="mx-auto w-full max-w-4xl"> {/* Slightly increased max-width for better table layout */}
        <h1 className="text-xl font-semibold mb-4">Knowledge Base Management</h1> {/* font-bold to font-semibold, reduced mb */}
        <p className="text-sm text-muted-foreground mb-6"> {/* Changed from text-l to text-sm */}
          Upload and manage documents for the chatbot's knowledge base.
          Supported file types: TXT, PDF, CSV. Maximum file size: 10MB.
        </p>

        {uploadError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert"> {/* Added text-sm */}
            <span className="block sm:inline"><XCircle className="inline-block mr-2 h-4 w-4 align-middle" />{uploadError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mb-6"> {/* Reduced gap slightly */}
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /> {/* Centered icon */}
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 text-sm" /* Ensured input text is sm */
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon" /* Changed to icon size for better fit */
                className="absolute right-1.5 top-1/2 -translate-y-1/2 h-6 w-6" /* Adjusted positioning and size */
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="relative">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".txt,.pdf,.csv"
              onChange={handleUpload}
              className="absolute inset-0 z-10 w-full h-full opacity-0 cursor-pointer"
              ref={fileInputRef}
              disabled={isUploading} // Disable native input when uploading
            />
            {/* Ensure label covers the button for clickability */}
            <label htmlFor="file-upload" className="cursor-pointer">
              <Button asChild disabled={isUploading} className="w-full sm:w-auto">
                <span className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="border rounded-lg overflow-x-auto"> {/* Added rounded-lg and overflow-x-auto for tables */}
          <table className="w-full table-auto min-w-[600px]"> {/* Added min-width to prevent excessive squishing */}
            <thead className="bg-muted/50">
              <tr>
                {/* Changed from text-l to text-sm, adjusted padding */}
                <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Name</th>
                <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Type</th>
                <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Size</th>
                <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Uploaded</th>
                <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => (
                  <tr key={doc.id} className="border-t hover:bg-muted/50">
                    {/* Added text-sm, adjusted padding */}
                    <td className="px-3 py-3 text-sm document-name align-middle">
                      {getFileIcon(doc.type)} {doc.name}
                    </td>
                    <td className="px-3 py-3 text-sm document-type align-middle">{doc.type.toUpperCase()}</td>
                    <td className="px-3 py-3 text-sm document-size align-middle">{doc.size}</td>
                    <td className="px-3 py-3 text-sm document-date align-middle">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-3 py-3 text-sm document-actions align-middle text-right sm:text-left"> {/* Adjusted text alignment for actions */}
                      <Button
                        variant="destructive"
                        size="sm" // sm size for buttons is common and good
                        onClick={() => handleDelete(doc.id)}
                        title="Delete document"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  {/* Added text-sm */}
                  <td colSpan={5} className="px-3 py-10 text-sm text-muted-foreground text-center">
                    {searchTerm
                      ? 'No documents matching your search.' // Added a period
                      : 'No documents in the knowledge base. Upload some to get started!'} {/* More engaging empty state */}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}