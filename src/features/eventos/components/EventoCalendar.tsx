import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar,
    Clock,
    Loader2,
    MoreHorizontal,
    Trash2,
    Filter,
    Edit,
    ChevronLeft,
    ChevronRight,
    Eye,
    Repeat,
} from 'lucide-react';
import { Evento, TipoEvento } from '@/types/app-types';

interface EventoCalendarProps {
    eventos: Evento[];
    tiposEvento: TipoEvento[];
    loading: boolean;
    currentMonth: Date;
    selectedDate: Date | null;
    activeFilters: Set<string>;
    onMonthChange: (date: Date) => void;
    onDateSelect: (date: Date) => void;
    onFilterToggle: (tipo: string) => void;
    onEventView: (evento: Evento) => void;
    onEventEdit: (evento: Evento) => void;
    onEventDelete: (id: string) => void;
    getCorByTipo: (tipo: string) => string;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function EventoCalendar({
    eventos,
    tiposEvento,
    loading,
    currentMonth,
    selectedDate,
    activeFilters,
    onMonthChange,
    onDateSelect,
    onFilterToggle,
    onEventView,
    onEventEdit,
    onEventDelete,
    getCorByTipo,
}: EventoCalendarProps) {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = monthStart.getDay();

    const filteredEventos = eventos.filter(e => activeFilters.has(e.tipo));
    const getEventsForDay = (day: Date) => filteredEventos.filter(evento => isSameDay(parseISO(evento.data_evento), day));
    const selectedDateEvents = selectedDate ? filteredEventos.filter(evento => isSameDay(parseISO(evento.data_evento), selectedDate)) : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filter toggles */}
            <div className="flex items-center gap-2 flex-wrap">
                <Filter className="w-4 h-4 text-muted-foreground" />
                {tiposEvento.map((tipo) => (
                    <button
                        key={tipo.id}
                        onClick={() => onFilterToggle(tipo.nome)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${activeFilters.has(tipo.nome)
                            ? 'text-white shadow-sm'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80 opacity-50'
                            }`}
                        style={activeFilters.has(tipo.nome) ? { backgroundColor: tipo.cor } : undefined}
                    >
                        {tipo.nome}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar Grid */}
                <Card className="glass-card lg:col-span-2">
                    <CardHeader className="pb-2">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <CardTitle className="font-display flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-primary" />
                                <span className="hidden sm:inline">Calendário</span>
                            </CardTitle>
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="font-medium text-sm sm:text-base min-w-[100px] sm:min-w-[150px] text-center capitalize truncate">
                                    {format(currentMonth, 'MMM yyyy', { locale: ptBR })}
                                </span>
                                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {WEEK_DAYS.map(day => (
                                <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startDayOfWeek }).map((_, i) => (
                                <div key={`empty-${i}`} className="aspect-square" />
                            ))}
                            {daysInMonth.map((day) => {
                                const dayEvents = getEventsForDay(day);
                                const isToday = isSameDay(day, new Date());
                                const isSelected = selectedDate && isSameDay(day, selectedDate);
                                return (
                                    <button
                                        key={day.toISOString()}
                                        onClick={() => onDateSelect(day)}
                                        className={`aspect-square p-1 rounded-lg text-sm relative transition-all hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${isToday ? 'bg-primary/10 font-bold' : ''} ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''} ${!isSameMonth(day, currentMonth) ? 'text-muted-foreground/50' : ''}`}
                                    >
                                        <span className={`flex items-center justify-center w-6 h-6 mx-auto rounded-full ${isToday ? 'bg-primary text-primary-foreground' : ''}`}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayEvents.length > 0 && (
                                            <div className="flex justify-center gap-0.5 mt-0.5">
                                                {dayEvents.slice(0, 3).map((evento) => (
                                                    <div key={evento.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: getCorByTipo(evento.tipo) }} />
                                                ))}
                                                {dayEvents.length > 3 && (
                                                    <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 3}</span>
                                                )}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Selected Day Events */}
                <Card className="glass-card">
                    <CardHeader>
                        <CardTitle className="font-display flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary" />
                            {selectedDate ? format(selectedDate, "dd 'de' MMMM", { locale: ptBR }) : 'Selecione uma data'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {!selectedDate ? (
                            <p className="text-center text-muted-foreground py-8">Clique em um dia no calendário para ver os eventos</p>
                        ) : selectedDateEvents.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">Nenhum evento nesta data</p>
                        ) : (
                            selectedDateEvents.map((evento) => (
                                <div
                                    key={evento.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                                    onClick={() => onEventView(evento)}
                                >
                                    <div className="w-2 h-full min-h-[40px] rounded-full" style={{ backgroundColor: getCorByTipo(evento.tipo) }} />
                                    <div className="flex-1">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h4 className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                                                    {evento.titulo}
                                                    {evento.recorrente_id && <Repeat className="w-3 h-3 text-primary/60" title="Evento recorrente" />}
                                                </h4>
                                                <Badge className="text-xs mt-1 text-white" style={{ backgroundColor: getCorByTipo(evento.tipo) }}>
                                                    {evento.tipo}
                                                </Badge>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="w-3 h-3" /></Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEventView(evento); }}>
                                                        <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEventEdit(evento); }}>
                                                        <Edit className="w-4 h-4 mr-2" /> Editar
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onEventDelete(evento.id); }}>
                                                        <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {format(parseISO(evento.data_evento), 'HH:mm')}
                                            {evento.grupos && <span className="ml-2">• {evento.grupos.nome}</span>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
