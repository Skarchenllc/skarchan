'use client';

/**
 * FileViewerModal — opens a file inline (image or PDF) with Download,
 * Print, Share, and Close controls. Bind-mounted alongside the other
 * shared components.
 */
import React, { useEffect, useRef, useState } from 'react';

interface FileViewerModalProps {
  url: string;
  onClose: () => void;
}

function getExtension(url: string): string {
  try {
    const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
    const pathname = u.pathname.toLowerCase();
    const m = pathname.match(/\.([a-z0-9]+)$/);
    return m ? m[1] : '';
  } catch {
    return '';
  }
}

function isImage(ext: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'avif', 'tiff'].includes(ext);
}

function isPdf(ext: string): boolean {
  return ext === 'pdf';
}

export default function FileViewerModal({ url, onClose }: FileViewerModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ext = getExtension(url);
  const filename = url.split('/').pop() || 'file';

  // Close on Esc; Esc out of fullscreen first if expanded.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expanded) setExpanded(false);
        else onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, expanded]);

  const handleDownload = () => {
    // Force a download by setting the `download` attribute on a temporary anchor.
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (isImage(ext)) {
      // For images, open a print window with just the image.
      const w = window.open('', '_blank');
      if (!w) return;
      w.document.write(`<img src="${url}" onload="window.print(); window.close();" />`);
      w.document.close();
    } else {
      // For PDFs and other iframe content, trigger print on the iframe.
      const f = iframeRef.current;
      if (f?.contentWindow) {
        try { f.contentWindow.focus(); f.contentWindow.print(); } catch {
          window.open(url, '_blank');
        }
      } else {
        window.open(url, '_blank');
      }
    }
  };

  const handleShare = async () => {
    const absoluteUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    // Try the Web Share API first (mobile-friendly).
    if ((navigator as any).share) {
      try {
        await (navigator as any).share({ title: filename, url: absoluteUrl });
        return;
      } catch {
        /* user cancelled or share unavailable — fall through to copy */
      }
    }
    // Fallback: copy URL to clipboard.
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Copy link:', absoluteUrl);
    }
  };

  // Default: roomy modal centered on screen. Expanded: covers the full viewport.
  // Use inline styles for dimensions so they unambiguously override the
  // catch-all CSS rules in globals.css (rounded-0, box-shadow:none, etc.).
  const overlayStyle: React.CSSProperties = expanded
    ? { padding: 0 }
    : { padding: '2rem' };
  const panelStyle: React.CSSProperties = expanded
    ? { width: '100vw', height: '100vh', maxWidth: 'none', maxHeight: 'none' }
    : { width: '100%', maxWidth: '72rem', height: '90vh' };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
      style={overlayStyle}
      onClick={onClose}
    >
      <div
        className="bg-white flex flex-col"
        style={panelStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed-height row */}
        <div className="flex items-center justify-between gap-4 px-5 py-3 border-b shrink-0">
          <div className="text-sm font-medium truncate flex-1">{filename}</div>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={handleDownload} className="px-3 py-1.5">Download</button>
            <button type="button" onClick={handlePrint} className="px-3 py-1.5">Print</button>
            <button type="button" onClick={handleShare} className="px-3 py-1.5">
              {copied ? 'Link copied' : 'Share'}
            </button>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Exit fullscreen' : 'Expand'}
              title={expanded ? 'Exit fullscreen' : 'Expand'}
              className="px-3 py-1.5"
            >
              {expanded ? '⤡' : '⤢'}
            </button>
            <button type="button" aria-label="Close" onClick={onClose} className="px-3 py-1.5">×</button>
          </div>
        </div>

        {/* Body — takes all remaining vertical space; iframe/img fills it */}
        <div className="flex-1 min-h-0 overflow-auto bg-white" style={{ position: 'relative' }}>
          {isImage(ext) ? (
            <img src={url} alt={filename} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : isPdf(ext) || ext === '' ? (
            <iframe
              ref={iframeRef}
              src={url}
              title={filename}
              style={{ width: '100%', height: '100%', border: 0, display: 'block' }}
            />
          ) : (
            <div className="p-8 text-center">
              <p className="mb-4">Preview not available for <strong>.{ext}</strong> files.</p>
              <button type="button" onClick={handleDownload}>Download to view</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
