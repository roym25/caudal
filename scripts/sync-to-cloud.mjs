import 'dotenv/config'
import { Pool } from 'pg'

/**
 * Copies all Caudal records from your local PostgreSQL (DATABASE_URL)
 * into your Cloud PostgreSQL (CLOUD_DATABASE_URL).
 *
 * Usage:
 *   CLOUD_DATABASE_URL="postgresql://..." npm run db:sync-cloud
 */

const localUrl = process.env.DATABASE_URL
const cloudUrl = process.env.CLOUD_DATABASE_URL

if (!localUrl) {
  console.error('❌ Missing DATABASE_URL (your local PostgreSQL connection string).')
  process.exit(1)
}

if (!cloudUrl) {
  console.error('❌ Missing CLOUD_DATABASE_URL (your Neon/Supabase PostgreSQL connection string).')
  console.error('   Add CLOUD_DATABASE_URL="postgresql://..." to .env or pass it in the environment.')
  process.exit(1)
}

const TABLES = [
  {
    name: 'Payroll',
    columns: ['id', 'date', 'week', 'amountReceived', 'isr', 'savingsFund', 'employerMatch', 'savingsPaidAt', 'notes', 'createdAt'],
  },
  {
    name: 'FixedExpense',
    columns: ['id', 'name', 'cost', 'dueDay', 'createdAt'],
  },
  {
    name: 'FixedPayment',
    columns: ['id', 'fixedExpenseId', 'date', 'paid', 'amount', 'createdAt'],
  },
  {
    name: 'VariableExpense',
    columns: ['id', 'description', 'date', 'amount', 'comments', 'createdAt'],
  },
  {
    name: 'InvestmentAccount',
    columns: ['id', 'name', 'rate', 'maxAmount', 'color', 'createdAt'],
  },
  {
    name: 'InvestmentPocket',
    columns: ['id', 'accountId', 'name', 'amount', 'createdAt'],
  },
  {
    name: 'InvestmentMovement',
    columns: ['id', 'accountId', 'pocketId', 'pocketName', 'type', 'amount', 'note', 'date', 'createdAt'],
  },
]

async function syncToCloud() {
  const localPool = new Pool({ connectionString: localUrl })
  const cloudPool = new Pool({ connectionString: cloudUrl })

  const cloudClient = await cloudPool.connect()
  try {
    console.log('🚀 Starting Caudal Local → Cloud Database Sync...\n')
    await cloudClient.query('BEGIN')

    for (const table of TABLES) {
      const quotedTable = `"${table.name}"`
      const quotedCols = table.columns.map((c) => `"${c}"`).join(', ')
      const { rows } = await localPool.query(`SELECT ${quotedCols} FROM ${quotedTable} ORDER BY "id" ASC`)

      let upserted = 0
      for (const row of rows) {
        const values = table.columns.map((c) => row[c])
        const placeholders = table.columns.map((_, i) => `$${i + 1}`).join(', ')
        const updateSet = table.columns
          .filter((c) => c !== 'id')
          .map((c) => `"${c}" = EXCLUDED."${c}"`)
          .join(', ')

        await cloudClient.query(
          `INSERT INTO ${quotedTable} (${quotedCols}) VALUES (${placeholders}) ON CONFLICT ("id") DO UPDATE SET ${updateSet}`,
          values
        )
        upserted++
      }

      // Reset PostgreSQL serial sequence so future inserts don't collide with synced IDs
      await cloudClient.query(
        `SELECT setval(pg_get_serial_sequence('${quotedTable}', 'id'), COALESCE((SELECT MAX("id") FROM ${quotedTable}), 1), (SELECT COUNT(*) > 0 FROM ${quotedTable}))`
      )

      console.log(`   ✓ ${table.name}: synced ${upserted} record(s)`)
    }

    await cloudClient.query('COMMIT')
    console.log('\n✅ All local data synced to your Cloud database successfully!')
  } catch (err) {
    await cloudClient.query('ROLLBACK')
    console.error('\n❌ Sync failed (rolled back):', err.message)
    process.exitCode = 1
  } finally {
    cloudClient.release()
    await localPool.end()
    await cloudPool.end()
  }
}

syncToCloud()
