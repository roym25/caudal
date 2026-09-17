'use client'

import { useState, useEffect } from "react"
import { formatMoney, formatDate } from "@/lib/format"
import Toast from "@/components/Toast"
import EmptyState from "@/components/EmptyState"
import LoadingTable from "@/components/LoadingTable"

export default function VariableExpenses() {
  const [variableExpenses, setVariableExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    description: '', date: '', amount: ''
  })
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({
    description: '', date: '', amount: ''
  })

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
  }

  const fetchVariableExpenses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/variable-expenses')
      const data = await response.json()
      if (Array.isArray(data)) {
        setVariableExpenses(data)
      }
    } catch (err) {
      console.error("Error fetching variable expenses:", err)
      showToast('Error loading variable expenses', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVariableExpenses()
  }, [])

  const handleSubmit = async () => {
    if (!form.description || !form.date || !form.amount) {
      showToast('Please fill in all fields', 'error')
      return
    }

    try {
      const res = await fetch('/api/variable-expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to save variable expense', 'error')
        return
      }

      setForm({ description: '', date: '', amount: '' })
      setShowForm(false)
      showToast('Variable expense added successfully')
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error creating variable expense:", err)
      showToast('Network error while saving', 'error')
    }
  }

  const handleEdit = (expense) => {
    setEditingId(expense.id)
    setEditForm({
      description: expense.description,
      date: new Date(expense.date).toISOString().split('T')[0],
      amount: expense.amount,
    })
  }

  const handleUpdate = async (id) => {
    try {
      const res = await fetch(`/api/variable-expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          amount: parseFloat(editForm.amount),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        showToast(err.errors?.join(', ') || 'Failed to update variable expense', 'error')
        return
      }

      setEditingId(null)
      showToast('Variable expense updated successfully')
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error updating variable expense:", err)
      showToast('Network error while updating', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this expense?')) return
    try {
      const res = await fetch(`/api/variable-expenses/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        showToast('Failed to delete variable expense', 'error')
        return
      }
      showToast('Variable expense deleted successfully')
      fetchVariableExpenses()
    } catch (err) {
      console.error("Error deleting variable expense:", err)
      showToast('Network error while deleting', 'error')
    }
  }

  return (
    <main className="p-6 max-w-6xl mx-auto w-full text-gray-900">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Variable Expenses</h1>
        <button
          onClick={() => setShowForm(prev => !prev)}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-1.5 shadow-sm ${
            showForm
              ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {showForm ? "? Cerrar formulario" : "+ Nuevo Gasto Variable"}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 p-5 border border-gray-200 rounded-lg bg-gray-50/70 animate-fade-in">
          <h2 className="text-base font-semibold mb-3 text-gray-800">Registrar Nuevo Gasto Variable</h2>
          <div className="flex flex-col gap-3 max-w-md">
            <input 
              type="text" 
              placeholder="Description" 
              value={form.description} 
              onChange={(e) => setForm({...form, description: e.target.value})} 
              className="border border-gray-300 p-2 rounded bg-white text-gray-900" 
            />
            <input 
              type="date" 
              value={form.date} 
              onChange={(e) => setForm({...form, date: e.target.value})} 
              className="border border-gray-300 p-2 rounded bg-white text-gray-900" 
            />
            <input 
              type="number" 
              step="0.01" 
              placeholder="Amount" 
              value={form.amount} 
              onChange={(e) => setForm({...form, amount: e.target.value})} 
              className="border border-gray-300 p-2 rounded bg-white text-gray-900" 
            />
            <div className="flex gap-2 pt-1">
              <button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded font-medium transition-colors">
                Guardar
              </button>
              <button onClick={() => setShowForm(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-900">Variable Expenses List</h2>

        {loading ? (
          <LoadingTable columns={4} rows={3} />
        ) : variableExpenses.length === 0 ? (
          <EmptyState 
            message="No hay gastos variables registrados" 
            action="Haz clic en '+ Nuevo Gasto Variable' para registrar salidas, compras o pagos diarios." 
          />
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-100 text-gray-900">
                  <th className="border border-gray-200 p-2 text-left">Description</th>
                  <th className="border border-gray-200 p-2 text-left">Date</th>
                  <th className="border border-gray-200 p-2 text-left">Amount</th>
                  <th className="border border-gray-200 p-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variableExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 text-gray-900">
                    <td className="border border-gray-200 p-2">
                      {editingId === expense.id
                        ? <input type="text" value={editForm.description} onChange={(e) => setEditForm({...editForm, description: e.target.value})} className="border border-gray-300 p-1 rounded w-full bg-white text-gray-900" />
                        : <span className="font-medium text-gray-900">{expense.description}</span>
                      }
                    </td>
                    <td className="border border-gray-200 p-2 text-gray-800">
                      {editingId === expense.id
                        ? <input type="date" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="border border-gray-300 p-1 rounded bg-white text-gray-900" />
                        : formatDate(expense.date)
                      }
                    </td>
                    <td className="border border-gray-200 p-2 font-medium text-gray-900">
                      {editingId === expense.id
                        ? <input type="number" value={editForm.amount} onChange={(e) => setEditForm({...editForm, amount: e.target.value})} className="border border-gray-300 p-1 rounded w-24 bg-white text-gray-900" />
                        : formatMoney(expense.amount)
                      }
                    </td>
                    <td className="border border-gray-200 p-2">
                      {editingId === expense.id ? (
                        <div className="flex gap-1">
                          <button onClick={() => handleUpdate(expense.id)} className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-medium">Save</button>
                          <button onClick={() => setEditingId(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs font-medium">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button onClick={() => handleEdit(expense)} className="bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded text-xs font-medium">Edit</button>
                          <button onClick={() => handleDelete(expense.id)} className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs font-medium">Delete</button>
                        </div>
                      )}
                    </td>
                  </tr>
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
