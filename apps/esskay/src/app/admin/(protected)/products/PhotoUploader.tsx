'use client'

import { useRef, useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  arrayMove,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable'

interface UploadedPhoto {
  path: string // storage object path (not full URL)
  url: string  // public URL for display + hidden input
}

function pathFromUrl(url: string): string {
  const marker = '/product-photos/'
  const idx = url.indexOf(marker)
  return idx >= 0 ? url.slice(idx + marker.length) : url
}

interface SortableThumbnailProps {
  photo: UploadedPhoto
  isCover: boolean
  onRemove: (path: string) => void
}

function SortableThumbnail({ photo, isCover, onRemove }: SortableThumbnailProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: photo.url })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform
          ? `translate3d(${Math.round(transform.x)}px, ${Math.round(transform.y)}px, 0)`
          : undefined,
        transition,
        zIndex: isDragging ? 10 : undefined,
        opacity: isDragging ? 0.7 : 1,
      }}
      className={[
        'relative touch-none',
        isDragging ? 'shadow-lg' : '',
      ].join(' ')}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photo.url}
        alt="Product photo"
        width={80}
        height={80}
        draggable={false}
        className="w-20 h-20 object-cover rounded border border-site-border select-none cursor-grab active:cursor-grabbing"
      />

      {isCover && (
        <span className="absolute bottom-0.5 left-0.5 text-[9px] font-bold uppercase tracking-wider text-white bg-site-accent-dark/80 px-1 py-0.5 rounded leading-none pointer-events-none">
          Cover
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove(photo.path)
        }}
        aria-label="Remove photo"
        className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-white/80 border border-gray-400 text-gray-600 text-xs leading-none opacity-70 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
      >
        ×
      </button>
    </div>
  )
}

export function PhotoUploader({
  initialPhotoUrls = [],
  onPhotosChange,
}: {
  initialPhotoUrls?: string[]
  onPhotosChange?: (urls: string[]) => void
}) {
  const [photos, setPhotos] = useState<UploadedPhoto[]>(() =>
    initialPhotoUrls.map((url) => ({ path: pathFromUrl(url), url }))
  )

  function updatePhotos(next: UploadedPhoto[]) {
    setPhotos(next)
    onPhotosChange?.(next.map((p) => p.url))
  }
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Require 8px of movement before drag starts so button clicks fire normally
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setPhotos((prev) => {
        const oldIndex = prev.findIndex((p) => p.url === active.id)
        const newIndex = prev.findIndex((p) => p.url === over.id)
        const next = arrayMove(prev, oldIndex, newIndex)
        onPhotosChange?.(next.map((p) => p.url))
        return next
      })
    }
  }

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

    updatePhotos([...photos, ...newPhotos])
    setUploading(false)

    if (inputRef.current) inputRef.current.value = ''
  }

  function removePhoto(path: string) {
    const next = photos.filter((p) => p.path !== path)
    updatePhotos(next)

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
      {/* Hidden inputs carry ordered URLs into the Server Action's FormData */}
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
        {uploading ? 'Uploading…' : photos.length === 0 ? 'Choose photos' : 'Add more photos'}
      </label>

      {uploadError && (
        <p className="text-xs text-red-600 mt-1.5">{uploadError}</p>
      )}

      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p) => p.url)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-2 flex-wrap mt-3">
              {photos.map((photo, index) => (
                <SortableThumbnail
                  key={photo.url}
                  photo={photo}
                  isCover={index === 0}
                  onRemove={removePhoto}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
