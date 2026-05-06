'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Header } from '@/components/cms/header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RoomForm } from './room-form';
import { roomsApi, Room } from '@/lib/rooms';
import { Plus, Pencil, Trash2, ImageIcon, Users, Layers } from 'lucide-react';

export default function RoomsPage() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editRoom, setEditRoom] = useState<Room | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: () => roomsApi.list({ limit: 50 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roomsApi.remove(id),
    onSuccess: () => {
      toast.success('Đã xóa phòng');
      qc.invalidateQueries({ queryKey: ['admin-rooms'] });
      setDeleteId(null);
    },
    onError: () => toast.error('Xóa phòng thất bại'),
  });

  const openCreate = () => { setEditRoom(null); setFormOpen(true); };
  const openEdit = (room: Room) => { setEditRoom(room); setFormOpen(true); };
  const onFormSuccess = () => { setFormOpen(false); qc.invalidateQueries({ queryKey: ['admin-rooms'] }); };

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  return (
    <>
      <Header title="Quản lý phòng" />
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-slate-500 text-sm">{data?.meta.total ?? 0} phòng</p>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} /> Thêm phòng
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {data?.items.map((room) => (
              <Card key={room.id} className="overflow-hidden">
                <div className="relative h-36 bg-slate-100">
                  {room.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${apiBase}${room.images[0]}`}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                      <ImageIcon size={36} />
                    </div>
                  )}
                  <Badge
                    className="absolute top-2 right-2"
                    variant={room.isActive ? 'default' : 'secondary'}
                  >
                    {room.isActive ? 'Hoạt động' : 'Tạm ngưng'}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-slate-800 mb-1 truncate">{room.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2 min-h-[2.5rem] mb-3">
                    {room.description ?? '—'}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Users size={13} /> {room.capacity} người
                    </span>
                    {room.area && (
                      <span className="flex items-center gap-1">
                        <Layers size={13} /> {room.area} m²
                      </span>
                    )}
                    <span>{room.images.length} ảnh</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 gap-1"
                      onClick={() => openEdit(room)}
                    >
                      <Pencil size={13} /> Sửa
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => setDeleteId(room.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Create / Edit dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRoom ? 'Chỉnh sửa phòng' : 'Thêm phòng mới'}</DialogTitle>
          </DialogHeader>
          <RoomForm room={editRoom} onSuccess={onFormSuccess} />
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa phòng?</AlertDialogTitle>
            <AlertDialogDescription>
              Phòng sẽ bị xóa mềm và không hiển thị cho khách hàng. Bạn có thể khôi phục sau.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
