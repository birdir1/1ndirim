import CampaignsView, { FeedTypeOption } from '@/components/CampaignsView';

const FEED_OPTIONS: FeedTypeOption[] = [
  { value: 'main', label: 'Main' },
  { value: 'light', label: 'Light' },
  { value: 'low', label: 'Low Value' },
  { value: 'hidden', label: 'Hidden' },
];

export default function FlowCampaignsPage() {
  return (
    <CampaignsView
      title="Akış Kampanyaları"
      initialFeedType="main"
      feedTypeOptions={FEED_OPTIONS}
      description="Anasayfa/Akış için kullanılan kampanyalar."
    />
  );
}
