"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAgenda, getCompanies, getEmployees } from "./api";
import type {
  AgendaTask,
  CompanyItem,
  EmployeeItem,
  TaskFilter,
} from "./types";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfToday() {
  const date = new Date();
  date.setHours(23, 59, 59, 999);
  return date;
}

export function isOverdue(task: AgendaTask) {
  return (
    task.status === 0 &&
    Boolean(task.due_at) &&
    new Date(task.due_at as string).getTime() < Date.now()
  );
}

export function isToday(value: string | null) {
  if (!value) return false;
  const date = new Date(value);
  return date >= startOfToday() && date <= endOfToday();
}

export function isUpcoming(task: AgendaTask) {
  if (task.status === 1 || !task.due_at) return false;

  const from = endOfToday();
  const to = new Date(from);
  to.setDate(to.getDate() + 7);

  const due = new Date(task.due_at);
  return due > from && due <= to;
}

export function useAgendaData() {
  const [tasks, setTasks] = useState<AgendaTask[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getAgenda();
      setTasks(Array.isArray(result.records) ? result.records : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { tasks, loading, refresh };
}

export function useCompanyData() {
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);

    try {
      const result = await getCompanies();
      const normalized = (result.data ?? [])
        .filter((item) => item.is_active !== false)
        .map((item) => ({
          ...item,
          id: String(item.id || "").trim(),
          name: String(item.name || "").trim(),
          localId: item.localId ?? item.local_firm_id ?? null,
        }))
        .filter((item) => item.id && item.name);

      setCompanies(normalized);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { companies, loading, refresh };
}

export function useEmployeeData(webFirmId: string) {
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!webFirmId) {
      setEmployees([]);
      return;
    }

    setLoading(true);

    try {
      const result = await getEmployees(webFirmId);
      const normalized = (result.data ?? [])
        .filter((item) => item.active !== false)
        .map((item) => ({
          ...item,
          id: String(item.id || "").trim(),
          full_name: String(item.full_name || "").trim(),
        }))
        .filter((item) => item.id && item.full_name);

      setEmployees(normalized);
    } finally {
      setLoading(false);
    }
  }, [webFirmId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { employees, loading, refresh };
}

export function useAgendaStats(tasks: AgendaTask[]) {
  return useMemo(() => {
    const active = tasks.filter(
      (task) => !task.is_deleted && !task.is_archived
    );

    return {
      total: active.length,
      open: active.filter((task) => task.status === 0).length,
      done: active.filter((task) => task.status === 1).length,
      today: active.filter((task) => isToday(task.due_at)).length,
      upcoming: active.filter(isUpcoming).length,
      overdue: active.filter(isOverdue).length,
    };
  }, [tasks]);
}

export function useFilteredAgenda(
  tasks: AgendaTask[],
  filter: TaskFilter,
  typeFilter: string,
  search: string,
  webFirmId: string
) {
  return useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return tasks
      .filter((task) => !task.is_deleted && !task.is_archived)
      .filter(
        (task) =>
          !webFirmId ||
          !task.web_firm_id ||
          task.web_firm_id === webFirmId
      )
      .filter((task) => {
        if (filter === "OPEN") return task.status === 0;
        if (filter === "DONE") return task.status === 1;
        if (filter === "TODAY") return isToday(task.due_at);
        if (filter === "UPCOMING") return isUpcoming(task);
        if (filter === "OVERDUE") return isOverdue(task);
        return true;
      })
      .filter(
        (task) => typeFilter === "ALL" || task.type === typeFilter
      )
      .filter((task) => {
        if (!query) return true;

        const searchable = [
          task.title,
          task.note,
          task.location,
          task.assigned_to,
          task.assigned_by,
          task.participants_csv,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR");

        return searchable.includes(query);
      })
      .sort((a, b) => {
        const overdueDiff =
          Number(isOverdue(b)) - Number(isOverdue(a));

        if (overdueDiff !== 0) return overdueDiff;
        if (a.status !== b.status) return a.status - b.status;

        const aDue = a.due_at
          ? new Date(a.due_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bDue = b.due_at
          ? new Date(b.due_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aDue - bDue;
      });
  }, [tasks, filter, typeFilter, search, webFirmId]);
}
