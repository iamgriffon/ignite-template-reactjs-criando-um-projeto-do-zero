import { useRouter } from 'next/router';
import styles from './header.module.scss';

export default function Header() {
  const router = useRouter();
  function GoHome() {
    router.push('/')
  };

  return (
    <header className={styles.headerContainer}>
      <div className={styles.headerContent} onClick={GoHome}>
        <img src="/images/logo.svg" alt="logo" />
      </div>
    </header>
  )
}
