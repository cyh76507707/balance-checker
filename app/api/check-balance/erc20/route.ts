
import { config } from 'dotenv';
config();
import { NextResponse } from 'next/server';


// Helper to throttle requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory cache for FID lookups
const fidCache = new Map<string, {
  addresses: string[],
  username: string,
  pfp: string,
  timestamp: number
}>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory cache for ERC-20 token metadata lookups
const metadataCache = new Map<string, {
  name: string;
  symbol: string;
  decimals: string;
  timestamp: number;
}>();
const METADATA_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const getAlchemyUrl = (network: string) => {
  return network === 'ethereum'
    ? `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_ETH}`
    : `https://base-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY_BASE}`;
};

async function getUserInfoByFID(fid: string): Promise<{ addresses: string[]; username: string; pfp: string }> {
  try {
    // Check in-memory cache first
    const cached = fidCache.get(fid);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('⚡ Using cached FID result:', fid);
      return {
        addresses: cached.addresses,
        username: cached.username,
        pfp: cached.pfp,
      };
    }

    console.log('🟡 Neynar FID Lookup:', fid);

    // Add a 2-second delay before calling Neynar API to avoid rate limits
    await delay(2000);

    const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
      headers: {
        accept: 'application/json',
        api_key: process.env.NEYNAR_API_KEY || '',
      },
    });

    const data = await response.json();
    console.log('🟢 Neynar response:', JSON.stringify(data));

    if (data?.code === 'RateLimitExceeded') {
      console.warn('⏳ Neynar rate limit hit.');
      throw new Error('Neynar API rate limit exceeded. Please wait a moment and try again.');
    }

    const user = data.users?.[0];

    // Cache the result after a successful fetch
    fidCache.set(fid, {
      addresses: user?.verifications || [],
      username: user?.username || '',
      pfp: user?.pfp_url || '',
      timestamp: Date.now(),
    });

    return {
      addresses: user?.verifications || [],
      username: user?.username || '',
      pfp: user?.pfp_url || '',
    };
  } catch (error) {
    console.error('🔴 Neynar fetch error:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { fid, contractAddress, tokenType, network } = await req.json();
    const ALCHEMY_URL = getAlchemyUrl(network);
    const NFT_API_BASE = network === 'ethereum'
      ? `https://eth-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY_ETH}`
      : `https://base-mainnet.g.alchemy.com/nft/v3/${process.env.ALCHEMY_API_KEY_BASE}`;
    const normalizedType = tokenType?.toUpperCase();

    if (!fid || !contractAddress) {
      return NextResponse.json({ error: 'FID and contract address are required.' }, { status: 400 });
    }

    let addresses: string[] = [];
    let username = '';
    let pfp = '';

    try {
      const userInfo = await getUserInfoByFID(fid);
      addresses = userInfo.addresses;
      username = userInfo.username;
      pfp = userInfo.pfp;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('User info error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 429 });
      } else {
        console.error('User info error:', err);
        return NextResponse.json({ error: 'Unknown error' }, { status: 429 });
      }
    }

    if (addresses.length === 0) {
      return NextResponse.json({ error: 'No wallet addresses found for this FID.' }, { status: 404 });
    }

    // Get token metadata for ERC-20, with safe in-memory caching
    let tokenName = 'Unknown';
    let tokenSymbol = '';
    let tokenDecimals = 18;
    let usedCachedMetadata = false;

    const cachedMeta = metadataCache.get(contractAddress);
    if (cachedMeta && Date.now() - cachedMeta.timestamp < METADATA_CACHE_TTL) {
      console.log('⚡ Using cached metadata for:', contractAddress);
      tokenName = cachedMeta.name;
      tokenSymbol = cachedMeta.symbol;
      tokenDecimals = parseInt(cachedMeta.decimals || '18');
      usedCachedMetadata = true;
    } else {
      const metadataRes = await fetch(ALCHEMY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'alchemy_getTokenMetadata',
          params: [contractAddress],
        }),
      });
      const metadataData = await metadataRes.json();
      const rawName = metadataData?.result?.name;
      const rawSymbol = metadataData?.result?.symbol;
      tokenName = rawName && rawName !== 'null' ? rawName : 'Unknown';
      tokenSymbol = rawSymbol && rawSymbol !== 'null' ? rawSymbol : '';
      tokenDecimals = parseInt(metadataData?.result?.decimals || '18');

      metadataCache.set(contractAddress, {
        name: tokenName,
        symbol: tokenSymbol,
        decimals: metadataData?.result?.decimals || '18',
        timestamp: Date.now(),
      });
    }

    const balances = await Promise.all(
      addresses.map(async (wallet: string) => {
        let balance = '0';
        const result: { wallet: string; balance?: string; tokenIds?: string[] } = { wallet };

        if (normalizedType === 'ERC-721') {
          const tokenIds: string[] = [];
          let pageKey: string | null = null;

          do {
            const res: Response = await fetch(
              `${NFT_API_BASE}/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${contractAddress}&withMetadata=false${pageKey ? `&pageKey=${encodeURIComponent(pageKey)}` : ''}`
            );
            const data = await res.json();
            const batch = data?.ownedNfts?.map((nft: { tokenId: string }) => nft.tokenId) || [];
            tokenIds.push(...batch);
            pageKey = data.pageKey || null;
          } while (pageKey);

          result['tokenIds'] = tokenIds;
          balance = tokenIds.length.toString();
        } else if (normalizedType === 'ERC-1155') {
          const apiUrl = `${NFT_API_BASE}/getNFTsForOwner?owner=${wallet}&contractAddresses[]=${contractAddress}&withMetadata=false`;

          const nftRes = await fetch(apiUrl);
          const nftData = await nftRes.json();

          const editionZero = nftData?.ownedNfts?.find((nft: { tokenId: string }) => nft.tokenId === '0');
          if (editionZero?.balance && editionZero.balance !== '0') {
            balance = editionZero.balance;
            result['tokenIds'] = ['0'];
          } else {
            balance = '0';
            result['tokenIds'] = [];
          }
        } else {
          const res = await fetch(ALCHEMY_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: 1,
              method: 'alchemy_getTokenBalances',
              params: [wallet, [contractAddress]],
            }),
          });
          const data = await res.json();
          balance = data.result?.tokenBalances?.[0]?.tokenBalance || '0';
        }

        result.balance = balance;
        return result;
      })
    );

    return NextResponse.json({
      fid,
      username,
      pfp,
      tokenName,
      tokenSymbol,
      tokenDecimals,
      balances,
      usedCachedMetadata,
    });
  } catch (error) {
    console.error('Error in ERC-20 balance route:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}