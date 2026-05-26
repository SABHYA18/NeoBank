import React, { useState, useEffect } from 'react';

// --- TYPE DEFINITIONS ---
interface Account {
  id: string;
  accountNumber: string;
  ownerName: string;
  type: 'SAVINGS' | 'CHECKING';
  balance: number;
  formattedBalance: string;
  status: 'ACTIVE' | 'SUSPENDED';
  currency: string;
}

interface Transaction {
  id: string;
  fromAccountNumber: string;
  fromOwnerName: string;
  toAccountNumber: string;
  toOwnerName: string;
  amount: number;
  formattedAmount: string;
  type: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER';
  status: 'SUCCESS' | 'FAILED';
  reference: string;
  description: string;
  createdAt: string;
  idempotencyKey: string;
}

interface LedgerEntry {
  id: string;
  accountNumber: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  transactionReference: string;
  createdAt: string;
}

export default function App() {
  // --- STATE ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ledger'>('dashboard');
  
  // App Mode State: Live vs Mock (simulated)
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([
    {
      id: 'acc-1',
      accountNumber: '9816273849',
      ownerName: 'Jane Doe',
      type: 'SAVINGS',
      balance: 14500.00,
      formattedBalance: '₹14,500.00',
      status: 'ACTIVE',
      currency: 'INR'
    },
    {
      id: 'acc-2',
      accountNumber: '0987654321',
      ownerName: 'Jane Doe',
      type: 'CHECKING',
      balance: 3800.00,
      formattedBalance: '₹3,800.00',
      status: 'ACTIVE',
      currency: 'INR'
    }
  ]);

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 'txn-1',
      fromAccountNumber: 'External',
      fromOwnerName: 'N/A',
      toAccountNumber: '9816273849',
      toOwnerName: 'Jane Doe',
      amount: 15000.00,
      formattedAmount: '₹15,000.00',
      type: 'DEPOSIT',
      status: 'SUCCESS',
      reference: 'TXN-E7C1F2B3A499',
      description: 'Initial salary load',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      idempotencyKey: 'salary-idem-key-01'
    },
    {
      id: 'txn-2',
      fromAccountNumber: '9816273849',
      fromOwnerName: 'Jane Doe',
      toAccountNumber: 'External',
      toOwnerName: 'N/A',
      amount: 500.00,
      formattedAmount: '₹500.00',
      type: 'WITHDRAW',
      status: 'SUCCESS',
      reference: 'TXN-F9D1E8C2B3A1',
      description: 'Cash withdrawal ATM',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      idempotencyKey: 'atm-idem-key-01'
    }
  ]);

  // Ledger Entries State (Double-Entry visual audit log)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([
    {
      id: 'led-1',
      accountNumber: '9816273849',
      type: 'CREDIT',
      amount: 15000.00,
      balanceAfter: 15000.00,
      transactionReference: 'TXN-E7C1F2B3A499',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'led-2',
      accountNumber: '9816273849',
      type: 'DEBIT',
      amount: 500.00,
      balanceAfter: 14500.00,
      transactionReference: 'TXN-F9D1E8C2B3A1',
      createdAt: new Date(Date.now() - 3600000).toISOString()
    }
  ]);

  // Used idempotency keys tracking
  const [processedIdempotencyKeys, setProcessedIdempotencyKeys] = useState<Set<string>>(
    new Set(['salary-idem-key-01', 'atm-idem-key-01'])
  );

  // Forms Input State
  const [newAccType, setNewAccType] = useState<'SAVINGS' | 'CHECKING'>('SAVINGS');
  const [activeAccId, setActiveAccId] = useState<string>('acc-1');
  
  // Transaction action forms
  const [txnType, setTxnType] = useState<'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'>('TRANSFER');
  const [targetAccountNum, setTargetAccountNum] = useState<string>('');
  const [txnAmount, setTxnAmount] = useState<string>('');
  const [txnDesc, setTxnDesc] = useState<string>('');
  const [txnIdemKey, setTxnIdemKey] = useState<string>('');

  // --- REGENERATE IDEMPOTENCY KEY ---
  const regenerateIdemKey = () => {
    setTxnIdemKey('IDEM-' + Math.random().toString(36).substring(2, 9).toUpperCase());
  };

  useEffect(() => {
    regenerateIdemKey();
  }, [txnType]);

  // --- SYSTEM NOTIFICATIONS (TOASTS) ---
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- CONNECTIVITY MONITOR ---
  useEffect(() => {
    if (isLiveMode) {
      fetch('http://localhost:8080/api/v1/accounts')
        .then(() => {
          setBackendStatus('CONNECTED');
          showNotification('Successfully connected to Live API', 'success');
        })
        .catch(() => {
          setBackendStatus('DISCONNECTED');
          showNotification('Live backend unreachable. Using local simulator.', 'info');
          setIsLiveMode(false);
        });
    } else {
      setBackendStatus('DISCONNECTED');
    }
  }, [isLiveMode]);

  // --- 1. OPEN ACCOUNT ACTION ---
  const handleOpenAccount = (e: React.FormEvent) => {
    e.preventDefault();

    const randomAccNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAccount: Account = {
      id: 'acc-' + Math.random().toString(36).substring(2, 9),
      accountNumber: randomAccNum,
      ownerName: 'Jane Doe',
      type: newAccType,
      balance: 0.00,
      formattedBalance: '₹0.00',
      status: 'ACTIVE',
      currency: 'INR'
    };

    setAccounts(prev => [...prev, newAccount]);
    showNotification(`Opened ${newAccType} account [${randomAccNum}]`, 'success');
  };

  // --- 2. EXECUTE TRANSACTION ACTION ---
  const handleExecuteTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(txnAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showNotification('Enter a valid positive amount.', 'error');
      return;
    }

    if (!txnIdemKey.trim()) {
      showNotification('Idempotency key is required.', 'error');
      return;
    }

    // Idempotency Lock
    if (processedIdempotencyKeys.has(txnIdemKey)) {
      const previousTx = transactions.find(t => t.idempotencyKey === txnIdemKey);
      if (previousTx) {
        showNotification(
          `Idempotency Match: Retransmitted payload verified. Ref: ${previousTx.reference}`,
          'info'
        );
        return;
      }
      showNotification('Conflict: Key already used.', 'error');
      return;
    }

    const sourceAcc = accounts.find(a => a.id === activeAccId);
    if (!sourceAcc) {
      showNotification('Source account missing.', 'error');
      return;
    }

    const reference = 'TXN-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const nowTimestamp = new Date().toISOString();

    // Deposit Simulation
    if (txnType === 'DEPOSIT') {
      const updatedAccounts = accounts.map(acc => {
        if (acc.id === sourceAcc.id) {
          const newBal = acc.balance + amountNum;
          return { ...acc, balance: newBal, formattedBalance: `₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
        }
        return acc;
      });

      const newTx: Transaction = {
        id: 'txn-' + Math.random().toString(36).substring(2, 9),
        fromAccountNumber: 'External',
        fromOwnerName: 'N/A',
        toAccountNumber: sourceAcc.accountNumber,
        toOwnerName: sourceAcc.ownerName,
        amount: amountNum,
        formattedAmount: `₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        reference,
        description: txnDesc || 'External Deposit',
        createdAt: nowTimestamp,
        idempotencyKey: txnIdemKey
      };

      const newLedger: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        accountNumber: sourceAcc.accountNumber,
        type: 'CREDIT',
        amount: amountNum,
        balanceAfter: sourceAcc.balance + amountNum,
        transactionReference: reference,
        createdAt: nowTimestamp
      };

      setAccounts(updatedAccounts);
      setTransactions(prev => [newTx, ...prev]);
      setLedgerEntries(prev => [newLedger, ...prev]);
      setProcessedIdempotencyKeys(prev => {
        const next = new Set(prev);
        next.add(txnIdemKey);
        return next;
      });

      showNotification(`Deposited ₹${amountNum.toLocaleString('en-IN')}`, 'success');
    }

    // Withdrawal Simulation
    if (txnType === 'WITHDRAW') {
      if (sourceAcc.balance < amountNum) {
        showNotification('Insufficient balance.', 'error');
        return;
      }

      const updatedAccounts = accounts.map(acc => {
        if (acc.id === sourceAcc.id) {
          const newBal = acc.balance - amountNum;
          return { ...acc, balance: newBal, formattedBalance: `₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
        }
        return acc;
      });

      const newTx: Transaction = {
        id: 'txn-' + Math.random().toString(36).substring(2, 9),
        fromAccountNumber: sourceAcc.accountNumber,
        fromOwnerName: sourceAcc.ownerName,
        toAccountNumber: 'External',
        toOwnerName: 'N/A',
        amount: amountNum,
        formattedAmount: `₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        type: 'WITHDRAW',
        status: 'SUCCESS',
        reference,
        description: txnDesc || 'Cash withdrawal',
        createdAt: nowTimestamp,
        idempotencyKey: txnIdemKey
      };

      const newLedger: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        accountNumber: sourceAcc.accountNumber,
        type: 'DEBIT',
        amount: amountNum,
        balanceAfter: sourceAcc.balance - amountNum,
        transactionReference: reference,
        createdAt: nowTimestamp
      };

      setAccounts(updatedAccounts);
      setTransactions(prev => [newTx, ...prev]);
      setLedgerEntries(prev => [newLedger, ...prev]);
      setProcessedIdempotencyKeys(prev => {
        const next = new Set(prev);
        next.add(txnIdemKey);
        return next;
      });

      showNotification(`Withdrew ₹${amountNum.toLocaleString('en-IN')}`, 'success');
    }

    // Transfer Simulation
    if (txnType === 'TRANSFER') {
      if (!targetAccountNum.trim()) {
        showNotification('Recipient account is required.', 'error');
        return;
      }

      if (sourceAcc.accountNumber === targetAccountNum) {
        showNotification('Self-transfer is blocked.', 'error');
        return;
      }

      if (sourceAcc.balance < amountNum) {
        showNotification('Insufficient balance.', 'error');
        return;
      }

      const targetAccIndex = accounts.findIndex(a => a.accountNumber === targetAccountNum);
      const targetExists = targetAccIndex !== -1;
      const targetOwner = targetExists ? accounts[targetAccIndex].ownerName : 'External Recipient';

      const updatedAccounts = accounts.map(acc => {
        if (acc.id === sourceAcc.id) {
          const newBal = acc.balance - amountNum;
          return { ...acc, balance: newBal, formattedBalance: `₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
        }
        if (targetExists && acc.accountNumber === targetAccountNum) {
          const newBal = acc.balance + amountNum;
          return { ...acc, balance: newBal, formattedBalance: `₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
        }
        return acc;
      });

      const newTx: Transaction = {
        id: 'txn-' + Math.random().toString(36).substring(2, 9),
        fromAccountNumber: sourceAcc.accountNumber,
        fromOwnerName: sourceAcc.ownerName,
        toAccountNumber: targetAccountNum,
        toOwnerName: targetOwner,
        amount: amountNum,
        formattedAmount: `₹${amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
        type: 'TRANSFER',
        status: 'SUCCESS',
        reference,
        description: txnDesc || 'Transfer',
        createdAt: nowTimestamp,
        idempotencyKey: txnIdemKey
      };

      const senderLedger: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        accountNumber: sourceAcc.accountNumber,
        type: 'DEBIT',
        amount: amountNum,
        balanceAfter: sourceAcc.balance - amountNum,
        transactionReference: reference,
        createdAt: nowTimestamp
      };

      const recipientLedger: LedgerEntry = {
        id: 'led-' + Math.random().toString(36).substring(2, 9),
        accountNumber: targetAccountNum,
        type: 'CREDIT',
        amount: amountNum,
        balanceAfter: targetExists ? accounts[targetAccIndex].balance + amountNum : amountNum,
        transactionReference: reference,
        createdAt: nowTimestamp
      };

      setAccounts(updatedAccounts);
      setTransactions(prev => [newTx, ...prev]);
      setLedgerEntries(prev => [senderLedger, recipientLedger, ...prev]);
      setProcessedIdempotencyKeys(prev => {
        const next = new Set(prev);
        next.add(txnIdemKey);
        return next;
      });

      showNotification(`Transferred ₹${amountNum.toLocaleString('en-IN')}`, 'success');
    }

    setTxnAmount('');
    setTxnDesc('');
    setTargetAccountNum('');
    regenerateIdemKey();
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary antialiased">
      
      {/* --- HIGH CONTRAST TOP-LEFT TOAST BANNER --- */}
      {notification && (
        <div 
          className="fixed top-6 left-6 z-[99999] px-5 py-3.5 rounded-lg border shadow-lg text-sm font-medium tracking-tight animate-slide-left flex items-center gap-3 bg-zinc-900 text-zinc-50 border-zinc-800"
          style={{
            borderColor: notification.type === 'success' ? '#10b981' : notification.type === 'error' ? '#ef4444' : '#2997ff',
            boxShadow: notification.type === 'success' ? '0 0 15px rgba(16, 185, 129, 0.2)' : notification.type === 'error' ? '0 0 15px rgba(239, 68, 68, 0.2)' : '0 0 15px rgba(41, 151, 255, 0.2)'
          }}
        >
          <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${
            notification.type === 'success' ? 'bg-emerald-400' : notification.type === 'error' ? 'bg-red-400' : 'bg-cyan-400'
          }`}></span>
          {notification.message}
        </div>
      )}

      {/* --- MINIMAL HEADER --- */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-glass/80 border-b border-zinc-200/40 dark:border-zinc-800/40">
        <div className="max-w-3xl w-full mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base font-semibold tracking-tight">NEOBANK</span>
            <span className="text-[10px] font-semibold tracking-widest text-text-secondary uppercase">Super-App</span>
          </div>

          {/* Clean Navigation Links - Slightly Bigger Font */}
          <nav className="flex gap-10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-sm font-medium tracking-tight transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' ? 'text-text-primary scale-105' : 'text-text-secondary hover:text-text-primary hover:scale-105'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`text-sm font-medium tracking-tight transition-all duration-200 cursor-pointer ${
                activeTab === 'transactions' ? 'text-text-primary scale-105' : 'text-text-secondary hover:text-text-primary hover:scale-105'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`text-sm font-medium tracking-tight transition-all duration-200 cursor-pointer ${
                activeTab === 'ledger' ? 'text-text-primary scale-105' : 'text-text-secondary hover:text-text-primary hover:scale-105'
              }`}
            >
              Ledger
            </button>
          </nav>

          {/* Minimal Connectivity Switch */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsLiveMode(!isLiveMode)}
              className={`text-[10px] font-semibold tracking-wide uppercase px-3 py-1.5 rounded-sm border transition-all duration-300 cursor-pointer ${
                isLiveMode 
                  ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan bg-zinc-950/25'
                  : 'border-zinc-200/50 dark:border-zinc-800/50 bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-text-secondary'
              }`}
            >
              {isLiveMode ? `Live: ${backendStatus}` : 'Simulation'}
            </button>
          </div>
        </div>
      </header>

      {/* --- CORE WORKSPACE --- */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-6 py-16 flex flex-col gap-14">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-14 animate-fade-in">
            
            {/* Massive Net Worth Title (Apple Spec) with extremely subtle glow pulse */}
            <div className="text-center py-8">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                Net Worth
              </span>
              <h1 className="text-6xl font-light tracking-tight text-text-primary mt-2 transition-all duration-500 hover:text-neon-cyan">
                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
            </div>

            {/* Flat Account Rows with Micro-thin borders & cyber cyan hover glows */}
            <div className="flex flex-col gap-5">
              <div className="flex justify-between items-center border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2.5">
                <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest">
                  Accounts
                </h3>
              </div>
              
              <div className="flex flex-col gap-3">
                {accounts.map(acc => (
                  <div 
                    key={acc.id} 
                    className="flex justify-between items-center px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-lg bg-bg-secondary hover:shadow-glow-cyan hover:border-neon-cyan/80 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm tracking-tight uppercase">{acc.type} ACCOUNT</span>
                        <span className="text-[10px] font-mono text-text-secondary bg-bg-primary border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 px-2 py-0.5 rounded-sm">
                          {acc.accountNumber}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold tracking-tight text-text-primary">{acc.formattedBalance}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flat open account form with micro-pulse border */}
            <div className="border-t border-zinc-200/40 dark:border-zinc-800/40 pt-10 mt-4">
              <form onSubmit={handleOpenAccount} className="max-w-xs mx-auto flex flex-col gap-5">
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as 'SAVINGS' | 'CHECKING')}
                  className="w-full text-sm px-4.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary cursor-pointer hover:border-neon-cyan focus:border-neon-cyan transition-all duration-300"
                >
                  <option value="SAVINGS">Open Savings Account</option>
                  <option value="CHECKING">Open Checking Account</option>
                </select>
                <button 
                  type="submit" 
                  className="w-full inline-flex items-center justify-center font-medium text-xs px-5 py-3 bg-text-primary text-bg-primary hover:bg-zinc-800 hover:shadow-glow-cyan hover:border-neon-cyan border border-transparent rounded-md transition-all duration-300 cursor-pointer"
                >
                  Create Instantly
                </button>
              </form>
            </div>

          </div>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="flex flex-col gap-14 animate-fade-in">
            
            {/* Quick Action form with subtle violet glow */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2.5">
                New Action
              </h3>

              <div className="border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-lg p-7 bg-bg-secondary hover:shadow-glow-violet hover:border-neon-violet/85 focus-within:shadow-glow-violet focus-within:border-neon-violet/85 transition-all duration-300">
                <form onSubmit={handleExecuteTransaction} className="flex flex-col gap-6">
                  
                  {/* Account Selection */}
                  <div className="grid grid-cols-2 gap-5">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">From Account</label>
                      <select
                        value={activeAccId}
                        onChange={(e) => setActiveAccId(e.target.value)}
                        className="text-sm px-3.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary cursor-pointer focus:border-neon-violet transition-all"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.type} ({acc.accountNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Action Type</label>
                      <select
                        value={txnType}
                        onChange={(e) => setTxnType(e.target.value as any)}
                        className="text-sm px-3.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary cursor-pointer focus:border-neon-violet transition-all"
                      >
                        <option value="TRANSFER">Transfer Funds</option>
                        <option value="DEPOSIT">Deposit Cash</option>
                        <option value="WITHDRAW">Withdraw ATM</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Recipient Field */}
                  {txnType === 'TRANSFER' && (
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Recipient Account Number</label>
                      <input
                        type="text"
                        value={targetAccountNum}
                        onChange={(e) => setTargetAccountNum(e.target.value)}
                        placeholder="e.g. 0987654321"
                        className="text-sm px-3.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary focus:border-neon-violet transition-all"
                        required
                      />
                    </div>
                  )}

                  {/* Amount and Description */}
                  <div className="grid grid-cols-3 gap-5">
                    <div className="col-span-1 flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Amount (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={txnAmount}
                        onChange={(e) => setTxnAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-sm px-3.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary focus:border-neon-violet transition-all"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-2">
                      <label className="text-[10px] font-semibold text-text-secondary uppercase tracking-widest">Memo / Description</label>
                      <input
                        type="text"
                        value={txnDesc}
                        onChange={(e) => setTxnDesc(e.target.value)}
                        placeholder="Transaction note"
                        className="text-sm px-3.5 py-3 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-md text-text-primary focus:border-neon-violet transition-all"
                      />
                    </div>
                  </div>

                  {/* Custom Idempotency key */}
                  <div className="flex items-center justify-between border-t border-zinc-200/40 dark:border-zinc-800/40 pt-5 text-[11px]">
                    <span className="text-text-secondary tracking-widest uppercase">IDEMPOTENCY LOCK:</span>
                    <span className="font-mono text-neon-violet bg-bg-primary px-3 py-1 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-sm tracking-wide text-xs">
                      {txnIdemKey}
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full inline-flex items-center justify-center font-medium text-xs px-5 py-3 bg-text-primary text-bg-primary hover:bg-zinc-800 hover:shadow-glow-violet hover:border-neon-violet border border-transparent rounded-md transition-all duration-300 cursor-pointer"
                  >
                    Execute Transaction
                  </button>

                </form>
              </div>
            </div>

            {/* Flat Transaction feed with slide-in animation */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2.5">
                Activity Stream
              </h3>

              <div className="flex flex-col gap-3.5">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary rounded-lg hover:shadow-glow-dark hover:border-text-secondary transition-all duration-200 animate-slide-in-up"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-xs text-text-primary uppercase tracking-tight">{tx.type}</span>
                        <span className="text-[10px] font-mono text-text-secondary bg-bg-primary px-2 py-0.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-sm">
                          {tx.reference}
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary mt-1">
                        {tx.description}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-bold tracking-tight text-text-primary">
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.formattedAmount}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* TAB 3: AUDITED CORE LEDGER */}
        {activeTab === 'ledger' && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div>
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2.5">
                Double-Entry Ledger Audit Log
              </h3>
            </div>

            {/* Table wrapper with elegant emerald/green glow backing & micro-thin borders */}
            <div className="flex flex-col border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-lg overflow-hidden bg-bg-secondary hover:shadow-glow-emerald hover:border-neon-emerald transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs font-medium text-text-secondary">
                  <thead>
                    <tr className="bg-bg-primary border-b border-zinc-200/40 dark:border-zinc-800/40 font-bold text-text-primary tracking-tight">
                      <th className="px-6 py-4">Entry</th>
                      <th className="px-6 py-4">Account</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Amount</th>
                      <th className="px-6 py-4">Balance After</th>
                      <th className="px-6 py-4">Audit Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40">
                    {ledgerEntries.map(led => (
                      <tr key={led.id} className="hover:bg-bg-primary transition-colors">
                        <td className="px-6 py-4 font-mono text-[11px]">{led.id}</td>
                        <td className="px-6 py-4 font-semibold text-text-primary">{led.accountNumber}</td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border-[0.5px] ${
                            led.type === 'CREDIT' ? 'border-zinc-200 bg-bg-primary text-text-primary' : 'border-zinc-300/60 bg-zinc-150 text-text-secondary'
                          }`}>
                            {led.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary text-[13px]">
                          {led.type === 'CREDIT' ? '+' : '-'}₹{led.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-bold text-text-primary text-[13px]">
                          ₹{led.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 font-mono text-[11px]">{led.transactionReference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 bg-bg-primary px-6 py-10 text-xs text-text-secondary mt-auto">
        <div className="max-w-3xl w-full mx-auto flex justify-between items-center">
          <div>
            © 2026 NeoBank Super-App. Ultra-Minimalist Cyber Design.
          </div>
          <div className="flex gap-5">
            <span className="hover:text-text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-text-primary cursor-pointer transition-colors">Status</span>
            <span className="hover:text-text-primary cursor-pointer transition-colors">APIs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
