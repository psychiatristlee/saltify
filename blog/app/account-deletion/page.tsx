import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// A bare redirect. Without its own metadata it inherits the root layout's
// canonical (the homepage) and the whole hreflang cluster — neither of which
// belongs on a page that only forwards to the game host.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: '/account-deletion', languages: {} },
};

export default function AccountDeletion() {
  redirect('https://game.salt-bbang.com/account-deletion');
}
