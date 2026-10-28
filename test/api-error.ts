import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'

// What axios throws when the API answers with an error status
export function apiError(status: number, message = '') {
  const response = {
    status,
    statusText: '',
    data: { message },
    headers: {},
    config: { headers: new AxiosHeaders() },
  } as AxiosResponse

  return new AxiosError(
    `Request failed with status code ${status}`,
    AxiosError.ERR_BAD_REQUEST,
    response.config,
    null,
    response,
  )
}
