import { beforeEach, describe, expect, test, vi } from 'vitest'
import type { IDashboardStatsRepository } from '@/lib/api/server/interfaces/IDashboardStatsRepository'
import { DashboardStatsService } from '@/lib/api/server/services/DashboardStatsService'

const buildRepository = (): IDashboardStatsRepository => ({
  countDailyNewUsers: vi.fn().mockResolvedValue([]),
  countDailyFuelLogs: vi.fn().mockResolvedValue([]),
  countDailyTourings: vi.fn().mockResolvedValue([]),
  countDailyMaintenances: vi.fn().mockResolvedValue([]),
  countDailyActiveUsers: vi.fn().mockResolvedValue([]),
  countActiveUsers: vi.fn().mockResolvedValue(0),
  countDailyMcpToolCalls: vi.fn().mockResolvedValue([]),
  countDailyMcpConnections: vi.fn().mockResolvedValue([]),
  countActiveMcpConnections: vi
    .fn()
    .mockResolvedValue({ users: 0, connections: 0 }),
  countActiveMcpConnectionsByClient: vi.fn().mockResolvedValue([]),
  countMcpToolCallsByTool: vi.fn().mockResolvedValue([]),
  countMcpToolCallUsers: vi.fn().mockResolvedValue(0),
})

/** JST 2026-11-19 12:00 */
const NOW = new Date('2026-11-19T03:00:00Z')

