'use client'

import { useState, useEffect } from "react"

export default function VariableExpenses() {
  const [variableExpenses, setVariableExpenses] = useState([])
  const [form, setForm] = useState({
    description: '',
    date: '',
    amount: ''
  })

  const fetchVariableExpenses = async () => {
    const response = await fetch('/api/variable-expenses')
    const data = await response.json()
    setVariableExpenses(data)
  }

  useEffect(() => {
    fetchVariableExpenses()
  }, [])

  const handleSubmit = async () => {
    await fetch('/api/variable-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        amount: parseFloat(form.amount)
      })
    })
    setForm({ description: '', date: '', amount: '' })
    fetchVariableExpenses()
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Variable Expenses</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">New Variable Expense</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input type="text" placeholder="Description" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="border p-2 rounded" />
          <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} className="border p-2 rounded" />
          <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded">Save</button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Variable Expenses List</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Description</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Amount</th>
            </tr>
          </thead>
          <tbody>
            {variableExpenses.map((expense) => (
              <tr key={expense.id}>
                <td className="border p-2">{expense.description}</td>
                <td className="border p-2">{new Date(expense.date).toLocaleDateString()}</td>
                <td className="border p-2">${expense.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}