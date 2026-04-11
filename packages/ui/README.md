# @packages/ui

モノレポ全体で使用するReact UIコンポーネントライブラリです。デザイントークンベースのテーマシステムにより、統一されたスタイリングを実現します。

## 概要

このパッケージは以下を提供します：

- **UIコンポーネント**: Button, Input, Textarea, Checkbox, Select, Label, ErrorMessage, FormField, BaseCard, ToggleSection, FuelEfficiencyChart
- **テーマシステム**: `ThemeProvider` と `useTheme` フックによるテーマ管理
- **CSS変数**: 61個のデザイントークンベースのCSS変数
- **TypeScript対応**: 完全な型定義

## インストール

このパッケージはモノレポ内部パッケージです。使用するには `package.json` に依存を追加してください：

```json
{
  "dependencies": {
    "@packages/ui": "workspace:*"
  }
}
```

## 基本的な使い方

### Step 1: ThemeProviderのセットアップ

アプリケーションのルートで `ThemeProvider` を設定します：

```tsx
import { ThemeProvider } from '@packages/ui'

export default function App({ children }) {
  return <ThemeProvider initialThemeName="default">{children}</ThemeProvider>
}
```

### Step 2: コンポーネントの使用

```tsx
import { Button, FormField, Input } from '@packages/ui'

export function LoginForm() {
  return (
    <form>
      <FormField label="メールアドレス" htmlFor="email" required>
        <Input id="email" type="email" placeholder="example@example.com" />
      </FormField>

      <Button variant="primary" fullWidth>
        ログイン
      </Button>
    </form>
  )
}
```

### Step 3: テーマの切り替え

```tsx
import { useTheme } from '@packages/ui'

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme()

  return (
    <button
      onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
    >
      現在のモード: {themeMode}
    </button>
  )
}
```

## CSS変数リファレンス

`ThemeProvider` は以下のCSS変数を `document.documentElement` に設定します。これらの変数はCSSやCSS Moduleで直接使用できます。

### カラー変数（17個）

#### 背景色

| CSS変数名             | 値（Light） | 用途                     |
| --------------------- | ----------- | ------------------------ |
| `--color-background`  | `#FFFFFF`   | ページ背景色             |
| `--color-cloud`       | `#F7F7F7`   | サブ背景色（通常状態）   |
| `--color-cloudHover`  | `#E1E1E1`   | サブ背景色（ホバー）     |
| `--color-cloudActive` | `#CFCFCF`   | サブ背景色（アクティブ） |

#### ブランドカラー（プライマリ）

| CSS変数名               | 値（Light） | 用途                                   |
| ----------------------- | ----------- | -------------------------------------- |
| `--color-product`       | `#0070F3`   | プライマリブランドカラー（通常）       |
| `--color-productHover`  | `#005FCC`   | プライマリブランドカラー（ホバー）     |
| `--color-productActive` | `#004299`   | プライマリブランドカラー（アクティブ） |

#### 成功カラー

| CSS変数名               | 値（Light） | 用途                   |
| ----------------------- | ----------- | ---------------------- |
| `--color-success`       | `#3bceac`   | 成功状態（通常）       |
| `--color-successHover`  | `#32b89c`   | 成功状態（ホバー）     |
| `--color-successActive` | `#279f85`   | 成功状態（アクティブ） |

#### エラーカラー

| CSS変数名              | 値（Light） | 用途                           |
| ---------------------- | ----------- | ------------------------------ |
| `--color-danger`       | `#CC0000`   | エラー・危険状態（通常）       |
| `--color-dangerHover`  | `#AA0000`   | エラー・危険状態（ホバー）     |
| `--color-dangerActive` | `#880000`   | エラー・危険状態（アクティブ） |

#### 警告カラー

| CSS変数名               | 値（Light） | 用途                   |
| ----------------------- | ----------- | ---------------------- |
| `--color-warning`       | `#FFD166`   | 警告状態（通常）       |
| `--color-warningHover`  | `#E6B800`   | 警告状態（ホバー）     |
| `--color-warningActive` | `#CC9900`   | 警告状態（アクティブ） |

#### ソーシャルカラー

