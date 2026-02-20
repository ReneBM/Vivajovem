import {
    addDays,
    addWeeks,
    addMonths,
    startOfMonth,
    endOfMonth,
    endOfYear,
    getDay,
    setDate,
    isBefore,
    isAfter,
    isEqual,
    eachDayOfInterval,
    format,
} from 'date-fns';

export type TipoRecorrencia = 'SEMANAL' | 'INTERVALO_DIAS' | 'MENSAL_POSICAO' | 'MENSAL_DIA';

export interface RecorrenciaConfig {
    tipo_recorrencia: TipoRecorrencia;
    dia_semana?: number;        // 0=dom ... 6=sab
    intervalo_dias?: number;    // for INTERVALO_DIAS
    posicao_no_mes?: number;    // 1=primeira ... 5=última
    dia_do_mes?: number;        // 1..31
    data_inicio: string;        // YYYY-MM-DD
    data_fim?: string | null;   // YYYY-MM-DD or null (end of year)
}

const WEEKDAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const POSICAO_NAMES = ['', '1ª', '2ª', '3ª', '4ª', 'Última'];

export function getWeekdayName(day: number): string {
    return WEEKDAY_NAMES[day] || '';
}

export function getPosicaoName(pos: number): string {
    return POSICAO_NAMES[pos] || '';
}

/**
 * Describe the recurrence rule in human-readable Portuguese.
 */
export function describeRecurrence(config: RecorrenciaConfig): string {
    switch (config.tipo_recorrencia) {
        case 'SEMANAL':
            return `Toda ${getWeekdayName(config.dia_semana ?? 0)}`;
        case 'INTERVALO_DIAS':
            return `A cada ${config.intervalo_dias} dias`;
        case 'MENSAL_POSICAO':
            return `Toda ${getPosicaoName(config.posicao_no_mes ?? 1)} ${getWeekdayName(config.dia_semana ?? 0)} do mês`;
        case 'MENSAL_DIA':
            return `Todo dia ${config.dia_do_mes} do mês`;
        default:
            return '';
    }
}

/**
 * Generate all event dates for a recurrence rule.
 */
export function generateRecurringDates(config: RecorrenciaConfig): Date[] {
    const inicio = new Date(config.data_inicio + 'T00:00:00');
    const fim = config.data_fim
        ? new Date(config.data_fim + 'T23:59:59')
        : endOfYear(inicio);

    if (isAfter(inicio, fim)) return [];

    switch (config.tipo_recorrencia) {
        case 'SEMANAL':
            return generateWeeklyDates(config.dia_semana ?? 0, inicio, fim);
        case 'INTERVALO_DIAS':
            return generateIntervalDates(config.intervalo_dias ?? 7, inicio, fim);
        case 'MENSAL_POSICAO':
            return generateMonthlyPositionDates(config.posicao_no_mes ?? 1, config.dia_semana ?? 0, inicio, fim);
        case 'MENSAL_DIA':
            return generateMonthlyDayDates(config.dia_do_mes ?? 1, inicio, fim);
        default:
            return [];
    }
}

/**
 * Generate dates for every occurrence of a weekday
 * (e.g., every Friday between inicio and fim).
 */
function generateWeeklyDates(diaSemana: number, inicio: Date, fim: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(inicio);

    // Move to the first occurrence of diaSemana
    const currentDay = getDay(current);
    const daysUntilTarget = (diaSemana - currentDay + 7) % 7;
    current = addDays(current, daysUntilTarget);

    while (!isAfter(current, fim)) {
        dates.push(new Date(current));
        current = addWeeks(current, 1);
    }

    return dates;
}

/**
 * Generate dates at a fixed interval (e.g., every 30 days).
 */
function generateIntervalDates(intervalo: number, inicio: Date, fim: Date): Date[] {
    const dates: Date[] = [];
    let current = new Date(inicio);

    while (!isAfter(current, fim)) {
        dates.push(new Date(current));
        current = addDays(current, intervalo);
    }

    return dates;
}

/**
 * Generate dates for a specific position of a weekday in each month
 * (e.g., 1st Friday of every month).
 * posicao: 1=first, 2=second, 3=third, 4=fourth, 5=last
 */
function generateMonthlyPositionDates(posicao: number, diaSemana: number, inicio: Date, fim: Date): Date[] {
    const dates: Date[] = [];
    let currentMonth = startOfMonth(inicio);

    while (!isAfter(currentMonth, fim)) {
        const targetDate = getNthWeekdayOfMonth(currentMonth, diaSemana, posicao);
        if (targetDate && !isBefore(targetDate, inicio) && !isAfter(targetDate, fim)) {
            dates.push(targetDate);
        }
        currentMonth = addMonths(currentMonth, 1);
        currentMonth = startOfMonth(currentMonth);
    }

    return dates;
}

/**
 * Get the nth weekday of a given month.
 */
function getNthWeekdayOfMonth(monthStart: Date, diaSemana: number, posicao: number): Date | null {
    const monthEnd = endOfMonth(monthStart);
    const allDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const matchingDays = allDays.filter(d => getDay(d) === diaSemana);

    if (posicao === 5) {
        // Last occurrence
        return matchingDays.length > 0 ? matchingDays[matchingDays.length - 1] : null;
    }

    const index = posicao - 1;
    return index < matchingDays.length ? matchingDays[index] : null;
}

/**
 * Generate dates for a specific day of each month (e.g., day 15).
 */
function generateMonthlyDayDates(dia: number, inicio: Date, fim: Date): Date[] {
    const dates: Date[] = [];
    let currentMonth = startOfMonth(inicio);

    while (!isAfter(currentMonth, fim)) {
        const monthEnd = endOfMonth(currentMonth);
        const targetDay = Math.min(dia, monthEnd.getDate());
        const targetDate = setDate(currentMonth, targetDay);

        if (!isBefore(targetDate, inicio) && !isAfter(targetDate, fim)) {
            dates.push(targetDate);
        }

        currentMonth = addMonths(currentMonth, 1);
        currentMonth = startOfMonth(currentMonth);
    }

    return dates;
}
