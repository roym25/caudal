'use client'

import { useState, useEffect } from "react"

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([])
  const [form, setForm] = useState({
    date: '',
    week: '',
    amountReceived: '',
    isr: '',
    notes: ''
  })

  const fetchPayrolls = async () => {
    const response = await fetch('/api/payroll')
    const data = await response.json()
    setPayrolls(data)
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  const handleSubmit = async () => {
    await fetch('/api/payroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        week: parseInt(form.week),
        amountReceived: parseFloat(form.amountReceived),
        isr: parseFloat(form.isr)
      })
    })
    setForm({ date: '', week: '', amountReceived: '', isr: '', notes: '' })
    fetchPayrolls()
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payroll</h1>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">New Payroll</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input type="date" value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Week" value={form.week} onChange={(e) => setForm({...form, week: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="Amount Received" value={form.amountReceived} onChange={(e) => setForm({...form, amountReceived: e.target.value})} className="border p-2 rounded" />
          <input type="number" placeholder="ISR" value={form.isr} onChange={(e) => setForm({...form, isr: e.target.value})} className="border p-2 rounded" />
          <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="border p-2 rounded" />
          <button onClick={handleSubmit} className="bg-blue-600 text-white p-2 rounded">Save</button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Payroll History</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Week</th>
              <th className="border p-2 text-left">Amount</th>
              <th className="border p-2 text-left">ISR</th>
              <th className="border p-2 text-left">Notes</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => (
              <tr key={payroll.id}>
                <td className="border p-2">{new Date(payroll.date).toLocaleDateString()}</td>
                <td className="border p-2">{payroll.week}</td>
                <td className="border p-2">${payroll.amountReceived}</td>
                <td className="border p-2">${payroll.isr}</td>
                <td className="border p-2">{payroll.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}