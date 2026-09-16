'use client'

import { useState, useEffect, Fragment, useRef } from "react"
import { formatMoney, formatDate } from "@/lib/format"
import Toast from "@/components/Toast"
import EmptyState from "@/components/EmptyState"
import LoadingTable from "@/components/LoadingTable"

export default function Payroll() {
  const [payrolls, setPayrolls] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [form, setForm] = useState({
    date: '', week: '', amountReceived: '', isr: '', savingsFund: '', notes: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    date: '', week: '', amountReceived: '', isr: '', savingsFund: '', notes: ''
  })

  const weekRef = useRef(null)
  const amountRef = useRef(null)
  const isrRef = useRef(null)
  const savingsRef = useRef(null)
  const notesRef = useRef(null)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchPayrolls = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/payroll')
      const data = await response.json()
      if (Array.isArray(data)) {
        setPayrolls(data)
      }
    } catch (err) {
      console.error("Error fetching payrolls:", err)
      showToast('Error loading payrolls', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPayrolls()
  }, [])

  const handleSubmit = async () => {
    if (!form.date || !form.week || !form.amountReceived || !form.isr) {
      showToast('Please fill in all required fields', 'error')
      return
    }

    try {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          week: parseInt(form.week, 10),
          amountReceived: parseFloat(form.amountReceived),
          isr: parseFloat(form.isr),
          savingsFund: parseFloat(form.savingsFund || 0)
        })
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to save payroll', 'error')
        return
      }

      setForm({ date: '', week: '', amountReceived: '', isr: '', savingsFund: '', notes: '' })
      showToast('Payroll record added successfully')
      fetchPayrolls()
    } catch (err) {
      console.error("Error creating payroll:", err)
      showToast('Network error while saving', 'error')
    }
  }

  const handleEdit = (payroll) => {
    setEditingId(payroll.id)
    setEditForm({
      date: new Date(payroll.date).toISOString().split('T')[0],
      week: payroll.week,
      amountReceived: payroll.amountReceived,
      isr: payroll.isr,
      savingsFund: payroll.savingsFund,
      notes: payroll.notes || ''
    })
  }

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/payroll/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          week: parseInt(editForm.week, 10),
          amountReceived: parseFloat(editForm.amountReceived),
          isr: parseFloat(editForm.isr),
          savingsFund: parseFloat(editForm.savingsFund || 0)
        })
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to update payroll', 'error')
        return
      }

      setEditingId(null)
      showToast('Payroll updated successfully')
      fetchPayrolls()
    } catch (err) {
      console.error("Error updating payroll:", err)
      showToast('Network error while updating', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this payroll?')) return
    try {
      const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Failed to delete payroll', 'error')
        return
      }
      showToast('Payroll deleted successfully')
      fetchPayrolls()
    } catch (err) {
      console.error("Error deleting payroll:", err)
      showToast('Network error while deleting', 'error')
    }
  }

  const groupPayrollsByMonth = (payrollsList) => {
    const grouped = {}

    payrollsList.forEach(payroll => {
      const date = new Date(payroll.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthName = date.toLocaleString('en-US', { month: 'long', year: 'numeric' })

      if (!grouped[monthKey]) {
        grouped[monthKey] = { monthName, payrolls: [] }
      }
      grouped[monthKey].payrolls.push(payroll)
    })

    return grouped
  }

  const sortedGroupedPayrolls = (payrollsList) => {
    const grouped = groupPayrollsByMonth(payrollsList)
    const sorted = {}

    Object.keys(grouped).sort().reverse().forEach(monthKey => {
      sorted[monthKey] = grouped[monthKey]
      sorted[monthKey].payrolls.sort((a, b) => a.week - b.week)
    })

    return sorted
  }

  return (
    <main className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="text-2xl font-bold mb-6">Payroll</h1>

      <div className="mb-8 bg-gray-50 p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-4">New Payroll</h2>
        <div className="flex flex-col gap-3 max-w-md">
          <input 
            type="date" 
            value={form.date} 
            onChange={(e) => setForm({...form, date: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && weekRef.current?.focus()}
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="number" 
            ref={weekRef}
            placeholder="Week (1-5)" 
            value={form.week} 
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 1) {
                setForm({...form, week: val});
              }
            }}
            onKeyDown={(e) => e.key === 'Enter' && amountRef.current?.focus()}
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="number" 
            ref={amountRef}
            placeholder="Amount Received" 
            value={form.amountReceived} 
            onChange={(e) => setForm({...form, amountReceived: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && isrRef.current?.focus()}
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="number" 
            ref={isrRef}
            placeholder="ISR" 
            value={form.isr} 
            onChange={(e) => setForm({...form, isr: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && savingsRef.current?.focus()}
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="number" 
            ref={savingsRef}
            placeholder="Savings Fund" 
            value={form.savingsFund} 
            onChange={(e) => setForm({...form, savingsFund: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && notesRef.current?.focus()}
            className="border p-2 rounded bg-white" 
          />
          <input 
            type="text" 
            ref={notesRef}
            placeholder="Notes" 
            value={form.notes} 
            onChange={(e) => setForm({...form, notes: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="border p-2 rounded bg-white" 
          />
          <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded font-medium">
            Save
          </button>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Payroll History</h2>

        {loading ? (
          <LoadingTable columns={7} rows={4} />
        ) : payrolls.length === 0 ? (
          <EmptyState 
            message="No payroll records registered" 
            action="Fill in the form above to add your first payroll payment." 
          />
        ) : (
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Week</th>
                  <th className="border p-2 text-left">Amount</th>
                  <th className="border p-2 text-left">ISR</th>
                  <th className="border p-2 text-left">Savings Fund</th>
                  <th className="border p-2 text-left">Notes</th>
                  <th className="border p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(sortedGroupedPayrolls(payrolls)).map(([monthKey, group]) => (
                  <Fragment key={monthKey}>
                    <tr className="bg-blue-50">
                      <td colSpan="7" className="border p-2 font-bold text-blue-800">
                        {group.monthName}
                      </td>
                    </tr>
                    {group.payrolls.map((payroll) => (
                      <tr key={payroll.id} className="hover:bg-gray-50">
                        <td className="border p-2">
                          {editingId === payroll.id
                            ? <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="border p-1 rounded" />
                            : formatDate(payroll.date)
                          }
                        </td>
                        <td className="border p-2">
                          {editingId === payroll.id
                            ? <input type="number" value={editForm.week} onChange={(e) => setEditForm({...editForm, week: e.target.value})} className="border p-1 rounded w-16" />
                            : payroll.week
                          }
                        </td>
                        <td className="border p-2 font-medium">
                          {editingId === payroll.id
                            ? <input type="number" value={editForm.amountReceived} onChange={(e) => setEditForm({...editForm, amountReceived: e.target.value})} className="border p-1 rounded w-24" />
                            : formatMoney(payroll.amountReceived)
                          }
                        </td>
                        <td className="border p-2 text-red-600">
                          {editingId === payroll.id
                            ? <input type="number" value={editForm.isr} onChange={(e) => setEditForm({...editForm, isr: e.target.value})} className="border p-1 rounded w-24" />
                            : formatMoney(payroll.isr)
                          }
                        </td>
                        <td className="border p-2 text-green-700">
                          {editingId === payroll.id
                            ? <input type="number" value={editForm.savingsFund} onChange={(e) => setEditForm({...editForm, savingsFund: e.target.value})} className="border p-1 rounded w-24" />
                            : formatMoney(payroll.savingsFund)
                          }
                        </td>
                        <td className="border p-2 text-gray-600">
                          {editingId === payroll.id
                            ? <input type="text" value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} className="border p-1 rounded w-full" />
                            : (payroll.notes || '?')
                          }
                        </td>
                        <td className="border p-2">
                          {editingId === payroll.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => handleUpdate(payroll.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">Save</button>
                              <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={() => handleEdit(payroll)} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">Edit</button>
                              <button onClick={() => handleDelete(payroll.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">Delete</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </main>
  )
}
