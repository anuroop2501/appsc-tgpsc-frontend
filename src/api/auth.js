import api from './axiosInstance'

export const signup = (data) =>
  api.post('/api/auth/signup', data).then((r) => r.data)

export const login = (data) =>
  api.post('/api/auth/login', data).then((r) => r.data)

export const getMe = () =>
  api.get('/api/auth/me').then((r) => r.data)

export const refreshToken = (token) =>
  api.post('/api/auth/refresh', { refreshToken: token }).then((r) => r.data)
