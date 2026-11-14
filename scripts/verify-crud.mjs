import 'dotenv/config'
import prisma from '../src/lib/prisma.js'
import { validatePayroll, validateFixedPayment, validateInvestmentAccount, validateInvestmentPocket } from '../src/lib/validate.js'

async function runTests() {
  console.log('🧪 Running Caudal Database & Model Integration Tests...\n')
  let failed = 0

  // Test 1: Variable Expense CRUD with comments
  try {
    console.log('1. Testing VariableExpense CRUD with comments...')
    const created = await prisma.variableExpense.create({
      data: {
        description: 'Test Groceries',
        date: new Date('2026-05-01T12:00:00.000Z'),
        amount: 50.0,
        comments: 'Initial test comment',
      },
    })
    console.log('   ✓ Created VariableExpense with ID:', created.id)

    const updatedWithNull = await prisma.variableExpense.update({
      where: { id: created.id },
      data: {
        description: 'Pestodiquesto',
        date: new Date('2026-05-01T12:00:00.000Z'),
        amount: 50.0,
        comments: null,
      },
    })
    console.log('   ✓ Updated VariableExpense with comments: null')

    const updatedWithText = await prisma.variableExpense.update({
      where: { id: created.id },
      data: {
        comments: 'Updated comment text',
      },
    })
    console.log('   ✓ Updated VariableExpense with new comments text:', updatedWithText.comments)

    await prisma.variableExpense.delete({ where: { id: created.id } })
    console.log('   ✓ Cleaned up test VariableExpense')
  } catch (err) {
    console.error('   ❌ VariableExpense test failed:', err.message)
    failed++
  }

  // Test 2: Payroll CRUD with employerMatch and savingsFund
  try {
    console.log('\n2. Testing Payroll CRUD with employerMatch...')
    const createdPayroll = await prisma.payroll.create({
      data: {
        date: new Date('2026-05-01T12:00:00.000Z'),
        week: 1,
        amountReceived: 5000.0,
        isr: 800.0,
        savingsFund: 100.0,
        employerMatch: 100.0,
        notes: 'Test payroll',
      },
    })
    console.log('   ✓ Created Payroll with ID:', createdPayroll.id)

    const updatedPayroll = await prisma.payroll.update({
      where: { id: createdPayroll.id },
      data: {
        employerMatch: 150.0,
        savingsFund: 150.0,
      },
    })
    console.log('   ✓ Updated Payroll employerMatch to:', updatedPayroll.employerMatch)

    await prisma.payroll.delete({ where: { id: createdPayroll.id } })
    console.log('   ✓ Cleaned up test Payroll')
  } catch (err) {
    console.error('   ❌ Payroll test failed:', err.message)
    failed++
  }

  // Test 2b: validatePayroll auto 1:1 match when employerMatch is omitted
  try {
    console.log('\n2b. Testing validatePayroll auto 1:1 match...')
    const validated = validatePayroll({
      date: '2026-05-01',
      week: 2,
      amountReceived: 5200,
      isr: 850,
      savingsFund: 250,
      // employerMatch omitted
    })
    if (!validated.valid) throw new Error('Validation failed: ' + validated.errors.join(', '))
    if (validated.data.employerMatch !== 250) throw new Error(`Expected employerMatch to be 250, got ${validated.data.employerMatch}`)
    console.log('   ✓ validatePayroll automatically defaulted employerMatch to savingsFund:', validated.data.employerMatch)
  } catch (err) {
    console.error('   ❌ validatePayroll test failed:', err.message)
    failed++
  }

  // Test 3: FixedExpense & FixedPayment CRUD with amount
  try {
    console.log('\n3. Testing FixedExpense & Payment CRUD with amount...')
    const createdExpense = await prisma.fixedExpense.create({
      data: {
        name: 'Test Netflix',
        cost: 199.0,
        dueDay: 15,
      },
    })
    console.log('   ✓ Created FixedExpense with ID:', createdExpense.id)

    const payment = await prisma.fixedPayment.upsert({
      where: {
        fixedExpenseId_date: {
          fixedExpenseId: createdExpense.id,
          date: new Date('2026-05-01T12:00:00.000Z'),
        },
      },
      update: { paid: true, amount: 239.0 },
      create: {
        fixedExpenseId: createdExpense.id,
        date: new Date('2026-05-01T12:00:00.000Z'),
        paid: true,
        amount: 239.0,
      },
    })
    console.log('   ✓ Upserted FixedPayment status:', payment.paid, 'with amount:', payment.amount)
    if (payment.amount !== 239.0) throw new Error(`Expected payment amount 239.0, got ${payment.amount}`)

    const updatedPayment = await prisma.fixedPayment.update({
      where: { id: payment.id },
      data: { amount: 149.0 },
    })
    console.log('   ✓ Updated FixedPayment amount to:', updatedPayment.amount)
    if (updatedPayment.amount !== 149.0) throw new Error(`Expected payment amount 149.0, got ${updatedPayment.amount}`)

    const valResult = validateFixedPayment({
      fixedExpenseId: createdExpense.id,
      date: '2026-08-01',
      paid: true,
      amount: '149.50',
    })
    if (!valResult.valid) throw new Error('validateFixedPayment failed: ' + valResult.errors.join(', '))
    if (valResult.data.amount !== 149.50) throw new Error(`Expected validated amount 149.50, got ${valResult.data.amount}`)
    console.log('   ✓ validateFixedPayment correctly parsed amount:', valResult.data.amount)

    await prisma.fixedPayment.deleteMany({ where: { fixedExpenseId: createdExpense.id } })
    await prisma.fixedExpense.delete({ where: { id: createdExpense.id } })
    console.log('   ✓ Cleaned up test FixedExpense & Payments')
  } catch (err) {
    console.error('   ❌ FixedExpense test failed:', err.message)
    failed++
  }

  // Test 4: Verify query ordering for FixedExpense and VariableExpense
  try {
    console.log('\n4. Testing query ordering for FixedExpense and VariableExpense...')
    const fe1 = await prisma.fixedExpense.create({ data: { name: 'Late Bill', cost: 100, dueDay: 25 } })
    const fe2 = await prisma.fixedExpense.create({ data: { name: 'Early Bill', cost: 50, dueDay: 3 } })

    const fixedSorted = await prisma.fixedExpense.findMany({
      where: { id: { in: [fe1.id, fe2.id] } },
      orderBy: [{ dueDay: 'asc' }, { name: 'asc' }],
    })
    if (fixedSorted[0].dueDay !== 3 || fixedSorted[1].dueDay !== 25) {
      throw new Error(`Fixed expenses not sorted by dueDay asc: expected 3 then 25, got ${fixedSorted[0].dueDay} and ${fixedSorted[1].dueDay}`)
    }
    console.log('   ✓ FixedExpense successfully ordered by dueDay asc (Day 3 before Day 25)')

    await prisma.fixedExpense.deleteMany({ where: { id: { in: [fe1.id, fe2.id] } } })

    const ve1 = await prisma.variableExpense.create({ data: { description: 'Old Exp', date: new Date('2026-04-01T12:00:00Z'), amount: 10 } })
    const ve2 = await prisma.variableExpense.create({ data: { description: 'New Exp', date: new Date('2026-05-01T12:00:00Z'), amount: 20 } })

    const varSorted = await prisma.variableExpense.findMany({
      where: { id: { in: [ve1.id, ve2.id] } },
      orderBy: [{ date: 'desc' }, { id: 'desc' }],
    })
    if (varSorted[0].description !== 'New Exp') {
      throw new Error(`Variable expenses not sorted by date desc: expected New Exp first, got ${varSorted[0].description}`)
    }
    console.log('   ✓ VariableExpense successfully ordered by date desc (May before April)')

    await prisma.variableExpense.deleteMany({ where: { id: { in: [ve1.id, ve2.id] } } })
  } catch (err) {
    console.error('   ❌ Query ordering test failed:', err.message)
    failed++
  }

  // Test: Investment accounts & pockets (CRUD, totals, cascade delete, validation)
  try {
    console.log('\nTesting InvestmentAccount & InvestmentPocket CRUD...')
    const accValid = validateInvestmentAccount({
      name: '  Test SOFIPO ',
      rate: '13',
      maxAmount: '30000',
      color: 'green',
    })
    if (
      !accValid.valid ||
      accValid.data.name !== 'Test SOFIPO' ||
      accValid.data.rate !== 13 ||
      accValid.data.maxAmount !== 30000 ||
      accValid.data.color !== 'green'
    ) {
      throw new Error('validateInvestmentAccount did not sanitize name/rate/maxAmount/color correctly')
    }
    const emptyOpt = validateInvestmentAccount({ name: 'X', rate: '', maxAmount: '', color: '' })
    if (emptyOpt.data.rate !== null || emptyOpt.data.maxAmount !== null || emptyOpt.data.color !== null) {
      throw new Error('Empty rate/maxAmount/color should be stored as null')
    }
    if (validateInvestmentAccount({ name: 'X', maxAmount: -100 }).valid) {
      throw new Error('Negative maxAmount should be rejected')
    }
    if (validateInvestmentAccount({ name: 'X', color: 'neon-pink' }).valid) {
      throw new Error('Off-palette color should be rejected')
    }
    if (validateInvestmentAccount({ name: '' }).valid) {
      throw new Error('Empty bank name should be rejected')
    }
    if (validateInvestmentPocket({ accountId: 1, name: 'Bad', amount: -5 }).valid) {
      throw new Error('Negative pocket amount should be rejected')
    }
    console.log('   ✓ Investment validators accept/reject inputs correctly')

    const account = await prisma.investmentAccount.create({ data: accValid.data })
    await prisma.investmentPocket.createMany({
      data: [
        { accountId: account.id, name: 'Emergencia', amount: 10000 },
        { accountId: account.id, name: 'Vacaciones', amount: 8000 },
        { accountId: account.id, name: 'Casa', amount: 6000 },
      ],
    })
    const withPockets = await prisma.investmentAccount.findUnique({
      where: { id: account.id },
      include: { pockets: true },
    })
    const total = withPockets.pockets.reduce((s, p) => s + p.amount, 0)
    if (total !== 24000) throw new Error(`Expected bank total 24000, got ${total}`)
    console.log('   ✓ Created bank with 3 pockets, total = 24000')

    const firstPocket = withPockets.pockets[0]
    await prisma.investmentMovement.create({
      data: {
        accountId: account.id,
        pocketId: firstPocket.id,
        pocketName: firstPocket.name,
        type: 'deposit',
        amount: 2000,
        date: new Date('2026-11-12T12:00:00.000Z'),
      },
    })
    await prisma.investmentPocket.update({ where: { id: firstPocket.id }, data: { amount: 12000 } })
    console.log('   ✓ Updated pocket amount and recorded InvestmentMovement')

    await prisma.investmentAccount.delete({ where: { id: account.id } })
    const orphanCount = await prisma.investmentPocket.count({ where: { accountId: account.id } })
    const orphanMovCount = await prisma.investmentMovement.count({ where: { accountId: account.id } })
    if (orphanCount !== 0 || orphanMovCount !== 0) {
      throw new Error(`Cascade delete failed: ${orphanCount} pockets and ${orphanMovCount} movements remain`)
    }
    console.log('   ✓ Deleting bank cascades to its pockets and movements')
  } catch (err) {
    console.error('   ❌ Investment test failed:', err.message)
    failed++
  }

  // Test: Savings Fund cycle payout (savingsPaidAt)
  try {
    console.log('\nTesting Savings Fund cycle payout (savingsPaidAt)...')
    // Ensure any pre-existing payrolls before this migration have their initial cycle stamped if none are stamped yet
    const alreadyPaidCount = await prisma.payroll.count({ where: { NOT: { savingsPaidAt: null } } })
    const totalExistingCount = await prisma.payroll.count()
    if (alreadyPaidCount === 0 && totalExistingCount > 0) {
      const initialStamp = new Date('2026-11-11T12:00:00.000Z')
      const res = await prisma.payroll.updateMany({
        where: { savingsPaidAt: null },
        data: { savingsPaidAt: initialStamp },
      })
      console.log(`   ✓ Initialized ${res.count} existing payroll(s) as paid out in previous cycle`)
    }

    const cyclePayroll = await prisma.payroll.create({
      data: {
        date: new Date('2026-11-15T12:00:00.000Z'),
        week: 2,
        amountReceived: 5000,
        isr: 800,
        savingsFund: 300,
        employerMatch: 300,
      },
    })
    if (cyclePayroll.savingsPaidAt !== null) {
      throw new Error('New payroll should default to savingsPaidAt: null (active cycle)')
    }
    const stamp = new Date()
    const closedPayroll = await prisma.payroll.update({
      where: { id: cyclePayroll.id },
      data: { savingsPaidAt: stamp },
    })
    if (!closedPayroll.savingsPaidAt) {
      throw new Error('Failed to set savingsPaidAt on payroll')
    }
    await prisma.payroll.delete({ where: { id: cyclePayroll.id } })
    console.log('   ✓ Payroll savingsPaidAt lifecycle verified')
  } catch (err) {
    console.error('   ❌ Savings cycle test failed:', err.message)
    failed++
  }

  if (failed > 0) {
    console.error(`\n❌ ${failed} test(s) failed.`)
    process.exit(1)
  } else {
    console.log('\n✅ All database integration tests passed successfully!')
    process.exit(0)
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e)
  process.exit(1)
})

