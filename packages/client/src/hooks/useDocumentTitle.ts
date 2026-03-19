import { useEffect } from 'react'

const APP_NAME = 'Agent Team Dashboard'

export function useDocumentTitle(activeCount: number): void {
  useEffect(() => {
    document.title = activeCount > 0 ? `(${activeCount}) ${APP_NAME}` : APP_NAME
  }, [activeCount])
}
