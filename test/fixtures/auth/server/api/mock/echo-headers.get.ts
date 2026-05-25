import { defineEventHandler, getRequestHeader } from 'h3'

export default defineEventHandler((event) => {
  return { authorization: getRequestHeader(event, 'authorization') || null }
})
