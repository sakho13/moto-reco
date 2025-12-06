import nextAdminPreset from '@premieroctet/next-admin/preset'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@premieroctet/next-admin/dist/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [nextAdminPreset],
  darkMode: 'class',
}
