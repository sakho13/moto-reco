'use client'

import styles from './StepIndicator.module.css'

export interface StepIndicatorProps {
  currentStep: 1 | 2 | 3
  totalSteps?: number
}

export const StepIndicator = ({
  currentStep,
  totalSteps = 3,
}: StepIndicatorProps) => {
  return (
    <div className={styles.container}>
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className={styles.stepWrapper}>
          <div
            className={`${styles.stepCircle} ${
              currentStep >= step ? styles.active : styles.inactive
            }`}
          >
            {step}
          </div>
          {step < totalSteps && (
            <div
              className={`${styles.connector} ${
                currentStep > step ? styles.active : styles.inactive
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}
