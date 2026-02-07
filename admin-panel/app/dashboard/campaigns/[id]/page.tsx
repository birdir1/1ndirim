'use client';

import { useParams } from 'next/navigation';
import CampaignDetailView from '@/components/CampaignDetailView';

export default function DashboardCampaignDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  return <CampaignDetailView campaignId={id} backHref="/campaigns" backLabel="← Kampanyalar" />;
}

