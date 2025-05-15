'use client';

// Default token lists for Ethereum network
  const defaultERC20Ethereum = [
    { label: 'HUNT', value: '0x9AAb071B4129B083B01cB5A0Cb513Ce7ecA26fa5' },
    { label: 'USDT', value: '0xdAC17F958D2ee523a2206206994597C13D831ec7' },
    { label: 'USDC', value: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' },
    { label: 'WETH', value: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2' },
    { label: 'cbBTC', value: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' },
    { label: 'PEPE', value: '0x6982508145454Ce325dDbE47a25d4ec3d2311933' },
    { label: 'Milady', value: '0x12970E6868f88f6557B76120662c1B3E50A646bf' },
    { label: 'SHIB', value: '0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE' },
    { label: 'DAI', value: '0x6B175474E89094C44Da98b954EedeAC495271d0F' },
    { label: 'ONDO', value: '0xfAbA6f8e4a5E8Ab82F62fe7C39859FA577269BE3' },
    { label: 'LINK', value: '0x514910771AF9Ca656af840dff83E8264EcF986CA' },
    { label: 'UNI', value: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984' },
    { label: 'PAXG', value: '0x45804880De22913dAFE09f4980848ECE6EcbAf78' },
    { label: 'MOG', value: '0xaaeE1A9723aaDB7afA2810263653A34bA2C21C7a' },
    { label: 'SPX', value: '0xE0f63A424a4439cBE457D80E4f4b51aD25b2c56C' },
  ];
  const defaultERC721Ethereum = [
    { label: 'HUNT Main Building', value: '0x0c9Bb1ffF512a5B4F01aCA6ad964Ec6D7fC60c96' },
    { label: 'BoredApeYachtClub', value: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D' },
    { label: 'PudgyPenguins', value: '0xBd3531dA5CF5857e7CfAA92426877b022e612cf8' },
    { label: 'mfer', value: '0x79FCDEF22feeD20eDDacbB2587640e45491b757f' },
    { label: 'Doodles', value: '0x8a90CAb2b38dba80c64b7734e58Ee1dB38B8992e' },
    { label: 'Otherdeed', value: '0x34d85c9CDeB23FA97cb08333b511ac86E1C4E258' },
    { label: 'DeGods', value: '0x8821BeE2ba0dF28761AffF119D66390D594CD280' },
  ];
  const defaultERC1155Ethereum = [
    { label: '10 Ether Club', value: '0x8B617eE146A746C4949c86F1685A2C2E47bD7176' },
    { label: '1 Ether Club', value: '0x1AAfCa30fC30CbE54aCcCB96824A491dF4bCC0a8' },
  ];

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/frame-sdk';

export default function Home() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);
  interface BalanceEntry {
    wallet: string;
    balance: string;
    tokenIds?: string[];
  }
  const [fid, setFid] = useState('');
  const [tokenType, setTokenType] = useState('ERC-20');
  const [contractAddress, setContractAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balances, setBalances] = useState<BalanceEntry[]>([]);
  const [error, setError] = useState('');
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false); // Token type dropdown
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [pfp, setPfp] = useState('');
  const [tokenDecimals, setTokenDecimals] = useState(18);
  const [customTokenLabel, setCustomTokenLabel] = useState('');
  const [tokenName, setTokenName] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('');
  // Network selection state
  const [network, setNetwork] = useState<'base' | 'ethereum'>('base');
  // State for usedCachedMetadata tag
  const [usedCachedMetadata, setUsedCachedMetadata] = useState(false);

  const handleCheckBalance = async () => {
    setIsLoading(true);
    setError('');
    setBalances([]);
    try {
      const res = await fetch(`/api/check-balance/erc20`, {
        method: 'POST',
        body: JSON.stringify({
          fid,
          contractAddress,
          tokenType,
          network,
        }),
      });

      const result = await res.json();
      console.log('Fetched balances:', result.balances);
      if (!res.ok) throw new Error(result.error || 'Something went wrong');
      setBalances(result.balances);
      setUsername(result.username || '');
      setPfp(result.pfp || '');
      setTokenDecimals(result.tokenDecimals || 18);
      setTokenName(result.tokenName || '');
      setTokenSymbol(result.tokenSymbol || '');
      setUsedCachedMetadata(result.usedCachedMetadata || false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || 'Unexpected error');
      } else {
        setError('Unexpected error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0B0C1B] text-white p-6 flex flex-col items-center justify-start">
      <Image
        src="/balance-checker.png"
        alt="Balance Checker"
        width={64}
        height={64}
        className="mb-6"
      />
      <h1 className="text-2xl font-bold text-white mb-2">Balance Checker</h1>
      <p className="text-base text-white/80 mb-6 text-center max-w-sm">
        Check a Farcaster user’s token or NFT balance.
      </p>

      <div className="w-full max-w-xs flex flex-col gap-4 mb-2">
        <input
          type="text"
          placeholder="FID (e.g. 8106)"
          className="px-4 py-3 rounded-[8px] bg-black border border-[#2E3C51] text-white focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD] transition-all"
          value={fid}
          onChange={(e) => setFid(e.target.value)}
        />
        <div className="relative w-full">
          <button
            onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
            className="px-4 py-3 pr-4 w-full text-left rounded-[8px] bg-black border border-[#2E3C51] text-white focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD] transition-all flex justify-between items-center"
            type="button"
          >
            {network === 'base' ? 'Base' : 'Ethereum'}
            <img
              src="/arrow-down.svg"
              alt="Dropdown arrow"
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${networkDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {networkDropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-black border border-[#2E3C51] rounded-[8px] shadow-lg">
              {['base', 'ethereum'].map((option) => (
                <li
                  key={option}
                  onClick={() => {
                    setNetwork(option as 'base' | 'ethereum');
                    setNetworkDropdownOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                >
                  {option === 'base' ? 'Base' : 'Ethereum'}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="relative w-full">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-4 py-3 pr-4 w-full text-left rounded-[8px] bg-black border border-[#2E3C51] text-white focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD] transition-all flex justify-between items-center"
            type="button"
          >
            {tokenType}
            <img
              src="/arrow-down.svg"
              alt="Dropdown arrow"
              className={`w-4 h-4 ml-2 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {dropdownOpen && (
            <ul className="absolute z-10 mt-1 w-full bg-black border border-[#2E3C51] rounded-[8px] shadow-lg">
              {['ERC-20', 'ERC-721', 'ERC-1155'].map((type) => (
                <li
                  key={type}
                  onClick={() => {
                    setTokenType(type);
                    setContractAddress('');
                    setDropdownOpen(false);
                  }}
                  className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                >
                  {type}
                </li>
              ))}
            </ul>
          )}
        </div>
        {tokenType === 'ERC-20' ? (
          <div className="relative w-full">
            <div className="relative w-full">
              <button
                onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
                className="px-4 py-3 pr-4 w-full text-left rounded-[8px] bg-black border border-[#2E3C51] text-white focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD] transition-all flex justify-between items-center"
                type="button"
              >
                {contractAddress
                  ? {
                      '0x37f0c2915CeCC7e977183B8543Fc0864d03E064C': 'HUNT',
                      '0xFf45161474C39cB00699070Dd49582e417b57a7E': 'MT',
                      '0x13c2Bc9B3b8427791F700cB153314b487fFE8F5e': 'CHICKEN',
                      '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed': 'DEGEN',
                      '0x1111111111166b7FE7bd91427724B487980aFc69': 'ZORA',
                      '0x2D57C47BC5D2432FEEEdf2c9150162A9862D3cCf': 'DICKBUTT',
                      '0xE3086852A4B125803C815a158249ae468A3254Ca': 'mfer',
                      '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf': 'cbBTC',
                      '0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527': 'MOXIE',
                      '0x5B5dee44552546ECEA05EDeA01DCD7Be7aa6144A': 'TN100x',
                      '0x3C281A39944a2319aA653D81Cfd93Ca10983D234': 'BUILD',
                      '0x9a33406165f562E16C3abD82fd1185482E01b49a': 'TALENT',
                      '0xBf4Db8b7A679F89Ef38125d5F84dd1446AF2ea3B': 'BLEU',
                      '0xeF6dd3F0bE6f599e7BcA38b47dB638D5a749CF9C': 'JAPAN',
                      '0xAf15A124e3d9e18E82801d69A94279d85BD6289b': 'HEPE',
                      '0x4200000000000000000000000000000000000006': 'WETH',
                      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC',
                      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT',
                      '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b': 'VIRTUAL',
                      '0x940181a94A35A4569E4529A3CDfB74e38FD98631': 'AERO',
                      '0x98d0baa52b2D063E780DE12F615f963Fe8537553': 'KAITO',
                      '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb': 'CLANKER',
                    }[contractAddress]
                    || (customTokenLabel || `0x${contractAddress.slice(2, 6)}...${contractAddress.slice(-4)}`)
                  : 'Select ERC-20 Token'}
                <img
                  src="/arrow-down.svg"
                  alt="Dropdown arrow"
                  className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                    tokenDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {tokenDropdownOpen && (
                <ul className="absolute z-10 mt-1 w-full bg-black border border-[#2E3C51] rounded-[8px] shadow-lg">
                  <li className="px-3 py-2 border-b border-[#2E3C51]">
                    <input
                      type="text"
                      placeholder="Search by contract address"
                      className="w-full px-3 py-2 text-sm rounded-[6px] bg-black border border-[#2E3C51] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD]"
                      value={contractAddress}
                      onChange={(e) => setContractAddress(e.target.value.trim())}
                    />
                  </li>
                  {contractAddress.length === 42 && (
                    <li
                      onClick={() => {
                        setCustomTokenLabel(`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`);
                        setTokenDropdownOpen(false);
                      }}
                      className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                    >
                      Use custom token: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                    </li>
                  )}
                  {network === 'base'
                    ? [
                        { label: 'HUNT', value: '0x37f0c2915CeCC7e977183B8543Fc0864d03E064C' },
                        { label: 'MT', value: '0xFf45161474C39cB00699070Dd49582e417b57a7E' },
                        { label: 'CHICKEN', value: '0x13c2Bc9B3b8427791F700cB153314b487fFE8F5e' },
                        { label: 'DEGEN', value: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' },
                        { label: 'ZORA', value: '0x1111111111166b7FE7bd91427724B487980aFc69' },
                        { label: 'DICKBUTT', value: '0x2D57C47BC5D2432FEEEdf2c9150162A9862D3cCf' },
                        { label: 'mfer', value: '0xE3086852A4B125803C815a158249ae468A3254Ca' },
                        { label: 'cbBTC', value: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf' },
                        { label: 'MOXIE', value: '0x8C9037D1Ef5c6D1f6816278C7AAF5491d24CD527' },
                        { label: 'TN100x', value: '0x5B5dee44552546ECEA05EDeA01DCD7Be7aa6144A' },
                        { label: 'BUILD', value: '0x3C281A39944a2319aA653D81Cfd93Ca10983D234' },
                        { label: 'TALENT', value: '0x9a33406165f562E16C3abD82fd1185482E01b49a' },
                        { label: 'BLEU', value: '0xBf4Db8b7A679F89Ef38125d5F84dd1446AF2ea3B' },
                        { label: 'JAPAN', value: '0xeF6dd3F0bE6f599e7BcA38b47dB638D5a749CF9C' },
                        { label: 'HEPE', value: '0xAf15A124e3d9e18E82801d69A94279d85BD6289b' },
                        { label: 'WETH', value: '0x4200000000000000000000000000000000000006' },
                        { label: 'USDC', value: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
                        { label: 'USDT', value: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
                        { label: 'VIRTUAL', value: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b' },
                        { label: 'AERO', value: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' },
                        { label: 'KAITO', value: '0x98d0baa52b2D063E780DE12F615f963Fe8537553' },
                        { label: 'CLANKER', value: '0x1bc0c42215582d5A085795f4baDbaC3ff36d1Bcb' },
                      ].map((token) => (
                        <li
                          key={token.value}
                          onClick={() => {
                            setContractAddress(token.value);
                            setTokenDropdownOpen(false);
                          }}
                          className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                        >
                          {token.label}
                        </li>
                      ))
                    : network === 'ethereum'
                      ? defaultERC20Ethereum.map((token) => (
                          <li
                            key={token.value}
                            onClick={() => {
                              setContractAddress(token.value);
                              setTokenDropdownOpen(false);
                            }}
                            className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                          >
                            {token.label}
                          </li>
                        ))
                      : null}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="relative w-full">
            <button
              onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
              className="px-4 py-3 pr-4 w-full text-left rounded-[8px] bg-black border border-[#2E3C51] text-white focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD] transition-all flex justify-between items-center"
              type="button"
            >
              {contractAddress
                ? customTokenLabel || `0x${contractAddress.slice(2, 6)}...${contractAddress.slice(-4)}`
                : `Select ${tokenType} Token`}
              <img
                src="/arrow-down.svg"
                alt="Dropdown arrow"
                className={`w-4 h-4 ml-2 transition-transform duration-200 ${tokenDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {tokenDropdownOpen && (
              <ul className="absolute z-10 mt-1 w-full bg-black border border-[#2E3C51] rounded-[8px] shadow-lg">
                <li className="px-3 py-2 border-b border-[#2E3C51]">
                  <input
                    type="text"
                    placeholder="Search by contract address"
                    className="w-full px-3 py-2 text-sm rounded-[6px] bg-black border border-[#2E3C51] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#855DCD] focus:border-[#855DCD]"
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value.trim())}
                  />
                </li>
                {contractAddress.length === 42 && (
                  <li
                    onClick={() => {
                      setCustomTokenLabel(`${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)}`);
                      setTokenDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                  >
                    Use custom token: {contractAddress.slice(0, 6)}...{contractAddress.slice(-4)}
                  </li>
                )}
                {(network === 'base'
                  ? (tokenType === 'ERC-721'
                      ? [
                          { label: 'Hunt Town Brickside Chat POAP', value: '0xe589EbF53E2fAC89505169D77E8110b399C368f6' },
                          { label: 'Based-noobs', value: '0x8569f00c500B035C702acF80Cba087866d4B37b0' },
                          { label: 'Degentlemen', value: '0x93D9212Fb2111B4619c48393a4cC2c9E1983EDB3' },
                          { label: 'based punks', value: '0xcB28749c24AF4797808364D71d71539bc01E76d4' },
                          { label: 'Bankr Club', value: '0x9FAb8C51f911f0ba6dab64fD6E979BcF6424Ce82' },
                          { label: 'Mochimons', value: '0x949bED087Ff0241E04E98D807DE3C3Dd97EAa381' },
                          { label: 'BasePaint', value: '0xBa5e05cb26b78eDa3A2f8e3b3814726305dcAc83' },
                          { label: 'DungeonHero', value: '0x0085B7172BE81D5cbA0dc394b728bDC03324a1D5' },
                        ]
                      : [
                          { label: 'HUNT Mini Building', value: '0x475f8E3eE5457f7B4AAca7E989D35418657AdF2a' },
                          { label: 'PumpSea', value: '0xb1935295834d110f67E390ceCfc8fFD65c1E09CB' },
                          { label: 'far.cards - undefined', value: '0x1A5def64090B66437b28e079ceaCBf953Fda3448' },
                          { label: 'far.cards - jessepollak', value: '0xAb407265b8Ed1Af49b50fF3937Ac8C3962d449C8' },
                          { label: 'broken seapump', value: '0x72D14De36Cf8125f3699c59311cC7E0e113e8Cc2' },
                          { label: 'far.cards - sartocrates', value: '0x8924aFB4Bc22E1Cc3E52f08aD1992Aeb1ab91c24' },
                        ])
                  : network === 'ethereum'
                    ? (tokenType === 'ERC-721'
                        ? defaultERC721Ethereum
                        : defaultERC1155Ethereum)
                    : []
                ).map((token) => (
                  <li
                    key={token.value}
                    onClick={() => {
                      setContractAddress(token.value);
                      setTokenDropdownOpen(false);
                    }}
                    className="px-4 py-2 hover:bg-[#1a1a2e] cursor-pointer text-white"
                  >
                    {token.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <button
        className={`px-6 py-3 mt-6 rounded-[8px] text-white font-semibold bg-[#855DCD] hover:bg-[#9A6EE6] transition duration-200 ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
        onClick={handleCheckBalance}
        disabled={isLoading || !fid || !contractAddress}
      >
        {isLoading ? 'Checking...' : 'Check Balance'}
      </button>

      {error && (
        <div className="mt-5 max-w-xs text-center">
          <p className="text-red-400">{error}</p>
          {error.includes('no connected wallet') && (
            <p className="text-white/50 text-sm mt-2">
              This Farcaster user has no wallet linked to their account, so we can&apos;t look up their balances.
            </p>
          )}
        </div>
      )}

      {balances.length > 0 && (
        <div className="mt-8 w-full max-w-md p-5 rounded-xl border border-[#855DCD] bg-black text-sm flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-col">
            <div className="flex items-center gap-3">
              <img
                src={pfp}
                alt={`${username}'s profile`}
                className="w-9 h-9 rounded-full border-2 border-[#855DCD]"
              />
              <p className="text-white text-base font-semibold">
                @{username} <span className="text-white/50 font-normal">#{fid}</span>
              </p>
            </div>
            {tokenName && tokenSymbol && (
              <p className="text-sm text-[#B298FF] font-semibold">
                Token Name: <span className="text-white font-normal">{tokenName}</span>{' '}
                <span className="text-[#B298FF]">({tokenSymbol})</span>
              </p>
            )}
            {usedCachedMetadata && (
              <p className="text-xs text-white/40 italic">⚡ Cached Metadata</p>
            )}
            <p className="text-[#B298FF] text-sm">
              <span className="font-semibold">Balance:</span>{' '}
              <span className="font-normal">
                {(() => {
                  const total = balances.reduce((sum, entry) => sum + Number(entry.balance || '0'), 0);
                  return tokenType === 'ERC-20'
                    ? (total / 10 ** tokenDecimals).toLocaleString(undefined, { maximumFractionDigits: 6 })
                    : total.toLocaleString();
                })()}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {balances.map((entry, i) => {
              return (
                <div key={i} className="flex flex-col gap-1">
                  <p className="text-white/50 text-sm">
                    Wallet: {entry.wallet.slice(0, 6)}...{entry.wallet.slice(-4)}
                  </p>
                  <p className="text-white text-sm">
                    Balance:{' '}
                    {tokenType === 'ERC-20'
                      ? (Number(BigInt(entry.balance)) / 10 ** tokenDecimals).toLocaleString(undefined, {
                          maximumFractionDigits: 6,
                        })
                      : tokenType === 'ERC-1155'
                        ? parseInt(entry.balance).toLocaleString()
                        : Number(entry.balance).toLocaleString()}
                    {(tokenType === 'ERC-721' || tokenType === 'ERC-1155') && Array.isArray(entry.tokenIds) && entry.tokenIds.length > 0 && (
                      <span className="text-white/60"> ({entry.tokenIds.map(id => `#${id}`).join(', ')})</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}