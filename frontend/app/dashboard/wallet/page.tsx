'use client';

import React from 'react';
import { 
  Wallet, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  Download,
  AlertCircle
} from 'lucide-react';
import { useGetWalletQuery, useGetTransactionsQuery, useConvertCreditsMutation } from '../../store/api/walletApi';
import { useRouteProtection } from '../../hooks/useRouteProtection';

export default function EscrowWalletPage() {
  // Protect route - redirect if not employer
  useRouteProtection()
  
  const { data: walletData, isLoading, error } = useGetWalletQuery();
  const { data: transactionsData } = useGetTransactionsQuery({ limit: 10 });
  const [convertCredits, { isLoading: converting }] = useConvertCreditsMutation();

  const handleConvertToRealMoney = async (amount: number) => {
    try {
      await convertCredits({ internal_amount: amount }).unwrap();
      alert(`Conversion initiated! You'll receive $${(amount * 0.98 / 100).toFixed(2)} in 2-3 business days.`);
    } catch (error: any) {
      alert(`Error: ${error.data?.error || 'Conversion failed'}`);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Wallet className="h-12 w-12 animate-pulse mb-4" />
          <p>Loading wallet...</p>
        </div>
      </div>
    );
  }

  if (error || !walletData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p>Error loading wallet data</p>
        </div>
      </div>
    );
  }

  const transactions = transactionsData?.data?.transactions || [];

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Your Wallet</h1>
        <p className="text-gray-600">Manage your internal credits and conversions</p>
      </div>

      {/* Main Wallet Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Internal Credits</h2>
              <p className="text-gray-500">Available balance for conversion</p>
            </div>
            <Wallet className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(walletData.balance)}
              </div>
              <div className="text-sm text-gray-500">
                {walletData.wallet_type.toUpperCase()} Credits
              </div>
            </div>
            
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Available</div>
                  <div className="font-semibold text-green-600">
                    {formatCurrency(walletData.available_balance)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Pending</div>
                  <div className="font-semibold text-orange-600">
                    {formatCurrency(walletData.pending_balance)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Total Earned</h3>
              <p className="text-gray-500">All-time earnings</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          
          <div className="space-y-2">
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(walletData.total_earned)}
            </div>
            <div className="text-sm text-gray-500">
              From {transactions.length} transactions
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <DollarSign className="h-4 w-4 mr-1" />
              {formatCurrency(walletData.total_converted)} converted
            </div>
          </div>
        </div>
      </div>

      {/* Convert Credits Section */}
      <div className="bg-white rounded-lg shadow-md p-6 border mb-8">
        <h3 className="text-lg font-bold mb-2">Convert Credits to Real Money</h3>
        <p className="text-gray-500 mb-4">
          Convert your internal credits to real money (2% conversion fee)
        </p>
        
        <div className="flex items-center gap-4">
          <input
            type="number"
            placeholder="Enter amount in credits"
            className="flex-1 px-3 py-2 border rounded-md"
            max={walletData.available_balance}
            id="convertAmount"
          />
          <button
            onClick={() => {
              const input = document.getElementById('convertAmount') as HTMLInputElement;
              const amount = parseInt(input.value);
              if (amount && amount > 0 && amount <= walletData.available_balance) {
                handleConvertToRealMoney(amount);
              } else {
                alert('Please enter a valid amount');
              }
            }}
            disabled={converting}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {converting ? (
              <>
                <Clock className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Convert
              </>
            )}
          </button>
        </div>
        <div className="mt-2 text-sm text-gray-500">
          Available: {formatCurrency(walletData.available_balance)}
        </div>
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-lg shadow-md p-6 border">
        <h3 className="text-lg font-bold mb-4">Recent Transactions</h3>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No transactions yet
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div key={transaction.transaction_id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'credit' ? 'bg-green-100' : 
                    transaction.type === 'debit' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Wallet className={`h-4 w-4 ${
                      transaction.type === 'credit' ? 'text-green-600' : 
                      transaction.type === 'debit' ? 'text-red-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div>
                    <div className="font-medium">{transaction.description}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(transaction.created_at)}
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${
                  transaction.type === 'credit' ? 'text-green-600' : 
                  transaction.type === 'debit' ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {transaction.type === 'credit' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