| CSS変数名              | 値（Light） | 用途                                   |
| ---------------------- | ----------- | -------------------------------------- |
| `--color-social`       | `#3B5998`   | ソーシャルログインボタン（通常）       |
| `--color-socialHover`  | `#2D4373`   | ソーシャルログインボタン（ホバー）     |
| `--color-socialActive` | `#1A2A4A`   | ソーシャルログインボタン（アクティブ） |

#### テキストカラー

| CSS変数名          | 値（Light） | 用途                           |
| ------------------ | ----------- | ------------------------------ |
| `--color-ink`      | `#324256`   | 標準テキストカラー             |
| `--color-inkLight` | `#4E5C6F`   | サブテキスト・ヘルパーテキスト |
| `--color-inkDark`  | `#0B0C0F`   | 強調テキスト                   |

### スペーシング変数（11個）

マージン・パディング・ギャップなどに使用するスペーシングスケール。

| CSS変数名      | 値（rem） | ピクセル換算（16px基準） |
| -------------- | --------- | ------------------------ |
| `--spacing-0`  | `0`       | 0px                      |
| `--spacing-1`  | `0.25rem` | 4px                      |
| `--spacing-2`  | `0.5rem`  | 8px                      |
| `--spacing-3`  | `0.75rem` | 12px                     |
| `--spacing-4`  | `1rem`    | 16px                     |
| `--spacing-5`  | `1.25rem` | 20px                     |
| `--spacing-6`  | `1.5rem`  | 24px                     |
| `--spacing-8`  | `2rem`    | 32px                     |
| `--spacing-10` | `2.5rem`  | 40px                     |
| `--spacing-12` | `3rem`    | 48px                     |
| `--spacing-16` | `4rem`    | 64px                     |

### フォント変数

#### フォントサイズ（7個）

| CSS変数名         | 値（rem）  | ピクセル換算（16px基準） | 用途                 |
| ----------------- | ---------- | ------------------------ | -------------------- |
| `--font-size-xs`  | `0.75rem`  | 12px                     | 補足テキスト         |
| `--font-size-sm`  | `0.875rem` | 14px                     | 小さめのテキスト     |
| `--font-size-md`  | `1rem`     | 16px                     | 標準テキスト         |
| `--font-size-lg`  | `1.125rem` | 18px                     | やや大きめのテキスト |
| `--font-size-xl`  | `1.25rem`  | 20px                     | 見出し小             |
| `--font-size-2xl` | `1.5rem`   | 24px                     | 見出し中             |
| `--font-size-3xl` | `1.875rem` | 30px                     | 見出し大             |

#### フォントウェイト（4個）

| CSS変数名              | 値    | 用途         |
| ---------------------- | ----- | ------------ |
| `--font-weight-thin`   | `100` | 極細フォント |
| `--font-weight-normal` | `400` | 標準フォント |
| `--font-weight-medium` | `500` | 中太フォント |
| `--font-weight-bold`   | `700` | 太字フォント |

#### ラインハイト（3個）

| CSS変数名               | 値     | 用途                               |
| ----------------------- | ------ | ---------------------------------- |
| `--line-height-tight`   | `1.25` | タイトな行間（見出し向け）         |
| `--line-height-normal`  | `1.5`  | 標準行間                           |
| `--line-height-relaxed` | `1.75` | ゆったりした行間（読みやすさ重視） |

### デザイン要素

#### ボーダーラディス（5個）

| CSS変数名       | 値        | 用途                |
| --------------- | --------- | ------------------- |
| `--radius-none` | `0`       | 角丸なし            |
| `--radius-sm`   | `0.25rem` | 小さい角丸（4px）   |
| `--radius-md`   | `0.5rem`  | 中程度の角丸（8px） |
| `--radius-lg`   | `1rem`    | 大きい角丸（16px）  |
| `--radius-full` | `9999px`  | 完全な円形          |

#### シャドウ（3個）

| CSS変数名     | 値                                                               | 用途                               |
| ------------- | ---------------------------------------------------------------- | ---------------------------------- |
| `--shadow-sm` | `0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)`   | 小さいシャドウ（カード等）         |
| `--shadow-md` | `0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)`    | 中程度のシャドウ（モーダル等）     |
| `--shadow-lg` | `0 10px 20px rgba(0, 0, 0, 0.19), 0 6px 6px rgba(0, 0, 0, 0.23)` | 大きいシャドウ（ドロップダウン等） |

