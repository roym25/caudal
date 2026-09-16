'use client'

import { useState, useEffect } from "react"
import { formatMoney } from "@/lib/format"

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  const [summary, setSummary] = useState({
    totalPayroll: 0,
    totalFixedExpenses: 0,
    totalVariableExpenses: 0,
    totalExpenses: 0,
    remaining: 0,
    loading: true,
  })

  useEffect(() => {
    let isCancelled = false

    const fetchSummary = async () => {
      setSummary(prev => ({ ...prev, loading: true }))

      try {
        const [payrollRes, fixedRes, variableRes] = await Promise.all([
          fetch(`/api/payroll?month=${selectedMonth}`),
          fetch('/api/fixed-expenses'),
          fetch(`/api/variable-expenses?month=${selectedMonth}`),
        ])

        const payrolls = await payrollRes.json()
        const fixedExpenses = await fixedRes.json()
        const variableExpenses = await variableRes.json()

        if (isCancelled) return

        const totalPayroll = Array.isArray(payrolls)
          ? payrolls.reduce((acc, p) => acc + (p.amountReceived || 0), 0)
          : 0

        const [year, month] = selectedMonth.split('-').map(Number)
        const totalFixed = Array.isArray(fixedExpenses)
          ? fixedExpenses.reduce((acc, e) => {
              const payment = e.payments?.find(p => {
                const d = new Date(p.date)
                return d.getUTCFullYear() === year && (d.getUTCMonth() + 1) === month
              })
              return acc + (payment?.paid ? (e.cost || 0) : 0)
            }, 0)
          : 0

        const totalVariable = Array.isArray(variableExpenses)
          ? variableExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
          : 0

        const totalExpenses = totalFixed + totalVariable

        setSummary({
          totalPayroll,
          totalFixedExpenses: totalFixed,
          totalVariableExpenses: totalVariable,
          totalExpenses,
          remaining: totalPayroll - totalExpenses,
          loading: false,
        })
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        if (!isCancelled) {
          setSummary(prev => ({ ...prev, loading: false }))
        }
      }
    }

    fetchSummary()

    return () => {
      isCancelled = true
    }
  }, [selectedMonth])

  const monthLabel = new Date(`${selectedMonth}-15T12:00:00Z`).toLocaleString("es-MX", {
    month: "long",
    year: "numeric",
  })

  return (
    <main className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-gray-500 capitalize">{monthLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm font-medium text-gray-600">
            Mes:
          </label>
          <input
            id="month-select"
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border p-2 rounded bg-white"
          />
        </div>
      </div>

      {summary.loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-100 p-6 rounded-lg animate-pulse h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-100 p-6 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Nómina</p>
            <p className="text-3xl font-bold text-green-700">
              {formatMoney(summary.totalPayroll)}
            </p>
            <p className="text-xs text-green-800 mt-2">Ingresos netos del mes</p>
          </div>

          <div className="bg-red-100 p-6 rounded-lg border border-red-200">
            <p className="text-sm text-gray-600 mb-2 font-medium">Total Gastos</p>
            <p className="text-3xl font-bold text-red-700">
              {formatMoney(summary.totalExpenses)}
            </p>
            <div className="text-xs text-gray-600 mt-2 flex justify-between">
              <span>Fijos pagados: {formatMoney(summary.totalFixedExpenses)}</span>
              <span>Variables: {formatMoney(summary.totalVariableExpenses)}</span>
            </div>
          </div>

          <div
            className={`p-6 rounded-lg border ${
              summary.remaining >= 0
                ? "bg-blue-100 border-blue-200"
                : "bg-orange-100 border-orange-200"
            }`}
          >
            <p className="text-sm text-gray-600 mb-2 font-medium">Restante</p>
            <p
              className={`text-3xl font-bold ${
                summary.remaining >= 0 ? "text-blue-700" : "text-orange-700"
              }`}
            >
              {formatMoney(summary.remaining)}
            </p>
            <p className="text-xs text-gray-600 mt-2">
              {summary.remaining >= 0 ? "Balance a favor" : "Déficit en el periodo"}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}