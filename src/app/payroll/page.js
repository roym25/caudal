'use client'

import { useState, useEffect } from "react"

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([])
  const [form, setForm] = useState({
    date: '', week: '', amountReceived: '', isr: '', notes: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    date: '', week: '', amountReceived: '', isr: '', notes: ''
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

  const handleEdit = (payroll) => {
    setEditingId(payroll.id)
    setEditForm({
      date: new Date(payroll.date).toISOString().split('T')[0],
      week: payroll.week,
      amountReceived: payroll.amountReceived,
      isr: payroll.isr,
      notes: payroll.notes || ''
    })
  }

  const handleUpdate = async (id) => {
    await fetch(`/api/payroll/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...editForm,
        week: parseInt(editForm.week),
        amountReceived: parseFloat(editForm.amountReceived),
        isr: parseFloat(editForm.isr)
      })
    })
    setEditingId(null)
    fetchPayrolls()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll?')) return
    await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
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
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => (
              <tr key={payroll.id}>
                <td className="border p-2">
                  {editingId === payroll.id
                    ? <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="border p-1 rounded" />
                    : new Date(payroll.date).toLocaleDateString()
                  }
                </td>
                <td className="border p-2">
                  {editingId === payroll.id
                    ? <input type="number" value={editForm.week} onChange={(e) => setEditForm({...editForm, week: e.target.value})} className="border p-1 rounded w-16" />
                    : payroll.week
                  }
                </td>
                <td className="border p-2">
                  {editingId === payroll.id
                    ? <input type="number" value={editForm.amountReceived} onChange={(e) => setEditForm({...editForm, amountReceived: e.target.value})} className="border p-1 rounded w-24" />
                    : `$${payroll.amountReceived}`
                  }
                </td>
                <td className="border p-2">
                  {editingId === payroll.id
                    ? <input type="number" value={editForm.isr} onChange={(e) => setEditForm({...editForm, isr: e.target.value})} className="border p-1 rounded w-24" />
                    : `$${payroll.isr}`
                  }
                </td>
                <td className="border p-2">
                  {editingId === payroll.id
                    ? <input type="text" value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} className="border p-1 rounded" />
                    : payroll.notes
                  }
                </td>
                <td className="border p-2">
                  {editingId === payroll.id ? (
                    <div className="flex gap-1">
                      <button onClick={() => handleUpdate(payroll.id)} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Save</button>
                      <button onClick={() => setEditingId(null)} className="bg-gray-400 text-white px-2 py-1 rounded text-xs">Cancel</button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => handleEdit(payroll)} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Edit</button>
                      <button onClick={() => handleDelete(payroll.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Delete</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}