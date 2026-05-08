'use client';

import { useState } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { ImageIcon, ZoomIn } from 'lucide-react';

interface Props {
  images: string[];
  name: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function resolveUrl(path: string) {
  if (path.startsWith('http')) return path;
  return `${API_URL}${path}`;
}

export function RoomGallery({ images, name }: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = images.map((src) => ({ src: resolveUrl(src) }));

  if (images.length === 0) {
    return (
      <div className="w-full h-80 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
        <ImageIcon size={56} />
      </div>
    );
  }

  const [main, ...rest] = images;

  return (
    <>
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-80 rounded-2xl overflow-hidden">
        {/* Main image — spans 2 columns and 2 rows */}
        <button
          className="col-span-2 row-span-2 relative group overflow-hidden"
          onClick={() => { setIndex(0); setOpen(true); }}
          aria-label="Xem ảnh lớn"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveUrl(main)}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn size={28} className="text-white drop-shadow" />
          </div>
        </button>

        {/* Thumbnails */}
        {rest.slice(0, 4).map((img, i) => {
          const isLast = i === 3 && images.length > 5;
          return (
            <button
              key={img}
              className="relative group overflow-hidden"
              onClick={() => { setIndex(i + 1); setOpen(true); }}
              aria-label={`Xem ảnh ${i + 2}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={resolveUrl(img)}
                alt={`${name} ${i + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {isLast ? (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-semibold text-lg">
                  +{images.length - 5}
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              )}
            </button>
          );
        })}

        {/* Empty slots if < 5 images total */}
        {rest.length < 4 &&
          Array.from({ length: 4 - rest.length }).map((_, i) => (
            <div key={`empty-${i}`} className="bg-slate-100" />
          ))}
      </div>

      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={slides}
      />
    </>
  );
}
