// @ts-check
const { getDefaultConfig } = require('expo/metro-config')

/**
 * Metro の設定
 *
 * @remarks
 * モノレポ（pnpm workspace）のパッケージ参照は Expo の既定設定が自動で行う。
 *
 * Firebase Auth は package.json の `exports` で `default` 条件が `react-native`
 * 条件より先に書かれているため、そのままでは Web 用のビルドが選ばれ、
 * `getReactNativePersistence` が使えずログイン状態がアプリの再起動で消える。
 * Firebase のパッケージだけ `exports` を使わずに解決し、package.json の
 * `react-native` フィールド（React Native 用のビルド）を使わせる。
 */
const config = getDefaultConfig(__dirname)

const FIREBASE_PACKAGE_PATTERN = /^(firebase|@firebase)(\/|$)/

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && FIREBASE_PACKAGE_PATTERN.test(moduleName)) {
    return context.resolveRequest(
      { ...context, unstable_enablePackageExports: false },
      moduleName,
      platform
    )
  }
  return context.resolveRequest(context, moduleName, platform)
}

module.exports = config
