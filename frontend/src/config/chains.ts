export const CHAIN_CONFIG = {
  chainId: 31337,
  chainIdHex: '0x7A69',
  chainName: 'Hardhat Localhost',
  rpcUrl: 'http://127.0.0.1:8545',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
};

export const isCorrectChain = (chainId: number | string): boolean => {
  const id = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
  return id === CHAIN_CONFIG.chainId;
};
