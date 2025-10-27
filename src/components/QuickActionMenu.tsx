import React, { useState, useRef, useEffect } from 'react'
import {
  EllipsisVerticalIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  ArchiveBoxIcon,
  TagIcon,
  ShareIcon,
  PrinterIcon,
  FlagIcon,
  ClockIcon
} from '@heroicons/react/24/outline'
import { Memo } from '../models/Memo'
import type { MemoStatus, Priority } from '../types'

interface QuickActionMenuProps {
  memo: Memo
  onEdit: (memo: Memo) => void
  onDuplicate: (memo: Memo) => void
  onDelete: (memo: Memo) => void
  onStatusChange: (memo: Memo, status: MemoStatus) => void
  onPriorityChange: (memo: Memo, priority: Priority) => void
  onAddTag: (memo: Memo, tag: string) => void
  onShare?: (memo: Memo) => void
  onPrint?: (memo: Memo) => void
  onPin?: (memo: Memo) => void
  className?: string
}

interface ActionItem {
  id: string
  label: string
  icon: React.ReactNode
  action: () => void
  color?: string
  shortcut?: string
  disabled?: boolean
  separator?: boolean
}

const STATUS_OPTIONS: Array<{ value: MemoStatus; label: string; icon: React.ReactNode }> = [
  { value: 'draft', label: '下書きに戻す', icon: <PencilIcon className="h-4 w-4" /> },
  { value: 'published', label: '公開する', icon: <ShareIcon className="h-4 w-4" /> },
  { value: 'archived', label: 'アーカイブ', icon: <ArchiveBoxIcon className="h-4 w-4" /> }
]

const PRIORITY_OPTIONS: Array<{ value: Priority; label: string; color: string }> = [
  { value: 'critical', label: '緊急', color: 'text-red-600' },
  { value: 'high', label: '高', color: 'text-orange-600' },
  { value: 'medium', label: '中', color: 'text-blue-600' },
  { value: 'low', label: '低', color: 'text-gray-600' }
]

export const QuickActionMenu: React.FC<QuickActionMenuProps> = ({
  memo,
  onEdit,
  onDuplicate,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onAddTag,
  onShare,
  onPrint,
  onPin,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showStatusSubmenu, setShowStatusSubmenu] = useState(false)
  const [showPrioritySubmenu, setShowPrioritySubmenu] = useState(false)
  const [showTagInput, setShowTagInput] = useState(false)
  const [tagInput, setTagInput] = useState('')
  
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowStatusSubmenu(false)
        setShowPrioritySubmenu(false)
        setShowTagInput(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return

      switch (event.key) {
        case 'Escape':
          setIsOpen(false)
          setShowStatusSubmenu(false)
          setShowPrioritySubmenu(false)
          setShowTagInput(false)
          break
        case 'e':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onEdit(memo)
            setIsOpen(false)
          }
          break
        case 'd':
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            onDuplicate(memo)
            setIsOpen(false)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, memo, onEdit, onDuplicate])

  const handleTagAdd = () => {
    if (tagInput.trim()) {
      onAddTag(memo, tagInput.trim())
      setTagInput('')
      setShowTagInput(false)
      setIsOpen(false)
    }
  }

  const mainActions: ActionItem[] = [
    {
      id: 'edit',
      label: '編集',
      icon: <PencilIcon className="h-4 w-4" />,
      action: () => {
        onEdit(memo)
        setIsOpen(false)
      },
      shortcut: 'Ctrl+E'
    },
    {
      id: 'duplicate',
      label: '複製',
      icon: <DocumentDuplicateIcon className="h-4 w-4" />,
      action: () => {
        onDuplicate(memo)
        setIsOpen(false)
      },
      shortcut: 'Ctrl+D'
    },
    {
      id: 'separator1',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'status',
      label: 'ステータス変更',
      icon: <ArchiveBoxIcon className="h-4 w-4" />,
      action: () => setShowStatusSubmenu(!showStatusSubmenu)
    },
    {
      id: 'priority',
      label: '優先度変更',
      icon: <FlagIcon className="h-4 w-4" />,
      action: () => setShowPrioritySubmenu(!showPrioritySubmenu)
    },
    {
      id: 'tag',
      label: 'タグ追加',
      icon: <TagIcon className="h-4 w-4" />,
      action: () => setShowTagInput(!showTagInput)
    },
    {
      id: 'separator2',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    }
  ]

  // Add optional actions
  if (onShare) {
    mainActions.push({
      id: 'share',
      label: '共有',
      icon: <ShareIcon className="h-4 w-4" />,
      action: () => {
        onShare(memo)
        setIsOpen(false)
      }
    })
  }

  if (onPrint) {
    mainActions.push({
      id: 'print',
      label: '印刷',
      icon: <PrinterIcon className="h-4 w-4" />,
      action: () => {
        onPrint(memo)
        setIsOpen(false)
      }
    })
  }

  if (onPin) {
    mainActions.push({
      id: 'pin',
      label: 'ピン留め',
      icon: <ClockIcon className="h-4 w-4" />,
      action: () => {
        onPin(memo)
        setIsOpen(false)
      }
    })
  }

  // Add delete action
  mainActions.push(
    {
      id: 'separator3',
      label: '',
      icon: null,
      action: () => {},
      separator: true
    },
    {
      id: 'delete',
      label: '削除',
      icon: <TrashIcon className="h-4 w-4" />,
      action: () => {
        onDelete(memo)
        setIsOpen(false)
      },
      color: 'text-red-600 hover:text-red-800 hover:bg-red-50'
    }
  )

  return (
    <div className={`relative ${className}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label="メニューを開く"
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50"
        >
          <div className="py-1">
            {mainActions.map((action) => {
              if (action.separator) {
                return <div key={action.id} className="border-t border-gray-100 my-1" />
              }

              return (
                <button
                  key={action.id}
                  onClick={action.action}
                  disabled={action.disabled}
                  className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-gray-50 focus:bg-gray-50 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    action.color || 'text-gray-700 hover:text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {action.icon}
                    <span>{action.label}</span>
                  </div>
                  {action.shortcut && (
                    <span className="text-xs text-gray-400">{action.shortcut}</span>
                  )}
                </button>
              )
            })}

            {/* Status Submenu */}
            {showStatusSubmenu && (
              <div className="border-t border-gray-100 mt-1 pt-1">
                {STATUS_OPTIONS.filter(option => option.value !== memo.status).map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onStatusChange(memo, option.value)
                      setIsOpen(false)
                      setShowStatusSubmenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm flex items-center space-x-3 hover:bg-gray-50 text-gray-700"
                  >
                    {option.icon}
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Priority Submenu */}
            {showPrioritySubmenu && (
              <div className="border-t border-gray-100 mt-1 pt-1">
                {PRIORITY_OPTIONS.filter(option => option.value !== memo.priority).map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onPriorityChange(memo, option.value)
                      setIsOpen(false)
                      setShowPrioritySubmenu(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${option.color}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}

            {/* Tag Input */}
            {showTagInput && (
              <div className="border-t border-gray-100 mt-1 pt-1 px-4 py-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleTagAdd()
                      } else if (e.key === 'Escape') {
                        setShowTagInput(false)
                        setTagInput('')
                      }
                    }}
                    placeholder="タグ名を入力"
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleTagAdd}
                    disabled={!tagInput.trim()}
                    className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    追加
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}