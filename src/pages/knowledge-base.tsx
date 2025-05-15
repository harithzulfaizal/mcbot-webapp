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
      // This would be replaced with your actual API call
      // const response = await fetch('http://localhost:8080/api/knowledge-base');
      // const data = await response.json();

      // For demo, using mock data
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

    // Create FormData object to send files
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      const fileType = file.name.split('.').pop()?.toLowerCase() || '';
      if (!['txt', 'pdf', 'csv'].includes(fileType)) {
        setUploadError('Only TXT, PDF, and CSV files are allowed.');
        setIsUploading(false);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setUploadError('File size should not exceed 10MB.');
        setIsUploading(false);
        return;
      }

      formData.append('files', file);
    }

    try {
      // This would be replaced with your actual API call
      // const response = await fetch('http://localhost:8080/api/knowledge-base/upload', {
      //   method: 'POST',
      //   body: formData
      // });

      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate new documents being added
      const newDocuments: Document[] = Array.from(files).map((file, index) => {
        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
        return {
          id: `new-${Date.now()}-${index}`,
          name: file.name,
          type: fileType,
          size: formatFileSize(file.size),
          uploadedAt: new Date().toISOString()
        };
      });

      setDocuments(prevDocs => [...prevDocs, ...newDocuments]);

      // Clear file input
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
      // This would be replaced with your actual API call
      // await fetch(`http://localhost:8080/api/knowledge-base/${documentId}`, {
      //   method: 'DELETE'
      // });

      // For demo, simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update state by filtering out the deleted document
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf': return <FileText className="inline-block mr-1" />;
      case 'csv': return <FileText className="inline-block mr-1" />;
      case 'txt': return <FileText className="inline-block mr-1" />;
      default: return <FileText className="inline-block mr-1" />;
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="text-2xl font-bold mb-6">Knowledge Base Management</h1>
        <p className="text-muted-foreground mb-6">
          Upload and manage documents for the chatbot's knowledge base.
          Supported file types: TXT, PDF, CSV. Maximum file size: 10MB.
        </p>

        {uploadError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline"><XCircle className="inline-block mr-2" />{uploadError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2.5 top-2.5 h-4 w-4 p-0"
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
            />
            <label htmlFor="file-upload">
              <Button asChild disabled={isUploading}>
                <span className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </span>
              </Button>
            </label>
          </div>
        </div>

        <div className="border rounded-md overflow-hidden">
          <table className="w-full table-auto">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-4 font-semibold">Name</th>
                <th className="text-left p-4 font-semibold">Type</th>
                <th className="text-left p-4 font-semibold">Size</th>
                <th className="text-left p-4 font-semibold">Uploaded</th>
                <th className="text-left p-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(doc => (
                  <tr key={doc.id} className="border-t hover:bg-muted/50">
                    <td className="p-4 document-name">
                      {getFileIcon(doc.type)} {doc.name}
                    </td>
                    <td className="p-4 document-type">{doc.type.toUpperCase()}</td>
                    <td className="p-4 document-size">{doc.size}</td>
                    <td className="p-4 document-date">{formatDate(doc.uploadedAt)}</td>
                    <td className="p-4 document-actions">
                      <Button
                        variant="destructive"
                        size="sm"
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
                  <td colSpan={5} className="p-4 text-muted-foreground text-center">
                    {searchTerm
                      ? 'No documents matching your search'
                      : 'No documents in the knowledge base'}
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
