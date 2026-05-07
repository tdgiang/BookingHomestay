'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Header } from '@/components/cms/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { adminPricingApi, AdminPriceRule } from '@/lib/admin-api';
import { roomsApi } from '@/lib/rooms';
import { Room } from '@/lib/rooms';
import { Plus, Pencil, Trash2, Loader2, X, ChevronDown, ChevronRight } from 'lucide-react';

const PRICE_TYPES = [
  { value: 'BASE_NIGHTLY', label: 'Giá đêm cơ bản' },
  { value: 'WEEKEND_NIGHTLY', label: 'Giá cuối tuần' },
  { value: 'SEASONAL_NIGHTLY', label: 'Giá mùa cao điểm' },
  { value: 'HOURLY', label: 'Giá theo giờ' },
];

const TYPE_COLOR: Record<string, string> = {
  BASE_NIGHTLY: 'bg-blue-50 text-blue-700',
  WEEKEND_NIGHTLY: 'bg-violet-50 text-violet-700',
  SEASONAL_NIGHTLY: 'bg-orange-50 text-orange-700',
  HOURLY: 'bg-teal-50 text-teal-700',
};

interface FormData {
  priceType: string;
  price: number;
  startDate?: string;
  endDate?: string;
  hourFrom?: number;
  hourTo?: number;
  minNights?: number;
  discount?: number;
}

