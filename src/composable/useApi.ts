import axios, { type RawAxiosRequestHeaders, type AxiosInstance } from 'axios';
import { Buffer } from 'buffer';

let api: AxiosInstance

export function createApi() {
  // Here we set the base URL for all requests made to the api
  api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
  })
  // fNOl 6Vqx 7CgR YNFh K5Rs FnBe
  // We set an interceptor for each request to
  api.interceptors.request.use((config) => {
    const token = Buffer.from('API:fNOl 6Vqx 7CgR YNFh K5Rs FnBe').toString('base64');

      // @ts-ignore
    config.headers = {
        ...((config.headers as RawAxiosRequestHeaders) ?? {}),
        Authorization: `Basic ${token}`,
        "Content-Type": `application/json`,
      }

    return config
  })

  return api
}

export function useApi() {
  if (!api) {
    createApi()
  }
  return api
}
