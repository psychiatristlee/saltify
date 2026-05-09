import type { Metadata } from 'next';
import styles from './page.module.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'メニュー | ソルトパン Salt,0 - 弘大の手作り塩パン専門店',
  description:
    'ソウル弘大・延南洞の手作り塩パン専門店ソルトパンのメニュー。プレーン、ガーリックバター、看板チョコバンなど全7種、コールドブリュー・ミルクティーも。弘大入口駅から徒歩5分。',
  openGraph: {
    title: 'メニュー | ソルトパン Salt,0',
    description: 'ソウル弘大の手作り塩パン専門店のフルメニュー',
    locale: 'ja_JP',
  },
};

export default function JapaneseMenu() {
  return (
    <div className={styles.container}>
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
