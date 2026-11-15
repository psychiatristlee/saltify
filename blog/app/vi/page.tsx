import StoreInfoPage from '@/components/StoreInfoPage';
import { buildLocaleMetadata } from '@/lib/localeMetadata';
import { EXTRA_BUNDLES } from '@/lib/translations';

export const metadata = buildLocaleMetadata('vi', EXTRA_BUNDLES.vi.meta);

export default function Page() {
  return <StoreInfoPage lang="vi" />;
}
