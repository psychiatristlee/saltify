import type { Metadata } from 'next';
import styles from './page.module.css';
import Link from 'next/link';
import { STORE } from '@/lib/storeInfo';

export const metadata: Metadata = {
  title: 'メニュー | ソルトパン Salt,θ (Salt Bread) - 延南洞・弘大の塩パン専門店',
  description:
    'ソウル延南洞・弘大の塩パン専門店ソルトパン Salt,θ (Salt Bread) のメニュー。フランス産発酵バターとマルドン塩で焼く塩パン、プレーン・ガーリックバター・看板チョコバンなど全9種、コールドブリュー・ミルクティーも。毎日 11:00–19:30 営業 (年中無休)、弘大入口駅から徒歩5分。',
  alternates: { canonical: `${STORE.websiteUrl}/menu/jp` },
  openGraph: {
    title: 'メニュー | ソルトパン Salt,θ (Salt Bread)',
    description:
      'ソウル延南洞・弘大の塩パン専門店のフルメニュー。毎日 11:00–19:30 営業 (年中無休)。',
    url: `${STORE.websiteUrl}/menu/jp`,
    images: [{ url: STORE.ogImage, width: 1000, height: 1000 }],
    locale: 'ja_JP',
  },
};

export default function JapaneseMenu() {
  return (
    <div className={styles.container} lang="ja">
      <div className={styles.inner}>
        <div className={styles.header}>
          <Link href="/" className={styles.backButton}>←</Link>
          <h1 className={styles.title}>メニュー</h1>
        </div>
        <div className={styles.pdfWrapper}>
          <object
            data="/Salt_Menu_JP_Full.pdf"
            type="application/pdf"
            className={styles.pdfViewer}
          >
            <p className={styles.fallback}>
              PDFを表示できません。
              <a href="/Salt_Menu_JP_Full.pdf" download className={styles.downloadLink}>
                こちらからダウンロード
              </a>
            </p>
          </object>
        </div>
        <a href="/Salt_Menu_JP_Full.pdf" download className={styles.downloadButton}>
          📥 メニューをダウンロード (PDF)
        </a>
      </div>
    </div>
  );
}
