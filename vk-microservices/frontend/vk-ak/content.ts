// content.ts
import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["https://vk.com/*"],
  all_frames: true
}

// Мониторим изменения в localStorage для получения VK token
const getVkToken = () => {
  // VK хранит токен в разных ключах, нужно исследовать
  const possibleKeys = [
    'vk_access_token',
    'access_token',
    'vk_token',
    'vk_access_token_settings'
  ]
  
  for (const key of possibleKeys) {
    const token = localStorage.getItem(key)
    if (token && token.length > 50) {
      console.log('Found VK token in key:', key)
      return token
    }
  }
  return null
}

// Отправляем токен в popup или background script
const sendTokenToExtension = (token: string) => {
  chrome.runtime.sendMessage({
    type: 'VK_TOKEN_FOUND',
    token: token
  }).catch(() => {
    // Расширение не активно, игнорируем
  })
}

// Проверяем наличие токена при загрузке
setTimeout(() => {
  const token = getVkToken()
  if (token) {
    sendTokenToExtension(token)
  }
}, 2000)

// Слушаем изменения в localStorage
const originalSetItem = localStorage.setItem
localStorage.setItem = function(key, value) {
  originalSetItem.apply(this, [key, value])
  
  if (key.includes('token') || key.includes('access')) {
    console.log('LocalStorage changed:', key)
    sendTokenToExtension(value)
  }
}

