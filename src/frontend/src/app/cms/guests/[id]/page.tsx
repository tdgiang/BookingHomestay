'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/cms/header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { adminGuestsApi, AdminGuest, GuestBookingHistory } from '@/lib/admin-api';
import {
  ChevronLeft, Loader2, Save, Phone, Mail, Tag, Calendar, CheckCircle2,
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'text-orange-600 bg-orange-50',
  CONFIRMED: 'text-green-600 bg-green-50',
  CHECKED_IN: 'text-blue-600 bg-blue-50',
  CHECKED_OUT: 'text-slate-600 bg-slate-100',
  CANCELLED: 'text-red-600 bg-red-50',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ TT',
  CONFIRMED: 'Đã xác nhận',
  CHECKED_IN: 'Check-in',
  CHECKED_OUT: 'Check-out',
  CANCELLED: 'Đã hủy',
};

const TAG_OPTIONS = ['VIP', 'Khách quen', 'Khách nhóm'];

const TAG_COLORS: Record<string, string> = {
  VIP: 'bg-amber-50 text-amber-700',
  'Khách quen': 'bg-blue-50 text-blue-700',
  'Khách nhóm': 'bg-purple-50 text-purple-700',
};

function tagColor(tag: string) {
  return TAG_COLORS[tag] ?? 'bg-slate-100 text-slate-600';
}

export default function GuestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [guest, setGuest] = useState<AdminGuest | null>(null);
  const [history, setHistory] = useState<GuestBookingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    Promise.all([adminGuestsApi.get(id), adminGuestsApi.history(id)])
      .then(([g, h]) => {
        setGuest(g);
        setTags(g.tags);
        setNotes(g.notes ?? '');
        setHistory(h);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (!guest) return;
    setSaving(true);
    try {
      const updated = await adminGuestsApi.update(guest.id, { tags, notes });
      setGuest(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const totalSpend = history
    .filter((b) => b.status !== 'CANCELLED')
    .reduce((sum, b) => sum + b.totalPrice, 0);

  if (loading) {
    return (
      <>
        <Header title="Chi tiết khách hàng" />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      </>
    );
  }

  if (!guest) {
    return (
      <>
        <Header title="Chi tiết khách hàng" />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-slate-500">Không tìm thấy khách hàng</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Chi tiết khách hàng" />
      <main className="flex-1 p-6 overflow-auto">
        {/* Back button */}
        <Link
          href="/cms/guests"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors"
        >
          <ChevronLeft size={15} />
          Danh sách khách hàng
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — Profile + Edit */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-full bg-slate-200 flex items-center justify-center text-lg font-semibold text-slate-600">
                  {guest.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-slate-800">{guest.fullName}</h2>
                  <p className="text-xs text-slate-400">Từ {new Date(guest.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone size={14} className="text-slate-400" />
                  <span className="font-mono">{guest.phone}</span>
                </div>
                {guest.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={14} className="text-slate-400" />
                    <span>{guest.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{history.filter(b => b.status !== 'CANCELLED').length} đặt phòng</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Tag size={14} className="text-slate-400" />
                  <span>{totalSpend.toLocaleString('vi-VN')}₫ tổng chi tiêu</span>
                </div>
              </div>
            </div>

            {/* Edit form */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h3 className="font-medium text-slate-700 text-sm mb-4">Tags & Ghi chú</h3>

              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {TAG_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        tags.includes(t)
                          ? `${tagColor(t)} border-transparent`
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {tags.filter(t => !TAG_OPTIONS.includes(t)).map(t => (
                  <Badge key={t} className={`text-xs mt-2 ${tagColor(t)}`}>{t}</Badge>
                ))}
              </div>

              <div className="mb-4">
                <label className="text-xs text-slate-500 block mb-1.5">Ghi chú nội bộ</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú về khách hàng..."
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className={`w-full gap-1.5 ${saved ? 'bg-green-600 hover:bg-green-600' : ''}`}
              >
                {saving ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : saved ? (
                  <CheckCircle2 size={13} />
                ) : (
                  <Save size={13} />
                )}
                {saved ? 'Đã lưu' : 'Lưu thay đổi'}
              </Button>
            </div>
          </div>

          {/* Right — Booking history */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-medium text-slate-700 text-sm">
                  Lịch sử đặt phòng
                  <span className="ml-2 text-slate-400 font-normal">({history.length})</span>
                </h3>
              </div>
              {history.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">Chưa có đặt phòng nào</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left">
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Mã ĐP</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phòng</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Check-in</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái</th>
                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tổng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((b) => (
                        <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-mono text-xs text-slate-600 font-semibold">{b.bookingCode}</td>
                          <td className="px-4 py-3 text-slate-700">{b.room.name}</td>
                          <td className="px-4 py-3 text-slate-500 text-xs">
                            {new Date(b.checkIn).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="px-4 py-3">
                            <Badge className={`text-xs ${STATUS_BADGE[b.status] ?? 'bg-slate-100 text-slate-600'}`}>
                              {STATUS_LABEL[b.status] ?? b.status}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-medium">
                            {b.totalPrice.toLocaleString('vi-VN')}₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
