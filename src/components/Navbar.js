import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-blue-600 px-6 py-4 flex gap-6">
      <Link href="/" className="text-white font-bold">Dashboard</Link>
      <Link href="/payroll" className="text-white">Payroll</Link>
      <Link href="/fixed-expenses" className="text-white">Fixed Expenses</Link>
      <Link href="/variable-expenses" className="text-white">Variable Expenses</Link>
    </nav>
  )
}