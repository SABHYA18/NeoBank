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
  // --- AUTH STATES ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentUser, setCurrentUser] = useState<any | null>(null);

  // Authentication Form Fields
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');

  const [signupFullName, setSignupFullName] = useState<string>('');
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupInitialAccountType, setSignupInitialAccountType] = useState<'SAVINGS' | 'CHECKING'>('SAVINGS');

  // Local simulated registry of users
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([
    {
      fullName: "Jane Doe",
      email: "jane@neobank.com",
      username: "jane_doe",
      phone: "9876543210",
      password: "Password123!",
      accounts: [
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
      ]
    }
  ]);

  // --- DASHBOARD STATES ---
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'ledger' | 'wallet'>('dashboard');
  
  // App Mode State: Live vs Mock (simulated)
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'DISCONNECTED' | 'CONNECTED'>('DISCONNECTED');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Accounts state (Defaults to empty until authenticated)
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Transactions State (Defaults to empty until authenticated)
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Ledger Entries State (Double-Entry visual audit log)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);

  // Used idempotency keys tracking
  const [processedIdempotencyKeys, setProcessedIdempotencyKeys] = useState<Set<string>>(new Set());

  // --- WALLET & P2P STATES ---
  const [wallet, setWallet] = useState<any | null>(null);
  const [p2pRequests, setP2pRequests] = useState<any[]>([
    {
      id: 'req-mock-1',
      fromUsername: 'bobby_32',
      fromFullName: 'Bobby Smith',
      toUsername: 'jane_doe',
      toFullName: 'Jane Doe',
      amount: 450.00,
      formattedAmount: '₹450.00',
      status: 'PENDING',
      note: 'Dinner share last night',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'req-mock-2',
      fromUsername: 'alice_w',
      fromFullName: 'Alice Wonder',
      toUsername: 'jane_doe',
      toFullName: 'Jane Doe',
      amount: 1200.00,
      formattedAmount: '₹1,200.00',
      status: 'PENDING',
      note: 'Concert ticket booking refund',
      createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
    }
  ]);

  // JWT Token for Live Mode APIs
  const [token, setToken] = useState<string>('');

  // Forms Input State
  const [newAccType, setNewAccType] = useState<'SAVINGS' | 'CHECKING'>('SAVINGS');

  // --- ADD BALANCE CUSTOM MODAL STATES ---
  const [isAddBalanceOpen, setIsAddBalanceOpen] = useState<boolean>(false);
  const [addBalanceAccId, setAddBalanceAccId] = useState<string | null>(null);
  const [addBalanceTypeName, setAddBalanceTypeName] = useState<string>('');
  const [addBalanceAmount, setAddBalanceAmount] = useState<string>('');
  const [activeAccId, setActiveAccId] = useState<string>('acc-1');
  
  // Transaction action forms
  const [txnType, setTxnType] = useState<'DEPOSIT' | 'WITHDRAW' | 'TRANSFER'>('TRANSFER');
  const [targetAccountNum, setTargetAccountNum] = useState<string>('');
  const [txnAmount, setTxnAmount] = useState<string>('');
  const [txnDesc, setTxnDesc] = useState<string>('');
  const [txnIdemKey, setTxnIdemKey] = useState<string>('');

  // Wallet form inputs
  const [linkAccountId, setLinkAccountId] = useState<string>('');
  const [initialLoadAmount, setInitialLoadAmount] = useState<string>('1500');
  const [walletRechargeAmount, setWalletRechargeAmount] = useState<string>('');
  
  // P2P Send / Request inputs
  const [p2pToUsername, setP2pToUsername] = useState<string>('');
  const [p2pAmount, setP2pAmount] = useState<string>('');
  const [p2pNote, setP2pNote] = useState<string>('');

  const [requestFromUsername, setRequestFromUsername] = useState<string>('');
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [requestNote, setRequestNote] = useState<string>('');

  // --- REGENERATE IDEMPOTENCY KEY ---
  const regenerateIdemKey = () => {
    setTxnIdemKey('IDEM-' + Math.random().toString(36).substring(2, 9).toUpperCase());
  };

  useEffect(() => {
    regenerateIdemKey();
  }, [txnType]);

  useEffect(() => {
    if (accounts.length > 0 && !linkAccountId) {
      setLinkAccountId(accounts[0].id);
    }
  }, [accounts]);

  // --- SYSTEM NOTIFICATIONS (TOASTS) ---
  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // --- AUTO SECURED LIVE MODE CONNECTIVITY MONITOR ---
  // --- DYNAMIC SELECTOR SAFETY HOCK ---
  useEffect(() => {
    if (accounts.length > 0) {
      if (!accounts.some(a => a.id === activeAccId)) {
        setActiveAccId(accounts[0].id);
      }
    } else {
      setActiveAccId('');
    }
  }, [accounts, activeAccId]);

  // --- CONNECTIVITY SWITCH ---
  const handleToggleLiveMode = () => {
    setIsLiveMode(prev => {
      const next = !prev;
      setIsAuthenticated(false);
      setCurrentUser(null);
      setToken('');
      setAccounts([]);
      setTransactions([]);
      setLedgerEntries([]);
      setWallet(null);
      setP2pRequests([]);
      setLoginEmail('');
      setLoginPassword('');
      if (next) {
        showNotification("Switched to Live Monolith. Please sign in or sign up.", "info");
      } else {
        showNotification("Switched to Local Simulator. Hint: jane@neobank.com / Password123!", "info");
      }
      return next;
    });
  };

  // --- MANUAL LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword) {
      showNotification("Please enter both email and password.", "error");
      return;
    }

    if (isLiveMode) {
      try {
        const res = await fetch('http://localhost:8081/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginEmail.trim(), password: loginPassword })
        });
        const json = await res.json();
        if (json.success && json.data && json.data.accessToken) {
          setToken(json.data.accessToken);
          setBackendStatus('CONNECTED');
          setIsAuthenticated(true);
          setCurrentUser(json.data.user);
          showNotification(`Welcome back, ${json.data.user.fullName}!`, "success");
        } else {
          showNotification(json.message || "Invalid credentials.", "error");
        }
      } catch (err) {
        showNotification("Backend authentication unreachable. Spring Boot running on 8081?", "error");
      }
      return;
    }

    // Simulated Auth Login
    const userMatch = registeredUsers.find(u => u.email.toLowerCase() === loginEmail.toLowerCase().trim() && u.password === loginPassword);
    if (userMatch) {
      setIsAuthenticated(true);
      setCurrentUser(userMatch);
      setAccounts(userMatch.accounts || []);
      setTransactions([]);
      setLedgerEntries([]);
      setWallet(null);
      setP2pRequests([]);
      showNotification(`Welcome back, ${userMatch.fullName}! (Simulation)`, "success");
    } else {
      showNotification("Invalid credentials. Hint: jane@neobank.com / Password123!", "error");
    }
  };

  // --- MANUAL SIGNUP HANDLER ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupFullName.trim() || !signupUsername.trim() || !signupEmail.trim() || !signupPhone.trim() || !signupPassword) {
      showNotification("Please fill in all fields.", "error");
      return;
    }

    if (isLiveMode) {
      try {
        // Step A: Signup User
        const signupRes = await fetch('http://localhost:8081/api/v1/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: signupFullName.trim(),
            email: signupEmail.trim(),
            username: signupUsername.trim(),
            phone: signupPhone.trim(),
            password: signupPassword
          })
        });
        const signupJson = await signupRes.json();
        if (!signupJson.success) {
          showNotification(signupJson.message || "Registration failed.", "error");
          return;
        }

        // Step B: Auto-Login
        const loginRes = await fetch('http://localhost:8081/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: signupEmail.trim(), password: signupPassword })
        });
        const loginJson = await loginRes.json();
        if (loginJson.success && loginJson.data && loginJson.data.accessToken) {
          const jwtToken = loginJson.data.accessToken;
          setToken(jwtToken);
          setBackendStatus('CONNECTED');

          // Step C: Auto-Create Initial Bank Account
          const accRes = await fetch('http://localhost:8081/api/v1/accounts', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify({ type: signupInitialAccountType })
          });
          const accJson = await accRes.json();
          if (accJson.success) {
            setAccounts([accJson.data]);
            setIsAuthenticated(true);
            setCurrentUser(loginJson.data.user);
            showNotification("Account created & initial bank account provisioned successfully!", "success");
            
            // Clean inputs
            setSignupFullName('');
            setSignupUsername('');
            setSignupEmail('');
            setSignupPhone('');
            setSignupPassword('');
          } else {
            showNotification("User registered but initial account failed. Log in to create manually.", "info");
            setIsAuthenticated(true);
            setCurrentUser(loginJson.data.user);
          }
        }
      } catch (err) {
        showNotification("Server connectivity lost during registration.", "error");
      }
      return;
    }

    // Simulated Auth Signup
    const exists = registeredUsers.some(u => u.email.toLowerCase() === signupEmail.toLowerCase().trim() || u.username.toLowerCase() === signupUsername.toLowerCase().trim());
    if (exists) {
      showNotification("Email or Username already taken in simulated database.", "error");
      return;
    }

    const mockAccNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const initialAccount: Account = {
      id: 'acc-' + Math.random().toString(36).substring(2, 9),
      accountNumber: mockAccNum,
      ownerName: signupFullName.trim(),
      type: signupInitialAccountType,
      balance: 5000.00, // Funded with ₹5,000 for instant simulated use!
      formattedBalance: '₹5,000.00',
      status: 'ACTIVE',
      currency: 'INR'
    };

    const newUser = {
      fullName: signupFullName.trim(),
      email: signupEmail.trim(),
      username: signupUsername.trim(),
      phone: signupPhone.trim(),
      password: signupPassword,
      accounts: [initialAccount]
    };

    setRegisteredUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    setAccounts([initialAccount]);
    setTransactions([]);
    setLedgerEntries([]);
    setWallet(null);
    setP2pRequests([]);
    setIsAuthenticated(true);
    showNotification("Simulated registration successful! Pre-funded ₹5,000.", "success");

    // Clean inputs
    setSignupFullName('');
    setSignupUsername('');
    setSignupEmail('');
    setSignupPhone('');
    setSignupPassword('');
  };

  // --- MANUAL SIGNOUT HANDLER ---
  const handleSignOut = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setToken('');
    setAccounts([]);
    setTransactions([]);
    setLedgerEntries([]);
    setWallet(null);
    setP2pRequests([]);
    setLoginEmail('');
    setLoginPassword('');
    showNotification("Logged out successfully.", "info");
  };

  // --- SYNC LIVE MONOLITH DATA ---
  useEffect(() => {
    if (isLiveMode && token) {
      // 1. Fetch Accounts
      fetch('http://localhost:8081/api/v1/accounts', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAccounts(json.data);
        }
      })
      .catch(err => console.error("Error loading accounts:", err));

      // 2. Fetch Wallet
      fetch('http://localhost:8081/api/v1/payflow/wallet', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (res.status === 404) {
          setWallet(null);
          return null;
        }
        return res.json();
      })
      .then(json => {
        if (json && json.success) {
          setWallet(json.data);
        }
      })
      .catch(err => console.error("Error loading wallet:", err));

      // 3. Fetch P2P Requests Feed
      fetch('http://localhost:8081/api/v1/payflow/requests', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setP2pRequests(json.data);
        }
      })
      .catch(err => console.error("Error loading requests:", err));
    }
  }, [isLiveMode, token, activeTab]);

  // Keep newAccType in sync with the first available option
  useEffect(() => {
    const hasSavings = accounts.some(acc => acc.type === 'SAVINGS');
    const hasChecking = accounts.some(acc => acc.type === 'CHECKING');
    if (hasSavings && !hasChecking) {
      setNewAccType('CHECKING');
    } else if (!hasSavings && hasChecking) {
      setNewAccType('SAVINGS');
    }
  }, [accounts]);

  // --- 1. OPEN ACCOUNT ACTION ---
  const handleOpenAccount = (e: React.FormEvent) => {
    e.preventDefault();

    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/accounts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ type: newAccType })
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAccounts(prev => [...prev, json.data]);
          showNotification(`Opened ${newAccType} account [${json.data.accountNumber}]`, 'success');
        } else {
          showNotification(json.message || "Failed to open account", "error");
        }
      })
      .catch(() => showNotification("Failed to open live account.", "error"));
      return;
    }

    const randomAccNum = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const newAccount: Account = {
      id: 'acc-' + Math.random().toString(36).substring(2, 9),
      accountNumber: randomAccNum,
      ownerName: currentUser?.fullName || 'Jane Doe',
      type: newAccType,
      balance: 0.00,
      formattedBalance: '₹0.00',
      status: 'ACTIVE',
      currency: 'INR'
    };

    setAccounts(prev => [...prev, newAccount]);
    showNotification(`Opened ${newAccType} account [${randomAccNum}]`, 'success');
  };

  // --- 1.5 ADD BALANCE MODAL HANDLERS ---
  const triggerAddBalanceModal = (accountId: string, typeName: string) => {
    setAddBalanceAccId(accountId);
    setAddBalanceTypeName(typeName);
    setAddBalanceAmount('');
    setIsAddBalanceOpen(true);
  };

  const handleAddBalanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addBalanceAccId) return;

    const newBal = parseFloat(addBalanceAmount);
    if (isNaN(newBal) || newBal < 0) {
      showNotification("Please enter a valid non-negative number.", "error");
      return;
    }

    if (isLiveMode) {
      fetch(`http://localhost:8081/api/v1/accounts/${addBalanceAccId}/balance?balance=${newBal}`, {
        method: 'PUT',
        headers: { 
          'Authorization': `Bearer ${token}`
        }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setAccounts(prev => prev.map(acc => acc.id === addBalanceAccId ? json.data : acc));
          showNotification(`Successfully added balance to ${addBalanceTypeName} account! New Balance: ₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
          setIsAddBalanceOpen(false);
        } else {
          showNotification(json.message || "Failed to update balance", "error");
        }
      })
      .catch(() => showNotification("Failed to update balance on live server.", "error"));
      return;
    }

    // Simulated Mode
    setAccounts(prev => prev.map(acc => {
      if (acc.id === addBalanceAccId) {
        return {
          ...acc,
          balance: newBal,
          formattedBalance: `₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
        };
      }
      return acc;
    }));
    showNotification(`Successfully added balance to ${addBalanceTypeName} account! New Balance: ₹${newBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 'success');
    setIsAddBalanceOpen(false);
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

    if (isLiveMode) {
      const endpoint = txnType === 'DEPOSIT' ? 'deposit' : txnType === 'WITHDRAW' ? 'withdraw' : 'transfer';
      const bodyPayload: any = {
        amount: amountNum,
        description: txnDesc || `${txnType} action`,
        idempotencyKey: txnIdemKey
      };

      if (txnType === 'TRANSFER') {
        bodyPayload.fromAccountId = activeAccId;
        bodyPayload.toAccountNumber = targetAccountNum;
      } else {
        bodyPayload.accountId = activeAccId;
      }

      fetch(`http://localhost:8081/api/v1/transactions/${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(bodyPayload)
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          showNotification(`${txnType} completed successfully!`, 'success');
          // Reload account details
          fetch('http://localhost:8081/api/v1/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setAccounts(data.data); });
          
          setTxnAmount('');
          setTxnDesc('');
          setTargetAccountNum('');
          regenerateIdemKey();
        } else {
          showNotification(json.message || "Transaction failed.", "error");
        }
      })
      .catch(() => showNotification("Failed to send transaction.", "error"));
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

  // --- 3. PAYFLOW WALLET & P2P ACTIONS ---

  // A. Initialize Wallet
  const handleInitializeWallet = (e: React.FormEvent) => {
    e.preventDefault();

    const loadAmt = parseFloat(initialLoadAmount);
    if (isNaN(loadAmt) || loadAmt < 1000) {
      showNotification("Initialization load must be at least ₹1,000.00.", "error");
      return;
    }

    const linkedAcc = accounts.find(a => a.id === linkAccountId);
    if (!linkedAcc) {
      showNotification("Please select a valid account to link.", "error");
      return;
    }

    if (linkedAcc.balance < loadAmt) {
      showNotification("Insufficient balance in the chosen bank account.", "error");
      return;
    }

    if (isLiveMode) {
      fetch(`http://localhost:8081/api/v1/payflow/wallet/initialize?accountId=${linkAccountId}&initialAmount=${loadAmt}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setWallet(json.data);
          showNotification("Wallet initialized on Live Monolith!", "success");
          
          // Re-sync accounts
          fetch('http://localhost:8081/api/v1/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setAccounts(data.data); });
        } else {
          showNotification(json.message || "Initialization failed.", "error");
        }
      })
      .catch(() => showNotification("Failed to send live initialization request.", "error"));
      return;
    }

    // Local Simulation
    const updatedAccounts = accounts.map(acc => {
      if (acc.id === linkedAcc.id) {
        const nextBal = acc.balance - loadAmt;
        return { ...acc, balance: nextBal, formattedBalance: `₹${nextBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
      }
      return acc;
    });

    const mockWallet = {
      id: 'wallet-' + Math.random().toString(36).substring(2, 9),
      username: 'jane_doe',
      ownerName: 'Jane Doe',
      accountId: linkedAcc.id,
      accountNumber: linkedAcc.accountNumber,
      balance: loadAmt,
      currency: 'INR',
      active: true
    };

    setAccounts(updatedAccounts);
    setWallet(mockWallet);
    showNotification(`Wallet successfully activated and linked! Initial load: ₹${loadAmt.toLocaleString('en-IN')}`, 'success');
  };

  // B. Recharge Wallet
  const handleRechargeWallet = (e: React.FormEvent) => {
    e.preventDefault();

    const loadAmt = parseFloat(walletRechargeAmount);
    if (isNaN(loadAmt) || loadAmt <= 0) {
      showNotification("Enter a valid positive amount to recharge.", "error");
      return;
    }

    if (isLiveMode) {
      fetch(`http://localhost:8081/api/v1/payflow/wallet/recharge?amount=${loadAmt}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setWallet(json.data);
          showNotification("Wallet recharge successful!", "success");
          
          // Re-sync accounts
          fetch('http://localhost:8081/api/v1/accounts', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setAccounts(data.data); });
          
          setWalletRechargeAmount('');
        } else {
          showNotification(json.message || "Recharge failed.", "error");
        }
      })
      .catch(() => showNotification("Failed to send live recharge.", "error"));
      return;
    }

    // Local Simulation
    const linkedAcc = accounts.find(a => a.id === wallet.accountId);
    if (!linkedAcc || linkedAcc.balance < loadAmt) {
      showNotification("Insufficient balance in your connected bank account.", "error");
      return;
    }

    const updatedAccounts = accounts.map(acc => {
      if (acc.id === wallet.accountId) {
        const nextBal = acc.balance - loadAmt;
        return { ...acc, balance: nextBal, formattedBalance: `₹${nextBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` };
      }
      return acc;
    });

    setAccounts(updatedAccounts);
    setWallet((prev: any) => ({ ...prev, balance: prev.balance + loadAmt }));
    setWalletRechargeAmount('');
    showNotification(`Recharged ₹${loadAmt.toLocaleString('en-IN')} from connecting account!`, 'success');
  };

  // C. Send P2P Money
  const handleSendP2P = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(p2pAmount);
    if (isNaN(amt) || amt <= 0) {
      showNotification("Enter a valid amount.", "error");
      return;
    }

    if (!p2pToUsername.trim()) {
      showNotification("Recipient username is required.", "error");
      return;
    }

    // Enforce balance check
    if (wallet.balance - amt < 1000) {
      showNotification("Transaction rejected. Your wallet balance cannot drop below ₹1,000.00.", "error");
      return;
    }

    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/payflow/send', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          toUsername: p2pToUsername.trim(),
          amount: amt,
          note: p2pNote || "Direct P2P send"
        })
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          showNotification(`Money sent successfully to @${p2pToUsername}!`, "success");
          
          // Re-sync wallet & feed
          fetch('http://localhost:8081/api/v1/payflow/wallet', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setWallet(data.data); });

          fetch('http://localhost:8081/api/v1/payflow/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setP2pRequests(data.data); });

          setP2pToUsername('');
          setP2pAmount('');
          setP2pNote('');
        } else {
          showNotification(json.message || "Failed to send money.", "error");
        }
      })
      .catch(() => showNotification("Connection failed during transfer.", "error"));
      return;
    }

    // Local Simulation
    setWallet((prev: any) => ({ ...prev, balance: prev.balance - amt }));
    const newRequestItem = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      fromUsername: 'jane_doe',
      fromFullName: 'Jane Doe',
      toUsername: p2pToUsername,
      toFullName: p2pToUsername,
      amount: amt,
      formattedAmount: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      status: 'ACCEPTED',
      note: p2pNote || 'P2P Instant Send',
      createdAt: new Date().toISOString()
    };

    setP2pRequests(prev => [newRequestItem, ...prev]);
    setP2pToUsername('');
    setP2pAmount('');
    setP2pNote('');
    showNotification(`Sent ₹${amt.toLocaleString('en-IN')} to @${p2pToUsername}!`, 'success');
  };

  // D. Request P2P Money
  const handleRequestP2P = (e: React.FormEvent) => {
    e.preventDefault();

    const amt = parseFloat(requestAmount);
    if (isNaN(amt) || amt <= 0) {
      showNotification("Enter a valid amount.", "error");
      return;
    }

    if (!requestFromUsername.trim()) {
      showNotification("Target username is required.", "error");
      return;
    }

    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/payflow/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          fromUsername: requestFromUsername.trim(),
          amount: amt,
          note: requestNote || "Payment request"
        })
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          showNotification(`Requested ₹${amt.toLocaleString('en-IN')} from @${requestFromUsername}`, "success");
          
          fetch('http://localhost:8081/api/v1/payflow/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setP2pRequests(data.data); });

          setRequestFromUsername('');
          setRequestAmount('');
          setRequestNote('');
        } else {
          showNotification(json.message || "Failed to submit request.", "error");
        }
      })
      .catch(() => showNotification("Failed to send live request.", "error"));
      return;
    }

    // Local Simulation
    const newRequestItem = {
      id: 'req-' + Math.random().toString(36).substring(2, 9),
      fromUsername: 'jane_doe',
      fromFullName: 'Jane Doe',
      toUsername: requestFromUsername,
      toFullName: requestFromUsername,
      amount: amt,
      formattedAmount: `₹${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      status: 'PENDING',
      note: requestNote || 'Requested payment',
      createdAt: new Date().toISOString()
    };

    setP2pRequests(prev => [newRequestItem, ...prev]);
    setRequestFromUsername('');
    setRequestAmount('');
    setRequestNote('');
    showNotification(`Created payment request to @${requestFromUsername}!`, 'success');
  };

  // E. Accept Incoming request
  const handleAcceptRequest = (reqId: string, amount: number) => {
    if (wallet.balance - amount < 1000) {
      showNotification("Transaction rejected. Your wallet balance cannot drop below ₹1,000.00.", "error");
      return;
    }

    if (isLiveMode) {
      fetch(`http://localhost:8081/api/v1/payflow/requests/${reqId}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          showNotification("Payment request accepted and transferred!", "success");
          
          // Re-sync wallet & feed
          fetch('http://localhost:8081/api/v1/payflow/wallet', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setWallet(data.data); });

          fetch('http://localhost:8081/api/v1/payflow/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setP2pRequests(data.data); });
        } else {
          showNotification(json.message || "Failed to approve request.", "error");
        }
      })
      .catch(() => showNotification("Failed to accept request.", "error"));
      return;
    }

    // Local Simulation
    setWallet((prev: any) => ({ ...prev, balance: prev.balance - amount }));
    setP2pRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'ACCEPTED' } : r));
    showNotification("Request accepted! Funds transferred instantly.", "success");
  };

  // F. Decline Incoming request
  const handleDeclineRequest = (reqId: string) => {
    if (isLiveMode) {
      fetch(`http://localhost:8081/api/v1/payflow/requests/${reqId}/decline`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          showNotification("Payment request declined.", "info");
          
          fetch('http://localhost:8081/api/v1/payflow/requests', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(res => res.json())
          .then(data => { if (data.success) setP2pRequests(data.data); });
        } else {
          showNotification(json.message || "Failed to decline request.", "error");
        }
      })
      .catch(() => showNotification("Failed to decline request.", "error"));
      return;
    }

    // Local Simulation
    setP2pRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'DECLINED' } : r));
    showNotification("Request declined.", "info");
  };

  // --- AUTH PORTAL REDIRECT FOR UNAUTHENTICATED CUSTOMERS ---
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col min-h-screen text-text-primary antialiased justify-center items-center py-20 px-4 relative transition-colors duration-300">
        {/* --- HIGH CONTRAST TOP-LEFT TOAST BANNER --- */}
        {notification && (
          <div 
            className="fixed top-8 left-8 z-[99999] px-6 py-4.5 rounded-xl border shadow-2xl text-base font-semibold tracking-tight animate-slide-left flex items-center gap-3.5 bg-zinc-900 text-zinc-50 border-zinc-800"
            style={{
              borderColor: notification.type === 'success' ? '#00f2fe' : notification.type === 'error' ? '#ff3f34' : '#b180ff',
              boxShadow: notification.type === 'success' ? '0 0 25px rgba(0, 242, 254, 0.25)' : notification.type === 'error' ? '0 0 25px rgba(255, 63, 52, 0.25)' : '0 0 25px rgba(177, 128, 255, 0.25)'
            }}
          >
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
              notification.type === 'success' ? 'bg-cyan-400' : notification.type === 'error' ? 'bg-rose-500' : 'bg-purple-400'
            }`}></span>
            {notification.message}
          </div>
        )}

        <div className="max-w-md w-full border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary/90 rounded-3xl p-10 shadow-2xl flex flex-col gap-8 backdrop-blur-xs relative overflow-hidden animate-slide-down">
          
          <div className="text-center">
            <span className="text-[10px] font-bold tracking-widest text-text-secondary bg-zinc-200/40 dark:bg-zinc-800/40 px-3 py-1 rounded-sm uppercase">NeoBank Portal</span>
            <h2 className="text-4xl font-black tracking-tight mt-4 bg-gradient-to-r from-text-primary via-text-secondary to-text-primary bg-clip-text text-transparent leading-none">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {authMode === 'login' ? 'Sign in to access your secure cyber accounts.' : 'Join NeoBank and setup your premium account instantly.'}
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-xl bg-bg-primary">
            <button
              onClick={() => setAuthMode('login')}
              className={`py-3.5 text-sm font-extrabold rounded-lg cursor-pointer transition-all duration-200 ${
                authMode === 'login'
                  ? 'bg-text-primary text-bg-primary shadow-glow-dark font-black'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthMode('signup')}
              className={`py-3.5 text-sm font-extrabold rounded-lg cursor-pointer transition-all duration-200 ${
                authMode === 'signup'
                  ? 'bg-text-primary text-bg-primary shadow-glow-dark font-black'
                  : 'text-text-secondary hover:text-text-primary font-bold'
              }`}
            >
              Sign Up
            </button>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@neobank.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-violet focus:shadow-glow-violet transition-all font-semibold"
                  required
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-violet focus:shadow-glow-violet transition-all font-semibold"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center font-extrabold text-base px-6 py-4.5 bg-gradient-to-r from-neon-violet to-[#8a4fff] text-white hover:shadow-glow-violet hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg mt-2"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-5.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    value={signupFullName}
                    onChange={(e) => setSignupFullName(e.target.value)}
                    className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    placeholder="jane_doe"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  placeholder="jane@neobank.com"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Phone</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={signupPhone}
                    onChange={(e) => setSignupPhone(e.target.value)}
                    className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-semibold"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary focus:border-neon-cyan focus:shadow-glow-cyan transition-all font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Initial Account Type</label>
                <select
                  value={signupInitialAccountType}
                  onChange={(e) => setSignupInitialAccountType(e.target.value as 'SAVINGS' | 'CHECKING')}
                  className="text-sm px-4 py-3.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-extrabold cursor-pointer focus:border-neon-cyan transition-all"
                >
                  <option value="CHECKING">Checking Account (Spending)</option>
                  <option value="SAVINGS">Savings Account (Interest)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center font-extrabold text-base px-6 py-4 bg-gradient-to-r from-neon-cyan to-[#00b4db] text-zinc-950 hover:shadow-glow-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg mt-2"
              >
                Sign Up
              </button>
            </form>
          )}

          <div className="text-center text-xs text-text-secondary border-t border-zinc-200/40 dark:border-zinc-800/40 pt-4 font-semibold tracking-tight">
            {isLiveMode ? (
              <span className="text-neon-cyan">Live API Monolith Mode Active</span>
            ) : (
              <span>Simulated Hint: Try <b>jane@neobank.com</b> / <b>Password123!</b></span>
            )}
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={handleToggleLiveMode}
            className={`text-xs font-bold tracking-wide uppercase px-5 py-2.5 rounded-md border transition-all duration-300 cursor-pointer ${
              isLiveMode 
                ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan bg-zinc-950/25'
                : 'border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            {isLiveMode ? 'Live Mode Active' : 'Simulation Mode Active'}
          </button>
        </div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const hasSavings = accounts.some(acc => acc.type === 'SAVINGS');
  const hasChecking = accounts.some(acc => acc.type === 'CHECKING');
  const maxReached = hasSavings && hasChecking;

  return (
    <div className="flex flex-col min-h-screen bg-bg-primary text-text-primary antialiased transition-colors duration-300">
      
      {/* --- HIGH CONTRAST TOP-LEFT TOAST BANNER --- */}
      {notification && (
        <div 
          className="fixed top-8 left-8 z-[99999] px-6 py-4.5 rounded-xl border shadow-2xl text-base font-semibold tracking-tight animate-slide-left flex items-center gap-3.5 bg-zinc-900 text-zinc-50 border-zinc-800"
          style={{
            borderColor: notification.type === 'success' ? '#00f2fe' : notification.type === 'error' ? '#ff3f34' : '#b180ff',
            boxShadow: notification.type === 'success' ? '0 0 25px rgba(0, 242, 254, 0.25)' : notification.type === 'error' ? '0 0 25px rgba(255, 63, 52, 0.25)' : '0 0 25px rgba(177, 128, 255, 0.25)'
          }}
        >
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
            notification.type === 'success' ? 'bg-cyan-400' : notification.type === 'error' ? 'bg-rose-500' : 'bg-purple-400'
          }`}></span>
          {notification.message}
        </div>
      )}

      {/* --- ADD BALANCE CUSTOM IN-APP MODAL --- */}
      {isAddBalanceOpen && (
        <div className="fixed inset-0 z-[99999] backdrop-blur-md bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md border-[0.5px] border-zinc-800/80 bg-bg-secondary rounded-3xl p-8 hover:shadow-glow-cyan hover:border-neon-cyan/60 transition-all duration-300 flex flex-col gap-6 shadow-2xl animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-zinc-200/40 dark:border-zinc-800/40">
              <h3 className="text-xl font-black text-text-primary tracking-tight">Add Balance</h3>
              <button 
                onClick={() => setIsAddBalanceOpen(false)}
                className="text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold text-text-secondary">
                Load funds into your <span className="text-neon-cyan font-extrabold uppercase">{addBalanceTypeName} Account</span>.
              </p>
            </div>

            <form onSubmit={handleAddBalanceSubmit} className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Enter balance amount (e.g. 5000)"
                  value={addBalanceAmount}
                  onChange={(e) => setAddBalanceAmount(e.target.value)}
                  className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddBalanceOpen(false)}
                  className="flex-1 font-bold text-sm px-5 py-4 border border-zinc-200/60 dark:border-zinc-800/60 rounded-xl text-text-secondary hover:text-text-primary bg-bg-primary transition-all duration-300 cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 font-extrabold text-sm px-5 py-4 bg-gradient-to-r from-neon-cyan to-[#00b4db] text-zinc-950 hover:shadow-glow-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer text-center"
                >
                  Add Balance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MINIMAL HEADER --- */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-bg-glass/85 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <div className="max-w-5xl w-full mx-auto px-8 py-6.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold tracking-tight">NEOBANK</span>
            <span className="text-[10px] font-bold tracking-widest text-text-secondary bg-bg-secondary px-2 py-0.5 rounded-xs uppercase">Super-App</span>
          </div>

          {/* Clean Navigation Links - Taller & Friendlier */}
          <nav className="flex gap-10 items-center">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`text-[17px] font-bold tracking-tight transition-all duration-200 cursor-pointer pb-2 px-4.5 hover:text-text-primary ${
                activeTab === 'dashboard' ? 'text-text-primary border-b-[3px] border-text-primary' : 'text-text-secondary hover:-translate-y-[1px]'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`text-[17px] font-bold tracking-tight transition-all duration-200 cursor-pointer pb-2 px-4.5 hover:text-text-primary ${
                activeTab === 'transactions' ? 'text-text-primary border-b-[3px] border-text-primary' : 'text-text-secondary hover:-translate-y-[1px]'
              }`}
            >
              Transactions
            </button>
            <button
              onClick={() => setActiveTab('ledger')}
              className={`text-[17px] font-bold tracking-tight transition-all duration-200 cursor-pointer pb-2 px-4.5 hover:text-text-primary ${
                activeTab === 'ledger' ? 'text-text-primary border-b-[3px] border-text-primary' : 'text-text-secondary hover:-translate-y-[1px]'
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => setActiveTab('wallet')}
              className={`text-[17px] font-bold tracking-tight transition-all duration-200 cursor-pointer flex items-center gap-2.5 pb-2 px-4.5 hover:text-neon-cyan ${
                activeTab === 'wallet' ? 'text-neon-cyan border-b-[3px] border-neon-cyan' : 'text-text-secondary hover:-translate-y-[1px]'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75" />
              </svg>
              Wallet
            </button>
          </nav>

          {/* Profile @username, Connectivity Switch, & Sign Out */}
          <div className="flex items-center gap-5">
            <span className="text-sm font-extrabold text-neon-cyan select-none bg-bg-secondary px-3 py-1.5 rounded-lg border border-zinc-200/40 dark:border-zinc-800/40">
              @{currentUser?.username || 'user'}
            </span>
            <button
              onClick={handleToggleLiveMode}
              className={`text-[11px] font-bold tracking-wide uppercase px-4 py-2 rounded-md border transition-all duration-300 cursor-pointer ${
                isLiveMode 
                  ? 'border-neon-cyan text-neon-cyan shadow-glow-cyan bg-zinc-950/25'
                  : 'border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary text-text-secondary hover:text-text-primary hover:border-text-secondary'
              }`}
            >
              {isLiveMode ? `Live: ${backendStatus}` : 'Simulation'}
            </button>
            <button
              onClick={handleSignOut}
              className="text-[11px] font-bold tracking-wide uppercase px-4 py-2 rounded-md border border-red-500/50 hover:border-red-500 text-red-500 hover:bg-red-500/10 transition-all duration-300 cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* --- CORE WORKSPACE (Spacious max-w-5xl Layout) --- */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-8 py-24 flex flex-col gap-20">

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-16 animate-fade-in">
            
            {/* Massive Net Worth Title (Spacious & Friendly) */}
            <div className="text-center py-12">
              <span className="text-base font-extrabold text-text-secondary uppercase tracking-widest select-none">
                Net Worth
              </span>
              <h1 className="text-8xl font-black tracking-tight mt-4 transition-colors duration-300 hover:text-neon-cyan select-none bg-gradient-to-r from-text-primary via-text-secondary to-text-primary bg-clip-text text-transparent leading-none">
                ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </h1>
            </div>

            {/* Flat Account Rows (Generous rounded-2xl blocks) */}
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center border-b border-zinc-200/40 dark:border-zinc-800/40 pb-4">
                <h3 className="text-base font-extrabold text-text-secondary uppercase tracking-widest">
                  Personal Accounts
                </h3>
              </div>
              
              <div className="flex flex-col gap-6">
                {accounts.map(acc => (
                  <div 
                    key={acc.id} 
                    className="flex justify-between items-center px-10 py-8 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl bg-bg-secondary hover:shadow-glow-cyan hover:border-neon-cyan hover:-translate-y-1.5 transition-all duration-300"
                  >
                    <div>
                      <div className="flex items-center gap-5">
                        <span className="font-black text-lg tracking-tight uppercase text-text-primary">{acc.type} ACCOUNT</span>
                        <span className="text-xs font-mono font-extrabold text-text-secondary bg-bg-primary border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 px-4 py-1.5 rounded-lg select-all">
                          {acc.accountNumber}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-2">
                      <div className="text-3xl font-extrabold tracking-tight text-text-primary">
                        {typeof acc.balance === 'number' ? `₹${acc.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : acc.formattedBalance}
                      </div>
                      <button
                        onClick={() => triggerAddBalanceModal(acc.id, acc.type)}
                        className="text-[11px] font-black tracking-wide uppercase px-3.5 py-1.5 border border-zinc-200/60 dark:border-zinc-800/60 rounded-lg text-text-secondary hover:text-neon-cyan hover:border-neon-cyan/50 hover:shadow-glow-cyan/5 bg-bg-primary transition-all duration-300 cursor-pointer flex items-center gap-1.5"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-neon-cyan">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        Add Balance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Flat open account form (Generous size) */}
            <div className="border-t border-zinc-200/40 dark:border-zinc-800/40 pt-14 mt-6">
              {maxReached ? (
                <div className="max-w-md mx-auto text-center p-8 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl bg-bg-secondary/40">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 mx-auto text-neon-cyan mb-4 animate-pulse">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
                  </svg>
                  <p className="text-sm font-extrabold text-text-secondary uppercase tracking-wider mb-2">Maximum Limit Reached</p>
                  <p className="text-base font-semibold text-text-primary">
                    You have reached the maximum limit of 2 accounts (Checking & Savings).
                  </p>
                </div>
              ) : (
                <form onSubmit={handleOpenAccount} className="max-w-md mx-auto flex flex-col gap-7">
                  <select
                    value={newAccType}
                    onChange={(e) => setNewAccType(e.target.value as 'SAVINGS' | 'CHECKING')}
                    className="w-full text-base px-6 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold cursor-pointer hover:border-neon-cyan focus:border-neon-cyan focus:shadow-glow-cyan transition-all duration-300"
                  >
                    {!hasSavings && <option value="SAVINGS">Open Savings Account</option>}
                    {!hasChecking && <option value="CHECKING">Open Checking Account</option>}
                  </select>
                  <button 
                    type="submit" 
                    className="w-full inline-flex items-center justify-center font-extrabold text-base px-6 py-4.5 bg-gradient-to-r from-zinc-900 to-black dark:from-zinc-100 dark:to-white text-bg-primary hover:shadow-glow-cyan hover:border-neon-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    Create Instantly
                  </button>
                </form>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <div className="flex flex-col gap-16 animate-fade-in">
            
            {/* Quick Action form with highly saturated glows & generous padding */}
            <div className="flex flex-col gap-6">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
                New Transaction
              </h3>

              <div className="border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-10 bg-bg-secondary hover:shadow-glow-violet hover:border-neon-violet focus-within:shadow-glow-violet focus-within:border-neon-violet transition-all duration-300">
                <form onSubmit={handleExecuteTransaction} className="flex flex-col gap-8">
                  
                  {/* Account Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">From Account</label>
                      <select
                        value={activeAccId}
                        onChange={(e) => setActiveAccId(e.target.value)}
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold cursor-pointer focus:border-neon-violet focus:shadow-glow-violet transition-all"
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.type} ({acc.accountNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Action Type</label>
                      <select
                        value={txnType}
                        onChange={(e) => setTxnType(e.target.value as any)}
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold cursor-pointer focus:border-neon-violet focus:shadow-glow-violet transition-all"
                      >
                        <option value="TRANSFER">Transfer Funds</option>
                        <option value="DEPOSIT">Deposit Cash</option>
                        <option value="WITHDRAW">Withdraw ATM</option>
                      </select>
                    </div>
                  </div>

                  {/* Optional Recipient Field */}
                  {txnType === 'TRANSFER' && (
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Recipient Account Number</label>
                      <input
                        type="text"
                        value={targetAccountNum}
                        onChange={(e) => setTargetAccountNum(e.target.value)}
                        placeholder="e.g. 0987654321"
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-violet focus:shadow-glow-violet transition-all"
                        required
                      />
                    </div>
                  )}

                  {/* Amount and Description */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="col-span-1 flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Amount (INR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={txnAmount}
                        onChange={(e) => setTxnAmount(e.target.value)}
                        placeholder="0.00"
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-violet focus:shadow-glow-violet transition-all"
                        required
                      />
                    </div>
                    <div className="col-span-2 flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Memo / Description</label>
                      <input
                        type="text"
                        value={txnDesc}
                        onChange={(e) => setTxnDesc(e.target.value)}
                        placeholder="Transaction note"
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-medium focus:border-neon-violet focus:shadow-glow-violet transition-all"
                      />
                    </div>
                  </div>

                  {/* Custom Idempotency key */}
                  <div className="flex items-center justify-between border-t border-zinc-200/40 dark:border-zinc-800/40 pt-7 text-xs">
                    <span className="text-text-secondary tracking-widest font-extrabold uppercase">IDEMPOTENCY LOCK:</span>
                    <span className="font-mono font-extrabold text-neon-violet bg-bg-primary px-5 py-2 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-md tracking-wide text-xs select-all">
                      {txnIdemKey}
                    </span>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full inline-flex items-center justify-center font-extrabold text-base px-6 py-4.5 bg-gradient-to-r from-neon-violet to-[#8a4fff] text-white hover:shadow-glow-violet hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                  >
                    Execute Transaction
                  </button>

                </form>
              </div>
            </div>

            {/* Flat Transaction feed with slide-in animation */}
            <div className="flex flex-col gap-5">
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
                Activity Stream
              </h3>

              <div className="flex flex-col gap-4">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="flex justify-between items-center px-7 py-5.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary rounded-xl hover:shadow-glow-dark hover:border-text-secondary transition-all duration-200 animate-slide-in-up"
                  >
                    <div>
                      <div className="flex items-center gap-4">
                        <span className="font-bold text-sm text-text-primary uppercase tracking-wider">{tx.type}</span>
                        <span className="text-xs font-mono font-bold text-text-secondary bg-bg-primary px-3 py-1 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-md">
                          {tx.reference}
                        </span>
                      </div>
                      <div className="text-base text-text-secondary mt-1.5 font-medium">
                        {tx.description}
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-bold tracking-tight text-text-primary">
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{typeof tx.amount === 'number' ? `₹${tx.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : tx.formattedAmount}
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
          <div className="flex flex-col gap-10 animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3">
                Double-Entry Ledger Audit Log
              </h3>
            </div>

            {/* Table wrapper (Generous rounded-2xl block) */}
            <div className="flex flex-col border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl overflow-hidden bg-bg-secondary hover:shadow-glow-emerald hover:border-neon-emerald transition-all duration-300">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm font-semibold text-text-secondary">
                  <thead>
                    <tr className="bg-bg-primary border-b border-zinc-200/40 dark:border-zinc-800/40 font-bold text-text-primary tracking-tight">
                      <th className="px-8 py-5.5">Entry</th>
                      <th className="px-8 py-5.5">Account</th>
                      <th className="px-8 py-5.5">Action</th>
                      <th className="px-8 py-5.5">Amount</th>
                      <th className="px-8 py-5.5">Balance After</th>
                      <th className="px-8 py-5.5">Audit Reference</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200/40 dark:divide-zinc-800/40 font-medium">
                    {ledgerEntries.map(led => (
                      <tr key={led.id} className="hover:bg-bg-primary transition-colors duration-150">
                        <td className="px-8 py-5.5 font-mono text-xs text-text-secondary select-all">{led.id}</td>
                        <td className="px-8 py-5.5 font-bold text-text-primary">{led.accountNumber}</td>
                        <td className="px-8 py-5.5">
                          <span className={`text-xs font-bold px-3 py-1 rounded-md border-[0.5px] ${
                            led.type === 'CREDIT' ? 'border-emerald-500 bg-emerald-500/10 text-neon-emerald' : 'border-zinc-300/60 dark:border-zinc-800 bg-bg-primary text-text-secondary'
                          }`}>
                            {led.type}
                          </span>
                        </td>
                        <td className="px-8 py-5.5 font-bold text-text-primary text-base">
                          {led.type === 'CREDIT' ? '+' : '-'}₹{led.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-5.5 font-bold text-text-primary text-base">
                          ₹{led.balanceAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-8 py-5.5 font-mono text-xs text-text-secondary select-all">{led.transactionReference}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PAYFLOW CORE WALLET */}
        {activeTab === 'wallet' && (
          <div className="flex flex-col gap-14 animate-fade-in">
            
            {/* Wallet Not Initialized State */}
            {!wallet ? (
              <div className="flex flex-col gap-10 text-center items-center justify-center py-10">
                <div className="w-20 h-20 rounded-full border border-dashed border-zinc-400 dark:border-zinc-800 flex items-center justify-center text-text-secondary animate-pulse">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-neon-cyan">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">Activate Your PayFlow Wallet</h3>
                  <p className="text-sm text-text-secondary max-w-md mt-2 mx-auto leading-relaxed">
                    Set up your PayFlow digital wallet instantly. Select a core bank account to connect permanently. A minimum initial load of ₹1,000.00 is required to establish your wallet balance.
                  </p>
                </div>

                <div className="w-full max-w-lg border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary rounded-3xl p-10 hover:shadow-glow-cyan hover:border-neon-cyan transition-all duration-300">
                  <form onSubmit={handleInitializeWallet} className="flex flex-col gap-8 text-left">
                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Select Funding Account (Immutable)</label>
                      <select
                        value={linkAccountId}
                        onChange={(e) => setLinkAccountId(e.target.value)}
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold cursor-pointer focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                        required
                      >
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>
                            {acc.type} ({acc.accountNumber}) — ₹{acc.balance.toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-3">
                      <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Initial Deposit Load (Min ₹1,000.00)</label>
                      <input
                        type="number"
                        min="1000"
                        value={initialLoadAmount}
                        onChange={(e) => setInitialLoadAmount(e.target.value)}
                        className="text-base px-5 py-4.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center font-extrabold text-base px-6 py-4.5 bg-gradient-to-r from-neon-cyan to-[#00b4db] text-zinc-950 hover:shadow-glow-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                    >
                      Authorize & Link Instantly
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              // Wallet Active State (Luxurious neo-card and grid)
              <div className="flex flex-col gap-16 animate-fade-in">
                
                {/* Physical Premium Card & Recharge Section */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-center">
                  
                  {/* Glassmorphic Cyber Neo-Card (Luxurious proportions) */}
                  <div className="md:col-span-3 flex justify-center">
                    <div className="relative overflow-hidden w-full max-w-[390px] h-[235px] rounded-3xl p-8 text-white bg-gradient-to-br from-[#121424] via-[#0b0c16] to-[#04050a] border border-zinc-800/80 shadow-2xl hover:scale-105 hover:shadow-glow-cyan transition-all duration-500 flex flex-col justify-between cursor-pointer">
                      <div className="flex justify-between items-start">
                        <div className="w-11 h-9 bg-amber-400/85 rounded-md border border-amber-300/35 relative overflow-hidden">
                          <div className="absolute inset-0 grid grid-cols-3 divide-x divide-amber-600/30">
                            <div></div><div></div><div></div>
                          </div>
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-neon-cyan uppercase">PayFlow Wallet</span>
                      </div>
                      
                      <div>
                        <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-extrabold">Balance</span>
                        <div className="text-4xl font-extrabold tracking-tight text-white mt-1.5 select-all">
                          ₹{wallet.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-extrabold">Linked Preference</div>
                          <div className="text-xs font-mono tracking-widest mt-1.5 select-all font-bold">•••• •••• {wallet.accountNumber ? wallet.accountNumber.substring(wallet.accountNumber.length - 4) : '9999'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] text-zinc-500 uppercase tracking-widest font-extrabold">Owner</div>
                          <div className="text-xs tracking-wide font-extrabold mt-1.5 uppercase select-all">{wallet.ownerName || 'Jane Doe'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Connected Account Quick Recharge */}
                  <div className="md:col-span-2 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-8 bg-bg-secondary flex flex-col gap-6 hover:shadow-glow-cyan hover:border-neon-cyan/60 transition-all duration-300">
                    <div>
                      <h4 className="text-sm font-extrabold text-text-secondary uppercase tracking-widest">Recharge Balance</h4>
                      <p className="text-xs text-text-secondary mt-1.5 leading-relaxed">Pulls cash instantly from your connected bank account.</p>
                    </div>

                    <form onSubmit={handleRechargeWallet} className="flex flex-col gap-5">
                      <input
                        type="number"
                        placeholder="₹0.00"
                        value={walletRechargeAmount}
                        onChange={(e) => setWalletRechargeAmount(e.target.value)}
                        className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-cyan transition-all w-full"
                        required
                      />
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center font-extrabold text-sm px-4 py-4 bg-gradient-to-r from-neon-cyan to-[#00b4db] text-zinc-950 hover:shadow-glow-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                      >
                        Confirm Recharge
                      </button>
                    </form>
                  </div>
                </div>

                {/* Send Money & Request Money forms in grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-6">
                  
                  {/* SEND P2P */}
                  <div className="border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-10 bg-bg-secondary hover:shadow-glow-cyan hover:border-neon-cyan focus-within:shadow-glow-cyan focus-within:border-neon-cyan transition-all duration-300">
                    <h3 className="text-sm font-extrabold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3 mb-6">
                      Send Instantly
                    </h3>
                    <form onSubmit={handleSendP2P} className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Recipient Username</label>
                        <input
                          type="text"
                          placeholder="e.g. recipient"
                          value={p2pToUsername}
                          onChange={(e) => setP2pToUsername(e.target.value)}
                          className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 flex flex-col gap-2">
                          <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={p2pAmount}
                            onChange={(e) => setP2pAmount(e.target.value)}
                            className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                            required
                          />
                        </div>
                        <div className="col-span-2 flex flex-col gap-2">
                          <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Memo Note</label>
                          <input
                            type="text"
                            placeholder="Coffee split, share, etc."
                            value={p2pNote}
                            onChange={(e) => setP2pNote(e.target.value)}
                            className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-medium focus:border-neon-cyan focus:shadow-glow-cyan transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center font-extrabold text-sm px-5 py-4 bg-gradient-to-r from-neon-cyan to-[#00b4db] text-zinc-950 hover:shadow-glow-cyan hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                      >
                        Send Money
                      </button>
                    </form>
                  </div>

                  {/* REQUEST P2P */}
                  <div className="border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-10 bg-bg-secondary hover:shadow-glow-violet hover:border-neon-violet focus-within:shadow-glow-violet focus-within:border-neon-violet transition-all duration-300">
                    <h3 className="text-sm font-extrabold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-3 mb-6">
                      Request Money
                    </h3>
                    <form onSubmit={handleRequestP2P} className="flex flex-col gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Request From (Username)</label>
                        <input
                          type="text"
                          placeholder="e.g. bobby_32"
                          value={requestFromUsername}
                          onChange={(e) => setRequestFromUsername(e.target.value)}
                          className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-violet focus:shadow-glow-violet transition-all"
                          required
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-6">
                        <div className="col-span-1 flex flex-col gap-2">
                          <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Amount (₹)</label>
                          <input
                            type="number"
                            placeholder="0"
                            value={requestAmount}
                            onChange={(e) => setRequestAmount(e.target.value)}
                            className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-bold focus:border-neon-violet focus:shadow-glow-violet transition-all"
                            required
                          />
                        </div>
                        <div className="col-span-2 flex flex-col gap-2">
                          <label className="text-xs font-extrabold text-text-secondary uppercase tracking-wider">Memo Note</label>
                          <input
                            type="text"
                            placeholder="Dinner split, share, etc."
                            value={requestNote}
                            onChange={(e) => setRequestNote(e.target.value)}
                            className="text-base px-5 py-4 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-primary outline-hidden rounded-xl text-text-primary font-medium focus:border-neon-violet focus:shadow-glow-violet transition-all"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full inline-flex items-center justify-center font-extrabold text-sm px-5 py-4 bg-gradient-to-r from-neon-violet to-[#8a4fff] text-white hover:shadow-glow-violet hover:scale-[1.01] border border-transparent rounded-xl transition-all duration-300 cursor-pointer shadow-lg"
                      >
                        Submit Request
                      </button>
                    </form>
                  </div>
                </div>

                {/* P2P Requests Feed (Accept / Decline action rows) */}
                <div className="flex flex-col gap-5 mt-6">
                  <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest border-b border-zinc-200/40 dark:border-zinc-800/40 pb-2.5">
                    Requests & Activity Feed
                  </h3>
                  
                  {p2pRequests.length === 0 ? (
                    <p className="text-sm text-text-secondary italic text-center py-6 bg-bg-secondary rounded-xl border border-zinc-200/30">No wallet requests or activity recorded yet.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {p2pRequests.map((req: any) => {
                        const isIncoming = req.toUsername === 'jane_doe';
                        const isPending = req.status === 'PENDING';

                        return (
                          <div
                            key={req.id}
                            className="flex justify-between items-center px-7 py-5.5 border-[0.5px] border-zinc-200/60 dark:border-zinc-800/60 bg-bg-secondary rounded-xl hover:shadow-glow-dark hover:border-text-secondary transition-all duration-200 animate-slide-in-up"
                          >
                            <div>
                              <div className="flex items-center gap-3">
                                <span className="font-bold text-sm tracking-wide uppercase text-text-primary">
                                  {isIncoming ? `📥 Request from @${req.fromUsername}` : `📤 Requested from @${req.toUsername}`}
                                </span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 border-[0.5px] rounded-md uppercase ${
                                  req.status === 'ACCEPTED' 
                                    ? 'border-emerald-500 bg-emerald-500/10 text-neon-emerald' 
                                    : req.status === 'DECLINED' 
                                    ? 'border-red-500 bg-red-500/10 text-red-500' 
                                    : 'border-amber-500 bg-amber-500/10 text-amber-500'
                                }`}>
                                  {req.status}
                                </span>
                              </div>
                              <p className="text-base text-text-secondary mt-2 font-medium">{req.note}</p>
                            </div>

                            <div className="flex items-center gap-5">
                              <span className="text-base font-bold text-text-primary">
                                {typeof req.amount === 'number' ? `₹${req.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : req.formattedAmount}
                              </span>

                              {/* Action buttons if incoming pending */}
                              {isIncoming && isPending && (
                                <div className="flex gap-2.5">
                                  <button
                                    onClick={() => handleAcceptRequest(req.id, req.amount)}
                                    className="px-4 py-2 rounded-md border border-neon-emerald hover:bg-neon-emerald/10 text-neon-emerald text-xs font-bold cursor-pointer transition-all duration-200 shadow-md"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleDeclineRequest(req.id)}
                                    className="px-4 py-2 rounded-md border border-red-500 hover:bg-red-500/10 text-red-500 text-xs font-bold cursor-pointer transition-all duration-200 shadow-md"
                                  >
                                    Decline
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="border-t border-zinc-200/40 dark:border-zinc-800/40 bg-bg-primary px-8 py-12 text-xs text-text-secondary mt-auto">
        <div className="max-w-5xl w-full mx-auto flex justify-between items-center">
          <div>
            © 2026 NeoBank Super-App. Ultra-Minimalist Cyber Design.
          </div>
          <div className="flex gap-6">
            <span className="hover:text-text-primary cursor-pointer transition-colors">Privacy</span>
            <span className="hover:text-text-primary cursor-pointer transition-colors">Status</span>
            <span className="hover:text-text-primary cursor-pointer transition-colors">APIs</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
