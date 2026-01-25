import styles from './ComboView.module.css';

interface Props {
  comboCount: number;
}

export default function ComboView({ comboCount }: Props) {
  return (
    <div className={styles.overlay}>
      <div className={styles.text}>{comboCount}x 콤보!</div>
    </div>
  );
}
