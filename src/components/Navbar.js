import Link from "next/link"

export default function Navbar() {
  return (
    <nav className="bg-red-900 px-6 py-4 flex gap-6">
      <Link href="/">Dashboard </Link>
      <Link href="/nominas">Nominas </Link>
      <Link href="/gastos-fijos">Gastos Fijos </Link>
      <Link href="/gastos-variables">Gastos Variables </Link>
    </nav>
  )
}