import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    isToday,
    isWithinInterval,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Briefcase, Clock, MapPin, DollarSign } from 'lucide-react';

export interface CalendarEvent {
    start: Date;
    end: Date;
    type: 'job' | 'blocked' | 'pending';
    title?: string;
    id?: string;
    details?: any;
}

interface CalendarProps {
    events: CalendarEvent[];
    onDateClick?: (date: Date) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

const Calendar = ({ events, onDateClick, onEventClick }: CalendarProps) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2 border-b border-gray-100 pb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dayInterval = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-1 lg:gap-2 auto-rows-fr">
                {dayInterval.map((dayItem) => {
                    // Find events that encompass this day
                    const dayEvents = events.filter(e =>
                        isWithinInterval(dayItem, {
                            start: new Date(e.start.setHours(0, 0, 0, 0)),
                            end: new Date(e.end.setHours(23, 59, 59, 999))
                        })
                    );

                    const isSelected = selectedDate ? isSameDay(dayItem, selectedDate) : false;

                    return (
                        <div
                            key={dayItem.toString()}
                            className={`
                                min-h-[90px] relative border rounded-xl p-2 transition-all cursor-pointer hover:shadow-md flex flex-col justify-between
                                ${!isSameMonth(dayItem, monthStart) ? 'bg-gray-50/50 text-gray-400 border-transparent' : 'bg-white border-gray-100'}
                                ${isSelected ? 'ring-2 ring-blue-500 shadow-md z-10' : ''}
                                ${isToday(dayItem) && !isSelected ? 'ring-2 ring-blue-200' : ''}
                            `}
                            onClick={() => {
                                setSelectedDate(dayItem);
                                if (onDateClick) onDateClick(dayItem);
                            }}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold ${!isSameMonth(dayItem, monthStart) ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {format(dayItem, 'd')}
                                </span>
                                {isToday(dayItem) && (
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                )}
                            </div>

                            <div className="flex flex-col gap-1 overflow-hidden">
                                {dayEvents.slice(0, 3).map((evt, i) => (
                                    <div
                                        key={i}
                                        className={`
                                          h-1.5 md:h-2 rounded-full w-full
                                          ${evt.type === 'job' ? 'bg-green-500' : evt.type === 'pending' ? 'bg-yellow-400' : 'bg-red-400'}
                                        `}
                                        title={evt.title}
                                    />
                                ))}
                                {dayEvents.length > 3 && (
                                    <span className="text-[10px] text-gray-400 font-medium leading-none">
                                        +{dayEvents.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const renderDetails = () => {
        if (!selectedDate) return null;

        const dayEvents = events.filter(e =>
            isWithinInterval(selectedDate, {
                start: new Date(e.start.setHours(0, 0, 0, 0)),
                end: new Date(e.end.setHours(23, 59, 59, 999))
            })
        );

        return (
            <div className="mt-8 border-t border-gray-100 pt-6 animate-fadeIn">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                    Schedule for <span className="text-blue-600 ml-2">{format(selectedDate, 'EEEE, MMMM do, yyyy')}</span>
                </h3>

                {dayEvents.length === 0 ? (
                    <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                        <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p>No jobs scheduled for this date.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {dayEvents.map((evt, i) => (
                            <div
                                key={i}
                                onClick={() => onEventClick && onEventClick(evt)}
                                className={`
                                    p-4 rounded-xl border flex items-center justify-between hover:shadow-md transition-all cursor-pointer bg-white
                                    ${evt.type === 'job'
                                        ? 'border-green-200 shadow-sm'
                                        : evt.type === 'pending'
                                            ? 'border-yellow-200'
                                            : 'border-red-100 bg-red-50/10'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`
                                        w-12 h-12 rounded-lg flex items-center justify-center shrink-0
                                        ${evt.type === 'job' ? 'bg-green-100 text-green-600' : evt.type === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}
                                    `}>
                                        {evt.type === 'job' ? <Briefcase className="w-6 h-6" /> : evt.type === 'pending' ? <Clock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{evt.title || 'Untitled Event'}</h4>
                                        <div className="flex items-center text-sm text-gray-500 gap-3 mt-1">
                                            {evt.details?.serviceRequest?.location && (
                                                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {evt.details.serviceRequest.location}</span>
                                            )}
                                            {evt.details?.bidAmount && (
                                                <span className="flex items-center gap-1 font-medium text-gray-700"><DollarSign className="w-3 h-3" /> {evt.details.bidAmount}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className={`
                                    px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                                    ${evt.type === 'job' ? 'bg-green-100 text-green-700' : evt.type === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}
                                `}>
                                    {evt.type === 'job' ? 'Confirmed' : evt.type === 'pending' ? 'Pending' : 'Blocked'}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 w-full">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
            {renderDetails()}
        </div>
    );
};

export default Calendar;
