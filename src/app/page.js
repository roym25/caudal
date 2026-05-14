'use client'

import { useState, useEffect } from "react"

export default function Home() {
  const [summary, setSummary] = useState({
    totalPayroll: 0,
    totalExpenses: 0,
    remaining: 0
  })

  useEffect(() => {
    const fetchSummary = async () => {
      const [payrollRes, fixedRes, variableRes] = await Promise.all([
        fetch('/api/payroll'),
        fetch('/api/fixed-expenses'),
        fetch('/api/variable-expenses')
      ])

      const payrolls = await payrollRes.json()
      const fixedExpenses = await fixedRes.json()
      const variableExpenses = await variableRes.json()

      const totalPayroll = payrolls.reduce((acc, p) => acc + p.amountReceived, 0)
      const totalFixed = fixedExpenses.reduce((acc, e) => acc + e.cost, 0)
      const totalVariable = variableExpenses.reduce((acc, e) => acc + e.amount, 0)
      const totalExpenses = totalFixed + totalVariable

      setSummary({
        totalPayroll,
        totalExpenses,
        remaining: totalPayroll - totalExpenses
      })
    }

    fetchSummary()
  }, [])

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-green-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Total Payroll</p>
          <p className="text-3xl font-bold text-green-700">${summary.totalPayroll}</p>
        </div>
        <div className="bg-red-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Total Expenses</p>
          <p className="text-3xl font-bold text-red-700">${summary.totalExpenses}</p>
        </div>
        <div className="bg-blue-100 p-6 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Remaining</p>
          <p className="text-3xl font-bold text-blue-700">${summary.remaining}</p>
        </div>
      </div>
    </main>
  )
}