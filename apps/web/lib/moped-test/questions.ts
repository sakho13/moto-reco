import {
  ApiResponseMopedTestQuestion,
  ApiResponseMopedTestQuestionSet,
} from '@repo/shared-types'

const mopedQuestions: ApiResponseMopedTestQuestion[] = [
  {
    questionId: 'moped-001',
    statement: '交差点で右左折するときは、30m手前で合図を出す。',
    category: '交通ルール',
    correctAnswer: 'true',
    explanation:
      '右左折など進路変更の合図は、交差点の30m手前までに行う必要があります。',
  },
  {
    questionId: 'moped-002',
    statement:
      '原付は二段階右折の標識がなくても、片側3車線以上では二段階右折が必要。',
    category: '二段階右折',
    correctAnswer: 'true',
    explanation:
      '原動機付自転車は、標識の有無にかかわらず片側3車線以上の交差点で二段階右折を行います。',
  },
  {
    questionId: 'moped-003',
    statement: '雨の日は路面が滑りやすいため、制動距離が短くなる。',
    category: '安全運転',
    correctAnswer: 'false',
    explanation:
      '雨天時は制動距離が長くなります。速度を落とし、車間距離を十分に確保してください。',
  },
  {
    questionId: 'moped-004',
    statement: '踏切手前では一時停止し、安全確認をしてから通過する。',
    category: '交通ルール',
    correctAnswer: 'true',
    explanation:
      '踏切の直前では一時停止し、左右の安全を確認してから進行します。',
  },
  {
    questionId: 'moped-005',
    statement: '原付の法定最高速度は一般道路で時速50kmである。',
    category: '速度制限',
    correctAnswer: 'false',
    explanation: '原動機付自転車の法定最高速度は時速30kmです。',
  },
  {
    questionId: 'moped-006',
    statement: '夜間はハイビームとロービームを状況に応じて切り替える。',
    category: '安全運転',
    correctAnswer: 'true',
    explanation:
      '夜間は視認性のため基本は上向き灯火ですが、対向車や先行車がいる場合は下向きに切り替えます。',
  },
  {
    questionId: 'moped-007',
    statement: '黄色信号は急いで交差点に進入してよい合図である。',
    category: '信号',
    correctAnswer: 'false',
    explanation:
      '黄色信号は「止まれ」が原則です。安全に停止できない場合のみ進行が認められます。',
  },
  {
    questionId: 'moped-008',
    statement: 'ヘルメットのあごひもは、緩くても着用していれば問題ない。',
    category: '安全装備',
    correctAnswer: 'false',
    explanation:
      'あごひもが緩いと事故時にヘルメットが脱落する危険があります。しっかり締める必要があります。',
  },
  {
    questionId: 'moped-009',
    statement: '見通しの悪い交差点では徐行して安全確認を行う。',
    category: '交通ルール',
    correctAnswer: 'true',
    explanation:
      '見通しの悪い交差点は徐行し、歩行者・車両の有無を確認して進みます。',
  },
  {
    questionId: 'moped-010',
    statement:
      '走行中にスマートフォンを手で持って通話しても、短時間なら違反にならない。',
    category: '安全運転',
    correctAnswer: 'false',
    explanation:
      '走行中の携帯電話使用（保持・注視）は違反です。重大事故につながるため絶対にやめましょう。',
  },
]

export const mopedTestQuestionSet: ApiResponseMopedTestQuestionSet = {
  title: '原付学科試験 練習問題',
  version: '2026-04-06',
  questionCount: mopedQuestions.length,
  passScore: 9,
  questions: mopedQuestions,
}
