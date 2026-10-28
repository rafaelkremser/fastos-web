import { type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { apiError } from '../../test/api-error'

import { api } from './axios'
import { endSession, getAccessToken, hasSession, startSession } from './session'

type FakeApi = (request: { url?: string; authorization?: string }) => {
  status: number
  data?: unknown
}

let fakeApi: FakeApi
let requests: { url?: string; authorization?: string }[]

beforeEach(() => {
  requests = []

  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const request = {
      url: config.url,
      authorization: config.headers.Authorization as string | undefined,
    }
    requests.push(request)

    // A retry loop would never yield to the test timeout
    if (requests.length > 10) {
      throw new Error('The interceptor is looping')
    }

    const { status, data } = fakeApi(request)

    if (status >= 400) {
      const error = apiError(status)
      error.config = config
      throw error
    }

    return {
      status,
      statusText: '',
      data,
      headers: {},
      config,
    } as AxiosResponse
  }
})

afterEach(() => {
  endSession()
})

// Answers 401 to an expired access token and gives a new one on /refresh
function apiWithExpiredToken(expiredToken: string, newToken: string): FakeApi {
  return ({ url, authorization }) => {
    if (url === '/refresh') {
      return { status: 200, data: { access_token: newToken } }
    }

    return authorization === `Bearer ${expiredToken}`
      ? { status: 401 }
      : { status: 200, data: { url } }
  }
}

describe('api', () => {
  it('should send the access token', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = () => ({ status: 200 })

    await api.get('/user')

    expect(requests).toEqual([
      { url: '/user', authorization: 'Bearer access-1' },
    ])
  })

  it('should get an access token before the first request after a reload', async () => {
    // A reload keeps only the refresh token
    localStorage.setItem('fastos-refresh-token', 'refresh-1')
    fakeApi = apiWithExpiredToken('none', 'access-2')

    await api.get('/user')

    expect(requests).toEqual([
      { url: '/refresh', authorization: undefined },
      { url: '/user', authorization: 'Bearer access-2' },
    ])
  })

  it('should renew an expired token once for requests that fail together', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = apiWithExpiredToken('access-1', 'access-2')

    const [user, tenant] = await Promise.all([
      api.get('/user'),
      api.get('/tenant'),
    ])

    expect(user.data).toEqual({ url: '/user' })
    expect(tenant.data).toEqual({ url: '/tenant' })
    expect(requests.filter(({ url }) => url === '/refresh')).toHaveLength(1)
    expect(getAccessToken()).toBe('access-2')
  })

  it('should retry a request only once', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = ({ url }) =>
      url === '/refresh'
        ? { status: 200, data: { access_token: 'access-2' } }
        : { status: 401 }

    await expect(api.get('/user')).rejects.toThrow()

    expect(requests.map(({ url }) => url)).toEqual([
      '/user',
      '/refresh',
      '/user',
    ])
  })

  it('should end the session when the API refuses the refresh token', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = () => ({ status: 401 })

    await expect(api.get('/user')).rejects.toThrow()

    expect(hasSession()).toBe(false)
    expect(getAccessToken()).toBeNull()
  })

  it('should not send requests that would fail once the session is over', async () => {
    localStorage.setItem('fastos-refresh-token', 'refresh-1')
    fakeApi = () => ({ status: 401 })

    const results = await Promise.allSettled([
      api.get('/user'),
      api.get('/tenant'),
    ])

    expect(results.map(({ status }) => status)).toEqual([
      'rejected',
      'rejected',
    ])
    expect(requests.map(({ url }) => url)).toEqual(['/refresh'])
    expect(hasSession()).toBe(false)
  })

  it('should keep the session when the refresh fails for another reason', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = ({ url }) => ({ status: url === '/refresh' ? 503 : 401 })

    await expect(api.get('/user')).rejects.toThrow()

    expect(hasSession()).toBe(true)
  })

  it('should not renew the token when the password is wrong', async () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    fakeApi = () => ({ status: 401 })

    await expect(api.post('/authenticate')).rejects.toThrow()

    expect(requests.map(({ url }) => url)).toEqual(['/authenticate'])
    expect(hasSession()).toBe(true)
  })
})
