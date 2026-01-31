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
    isToday
} from 'date-fns';
import { ChevronLeft, ChevronRight, Lock, Briefcase, Clock } from 'lucide-react';

interface CalendarEvent {
    date: Date;
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

    const nextMonth = () => {
        setCurrentMonth(addMonths(currentMonth, 1));
    };

    const prevMonth = () => {
        setCurrentMonth(subMonths(currentMonth, 1));
    };

    const renderHeader = () => {
        return (
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                    <button
                        onClick={prevMonth}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wide py-2">
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

        const dateFormat = "d";

        const dayInterval = eachDayOfInterval({
            start: startDate,
            end: endDate
        });

        return (
            <div className="grid grid-cols-7 gap-1 lg:gap-2">
                {dayInterval.map((dayItem) => {
                    const dayEvents = events.filter(e => isSameDay(e.date, dayItem));

                    return (
                        <div
                            key={dayItem.toString()}
                            className={`
                min-h-[80px] md:min-h-[100px] relative border rounded-lg p-1 transition-all cursor-pointer hover:shadow-md
                ${!isSameMonth(dayItem, monthStart) ? 'bg-gray-50 text-gray-400' : 'bg-white'}
                ${isToday(dayItem) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
              `}
                            onClick={() => onDateClick && onDateClick(dayItem)}
                        >
                            <div className="flex justify-between items-start">
                                <span className={`text-sm font-medium ${!isSameMonth(dayItem, monthStart) ? 'text-gray-400' : 'text-gray-700'}`}>
                                    {format(dayItem, dateFormat)}
                                </span>
                                {isToday(dayItem) && (
                                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">Today</span>
                                )}
                            </div>

                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] custom-scrollbar">
                                {dayEvents.map((evt, i) => (
                                    <div
                                        key={i}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick && onEventClick(evt);
                                        }}
                                        className={`
                      text-[10px] md:text-xs px-1.5 py-0.5 rounded truncate flex items-center
                      ${evt.type === 'job'
                                                ? 'bg-green-100 text-green-700 border border-green-200'
                                                : evt.type === 'pending'
                                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                            }
                    `}
                                        title={evt.title}
                                    >
                                        {evt.type === 'job' ? <Briefcase className="w-3 h-3 mr-1 flex-shrink-0" /> :
                                            evt.type === 'pending' ? <Clock className="w-3 h-3 mr-1 flex-shrink-0" /> :
                                                <Lock className="w-3 h-3 mr-1 flex-shrink-0" />}
                                        {evt.title || (evt.type === 'job' ? 'Job' : evt.type === 'pending' ? 'Pending' : 'Blocked')}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 md:p-6 w-full">
            {renderHeader()}
            {renderDays()}
            {renderCells()}

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 justify-end border-t pt-3">
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-100 border border-green-200 rounded mr-2"></div>
                    Confirmed Job
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded mr-2"></div>
                    Pending Bid
                </div>
                <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-50 border border-red-100 rounded mr-2"></div>
                    Unavailable / Blocked
                </div>
            </div>
        </div>
    );
};

export default Calendar;
