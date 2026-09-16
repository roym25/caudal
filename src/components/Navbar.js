'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/payroll', label: 'Payroll' },
  { href: '/fixed-expenses', label: 'Fixed Expenses' },
  { href: '/variable-expenses', label: 'Variable Expenses' },
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="bg-blue-600 px-6 py-4 flex gap-6 overflow-x-auto shadow-sm">
      {links.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-white transition-opacity whitespace-nowrap text-sm sm:text-base ${
              isActive
                ? "font-bold underline underline-offset-4 opacity-100"
                : "opacity-80 hover:opacity-100"
            }`}
          >
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
