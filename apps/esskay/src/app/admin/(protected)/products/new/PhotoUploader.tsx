'use client'

import { useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'

interface UploadedPhoto {
  path: string
  url: string
}

export function PhotoUploader() {
  const [photos, setPhotos] = useState<UploadedPhoto[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    setUploadError(null)

    const supabase = createBrowserClient()
    const newPhotos: UploadedPhoto[] = []

    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const path = `${crypto.randomUUID()}-${safeName}`

      const { error } = await supabase.storage
        .from('product-photos')
        .upload(path, file, { contentType: file.type })

      if (error) {
        setUploadError(`Failed to upload "${file.name}": ${error.message}`)
        setUploading(false)
        return
      }

      const { data } = supabase.storage.from('product-photos').getPublicUrl(path)
      newPhotos.push({ path, url: data.publicUrl })
    }

    setPhotos((prev) => [...prev, ...newPhotos])
    setUploading(false)

    // Reset so the same file can be re-selected after a failure
    if (inputRef.current) inputRef.current.value = ''
  }

  function removePhoto(path: string) {
    setPhotos((prev) => prev.filter((p) => p.path !== path))

    // Fire-and-forget: delete from Storage so we don't accumulate orphans
    const supabase = createBrowserClient()
    supabase.storage
      .from('product-photos')
      .remove([path])
      .then(({ error }) => {
        if (error) console.error('[PhotoUploader] storage delete failed:', path, error)
      })
  }

  return (
    <div>
      {/* Hidden inputs carry URLs into the Server Action's FormData */}
      {photos.map(({ url }) => (
        <input key={url} type="hidden" name="photo_urls" value={url} />
      ))}

      <input
        ref={inputRef}
        id="photo-upload-input"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={uploading}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files)
          }
        }}
      />

      <label
        htmlFor="photo-upload-input"
        className={[
          'inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded border transition-colors',
          uploading
            ? 'border-site-border text-site-muted bg-site-bg cursor-not-allowed'
            : 'border-site-border text-site-accent-dark bg-white hover:bg-site-bg cursor-pointer',
        ].join(' ')}
      >
        {uploading
          ? 'Uploading…'
          : photos.length === 0
          ? 'Choose photos'
          : 'Add more photos'}
      </label>

      {uploadError && (
        <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>
      )}

      {photos.length > 0 && (
        <div className="flex gap-2 flex-wrap mt-3">
          {photos.map(({ path, url }) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                width={80}
                height={80}
                className="w-20 h-20 object-cover rounded border border-site-border"
              />
              <button
                type="button"
                onClick={() => removePhoto(path)}
                aria-label="Remove photo"
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 border border-gray-400 text-gray-600 text-xs leading-none opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
