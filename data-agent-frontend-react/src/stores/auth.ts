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

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@/services/auth';

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  
  // Actions
  setAuth: (token: string, userInfo: UserInfo) => void;
  clearAuth: () => void;
}

/**
 * @description 认证状态管理Store
 * 使用persist中间件实现持久化存储
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      isAuthenticated: false,
      
      setAuth: (token, userInfo) => {
        localStorage.setItem('token', token);
        set({
          token,
          userInfo,
          isAuthenticated: true,
        });
      },
      
      clearAuth: () => {
        localStorage.removeItem('token');
        set({
          token: null,
          userInfo: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
