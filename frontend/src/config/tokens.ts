export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  color: string;
  icon: string; // emoji for simplicity
}

export const TOKENS: Record<string, TokenInfo> = {
  NFSA: {
    address: '',
    symbol: 'NFSA',
    name: 'NoFeeSwap Alpha',
    decimals: 18,
    color: '#6366F1',
    icon: '🔷',
  },
  NFSB: {
    address: '',
    symbol: 'NFSB',
    name: 'NoFeeSwap Beta',
    decimals: 18,
    color: '#8B5CF6',
    icon: '🔶',
  },
};

export const getTokenList = (): TokenInfo[] => Object.values(TOKENS);

export const getTokenByAddress = (address: string): TokenInfo | undefined => {
  return Object.values(TOKENS).find(
    (t) => t.address.toLowerCase() === address.toLowerCase()
  );
};

export const getTokenBySymbol = (symbol: string): TokenInfo | undefined => {
  return TOKENS[symbol];
};

export const updateTokenAddresses = (tokenAAddr: string, tokenBAddr: string) => {
  TOKENS.NFSA.address = tokenAAddr;
  TOKENS.NFSB.address = tokenBAddr;
};
