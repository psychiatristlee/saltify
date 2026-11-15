import StoreInfoPage from '@/components/StoreInfoPage';
import { buildLocaleMetadata } from '@/lib/localeMetadata';
import { EXTRA_BUNDLES } from '@/lib/translations';

export const metadata = buildLocaleMetadata('es', EXTRA_BUNDLES.es.meta);

export default function Page() {
  return <StoreInfoPage lang="es" />;
}
