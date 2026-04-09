export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatAmount = (amount: string | number, decimals = 4): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  if (num === 0) return '0';
  if (Math.abs(num) < 0.0001) return '<0.0001';
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const formatUSD = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercent = (bps: number | bigint): string => {
  const num = typeof bps === 'bigint' ? Number(bps) : bps;
  return `${(num / 100).toFixed(2)}%`;
};

export const formatBps = (bps: number): string => {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
};

export const shortenTxHash = (hash: string): string => {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
};
