/*
 * Copyright 2026 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import axios from 'axios';
// 创建 axios 实例
const apiClient = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});
// 请求拦截器
apiClient.interceptors.request.use((config) => {
    // 可以在这里添加 token 等认证信息
    return config;
}, (error) => {
    return Promise.reject(error);
});
// 响应拦截器
apiClient.interceptors.response.use((response) => {
    return response.data;
}, (error) => {
    if (error.response) {
        switch (error.response.status) {
            case 401:
                console.error('未授权，请重新登录');
                break;
            case 403:
                console.error('拒绝访问');
                break;
            case 404:
                console.error('请求资源不存在');
                break;
            case 500:
                console.error('服务器内部错误');
                break;
            default:
                console.error(`连接错误 ${error.response.status}`);
        }
    }
    else {
        console.error('网络异常，请检查网络连接');
    }
    return Promise.reject(error);
});
export default apiClient;