#### トランジション（3個）

| CSS変数名           | 値                                   | 用途                       |
| ------------------- | ------------------------------------ | -------------------------- |
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | 高速アニメーション         |
| `--transition-base` | `200ms cubic-bezier(0.4, 0, 0.2, 1)` | 標準アニメーション         |
| `--transition-slow` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | ゆっくりしたアニメーション |

## コンポーネントAPI

### Button

ボタンコンポーネント。バリアント、サイズ、ローディング状態をサポート。

```tsx
interface ButtonProps {
  variant?: 'primary' | 'danger' | 'social' | 'cloud'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  fullWidth?: boolean
}
```

**使用例:**

```tsx
<Button variant="primary" size="md" onClick={handleSubmit}>
  送信
</Button>

<Button variant="danger" loading>
  処理中...
</Button>

<Button variant="social" fullWidth>
  Googleでログイン
</Button>
```

### Input

入力フィールドコンポーネント。エラー状態をサポート。

```tsx
interface InputProps {
  error?: boolean
  helperText?: string
}
```

**使用例:**

```tsx
<Input type="email" placeholder="メールアドレス" error={!!emailError} />
```

### Label

ラベルコンポーネント。必須マークを表示可能。

```tsx
interface LabelProps {
  htmlFor?: string
  required?: boolean
}
```

**使用例:**

```tsx
<Label htmlFor="password" required>
  パスワード
</Label>
```

### ErrorMessage

エラーメッセージ表示用コンポーネント。

**使用例:**

```tsx
<ErrorMessage>メールアドレスの形式が正しくありません</ErrorMessage>
```

### FormField

Label + Input + ErrorMessage を統合したフォームフィールドコンテナ。

```tsx
interface FormFieldProps {
  label?: string
  htmlFor?: string
  required?: boolean
  error?: string
  helperText?: string
}
```

**使用例:**

```tsx
<FormField
  label="メールアドレス"
  htmlFor="email"
  required
  error={emailError}
  helperText="有効なメールアドレスを入力してください"
>
  <Input id="email" type="email" error={!!emailError} />
</FormField>
```

### BaseCard

汎用的なカードレイアウトコンポーネント。

```tsx
interface BaseCardProps {
  title: string
  footer?: React.ReactNode
  children: React.ReactNode
}
```

**使用例:**

```tsx
<BaseCard
  title="ログイン"
  footer={
    <p>
      アカウントをお持ちでない方は<Link href="/register">新規登録</Link>
    </p>
  }
>
  <LoginForm />
</BaseCard>
```

### Textarea

複数行テキスト入力フィールドコンポーネント。エラー状態とヘルパーテキストをサポート。

```tsx
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  helperText?: string
}
```

**主な機能:**

- 複数行入力対応
- エラー状態表示（ボーダー色が危険色に変更）
- ヘルパーテキスト表示
- 垂直方向のみリサイズ可能
- 最小高さ: 80px

**使用例:**

```tsx
<Textarea
  placeholder="メモを入力してください"
  rows={3}
  error={!!memoError}
  helperText="最大500文字"
  maxLength={500}
/>
```

### Checkbox

チェックボックスコンポーネント。ラベル統合型でエラー状態をサポート。

```tsx
interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean
  helperText?: string
  label?: string
}
```

**主な機能:**

- ラベル統合型（label内にinput配置）
- エラー状態表示
- ヘルパーテキスト表示
- アクセント色: `--color-product`（blue）
- サイズ: 20px × 20px

**使用例:**

```tsx
<Checkbox
  id="terms"
  checked={accepted}
  onChange={(e) => setAccepted(e.target.checked)}
  label="利用規約に同意する"
/>
```

### Select

セレクトボックスコンポーネント。選択肢配列で管理し、エラー状態をサポート。

```tsx
interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: SelectOption[]
  error?: boolean
  helperText?: string
  placeholder?: string
}
```

**主な機能:**

