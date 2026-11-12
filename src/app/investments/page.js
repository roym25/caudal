'use client';

import { useState, useEffect } from 'react';
import { formatMoney } from '@/lib/format';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  EyeSlashIcon,
  TrendUpIcon,
} from '@/components/icons';
import Toast from '@/components/Toast';
import SlidePanel from '@/components/SlidePanel';

// Accent palette assigned to each bank by position
const BANK_COLORS = ['#00C853', '#E65100', '#3B82F6', '#A855F7', '#F59E0B', '#14B8A6'];
const DEFAULT_BANKS = ['OpenBank', 'Mercado Pago', 'DidiCuenta'];

const inputClass =
  'w-full bg-caudal-surface-alt border border-caudal-border rounded-lg px-3 py-2 text-caudal-text focus:outline-none focus:border-caudal-green transition-colors';

export default function InvestmentsPage() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  // Panel state: { kind: 'account' | 'pocket', editingId, accountId }
  const [panel, setPanel] = useState(null);
  const [accountForm, setAccountForm] = useState({ name: '', rate: '' });
  const [pocketForm, setPocketForm] = useState({ name: '', amount: '' });

  const showToast = (message, type = 'success') => setToast({ message, type });

  const fetchAccounts = async () => {
    try {
      const res = await fetch('/api/investment-accounts');
      const data = await res.json();
      if (Array.isArray(data)) setAccounts(data);
    } catch (err) {
      console.error('Error fetching investments:', err);
      showToast('Error loading investments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
    try {
      const saved = localStorage.getItem('caudal_hide_investments');
      if (saved !== null) setHideAmounts(JSON.parse(saved));
    } catch (e) {
      console.error('Failed to load privacy state from localStorage', e);
    }
  }, []);

  const toggleHideAmounts = () => {
    setHideAmounts((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('caudal_hide_investments', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
  };

  const money = (value) =>
    hideAmounts ? <span className="font-mono tracking-widest text-caudal-text-dim">••••••</span> : formatMoney(value);

  // ---------- Calculations ----------
  const accountsWithTotals = accounts.map((a, idx) => {
    const total = (a.pockets || []).reduce((s, p) => s + (p.amount || 0), 0);
    const annualYield = a.rate ? (total * a.rate) / 100 : 0;
    return { ...a, total, annualYield, color: BANK_COLORS[idx % BANK_COLORS.length] };
  });
  const grandTotal = accountsWithTotals.reduce((s, a) => s + a.total, 0);
  const totalAnnualYield = accountsWithTotals.reduce((s, a) => s + a.annualYield, 0);
  const hasAnyRate = accountsWithTotals.some((a) => a.rate);
  const totalPockets = accountsWithTotals.reduce((s, a) => s + (a.pockets?.length || 0), 0);

  // ---------- Panel openers ----------
  const openNewAccount = () => {
    setAccountForm({ name: '', rate: '' });
    setPanel({ kind: 'account', editingId: null });
  };

  const openEditAccount = (account) => {
    setAccountForm({ name: account.name, rate: account.rate ?? '' });
    setPanel({ kind: 'account', editingId: account.id });
  };

  const openNewPocket = (accountId) => {
    setPocketForm({ name: '', amount: '' });
    setPanel({ kind: 'pocket', editingId: null, accountId });
  };

  const openEditPocket = (pocket) => {
    setPocketForm({ name: pocket.name, amount: pocket.amount });
    setPanel({ kind: 'pocket', editingId: pocket.id, accountId: pocket.accountId });
  };

  const closePanel = () => setPanel(null);

  // ---------- Mutations ----------
  const submitAccount = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(panel?.editingId);
    try {
      const res = await fetch(isEdit ? `/api/investment-accounts/${panel.editingId}` : '/api/investment-accounts', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: accountForm.name,
          rate: accountForm.rate === '' ? null : parseFloat(accountForm.rate),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to save bank', 'error');
        return;
      }
      closePanel();
      showToast(isEdit ? 'Bank updated' : 'Bank added');
      fetchAccounts();
    } catch (err) {
      console.error('Error saving bank:', err);
      showToast('Network error while saving', 'error');
    }
  };

  const submitPocket = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(panel?.editingId);
    try {
      const res = await fetch(isEdit ? `/api/investment-pockets/${panel.editingId}` : '/api/investment-pockets', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: panel.accountId,
          name: pocketForm.name,
          amount: parseFloat(pocketForm.amount),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.errors?.join(', ') || 'Failed to save pocket', 'error');
        return;
      }
      closePanel();
      showToast(isEdit ? 'Pocket updated' : 'Pocket added');
      fetchAccounts();
    } catch (err) {
      console.error('Error saving pocket:', err);
      showToast('Network error while saving', 'error');
    }
  };

  const deleteAccount = async (account) => {
    const count = account.pockets?.length || 0;
    const msg = count > 0
      ? `Delete ${account.name} and its ${count} pocket${count === 1 ? '' : 's'}?`
      : `Delete ${account.name}?`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/investment-accounts/${account.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete bank', 'error');
        return;
      }
      showToast('Bank deleted');
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting bank:', err);
      showToast('Network error while deleting', 'error');
    }
  };

  const deletePocket = async (pocket) => {
    if (!confirm(`Delete pocket "${pocket.name}"?`)) return;
    try {
      const res = await fetch(`/api/investment-pockets/${pocket.id}`, { method: 'DELETE' });
      if (!res.ok) {
        showToast('Failed to delete pocket', 'error');
        return;
      }
      showToast('Pocket deleted');
      fetchAccounts();
    } catch (err) {
      console.error('Error deleting pocket:', err);
      showToast('Network error while deleting', 'error');
    }
  };

  const quickSetup = async () => {
    setIsSettingUp(true);
    try {
      for (const name of DEFAULT_BANKS) {
        await fetch('/api/investment-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name }),
        });
      }
      showToast('Banks created — now add your pockets');
      fetchAccounts();
    } catch (err) {
      console.error('Error in quick setup:', err);
      showToast('Network error during setup', 'error');
    } finally {
      setIsSettingUp(false);
    }
  };

  const panelAccountName = accounts.find((a) => a.id === panel?.accountId)?.name;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3.5 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-caudal-text">Investments</h1>
          <p className="text-xs sm:text-sm text-caudal-text-muted mt-0.5">Money saved in SOFIPOs, by bank and pocket</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={toggleHideAmounts}
            className="p-2.5 bg-caudal-surface hover:bg-caudal-surface-alt border border-caudal-border rounded-lg text-caudal-text-muted hover:text-caudal-text transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title={hideAmounts ? 'Show amounts' : 'Hide amounts (Privacy mode)'}
            aria-label={hideAmounts ? 'Show amounts' : 'Hide amounts'}
          >
            {hideAmounts ? <EyeSlashIcon className="w-4 h-4 text-caudal-green" /> : <EyeIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={openNewAccount}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-caudal-green text-caudal-bg font-semibold rounded-lg hover:bg-caudal-green-dim transition-colors min-h-[38px]"
          >
            <PlusIcon className="w-4 h-4" />
            New Bank
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64 text-caudal-text-muted">
          <div className="animate-pulse">Loading investments...</div>
        </div>
      ) : accounts.length === 0 ? (
        /* Empty state with quick setup */
        <div className="bg-caudal-surface border border-dashed border-caudal-border rounded-xl p-8 sm:p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-caudal-green/10 text-caudal-green flex items-center justify-center mx-auto mb-3">
            <TrendUpIcon className="w-6 h-6" />
          </div>
          <p className="text-base font-bold text-caudal-text">No banks added yet</p>
          <p className="text-sm text-caudal-text-muted mt-1 max-w-sm mx-auto">
            Add the SOFIPOs where you keep your money, then split it into pockets like Emergency or Vacation.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center mt-5">
            <button
              onClick={quickSetup}
              disabled={isSettingUp}
              className="px-4 py-2.5 bg-caudal-green text-caudal-bg font-semibold rounded-lg hover:bg-caudal-green-dim transition-colors disabled:opacity-50"
            >
              {isSettingUp ? 'Creating...' : `Quick setup: ${DEFAULT_BANKS.join(', ')}`}
            </button>
            <button
              onClick={openNewAccount}
              className="px-4 py-2.5 bg-caudal-surface-alt border border-caudal-border text-caudal-text font-semibold rounded-lg hover:border-caudal-green/50 transition-colors"
            >
              Add manually
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Total summary card */}
          <div className="bg-caudal-surface border border-caudal-border rounded-xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div>
                <p className="text-xs text-caudal-text-muted uppercase tracking-wider font-medium">Total Invested</p>
                <p className="text-3xl sm:text-4xl font-extrabold text-caudal-green mt-1">{money(grandTotal)}</p>
                <p className="text-xs text-caudal-text-dim mt-1">
                  {accounts.length} bank{accounts.length === 1 ? '' : 's'} · {totalPockets} pocket{totalPockets === 1 ? '' : 's'}
                </p>
              </div>
              {hasAnyRate && (
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div className="px-3 py-2 rounded-lg bg-caudal-surface-alt border border-caudal-border/60">
                    <p className="text-[11px] text-caudal-text-muted">Est. monthly yield</p>
                    <p className="text-sm sm:text-base font-bold text-caudal-text">{money(totalAnnualYield / 12)}</p>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-caudal-surface-alt border border-caudal-border/60">
                    <p className="text-[11px] text-caudal-text-muted">Est. annual yield</p>
                    <p className="text-sm sm:text-base font-bold text-caudal-text">{money(totalAnnualYield)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Distribution bar by bank */}
            {grandTotal > 0 && (
              <div className="mt-5">
                <div className="h-3 w-full bg-caudal-surface-alt rounded-full overflow-hidden flex">
                  {accountsWithTotals.map((a) =>
                    a.total > 0 ? (
                      <div
                        key={a.id}
                        style={{ width: `${(a.total / grandTotal) * 100}%`, backgroundColor: a.color }}
                        className="h-full transition-all duration-500"
                        title={`${a.name}: ${((a.total / grandTotal) * 100).toFixed(0)}%`}
                      />
                    ) : null
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                  {accountsWithTotals.map((a) => (
                    <span key={a.id} className="flex items-center gap-1.5 text-xs text-caudal-text-muted">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: a.color }} />
                      {a.name}
                      <span className="text-caudal-text-dim">
                        {grandTotal > 0 ? `${((a.total / grandTotal) * 100).toFixed(0)}%` : '0%'}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bank cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {accountsWithTotals.map((account) => (
              <div
                key={account.id}
                className="bg-caudal-surface border border-caudal-border rounded-xl overflow-hidden flex flex-col"
                style={{ borderTopColor: account.color, borderTopWidth: 3 }}
              >
                {/* Bank header */}
                <div className="px-4 sm:px-5 pt-4 pb-3 border-b border-caudal-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-caudal-text truncate">{account.name}</h2>
                        {account.rate ? (
                          <span className="px-2 py-0.5 rounded-full bg-caudal-green/10 border border-caudal-green/20 text-caudal-green text-[11px] font-semibold shrink-0">
                            {account.rate}% annual
                          </span>
                        ) : null}
                      </div>
                      <p className="text-2xl font-extrabold mt-1" style={{ color: account.color }}>
                        {money(account.total)}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => openEditAccount(account)}
                        className="p-2 text-caudal-text-muted hover:text-caudal-text hover:bg-caudal-surface-alt rounded-lg transition-colors"
                        title="Edit bank"
                        aria-label={`Edit ${account.name}`}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteAccount(account)}
                        className="p-2 text-caudal-text-muted hover:text-caudal-error hover:bg-caudal-surface-alt rounded-lg transition-colors"
                        title="Delete bank"
                        aria-label={`Delete ${account.name}`}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pockets */}
                <div className="flex-1 px-2 sm:px-3 py-2">
                  {account.pockets?.length > 0 ? (
                    <ul className="divide-y divide-caudal-border/50">
                      {account.pockets.map((pocket) => (
                        <li key={pocket.id} className="group flex items-center justify-between gap-2 px-2 py-2.5">
                          <span className="text-sm text-caudal-text truncate">{pocket.name}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-sm font-semibold text-caudal-text mr-1">{money(pocket.amount)}</span>
                            <button
                              onClick={() => openEditPocket(pocket)}
                              className="p-1.5 text-caudal-text-dim hover:text-caudal-text hover:bg-caudal-surface-alt rounded transition-colors md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                              title="Edit pocket"
                              aria-label={`Edit ${pocket.name}`}
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deletePocket(pocket)}
                              className="p-1.5 text-caudal-text-dim hover:text-caudal-error hover:bg-caudal-surface-alt rounded transition-colors md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
                              title="Delete pocket"
                              aria-label={`Delete ${pocket.name}`}
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-caudal-text-dim text-center py-4">No pockets yet</p>
                  )}

                  <button
                    onClick={() => openNewPocket(account.id)}
                    className="w-full mt-1 mb-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-caudal-border text-xs font-semibold text-caudal-text-muted hover:text-caudal-green hover:border-caudal-green/50 transition-colors"
                  >
                    <PlusIcon className="w-3.5 h-3.5" />
                    Add pocket
                  </button>
                </div>

                {/* Yield footer */}
                {account.rate ? (
                  <div className="px-4 sm:px-5 py-2.5 border-t border-caudal-border/60 bg-caudal-surface-alt/40 flex items-center justify-between text-xs text-caudal-text-dim">
                    <span>Est. yield</span>
                    <span className="font-semibold text-caudal-text-muted">
                      ≈ {money(account.annualYield / 12)}/mo
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {hasAnyRate && (
            <p className="text-[11px] text-caudal-text-dim text-center">
              Yields are gross estimates based on the annual rate you entered. Balances show only the amounts you put in.
            </p>
          )}
        </>
      )}

      {/* Bank form */}
      <SlidePanel
        isOpen={panel?.kind === 'account'}
        onClose={closePanel}
        title={panel?.editingId ? 'Edit Bank' : 'New Bank'}
      >
        <form onSubmit={submitAccount} className="space-y-4">
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Bank name</label>
            <input
              type="text"
              placeholder="e.g. OpenBank, Mercado Pago, DidiCuenta"
              value={accountForm.name}
              onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Annual rate % (Optional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              inputMode="decimal"
              placeholder="e.g. 14"
              value={accountForm.rate}
              onChange={(e) => setAccountForm({ ...accountForm, rate: e.target.value })}
              className={inputClass}
            />
            <p className="text-xs text-caudal-text-dim mt-1">Only used to estimate how much it yields.</p>
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-caudal-green text-caudal-bg font-semibold rounded-lg px-4 py-2.5 hover:bg-caudal-green-dim transition-colors"
            >
              {panel?.editingId ? 'Save Changes' : 'Add Bank'}
            </button>
          </div>
        </form>
      </SlidePanel>

      {/* Pocket form */}
      <SlidePanel
        isOpen={panel?.kind === 'pocket'}
        onClose={closePanel}
        title={panel?.editingId ? 'Edit Pocket' : `New Pocket${panelAccountName ? ` — ${panelAccountName}` : ''}`}
      >
        <form onSubmit={submitPocket} className="space-y-4">
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Pocket name</label>
            <input
              type="text"
              placeholder="e.g. Emergency, Vacation, House"
              value={pocketForm.name}
              onChange={(e) => setPocketForm({ ...pocketForm, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-caudal-text-muted mb-1">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="0.00"
              value={pocketForm.amount}
              onChange={(e) => setPocketForm({ ...pocketForm, amount: e.target.value })}
              className={inputClass}
              required
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-caudal-green text-caudal-bg font-semibold rounded-lg px-4 py-2.5 hover:bg-caudal-green-dim transition-colors"
            >
              {panel?.editingId ? 'Save Changes' : 'Add Pocket'}
            </button>
          </div>
        </form>
      </SlidePanel>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
