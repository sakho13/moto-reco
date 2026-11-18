import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView, type Edge } from 'react-native-safe-area-context'
import { useAppTheme } from '@/theme'

type FormScreenProps = {
  children: ReactNode
  /**
   * セーフエリアの余白を取る辺
   *
   * @remarks
   * ヘッダーがある画面はヘッダー側が上の余白を取るため、既定では下と左右だけにする。
   */
  edges?: Edge[]
}

/**
 * 入力フォームの画面の枠
 *
 * @remarks
 * キーボードで入力欄が隠れないようにし、画面外をタップしても入力中の値を保つ。
 */
export function FormScreen({
  children,
  edges = ['bottom', 'left', 'right'],
}: FormScreenProps) {
  const { colors, spacing } = useAppTheme()
  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            padding: spacing[6],
            gap: spacing[5],
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
