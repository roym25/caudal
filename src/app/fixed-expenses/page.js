'use client'

import { useState, useEffect } from "react"

export default function FixedExpenses() {
  const [fixedExpenses, setFixedExpenses] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [form, setForm] = useState({
    name: '',
    cost: '',
    dueDay: ''
  })

  const fetchFixedExpenses = async () => {
    const response = await fetch('/api/fixed-expenses')
    const data = await response.json()
    setFixedExpenses(data)
  }

  useEffect(() => {
    fetchFixedExpenses()
  }, [])

  const handleSubmit = async () => {
    await fetch('/api/fixed-expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        cost: parseFloat(form.cost),
        dueDay: parseInt(form.dueDay)
      })
    })
    setForm({ name: '', cost: '', dueDay: '' })
    fetchFixedExpenses()
  }

  const togglePayment = async (expenseId, paid) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
    await fetch('/api/fixed-payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fixedExpenseId: expenseId,
        date: date.toISOString(),
        paid: !paid
      })
    })
    fetchFixedExpenses()
  }

  const getCurrentMonthPayment = (payments) => {
    return payments.find(p => {
      const paymentDate = new Date(p.date)
      return paymentDate.getMonth() === currentDate.getMonth() &&
             paymentDate.getFullYear() === currentDate.getFullYear()
    })
  }

  const monthName = currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Fixed Expenses</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">New Fixed Expense</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input type="text" placeholder="Name" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Cost" value={form.cost} onChange={(e) => setForm({...form, cost: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Due Day (1-31)" value={form.dueDay} onChange={(e) => setForm({...form, dueDay: e.target.value})} className="border p-2 rounded" />
          <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded">Save</button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Status for {monthName}</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Cost</th>
              <th className="border p-2 text-left">Due Day</th>
              <th className="border p-2 text-left">Paid</th>
            </tr>
          </thead>
          <tbody>
            {fixedExpenses.map((expense) => {
              const currentPayment = getCurrentMonthPayment(expense.payments)
              const isPaid = currentPayment?.paid ?? false
              return (
                <tr key={expense.id}>
                  <td className="border p-2">{expense.name}</td>
                  <td className="border p-2">${expense.cost}</td>
                  <td className="border p-2">{expense.dueDay}</td>
                  <td className="border p-2">
                    <button
                      onClick={() => togglePayment(expense.id, isPaid)}
                      className={`px-3 py-1 rounded text-white ${isPaid ? 'bg-green-500' : 'bg-gray-400'}`}
                    >
                      {isPaid ? 'Paid' : 'Unpaid'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}