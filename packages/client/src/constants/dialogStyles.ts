/**
 * Shared modal overlay style.
 * Renders a full-viewport fixed backdrop at z-index 1000.
 * Individual dialogs may override zIndex for stacking order.
 */
export const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}
