'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import type { TestSession } from './MopedTestClient'
import styles from './page.module.css'

type Props = {
  history: TestSession[]
  onClearHistory: () => void
}

export function HistorySection({ history, onClearHistory }: Props) {
  // グラフ用データ：古い順に並べ替え
  const chartData = [...history].reverse().map((s, i) => ({
    name: `#${i + 1}`,
    score: s.score,
    passScore: s.passScore,
    totalCount: s.totalCount,
  }))

  // 合格ラインと問題総数は最新セッションから取得（旧移行データは 0 の場合あり）
  const latestValid = history.find((s) => s.totalCount > 0)
  const passScore = latestValid?.passScore ?? 0
  const totalCount = latestValid?.totalCount ?? 0

  return (
    <section className={styles.historySection}>
      <div className={styles.historyHeader}>
        <h2 className={styles.historyTitle}>回答履歴</h2>
        <button
          type="button"
          onClick={onClearHistory}
          className={styles.clearHistoryButton}
        >
          履歴をリセット
        </button>
      </div>

      {/* スコア推移グラフ */}
      {chartData.length > 0 && totalCount > 0 && (
        <div className={styles.historyChart}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: -16, bottom: 0 }}
            >
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[0, totalCount]} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value) => [`${value}点`, 'スコア']} />
              {passScore > 0 && (
                <ReferenceLine
                  y={passScore}
                  stroke="#c62828"
                  strokeDasharray="4 4"
                  label={{
                    value: `合格 ${passScore}点`,
                    position: 'insideTopRight',
                    fontSize: 11,
                    fill: '#c62828',
                  }}
                />
              )}
              <Line
                type="monotone"
                dataKey="score"
                stroke="#007d32"
                strokeWidth={2}
                dot={{ r: 4, fill: '#007d32' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* セッション一覧 */}
      <div className={styles.historyList}>
        {history.map((session, index) => {
          const date = new Date(session.submittedAt).toLocaleString('ja-JP')
          const correctCount = session.answers.filter((a) => a.isCorrect).length
          const incorrectCount = session.answers.filter(
            (a) => !a.isCorrect
          ).length

          return (
            <details key={session.sessionId} className={styles.historyItem}>
              <summary className={styles.historyItemSummary}>
                <span className={styles.historyItemIndex}>
                  #{history.length - index}回目
                </span>
                <span className={styles.historyItemDate}>{date}</span>
                <span className={styles.historyItemScore}>
                  {session.score}
                  {session.totalCount > 0 ? ` / ${session.totalCount}` : ''}点
                </span>
                {session.totalCount > 0 && (
                  <span
                    className={`${styles.historyItemBadge} ${session.isPassed ? styles.resultPass : styles.resultFail}`}
                  >
                    {session.isPassed ? '合格' : '不合格'}
                  </span>
                )}
              </summary>

              {session.answers.length > 0 && (
                <div className={styles.historyAnswerGrid}>
                  <p className={styles.historyAnswerSummary}>
                    <span className={styles.correct}>
                      正解 {correctCount}問
                    </span>
                    {'　'}
                    <span className={styles.incorrect}>
                      不正解 {incorrectCount}問
                    </span>
                  </p>
                  <ul className={styles.historyAnswerList}>
                    {session.answers.map((ans, i) => (
                      <li
                        key={ans.questionId}
                        className={`${styles.historyAnswerItem} ${ans.isCorrect ? styles.historyAnswerCorrect : styles.historyAnswerIncorrect}`}
                        title={`Q${i + 1}: ${ans.questionId}`}
                      >
                        <span className={styles.historyAnswerNum}>
                          Q{i + 1}
                        </span>
                        <span>{ans.isCorrect ? '○' : '✕'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </details>
          )
        })}
      </div>
    </section>
  )
}
