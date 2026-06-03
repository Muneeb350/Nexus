import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import SignatureCanvas from 'react-signature-canvas';
import toast from 'react-hot-toast';
import {
  FolderOpen, FileText, File as FileIcon2, Upload,
  X, Eye, Trash2, Calendar, HardDrive, User,
  CheckCircle2, Clock, FilePen, ShieldCheck, Download, Eraser,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import type { BadgeVariant } from '../../components/ui/Badge';
import { useAuth } from '../../context/AuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ChamberDocument {
  id: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
  status: 'Draft' | 'In Review' | 'Signed';
  uploadedBy: string;
  signatureDataUrl?: string; // base-64 PNG set when signed via the pad
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

function getFileExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? '';
}

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_BADGE_VARIANT: Record<ChamberDocument['status'], BadgeVariant> = {
  Draft:       'gray',
  'In Review': 'warning',
  Signed:      'success',
};

const STATUS_ICON: Record<ChamberDocument['status'], React.ReactNode> = {
  Draft:       <Clock size={11} />,
  'In Review': <Eye size={11} />,
  Signed:      <CheckCircle2 size={11} />,
};

// ── File-type icon ────────────────────────────────────────────────────────────

function DocTypeIcon({ ext, large = false }: { ext: string; large?: boolean }) {
  const sz = large ? 28 : 20;
  if (ext === 'pdf') {
    return (
      <div className={`rounded-lg bg-red-50 shrink-0 ${large ? 'p-4' : 'p-2.5'}`}>
        <FileText size={sz} className="text-red-500" />
      </div>
    );
  }
  if (ext === 'docx' || ext === 'doc') {
    return (
      <div className={`rounded-lg bg-blue-50 shrink-0 ${large ? 'p-4' : 'p-2.5'}`}>
        <FileText size={sz} className="text-blue-600" />
      </div>
    );
  }
  return (
    <div className={`rounded-lg bg-gray-100 shrink-0 ${large ? 'p-4' : 'p-2.5'}`}>
      <FileIcon2 size={sz} className="text-gray-500" />
    </div>
  );
}

// ── Seed data ─────────────────────────────────────────────────────────────────

const SEED_DOCUMENTS: ChamberDocument[] = [
  {
    id: 'doc_001',
    name: 'Seed_Round_Term_Sheet.pdf',
    size: '342.5 KB',
    type: 'pdf',
    uploadDate: '2026-05-10T09:14:00Z',
    status: 'Signed',
    uploadedBy: 'Michael Rodriguez',
    // No signatureDataUrl — signed externally before the pad was integrated
  },
  {
    id: 'doc_002',
    name: 'Partnership_Agreement_Draft.docx',
    size: '128.0 KB',
    type: 'docx',
    uploadDate: '2026-05-22T14:35:00Z',
    status: 'In Review',
    uploadedBy: 'Sarah Johnson',
  },
  {
    id: 'doc_003',
    name: 'NDA_Template_2024.pdf',
    size: '89.2 KB',
    type: 'pdf',
    uploadDate: '2026-05-29T11:00:00Z',
    status: 'Draft',
    uploadedBy: 'Sarah Johnson',
  },
];

// ── Document / Signature modal ────────────────────────────────────────────────

interface DocumentModalProps {
  doc: ChamberDocument;
  onClose: () => void;
  onApplySignature: (docId: string, dataUrl: string) => void;
}

