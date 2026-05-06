import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';

type SDK = {
  title: string;
  description: string;
  to: string;
};

const sdks: SDK[] = [
  {
    title: 'iOS',
    description: 'Swift/Objective-C SDK distributed via CocoaPods and SPM.',
    to: '/ios',
  },
  {
    title: 'Android',
    description: 'Kotlin/Java SDK distributed via Maven Central.',
    to: '/android',
  },
  {
    title: 'React Native',
    description: 'JavaScript/TypeScript SDK for Expo and bare React Native apps.',
    to: '/react-native',
  },
];

export default function Home() {
  const { siteConfig } = useDocusaurusContext();

  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <h1 className={styles.heroTitle}>{siteConfig.title}</h1>
          <p className={styles.heroTagline}>{siteConfig.tagline}</p>
        </section>

        <section className={styles.cards}>
          {sdks.map((sdk) => (
            <Link key={sdk.to} to={sdk.to} className={styles.card}>
              <h2 className={styles.cardTitle}>{sdk.title}</h2>
              <p className={styles.cardDescription}>{sdk.description}</p>
              <span className={styles.cardArrow}>Read the docs →</span>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
