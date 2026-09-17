'use client'

import { useState, useEffect } from "react"
import { formatMoney } from "@/lib/format"

export default function Home() {
  const [selectedMonth, setSelectedMonth] = useState("all")
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    totalExpenses: 0,
    totalFixed: 0,
    totalVariable: 0,
    remaining: 0,
  })

  useEffect(() => {
    let isCancelled = false

    const fetchSummary = async () => {
      try {
        const isAll = selectedMonth === "all"
        const payrollUrl = isAll ? "/api/payroll" : `/api/payroll?month=${selectedMonth}`
        const variableUrl = isAll ? "/api/variable-expenses" : `/api/variable-expenses?month=${selectedMonth}`

        const [payrollRes, fixedRes, variableRes] = await Promise.all([
          fetch(payrollUrl),
          fetch("/api/fixed-expenses"),
          fetch(variableUrl),
        ])

        const payrolls = await payrollRes.json()
        const fixedExpenses = await fixedRes.json()
        const variableExpenses = await variableRes.json()

        if (isCancelled) return

        const totalPayroll = Array.isArray(payrolls)
          ? payrolls.reduce((acc, p) => acc + (p.amountReceived || 0), 0)
          : 0

        let totalFixed = 0
        if (Array.isArray(fixedExpenses)) {
          if (isAll) {
            totalFixed = fixedExpenses.reduce((acc, e) => acc + (e.cost || 0), 0)
          } else {
            const [year, month] = selectedMonth.split("-").map(Number)
            totalFixed = fixedExpenses.reduce((acc, e) => {
              const payment = e.payments?.find(p => {
                const d = new Date(p.date)
                return d.getUTCFullYear() === year && (d.getUTCMonth() + 1) === month
              })
              return acc + (payment?.paid ? (e.cost || 0) : 0)
            }, 0)
          }
        }

        const totalVariable = Array.isArray(variableExpenses)
          ? variableExpenses.reduce((acc, e) => acc + (e.amount || 0), 0)
          : 0

        const totalExpenses = totalFixed + totalVariable

        setSummary({
          totalPayroll,
          totalExpenses,
          totalFixed,
          totalVariable,
          remaining: totalPayroll - totalExpenses,
        })
      } catch (err) {
        console.error("Error loading dashboard data:", err)
      }
    }

    fetchSummary()

    return () => {
      isCancelled = true
    }
  }, [selectedMonth])

  const isAll = selectedMonth === "all"
  const periodLabel = isAll
    ? "General (Hist?rico total)"
    : new Date(`${selectedMonth}-15T12:00:00Z`).toLocaleString("es-MX", {
        month: "long",
        year: "numeric",
      })

  return (
    <main className="p-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 capitalize">{periodLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedMonth("all")}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isAll
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
            }`}
          >
            Ver Todo (General)
          </button>
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-gray-500">Filtrar mes:</span>
            <input
              type="month"
              value={isAll ? "" : selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value || "all")}
              className="border border-gray-300 p-1.5 rounded text-sm bg-white text-gray-900"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-green-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Total Payroll</p>
          <p className="text-3xl font-bold text-green-700">
            {formatMoney(summary.totalPayroll)}
          </p>
        </div>
        <div className="bg-red-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-red-700">
            {formatMoney(summary.totalExpenses)}
          </p>
          {!isAll && (
            <p className="text-xs text-gray-500 mt-2">
              Fijos: {formatMoney(summary.totalFixed)} ? Variables: {formatMoney(summary.totalVariable)}
            </p>
          )}
        </div>
        <div className="bg-blue-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Remaining</p>
          <p className="text-3xl font-bold text-blue-700">
            {formatMoney(summary.remaining)}
          </p>
        </div>
      </div>
    </main>
  )
}
