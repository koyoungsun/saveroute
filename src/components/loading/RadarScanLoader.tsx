import styles from "./RadarScanLoader.module.css";

type RadarScanLoaderProps = {
  label?: string;
  className?: string;
};

export function RadarScanLoader({
  label = "최적 할인 루트 탐색 중...",
  className,
}: RadarScanLoaderProps) {
  return (
    <div
      className={[styles.root, className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={styles.radar} aria-hidden="true">
        <span className={styles.ring} />
        <span className={styles.ringInner} />
        <span className={styles.sweep} />
        <span className={styles.pulse} />
      </div>
      <p className={styles.label}>{label}</p>
    </div>
  );
}
