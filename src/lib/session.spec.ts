import {
  endSession,
  getAccessToken,
  hasSession,
  startSession,
  subscribeToSession,
} from './session'

afterEach(() => {
  endSession()
})

describe('session', () => {
  it('should keep the access token in memory and the refresh token in storage', () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

    expect(getAccessToken()).toBe('access-1')
    expect(localStorage.getItem('fastos-refresh-token')).toBe('refresh-1')
    expect(hasSession()).toBe(true)
  })

  it('should forget both tokens when the session ends', () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })

    endSession()

    expect(getAccessToken()).toBeNull()
    expect(hasSession()).toBe(false)
  })

  it('should tell subscribers when the session starts and ends', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeToSession(listener)

    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    endSession()
    unsubscribe()
    startSession({ accessToken: 'access-2', refreshToken: 'refresh-2' })

    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('should drop the access token when another tab changes the session', () => {
    startSession({ accessToken: 'access-1', refreshToken: 'refresh-1' })
    const listener = vi.fn()
    subscribeToSession(listener)

    // What this tab sees when another tab of the same store signs out
    localStorage.removeItem('fastos-refresh-token')
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: 'fastos-refresh-token',
        newValue: null,
      }),
    )

    expect(getAccessToken()).toBeNull()
    expect(hasSession()).toBe(false)
    expect(listener).toHaveBeenCalledOnce()
  })
})
