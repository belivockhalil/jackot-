// ─────────────────────────────────────────────────────
// JACKOT — Color System
// Change colors here and they update everywhere
// ─────────────────────────────────────────────────────

const colors = {

  // ── Brand ─────────────────────────────────────────
  primary:       '#1D4ED8',   // Main blue — used in nav, buttons
  primaryDark:   '#1E3A8A',   // Darker blue — used in gradients
  primaryLight:  '#DBEAFE',   // Light blue — used in backgrounds
  accent:        '#0EA5E9',   // Sky blue — used in highlights

  // ── Status ────────────────────────────────────────
  success:       '#10B981',   // Green — income, profit, positive
  successLight:  '#F0FDF4',   // Light green background
  danger:        '#EF4444',   // Red — expenses, loss, delete
  dangerLight:   '#FEF2F2',   // Light red background
  warning:       '#F59E0B',   // Amber — debtors, they owe me
  warningLight:  '#FFFBEB',   // Light amber background
  purple:        '#8B5CF6',   // Purple — suppliers, creditors
  purpleLight:   '#F5F3FF',   // Light purple background
  teal:          '#14B8A6',   // Teal — reports
  orange:        '#F97316',   // Orange — extra use

  // ── Neutrals ──────────────────────────────────────
  dark:          '#1E293B',   // Main text
  medium:        '#475569',   // Section labels
  muted:         '#64748B',   // Secondary text
  light:         '#94A3B8',   // Placeholder text
  border:        '#E2E8F0',   // Input borders
  divider:       '#F1F5F9',   // Table row dividers
  background:    '#F1F5F9',   // Page background
  cardBg:        'white',     // Card background

  // ── Gradients (use in background: property) ───────
  navGradient:       'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 100%)',
  heroGradient:      'linear-gradient(135deg, #1E3A8A 0%, #1D4ED8 60%, #0EA5E9 100%)',
  primaryGradient:   'linear-gradient(135deg, #1D4ED8, #0EA5E9)',
  successGradient:   'linear-gradient(135deg, #10B981, #059669)',
  dangerGradient:    'linear-gradient(135deg, #EF4444, #DC2626)',
  purpleGradient:    'linear-gradient(135deg, #8B5CF6, #7C3AED)',
  warningGradient:   'linear-gradient(135deg, #F59E0B, #D97706)',
  tealGradient:      'linear-gradient(135deg, #14B8A6, #0D9488)',
  grayGradient:      'linear-gradient(135deg, #64748B, #475569)',
};

export default colors;