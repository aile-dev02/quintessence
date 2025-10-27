import { v4 as uuidv4 } from 'uuid'

export const generateId = (): string => {
  return uuidv4()
}

export const generateShortId = (): string => {
  return uuidv4().substring(0, 8)
}

export const isValidUuid = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}