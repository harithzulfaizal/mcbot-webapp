import React, { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Upload,
  Trash2,
  FileText,
  Search,
  XCircle,
  ArrowUpDown,
} from "lucide-react";
import { AuthUser } from "@/lib/auth";
import { apiUrl } from "@/lib/api";

type SortKey = 'name' | 'uploaded_at';

type Document = {
  id: string;
  name: string;
  type: string;
  size: number;
  uploaded_at: string;
};

interface KnowledgeBasePageProps {
  currentUser: AuthUser | null;
}

export default function KnowledgeBasePage({ currentUser }: KnowledgeBasePageProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [documentPendingDelete, setDocumentPendingDelete] = useState<Document | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const canManageKnowledgeBase = Boolean(currentUser?.canManageKb);

  // Fetch documents when component mounts
  useEffect(() => {
    fetchDocuments();
  }, [currentUser?.token]);

  const fetchDocuments = async () => {
    if (!currentUser?.token) {
      setDocuments([]);
      return;
    }

    try {
      const response = await fetch(apiUrl('/api/kb/documents'), {
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      const data = await response.json();
      
      if (data && Array.isArray(data.documents)) {
        const transformedDocuments = data.documents.map((doc: any) => {
          const dateStr = String(doc.date);
          const isoDate = `${dateStr.substring(0, 4)}-${dateStr.substring(4, 6)}-${dateStr.substring(6, 8)}`;
          
          return {
            id: doc.doc_id,
            name: doc.source,
            type: doc.source.split('.').pop()?.toLowerCase() || '',
            size: 0, // Size is not provided by the backend
            uploaded_at: new Date(isoDate).toISOString(),
          };
        });
        setDocuments(transformedDocuments);
      } else {
        setDocuments([]);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]); // Ensure documents is an array on error
    }
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset file input to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleFiles = (files: FileList) => {
    setUploadError('');
    const newFiles = Array.from(files);
    let validFiles = true;
    
    for (const file of newFiles) {
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
    }

    if (validFiles) {
        setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0 || !currentUser?.token) return;

    setIsUploading(true);
    setUploadError('');
    const formData = new FormData();

    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(apiUrl('/api/kb/upload_documents'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setUploadError(errorData.detail || 'Failed to upload files.');
      } else {
        fetchDocuments(); // Refresh the document list
        setSelectedFiles([]); // Clear selected files after upload
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setUploadError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!currentUser?.token) {
      return;
    }
    setIsDeleting(true);
    try {
      const response = await fetch(apiUrl(`/api/kb/documents/${documentId}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${currentUser.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      setDocumentPendingDelete(null);
      fetchDocuments(); // Refresh the document list
    } catch (error) {
      console.error('Error deleting document:', error);
    } finally {
      setIsDeleting(false);
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

  const sortedDocuments = React.useMemo(() => {
    let sortableItems = [...documents];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [documents, sortConfig]);

  const filteredDocuments = sortedDocuments.filter(doc =>
    doc.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDocuments.length / rowsPerPage);
  const paginatedDocuments = filteredDocuments.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] overflow-y-auto">
      <div className="flex flex-1 flex-col gap-4 px-4 py-8 md:px-6 md:py-10"> {/* Adjusted padding for responsiveness */}
        <div className="mx-auto w-full max-w-4xl"> {/* Slightly increased max-width for better table layout */}
          <h1 className="text-xl font-semibold mb-4">Knowledge Base Management</h1> {/* font-bold to font-semibold, reduced mb */}
          <p className="text-sm text-muted-foreground mb-6"> {/* Changed from text-l to text-sm */}
            Browse the shared document library for the chatbot&apos;s knowledge base.
            {canManageKnowledgeBase
              ? " You can upload and delete documents as a maintainer/admin. Supported file types: TXT, PDF, CSV. Maximum file size: 10MB."
              : " This page is read-only for your role."}
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
          </div>

          {canManageKnowledgeBase ? (
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer mb-6 ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/50'}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.pdf,.csv"
                className="hidden"
                onChange={handleFileSelect}
              />
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop files here, or click to select files.
              </p>
            </div>
          ) : null}

          {canManageKnowledgeBase && selectedFiles.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Selected Files:</h2>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <span className="text-xs text-muted-foreground">({formatFileSize(file.size)})</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)}>
                      <XCircle className="h-5 w-5" />
                    </Button>
                  </li>
                ))}
              </ul>
              <Button onClick={handleUploadClick} disabled={isUploading} className="mt-4 w-full">
                {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
              </Button>
            </div>
          )}

          <div className="border rounded-lg overflow-x-auto"> {/* Added rounded-lg and overflow-x-auto for tables */}
            <table className="w-full table-auto min-w-[600px]"> {/* Added min-width to prevent excessive squishing */}
              <thead className="bg-muted/50">
                <tr>
                  {/* Changed from text-l to text-sm, adjusted padding */}
                  <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestSort('name')}>
                      Name
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  {/* <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Type</th> */}
                  {/* <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Size</th> */}
                  <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">
                    <Button variant="ghost" onClick={() => requestSort('uploaded_at')}>
                      Uploaded
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </th>
                  {canManageKnowledgeBase ? (
                    <th className="text-sm text-left px-3 py-3 font-medium text-muted-foreground">Actions</th>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {paginatedDocuments.length > 0 ? (
                  paginatedDocuments.map(doc => (
                    <tr key={doc.id} className="border-t hover:bg-muted/50">
                      {/* Added text-sm, adjusted padding */}
                      <td className="px-3 py-3 text-sm document-name align-middle">
                        {getFileIcon(doc.type)} {doc.name}
                      </td>
                      {/* <td className="px-3 py-3 text-sm document-type align-middle">{doc.type.toUpperCase()}</td> */}
                      {/* <td className="px-3 py-3 text-sm document-size align-middle">{formatFileSize(doc.size)}</td> */}
                      <td className="px-3 py-3 text-sm document-date align-middle">{formatDate(doc.uploaded_at)}</td>
                      {canManageKnowledgeBase ? (
                        <td className="px-3 py-3 text-sm document-actions align-middle text-right sm:text-left"> {/* Adjusted text alignment for actions */}
                          <Button
                            variant="destructive"
                            size="sm" // sm size for buttons is common and good
                            onClick={() => setDocumentPendingDelete(doc)}
                            title="Delete document"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      ) : null}
                    </tr>
                  ))
                ) : (
                  <tr>
                    {/* Added text-sm */}
                    <td colSpan={canManageKnowledgeBase ? 3 : 2} className="px-3 py-10 text-sm text-muted-foreground text-center">
                      {searchTerm
                        ? 'No documents matching your search.' // Added a period
                        : canManageKnowledgeBase
                          ? 'No documents in the knowledge base. Upload some to get started!'
                          : 'No documents are currently available in the shared knowledge base.'} {/* More engaging empty state */}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button onClick={handlePreviousPage} disabled={currentPage === 1}>
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button onClick={handleNextPage} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
      <Dialog
        open={canManageKnowledgeBase && documentPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setDocumentPendingDelete(null);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete document?</DialogTitle>
            <DialogDescription>
              {documentPendingDelete
                ? `This will permanently remove "${documentPendingDelete.name}" from the knowledge base.`
                : "This will permanently remove the selected document from the knowledge base."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDocumentPendingDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (documentPendingDelete) {
                  handleDelete(documentPendingDelete.id);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
