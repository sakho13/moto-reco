'use client'

import { DownloadOutlined, InboxOutlined } from '@ant-design/icons'
import { useInvalidate } from '@refinedev/core'
import {
  Alert,
  App,
  Button,
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from 'antd'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type {
  GoodsModelCsvError,
  GoodsModelCsvImportResult,
  GoodsModelCsvPreviewItem,
  GoodsModelCsvValidationResult,
} from '@/lib/api/server/services/GoodsModelCsvImportService'
import { getFirebaseAuth } from '@/lib/firebase/config'
import { getGoodsCategoryLabel } from '@/lib/goodsCategory'
import {
  GOODS_MODEL_CSV_MAX_BYTES,
  GOODS_MODEL_CSV_MAX_ROWS,
  GOODS_MODEL_CSV_OPTIONAL_COLUMNS,
  GOODS_MODEL_CSV_REQUIRED_COLUMNS,
  buildGoodsModelCsvTemplate,
} from '@/lib/goodsModelCsv'

const postCsv = async (
  file: File,
  dryRun: boolean
): Promise<{ status: number; body: unknown }> => {
  const token = await getFirebaseAuth().currentUser?.getIdToken()
  if (!token) throw new Error('認証情報を取得できませんでした')
  const res = await fetch(
    `/api/admin/goods-models/import${dryRun ? '?dryRun=true' : ''}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'text/csv',
      },
      body: file,
    }
  )
  const body: unknown = await res.json().catch(() => null)
  return { status: res.status, body }
}

const isValidationResult = (
  body: unknown
): body is GoodsModelCsvValidationResult =>
  typeof body === 'object' &&
  body !== null &&
  'errors' in body &&
  'items' in body

const getErrorMessage = (body: unknown, fallback: string): string =>
  typeof body === 'object' &&
  body !== null &&
  'message' in body &&
  typeof body.message === 'string'
    ? body.message
    : fallback

const downloadTemplate = () => {
  const blob = new Blob([buildGoodsModelCsvTemplate()], {
    type: 'text/csv;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'goods-models-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function GoodsModelImportPage() {
  const { message } = App.useApp()
  const router = useRouter()
  const invalidate = useInvalidate()

  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<GoodsModelCsvValidationResult | null>(
    null
  )
  const [validating, setValidating] = useState(false)
  const [importing, setImporting] = useState(false)

  const validateFile = async (target: File) => {
    setFile(target)
    setResult(null)
    setValidating(true)
    try {
      const { body } = await postCsv(target, true)
      if (isValidationResult(body)) {
        setResult(body)
      } else {
        void message.error(getErrorMessage(body, 'CSVの検証に失敗しました'))
      }
    } catch (e) {
      void message.error(
        e instanceof Error ? e.message : 'CSVの検証に失敗しました'
      )
    } finally {
      setValidating(false)
    }
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const { status, body } = await postCsv(file, false)
      if (status === 201 && isValidationResult(body)) {
        const { createdCount } = body as GoodsModelCsvImportResult
        void message.success(`${createdCount}件のグッズ型番を登録しました`)
        await invalidate({ resource: 'goods-models', invalidates: ['list'] })
        router.push('/goods-models')
        return
      }
      if (isValidationResult(body)) {
        // 検証後にデータが変わった場合などは最新の検証結果を表示する
        setResult(body)
      }
      void message.error(getErrorMessage(body, 'CSVの取り込みに失敗しました'))
    } catch (e) {
      void message.error(
        e instanceof Error ? e.message : 'CSVの取り込みに失敗しました'
      )
    } finally {
      setImporting(false)
    }
  }

  const hasErrors = (result?.errors.length ?? 0) > 0
  const canImport =
    !!result && !hasErrors && result.items.length > 0 && !validating

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="グッズ型番 CSV取り込み"
        extra={<Link href="/goods-models">一覧に戻る</Link>}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Paragraph style={{ marginBottom: 0 }}>
            UTF-8（BOM付き可）のCSVファイルを選択してください。1件でもエラーがある場合は登録されません。
            上限は{GOODS_MODEL_CSV_MAX_ROWS}行・
            {GOODS_MODEL_CSV_MAX_BYTES / 1024 / 1024}MBです。
          </Typography.Paragraph>
          <Typography.Text type="secondary">
            必須列: {GOODS_MODEL_CSV_REQUIRED_COLUMNS.join(', ')} ／ 任意列:{' '}
            {GOODS_MODEL_CSV_OPTIONAL_COLUMNS.join(', ')}
          </Typography.Text>
          <Typography.Text type="secondary">
            メーカーは会社名で、カテゴリはenum値（例:
            HELMET）または日本語名（例:
            ヘルメット）で、販売開始日はYYYY-MM-DDで指定します。
          </Typography.Text>
          <div>
            <Button icon={<DownloadOutlined />} onClick={downloadTemplate}>
              テンプレートをダウンロード
            </Button>
          </div>
          <Upload.Dragger
            accept=".csv,text/csv"
            maxCount={1}
            showUploadList={false}
            disabled={validating || importing}
            beforeUpload={(selected) => {
              void validateFile(selected)
              return false
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              {file
                ? file.name
                : 'クリックまたはドラッグ＆ドロップでCSVファイルを選択'}
            </p>
          </Upload.Dragger>
        </Space>
      </Card>

      {(validating || result) && (
        <Card title="検証結果" loading={validating}>
          {result && (
            <Space direction="vertical" style={{ width: '100%' }}>
              {hasErrors ? (
                <Alert
                  type="error"
                  showIcon
                  message={`${result.errors.length}件のエラーがあります。CSVを修正して再度選択してください。`}
                  description={`データ行: ${result.totalRows}件 ／ エラーのない行: ${result.items.length}件`}
                />
              ) : (
                <Alert
                  type="success"
                  showIcon
                  message={`${result.items.length}件を登録できます`}
                />
              )}

              {hasErrors && (
                <Table<GoodsModelCsvError>
                  dataSource={result.errors}
                  rowKey={(_, index) => String(index)}
                  size="small"
                  pagination={{ pageSize: 50 }}
                  scroll={{ x: true }}
                >
                  <Table.Column<GoodsModelCsvError>
                    title="行"
                    dataIndex="row"
                    width={80}
                    render={(v: number | null) => v ?? 'ファイル'}
                  />
                  <Table.Column<GoodsModelCsvError>
                    title="列"
                    dataIndex="column"
                    width={160}
                    render={(v: string | null) => v ?? '—'}
                  />
                  <Table.Column<GoodsModelCsvError>
                    title="内容"
                    dataIndex="message"
                  />
                </Table>
              )}

              {result.items.length > 0 && (
                <>
                  <Typography.Title level={5} style={{ marginTop: 16 }}>
                    登録予定
                  </Typography.Title>
                  <Table<GoodsModelCsvPreviewItem>
                    dataSource={result.items}
                    rowKey="row"
                    size="small"
                    pagination={{ pageSize: 50 }}
                    scroll={{ x: true }}
                  >
                    <Table.Column title="行" dataIndex="row" width={80} />
                    <Table.Column
                      title="メーカー"
                      dataIndex="manufacturerName"
                    />
                    <Table.Column title="商品名" dataIndex="name" />
                    <Table.Column title="型番" dataIndex="modelNumber" />
                    <Table.Column
                      title="カテゴリ"
                      dataIndex="category"
                      render={(v: string) => (
                        <Tag>{getGoodsCategoryLabel(v)}</Tag>
                      )}
                    />
                    <Table.Column
                      title="有効"
                      dataIndex="isActive"
                      render={(v: boolean) => (
                        <Tag color={v ? 'green' : 'default'}>
                          {v ? '有効' : '無効'}
                        </Tag>
                      )}
                    />
                  </Table>
                </>
              )}

              <div>
                <Button
                  type="primary"
                  disabled={!canImport}
                  loading={importing}
                  onClick={() => void handleImport()}
                >
                  取り込み実行
                </Button>
              </div>
            </Space>
          )}
        </Card>
      )}
    </Space>
  )
}
