import { Component, HostListener, Input, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface DocumentPreview {
  label: string;
  url: string;
  originalName?: string;
  mimeType?: string;
}

export function toDocumentPreview(
  label: string,
  source: unknown,
  resolveUrl: (path: string) => string
): DocumentPreview | null {
  if (!source || typeof source === 'boolean') return null;

  if (typeof source === 'string') {
    const path = source.trim();
    return path ? { label, url: resolveUrl(path) } : null;
  }

  if (typeof source !== 'object') return null;
  const row = source as Record<string, unknown>;
  const path = String(row['url'] ?? '').trim();
  if (!path) return null;

  return {
    label,
    url: resolveUrl(path),
    originalName: row['originalName'] ? String(row['originalName']) : undefined,
    mimeType: row['mimeType'] ? String(row['mimeType']) : undefined,
  };
}

@Component({
  selector: 'app-document-gallery',
  templateUrl: './document-gallery.component.html',
  styleUrls: ['./document-gallery.component.scss'],
  standalone: false,
})
export class DocumentGalleryComponent implements OnDestroy {
  @Input() documents: DocumentPreview[] = [];

  active: DocumentPreview | null = null;
  loading = false;
  loadError = '';
  safePdfUrl: SafeResourceUrl | null = null;
  private objectUrl: string | null = null;

  constructor(private sanitizer: DomSanitizer) {}

  ngOnDestroy(): void {
    this.clearObjectUrl();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.active) this.close();
  }

  isImage(doc: DocumentPreview): boolean {
    const mime = (doc.mimeType || '').toLowerCase();
    if (mime.startsWith('image/') && !mime.includes('heic') && !mime.includes('heif')) return true;
    return /\.(jpe?g|png|webp|gif)(\?|$)/i.test(doc.url);
  }

  isPdf(doc: DocumentPreview): boolean {
    const mime = (doc.mimeType || '').toLowerCase();
    return mime === 'application/pdf' || /\.pdf(\?|$)/i.test(doc.url);
  }

  fileKind(doc: DocumentPreview): string {
    if (this.isPdf(doc)) return 'PDF';
    if (this.isImage(doc)) return 'Image';
    return 'File';
  }

  open(doc: DocumentPreview): void {
    this.clearObjectUrl();
    this.active = doc;
    this.loadError = '';
    this.loading = false;

    if (!this.isPdf(doc)) return;

    this.loading = true;
    fetch(doc.url)
      .then((response) => {
        if (!response.ok) throw new Error('Document request failed');
        return response.blob();
      })
      .then((blob) => {
        if (this.active?.url !== doc.url) return;
        this.objectUrl = URL.createObjectURL(blob);
        this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
        this.loading = false;
      })
      .catch(() => {
        if (this.active?.url !== doc.url) return;
        this.loading = false;
        this.loadError = 'Preview is unavailable. Open the file in a new tab.';
      });
  }

  close(): void {
    this.active = null;
    this.loading = false;
    this.loadError = '';
    this.clearObjectUrl();
  }

  private clearObjectUrl(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.safePdfUrl = null;
  }
}
