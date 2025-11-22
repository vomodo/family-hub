export interface Expense {
  id: number;
  familyId: number;
  createdBy: number;
  title: string;
  amount: number;
  currency: string;
  vndAmount: number | null;
  transactionDate: string;
  imageUrl: string | null;
  category: string | null;
  createdAt: string;
  creator?: {
    fullName: string;
    colorCode: string;
  };
}

export interface CreateExpenseInput {
  familyId: number;
  title: string;
  amount: number;
  currency?: string;
  transactionDate: string;
  imageUrl?: string;
  category?: string;
}

export interface ExpenseFilter {
  familyId: number;
  startDate?: string;
  endDate?: string;
  createdBy?: number;
  currency?: string;
}
