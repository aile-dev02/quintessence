import React, { useMemo } from 'react'
import { 
  DocumentTextIcon, 
  TagIcon, 
  ClockIcon, 
  ChartBarIcon,
  ArchiveBoxIcon,
  PencilIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { Memo } from '../models/Memo'
import type { MemoStatus, Priority } from '../types'

interface MemoStatsDashboardProps {
  memos: Memo[]
  className?: string
}

interface StatsData {
  total: number
  byStatus: Record<MemoStatus, number>
  byPriority: Record<Priority, number>
  totalTags: number
  uniqueTags: number
  averageWordsPerMemo: number
  recentActivity: {
    createdToday: number
    updatedToday: number
    createdThisWeek: number
    updatedThisWeek: number
  }
  topTags: Array<{ tag: string; count: number }>
  withAttachments: number
}

export const MemoStatsDashboard: React.FC<MemoStatsDashboardProps> = ({
  memos,
  className = ''
}) => {
  const stats = useMemo((): StatsData => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)

    const tagCounts = new Map<string, number>()
    let totalWords = 0

    const byStatus: Record<MemoStatus, number> = {
      draft: 0,
      published: 0,
      archived: 0
    }

    const byPriority: Record<Priority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    }

    let createdToday = 0
    let updatedToday = 0
    let createdThisWeek = 0
    let updatedThisWeek = 0
    let withAttachments = 0

    memos.forEach(memo => {
      // Status counts
      byStatus[memo.status]++

      // Priority counts
      byPriority[memo.priority]++

      // Tag counts
      memo.tags.forEach(tag => {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      })

      // Word count estimation
      const wordCount = memo.title.split(/\s+/).length + memo.body.split(/\s+/).length
      totalWords += wordCount

      // Date-based activity
      const createdDate = memo.createdAt
      const updatedDate = memo.updatedAt

      if (createdDate >= today) createdToday++
      if (updatedDate >= today) updatedToday++
      if (createdDate >= weekAgo) createdThisWeek++
      if (updatedDate >= weekAgo) updatedThisWeek++

      // Attachments
      if (memo.attachmentIds.length > 0) withAttachments++
    })

    const topTags = Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    return {
      total: memos.length,
      byStatus,
      byPriority,
      totalTags: Array.from(tagCounts.values()).reduce((sum, count) => sum + count, 0),
      uniqueTags: tagCounts.size,
      averageWordsPerMemo: memos.length > 0 ? Math.round(totalWords / memos.length) : 0,
      recentActivity: {
        createdToday,
        updatedToday,
        createdThisWeek,
        updatedThisWeek
      },
      topTags,
      withAttachments
    }
  }, [memos])

  const StatusCard: React.FC<{ status: MemoStatus; count: number; icon: React.ReactNode; color: string }> = ({ 
    status, count, icon, color 
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-2 rounded-lg ${color}`}>
          {icon}
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-500 capitalize">
            {status === 'draft' ? '下書き' : status === 'published' ? '公開済み' : 'アーカイブ'}
          </p>
          <p className="text-2xl font-semibold text-gray-900">{count}</p>
        </div>
      </div>
    </div>
  )

  const PriorityCard: React.FC<{ priority: Priority; count: number; color: string }> = ({ 
    priority, count, color 
  }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {priority === 'critical' ? '緊急' : 
             priority === 'high' ? '高' : 
             priority === 'medium' ? '中' : '低'}
          </p>
          <p className="text-xl font-semibold text-gray-900">{count}</p>
        </div>
        <div className={`w-3 h-8 rounded-full ${color}`}></div>
      </div>
    </div>
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">総メモ数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-green-100 rounded-lg">
              <TagIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">ユニークタグ</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.uniqueTags}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">平均文字数</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageWordsPerMemo}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-2 bg-orange-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">添付ファイル付き</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.withAttachments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status and Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ステータス別</h3>
          <div className="space-y-4">
            <StatusCard 
              status="draft" 
              count={stats.byStatus.draft} 
              icon={<PencilIcon className="h-5 w-5 text-yellow-600" />}
              color="bg-yellow-100"
            />
            <StatusCard 
              status="published" 
              count={stats.byStatus.published} 
              icon={<CheckCircleIcon className="h-5 w-5 text-green-600" />}
              color="bg-green-100"
            />
            <StatusCard 
              status="archived" 
              count={stats.byStatus.archived} 
              icon={<ArchiveBoxIcon className="h-5 w-5 text-gray-600" />}
              color="bg-gray-100"
            />
          </div>
        </div>

        {/* Priority Breakdown */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">優先度別</h3>
          <div className="grid grid-cols-2 gap-4">
            <PriorityCard priority="critical" count={stats.byPriority.critical} color="bg-red-500" />
            <PriorityCard priority="high" count={stats.byPriority.high} color="bg-orange-500" />
            <PriorityCard priority="medium" count={stats.byPriority.medium} color="bg-blue-500" />
            <PriorityCard priority="low" count={stats.byPriority.low} color="bg-gray-500" />
          </div>
        </div>
      </div>

      {/* Recent Activity and Top Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">最近のアクティビティ</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">今日作成</span>
              <span className="text-sm font-semibold text-gray-900">{stats.recentActivity.createdToday}件</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">今日更新</span>
              <span className="text-sm font-semibold text-gray-900">{stats.recentActivity.updatedToday}件</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">今週作成</span>
              <span className="text-sm font-semibold text-gray-900">{stats.recentActivity.createdThisWeek}件</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-600">今週更新</span>
              <span className="text-sm font-semibold text-gray-900">{stats.recentActivity.updatedThisWeek}件</span>
            </div>
          </div>
        </div>

        {/* Top Tags */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">人気タグ Top 5</h3>
          {stats.topTags.length > 0 ? (
            <div className="space-y-3">
              {stats.topTags.map((tag, index) => (
                <div key={tag.tag} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-900">#{tag.tag}</span>
                  </div>
                  <span className="text-sm text-gray-500">{tag.count}回使用</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">タグが使用されていません</p>
          )}
        </div>
      </div>
    </div>
  )
}