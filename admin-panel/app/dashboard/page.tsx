'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { getAuth } from '@/lib/auth';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

type Overview = {
  totals: { active: number; inactive: number; total: number };
  feeds: { main: number; light: number; category: number; low_value: number };
  states: { hidden: number; pinned: number; expiring_soon: number; expired: number };
  sources: { active: number; backlog: number; hard_backlog: number; total: number };
};

type Stats = {
  feed_distribution: Array<{ campaign_type: string | null; value_level: string | null; count: number }>;
  hidden_breakdown: Array<{ campaign_type: string | null; count: number }>;
  pinned_breakdown: Array<{ campaign_type: string | null; count: number }>;
  expiring_breakdown: Array<{ campaign_type: string | null; count: number }>;
  top_sources: Array<{ source_name: string; count: number }>;
};

const COLORS = ['#007AFF', '#5AC8FA', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const auth = getAuth();

  useEffect(() => {
    if (!auth) return;

    const loadData = async () => {
      setLoading(true);
      setError('');

      try {
        const [overviewRes, statsRes] = await Promise.all([
          apiFetch<Overview>('/overview', auth),
          apiFetch<Stats>('/stats', auth),
        ]);

        if (overviewRes.error) {
          setError(overviewRes.error);
        } else if (overviewRes.data) {
          setOverview(overviewRes.data);
        }

        if (statsRes.error) {
          console.error('Stats error:', statsRes.error);
        } else if (statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Veri yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [auth]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="p-8">
          <p className="text-red-600">Hata: {error}</p>
        </div>
      </AdminLayout>
    );
  }

  // Feed distribution için veri hazırla
  const feedData = overview
    ? [
        { name: 'Main', value: overview.feeds.main },
        { name: 'Light', value: overview.feeds.light },
        { name: 'Category', value: overview.feeds.category },
        { name: 'Low Value', value: overview.feeds.low_value },
      ]
    : [];

  // Source distribution için veri hazırla
  const sourceData = stats?.top_sources.slice(0, 10) || [];

  // Campaign type distribution için veri hazırla
  const campaignTypeData = stats?.feed_distribution.map((item) => ({
    name: item.campaign_type || 'main',
    value: item.count,
  })) || [];

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Toplam Kampanya"
            value={overview?.totals.total || 0}
            subtitle={`${overview?.totals.active || 0} aktif, ${overview?.totals.inactive || 0} pasif`}
            color="blue"
          />
          <StatCard
            title="Aktif Kaynaklar"
            value={overview?.sources.active || 0}
            subtitle={`${overview?.sources.total || 0} toplam kaynak`}
            color="green"
          />
          <StatCard
            title="Main Feed"
            value={overview?.feeds.main || 0}
            subtitle="Ana feed'deki kampanyalar"
            color="purple"
          />
          <StatCard
            title="Yakında Bitecek"
            value={overview?.states.expiring_soon || 0}
            subtitle="7 gün içinde bitecek"
            color="orange"
          />
        </div>

        {/* Grafikler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Feed Distribution Pie Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Feed Dağılımı</h2>
            {feedData.some((d) => d.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feedData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Henüz veri yok</p>
            )}
          </div>

          {/* Top Sources Bar Chart */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">En Çok Kampanya Olan Kaynaklar</h2>
            {sourceData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sourceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="source_name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#007AFF" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-500 text-center py-12">Henüz veri yok</p>
            )}
          </div>
        </div>

        {/* Detaylı İstatistikler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Feed Sayıları</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Main Feed:</span>
                <span className="font-semibold">{overview?.feeds.main || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Light Feed:</span>
                <span className="font-semibold">{overview?.feeds.light || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Category Feed:</span>
                <span className="font-semibold">{overview?.feeds.category || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Low Value:</span>
                <span className="font-semibold">{overview?.feeds.low_value || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Durumlar</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Gizli:</span>
                <span className="font-semibold">{overview?.states.hidden || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Sabitlenmiş:</span>
                <span className="font-semibold">{overview?.states.pinned || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Yakında Bitecek:</span>
                <span className="font-semibold text-orange-600">{overview?.states.expiring_soon || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Süresi Dolmuş:</span>
                <span className="font-semibold text-red-600">{overview?.states.expired || 0}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Kaynak Durumları</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Aktif:</span>
                <span className="font-semibold text-green-600">{overview?.sources.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Backlog:</span>
                <span className="font-semibold text-yellow-600">{overview?.sources.backlog || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Hard Backlog:</span>
                <span className="font-semibold text-red-600">{overview?.sources.hard_backlog || 0}</span>
              </div>
              <div className="flex justify-between border-t pt-2 mt-2">
                <span>Toplam:</span>
                <span className="font-semibold">{overview?.sources.total || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/campaigns"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="font-semibold">Kampanyalar</div>
              <div className="text-sm text-gray-600 mt-1">Yönet</div>
            </Link>
            <Link
              href="/sources"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="font-semibold">Kaynaklar</div>
              <div className="text-sm text-gray-600 mt-1">Yönet</div>
            </Link>
            <Link
              href="/suggestions"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="font-semibold">Öneriler</div>
              <div className="text-sm text-gray-600 mt-1">İncele</div>
            </Link>
            <Link
              href="/governance/timeline"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
            >
              <div className="font-semibold">Timeline</div>
              <div className="text-sm text-gray-600 mt-1">Geçmiş</div>
            </Link>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-lg p-4`}>
      <div className="text-sm text-gray-600 mb-1">{title}</div>
      <div className="text-3xl font-bold mb-1">{value.toLocaleString('tr-TR')}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}
