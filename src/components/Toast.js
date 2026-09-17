'use client'

import { useEffect } from "react"

import { XMarkIcon } from "@/components/icons"

export default function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.()
    }, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const colors = {
    success: 'bg-emerald-600',
    error: 'bg-rose-600',
    info: 'bg-blue-600',
  }

  return (
    <div
      role="alert"
      className={`fixed bottom-5 right-5 ${colors[type] || colors.info} text-white px-5 py-3 rounded-lg shadow-xl z-50 animate-fade-in flex items-center gap-3 text-sm font-medium`}
    >
      <span>{message}</span>
      <button
        onClick={onClose}
        className="opacity-75 hover:opacity-100 p-0.5 rounded transition-opacity"
        aria-label="Close"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}
