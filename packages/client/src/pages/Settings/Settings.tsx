import { useState } from 'react'
import { useSettings } from '../../hooks/useSettings'
import { ProviderConfig } from '../../components/ProviderConfig/ProviderConfig'

interface SettingsProps {
  onBack: () => void
  isDarkMode: boolean
}

export function Settings({ onBack, isDarkMode }: SettingsProps) {
  const {
    providers,
    isLoadingProviders,
    setActiveProvider,
    updateProviderConfig,
    testProvider,
    isTestingProvider,
    authConfig,
    isLoadingAuth,
    updateAuth,
    generateToken,
    isGeneratingToken
  } = useSettings()

  const [generatedToken, setGeneratedToken] = useState<string | null>(null)

  const handleGenerateToken = async () => {
    const result = await generateToken()
    setGeneratedToken(result.token)
  }

  const containerStyle: React.CSSProperties = {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '24px'
  }

  const sectionStyle: React.CSSProperties = {
    marginBottom: '32px'
  }

  const headingStyle: React.CSSProperties = {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '16px',
    color: isDarkMode ? '#e5e7eb' : '#111827'
  }

  return (
    <div style={{
      height: '100vh',
      overflow: 'auto',
      backgroundColor: isDarkMode ? '#111827' : '#f9fafb',
      color: isDarkMode ? '#e5e7eb' : '#111827'
    }}>
      <div style={{
        padding: '16px 24px',
        borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        <button
          onClick={onBack}
          style={{
            padding: '6px 12px',
            fontSize: '13px',
            borderRadius: '6px',
            border: isDarkMode ? '1px solid #374151' : '1px solid #d1d5db',
            backgroundColor: 'transparent',
            color: isDarkMode ? '#e5e7eb' : '#374151',
            cursor: 'pointer'
          }}
        >
          Back
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700 }}>Settings</h1>
      </div>

      <div style={containerStyle}>
        {/* Provider Section */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>AI Provider</h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '16px' }}>
            Choose which AI provider to use for running agents.
          </p>
          {isLoadingProviders ? (
            <p>Loading providers...</p>
          ) : (
            <ProviderConfig
              providers={providers}
              onSetActive={setActiveProvider}
              onUpdateConfig={(providerId, config) =>
                updateProviderConfig({ providerId, config })
              }
              onTest={testProvider}
              isTesting={isTestingProvider}
              isDarkMode={isDarkMode}
            />
          )}
        </div>

        {/* Auth Section */}
        <div style={sectionStyle}>
          <h2 style={headingStyle}>Authentication</h2>
          <p style={{ fontSize: '14px', color: isDarkMode ? '#9ca3af' : '#6b7280', marginBottom: '16px' }}>
            Require a token to access the dashboard. Disabled by default.
          </p>

          {isLoadingAuth ? (
            <p>Loading auth config...</p>
          ) : (
            <div style={{
              border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: isDarkMode ? '#1f2937' : 'white'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <label style={{ fontSize: '14px', fontWeight: 500 }}>
                  Authentication
                </label>
                <button
                  onClick={() => updateAuth({ enabled: !authConfig?.enabled })}
                  style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: authConfig?.enabled ? '#ef4444' : '#10b981',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                >
                  {authConfig?.enabled ? 'Disable' : 'Enable'}
                </button>
                <span style={{
                  fontSize: '12px',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}>
                  {authConfig?.tokenCount || 0} active token(s)
                </span>
              </div>

              {authConfig?.enabled && (
                <div>
                  <button
                    onClick={handleGenerateToken}
                    disabled={isGeneratingToken}
                    style={{
                      padding: '6px 16px',
                      fontSize: '13px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      cursor: isGeneratingToken ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {isGeneratingToken ? 'Generating...' : 'Generate New Token'}
                  </button>

                  {generatedToken && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '6px',
                      backgroundColor: isDarkMode ? '#111827' : '#f3f4f6',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                    }}>
                      <p style={{ fontSize: '12px', color: '#f59e0b', marginBottom: '8px', fontWeight: 600 }}>
                        Copy this token now -- it will not be shown again:
                      </p>
                      <code style={{
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        wordBreak: 'break-all',
                        color: isDarkMode ? '#e5e7eb' : '#111827'
                      }}>
                        {generatedToken}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
