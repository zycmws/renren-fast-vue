import Vue from 'vue'
import axios from 'axios'
import router from '@/router'
import { joinHttpUrl } from '@/utils'
import { isURL } from '@/utils/validate'
import qs from 'qs'
import merge from 'lodash/merge'
import isPlainObject from 'lodash/isPlainObject'

const http = axios.create({
  timeout: 1000 * 30,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json; charset=utf-8'
  }
})

/**
 * 请求拦截
 */
http.interceptors.request.use(config => {
  config.headers['token'] = Vue.cookie.get('token') // 请求头带上token
  // 地址处理
  if (!isURL(config.url)) {
    config.url = joinHttpUrl(config.url)
  }
  // 数据处理
  var defaults = {
    't': new Date().getTime()
  }
  if (config.method === 'get') {
    config.params = isPlainObject(config.params) || !config.params ? merge(defaults, config.params) : config.params
  } else if (config.method === 'post') {
    config.data = isPlainObject(config.data) || !config.data ? merge(defaults, config.data) : config.data
    config.data = /^application\/json/.test(config.headers['Content-Type'] || config.headers.post['Content-Type']) ? JSON.stringify(config.data) : qs.stringify(config.data)
  }
  return config
}, error => {
  return Promise.reject(error)
})

/**
 * 响应拦截
 */
http.interceptors.response.use(response => {
  if (response.data && response.data.code === 401) { // 401, token失效
    Vue.cookie.delete('token')
    router.push({ name: 'login' }, () => {
      location.reload() // 刷新页面, 清空整站临时存储数据
    })
  }
  return response
}, error => {
  return Promise.reject(error)
})

export default http
