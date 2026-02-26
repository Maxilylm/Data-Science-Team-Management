import { useState } from 'react'
import type { ProviderInfo } from '../../services/api'

interface ProviderConfigProps {
  providers: ProviderInfo[]
  onSetActive: (providerId: string) => void
  onUpdateConfig: (providerId: string, config: Record<string, unknown>) => void
  onTest: (providerId: string) => Promise<{ providerId: string; isAvailable: boolean }>
  isTesting: boolean
  isDarkMode: boolean
}

export function ProviderConfig({
  providers,
  onSetActive,
  onUpdateConfig,
  onTest,
  isTesting,
  isDarkMode
}: ProviderConfigProps) {
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [testResult, setTestResult] = useState<Record<string, boolean | null>>({})

  const handleTest = async (providerId: string) => {
    setTestResult(prev => ({ ...prev, [providerId]: null }))
    const result = await onTest(providerId)
    setTestResult(prev => ({ ...prev, [providerId]: result.isAvailable }))
  }

  const handleSaveApiKey = (providerId: string) => {
    if (apiKeyInput) {
      onUpdateConfig(providerId, { apiKey: apiKeyInput })
      setApiKeyInput('')
    }
  }

  const cardStyle = (isActive: boolean): React.CSSProperties => ({
    border: isActive
      ? '2px solid #3b82f6'
      : isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: isDarkMode ? '#1f2937' : 'white'
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: isDarkMode ? '#9ca3af' : '#6b7280',
    marginBottom: '4px'
  }

  return (
    <div>
      {providers.map((provider) => (
        <div key={provider.id} style={cardStyle(provider.isActive)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: isDarkMode ? '#e5e7eb' : '#111827' }}>
                {provider.name}
              </h3>
              <p style={{ fontSize: '13px', color: isDarkMode ? '#9ca3af' : '#6b7280' }}>
                {provider.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: provider.isAvailable ? '#dcfce7' : '#fee2e2',
                color: provider.isAvailable ? '#166534' : '#991b1b'
              }}>
                {provider.isAvailable ? 'Available' : 'Unavailable'}
              </span>
              {provider.isActive ? (
                <span style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  fontWeight: 600
                }}>
                  Active
                </span>
              ) : (
                <button
                  onClick={() => onSetActive(provider.id)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  Set Active
                </button>
              )}
            </div>
          </div>

          {/* Provider-specific config */}
          {provider.id === 'anthropic-api' && (
            <div style={{ borderTop: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb', paddingTop: '12px' }}>
              <div style={labelStyle}>API Key</div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={provider.config?.apiKey ? String(provider.config.apiKey) : 'sk-ant-...'}
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    fontSize: '13px',
                    borderRadius: '6px',
                    border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
                    backgroundColor: isDarkMode ? '#111827' : 'white',
                    color: isDarkMode ? '#e5e7eb' : '#111827'
                  }}
                />
                <button
                  onClick={() => handleSaveApiKey(provider.id)}
                  disabled={!apiKeyInput}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: apiKeyInput ? '#10b981' : '#9ca3af',
                    color: 'white',
                    cursor: apiKeyInput ? 'pointer' : 'not-allowed'
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Test button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <button
              onClick={() => handleTest(provider.id)}
              disabled={isTesting}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                borderRadius: '6px',
                border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
                backgroundColor: 'transparent',
                color: isDarkMode ? '#e5e7eb' : '#374151',
                cursor: isTesting ? 'not-allowed' : 'pointer'
              }}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
            {testResult[provider.id] !== undefined && testResult[provider.id] !== null && (
              <span style={{
                fontSize: '12px',
                color: testResult[provider.id] ? '#16a34a' : '#dc2626'
              }}>
                {testResult[provider.id] ? 'Connection successful' : 'Connection failed'}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
