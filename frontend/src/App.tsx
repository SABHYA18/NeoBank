import React, { useState, useEffect } from 'react';
import { AuthenticatedUI } from './AuthenticatedUI';
import { AuthLayout, AppLayout } from './layout';
import { Field, Input, Modal, Select, SubmitButton, Toast } from './ui';
import type { TabId } from './ui';
import type { Account, LedgerEntry, Transaction } from './types';
import { useTheme } from './useTheme';

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
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const { theme, toggleTheme } = useTheme();
  const [userProfile, setUserProfile] = useState<{
    email?: string;
    username?: string;
    fullName?: string;
    phone?: string;
    role?: string;
    active?: boolean;
    createdAt?: string;
  } | null>(null);
  
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

  const [walletPayments, setWalletPayments] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any | null>(null);
  const [payType, setPayType] = useState<'BOOKING' | 'BILL' | 'RECHARGE'>('BOOKING');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMeta1, setPayMeta1] = useState<string>('');
  const [payMeta2, setPayMeta2] = useState<string>('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expCategory, setExpCategory] = useState<string>('FOOD');
  const [expDesc, setExpDesc] = useState<string>('');
  const [budgetCategory, setBudgetCategory] = useState<string>('FOOD');
  const [budgetLimit, setBudgetLimit] = useState<string>('');
  const [budgetPeriod, setBudgetPeriod] = useState<string>('MONTHLY');

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
      setWalletPayments([]);
      setExpenses([]);
      setBudgets([]);
      setAnalytics(null);
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
    setWalletPayments([]);
    setExpenses([]);
    setBudgets([]);
    setAnalytics(null);
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

      fetch('http://localhost:8081/api/v1/payflow/payments', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(json => { if (json.success) setWalletPayments(json.data); })
      .catch(err => console.error('Error loading wallet payments:', err));

      if (activeTab === 'clearledger') {
        fetch('http://localhost:8081/api/v1/clearledger/expenses', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(json => { if (json.success) setExpenses(json.data); });

        fetch('http://localhost:8081/api/v1/clearledger/budgets', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(json => { if (json.success) setBudgets(json.data); });

        fetch('http://localhost:8081/api/v1/clearledger/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => res.json()).then(json => { if (json.success) setAnalytics(json.data); });
      }
    }
  }, [isLiveMode, token, activeTab]);

  useEffect(() => {
    if (isLiveMode && token && activeTab === 'profile') {
      fetch('http://localhost:8081/api/v1/users/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) setUserProfile(json.data);
        })
        .catch(() => setUserProfile(null));
    } else if (!isLiveMode) {
      setUserProfile(null);
    }
  }, [isLiveMode, token, activeTab, currentUser]);

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


  const buildPayMetadata = () => {
    if (payType === 'BOOKING') return { provider: payMeta1.trim(), bookingRef: payMeta2.trim() };
    if (payType === 'BILL') return { billerCode: payMeta1.trim(), consumerId: payMeta2.trim() };
    return { operator: payMeta1.trim(), mobileNumber: payMeta2.trim() };
  };

  const handleWalletPay = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payAmount);
    if (!amount || amount <= 0) {
      showNotification('Enter a valid payment amount.', 'error');
      return;
    }
    const metadata = buildPayMetadata();
    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/payflow/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: payType, amount, metadata }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setWalletPayments((prev) => [json.data, ...prev]);
            if (json.data && wallet) setWallet({ ...wallet, balance: wallet.balance - amount });
            setPayAmount('');
            setPayMeta1('');
            setPayMeta2('');
            showNotification(`Payment confirmed: ${json.data.referenceNumber}`, 'success');
          } else {
            showNotification(json.message || 'Payment failed.', 'error');
          }
        })
        .catch(() => showNotification('Wallet payment failed.', 'error'));
      return;
    }
    if (!wallet || wallet.balance - amount < 1000) {
      showNotification('Wallet balance cannot drop below ₹1,000.', 'error');
      return;
    }
    const mock = {
      id: 'pay-' + Math.random().toString(36).slice(2, 9),
      type: payType,
      amount,
      formattedAmount: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      status: 'CONFIRMED',
      referenceNumber: payType.slice(0, 3) + '-' + Date.now(),
    };
    setWallet({ ...wallet, balance: wallet.balance - amount });
    setWalletPayments((prev) => [mock, ...prev]);
    setPayAmount('');
    setPayMeta1('');
    setPayMeta2('');
    showNotification('Simulated wallet payment confirmed.', 'success');
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expAmount);
    if (!amount || amount <= 0) {
      showNotification('Enter a valid expense amount.', 'error');
      return;
    }
    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/clearledger/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, category: expCategory, description: expDesc }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setExpenses((prev) => [json.data, ...prev]);
            setExpAmount('');
            setExpDesc('');
            showNotification('Expense logged.', 'success');
          } else showNotification(json.message || 'Failed to log expense.', 'error');
        })
        .catch(() => showNotification('Failed to log expense.', 'error'));
      return;
    }
    const mock = {
      id: 'exp-' + Math.random().toString(36).slice(2, 9),
      amount,
      formattedAmount: `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      category: expCategory,
      description: expDesc,
      expenseDate: new Date().toISOString().slice(0, 10),
    };
    setExpenses((prev) => [mock, ...prev]);
    setExpAmount('');
    setExpDesc('');
    showNotification('Expense logged (simulation).', 'success');
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(budgetLimit);
    if (!limit || limit <= 0) {
      showNotification('Enter a valid budget limit.', 'error');
      return;
    }
    if (isLiveMode) {
      fetch('http://localhost:8081/api/v1/clearledger/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: budgetCategory, limitAmount: limit, period: budgetPeriod }),
      })
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            setBudgets((prev) => {
              const rest = prev.filter((b) => b.category !== json.data.category);
              return [...rest, json.data];
            });
            setBudgetLimit('');
            showNotification('Budget saved.', 'success');
          } else showNotification(json.message || 'Failed to save budget.', 'error');
        })
        .catch(() => showNotification('Failed to save budget.', 'error'));
      return;
    }
    const spent = expenses.filter((x) => x.category === budgetCategory).reduce((s, x) => s + x.amount, 0);
    const mock = {
      id: 'bud-' + Math.random().toString(36).slice(2, 9),
      category: budgetCategory,
      limitAmount: limit,
      formattedLimit: `₹${limit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      spentAmount: spent,
      formattedSpent: `₹${spent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      remainingAmount: limit - spent,
      formattedRemaining: `₹${(limit - spent).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      period: budgetPeriod,
    };
    setBudgets((prev) => [...prev.filter((b) => b.category !== budgetCategory), mock]);
    setBudgetLimit('');
    showNotification('Budget saved (simulation).', 'success');
  };

  // --- AUTH PORTAL REDIRECT FOR UNAUTHENTICATED CUSTOMERS ---
  if (!isAuthenticated) {
    return (
      <>
        {notification && <Toast message={notification.message} type={notification.type} />}
        <AuthLayout
          authMode={authMode}
          onAuthModeChange={setAuthMode}
          theme={theme}
          onThemeToggle={toggleTheme}
          isLiveMode={isLiveMode}
          onToggleLiveMode={handleToggleLiveMode}
        >
          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="stack">
              <Field label="Email" id="login-email">
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="jane@neobank.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                />
              </Field>
              <Field label="Password" id="login-password">
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                />
              </Field>
              <SubmitButton variant="primary">Sign in</SubmitButton>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="stack">
              <div className="grid-2">
                <Field label="Full name" id="signup-name">
                  <Input id="signup-name" value={signupFullName} onChange={(e) => setSignupFullName(e.target.value)} required />
                </Field>
                <Field label="Username" id="signup-user">
                  <Input id="signup-user" value={signupUsername} onChange={(e) => setSignupUsername(e.target.value)} required />
                </Field>
              </div>
              <Field label="Email" id="signup-email">
                <Input id="signup-email" type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
              </Field>
              <div className="grid-2">
                <Field label="Phone" id="signup-phone">
                  <Input id="signup-phone" type="tel" value={signupPhone} onChange={(e) => setSignupPhone(e.target.value)} required />
                </Field>
                <Field label="Password" id="signup-pass">
                  <Input id="signup-pass" type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                </Field>
              </div>
              <Field label="Initial account" id="signup-acc">
                <Select id="signup-acc" value={signupInitialAccountType} onChange={(e) => setSignupInitialAccountType(e.target.value as 'SAVINGS' | 'CHECKING')}>
                  <option value="CHECKING">Checking</option>
                  <option value="SAVINGS">Savings</option>
                </Select>
              </Field>
              <SubmitButton variant="primary">Create account</SubmitButton>
            </form>
          )}
        </AuthLayout>
      </>
    );
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const hasSavings = accounts.some(acc => acc.type === 'SAVINGS');
  const hasChecking = accounts.some(acc => acc.type === 'CHECKING');
  const maxReached = hasSavings && hasChecking;

  return (
    <>
      {notification && <Toast message={notification.message} type={notification.type} />}
      {isAddBalanceOpen && (
        <Modal title="Add balance" onClose={() => setIsAddBalanceOpen(false)}>
          <p className="text-muted" style={{ marginTop: 0 }}>
            Load funds into your <strong>{addBalanceTypeName}</strong> account.
          </p>
          <form onSubmit={handleAddBalanceSubmit} className="stack" style={{ marginTop: '1rem' }}>
            <Field label="Amount (INR)" id="add-bal">
              <Input
                id="add-bal"
                type="number"
                step="0.01"
                min="0"
                value={addBalanceAmount}
                onChange={(e) => setAddBalanceAmount(e.target.value)}
                required
                autoFocus
              />
            </Field>
            <div className="grid-2">
              <button type="button" className="btn btn-ghost" onClick={() => setIsAddBalanceOpen(false)}>
                Cancel
              </button>
              <SubmitButton variant="primary">Add balance</SubmitButton>
            </div>
          </form>
        </Modal>
      )}
      <AppLayout
        activeTab={activeTab}
        onTabChange={setActiveTab}
        username={currentUser?.username}
        isLiveMode={isLiveMode}
        backendStatus={backendStatus}
        theme={theme}
        onThemeToggle={toggleTheme}
        onToggleLiveMode={handleToggleLiveMode}
        onSignOut={handleSignOut}
      >
        <AuthenticatedUI
          activeTab={activeTab}
          accounts={accounts}
          transactions={transactions}
          ledgerEntries={ledgerEntries}
          wallet={wallet}
          p2pRequests={p2pRequests}
          walletPayments={walletPayments}
          expenses={expenses}
          budgets={budgets}
          analytics={analytics}
          payType={payType}
          setPayType={setPayType}
          payAmount={payAmount}
          setPayAmount={setPayAmount}
          payMeta1={payMeta1}
          setPayMeta1={setPayMeta1}
          payMeta2={payMeta2}
          setPayMeta2={setPayMeta2}
          expAmount={expAmount}
          setExpAmount={setExpAmount}
          expCategory={expCategory}
          setExpCategory={setExpCategory}
          expDesc={expDesc}
          setExpDesc={setExpDesc}
          budgetCategory={budgetCategory}
          setBudgetCategory={setBudgetCategory}
          budgetLimit={budgetLimit}
          setBudgetLimit={setBudgetLimit}
          budgetPeriod={budgetPeriod}
          setBudgetPeriod={setBudgetPeriod}
          onWalletPay={handleWalletPay}
          onAddExpense={handleAddExpense}
          onSaveBudget={handleSaveBudget}
          currentUser={currentUser}
          currentUsername={currentUser?.username ?? ''}
          userProfile={userProfile}
          isLiveMode={isLiveMode}
          totalBalance={totalBalance}
          maxReached={maxReached}
          hasSavings={hasSavings}
          hasChecking={hasChecking}
          newAccType={newAccType}
          setNewAccType={setNewAccType}
          activeAccId={activeAccId}
          setActiveAccId={setActiveAccId}
          txnType={txnType}
          setTxnType={setTxnType}
          targetAccountNum={targetAccountNum}
          setTargetAccountNum={setTargetAccountNum}
          txnAmount={txnAmount}
          setTxnAmount={setTxnAmount}
          txnDesc={txnDesc}
          setTxnDesc={setTxnDesc}
          txnIdemKey={txnIdemKey}
          linkAccountId={linkAccountId}
          setLinkAccountId={setLinkAccountId}
          initialLoadAmount={initialLoadAmount}
          setInitialLoadAmount={setInitialLoadAmount}
          walletRechargeAmount={walletRechargeAmount}
          setWalletRechargeAmount={setWalletRechargeAmount}
          p2pToUsername={p2pToUsername}
          setP2pToUsername={setP2pToUsername}
          p2pAmount={p2pAmount}
          setP2pAmount={setP2pAmount}
          p2pNote={p2pNote}
          setP2pNote={setP2pNote}
          requestFromUsername={requestFromUsername}
          setRequestFromUsername={setRequestFromUsername}
          requestAmount={requestAmount}
          setRequestAmount={setRequestAmount}
          requestNote={requestNote}
          setRequestNote={setRequestNote}
          onOpenAccount={handleOpenAccount}
          onExecuteTransaction={handleExecuteTransaction}
          onInitializeWallet={handleInitializeWallet}
          onRechargeWallet={handleRechargeWallet}
          onSendP2P={handleSendP2P}
          onRequestP2P={handleRequestP2P}
          onAddBalance={triggerAddBalanceModal}
          onAcceptRequest={handleAcceptRequest}
          onDeclineRequest={handleDeclineRequest}
        />
      </AppLayout>
    </>
  );
}
