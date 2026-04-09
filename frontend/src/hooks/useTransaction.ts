import { useState, useCallback } from 'react';
import { ContractTransactionResponse, ContractTransactionReceipt } from 'ethers';
import toast from 'react-hot-toast';

export type TxStatus = 'idle' | 'pending' | 'confirming' | 'confirmed' | 'reverted';

interface TxState {
  status: TxStatus;
  hash: string | null;
  receipt: ContractTransactionReceipt | null;
  error: string | null;
}

export function useTransaction() {
  const [state, setState] = useState<TxState>({
    status: 'idle',
    hash: null,
    receipt: null,
    error: null,
  });

  const reset = useCallback(() => {
    setState({ status: 'idle', hash: null, receipt: null, error: null });
  }, []);

  const execute = useCallback(
    async (
      txPromise: Promise<ContractTransactionResponse>,
      options?: { successMessage?: string; errorMessage?: string }
    ): Promise<ContractTransactionReceipt | null> => {
      setState({ status: 'pending', hash: null, receipt: null, error: null });

      const loadingToast = toast.loading('Waiting for wallet confirmation...');

      try {
        const tx = await txPromise;
        setState((s) => ({ ...s, status: 'confirming', hash: tx.hash }));
        toast.loading('Transaction submitted, waiting for confirmation...', {
          id: loadingToast,
        });

        const receipt = await tx.wait();
        if (receipt && receipt.status === 1) {
          setState({
            status: 'confirmed',
            hash: tx.hash,
            receipt,
            error: null,
          });
          toast.success(options?.successMessage || 'Transaction confirmed!', {
            id: loadingToast,
            duration: 4000,
          });
          return receipt;
        } else {
          setState({
            status: 'reverted',
            hash: tx.hash,
            receipt: receipt,
            error: 'Transaction reverted',
          });
          toast.error('Transaction reverted', { id: loadingToast });
          return null;
        }
      } catch (err: unknown) {
        const error = err as { reason?: string; message?: string; code?: string };
        let errorMsg = options?.errorMessage || 'Transaction failed';

        if (error.code === 'ACTION_REJECTED') {
          errorMsg = 'Transaction rejected by user';
        } else if (error.reason) {
          errorMsg = error.reason;
        } else if (error.message) {
          errorMsg = error.message.length > 100
            ? error.message.slice(0, 100) + '...'
            : error.message;
        }

        setState({
          status: 'reverted',
          hash: null,
          receipt: null,
          error: errorMsg,
        });
        toast.error(errorMsg, { id: loadingToast, duration: 5000 });
        return null;
      }
    },
    []
  );

  return { ...state, execute, reset };
}
