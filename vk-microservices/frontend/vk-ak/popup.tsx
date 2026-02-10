// popup.tsx
import { useEffect, useState } from "react"
import { KeycloakInstance, KeycloakProfile } from "keycloak-js"

function IndexPopup() {
  const [vkToken, setVkToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userProfile, setUserProfile] = useState<KeycloakProfile | null>(null)

  useEffect(() => {
    // Слушаем сообщения от content script
    chrome.runtime.onMessage.addListener((message) => {
      if (message.type === 'VK_TOKEN_FOUND') {
        setVkToken(message.token)
      }
    })
    
    // Проверяем существующий VK token
    chrome.storage.local.get(['vkToken'], (result) => {
      if (result.vkToken) {
        setVkToken(result.vkToken)
      }
    })
  }, [])

  const handleLogin = async () => {
    // Редирект на Keycloak для OAuth2 авторизации
    const keycloakUrl = 'http://localhost:8080/auth/realms/vk-microservices/protocol/openid-connect/auth'
    const params = new URLSearchParams({
      client_id: 'browser-extension',
      redirect_uri: chrome.runtime.getURL('popup.html'),
      response_type: 'code',
      scope: 'openid profile email',
      state: 'some_state'
    })
    
    chrome.tabs.create({
      url: `${keycloakUrl}?${params.toString()}`
    })
  }

  const exchangeVkToken = async () => {
    if (!vkToken) return
    
    try {
      const response = await fetch('http://localhost/api/v1/auth/vk-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getKeycloakToken()}`
        },
        body: JSON.stringify({ vkToken })
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('VK token успешно сохранен в системе')
        chrome.storage.local.set({ vkTokenStored: true })
      }
    } catch (error) {
      console.error('Ошибка при обмене VK token:', error)
    }
  }

  return (
    <div style={{ width: "300px", padding: "16px" }}>
      <h2>VK Data Collector</h2>
      
      {vkToken ? (
        <div>
          <p style={{ color: "green" }}>✓ VK токен найден</p>
          <button onClick={exchangeVkToken}>
            Сохранить токен в системе
          </button>
        </div>
      ) : (
        <p style={{ color: "red" }}>✗ VK токен не найден</p>
      )}
      
      {isAuthenticated ? (
        <div>
          <p>Привет, {userProfile?.firstName}!</p>
          <button onClick={() => {/* logout */}}>
            Выйти
          </button>
        </div>
      ) : (
        <button onClick={handleLogin}>
          Войти через систему
        </button>
      )}
    </div>
  )
}

export default IndexPopup