export default function PricingPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [rules, setRules] = useState<AdminPriceRule[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AdminPriceRule | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>();
  const priceType = watch('priceType');

  useEffect(() => {
    roomsApi.list({ limit: 50 }).then((r) => setRooms(r.items)).catch(() => {});
  }, []);

  const loadRules = async (roomId: string) => {
    const data = await adminPricingApi.listByRoom(roomId).catch(() => []);
    setRules(data);
  };

  const selectRoom = (roomId: string) => {
    setSelected(roomId);
    setShowForm(false);
    setEditing(null);
    loadRules(roomId);
  };

  const openCreate = () => {
    setEditing(null);
    reset({ priceType: 'BASE_NIGHTLY', price: 0 });
    setShowForm(true);
  };

  const openEdit = (rule: AdminPriceRule) => {
    setEditing(rule);
    reset({
      priceType: rule.priceType,
      price: rule.price,
      startDate: rule.startDate?.slice(0, 10) ?? undefined,
      endDate: rule.endDate?.slice(0, 10) ?? undefined,
      hourFrom: rule.hourFrom ?? undefined,
      hourTo: rule.hourTo ?? undefined,
      minNights: rule.minNights ?? undefined,
      discount: rule.discount ? rule.discount * 100 : undefined,
    });
    setShowForm(true);
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Xóa rule giá này?')) return;
    await adminPricingApi.remove(id);
    if (selected) loadRules(selected);
  };

  const onSubmit = async (data: FormData) => {
    if (!selected) return;
    setSaving(true);
    try {
      const payload = {
        priceType: data.priceType as AdminPriceRule['priceType'],
        price: Number(data.price),
        startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        daysOfWeek: [],
        hourFrom: data.hourFrom ? Number(data.hourFrom) : null,
        hourTo: data.hourTo ? Number(data.hourTo) : null,
        minNights: data.minNights ? Number(data.minNights) : null,
        discount: data.discount ? Number(data.discount) / 100 : null,
      };
      if (editing) {
        await adminPricingApi.update(editing.id, payload);
      } else {
        await adminPricingApi.create(selected, payload);
      }
      setShowForm(false);
      loadRules(selected);
    } finally { setSaving(false); }
  };

  return (
    <>
      <Header title="Bảng giá" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid lg:grid-cols-[280px_1fr] gap-6">
          {/* Room list */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-2 space-y-0.5">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-3 py-2">Chọn phòng</p>
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => selectRoom(room.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  selected === room.id ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                {room.name}
              </button>
            ))}
          </div>

          {/* Rules panel */}
          <div className="space-y-4">
            {!selected ? (
              <div className="flex items-center justify-center h-48 text-slate-400 text-sm bg-white rounded-xl border border-slate-200">
                Chọn một phòng để xem bảng giá
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-800">
                    {rooms.find(r => r.id === selected)?.name}
                    <span className="ml-2 text-sm font-normal text-slate-400">({rules.length} rules)</span>
                  </h2>
                  <Button size="sm" onClick={openCreate} className="gap-1.5">
                    <Plus size={14} /> Thêm rule giá
                  </Button>
                </div>

                {/* Form */}
                {showForm && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-800 text-sm">{editing ? 'Sửa rule giá' : 'Thêm rule giá mới'}</h3>
                      <button onClick={() => setShowForm(false)}><X size={16} className="text-slate-400" /></button>
                    </div>
                    <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-xs">Loại giá</Label>
                        <Select value={priceType} onValueChange={(v) => setValue('priceType', v ?? 'BASE_NIGHTLY')}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PRICE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Giá (₫)</Label>
                        <Input type="number" min={0} className="h-9 text-sm" {...register('price', { required: true, min: 0 })} />
                      </div>
                      {priceType === 'SEASONAL_NIGHTLY' && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Từ ngày</Label>
                            <Input type="date" className="h-9 text-sm" {...register('startDate')} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Đến ngày</Label>
                            <Input type="date" className="h-9 text-sm" {...register('endDate')} />
                          </div>
                        </>
                      )}
                      {priceType === 'HOURLY' && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Giờ bắt đầu (0-23)</Label>
                            <Input type="number" min={0} max={23} className="h-9 text-sm" {...register('hourFrom')} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giờ kết thúc (0-23)</Label>
                            <Input type="number" min={0} max={23} className="h-9 text-sm" {...register('hourTo')} />
                          </div>
                        </>
                      )}
                      {priceType !== 'HOURLY' && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-xs">Lưu trú tối thiểu (đêm)</Label>
                            <Input type="number" min={1} className="h-9 text-sm" placeholder="Bỏ qua" {...register('minNights')} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Giảm giá (%)</Label>
                            <Input type="number" min={0} max={100} className="h-9 text-sm" placeholder="0" {...register('discount')} />
                          </div>
                        </>
                      )}
                      <div className="col-span-2 flex gap-2 justify-end">
                        <Button variant="outline" size="sm" type="button" onClick={() => setShowForm(false)}>Hủy</Button>
                        <Button size="sm" type="submit" disabled={saving} className="gap-1">
                          {saving && <Loader2 size={12} className="animate-spin" />}
                          {editing ? 'Cập nhật' : 'Thêm'}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Rules list */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                  {rules.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm">Chưa có rule giá nào. Thêm rule đầu tiên.</div>
                  ) : rules.map((rule) => (
                    <div key={rule.id} className="flex items-center gap-3 px-4 py-3">
                      <Badge className={`text-xs shrink-0 ${TYPE_COLOR[rule.priceType] ?? ''}`}>
                        {PRICE_TYPES.find(t => t.value === rule.priceType)?.label ?? rule.priceType}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-slate-800">
                          {rule.price.toLocaleString('vi-VN')}₫
                        </span>
                        <span className="text-slate-400 ml-1 text-xs">
                          {rule.priceType.includes('NIGHTLY') ? '/đêm' : '/giờ'}
                        </span>
                        {rule.startDate && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({rule.startDate.slice(0, 10)} – {rule.endDate?.slice(0, 10)})
                          </span>
                        )}
                        {rule.hourFrom != null && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({rule.hourFrom}h – {rule.hourTo}h)
                          </span>
                        )}
                        {rule.minNights && (
                          <span className="ml-2 text-xs text-slate-500">
                            ≥{rule.minNights} đêm, giảm {rule.discount != null ? Math.round(rule.discount * 100) : 0}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => openEdit(rule)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => deleteRule(rule.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
