// src/pages/Meals.tsx

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { useMembers } from '../hooks/useMembers';
import { useMeals } from '../hooks/useMeals';
import { MealToggle } from '../components/MealToggle';
import { Calendar as CalendarIcon, ShieldCheck, Lock } from 'lucide-react';

export default function Meals() {
  const { member } = useAuthContext();
  const { activeMonth, isCurrentManager } = useMonthContext();
  const { activeMembers } = useMembers();

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { meals, loading, upsertMeal } = useMeals(selectedDate);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isClosed = activeMonth?.status === 'closed';

  const handleToggle = async (
    targetMemberId: string,
    field: 'breakfast' | 'lunch' | 'dinner',
    currentVal: boolean
  ) => {
    if (isClosed) return;

    // Rule: member can only edit own meal for today, manager can edit any date
    const canEdit = isCurrentManager || (targetMemberId === member?.id && isToday);
    if (!canEdit) return;

    const existingMeal = meals.find(m => m.member_id === targetMemberId);

    const b = field === 'breakfast' ? (currentVal ? 1 : 0) : existingMeal?.breakfast ?? 0;
    const l = field === 'lunch' ? (currentVal ? 1 : 0) : existingMeal?.lunch ?? 0;
    const d = field === 'dinner' ? (currentVal ? 1 : 0) : existingMeal?.dinner ?? 0;

    await upsertMeal(targetMemberId, b as 0 | 1, l as 0 | 1, d as 0 | 1, selectedDate);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Daily Meal Management</h1>
          <p className="section-subtitle">
            Members can edit today's meal. Current manager can manage all member meals.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-card p-1.5 rounded-lg border border-border">
          <CalendarIcon size={16} className="text-blue ml-2" />
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="bg-transparent text-sm text-primary font-semibold outline-none cursor-pointer"
          />
        </div>
      </div>

      {!isToday && !isCurrentManager && (
        <div className="readonly-banner">
          <Lock size={16} />
          <span>Viewing historical meal data for {selectedDate}. Only today's meal can be edited.</span>
        </div>
      )}

      {loading ? (
        <div className="loading-screen text-center py-12">
          <div className="spinner" />
          <p className="mt-2 text-sm text-muted">Loading meals for {selectedDate}...</p>
        </div>
      ) : (
        <div className="grid grid-2">
          {activeMembers.map(mem => {
            const mealRecord = meals.find(m => m.member_id === mem.id);
            const isMe = mem.id === member?.id;
            const canEditThis = !isClosed && (isCurrentManager || (isMe && isToday));

            const total = mealRecord?.total_meal ?? 0;

            return (
              <div
                key={mem.id}
                className={`card ${isMe ? 'border-blue-500/50 bg-card-hover' : ''}`}
              >
                <div className="card-header mb-4">
                  <div className="flex items-center gap-2">
                    <div className="user-avatar">
                      {mem.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        {mem.name} {isMe && <span className="text-xs text-blue">(You)</span>}
                      </div>
                      <div className="text-xs text-muted">
                        {isMe && isToday ? 'Editable today' : canEditThis ? 'Manager editable' : 'Read-only'}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs text-muted uppercase">Total Meals</div>
                    <div className="text-2xl font-bold text-green">{total}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <MealToggle
                    label="Breakfast"
                    sublabel="Morning meal"
                    active={Boolean(mealRecord?.breakfast)}
                    disabled={!canEditThis}
                    onChange={val => handleToggle(mem.id, 'breakfast', val)}
                  />
                  <MealToggle
                    label="Lunch"
                    sublabel="Afternoon meal"
                    active={Boolean(mealRecord?.lunch)}
                    disabled={!canEditThis}
                    onChange={val => handleToggle(mem.id, 'lunch', val)}
                  />
                  <MealToggle
                    label="Dinner"
                    sublabel="Night meal"
                    active={Boolean(mealRecord?.dinner)}
                    disabled={!canEditThis}
                    onChange={val => handleToggle(mem.id, 'dinner', val)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
