import type { FormEvent } from 'react';
import { IconAccount, IconClearLedger, IconPlus, IconWallet } from './icons';
import { AnimatedNumber } from './motion';
import { useTilt } from './useTilt';
import {
  EmptyState,
  Field,
  Input,
  MetricGrid,
  PageHeader,
  Panel,
  Row,
  SectionTitle,
  Select,
  Stat,
  SubmitButton,
} from './ui';
import type {
  Account,
  Analytics,
  Budget,
  Expense,
  LedgerEntry,
  P2PRequest,
  Transaction,
  UserProfile,
  Wallet,
  WalletPayment,
  User,
} from './types';

export type AuthenticatedUIProps = {
  activeTab: string;
  accounts: Account[];
  transactions: Transaction[];
  ledgerEntries: LedgerEntry[];
  wallet: Wallet | null;
  p2pRequests: P2PRequest[];
  walletPayments: WalletPayment[];
  expenses: Expense[];
  budgets: Budget[];
  analytics: Analytics | null;
  currentUser: User | null;
  currentUsername: string;
  userProfile: UserProfile | null;
  isLiveMode: boolean;
  totalBalance: number;
  maxReached: boolean;
  hasSavings: boolean;
  hasChecking: boolean;
  newAccType: 'SAVINGS' | 'CHECKING';
  setNewAccType: (t: 'SAVINGS' | 'CHECKING') => void;
  activeAccId: string;
  setActiveAccId: (id: string) => void;
  txnType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  setTxnType: (t: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER') => void;
  targetAccountNum: string;
  setTargetAccountNum: (v: string) => void;
  txnAmount: string;
  setTxnAmount: (v: string) => void;
  txnDesc: string;
  setTxnDesc: (v: string) => void;
  txnIdemKey: string;
  linkAccountId: string;
  setLinkAccountId: (v: string) => void;
  initialLoadAmount: string;
  setInitialLoadAmount: (v: string) => void;
  walletRechargeAmount: string;
  setWalletRechargeAmount: (v: string) => void;
  p2pToUsername: string;
  setP2pToUsername: (v: string) => void;
  p2pAmount: string;
  setP2pAmount: (v: string) => void;
  p2pNote: string;
  setP2pNote: (v: string) => void;
  requestFromUsername: string;
  setRequestFromUsername: (v: string) => void;
  requestAmount: string;
  setRequestAmount: (v: string) => void;
  requestNote: string;
  setRequestNote: (v: string) => void;
  payType: 'BOOKING' | 'BILL' | 'RECHARGE';
  setPayType: (t: 'BOOKING' | 'BILL' | 'RECHARGE') => void;
  payAmount: string;
  setPayAmount: (v: string) => void;
  payMeta1: string;
  setPayMeta1: (v: string) => void;
  payMeta2: string;
  setPayMeta2: (v: string) => void;
  expAmount: string;
  setExpAmount: (v: string) => void;
  expCategory: string;
  setExpCategory: (v: string) => void;
  expDesc: string;
  setExpDesc: (v: string) => void;
  budgetCategory: string;
  setBudgetCategory: (v: string) => void;
  budgetLimit: string;
  setBudgetLimit: (v: string) => void;
  budgetPeriod: string;
  setBudgetPeriod: (v: string) => void;
  onOpenAccount: (e: FormEvent) => void;
  onExecuteTransaction: (e: FormEvent) => void;
  onInitializeWallet: (e: FormEvent) => void;
  onRechargeWallet: (e: FormEvent) => void;
  onSendP2P: (e: FormEvent) => void;
  onRequestP2P: (e: FormEvent) => void;
  onWalletPay: (e: FormEvent) => void;
  onAddExpense: (e: FormEvent) => void;
  onSaveBudget: (e: FormEvent) => void;
  onAddBalance: (accId: string, type: string) => void;
  onAcceptRequest: (id: string, amount: number) => void;
  onDeclineRequest: (id: string) => void;
};

const CATEGORIES = ['FOOD', 'TRAVEL', 'UTILITIES', 'SHOPPING', 'ENTERTAINMENT', 'OTHER'];

function formatInr(n: number) {
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function payLabels(type: string) {
  if (type === 'BOOKING') return { m1: 'Provider', m2: 'Booking ref', p1: 'AIRLINE', p2: 'PNR123' };
  if (type === 'BILL') return { m1: 'Biller code', m2: 'Consumer ID', p1: 'ELEC-DL', p2: 'ACC998877' };
  return { m1: 'Operator', m2: 'Mobile number', p1: 'JIO', p2: '9876543210' };
}

export function AuthenticatedUI(props: AuthenticatedUIProps) {
  const p = props;
  const profile = p.isLiveMode && p.userProfile ? p.userProfile : p.currentUser;
  const pay = payLabels(p.payType);
  const walletRef = useTilt<HTMLDivElement>(7);

  if (p.activeTab === 'dashboard') {
    return (
      <>
        <PageHeader title="Accounts" description="Core banking — balances and new accounts" />
        <MetricGrid>
          <Stat label="Net worth" value={formatInr(p.totalBalance)} />
          <Stat label="Accounts" value={String(p.accounts.length)} />
          <Stat label="Wallet" value={p.wallet ? formatInr(p.wallet.balance) : 'Not active'} />
        </MetricGrid>
        <SectionTitle>Your accounts</SectionTitle>
        <div className="stack">
          {p.accounts.map((acc) => (
            <Row key={acc.id}>
              <div>
                <div className="row-title">
                  <IconAccount size={16} className="text-accent" />
                  {acc.type}
                </div>
                <div className="row-meta">{acc.accountNumber}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div className="row-amount">
                  {typeof acc.balance === 'number' ? formatInr(acc.balance) : acc.formattedBalance}
                </div>
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: '0.35rem' }} onClick={() => p.onAddBalance(acc.id, acc.type)}>
                  <IconPlus size={14} /> Add
                </button>
              </div>
            </Row>
          ))}
        </div>
        <Panel className="stack panel-accent" glow style={{ marginTop: '1.25rem', ['--panel-accent' as string]: 'var(--mod-accounts)' }}>
          {p.maxReached ? (
            <EmptyState>You already have Checking and Savings (max 2 accounts).</EmptyState>
          ) : (
            <form onSubmit={p.onOpenAccount} className="stack-sm">
              <Field label="Open account" id="new-acc-type">
                <Select id="new-acc-type" value={p.newAccType} onChange={(e) => p.setNewAccType(e.target.value as 'SAVINGS' | 'CHECKING')}>
                  {!p.hasSavings && <option value="SAVINGS">Savings</option>}
                  {!p.hasChecking && <option value="CHECKING">Checking</option>}
                </Select>
              </Field>
              <SubmitButton variant="primary">Create account</SubmitButton>
            </form>
          )}
        </Panel>
      </>
    );
  }

  if (p.activeTab === 'transactions') {
    return (
      <>
        <PageHeader title="Transactions" description="Deposits, withdrawals, and transfers" />
        <Panel glow className="stack panel-accent" style={{ ['--panel-accent' as string]: 'var(--mod-transactions)' }}>
          <form onSubmit={p.onExecuteTransaction} className="stack">
            <div className="grid-2">
              <Field label="From account" id="txn-from">
                <Select id="txn-from" value={p.activeAccId} onChange={(e) => p.setActiveAccId(e.target.value)}>
                  {p.accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>{acc.type} ({acc.accountNumber})</option>
                  ))}
                </Select>
              </Field>
              <Field label="Type" id="txn-type">
                <Select id="txn-type" value={p.txnType} onChange={(e) => p.setTxnType(e.target.value as typeof p.txnType)}>
                  <option value="TRANSFER">Transfer</option>
                  <option value="DEPOSIT">Deposit</option>
                  <option value="WITHDRAW">Withdraw</option>
                </Select>
              </Field>
            </div>
            {p.txnType === 'TRANSFER' && (
              <Field label="Recipient account" id="txn-to">
                <Input id="txn-to" value={p.targetAccountNum} onChange={(e) => p.setTargetAccountNum(e.target.value)} required />
              </Field>
            )}
            <div className="grid-2">
              <Field label="Amount (INR)" id="txn-amt">
                <Input id="txn-amt" type="number" step="0.01" value={p.txnAmount} onChange={(e) => p.setTxnAmount(e.target.value)} required />
              </Field>
              <Field label="Description" id="txn-desc">
                <Input id="txn-desc" value={p.txnDesc} onChange={(e) => p.setTxnDesc(e.target.value)} />
              </Field>
            </div>
            <p className="text-mono text-muted">Idempotency: <span className="text-accent">{p.txnIdemKey}</span></p>
            <SubmitButton variant="primary">Execute</SubmitButton>
          </form>
        </Panel>
        <SectionTitle>Activity</SectionTitle>
        <div className="stack-sm">
          {p.transactions.length === 0 ? <EmptyState>No transactions yet.</EmptyState> : p.transactions.map((tx) => (
            <Row key={tx.id}>
              <div>
                <div className="row-title">{tx.type}</div>
                <div className="row-meta">{tx.description || tx.reference}</div>
              </div>
              <span className="row-amount">{tx.type === 'DEPOSIT' ? '+' : '-'}{typeof tx.amount === 'number' ? formatInr(tx.amount) : tx.formattedAmount}</span>
            </Row>
          ))}
        </div>
      </>
    );
  }

  if (p.activeTab === 'ledger') {
    return (
      <>
        <PageHeader title="Ledger" description="Double-entry audit log" />
        <div className="table-wrap panel-glow">
          <table className="data-table">
            <thead>
              <tr><th>Account</th><th>Type</th><th>Amount</th><th>Balance after</th><th>Reference</th></tr>
            </thead>
            <tbody>
              {p.ledgerEntries.length === 0 ? (
                <tr><td colSpan={5} className="text-muted">No ledger entries yet.</td></tr>
              ) : p.ledgerEntries.map((led) => (
                <tr key={led.id}>
                  <td>{led.accountNumber}</td>
                  <td><span className={`badge ${led.type === 'CREDIT' ? 'badge-credit' : 'badge-debit'}`}>{led.type}</span></td>
                  <td>{led.type === 'CREDIT' ? '+' : '-'}{formatInr(led.amount)}</td>
                  <td>{formatInr(led.balanceAfter)}</td>
                  <td className="text-mono">{led.transactionReference}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (p.activeTab === 'profile') {
    return (
      <>
        <PageHeader title="Profile" description="User module — account details" />
        <Panel glow className="panel-accent" style={{ ['--panel-accent' as string]: 'var(--mod-profile)' }}>
          <dl className="profile-grid">
            <div className="profile-item"><dt>Full name</dt><dd>{profile?.fullName ?? '—'}</dd></div>
            <div className="profile-item"><dt>Username</dt><dd>@{profile?.username ?? p.currentUsername}</dd></div>
            <div className="profile-item"><dt>Email</dt><dd>{profile?.email ?? '—'}</dd></div>
            <div className="profile-item"><dt>Phone</dt><dd>{profile?.phone ?? '—'}</dd></div>
            {p.userProfile?.role && <div className="profile-item"><dt>Role</dt><dd>{p.userProfile.role}</dd></div>}
          </dl>
        </Panel>
      </>
    );
  }

  if (p.activeTab === 'clearledger') {
    return (
      <>
        <PageHeader title="ClearLedger" description="Track expenses, set budgets, view analytics" />
        <MetricGrid>
          <Stat label="Spent this month" value={p.analytics?.formattedTotalSpent ?? formatInr(0)} />
          <Stat label="Expenses logged" value={String(p.expenses.length)} />
          <Stat label="Budgets" value={String(p.budgets.length)} />
        </MetricGrid>
        <div className="grid-2">
          <Panel glow className="stack-sm panel-accent" style={{ ['--panel-accent' as string]: 'var(--mod-clearledger)' }}>
            <SectionTitle>Log expense</SectionTitle>
            <form onSubmit={p.onAddExpense} className="stack-sm">
              <Field label="Amount" id="exp-amt"><Input id="exp-amt" type="number" step="0.01" value={p.expAmount} onChange={(e) => p.setExpAmount(e.target.value)} required /></Field>
              <Field label="Category" id="exp-cat">
                <Select id="exp-cat" value={p.expCategory} onChange={(e) => p.setExpCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Description" id="exp-desc"><Input id="exp-desc" value={p.expDesc} onChange={(e) => p.setExpDesc(e.target.value)} /></Field>
              <SubmitButton variant="primary"><IconClearLedger size={16} /> Add expense</SubmitButton>
            </form>
          </Panel>
          <Panel glow className="stack-sm panel-accent" style={{ ['--panel-accent' as string]: 'var(--mod-clearledger)' }}>
            <SectionTitle>Set budget</SectionTitle>
            <form onSubmit={p.onSaveBudget} className="stack-sm">
              <Field label="Category" id="bud-cat">
                <Select id="bud-cat" value={p.budgetCategory} onChange={(e) => p.setBudgetCategory(e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </Select>
              </Field>
              <Field label="Limit (INR)" id="bud-limit"><Input id="bud-limit" type="number" value={p.budgetLimit} onChange={(e) => p.setBudgetLimit(e.target.value)} required /></Field>
              <Field label="Period" id="bud-period">
                <Select id="bud-period" value={p.budgetPeriod} onChange={(e) => p.setBudgetPeriod(e.target.value)}>
                  <option value="MONTHLY">Monthly</option>
                  <option value="WEEKLY">Weekly</option>
                </Select>
              </Field>
              <SubmitButton variant="secondary">Save budget</SubmitButton>
            </form>
          </Panel>
        </div>
        {p.analytics?.byCategory && p.analytics.byCategory.length > 0 && (
          <>
            <SectionTitle>Spending by category</SectionTitle>
            <div className="analytics-grid">
              {p.analytics.byCategory.map((item) => (
                <div key={item.category} className="analytics-chip">
                  <div className="text-muted" style={{ fontSize: '0.72rem' }}>{item.category}</div>
                  <div className="row-amount" style={{ fontSize: '1rem' }}>{item.formattedAmount ?? formatInr(item.amount)}</div>
                </div>
              ))}
            </div>
          </>
        )}
        <SectionTitle>Budget progress</SectionTitle>
        <div className="stack-sm">
          {p.budgets.length === 0 ? <EmptyState>No budgets yet.</EmptyState> : p.budgets.map((b) => {
            const pct = b.limitAmount > 0 ? Math.min(100, ((b.spentAmount ?? 0) / b.limitAmount) * 100) : 0;
            return (
              <Panel key={b.id} className="stack-sm">
                <div className="row-title">{b.category} · {b.period}</div>
                <div className="text-muted">{b.formattedSpent ?? formatInr(b.spentAmount ?? 0)} / {b.formattedLimit ?? formatInr(b.limitAmount)}</div>
                <div className="budget-bar"><div className="budget-fill" style={{ width: `${pct}%` }} /></div>
              </Panel>
            );
          })}
        </div>
        <SectionTitle>Recent expenses</SectionTitle>
        <div className="stack-sm">
          {p.expenses.length === 0 ? <EmptyState>No expenses logged.</EmptyState> : p.expenses.map((e) => (
            <Row key={e.id}>
              <div><div className="row-title">{e.category}</div><div className="row-meta">{e.description || e.expenseDate}</div></div>
              <span className="row-amount">{e.formattedAmount ?? formatInr(e.amount)}</span>
            </Row>
          ))}
        </div>
      </>
    );
  }

  if (p.activeTab === 'wallet') {
    if (!p.wallet) {
      return (
        <>
          <PageHeader title="Wallet" description="PayFlow — link an account and load funds" />
          <Panel glow className="stack panel-accent" style={{ ['--panel-accent' as string]: 'var(--mod-wallet)' }}>
            <p className="text-muted" style={{ margin: 0 }}>Minimum initial load ₹1,000.</p>
            <form onSubmit={p.onInitializeWallet} className="stack">
              <Field label="Funding account" id="link-acc">
                <Select id="link-acc" value={p.linkAccountId} onChange={(e) => p.setLinkAccountId(e.target.value)} required>
                  {p.accounts.map((acc) => <option key={acc.id} value={acc.id}>{acc.type} ({acc.accountNumber})</option>)}
                </Select>
              </Field>
              <Field label="Initial load (₹)" id="init-load">
                <Input id="init-load" type="number" min={1000} value={p.initialLoadAmount} onChange={(e) => p.setInitialLoadAmount(e.target.value)} required />
              </Field>
              <SubmitButton variant="primary"><IconWallet size={18} /> Activate wallet</SubmitButton>
            </form>
          </Panel>
        </>
      );
    }

    return (
      <>
        <PageHeader title="Wallet" description="PayFlow — P2P, services, and recharge" />
        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="wallet-card" ref={walletRef}>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, letterSpacing: '0.04em', textTransform: 'uppercase' }}>PayFlow balance</span>
            <div className="wallet-balance"><AnimatedNumber value={formatInr(p.wallet.balance)} /></div>
            <p className="text-mono" style={{ margin: '0.75rem 0 0', opacity: 0.8, letterSpacing: '0.15em' }}>•••• •••• •••• {p.wallet.accountNumber?.slice(-4) ?? '----'}</p>
          </div>
          <Panel glow className="stack-sm">
            <SectionTitle>Recharge</SectionTitle>
            <form onSubmit={p.onRechargeWallet} className="stack-sm">
              <Input type="number" placeholder="Amount" value={p.walletRechargeAmount} onChange={(e) => p.setWalletRechargeAmount(e.target.value)} required />
              <SubmitButton variant="primary">Recharge</SubmitButton>
            </form>
          </Panel>
        </div>

        <Panel glow className="stack panel-accent" style={{ marginBottom: '1.25rem', ['--panel-accent' as string]: 'var(--mod-wallet)' }}>
          <SectionTitle>Pay with wallet (Strategy framework)</SectionTitle>
          <div className="pay-tabs">
            {(['BOOKING', 'BILL', 'RECHARGE'] as const).map((t) => (
              <button key={t} type="button" className={`pay-tab ${p.payType === t ? 'pay-tab-active' : ''}`} onClick={() => p.setPayType(t)}>{t}</button>
            ))}
          </div>
          <form onSubmit={p.onWalletPay} className="stack-sm">
            <Field label="Amount (₹)" id="pay-amt"><Input id="pay-amt" type="number" step="0.01" value={p.payAmount} onChange={(e) => p.setPayAmount(e.target.value)} required /></Field>
            <div className="grid-2">
              <Field label={pay.m1} id="pay-m1"><Input id="pay-m1" value={p.payMeta1} onChange={(e) => p.setPayMeta1(e.target.value)} placeholder={pay.p1} required /></Field>
              <Field label={pay.m2} id="pay-m2"><Input id="pay-m2" value={p.payMeta2} onChange={(e) => p.setPayMeta2(e.target.value)} placeholder={pay.p2} required /></Field>
            </div>
            <SubmitButton variant="primary">Confirm payment</SubmitButton>
          </form>
        </Panel>

        {p.walletPayments.length > 0 && (
          <>
            <SectionTitle>Service payments</SectionTitle>
            <div className="stack-sm" style={{ marginBottom: '1.25rem' }}>
              {p.walletPayments.map((payItem) => (
                <Row key={payItem.id}>
                  <div><div className="row-title">{payItem.type}</div><div className="row-meta">{payItem.referenceNumber}</div></div>
                  <span className="row-amount">{payItem.formattedAmount ?? formatInr(payItem.amount)}</span>
                </Row>
              ))}
            </div>
          </>
        )}

        <div className="grid-2">
          <Panel glow className="stack-sm"><SectionTitle>Send money</SectionTitle>
            <form onSubmit={p.onSendP2P} className="stack-sm">
              <Field label="To username" id="p2p-to"><Input id="p2p-to" value={p.p2pToUsername} onChange={(e) => p.setP2pToUsername(e.target.value)} required /></Field>
              <Field label="Amount" id="p2p-amt"><Input id="p2p-amt" type="number" value={p.p2pAmount} onChange={(e) => p.setP2pAmount(e.target.value)} required /></Field>
              <SubmitButton variant="primary">Send</SubmitButton>
            </form>
          </Panel>
          <Panel glow className="stack-sm"><SectionTitle>Request money</SectionTitle>
            <form onSubmit={p.onRequestP2P} className="stack-sm">
              <Field label="From username" id="req-from"><Input id="req-from" value={p.requestFromUsername} onChange={(e) => p.setRequestFromUsername(e.target.value)} required /></Field>
              <Field label="Amount" id="req-amt"><Input id="req-amt" type="number" value={p.requestAmount} onChange={(e) => p.setRequestAmount(e.target.value)} required /></Field>
              <SubmitButton variant="secondary">Request</SubmitButton>
            </form>
          </Panel>
        </div>
        <SectionTitle>Requests</SectionTitle>
        <div className="stack-sm">
          {p.p2pRequests.length === 0 ? <EmptyState>No requests yet.</EmptyState> : p.p2pRequests.map((req) => {
            const isIncoming = req.toUsername === p.currentUsername;
            const isPending = req.status === 'PENDING';
            return (
              <Row key={req.id}>
                <div>
                  <div className="row-title">{isIncoming ? `From @${req.fromUsername}` : `To @${req.toUsername}`}
                    <span className={`badge ${req.status === 'ACCEPTED' ? 'badge-ok' : req.status === 'DECLINED' ? 'badge-no' : 'badge-pending'}`} style={{ marginLeft: 8 }}>{req.status}</span>
                  </div>
                  {req.note && <div className="row-meta">{req.note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="row-amount">{typeof req.amount === 'number' ? formatInr(req.amount) : req.formattedAmount}</span>
                  {isIncoming && isPending && (
                    <>
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => p.onAcceptRequest(req.id, req.amount)}>Accept</button>
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => p.onDeclineRequest(req.id)}>Decline</button>
                    </>
                  )}
                </div>
              </Row>
            );
          })}
        </div>
      </>
    );
  }

  return null;
}
