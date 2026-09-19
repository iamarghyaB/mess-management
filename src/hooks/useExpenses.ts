// src/hooks/useExpenses.ts

import { useState, useEffect } from 'react';
import { supabase, TABLES } from '../lib/supabase';
import { Expense } from '../types/models';

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from(TABLES.EXPENSES)
        .select('*')
        .order('date', { ascending: false });

      if (sbError) throw sbError;

      const expensesList: Expense[] = (data ?? []).map((row: any) => ({
        id: row.id,
        date: new Date(row.date),
        amount: Number(row.amount),
        items: row.items ?? [],
        description: row.description ?? '',
      }));

      setExpenses(expensesList);
    } catch (err) {
      setError('Failed to fetch expenses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const addExpense = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      setLoading(true);
      const { data, error: sbError } = await supabase
        .from(TABLES.EXPENSES)
        .insert({
          date: expenseData.date.toISOString(),
          amount: expenseData.amount,
          items: expenseData.items,
          description: expenseData.description ?? null,
        })
        .select()
        .single();

      if (sbError) throw sbError;

      const newExpense: Expense = {
        id: data.id,
        date: new Date(data.date),
        amount: Number(data.amount),
        items: data.items ?? [],
        description: data.description ?? '',
      };

      setExpenses(prev => [newExpense, ...prev]);
      return data.id as string;
    } catch (err) {
      setError('Failed to add expense');
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getMonthlyExpenses = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return (
        expenseDate.getMonth() === currentMonth &&
        expenseDate.getFullYear() === currentYear
      );
    });
  };

  return {
    expenses,
    addExpense,
    getTotalExpenses,
    getMonthlyExpenses,
    loading,
    error,
    refresh: fetchExpenses,
  };
};