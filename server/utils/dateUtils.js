/**
 * dateUtils.js - Utilitário de Cálculo Temporal Seguro e Consistente
 * 
 * Compara exclusivamente os dias do calendário via UTC, eliminando
 * distorções de fuso horário causadas pelo horário do servidor (Render UTC)
 * em relação à data informada no formato YYYY-MM-DD.
 */

/**
 * Calcula a diferença em dias inteiros entre duas datas no formato YYYY-MM-DD.
 * @param {string} targetDateStr - Data alvo no formato YYYY-MM-DD ou ISO
 * @param {Date} [baseDate=new Date()] - Data base para comparação
 * @returns {number} Diferença em dias: < 0 (vencido), 0 (hoje), > 0 (futuro)
 */
export function calculateCalendarDaysDiff(targetDateStr, baseDate = new Date()) {
  if (!targetDateStr) return null;

  const cleanTarget = String(targetDateStr).split('T')[0];
  const parts = cleanTarget.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;

  const [year, month, day] = parts;
  const targetUtc = Date.UTC(year, month - 1, day);

  const baseYear = baseDate.getUTCFullYear();
  const baseMonth = baseDate.getUTCMonth();
  const baseDay = baseDate.getUTCDate();
  const baseUtc = Date.UTC(baseYear, baseMonth, baseDay);

  const diffMs = targetUtc - baseUtc;
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Categoriza um prazo para a Central de Alertas e o Dashboard
 * @param {string} triggerDate - Data do vencimento (YYYY-MM-DD)
 * @param {Date} [baseDate=new Date()] - Data de referência
 * @returns {object|null} Metadados do prazo e grupo correspondente
 */
export function categorizeReminder(triggerDate, baseDate = new Date()) {
  const diffDays = calculateCalendarDaysDiff(triggerDate, baseDate);
  if (diffDays === null) return null;

  let group = null;
  let severity = 'normal'; // 'danger' | 'warning' | 'info' | 'normal'
  let label = '';

  if (diffDays < 0) {
    group = 'overdue';
    severity = 'danger';
    const daysAgo = Math.abs(diffDays);
    label = daysAgo === 1 ? 'Venceu ontem' : `Venceu há ${daysAgo} dias`;
  } else if (diffDays === 0) {
    group = 'today';
    severity = 'warning';
    label = 'Vence hoje';
  } else if (diffDays <= 7) {
    group = 'next7Days';
    severity = 'warning';
    label = diffDays === 1 ? 'Vence amanhã' : `Vence em ${diffDays} dias`;
  } else if (diffDays <= 30) {
    group = 'next30Days';
    severity = 'info';
    label = `Vence em ${diffDays} dias`;
  } else {
    group = 'future';
    severity = 'normal';
    label = `Vence em ${diffDays} dias`;
  }

  return {
    group,
    diffDays,
    daysRemaining: Math.max(0, diffDays),
    daysOverdue: diffDays < 0 ? Math.abs(diffDays) : 0,
    isOverdue: diffDays < 0,
    isToday: diffDays === 0,
    isUrgent: diffDays <= 7, // Requer atenção prioritária no sino
    severity,
    label
  };
}
