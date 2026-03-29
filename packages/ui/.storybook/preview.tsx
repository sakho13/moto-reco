import type { Preview } from '@storybook/react'
import { ThemeProvider } from '../src/context/ThemeContext'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div
          style={{
            padding: '24px',
            backgroundColor: 'var(--color-snow)',
            minHeight: '100vh',
          }}
        >
          <Story />
        </div>
      </ThemeProvider>
    ),
  ],
}

export default preview
