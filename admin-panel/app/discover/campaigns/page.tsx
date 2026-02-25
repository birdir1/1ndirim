import CampaignsView, { FeedTypeOption } from '@/components/CampaignsView';

const FEED_OPTIONS: FeedTypeOption[] = [
  { value: 'category', label: 'Category' },
];

export default function DiscoverCampaignsPage() {
  return (
    <CampaignsView
      title="Keşfet Kampanyaları"
      initialFeedType="category"
      lockFeedType
      feedTypeOptions={FEED_OPTIONS}
      description="Keşfet ekranı için category feed kampanyaları."
    />
  );
}
