import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  Plus,
  FileSpreadsheet,
  Calendar,
  Sun,
  Moon,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Check,
  Settings,
  SlidersHorizontal,
  Coffee,
  Users,
} from 'lucide-react';
import { Employee, AttendanceRecord, SystemSettings } from '../types';
import {
  db,
  formatDate,
  getDayOfWeek,
  formatTime12,
  minutesToTimeStr,
  timeToMinutes,
} from '../services/db';
import { exportAttendanceToExcel } from '../services/excel';

interface AttendanceViewProps {
  employees: Employee[];
  attendance: AttendanceRecord[];
  settings?: SystemSettings;
  onRefresh: () => void;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

// Calculate duration in minutes between two 24h HH:mm times
function calcDuration(startTime?: string, endTime?: string): number {
  if (!startTime || !endTime) return 0;
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  let diff = endMin - startMin;
  if (diff < 0) diff += 24 * 60; // Crosses midnight
  return Math.max(0, diff);
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  employees,
  attendance,
  settings,
  onRefresh,
}) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [viewMode, setViewMode] = useState<'matrix' | 'detailed'>('matrix');
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    employees.find((e) => e.status !== 'Unemployed')?.employeeId || ''
  );

  // Standard Shift Hours (Configurable live)
  const [stdShiftStart, setStdShiftStart] = useState<string>(
    settings?.attOpening || '09:00'
  );
  const [stdShiftEnd, setStdShiftEnd] = useState<string>(
    settings?.attClosing || '21:00'
  );
  const [showShiftConfig, setShowShiftConfig] = useState(false);
  const [showOffDayRoster, setShowOffDayRoster] = useState(false);
  const [shiftUpdateSuccess, setShiftUpdateSuccess] = useState<string | null>(null);
  const [offDayToast, setOffDayToast] = useState<string | null>(null);

  // Sync if settings prop changes
  useEffect(() => {
    if (settings?.attOpening) setStdShiftStart(settings.attOpening);
    if (settings?.attClosing) setStdShiftEnd(settings.attClosing);
  }, [settings?.attOpening, settings?.attClosing]);

  // Quick punch states
  const [quickEmpId, setQuickEmpId] = useState<string>(
    employees.find((e) => e.status !== 'Unemployed')?.employeeId || ''
  );
  const [quickDate, setQuickDate] = useState<string>(todayStr);
  const [punchFeedback, setPunchFeedback] = useState<string | null>(null);

  // Edit / Punch Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalEmpId, setModalEmpId] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [modalTimeIn, setModalTimeIn] = useState(stdShiftStart);
  const [modalTimeOut, setModalTimeOut] = useState(stdShiftEnd);
  const [modalSchedStart, setModalSchedStart] = useState(stdShiftStart);
  const [modalSchedEnd, setModalSchedEnd] = useState(stdShiftEnd);
  const [modalStatus, setModalStatus] = useState<AttendanceRecord['status']>('Present');
  const [modalRemarks, setModalRemarks] = useState('');

  // Active employees
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => e.status !== 'Unemployed');
  }, [employees]);

  // Duration in hours of standard shift
  const stdShiftDurationMin = useMemo(() => {
    return calcDuration(stdShiftStart, stdShiftEnd);
  }, [stdShiftStart, stdShiftEnd]);

  const stdShiftDurationHours = useMemo(() => {
    return Math.round((stdShiftDurationMin / 60) * 10) / 10;
  }, [stdShiftDurationMin]);

  // Compute days of the selected month
  const { year, month, daysInMonth, daysArray, monthLabel } = useMemo(() => {
    const [yStr, mStr] = selectedMonth.split('-');
    const y = parseInt(yStr, 10);
    const m = parseInt(mStr, 10);
    const daysCount = new Date(y, m, 0).getDate();
    const arr = Array.from({ length: daysCount }, (_, i) => i + 1);
    const dObj = new Date(y, m - 1, 1);
    const label = dObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
      year: y,
      month: m,
      daysInMonth: daysCount,
      daysArray: arr,
      monthLabel: label,
    };
  }, [selectedMonth]);

  // Month navigation
  const handlePrevMonth = () => {
    const prev = new Date(year, month - 2, 1);
    setSelectedMonth(prev.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const next = new Date(year, month, 1);
    setSelectedMonth(next.toISOString().slice(0, 7));
  };

  // Map of attendance by `${employeeId}_${date}`
  const attendanceMap = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendance.forEach((rec) => {
      map.set(`${rec.employeeId}_${rec.date}`, rec);
    });
    return map;
  }, [attendance]);

  // Handler to update an employee's Assigned Weekly Day Off
  const handleUpdateEmployeeOffDay = async (empId: string, newOffDay: string) => {
    const emp = employees.find((e) => e.employeeId === empId);
    if (!emp) return;

    await db.updateEmployeeOffDay(empId, newOffDay);

    // Re-align monthly attendance records for this employee
    const newSchedMin = calcDuration(stdShiftStart, stdShiftEnd);

    for (const day of daysArray) {
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayStr}`;
      const dObj = new Date(year, month - 1, day);
      const dayOfWeekName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
      const isNewOff = dayOfWeekName.toLowerCase() === newOffDay.toLowerCase();
      const rec = attendanceMap.get(`${empId}_${dateStr}`);

      if (isNewOff) {
        // If employee has no clock-in or clock-out recorded, mark as Day Off
        if (!rec || (!rec.timeIn && !rec.timeOut)) {
          await db.saveAttendanceRecord({
            attId: rec?.attId || `ATT-${empId}-${dateStr}`,
            employeeId: empId,
            employeeName: emp.employeeName,
            date: dateStr,
            shiftType: 'Single Shift',
            scheduledStart: stdShiftStart,
            scheduledEnd: stdShiftEnd,
            timeIn: '',
            timeOut: '',
            breakStart: '',
            breakEnd: '',
            totalWorkMinutes: 0,
            scheduledWorkMinutes: 0,
            extraMinutes: 0,
            shortMinutes: 0,
            status: 'Day Off',
            remarks: `Assigned Weekly Day Off (${newOffDay})`,
            createdAt: rec?.createdAt || new Date().toISOString(),
            createdBy: 'Admin',
          });
        }
      } else if (
        rec &&
        (rec.status === 'Day Off' || rec.status === 'Holiday') &&
        !rec.timeIn &&
        !rec.timeOut
      ) {
        // Was previously an off-day, now restore as a standard working day
        await db.saveAttendanceRecord({
          ...rec,
          status: 'Present',
          scheduledStart: stdShiftStart,
          scheduledEnd: stdShiftEnd,
          scheduledWorkMinutes: newSchedMin,
          remarks: 'Scheduled salon working shift',
        });
      }
    }

    onRefresh();
    setOffDayToast(`✅ Weekly Day Off for ${emp.employeeName} changed to ${newOffDay}!`);
    setTimeout(() => setOffDayToast(null), 5000);
  };

  // Handler to update Standard Shift Times
  const handleSaveStandardShift = async (newStart: string, newEnd: string) => {
    setStdShiftStart(newStart);
    setStdShiftEnd(newEnd);

    // Save to system settings
    if (settings) {
      await db.saveSettings({
        ...settings,
        attOpening: newStart,
        attClosing: newEnd,
        attMorningStart: newStart,
        attNightEnd: newEnd,
      });
    }

    // Recalculate attendance records for current selected month with new scheduled times
    const recordsInMonth = attendance.filter((a) => a.date.startsWith(selectedMonth));
    const newSchedMin = calcDuration(newStart, newEnd);

    for (const rec of recordsInMonth) {
      if (rec.status !== 'Holiday' && rec.status !== 'Day Off') {
        const totalWork = rec.totalWorkMinutes || 0;
        const extra = totalWork > newSchedMin ? totalWork - newSchedMin : 0;
        const short = totalWork > 0 && totalWork < newSchedMin ? newSchedMin - totalWork : 0;

        await db.saveAttendanceRecord({
          ...rec,
          scheduledStart: newStart,
          scheduledEnd: newEnd,
          scheduledWorkMinutes: newSchedMin,
          extraMinutes: extra,
          shortMinutes: short,
        });
      }
    }

    onRefresh();
    setShowShiftConfig(false);
    const durationH = Math.round((newSchedMin / 60) * 10) / 10;
    setShiftUpdateSuccess(
      `✅ Standard Salon Shift updated to ${formatTime12(newStart)} → ${formatTime12(newEnd)} (${durationH} Hours)! All scheduled hours and extra/short time recomputed.`
    );
    setTimeout(() => setShiftUpdateSuccess(null), 5000);
  };

  // Quick punch helper
  const handleQuickPunch = async (type: 'in' | 'out', customTime?: string) => {
    if (!quickEmpId) return;
    const emp = employees.find((e) => e.employeeId === quickEmpId);
    if (!emp) return;

    const dateKey = `${quickEmpId}_${quickDate}`;
    const existing = attendanceMap.get(dateKey);

    const now = new Date();
    const curH = now.getHours().toString().padStart(2, '0');
    const curM = now.getMinutes().toString().padStart(2, '0');
    const nowTimeStr = `${curH}:${curM}`;

    const schedStart = existing?.scheduledStart || stdShiftStart;
    const schedEnd = existing?.scheduledEnd || stdShiftEnd;

    let tIn = existing?.timeIn || '';
    let tOut = existing?.timeOut || '';

    if (type === 'in') {
      tIn = customTime || nowTimeStr;
    } else {
      tOut = customTime || nowTimeStr;
    }

    // Check if punching on employee's off-day
    const dObj = new Date(quickDate);
    const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
    const empOffDay = emp.weeklyOffDay || 'Friday';
    const isEmpOffDay = dayName.toLowerCase() === empOffDay.toLowerCase();

    // Work calculation (Morning to Night single continuous shift)
    let totalWorkMinutes = 0;
    if (tIn && tOut) {
      let diff = timeToMinutes(tOut) - timeToMinutes(tIn);
      if (diff < 0) diff += 24 * 60;
      totalWorkMinutes = Math.max(0, diff);
    }

    let schedWork = isEmpOffDay ? 0 : timeToMinutes(schedEnd) - timeToMinutes(schedStart);
    if (schedWork < 0) schedWork += 24 * 60;

    // If working on day off, all worked time is extra overtime!
    const extraMinutes = isEmpOffDay
      ? totalWorkMinutes
      : totalWorkMinutes > schedWork
      ? totalWorkMinutes - schedWork
      : 0;
    const shortMinutes =
      !isEmpOffDay && totalWorkMinutes > 0 && totalWorkMinutes < schedWork
        ? schedWork - totalWorkMinutes
        : 0;

    let status: AttendanceRecord['status'] = existing?.status || 'Present';
    if (isEmpOffDay) {
      status = 'Present'; // Present on day off (overtime)
    } else if (tIn) {
      const lateThreshold = settings?.attLateThreshold || 15;
      if (timeToMinutes(tIn) > timeToMinutes(schedStart) + lateThreshold) {
        status = 'Late';
      } else {
        status = 'Present';
      }
    }

    const record: AttendanceRecord = {
      attId: existing?.attId || `ATT-${quickEmpId}-${quickDate}`,
      employeeId: quickEmpId,
      employeeName: emp.employeeName,
      date: quickDate,
      shiftType: 'Single Shift',
      scheduledStart: schedStart,
      scheduledEnd: schedEnd,
      timeIn: tIn,
      timeOut: tOut,
      breakStart: existing?.breakStart || '',
      breakEnd: existing?.breakEnd || '',
      totalWorkMinutes,
      scheduledWorkMinutes: schedWork,
      extraMinutes,
      shortMinutes,
      status,
      remarks:
        existing?.remarks ||
        (isEmpOffDay
          ? `Off-duty shift worked (+${minutesToTimeStr(totalWorkMinutes)} extra overtime)`
          : type === 'in'
          ? `Clocked in morning at ${formatTime12(tIn)}`
          : `Clocked out night at ${formatTime12(tOut)}`),
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdBy: 'Admin',
    };

    await db.saveAttendanceRecord(record);
    onRefresh();

    setPunchFeedback(
      `Punched ${type === 'in' ? 'Time In (Morning)' : 'Time Out (Night)'} at ${formatTime12(
        type === 'in' ? tIn : tOut
      )} for ${emp.employeeName}${isEmpOffDay ? ' (Working on Weekly Day Off!)' : ''}`
    );
    setTimeout(() => setPunchFeedback(null), 4000);
  };

  // Open Edit Modal for a specific day and employee
  const handleOpenDayModal = (empId: string, dateStr: string) => {
    const existing = attendanceMap.get(`${empId}_${dateStr}`);
    setModalEmpId(empId);
    setModalDate(dateStr);

    if (existing) {
      setModalSchedStart(existing.scheduledStart || stdShiftStart);
      setModalSchedEnd(existing.scheduledEnd || stdShiftEnd);
      setModalTimeIn(existing.timeIn || stdShiftStart);
      setModalTimeOut(existing.timeOut || stdShiftEnd);
      setModalStatus(existing.status);
      setModalRemarks(existing.remarks || '');
    } else {
      // Check if this date is the employee's weekly day off
      const emp = employees.find((e) => e.employeeId === empId);
      const dObj = new Date(dateStr);
      const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
      const isOff = (emp?.weeklyOffDay || 'Friday').toLowerCase() === dayName.toLowerCase();

      setModalSchedStart(stdShiftStart);
      setModalSchedEnd(stdShiftEnd);
      setModalTimeIn(isOff ? '' : stdShiftStart);
      setModalTimeOut(isOff ? '' : stdShiftEnd);
      setModalStatus(isOff ? 'Day Off' : 'Present');
      setModalRemarks(isOff ? `Weekly Day Off (${dayName})` : '');
    }
    setShowModal(true);
  };

  // Save from Modal
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.employeeId === modalEmpId);
    if (!emp) return;

    const isDayOffOrHoliday = modalStatus === 'Day Off' || modalStatus === 'Holiday';

    let totalWorkMinutes = 0;
    if (modalTimeIn && modalTimeOut && modalStatus !== 'Absent') {
      let diff = timeToMinutes(modalTimeOut) - timeToMinutes(modalTimeIn);
      if (diff < 0) diff += 24 * 60;
      totalWorkMinutes = Math.max(0, diff);
    }

    let scheduledWorkMinutes = 0;
    if (modalSchedStart && modalSchedEnd && !isDayOffOrHoliday) {
      let s = timeToMinutes(modalSchedEnd) - timeToMinutes(modalSchedStart);
      if (s < 0) s += 24 * 60;
      scheduledWorkMinutes = Math.max(0, s);
    }

    const extraMinutes = isDayOffOrHoliday
      ? totalWorkMinutes
      : totalWorkMinutes > scheduledWorkMinutes
      ? totalWorkMinutes - scheduledWorkMinutes
      : 0;
    const shortMinutes =
      !isDayOffOrHoliday && totalWorkMinutes > 0 && totalWorkMinutes < scheduledWorkMinutes
        ? scheduledWorkMinutes - totalWorkMinutes
        : 0;

    const existing = attendanceMap.get(`${modalEmpId}_${modalDate}`);

    const record: AttendanceRecord = {
      attId: existing?.attId || `ATT-${modalEmpId}-${modalDate}`,
      employeeId: modalEmpId,
      employeeName: emp.employeeName,
      date: modalDate,
      shiftType: 'Single Shift',
      scheduledStart: modalSchedStart,
      scheduledEnd: modalSchedEnd,
      timeIn: isDayOffOrHoliday && !modalTimeIn ? '' : modalTimeIn,
      timeOut: isDayOffOrHoliday && !modalTimeOut ? '' : modalTimeOut,
      breakStart: '',
      breakEnd: '',
      totalWorkMinutes,
      scheduledWorkMinutes,
      extraMinutes,
      shortMinutes,
      status: modalStatus,
      remarks: modalRemarks,
      createdAt: existing?.createdAt || new Date().toISOString(),
      createdBy: 'Admin',
    };

    await db.saveAttendanceRecord(record);
    setShowModal(false);
    onRefresh();
  };

  // Aggregate monthly row summary for an employee
  const getEmployeeMonthSummary = (empId: string) => {
    let totalWorkMin = 0;
    let scheduledWorkMin = 0;
    let extraMin = 0;
    let shortMin = 0;
    let presentDays = 0;
    let lateDays = 0;
    let absentDays = 0;
    let offDays = 0;
    let lastRemark = '';

    daysArray.forEach((day) => {
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${selectedMonth}-${dayStr}`;
      const rec = attendanceMap.get(`${empId}_${dateStr}`);

      if (rec) {
        totalWorkMin += rec.totalWorkMinutes || 0;
        scheduledWorkMin += rec.scheduledWorkMinutes || 0;
        extraMin += rec.extraMinutes || 0;
        const s =
          rec.shortMinutes !== undefined
            ? rec.shortMinutes
            : rec.totalWorkMinutes < rec.scheduledWorkMinutes
            ? rec.scheduledWorkMinutes - rec.totalWorkMinutes
            : 0;
        shortMin += s;

        if (rec.status === 'Present') presentDays++;
        if (rec.status === 'Late') lateDays++;
        if (rec.status === 'Absent') absentDays++;
        if (rec.status === 'Holiday' || rec.status === 'Day Off') offDays++;
        if (rec.remarks) lastRemark = rec.remarks;
      }
    });

    const statusSummary = `${presentDays}P · ${lateDays}L · ${offDays}OFF${
      absentDays > 0 ? ` · ${absentDays}A` : ''
    }`;

    return {
      totalWorkMin,
      scheduledWorkMin,
      extraMin,
      shortMin,
      totalWorkHours: minutesToTimeStr(totalWorkMin),
      scheduledHours: minutesToTimeStr(scheduledWorkMin),
      extraHours: minutesToTimeStr(extraMin),
      shortHours: minutesToTimeStr(shortMin),
      presentDays,
      lateDays,
      absentDays,
      offDays,
      statusSummary,
      lastRemark,
    };
  };

  // Grand totals across all staff for the month
  const grandStats = useMemo(() => {
    let grandWork = 0;
    let grandSched = 0;
    let grandExtra = 0;
    let grandShort = 0;
    let grandPresents = 0;

    activeEmployees.forEach((emp) => {
      const s = getEmployeeMonthSummary(emp.employeeId);
      grandWork += s.totalWorkMin;
      grandSched += s.scheduledWorkMin;
      grandExtra += s.extraMin;
      grandShort += s.shortMin;
      grandPresents += s.presentDays;
    });

    return {
      grandWork: minutesToTimeStr(grandWork),
      grandSched: minutesToTimeStr(grandSched),
      grandExtra: minutesToTimeStr(grandExtra),
      grandShort: minutesToTimeStr(grandShort),
      grandPresents,
    };
  }, [activeEmployees, attendanceMap, selectedMonth]);

  // Records for current month for export
  const monthRecords = useMemo(() => {
    return attendance.filter((a) => a.date.startsWith(selectedMonth));
  }, [attendance, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Top Banner: Shift Architecture, Off-Days & Overview */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span>Attendance &amp; Extra-Time Schedule</span>
            </h2>
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>{formatTime12(stdShiftStart)}</span>
              <span className="text-slate-400">→</span>
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span>{formatTime12(stdShiftEnd)}</span>
              <span className="text-blue-900 font-bold font-mono">({stdShiftDurationHours}h)</span>
            </div>
            <button
              onClick={() => setShowShiftConfig(!showShiftConfig)}
              className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Change Standard Salon Shift Times"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>{showShiftConfig ? 'Close Shift Time' : 'Update Shift Time'}</span>
            </button>
            <button
              onClick={() => setShowOffDayRoster(!showOffDayRoster)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 ${
                showOffDayRoster
                  ? 'bg-purple-100 border-purple-300 text-purple-900 shadow-xs'
                  : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
              }`}
              title="Manage and change assigned weekly off days for each employee"
            >
              <Coffee className="w-3.5 h-3.5 text-purple-600" />
              <span>Manage Staff Off-Days</span>
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Salon single shift: <strong>{formatTime12(stdShiftStart)} to {formatTime12(stdShiftEnd)}</strong>. Staggered individual days off per employee (not all off on the same day). Full month days in one continuous line ending with Total Work, Scheduled, Extra, Short, Status, and Remarks.
          </p>
        </div>

        {/* Month Selector & View Modes */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-xs text-slate-800 font-mono">
              {monthLabel}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'matrix'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Full Month (1 Line)
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                viewMode === 'detailed'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Day-by-Day Sheet
            </button>
          </div>

          <button
            onClick={() => exportAttendanceToExcel(monthRecords, monthLabel)}
            className="px-3 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {/* STAFF OFF-DAYS ROSTER & MANAGEMENT DRAWER */}
      {showOffDayRoster && (
        <div className="bg-purple-50/60 p-5 rounded-xl border border-purple-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-purple-200/60">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-purple-700" />
              <h3 className="text-sm font-bold text-purple-950">
                Staff Weekly Off-Days Roster (Individual Control for Each Employee)
              </h3>
            </div>
            <span className="text-xs text-purple-700 font-medium">
              Staggered Days Off: Beauty salon remains open 7 days a week with active staff coverage
            </span>
          </div>

          <p className="text-xs text-slate-600">
            Change any staff member's assigned weekly day off below. The system immediately updates their monthly schedule, sets <strong>OFF</strong> on their designated day, and recalculates monthly scheduled work hours and extra time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeEmployees.map((emp) => {
              const currentOff = emp.weeklyOffDay || 'Friday';
              return (
                <div
                  key={emp.employeeId}
                  className="bg-white p-3.5 rounded-xl border border-purple-200/80 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-xs text-slate-900 truncate">
                      {emp.employeeName}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {emp.employeeId} · {emp.position}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-500">Day Off:</span>
                    <select
                      value={currentOff}
                      onChange={(e) => handleUpdateEmployeeOffDay(emp.employeeId, e.target.value)}
                      className="text-xs font-bold py-1.5 px-2.5 bg-purple-50 text-purple-900 border border-purple-300 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors shadow-2xs"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SHIFT TIME CONFIGURATOR DRAWER */}
      {showShiftConfig && (
        <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-sm space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Update Standard Salon One Shift Time (Morning to Night)
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Current: {formatTime12(stdShiftStart)} → {formatTime12(stdShiftEnd)} ({stdShiftDurationHours}h)
            </span>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Popular Salon Shift Presets (Qatar &amp; Gulf Standard):
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleSaveStandardShift('10:00', '22:00')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  stdShiftStart === '10:00' && stdShiftEnd === '22:00'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                10:00 AM – 10:00 PM (12h · Mall/Commercial Salon)
              </button>

              <button
                type="button"
                onClick={() => handleSaveStandardShift('09:00', '21:00')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  stdShiftStart === '09:00' && stdShiftEnd === '21:00'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                09:00 AM – 09:00 PM (12h · Standard Full Day)
              </button>

              <button
                type="button"
                onClick={() => handleSaveStandardShift('10:00', '20:00')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  stdShiftStart === '10:00' && stdShiftEnd === '20:00'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                10:00 AM – 08:00 PM (10h · Standard Salon)
              </button>

              <button
                type="button"
                onClick={() => handleSaveStandardShift('09:00', '18:00')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  stdShiftStart === '09:00' && stdShiftEnd === '18:00'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                09:00 AM – 06:00 PM (9h · Day Shift)
              </button>

              <button
                type="button"
                onClick={() => handleSaveStandardShift('11:00', '23:00')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  stdShiftStart === '11:00' && stdShiftEnd === '23:00'
                    ? 'bg-blue-50 border-blue-400 text-blue-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                }`}
              >
                11:00 AM – 11:00 PM (12h · Late Night Shift)
              </button>
            </div>
          </div>

          {/* Custom Time Form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 items-end">
            <div>
              <label className="block text-xs font-semibold text-amber-900 mb-1 flex items-center gap-1">
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Morning Time In (Opening)</span>
              </label>
              <input
                type="time"
                value={stdShiftStart}
                onChange={(e) => setStdShiftStart(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Night Time Out (Closing)</span>
              </label>
              <input
                type="time"
                value={stdShiftEnd}
                onChange={(e) => setStdShiftEnd(e.target.value)}
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-slate-900"
              />
            </div>

            <div>
              <button
                type="button"
                onClick={() => handleSaveStandardShift(stdShiftStart, stdShiftEnd)}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Apply &amp; Recompute Monthly Timesheet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toasts */}
      {offDayToast && (
        <div className="bg-purple-50 border border-purple-200 text-purple-900 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <Coffee className="w-4 h-4 text-purple-600 shrink-0" />
          <span>{offDayToast}</span>
        </div>
      )}

      {shiftUpdateSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{shiftUpdateSuccess}</span>
        </div>
      )}

      {/* QUICK CLOCK-IN / CLOCK-OUT PUNCH STATION */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-4 sm:p-5 rounded-xl shadow-md border border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>1-Click Punch Station</span>
              <span className="text-[10px] text-slate-400 font-normal">
                (Standard: {formatTime12(stdShiftStart)} → {formatTime12(stdShiftEnd)})
              </span>
            </div>
            <div className="text-sm font-semibold text-slate-100">
              Morning Time In &amp; Night Time Out
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Dropdown */}
          <select
            value={quickEmpId}
            onChange={(e) => setQuickEmpId(e.target.value)}
            className="text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-medium max-w-[200px]"
          >
            {activeEmployees.map((e) => (
              <option key={e.employeeId} value={e.employeeId}>
                {e.employeeName} ({e.employeeId}) · Off: {e.weeklyOffDay || 'Fri'}
              </option>
            ))}
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={quickDate}
            onChange={(e) => setQuickDate(e.target.value)}
            className="text-xs p-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
          />

          {/* TIME IN BUTTON */}
          <button
            onClick={() => handleQuickPunch('in', stdShiftStart)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg transition-all flex items-center gap-2 shadow-xs active:scale-95"
            title={`Clock In Morning (${formatTime12(stdShiftStart)})`}
          >
            <Sun className="w-4 h-4 text-amber-200" />
            <span>Time In ({formatTime12(stdShiftStart)})</span>
          </button>

          {/* TIME OUT BUTTON */}
          <button
            onClick={() => handleQuickPunch('out', stdShiftEnd)}
            className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all flex items-center gap-2 shadow-xs active:scale-95"
            title={`Clock Out Night (${formatTime12(stdShiftEnd)})`}
          >
            <Moon className="w-4 h-4 text-indigo-200" />
            <span>Time Out ({formatTime12(stdShiftEnd)})</span>
          </button>
        </div>
      </div>

      {/* Punch Feedback Toast */}
      {punchFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{punchFeedback}</span>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Staff Work Hours
          </div>
          <div className="text-xl font-bold text-slate-900 font-mono tabular-nums">
            {grandStats.grandWork}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{monthLabel} logged hours</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Total Scheduled Hours
          </div>
          <div className="text-xl font-bold text-slate-700 font-mono tabular-nums">
            {grandStats.grandSched}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {formatTime12(stdShiftStart)} to {formatTime12(stdShiftEnd)} (Excludes staff off days)
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider flex items-center gap-1">
            <span>Total Extra (Overtime)</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 font-mono tabular-nums">
            +{grandStats.grandExtra}
          </div>
          <div className="text-[10px] text-emerald-700/80 mt-0.5">Includes off-duty work</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1">
            <span>Total Short (Deficit)</span>
          </div>
          <div className="text-xl font-bold text-rose-600 font-mono tabular-nums">
            -{grandStats.grandShort}
          </div>
          <div className="text-[10px] text-rose-700/80 mt-0.5">Late / early exit deficit</div>
        </div>
      </div>

      {/* VIEW 1: FULL MONTH DAY IN ONE LINE (PRIMARY MASTER VIEW) */}
      {viewMode === 'matrix' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Monthly Shift Matrix: Days 1–{daysInMonth} in One Line</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Each employee row displays their assigned weekly day off and all days of the month. In the end: Total Work, Scheduled, Extra, Short, Status, and Remarks. Change any employee's off day directly below their name.
              </p>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-300"></span>
                <span>Present</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-100 border border-purple-300"></span>
                <span>Assigned Day Off</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-100 border border-amber-300"></span>
                <span>Late Arrival</span>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[640px] custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse min-w-[1650px]">
              <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 z-20 border-b border-slate-200">
                <tr>
                  {/* Sticky Employee Info & Off-Day Control Column */}
                  <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-100 border-r border-slate-200 min-w-[210px] shadow-xs">
                    Employee &amp; Assigned Off Day
                  </th>

                  {/* Day Columns 1 to 31 */}
                  {daysArray.map((day) => {
                    const dStr = day.toString().padStart(2, '0');
                    const curDateStr = `${selectedMonth}-${dStr}`;
                    const dObj = new Date(year, month - 1, day);
                    const dayLetter = dObj.toLocaleDateString('en-US', { weekday: 'narrow' });
                    const isToday = curDateStr === todayStr;

                    return (
                      <th
                        key={day}
                        className={`py-2 px-1 text-center min-w-[42px] border-r border-slate-200 ${
                          isToday
                            ? 'bg-blue-100 text-blue-900 font-extrabold ring-1 ring-blue-400'
                            : 'bg-slate-100'
                        }`}
                      >
                        <div className="text-[11px] leading-tight font-mono">{day}</div>
                        <div className="text-[9px] font-normal uppercase text-slate-400">{dayLetter}</div>
                      </th>
                    );
                  })}

                  {/* Ending Columns Requested by User */}
                  <th className="py-2.5 px-3 text-right bg-slate-200/70 text-slate-900 border-l border-slate-300 min-w-[95px]">
                    Total Work
                  </th>
                  <th className="py-2.5 px-3 text-right bg-slate-100 text-slate-600 min-w-[95px]">
                    Scheduled
                  </th>
                  <th className="py-2.5 px-3 text-right bg-emerald-50 text-emerald-800 min-w-[90px]">
                    Extra
                  </th>
                  <th className="py-2.5 px-3 text-right bg-rose-50 text-rose-800 min-w-[90px]">
                    Short
                  </th>
                  <th className="py-2.5 px-3 bg-slate-100 text-slate-700 min-w-[140px]">
                    Status
                  </th>
                  <th className="py-2.5 px-3 bg-slate-100 text-slate-700 min-w-[180px]">
                    Remarks
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {activeEmployees.map((emp) => {
                  const summary = getEmployeeMonthSummary(emp.employeeId);
                  const currentOffDay = emp.weeklyOffDay || 'Friday';

                  return (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/70 transition-colors">
                      {/* Sticky Employee Name, ID & Interactive Off Day Selector */}
                      <td className="py-2.5 px-3 sticky left-0 z-10 bg-white border-r border-slate-200 shadow-xs">
                        <div className="font-bold text-slate-900 truncate max-w-[180px]">
                          {emp.employeeName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1.5">
                          <span>{emp.employeeId}</span>
                          <span>·</span>
                          <span className="truncate">{emp.position}</span>
                        </div>

                        {/* Interactive Off-Day Control */}
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[10px] text-purple-700 font-semibold flex items-center gap-0.5">
                            <Coffee className="w-3 h-3 text-purple-600" />
                            <span>Off:</span>
                          </span>
                          <select
                            value={currentOffDay}
                            onChange={(e) => handleUpdateEmployeeOffDay(emp.employeeId, e.target.value)}
                            className="text-[10px] font-bold py-0.5 px-1.5 bg-purple-50 text-purple-900 border border-purple-200 rounded cursor-pointer hover:bg-purple-100 transition-colors"
                            title={`Change weekly off day for ${emp.employeeName}`}
                          >
                            {DAYS_OF_WEEK.map((d) => (
                              <option key={d} value={d}>
                                {d}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>

                      {/* Day Cells 1 to 31 */}
                      {daysArray.map((day) => {
                        const dayStr = day.toString().padStart(2, '0');
                        const dateStr = `${selectedMonth}-${dayStr}`;
                        const rec = attendanceMap.get(`${emp.employeeId}_${dateStr}`);
                        const dObj = new Date(year, month - 1, day);
                        const dayOfWeekName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
                        const isEmpOffDay = dayOfWeekName.toLowerCase() === currentOffDay.toLowerCase();
                        const isToday = dateStr === todayStr;

                        let cellContent = '—';
                        let cellClass =
                          'bg-transparent text-slate-300 hover:bg-slate-100 text-[10px] cursor-pointer';

                        if (rec) {
                          if (rec.status === 'Day Off' || rec.status === 'Holiday') {
                            cellContent = 'OFF';
                            cellClass =
                              'bg-purple-100/70 text-purple-800 font-bold hover:bg-purple-200 cursor-pointer';
                          } else if (rec.status === 'Absent') {
                            cellContent = 'ABS';
                            cellClass =
                              'bg-rose-100 text-rose-700 font-bold hover:bg-rose-200 cursor-pointer';
                          } else if (rec.timeIn && rec.timeOut) {
                            const hours = Math.round((rec.totalWorkMinutes / 60) * 10) / 10;
                            cellContent = `${hours}h`;
                            cellClass = isEmpOffDay
                              ? 'bg-purple-600 text-white font-extrabold hover:bg-purple-700 cursor-pointer shadow-2xs'
                              : rec.status === 'Late'
                              ? 'bg-amber-100/90 text-amber-900 font-bold hover:bg-amber-200 cursor-pointer'
                              : rec.extraMinutes > 0
                              ? 'bg-emerald-100 text-emerald-900 font-bold hover:bg-emerald-200 cursor-pointer'
                              : 'bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 cursor-pointer';
                          } else if (rec.timeIn && !rec.timeOut) {
                            cellContent = 'IN';
                            cellClass =
                              'bg-blue-100 text-blue-800 font-bold animate-pulse cursor-pointer';
                          }
                        } else if (isEmpOffDay) {
                          cellContent = 'OFF';
                          cellClass =
                            'bg-purple-50 text-purple-700 font-medium hover:bg-purple-100 cursor-pointer';
                        }

                        return (
                          <td
                            key={day}
                            onClick={() => handleOpenDayModal(emp.employeeId, dateStr)}
                            className={`py-1.5 px-1 text-center border-r border-slate-100 transition-colors ${
                              isToday ? 'ring-1 ring-blue-300' : ''
                            }`}
                            title={`${emp.employeeName} — ${dateStr} (${dayOfWeekName}): ${
                              rec
                                ? `${rec.status} (${rec.timeIn ? formatTime12(rec.timeIn) : 'No In'} → ${
                                    rec.timeOut ? formatTime12(rec.timeOut) : 'No Out'
                                  }, Work: ${minutesToTimeStr(rec.totalWorkMinutes)})`
                                : isEmpOffDay
                                ? `Assigned Weekly Day Off (${currentOffDay})`
                                : 'Click to clock in or record attendance'
                            }`}
                          >
                            <div className={`py-1 px-0.5 rounded text-[10px] font-mono leading-none ${cellClass}`}>
                              {cellContent}
                            </div>
                          </td>
                        );
                      })}

                      {/* Total Work */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/50 border-l border-slate-200 tabular-nums">
                        {summary.totalWorkHours}
                      </td>

                      {/* Scheduled */}
                      <td className="py-2 px-3 text-right font-mono text-slate-500 tabular-nums">
                        {summary.scheduledHours}
                      </td>

                      {/* Extra */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 bg-emerald-50/30 tabular-nums">
                        {summary.extraMin > 0 ? `+${summary.extraHours}` : '0h 0m'}
                      </td>

                      {/* Short */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 bg-rose-50/30 tabular-nums">
                        {summary.shortMin > 0 ? `-${summary.shortHours}` : '0h 0m'}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <span className="font-mono text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                          {summary.statusSummary}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] truncate max-w-[200px]" title={summary.lastRemark}>
                        {summary.lastRemark || `Weekly Day Off: ${currentOffDay}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Total Summary Row */}
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-800">
                <tr>
                  <td className="py-2.5 px-3 sticky left-0 z-10 bg-slate-100 border-r border-slate-300 shadow-xs">
                    Month Total Summary
                  </td>
                  <td colSpan={daysInMonth} className="py-2 px-3 text-center text-slate-400 text-[11px]">
                    {daysInMonth} Days in {monthLabel}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-900 border-l border-slate-300">
                    {grandStats.grandWork}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                    {grandStats.grandSched}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-600 bg-emerald-100/40">
                    +{grandStats.grandExtra}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-600 bg-rose-100/40">
                    -{grandStats.grandShort}
                  </td>
                  <td colSpan={2} className="py-2.5 px-3 text-slate-600 text-[11px]">
                    All Active Employees
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: EMPLOYEE DETAILED DAY-BY-DAY SHEET WITH DIRECT [TIME IN] & [TIME OUT] BUTTONS */}
      {viewMode === 'detailed' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span>Employee Detailed Monthly Timesheet (Days 1–{daysInMonth})</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Standard shift: <strong>{formatTime12(stdShiftStart)} – {formatTime12(stdShiftEnd)} ({stdShiftDurationHours}h)</strong>. Assigned Off Day for this employee is highlighted.
              </p>
            </div>

            {/* Select Employee to inspect */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <label className="text-xs font-semibold text-slate-600">Employee:</label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="text-xs p-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  {activeEmployees.map((e) => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.employeeName} ({e.employeeId}) · Off: {e.weeklyOffDay || 'Fri'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Day off changer for selected employee */}
              {(() => {
                const targetEmp = activeEmployees.find((e) => e.employeeId === selectedEmpId);
                const curOff = targetEmp?.weeklyOffDay || 'Friday';
                return (
                  <div className="flex items-center gap-1 bg-purple-50 p-1 rounded-lg border border-purple-200">
                    <span className="text-[11px] font-semibold text-purple-800 px-1">Off:</span>
                    <select
                      value={curOff}
                      onChange={(e) => handleUpdateEmployeeOffDay(selectedEmpId, e.target.value)}
                      className="text-xs font-bold p-1 bg-white border border-purple-200 rounded text-purple-900"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="overflow-x-auto max-h-[620px] custom-scrollbar">
            <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Scheduled Shift</th>
                  <th className="py-2.5 px-3 text-amber-900 bg-amber-50/50">
                    Time In (Morning)
                  </th>
                  <th className="py-2.5 px-3 text-indigo-900 bg-indigo-50/50">
                    Time Out (Night)
                  </th>
                  <th className="py-2.5 px-3 text-right">Total Work</th>
                  <th className="py-2.5 px-3 text-right text-slate-500">Scheduled</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Extra</th>
                  <th className="py-2.5 px-3 text-right text-rose-700">Short</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Remarks</th>
                  <th className="py-2.5 px-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {daysArray.map((day) => {
                  const dayStr = day.toString().padStart(2, '0');
                  const dateStr = `${selectedMonth}-${dayStr}`;
                  const rec = attendanceMap.get(`${selectedEmpId}_${dateStr}`);
                  const dObj = new Date(year, month - 1, day);
                  const dayName = dObj.toLocaleDateString('en-US', { weekday: 'long' });
                  const currentEmp = activeEmployees.find((e) => e.employeeId === selectedEmpId);
                  const empOffDay = currentEmp?.weeklyOffDay || 'Friday';
                  const isOff = dayName.toLowerCase() === empOffDay.toLowerCase();
                  const isToday = dateStr === todayStr;

                  const extraMin = rec?.extraMinutes || 0;
                  const shortMin =
                    rec?.shortMinutes !== undefined
                      ? rec.shortMinutes
                      : rec && rec.totalWorkMinutes < rec.scheduledWorkMinutes
                      ? rec.scheduledWorkMinutes - rec.totalWorkMinutes
                      : 0;

                  return (
                    <tr
                      key={day}
                      className={`hover:bg-slate-50 transition-colors ${
                        isToday ? 'bg-blue-50/30' : isOff ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="py-2 px-3 font-mono font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{formatDate(dateStr)}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-600 text-white">
                            Today
                          </span>
                        )}
                      </td>

                      {/* Day */}
                      <td className="py-2 px-3 text-slate-600 font-medium flex items-center gap-1.5">
                        <span>{dayName}</span>
                        {isOff && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                            Day Off
                          </span>
                        )}
                      </td>

                      {/* Scheduled Shift */}
                      <td className="py-2 px-3 font-mono text-slate-500">
                        {isOff ? (
                          <span className="text-purple-700 font-medium">Weekly Day Off ({empOffDay})</span>
                        ) : (
                          `${formatTime12(stdShiftStart)} - ${formatTime12(stdShiftEnd)} (${stdShiftDurationHours}h)`
                        )}
                      </td>

                      {/* Time In (Morning) with Quick Button */}
                      <td className="py-2 px-3 bg-amber-50/20 font-mono">
                        {rec?.timeIn ? (
                          <span className="font-bold text-slate-900">
                            {formatTime12(rec.timeIn)}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickEmpId(selectedEmpId);
                              setQuickDate(dateStr);
                              handleQuickPunch('in', stdShiftStart);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-amber-100 hover:bg-amber-200 text-amber-900 rounded transition-colors flex items-center gap-1"
                          >
                            <Sun className="w-3 h-3 text-amber-600" />
                            <span>+ Time In</span>
                          </button>
                        )}
                      </td>

                      {/* Time Out (Night) with Quick Button */}
                      <td className="py-2 px-3 bg-indigo-50/20 font-mono">
                        {rec?.timeOut ? (
                          <span className="font-bold text-slate-900">
                            {formatTime12(rec.timeOut)}
                          </span>
                        ) : (
                          <button
                            onClick={() => {
                              setQuickEmpId(selectedEmpId);
                              setQuickDate(dateStr);
                              handleQuickPunch('out', stdShiftEnd);
                            }}
                            className="px-2 py-1 text-[10px] font-bold bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded transition-colors flex items-center gap-1"
                          >
                            <Moon className="w-3 h-3 text-indigo-600" />
                            <span>+ Time Out</span>
                          </button>
                        )}
                      </td>

                      {/* Total Work */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 tabular-nums">
                        {rec?.totalWorkMinutes ? minutesToTimeStr(rec.totalWorkMinutes) : '0h 0m'}
                      </td>

                      {/* Scheduled */}
                      <td className="py-2 px-3 text-right font-mono text-slate-500 tabular-nums">
                        {rec?.scheduledWorkMinutes ? minutesToTimeStr(rec.scheduledWorkMinutes) : isOff ? '0h 0m' : `${stdShiftDurationHours}h 0m`}
                      </td>

                      {/* Extra */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600 tabular-nums">
                        {extraMin > 0 ? `+${minutesToTimeStr(extraMin)}` : '0m'}
                      </td>

                      {/* Short */}
                      <td className="py-2 px-3 text-right font-mono font-bold text-rose-600 tabular-nums">
                        {shortMin > 0 ? `-${minutesToTimeStr(shortMin)}` : '0m'}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            rec?.status === 'Day Off' || (isOff && (!rec || !rec.timeIn))
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : rec?.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : rec?.status === 'Late'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : rec?.status === 'Absent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {rec?.status || (isOff ? 'Day Off' : 'Pending')}
                        </span>
                      </td>

                      {/* Remarks */}
                      <td className="py-2 px-3 text-slate-500 text-[11px] max-w-[180px] truncate">
                        {rec?.remarks || (isOff ? `Assigned Day Off (${empOffDay})` : '—')}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={() => handleOpenDayModal(selectedEmpId, dateStr)}
                          className="px-2 py-1 text-[10px] font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 rounded"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* Grand Total Footer for Employee */}
              {(() => {
                const sum = getEmployeeMonthSummary(selectedEmpId);
                const currentEmp = activeEmployees.find((e) => e.employeeId === selectedEmpId);
                return (
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 text-slate-900">
                    <tr>
                      <td colSpan={5} className="py-3 px-3 text-slate-700 uppercase tracking-wider text-[11px]">
                        Monthly Total for {currentEmp?.employeeName} (Off: {currentEmp?.weeklyOffDay || 'Friday'})
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-900 text-sm">
                        {sum.totalWorkHours}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {sum.scheduledHours}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 text-sm">
                        +{sum.extraHours}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600 text-sm">
                        -{sum.shortHours}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px]">
                        {sum.statusSummary}
                      </td>
                      <td colSpan={2} className="py-3 px-3 text-slate-500 text-[11px]">
                        {sum.lastRemark || 'Verified'}
                      </td>
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PUNCH & EDIT ATTENDANCE RECORD (Includes 1-Click Day Off Toggle) */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">
                  Attendance &amp; Shift Editor
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">
                    {employees.find((e) => e.employeeId === modalEmpId)?.employeeName} ({modalEmpId})
                  </div>
                  <div className="text-slate-500 mt-0.5">
                    Date: <span className="font-mono font-semibold text-slate-700">{formatDate(modalDate)}</span> ({getDayOfWeek(modalDate)})
                  </div>
                </div>

                {/* Quick Toggle for Day Off */}
                <button
                  type="button"
                  onClick={() => {
                    if (modalStatus === 'Day Off') {
                      setModalStatus('Present');
                      setModalTimeIn(stdShiftStart);
                      setModalTimeOut(stdShiftEnd);
                      setModalRemarks('Working salon shift');
                    } else {
                      setModalStatus('Day Off');
                      setModalTimeIn('');
                      setModalTimeOut('');
                      setModalRemarks(`Employee Day Off (${getDayOfWeek(modalDate)})`);
                    }
                  }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                    modalStatus === 'Day Off'
                      ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                      : 'bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{modalStatus === 'Day Off' ? 'Marked as Day Off ✓' : 'Set as Day Off'}</span>
                </button>
              </div>

              {/* Time In (Morning) & Time Out (Night) Inputs */}
              <div className="grid grid-cols-2 gap-4">
                {/* Morning Time In */}
                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      <span>Time In (Morning)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalTimeIn(stdShiftStart)}
                      className="text-[10px] text-amber-700 hover:underline font-semibold"
                    >
                      {formatTime12(stdShiftStart)}
                    </button>
                  </div>
                  <input
                    type="time"
                    value={modalTimeIn}
                    onChange={(e) => setModalTimeIn(e.target.value)}
                    disabled={modalStatus === 'Day Off'}
                    className="w-full text-sm p-2 bg-white border border-amber-300 rounded-lg font-mono font-bold text-slate-900 disabled:opacity-50"
                  />
                  <div className="text-[10px] text-amber-700">Standard Start: {formatTime12(modalSchedStart)}</div>
                </div>

                {/* Night Time Out */}
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Time Out (Night)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setModalTimeOut(stdShiftEnd)}
                      className="text-[10px] text-indigo-700 hover:underline font-semibold"
                    >
                      {formatTime12(stdShiftEnd)}
                    </button>
                  </div>
                  <input
                    type="time"
                    value={modalTimeOut}
                    onChange={(e) => setModalTimeOut(e.target.value)}
                    disabled={modalStatus === 'Day Off'}
                    className="w-full text-sm p-2 bg-white border border-indigo-300 rounded-lg font-mono font-bold text-slate-900 disabled:opacity-50"
                  />
                  <div className="text-[10px] text-indigo-700">Standard End: {formatTime12(modalSchedEnd)}</div>
                </div>
              </div>

              {/* Status and Remarks */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status</label>
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value as AttendanceRecord['status'])}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Present">Present (Working)</option>
                    <option value="Day Off">Day Off (Weekly Rest)</option>
                    <option value="Late">Late Arrival</option>
                    <option value="Holiday">Official Holiday</option>
                    <option value="Absent">Absent</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Leave">On Leave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Weekly Rest / Overtime"
                    value={modalRemarks}
                    onChange={(e) => setModalRemarks(e.target.value)}
                    className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Live Preview Card */}
              {(() => {
                let w = 0;
                if (modalTimeIn && modalTimeOut) {
                  let diff = timeToMinutes(modalTimeOut) - timeToMinutes(modalTimeIn);
                  if (diff < 0) diff += 24 * 60;
                  w = Math.max(0, diff);
                }
                const isOff = modalStatus === 'Day Off' || modalStatus === 'Holiday';
                let s = isOff ? 0 : timeToMinutes(modalSchedEnd) - timeToMinutes(modalSchedStart);
                if (s < 0) s += 24 * 60;
                const extra = isOff ? w : w > s ? w - s : 0;
                const short = !isOff && w > 0 && w < s ? s - w : 0;

                return (
                  <div className="bg-slate-900 text-white p-3 rounded-lg flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Total Work:</span>
                      <strong className="text-white text-sm">{minutesToTimeStr(w)}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] font-sans">Scheduled:</span>
                      <span className="text-slate-300">{minutesToTimeStr(s)}</span>
                    </div>
                    <div>
                      <span className="text-emerald-400 block text-[10px] font-sans font-bold">Extra:</span>
                      <span className="text-emerald-400 font-bold">
                        {extra > 0 ? `+${minutesToTimeStr(extra)}` : '0m'}
                      </span>
                    </div>
                    <div>
                      <span className="text-rose-400 block text-[10px] font-sans font-bold">Short:</span>
                      <span className="text-rose-400 font-bold">
                        {short > 0 ? `-${minutesToTimeStr(short)}` : '0m'}
                      </span>
                    </div>
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Attendance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
