import { isAxiosError } from 'axios'

// The HTTP status of a failed API call, or undefined when it never got one
export function getErrorStatus(error: unknown) {
  return isAxiosError(error) ? error.response?.status : undefined
}
