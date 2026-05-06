'use client';

import { useEffect, useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { roomsApi, Room } from '@/lib/rooms';
import { X, Upload, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const AMENITIES = ['WiFi', 'Điều hòa', 'TV', 'Nóng lạnh', 'Tủ đồ', 'Ban công', 'Bếp nhỏ', 'Minibar', 'Bãi đỗ xe'];

const schema = z.object({
  name: z.string().min(1, 'Bắt buộc').max(100),
  description: z.string().optional(),
  capacity: z.coerce.number().int().min(1, 'Tối thiểu 1 người'),
  area: z.coerce.number().optional(),
  floor: z.coerce.number().int().optional(),
  amenities: z.array(z.string()),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  room?: Room | null;
  onSuccess: () => void;
}

export function RoomForm({ room, onSuccess }: Props) {
  const isEdit = !!room;
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: room?.name ?? '',
      description: room?.description ?? '',
      capacity: room?.capacity ?? 1,
      area: room?.area ?? undefined,
      floor: room?.floor ?? undefined,
      amenities: room?.amenities ?? [],
      isActive: room?.isActive ?? true,
    },
  });

  useEffect(() => {
    if (room) reset({
      name: room.name,
      description: room.description ?? '',
      capacity: room.capacity,
      area: room.area ?? undefined,
      floor: room.floor ?? undefined,
      amenities: room.amenities,
      isActive: room.isActive,
    });
  }, [room, reset]);

  const amenities = watch('amenities');
  const isActive = watch('isActive');

  const toggleAmenity = (item: string) => {
    const current = amenities ?? [];
    setValue('amenities', current.includes(item) ? current.filter((a) => a !== item) : [...current, item]);
  };

  const onDrop = useCallback((accepted: File[]) => {
    setPendingFiles((prev) => [...prev, ...accepted].slice(0, 10));
    setPreviewUrls((prev) => [...prev, ...accepted.map((f) => URL.createObjectURL(f))].slice(0, 10));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] },
    maxSize: 5 * 1024 * 1024,
    multiple: true,
  });

  const removePending = (idx: number) => {
    URL.revokeObjectURL(previewUrls[idx]);
    setPendingFiles((p) => p.filter((_, i) => i !== idx));
    setPreviewUrls((p) => p.filter((_, i) => i !== idx));
  };

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (isEdit) {
        const updated = await roomsApi.update(room!.id, values);
        if (pendingFiles.length > 0) await roomsApi.uploadImages(room!.id, pendingFiles);
        return updated;
      } else {
        const created = await roomsApi.create(values);
        if (pendingFiles.length > 0) await roomsApi.uploadImages(created.id, pendingFiles);
        return created;
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Cập nhật phòng thành công' : 'Tạo phòng thành công');
      onSuccess();
    },
    onError: () => toast.error('Có lỗi xảy ra, thử lại sau'),
  });

  return (
    <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="name">Tên phòng *</Label>
        <Input id="name" {...register('name')} placeholder="Phòng Hoa Sen" />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea id="description" {...register('description')} rows={3} placeholder="Mô tả ngắn về phòng..." />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="capacity">Sức chứa *</Label>
          <Input id="capacity" type="number" min={1} {...register('capacity')} />
          {errors.capacity && <p className="text-red-500 text-xs">{errors.capacity.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="area">Diện tích (m²)</Label>
          <Input id="area" type="number" step="0.1" {...register('area')} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="floor">Tầng</Label>
          <Input id="floor" type="number" min={1} {...register('floor')} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Tiện nghi</Label>
        <div className="grid grid-cols-2 gap-2">
          {AMENITIES.map((item) => (
            <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox
                checked={(amenities ?? []).includes(item)}
                onCheckedChange={() => toggleAmenity(item)}
              />
              {item}
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Ảnh phòng</Label>

        {/* Existing images */}
        {isEdit && room!.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {room!.images.map((url) => (
              <div key={url} className="relative h-16 w-16 rounded overflow-hidden border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`${process.env.NEXT_PUBLIC_API_URL}${url}`} alt="" className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}

        {/* Upload zone */}
        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors',
            isDragActive ? 'border-blue-400 bg-blue-50' : 'border-slate-200 hover:border-slate-300',
          )}
        >
          <input {...getInputProps()} />
          <Upload size={20} className="mx-auto mb-1 text-slate-400" />
          <p className="text-xs text-slate-500">Kéo thả hoặc click để chọn ảnh (tối đa 10, 5MB/ảnh)</p>
        </div>

        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {previewUrls.map((url, idx) => (
              <div key={url} className="relative h-16 w-16 rounded overflow-hidden border group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="object-cover w-full h-full" />
                <button
                  type="button"
                  onClick={() => removePending(idx)}
                  className="absolute inset-0 bg-black/50 hidden group-hover:flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}

        {pendingFiles.length === 0 && !isEdit && (
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <ImageIcon size={12} /> Chưa có ảnh nào được chọn
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(v) => setValue('isActive', v)}
        />
        <Label htmlFor="isActive">Hiển thị cho khách hàng</Label>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo phòng'}
        </Button>
      </div>
    </form>
  );
}