const DocumentModal: React.FC<DocumentModalProps> = ({
  doc, onClose, onApplySignature,
}) => {
  const sigCanvasRef   = useRef<SignatureCanvas>(null);
  const [hasDrawn, setHasDrawn]         = useState(false);
  const [isResigning, setIsResigning]   = useState(false);

  const alreadySigned = doc.status === 'Signed';
  const showCanvas    = !alreadySigned || isResigning;

  // ── Canvas actions ──────────────────────────────────────────────────────────

  const handleClear = () => {
    sigCanvasRef.current?.clear();
    setHasDrawn(false);
  };

  const handleApply = () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error('Please draw your signature before applying.');
      return;
    }
    const dataUrl = sigCanvasRef.current.toDataURL('image/png');
    onApplySignature(doc.id, dataUrl);
  };

  const handleDownload = () => {
    toast('Download started (simulated).', { icon: '📥' });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel — fixed header + scrollable body + fixed footer */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* ── Header ── */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <DocTypeIcon ext={doc.type} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{doc.name}</p>
              <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wider font-medium">
                {doc.type} document
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant={STATUS_BADGE_VARIANT[doc.status]} size="sm" rounded>
              <span className="flex items-center gap-1">
                {STATUS_ICON[doc.status]}
                {doc.status}
              </span>
            </Badge>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* Document metadata */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <HardDrive size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">File Size</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{doc.size}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <Calendar size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Uploaded</span>
              </div>
              <p className="text-sm font-semibold text-gray-800">{formatDate(doc.uploadDate)}</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <User size={12} className="text-gray-400" />
                <span className="text-xs text-gray-400 font-medium">Uploaded By</span>
              </div>
              <p className="text-sm font-semibold text-gray-800 truncate">{doc.uploadedBy}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium mb-1.5">Type</p>
              <p className="text-sm font-semibold text-gray-800 uppercase">{doc.type}</p>
            </div>
          </div>

          {/* ── E-Signature section ── */}
          <div>
            {/* Section header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary-50 rounded-lg">
                  <FilePen size={15} className="text-primary-600" />
                </div>
                <span className="text-sm font-semibold text-gray-800">
                  {showCanvas ? 'Sign this Document' : 'Applied Signature'}
                </span>
              </div>

              {/* Re-sign button (shown when already signed) */}
              {alreadySigned && !isResigning && (
                <button
                  onClick={() => setIsResigning(true)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 px-3 py-1.5 rounded-lg hover:bg-primary-50 transition-colors"
                >
                  <FilePen size={12} />
                  Re-sign
                </button>
              )}
            </div>

            {/* ── Already signed view ── */}
            {alreadySigned && !isResigning && (
              <>
                {doc.signatureDataUrl ? (
                  /* Saved signature image from the pad */
                  <div className="rounded-xl border border-success-200 bg-success-50/30 overflow-hidden">
                    {/* Proof header */}
                    <div className="px-4 py-2.5 border-b border-success-100 flex items-center justify-between bg-success-50">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-success-600" />
                        <span className="text-xs font-semibold text-success-700">
                          Signature verified
                        </span>
                      </div>
                      <span className="text-xs text-success-600">
                        {formatDate(doc.uploadDate)}
                      </span>
                    </div>
                    {/* Signature image */}
                    <div className="p-4 bg-white flex items-center justify-center min-h-[120px]">
                      <img
                        src={doc.signatureDataUrl}
                        alt="Applied signature"
                        className="max-h-32 max-w-full object-contain"
                      />
                    </div>
                  </div>
                ) : (
                  /* Externally-signed banner (seed doc_001) */
                  <div className="flex items-start gap-3 p-4 bg-success-50 rounded-xl border border-success-100">
                    <div className="p-2 bg-success-100 rounded-full shrink-0">
                      <CheckCircle2 size={18} className="text-success-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-success-800">
                        Document Signed &amp; Verified
                      </p>
                      <p className="text-xs text-success-600 mt-0.5">
                        This document was signed and verified externally before import.
                        Click "Re-sign" above to add your digital signature.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Signature canvas (unsigned, or re-signing) ── */}
            {showCanvas && (
              <div>
                {/* Canvas container */}
                <div
                  className="relative w-full rounded-xl overflow-hidden border-2 border-dashed border-gray-300 bg-white cursor-crosshair"
                  style={{ height: 200 }}
                >
                  {/* Placeholder hint — hidden once user starts drawing */}
                  {!hasDrawn && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 pointer-events-none select-none z-0">
                      <FilePen size={26} className="text-gray-200" />
                      <p className="text-sm text-gray-300 font-medium">
                        Draw your signature here
                      </p>
                      <p className="text-xs text-gray-200">
                        Use your mouse, trackpad, or touch screen
                      </p>
                    </div>
                  )}

                  {/* The canvas — transparent so hint shows through when empty */}
                  <SignatureCanvas
                    ref={sigCanvasRef}
                    onBegin={() => setHasDrawn(true)}
                    canvasProps={{
                      width: 560,
                      height: 200,
                      style: {
                        width: '100%',
                        height: '100%',
                        touchAction: 'none',
                        display: 'block',
                      },
                    }}
                    penColor="#1e293b"
                    minWidth={1.5}
                    maxWidth={3.5}
                    clearOnResize={false}
                    backgroundColor="rgba(255,255,255,0)"
                  />
                </div>

                {/* Baseline rule */}
                <div className="relative -mt-10 mb-8 mx-6 pointer-events-none">
                  <div className="border-b border-dashed border-gray-200" />
                  <span className="absolute right-0 -top-4 text-xs text-gray-300 select-none">
                    Sign above
                  </span>
                </div>

                {/* Canvas action buttons */}
                <div className="flex items-center gap-3 mt-3">
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Eraser size={15} />
                    Clear Signature
                  </button>

                  <button
                    onClick={handleApply}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 active:scale-95 text-white text-sm font-semibold rounded-lg transition-all shadow-sm shadow-primary-200/60"
                  >
                    <CheckCircle2 size={15} />
                    Apply Signature
                  </button>
                </div>

                <p className="text-xs text-gray-400 text-center mt-2.5">
                  By applying your signature you confirm you have read and agreed to this document.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 pb-5 pt-4 border-t border-gray-100 flex items-center gap-3 shrink-0">
          {isResigning && (
            <button
              onClick={() => { setIsResigning(false); handleClear(); }}
              className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-800 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={14} />
              Cancel Re-sign
            </button>
          )}
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
          >
            <Download size={15} />
            Download
          </button>
          <button
            onClick={onClose}
            className="ml-auto flex items-center gap-2 px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// ── DocumentChamberPage ───────────────────────────────────────────────────────

type FilterStatus = ChamberDocument['status'] | 'All';

export const DocumentChamberPage: React.FC = () => {
  const { user } = useAuth();

  const [documents, setDocuments] = useState<ChamberDocument[]>(SEED_DOCUMENTS);
  const [selectedDoc, setSelectedDoc]   = useState<ChamberDocument | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('All');

  // ── Dropzone ───────────────────────────────────────────────────────────────

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newDocs: ChamberDocument[] = acceptedFiles.map(file => ({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        size: formatFileSize(file.size),
        type: getFileExt(file.name),
        uploadDate: new Date().toISOString(),
        status: 'Draft',
        uploadedBy: user?.name ?? 'Unknown',
      }));

      setDocuments(prev => [...newDocs, ...prev]);
      toast.success(
        acceptedFiles.length === 1
          ? `"${acceptedFiles[0].name}" uploaded successfully!`
          : `${acceptedFiles.length} files uploaded successfully!`,
      );
    },
    [user],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected: files => {
      toast.error(
        `${files.length === 1 ? 'That file type is' : 'Some files are'} not supported. Use PDF, DOCX, DOC, or TXT.`,
      );
    },
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  // ── Apply signature ────────────────────────────────────────────────────────

  const handleApplySignature = (docId: string, dataUrl: string) => {
    setDocuments(prev =>
      prev.map(d =>
        d.id === docId
          ? { ...d, status: 'Signed' as const, signatureDataUrl: dataUrl }
          : d
      )
    );
    // Keep selectedDoc in sync so the modal re-renders with the signed view
    setSelectedDoc(prev =>
      prev?.id === docId
        ? { ...prev, status: 'Signed', signatureDataUrl: dataUrl }
        : prev
    );
    toast.success('Document signed successfully! ✍️');
  };

  // ── Delete ─────────────────────────────────────────────────────────────────

  const handleDelete = (id: string) => {
    const target = documents.find(d => d.id === id);
    setDocuments(prev => prev.filter(d => d.id !== id));
    if (selectedDoc?.id === id) setSelectedDoc(null);
    toast.success(`"${target?.name ?? 'Document'}" removed.`);
  };

  // ── Derived stats & filtered list ──────────────────────────────────────────

  const total       = documents.length;
  const signedCount = documents.filter(d => d.status === 'Signed').length;
  const reviewCount = documents.filter(d => d.status === 'In Review').length;
  const draftCount  = documents.filter(d => d.status === 'Draft').length;

  const visibleDocs =
    statusFilter === 'All'
      ? documents
      : documents.filter(d => d.status === statusFilter);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto animate-fade-in">

      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-primary-50 rounded-lg shrink-0">
          <FolderOpen className="text-primary-600" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Processing Chamber</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Upload, review, and sign legal documents and agreements securely.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',     value: total,       dot: 'bg-gray-400',      text: 'text-gray-800',      card: 'bg-white border-gray-200' },
          { label: 'Signed',    value: signedCount, dot: 'bg-success-500',   text: 'text-success-700',   card: 'bg-success-50 border-success-100' },
          { label: 'In Review', value: reviewCount, dot: 'bg-warning-500',   text: 'text-warning-700',   card: 'bg-warning-50 border-warning-100' },
          { label: 'Draft',     value: draftCount,  dot: 'bg-gray-400',      text: 'text-gray-600',      card: 'bg-white border-gray-200' },
        ].map(stat => (
          <div key={stat.label} className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm ${stat.card}`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${stat.dot}`} />
            <div>
              <p className={`text-xl font-bold leading-tight ${stat.text}`}>{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ─ LEFT COLUMN: Uploader ─ */}
        <div className="lg:col-span-1 flex flex-col gap-4">

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4">Upload Document</h2>

            <div
              {...getRootProps()}
              className={`
                cursor-pointer rounded-xl border-2 border-dashed transition-all
                flex flex-col items-center justify-center gap-4 text-center p-8
                ${isDragActive
                  ? 'border-primary-400 bg-primary-50'
                  : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40'
                }
              `}
            >
              <input {...getInputProps()} />

              <div className={`p-4 rounded-full transition-colors ${
                isDragActive ? 'bg-primary-100' : 'bg-white border border-gray-200 shadow-sm'
              }`}>
                <Upload size={26} className={isDragActive ? 'text-primary-600' : 'text-gray-400'} />
              </div>

              {isDragActive ? (
                <p className="text-sm font-semibold text-primary-700">Release to upload…</p>
              ) : (
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-gray-700">Drag &amp; drop files here</p>
                  <p className="text-xs text-gray-400">
                    or <span className="text-primary-600 font-medium">browse to upload</span>
                  </p>
                </div>
              )}

              <p className="text-xs text-gray-400">PDF, DOCX, DOC, TXT supported</p>
            </div>

            <ul className="mt-4 space-y-2">
              {[
                'New uploads start as "Draft".',
                'Click any row to open the document.',
                '"Apply Signature" marks the document as Signed.',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-500">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-primary-50 rounded-xl border border-primary-100 p-4 flex items-start gap-3">
            <ShieldCheck size={18} className="text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-primary-800">Encrypted Storage</p>
              <p className="text-xs text-primary-600 mt-0.5 leading-relaxed">
                All documents are end-to-end encrypted and accessible only to authorised parties.
              </p>
            </div>
          </div>
        </div>

        {/* ─ RIGHT COLUMN: Document list ─ */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

            {/* List header + filter pills */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-gray-800">Documents</h2>
                <Badge variant="primary" size="sm" rounded>{visibleDocs.length}</Badge>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(['All', 'Draft', 'In Review', 'Signed'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setStatusFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === f
                        ? 'bg-primary-600 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Empty state */}
            {visibleDocs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="p-4 bg-gray-50 rounded-full mb-3">
                  <FolderOpen size={28} className="text-gray-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">
                  {statusFilter === 'All' ? 'No documents yet.' : `No "${statusFilter}" documents found.`}
                </p>
                <p className="text-xs text-gray-400 mt-1">Upload a file using the panel on the left.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {visibleDocs.map(doc => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 cursor-pointer group transition-colors"
                  >
                    <DocTypeIcon ext={doc.type} />

                    {/* Name + meta */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-700 transition-colors">
                        {doc.name}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                          <HardDrive size={11} />{doc.size}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />{formatDate(doc.uploadDate)}
                        </span>
                        <span className="flex items-center gap-1 min-w-0">
                          <User size={11} />
                          <span className="truncate max-w-[90px]">{doc.uploadedBy}</span>
                        </span>
                      </div>
                    </div>

                    {/* Signature thumbnail — visible proof once signed via pad */}
                    {doc.signatureDataUrl && (
                      <div
                        className="shrink-0 w-20 h-10 rounded-lg border border-success-200 bg-white overflow-hidden shadow-sm"
                        title="Signature on file"
                      >
                        <img
                          src={doc.signatureDataUrl}
                          alt="Signature preview"
                          className="w-full h-full object-contain p-0.5"
                        />
                      </div>
                    )}

                    {/* Status badge */}
                    <Badge variant={STATUS_BADGE_VARIANT[doc.status]} size="sm" rounded>
                      <span className="flex items-center gap-1">
                        {STATUS_ICON[doc.status]}
                        {doc.status}
                      </span>
                    </Badge>

                    {/* Row actions — appear on hover */}
                    <div
                      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedDoc(doc)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                        title="Open document"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete document"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Document / Signature modal */}
      {selectedDoc && (
        <DocumentModal
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onApplySignature={handleApplySignature}
        />
      )}
    </div>
  );
};
