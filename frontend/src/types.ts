export interface Account {
  id: string;
  accountNumber: string;
  ownerName: string;
  type: 'SAVINGS' | 'CHECKING';
  balance: number;
  formattedBalance: string;
  status: 'ACTIVE' | 'SUSPENDED';
  currency: string;
}

export interface Transaction {
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

export interface LedgerEntry {
  id: string;
  accountNumber: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  balanceAfter: number;
  transactionReference: string;
  createdAt: string;
}

export interface User {
  fullName?: string;
  username?: string;
  email?: string;
  phone?: string;
}

export interface UserProfile extends User {
  role?: string;
  active?: boolean;
  createdAt?: string;
}

/** A user in the local simulation registry — credentials plus seeded accounts. */
export interface RegisteredUser extends User {
  email: string;
  username: string;
  password: string;
  accounts: Account[];
}

export interface Wallet {
  balance: number;
  accountNumber?: string;
  /** Id of the bank account this wallet draws from (simulation). */
  accountId?: string;
  ownerName?: string;
}

export interface P2PRequest {
  id: string;
  fromUsername: string;
  toUsername: string;
  amount: number;
  formattedAmount?: string;
  status: string;
  note?: string;
  fromFullName?: string;
  toFullName?: string;
  createdAt?: string;
}

export interface WalletPayment {
  id: string;
  type: string;
  amount: number;
  formattedAmount?: string;
  status: string;
  referenceNumber: string;
}

export interface Expense {
  id: string;
  amount: number;
  formattedAmount?: string;
  category: string;
  description?: string;
  expenseDate?: string;
}

export interface Budget {
  id: string;
  category: string;
  limitAmount: number;
  formattedLimit?: string;
  spentAmount?: number;
  formattedSpent?: string;
  remainingAmount?: number;
  formattedRemaining?: string;
  period: string;
}

export interface Analytics {
  totalSpent?: number;
  formattedTotalSpent?: string;
  byCategory?: { category: string; amount: number; formattedAmount?: string }[];
}