- ネイティブなselect要素を使用
- 選択肢を配列で管理
- エラー状態表示
- ヘルパーテキスト表示
- プレースホルダー対応
- アクセシビリティ対応（aria-describedby）

**使用例:**

```tsx
<Select
  options={[
    { value: 'option1', label: 'オプション1' },
    { value: 'option2', label: 'オプション2' },
    { value: 'option3', label: 'オプション3', disabled: true },
  ]}
  placeholder="選択してください"
  error={!!selectError}
  helperText="いずれかを選択してください"
/>
```

### ToggleSection

アコーディオン型のコンテンツ開閉セクション。初期表示状態を制御可能。

```tsx
interface ToggleSectionProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}
```

**主な機能:**

- アコーディオン型のコンテンツ表示/非表示
- 初期表示状態を制御（defaultOpen）
- aria-expanded属性でアクセシビリティ対応
- アイコン表示（+: 閉じた状態、−: 開いた状態）
- フォーカス時にアウトライン表示

**使用例:**

```tsx
<ToggleSection title="詳細設定" defaultOpen={false}>
  <div className="p-4">
    <p>詳細な設定内容がここに表示されます</p>
  </div>
</ToggleSection>
```

### FuelEfficiencyChart

給油履歴データを元に燃費推移をグラフで可視化するコンポーネント。Rechartsを使用。

```tsx
interface FuelEfficiencyChartProps {
  fuelLogs: ApiResponseFuelLogDetail[]
}

interface FuelChartDataPoint {
  date: string // 表示用日付（MM/DD形式）
  originalDate: string // 元のISO日付文字列
  fuelEfficiency: number // 燃費 (km/L)
  mileage: number // 総走行距離 (km)
  amount: number // 給油量 (L)
  totalPrice: number // 給油価格 (円)
}

interface FuelEfficiencyStats {
  maxEfficiency: number // 最高燃費
  maxEfficiencyDate: string // 最高燃費の日付
  minEfficiency: number // 最低燃費
  minEfficiencyDate: string // 最低燃費の日付
  averageEfficiency: number // 平均燃費
  dataPointCount: number // データポイント数
}
```

**主な機能:**

- Recharts LineChartで燃費推移を可視化
- 給油ログデータを自動変換・フィルタリング
- 直近1年分（365日）のデータを自動抽出
- データ変換と統計計算をmemo化（パフォーマンス最適化）
- レスポンシブデザイン（モバイルでは高さ300px）

**表示要素:**

1. **メインラインチャート**: 燃費推移（青色）
2. **平均値ライン**: 破線で平均燃費表示（緑色）
3. **最高燃費マーカー**: 緑色ドット + 「最高: X.X」ラベル
4. **最低燃費マーカー**: 赤色ドット + 「最低: X.X」ラベル
5. **カスタムツールチップ**: 日付・燃費・走行距離・給油量を表示
6. **空状態**: データがない場合の「燃費データがありません」メッセージ

**カスタムツールチップ表示内容:**

```
2024/12/15
燃費: 18.4 km/L
走行距離: 13,640 km
給油量: 11.7 L
```

**使用例:**

```tsx
import { FuelEfficiencyChart } from '@repo/ui/fuelEfficiencyChart'
import type { ApiResponseFuelLogDetail } from '@repo/shared-types'

function FuelLogsPage() {
  const [fuelLogs, setFuelLogs] = useState<ApiResponseFuelLogDetail[]>([])

  // データ取得...

  return (
    <div>
      <h2>燃費グラフ</h2>
      {fuelLogs.length >= 2 ? (
        <FuelEfficiencyChart fuelLogs={fuelLogs} />
      ) : (
        <p>グラフ表示には2回以上の給油履歴が必要です</p>
      )}
    </div>
  )
}
```

**Storybook:**

FuelEfficiencyChartコンポーネントにはStorybookストーリーが実装されています：

- `Default`: 5ヶ月間の実データサンプル
- `Empty`: 空データでの表示確認

```bash
pnpm storybook
# http://localhost:6006 で確認可能
```

## スタイリング方法

### CSS Moduleでの実装

CSS変数を使用してコンポーネントをスタイリングできます：

