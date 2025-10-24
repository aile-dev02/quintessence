import React, { useState, useCallback } from 'react'
import { Memo } from '../models/Memo'
import { MemoService } from '../services/MemoService'
import { validateMemoTitle, validateMemoBody, validateTags } from '../utils/validation'
import { ValidationError } from '../utils/errors'

interface MemoFormProps {
  memo?: Memo
  onSave: (memo: Memo) => void
  onCancel: () => void
  isEditing?: boolean
}

interface FormData {
  title: string
  body: string
  tags: string[]
  projectId: string
  priority: 'low' | 'medium' | 'high' | 'critical'
}

interface FormErrors {
  title?: string
  body?: string
  tags?: string
  general?: string
}

export const MemoForm: React.FC<MemoFormProps> = ({
  memo,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    title: memo?.title || '',
    body: memo?.body || '',
    tags: memo?.tags || [],
    projectId: memo?.projectId || '',
    priority: memo?.priority || 'medium'
  }))

  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const memoService = MemoService.getInstance()

  // Form validation
  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    // Validate title
    const titleError = validateMemoTitle(formData.title)
    if (titleError) {
      newErrors.title = titleError
    }

    // Validate body
    const bodyError = validateMemoBody(formData.body)
    if (bodyError) {
      newErrors.body = bodyError
    }

    // Validate tags
    const tagsError = validateTags(formData.tags)
    if (tagsError) {
      newErrors.tags = tagsError
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let savedMemo: Memo

      if (isEditing && memo) {
        // Update existing memo
        savedMemo = await memoService.updateMemo(memo.id, {
          title: formData.title,
          body: formData.body,
          tags: formData.tags,
          projectId: formData.projectId || undefined
        })
      } else {
        // Create new memo
        savedMemo = await memoService.createMemo({
          title: formData.title,
          body: formData.body,
          tags: formData.tags,
          projectId: formData.projectId || undefined
        })
      }

      onSave(savedMemo)
    } catch (error) {
      if (error instanceof ValidationError) {
        setErrors({ general: error.message })
      } else {
        setErrors({ general: 'メモの保存中にエラーが発生しました' })
      }
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field-specific errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  // Handle tag input
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      handleInputChange('tags', [...formData.tags, trimmedTag])
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value)
  }

  const handleTagInputBlur = () => {
    if (tagInput.trim()) {
      addTag()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isEditing ? 'メモを編集' : '新しいメモを作成'}
        </h2>
        <p className="text-gray-600 mt-1">
          {isEditing ? 'メモの内容を編集できます' : 'QAに関する知識やメモを作成しましょう'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title Field */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            タイトル <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="メモのタイトルを入力..."
            maxLength={200}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.title.length}/200文字
          </p>
        </div>

        {/* Body Field */}
        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
            内容 <span className="text-red-500">*</span>
          </label>
          <textarea
            id="body"
            value={formData.body}
            onChange={(e) => handleInputChange('body', e.target.value)}
            rows={12}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical ${
              errors.body ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="メモの内容を入力..."
          />
          {errors.body && (
            <p className="mt-1 text-sm text-red-600">{errors.body}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            文字数: {formData.body.length}
          </p>
        </div>

        {/* Tags Field */}
        <div>
          <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
            タグ
          </label>
          <div className="space-y-2">
            {/* Existing Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800 focus:outline-none"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {/* Tag Input */}
            <div className="flex">
              <input
                type="text"
                id="tags"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInput}
                onBlur={handleTagInputBlur}
                className={`flex-1 px-3 py-2 border rounded-l-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.tags ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="タグを入力してEnterキーを押す..."
                maxLength={30}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                追加
              </button>
            </div>
          </div>
          {errors.tags && (
            <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            タグ数: {formData.tags.length}/20 (Enterキーまたはカンマで区切って入力)
          </p>
        </div>

        {/* Priority Field */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
            優先度
          </label>
          <select
            id="priority"
            value={formData.priority}
            onChange={(e) => handleInputChange('priority', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
            <option value="critical">緊急</option>
          </select>
        </div>

        {/* Project ID Field */}
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700 mb-2">
            プロジェクト (オプション)
          </label>
          <input
            type="text"
            id="projectId"
            value={formData.projectId}
            onChange={(e) => handleInputChange('projectId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="プロジェクト名またはID..."
          />
          <p className="mt-1 text-sm text-gray-500">
            メモを特定のプロジェクトに関連付けできます
          </p>
        </div>

        {/* General Error */}
        {errors.general && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.general}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                保存中...
              </span>
            ) : (
              isEditing ? '更新' : '作成'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}