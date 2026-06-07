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
