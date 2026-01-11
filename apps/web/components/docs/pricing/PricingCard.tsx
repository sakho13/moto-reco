import Link from 'next/link'
import styles from './PricingCard.module.css'

interface PricingCardProps {
  name: string
  price: string
  period?: string
  description: string
  features: string[]
  ctaLabel: string
  ctaHref: string
  badge?: string
  isPopular?: boolean
  isComingSoon?: boolean
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  ctaLabel,
  ctaHref,
  badge,
  isPopular = false,
  isComingSoon = false,
}: PricingCardProps) {
  return (
    <article className={`${styles.card} ${isPopular ? styles.popular : ''}`}>
      {badge && <div className={styles.badge}>{badge}</div>}

      <div className={styles.header}>
        <h3 className={styles.name}>{name}</h3>
        <div className={styles.priceGroup}>
          <div className={styles.price}>{price}</div>
          {period && <div className={styles.period}>{period}</div>}
        </div>
        <p className={styles.description}>{description}</p>
      </div>

      <ul className={styles.features}>
        {features.map((feature, index) => (
          <li key={index} className={styles.feature}>
            <span className={styles.checkIcon} aria-hidden="true">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M16.667 5L7.5 14.167L3.333 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className={styles.ctaWrapper}>
        {isComingSoon ? (
          <button
            className={`${styles.cta} ${styles.ctaDisabled}`}
            disabled
            aria-label={`${name}は現在準備中です`}
          >
            {ctaLabel}
          </button>
        ) : (
          <Link
            href={ctaHref}
            className={styles.cta}
            target="_blank"
            rel="noreferrer"
          >
            {ctaLabel}
          </Link>
        )}
      </div>
    </article>
  )
}