```css
/* button.module.css */
.button {
  padding: var(--spacing-3) var(--spacing-6);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-medium);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.primary {
  background-color: var(--color-product);
  color: white;
}

.primary:hover {
  background-color: var(--color-productHover);
}

.primary:active {
  background-color: var(--color-productActive);
}
```

### CSS変数の活用

グローバルスタイルやテーマに依存しないコンポーネントでも、CSS変数を活用できます：

```css
/* globals.css */
body {
  background-color: var(--color-background);
  color: var(--color-ink);
  font-size: var(--font-size-md);
  line-height: var(--line-height-normal);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--spacing-8) var(--spacing-4);
}

.card {
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-6);
}
```

## 完全な使用例

### ログインフォームの実装

```tsx
import { ThemeProvider, AuthCard, FormField, Input, Button } from '@packages/ui'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // ログイン処理
    try {
      // ... API call
    } catch (error) {
      setEmailError('ログインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ThemeProvider initialThemeName="default">
      <AuthCard title="ログイン" description="アカウント情報を入力してください">
        <form onSubmit={handleSubmit}>
          <FormField
            label="メールアドレス"
            htmlFor="email"
            required
            error={emailError}
          >
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              placeholder="example@example.com"
            />
          </FormField>

          <FormField label="パスワード" htmlFor="password" required>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="パスワードを入力"
            />
          </FormField>

          <Button variant="primary" fullWidth loading={loading} type="submit">
            ログイン
          </Button>
        </form>
      </AuthCard>
    </ThemeProvider>
  )
}
```

## Storybookでのコンポーネント開発

このパッケージではStorybookを使用したコンポーネント開発をサポートしています。

### Storybookの起動

プロジェクトルートから起動:

```bash
pnpm storybook
```

または、`packages/ui`内から直接起動:

```bash
cd packages/ui
pnpm storybook
```

起動後、http://localhost:6006 でStorybookにアクセスできます。

### ストーリーファイルの作成

コンポーネントのストーリーは、コンポーネントと同じディレクトリに`*.stories.tsx`ファイルとして作成します。

**ファイル配置例**:

```
src/
  └── MyComponent/
      ├── myComponent.tsx          # コンポーネント本体
      ├── myComponent.module.css   # スタイル
      └── myComponent.stories.tsx  # Storybookストーリー
```

**ストーリーファイルの基本構造**:

```tsx
import type { Meta, StoryObj } from '@storybook/react'
import { MyComponent } from './myComponent'

const meta: Meta<typeof MyComponent> = {
  title: 'ui/MyComponent',
  component: MyComponent,
}

export default meta
type Story = StoryObj<typeof MyComponent>

export const Default: Story = {
  args: {
    // propsの値
  },
}

export const Variant: Story = {
  args: {
    // 別のpropsの値
  },
}
```

### テーマとの統合

StorybookのプレビューはThemeProviderでラップされているため、すべてのストーリーで自動的にテーマが適用されます。CSS変数も利用可能です。

### 既存のストーリー

参考として、以下のストーリーが実装済みです:

- `src/FuelEfficiencyChart/fuelEfficiencyChart.stories.tsx`

## 関連パッケージ

- **@packages/theme**: デザイントークンとテーマ定義を提供
- すべてのCSS変数の値は `@packages/theme` パッケージで定義されています

## トラブルシューティング

### エラー: "useTheme must be used within a ThemeProvider"

`useTheme` フックを使用する際は、必ずコンポーネントツリーの上位で `ThemeProvider` をセットアップしてください。

```tsx
// ❌ エラーが発生
function App() {
  const { themeName } = useTheme() // ThemeProviderがない
  return <div>...</div>
}

// ✅ 正しい使い方
function App() {
  return (
    <ThemeProvider initialThemeName="default">
      <MyComponent />
    </ThemeProvider>
  )
}

function MyComponent() {
  const { themeMode } = useTheme() // ThemeProviderの内側で使用
  return <div>Current theme mode: {themeMode}</div>
}
```

### CSS変数が適用されない

`ThemeProvider` がアプリケーションのルートでセットアップされていることを確認してください。CSS変数は `document.documentElement` に設定されるため、DOM階層の最上位で設定する必要があります。
