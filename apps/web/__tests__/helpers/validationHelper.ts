import { expect } from 'vitest'

/**
 * バリデーションエラーのアサーション
 */
export function expectValidationError(
  json: unknown,
  expectedStatus: number = 400
): void {
  const response = json as {
    status: string
    errorCode: string
    details?: unknown[]
  }

  expect(response.status).toBe('error')
  expect(response.errorCode).toBe('VALIDATION_ERROR')
  if (response.details) {
    expect(Array.isArray(response.details)).toBe(true)
  }
}

/**
 * 404エラーのアサーション
 */
export function expect404Error(json: unknown): void {
  const response = json as {
    status: string
    errorCode: string
  }

  expect(response.status).toBe('error')
  expect(response.errorCode).toBe('NOT_FOUND')
}
