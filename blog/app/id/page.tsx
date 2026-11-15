import StoreInfoPage from '@/components/StoreInfoPage';
import { buildLocaleMetadata } from '@/lib/localeMetadata';
import { EXTRA_BUNDLES } from '@/lib/translations';

export const metadata = buildLocaleMetadata('id', EXTRA_BUNDLES.id.meta);

export default function Page() {
  return <StoreInfoPage lang="id" />;
}