describe('DashboardStatsService', () => {
  let repository: IDashboardStatsRepository
  let service: DashboardStatsService

  beforeEach(() => {
    repository = buildRepository()
    service = new DashboardStatsService(repository)
  })

  describe('getStats()', () => {
    test('件数の指標は直前の期間を含めた範囲、アクティブユーザーは期間ごとの範囲で取得する', async () => {
      await service.getStats(NOW, 7)

      const whole = {
        start: new Date('2026-11-05T15:00:00Z'),
        end: new Date('2026-11-19T15:00:00Z'),
      }
      const current = {
        start: new Date('2026-11-12T15:00:00Z'),
        end: new Date('2026-11-19T15:00:00Z'),
      }
      const previous = {
        start: new Date('2026-11-05T15:00:00Z'),
        end: new Date('2026-11-12T15:00:00Z'),
      }
      expect(repository.countDailyNewUsers).toHaveBeenCalledWith(whole)
      expect(repository.countDailyFuelLogs).toHaveBeenCalledWith(whole)
      expect(repository.countDailyTourings).toHaveBeenCalledWith(whole)
      expect(repository.countDailyMaintenances).toHaveBeenCalledWith(whole)
      expect(repository.countDailyMcpToolCalls).toHaveBeenCalledWith(whole)
      expect(repository.countDailyMcpConnections).toHaveBeenCalledWith(whole)
      expect(repository.countDailyActiveUsers).toHaveBeenCalledWith(current)
      expect(repository.countActiveUsers).toHaveBeenCalledWith(current)
      expect(repository.countActiveUsers).toHaveBeenCalledWith(previous)
    })

    test('件数を今回の期間と直前の期間に振り分けて合計する', async () => {
      vi.mocked(repository.countDailyFuelLogs).mockResolvedValue([
        { date: '2026-11-06', count: 2 },
        { date: '2026-11-12', count: 3 },
        { date: '2026-11-13', count: 4 },
        { date: '2026-11-19', count: 5 },
      ])
      vi.mocked(repository.countActiveUsers)
        .mockResolvedValueOnce(6)
        .mockResolvedValueOnce(1)

      const stats = await service.getStats(NOW, 7)

      expect(stats.period).toEqual({
        days: 7,
        from: '2026-11-13',
        to: '2026-11-19',
      })
      expect(stats.totals.fuelLogs).toBe(9)
      expect(stats.previous.fuelLogs).toBe(5)
      expect(stats.totals.activeUsers).toBe(6)
      expect(stats.previous.activeUsers).toBe(1)
    })

    test('日別は期間の全日を古い順に並べ、件数のない日は0にする', async () => {
      vi.mocked(repository.countDailyNewUsers).mockResolvedValue([
        { date: '2026-11-06', count: 9 },
        { date: '2026-11-14', count: 1 },
      ])
      vi.mocked(repository.countDailyActiveUsers).mockResolvedValue([
        { date: '2026-11-19', count: 2 },
      ])

      const stats = await service.getStats(NOW, 7)

      expect(stats.daily.map((d) => d.date)).toEqual([
        '2026-11-13',
        '2026-11-14',
        '2026-11-15',
        '2026-11-16',
        '2026-11-17',
        '2026-11-18',
        '2026-11-19',
      ])
      expect(stats.daily[1]).toEqual({
        date: '2026-11-14',
        newUsers: 1,
        activeUsers: 0,
        fuelLogs: 0,
        tourings: 0,
        maintenances: 0,
        mcpToolCalls: 0,
        mcpConnections: 0,
      })
      expect(stats.daily[6]?.activeUsers).toBe(2)
      expect(stats.daily.some((d) => d.newUsers === 9)).toBe(false)
    })

    test('90日間でも日別は90件になる', async () => {
      const stats = await service.getStats(NOW, 90)

      expect(stats.daily).toHaveLength(90)
      expect(stats.daily[0]?.date).toBe(stats.period.from)
      expect(stats.daily[89]?.date).toBe('2026-11-19')
    })
  })

  describe('getStats() の MCP の指標', () => {
    test('MCPの操作数と新規連携数も、今回と直前の期間に振り分けて日別に並べる', async () => {
      vi.mocked(repository.countDailyMcpToolCalls).mockResolvedValue([
        { date: '2026-11-10', count: 7 },
        { date: '2026-11-19', count: 3 },
      ])
      vi.mocked(repository.countDailyMcpConnections).mockResolvedValue([
        { date: '2026-11-13', count: 1 },
      ])

      const stats = await service.getStats(NOW, 7)

      expect(stats.totals.mcpToolCalls).toBe(3)
      expect(stats.previous.mcpToolCalls).toBe(7)
      expect(stats.totals.mcpConnections).toBe(1)
      expect(stats.previous.mcpConnections).toBe(0)
      expect(stats.daily[0]?.mcpConnections).toBe(1)
      expect(stats.daily[6]?.mcpToolCalls).toBe(3)
    })
  })

  describe('getMcpUsage()', () => {
    test('連携は now 時点、ツールの呼び出しは今回の期間で集計する', async () => {
      vi.mocked(repository.countActiveMcpConnections).mockResolvedValue({
        users: 2,
        connections: 3,
      })
      vi.mocked(repository.countActiveMcpConnectionsByClient).mockResolvedValue(
        [
          { clientName: 'Claude', connections: 2 },
          { clientName: 'ChatGPT', connections: 1 },
        ]
      )
      vi.mocked(repository.countMcpToolCallsByTool).mockResolvedValue([
        { toolName: 'list_bikes', calls: 5, errors: 1 },
      ])
      vi.mocked(repository.countMcpToolCallUsers).mockResolvedValue(2)

      const usage = await service.getMcpUsage(NOW, 7)

      const current = {
        start: new Date('2026-11-12T15:00:00Z'),
        end: new Date('2026-11-19T15:00:00Z'),
      }
      expect(repository.countActiveMcpConnections).toHaveBeenCalledWith(NOW)
      expect(repository.countActiveMcpConnectionsByClient).toHaveBeenCalledWith(
        NOW
      )
      expect(repository.countMcpToolCallsByTool).toHaveBeenCalledWith(current)
      expect(repository.countMcpToolCallUsers).toHaveBeenCalledWith(current)
      expect(usage).toEqual({
        period: { days: 7, from: '2026-11-13', to: '2026-11-19' },
        activeConnections: {
          users: 2,
          connections: 3,
          byClient: [
            { clientName: 'Claude', connections: 2 },
            { clientName: 'ChatGPT', connections: 1 },
          ],
        },
        toolCallUsers: 2,
        tools: [{ toolName: 'list_bikes', calls: 5, errors: 1 }],
      })
    })
  })
})
