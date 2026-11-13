/**
 * Step 2 — Profile photo with a real crop/zoom/rotate editor.
 *
 * The photo is stored as a processed JPEG data URL (square, max 720px) so the
 * database stays small and every output renderer receives an identical image.
 */
import React, { useCallback, useRef, useState } from 'react';
import { Crop, Image as ImageIcon, RotateCw, Trash2, Upload, ZoomIn } from 'lucide-react';
import { Button, Field, Notice, Segmented, Select, Switch } from '@/components/ui';
import { useLang } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { getBridge } from '@/platform';
import type { PhotoShape } from '@/types/cv';

const MAX_INPUT_BYTES = 12 * 1024 * 1024;
const OUTPUT_SIZE = 720;

export const PhotoStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const pushToast = useWorkspace((s) => s.pushToast);
  const lang = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const photo = data.photo;

  const setPhoto = (patch: Partial<typeof photo>) => {
    update((draft) => {
      draft.photo = { ...draft.photo, ...patch };
    });
  };

  const applyPhoto = useCallback(
    async (dataUrl: string) => {
      setBusy(true);
      try {
        const processed = await renderCrop(dataUrl, photo);
        setPhoto({ dataUrl: processed });
        setPreview(processed);
      } catch (err) {
        pushToast({
          kind: 'error',
          title: lang === 'bn' ? 'ছবি প্রক্রিয়া করা যায়নি' : 'Could not process image',
          detail: err instanceof Error ? err.message : String(err),
        });
      } finally {
        setBusy(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [photo.zoom, photo.offsetX, photo.offsetY, photo.rotation],
  );

  const pickFromBridge = async () => {
    const bridge = getBridge();
    const result = await bridge.openImage();
    if (result.cancelled) return;
    if (!result.dataUrl) {
      pushToast({
        kind: 'error',
        title:
          result.message === 'FILE_TOO_LARGE'
            ? lang === 'bn'
              ? 'ফাইলটি খুব বড় (সর্বোচ্চ ১২ MB)'
              : 'File is too large (12 MB maximum)'
            : lang === 'bn'
              ? 'শুধু JPG বা PNG ছবি সমর্থিত'
              : 'Only JPG or PNG images are supported',
      });
      return;
    }
    await applyPhoto(result.dataUrl);
  };

  const onFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      pushToast({ kind: 'error', title: lang === 'bn' ? 'শুধু JPG বা PNG ছবি সমর্থিত' : 'Only JPG or PNG images are supported' });
      return;
    }
    if (file.size > MAX_INPUT_BYTES) {
      pushToast({ kind: 'error', title: lang === 'bn' ? 'ফাইলটি খুব বড় (সর্বোচ্চ ১২ MB)' : 'File is too large (12 MB maximum)' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void applyPhoto(String(reader.result));
    reader.onerror = () => pushToast({ kind: 'error', title: 'Could not read the file' });
    reader.readAsDataURL(file);
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      pushToast({ kind: 'error', title: lang === 'bn' ? 'শুধু JPG বা PNG ছবি সমর্থিত' : 'Only JPG or PNG images are supported' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => void applyPhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  const shapeOptions: { value: PhotoShape; label: string }[] = [
    { value: 'circle', label: lang === 'bn' ? 'বৃত্ত' : 'Circle' },
    { value: 'square', label: lang === 'bn' ? 'বর্গ' : 'Square' },
    { value: 'rounded', label: lang === 'bn' ? 'রাউন্ডেড' : 'Rounded' },
    { value: 'none', label: lang === 'bn' ? 'ছবি ছাড়া' : 'No photo' },
  ];

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <Notice tone="info">
        {lang === 'bn'
          ? 'ছবি সম্পূর্ণ ঐচ্ছিক। ছবি না দিলে প্রতিটি টেমপ্লেটে হেডার স্বয়ংক্রিয়ভাবে সমন্বয় হবে এবং কোনো খালি ফ্রেম থাকবে না।'
          : 'The photo is entirely optional. Without one, every template re-balances its header automatically and no empty frame is shown.'}
      </Notice>

      <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: 'var(--sp-5)', alignItems: 'start' }}>
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          <div
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            style={{
              border: '2px dashed var(--border-strong)',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              padding: 'var(--sp-5)',
              display: 'grid',
              placeItems: 'center',
              minHeight: 220,
              cursor: 'pointer',
              textAlign: 'center',
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            aria-label={lang === 'bn' ? 'ছবি আপলোড করুন' : 'Upload photo'}
          >
            {photo.dataUrl ? (
              <img
                src={photo.dataUrl}
                alt="Profile preview"
                style={{
                  width: 150,
                  height: 150,
                  objectFit: 'cover',
                  borderRadius: photo.shape === 'circle' ? '50%' : photo.shape === 'rounded' ? 12 : 0,
                  border: '1px solid var(--border)',
                  background: '#fff',
                }}
              />
            ) : (
              <div className="col" style={{ alignItems: 'center', gap: 'var(--sp-2)' }}>
                <div className="empty-icon">
                  <ImageIcon size={22} />
                </div>
                <strong style={{ fontSize: 'var(--fs-base)' }}>
                  {lang === 'bn' ? 'ছবি টেনে আনুন বা ক্লিক করুন' : 'Drag & drop, or click to browse'}
                </strong>
                <span className="small muted">JPG · PNG · {lang === 'bn' ? 'সর্বোচ্চ ১২ MB' : 'max 12 MB'}</span>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg" hidden onChange={onFileInput} />

          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Button icon={<Upload size={15} />} onClick={pickFromBridge} loading={busy} block>
              {photo.dataUrl
                ? lang === 'bn'
                  ? 'ছবি পরিবর্তন'
                  : 'Replace photo'
                : lang === 'bn'
                  ? 'ছবি বাছুন'
                  : 'Choose photo'}
            </Button>
            {photo.dataUrl ? (
              <Button
                variant="danger"
                icon={<Trash2 size={15} />}
                onClick={() => {
                  setPhoto({ dataUrl: null, zoom: 1, offsetX: 0, offsetY: 0, rotation: 0 });
                  setPreview(null);
                }}
              >
                {lang === 'bn' ? 'সরান' : 'Remove'}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="col" style={{ gap: 'var(--sp-4)' }}>
          <Field label={lang === 'bn' ? 'ফ্রেমের আকৃতি' : 'Frame shape'}>
            <Segmented
              value={photo.shape}
              onChange={(value) => {
                setPhoto({ shape: value });
                update((draft) => {
                  draft.sections = draft.sections.map((s) =>
                    s.id === 'signature' ? s : s,
                  );
                }, { transient: true });
              }}
              options={shapeOptions}
              ariaLabel="Photo frame shape"
            />
          </Field>

          <Field
            label={lang === 'bn' ? 'জুম' : 'Zoom'}
            hint={lang === 'bn' ? 'ছবিটি ফ্রেমে বড় বা ছোট করুন' : 'Scale the image inside the frame'}
          >
            <div className="input-row">
              <ZoomIn size={15} className="faint" />
              <input
                type="range"
                min={1}
                max={2.4}
                step={0.02}
                value={photo.zoom}
                onChange={(e) => setPhoto({ zoom: Number(e.target.value) })}
                style={{ flex: 1, accentColor: 'var(--primary)' }}
                aria-label="Zoom"
              />
              <span className="small mono faint" style={{ width: 42, textAlign: 'right' }}>
                {photo.zoom.toFixed(2)}×
              </span>
            </div>
          </Field>

          <div className="field-grid">
            <Field label={lang === 'bn' ? 'অনুভূমিক অবস্থান' : 'Horizontal position'}>
              <input
                type="range"
                min={-40}
                max={40}
                value={photo.offsetX}
                onChange={(e) => setPhoto({ offsetX: Number(e.target.value) })}
                style={{ accentColor: 'var(--primary)' }}
                aria-label="Horizontal offset"
              />
            </Field>
            <Field label={lang === 'bn' ? 'উল্লম্ব অবস্থান' : 'Vertical position'}>
              <input
                type="range"
                min={-40}
                max={40}
                value={photo.offsetY}
                onChange={(e) => setPhoto({ offsetY: Number(e.target.value) })}
                style={{ accentColor: 'var(--primary)' }}
                aria-label="Vertical offset"
              />
            </Field>
            <Field label={lang === 'bn' ? 'ঘোরানো' : 'Rotation'}>
              <div className="input-row">
                <RotateCw size={15} className="faint" />
                <input
                  type="range"
                  min={-180}
                  max={180}
                  step={1}
                  value={photo.rotation}
                  onChange={(e) => setPhoto({ rotation: Number(e.target.value) })}
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                  aria-label="Rotation"
                />
                <span className="small mono faint" style={{ width: 42, textAlign: 'right' }}>
                  {photo.rotation}°
                </span>
              </div>
            </Field>
            <Field label={lang === 'bn' ? 'ফ্রেমের আকার (মিমি)' : 'Frame size (mm)'}>
              <Select
                value={String(photo.frameSize)}
                onChange={(e) => setPhoto({ frameSize: Number(e.target.value) })}
              >
                {[24, 27, 30, 33, 36, 40].map((v) => (
                  <option key={v} value={v}>
                    {v} mm
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <Button
            icon={<Crop size={15} />}
            onClick={() => void applyPhoto(photo.dataUrl ?? '')}
            disabled={!photo.dataUrl}
            loading={busy}
          >
            {lang === 'bn' ? 'ফ্রেমে বসিয়ে সংরক্ষণ করুন' : 'Apply crop'}
          </Button>

          {preview ? (
            <div className="row" style={{ gap: 'var(--sp-3)' }}>
              <img
                src={preview}
                alt="Cropped preview"
                style={{
                  width: 72,
                  height: 72,
                  objectFit: 'cover',
                  borderRadius: photo.shape === 'circle' ? '50%' : photo.shape === 'rounded' ? 8 : 0,
                  border: '1px solid var(--border)',
                }}
              />
              <div className="small muted">
                {lang === 'bn'
                  ? 'প্রিভিউ — উইজার্ড শেষ করার পর ডান পাশে সম্পূর্ণ CV-তে দেখতে পাবেন।'
                  : 'Preview — you will see it in the full CV once the wizard is complete.'}
              </div>
            </div>
          ) : null}

          <div className="row between" style={{ paddingTop: 'var(--sp-2)' }}>
            <span className="small muted">
              {lang === 'bn' ? 'ছবি ছাড়া CV তৈরি করুন' : 'Create the CV without a photo'}
            </span>
            <Switch
              checked={photo.shape === 'none'}
              onChange={(next) => setPhoto({ shape: next ? 'none' : 'circle' })}
              aria-label="No photo"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Render the photo into a square crop as a JPEG data URL.
 * Runs on a canvas so it works identically in Electron and the browser and
 * keeps the stored payload small.
 */
async function renderCrop(src: string, photo: { zoom: number; offsetX: number; offsetY: number; rotation: number }): Promise<string> {
  const img = await loadImage(src);
  const size = OUTPUT_SIZE;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.translate(size / 2, size / 2);
  ctx.rotate((photo.rotation * Math.PI) / 180);

  // Cover-fit the source, then apply zoom and pan.
  const coverScale = Math.max(size / img.width, size / img.height) * photo.zoom;
  const w = img.width * coverScale;
  const h = img.height * coverScale;
  const dx = (photo.offsetX / 100) * size;
  const dy = (photo.offsetY / 100) * size;
  ctx.drawImage(img, -w / 2 + dx, -h / 2 + dy, w, h);

  return canvas.toDataURL('image/jpeg', 0.9);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The image could not be decoded.'));
    img.src = src;
  });
}
