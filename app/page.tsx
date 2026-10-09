'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import { BrowserProvider, Contract, formatEther, parseEther, JsonRpcProvider } from 'ethers'
import { ArrowUpRight, Bell, Bookmark, CircleDollarSign, Compass, Heart, Home, Layers3, MessageCircle, MoreHorizontal, Plus, Search, Send, Settings, Share2, Sparkles, UserRound, Wallet, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LandingPage } from '@/components/landing-page'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SOCIAL_ADDRESS ?? ''
const RPC_URL = process.env.NEXT_PUBLIC_RPC ?? 'https://rpc.bohr.life'
const ABI = [
  'function registerHandle(string handle,string bio,string avatarCid)',
  'function createPost(string text,uint256 parentId)',
  'function likePost(uint256 id)',
  'function tip(uint256 id) payable',
  'function getPosts(uint256 offset,uint256 limit) view returns (tuple(uint256 id,address author,string text,uint256 parentId,uint64 createdAt,uint32 likes,uint32 replies,uint256 tipsReceived,bool hidden)[])',
  'function getProfile(address user) view returns (tuple(string handle,string bio,string avatarCid,uint32 followers,uint32 following,uint32 postCount,uint64 createdAt,bool exists))',
  'function pendingRewards(address user) view returns (uint256)',
  'function totalEarned(address user) view returns (uint256)',
  'function claimRewards()',
]

type Post = { id: number; author: string; handle: string; avatar: string; text: string; time: string; likes: number; replies: number; tips: string; liked?: boolean; verified?: boolean }



function shortAddress(value: string) { return value.length > 12 ? `${value.slice(0, 6)}...${value.slice(-4)}` : value }

export default function Page() {
  const [posts, setPosts] = useState<Post[]>([])

  const loadPosts = useCallback(async () => {
    if (!CONTRACT_ADDRESS) return;
    try {
      const provider = new JsonRpcProvider(RPC_URL)
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const data = await contract.getPosts(0, 50)
      
      const loadedPosts = await Promise.all(data.map(async (p: any) => {
        if (p.hidden) return null;
        let handle = 'anon', avatar = '?'
        try {
          const profile = await contract.getProfile(p.author)
          if (profile.exists) {
            handle = profile.handle
            avatar = profile.handle.charAt(0).toUpperCase()
          }
        } catch (err) {}
        
        return {
          id: Number(p.id),
          author: shortAddress(p.author),
          handle,
          avatar,
          text: p.text,
          time: new Date(Number(p.createdAt) * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          likes: Number(p.likes),
          replies: Number(p.replies),
          tips: formatEther(p.tipsReceived).slice(0, 6),
          liked: false,
          verified: false
        }
      }))
      
      setPosts(loadedPosts.filter(Boolean) as Post[])
    } catch (e) {
      console.error("Failed to load posts", e)
    }
  }, [])

  useEffect(() => {
    loadPosts()
  }, [loadPosts])
  const [activeTab, setActiveTab] = useState('Global')
  const [activePage, setActivePage] = useState('Home')
  const [composer, setComposer] = useState('')
  const [wallet, setWallet] = useState('')
  const [balance, setBalance] = useState('')
  const [notice, setNotice] = useState('')
  const [showTip, setShowTip] = useState<Post | null>(null)
  const [showApp, setShowApp] = useState(false)
  const [profile, setProfile] = useState<{ handle: string, exists: boolean } | null>(null)
  const [handleInput, setHandleInput] = useState('')
  const [savedPosts, setSavedPosts] = useState<number[]>([])
  const [rewards, setRewards] = useState({ pending: '0.000', total: '0.000' })

  const loadRewards = useCallback(async () => {
    if (!wallet || !CONTRACT_ADDRESS) return;
    try {
      const provider = new JsonRpcProvider(RPC_URL)
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)
      const pending = formatEther(await contract.pendingRewards(wallet))
      const total = formatEther(await contract.totalEarned(wallet))
      setRewards({ pending: pending.slice(0, 7), total: total.slice(0, 7) })
    } catch (err) {}
  }, [wallet])

  useEffect(() => {
    loadRewards()
  }, [loadRewards])

  const toggleSave = (id: number) => setSavedPosts(curr => curr.includes(id) ? curr.filter(x => x !== id) : [...curr, id])

  const renderPost = (post: Post) => (
    <article key={post.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 transition hover:border-white/[0.15]"><div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#7a6cf0] to-[#bf8af8] font-semibold">{post.avatar}</div><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="font-semibold">{post.handle}</span>{post.verified && <span className="grid size-3.5 place-items-center rounded-full bg-[#b5f36d] text-[9px] font-bold text-[#10130d]">✓</span>}<span className="text-xs text-white/35">{post.author} · {post.time}</span><button className="ml-auto text-white/30 hover:text-white"><MoreHorizontal size={18} /></button></div><p className="mt-3 text-[15px] leading-7 text-white/80">{post.text}</p><div className="mt-5 flex items-center gap-5 text-xs text-white/38"><button onClick={() => like(post.id)} className={`flex items-center gap-1.5 hover:text-[#ff8a9c] ${post.liked ? 'text-[#ff8a9c]' : ''}`}><Heart size={16} fill={post.liked ? 'currentColor' : 'none'} /> {post.likes}</button><button className="flex items-center gap-1.5 hover:text-white"><MessageCircle size={16} /> {post.replies}</button><button onClick={() => setShowTip(post)} className="flex items-center gap-1.5 hover:text-[#b5f36d]"><CircleDollarSign size={16} /> {post.tips} tBOT</button><button onClick={() => toggleSave(post.id)} className={`flex items-center gap-1.5 ${savedPosts.includes(post.id) ? 'text-[#b5f36d]' : 'hover:text-white'}`}><Bookmark size={16} fill={savedPosts.includes(post.id) ? 'currentColor' : 'none'} /></button><button className="ml-auto hover:text-white"><Share2 size={16} /></button></div></div></div></article>
  )

  const register = async () => {
    if (!handleInput.trim()) return;
    try {
      const isCorrectNetwork = await ensureNetwork()
      if (!isCorrectNetwork) { setNotice('Please switch to BOT Chain testnet.'); return }
      const provider = new BrowserProvider((window as any).ethereum)
      const contract = new Contract(CONTRACT_ADDRESS, ABI, await provider.getSigner())
      setNotice('Registering handle...')
      await (await contract.registerHandle(handleInput.trim(), "Just joined SocialFi", "")).wait()
      setNotice('Handle registered! You can now post.')
      setProfile({ handle: handleInput.trim(), exists: true })
    } catch { setNotice('Registration failed. Handle might be taken or invalid.') }
  }

  const ensureNetwork = async () => {
    if (!(window as any).ethereum) return false;
    const chainId = '0x3c8';
    try {
      const currentChainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
      if (currentChainId === chainId) return true;
      
      await (window as any).ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId }] });
      return true;
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId, chainName: 'BOT Chain Testnet', rpcUrls: ['https://rpc.bohr.life'], nativeCurrency: { name: 'tBOT', symbol: 'tBOT', decimals: 18 }, blockExplorerUrls: ['https://scan.bohr.life'] }],
          });
          return true;
        } catch (addError) { return false; }
      }
      return false;
    }
  }

  const connectWallet = async () => {
    if (!(window as any).ethereum) { setNotice('Install a wallet such as MetaMask to connect.'); return }
    try {
      const provider = new BrowserProvider((window as any).ethereum)
      await provider.send('eth_requestAccounts', [])
      
      const isCorrectNetwork = await ensureNetwork()
      if (!isCorrectNetwork) { setNotice('Please switch to BOT Chain testnet.'); return }
      
      const signer = await provider.getSigner()
      const address = await signer.getAddress()
      setWallet(address)
      setBalance(formatEther(await provider.getBalance(address)).slice(0, 8))
      
      const contract = new Contract(CONTRACT_ADDRESS, ABI, provider)
      try {
        const p = await contract.getProfile(address)
        setProfile({ handle: p.handle, exists: p.exists })
      } catch (err) {}
      
      setNotice('Wallet connected to BOT Chain testnet.')
    } catch { setNotice('Wallet connection was cancelled.') }
  }

  const publish = async () => {
    if (!composer.trim()) return
    if (!wallet || !CONTRACT_ADDRESS) { setNotice('Connect your wallet and refresh first.'); return }
    try {
      const isCorrectNetwork = await ensureNetwork()
      if (!isCorrectNetwork) { setNotice('Please switch to BOT Chain testnet.'); return }
      const provider = new BrowserProvider((window as any).ethereum)
      const contract = new Contract(CONTRACT_ADDRESS, ABI, await provider.getSigner())
      setNotice('Waiting for transaction confirmation...')
      await (await contract.createPost(composer.trim(), 0)).wait()
      setComposer(''); setNotice('Published on-chain. Feed updated.')
      loadPosts()
    } catch { setNotice('Transaction failed. Check your wallet and gas balance.') }
  }

  const like = (id: number) => setPosts((current) => current.map((post) => post.id === id ? { ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) } : post))
  const totals = useMemo(() => {
    const creators = new Set(posts.map(p => p.author)).size
    const volume = posts.reduce((sum, p) => sum + Number(p.tips), 0).toFixed(4)
    return { creators: creators.toString(), volume, rewards: '0.00' }
  }, [posts])

  if (!showApp) return <LandingPage onEnter={() => setShowApp(true)} />

  return (
    <main className="min-h-screen bg-[#0b0c10] text-[#f3f1ed]">
      <header className="sticky top-0 z-20 border-b border-white/[0.07] bg-[#0b0c10]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-[1320px] items-center gap-8 px-6">
          <button className="flex items-center gap-3" onClick={() => setShowApp(false)}><span className="grid size-9 place-items-center rounded-xl bg-[#b5f36d] text-[#10130d]"><Sparkles size={18} strokeWidth={2.5} /></span><span className="text-[17px] font-semibold tracking-[-0.03em]">social<span className="text-[#b5f36d]">fi</span></span></button>
          <div className="relative hidden max-w-[280px] flex-1 md:block"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35" size={16} /><input aria-label="Search" placeholder="Search people or posts" className="h-10 w-full rounded-xl border border-white/[0.08] bg-white/[0.035] pl-10 pr-3 text-sm outline-none placeholder:text-white/30 focus:border-[#b5f36d]/50" /></div>
          <nav className="ml-auto flex items-center gap-2 text-white/55"><button className="rounded-lg p-2 hover:bg-white/[0.06] hover:text-white"><Bell size={19} /></button><button className="rounded-lg p-2 hover:bg-white/[0.06] hover:text-white"><Settings size={19} /></button><Button onClick={connectWallet} className="ml-2 h-10 rounded-xl bg-[#b5f36d] px-4 text-sm font-semibold text-[#11150e] hover:bg-[#c5fb81]">{wallet ? <><Wallet size={15} /> {shortAddress(wallet)}</> : <><Wallet size={15} /> Connect wallet</>}</Button></nav>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[210px_minmax(0,650px)_260px]">
        <aside className="hidden lg:block"><nav className="flex flex-col gap-1 text-sm font-medium text-white/52"><button onClick={() => setActivePage('Home')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${activePage === 'Home' ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.05] hover:text-white'}`}><Home size={18} /> Home</button><button onClick={() => setActivePage('Explore')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${activePage === 'Explore' ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.05] hover:text-white'}`}><Compass size={18} /> Explore</button><button onClick={() => setActivePage('Saved')} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left ${activePage === 'Saved' ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.05] hover:text-white'}`}><Bookmark size={18} /> Saved</button><button onClick={() => setActivePage('Rewards')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left ${activePage === 'Rewards' ? 'bg-white/[0.07] text-white' : 'hover:bg-white/[0.05] hover:text-white'}`}><CircleDollarSign size={18} /> Rewards <span className="ml-auto rounded-full bg-[#b5f36d]/15 px-1.5 text-[10px] text-[#b5f36d]">NEW</span></button></nav><div className="mt-12 border-t border-white/[0.07] pt-6"><p className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">Your space</p><button onClick={() => setActivePage('Profile')} className={`mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm ${activePage === 'Profile' ? 'bg-white/[0.07] text-white' : 'text-white/60 hover:bg-white/[0.05]'}`}><span className="grid size-7 place-items-center rounded-full bg-[#7a6cf0] text-xs font-bold">{profile?.handle ? profile.handle[0].toUpperCase() : (wallet ? 'Y' : '?')}</span>{wallet ? (profile?.handle ? `@${profile.handle}` : 'Your profile') : 'Connect to join'}</button></div></aside>
        <section className="min-w-0">
          {activePage === 'Home' ? (
            <>
              <div className="mb-6 flex items-end justify-between"><div><p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#b5f36d]">The open social graph</p><h1 className="text-3xl font-semibold tracking-[-0.05em]">Your feed</h1></div><button className="flex items-center gap-1 text-sm text-white/45 hover:text-white"><MoreHorizontal size={18} /> Filters</button></div>
              <div className="mb-5 flex gap-1 border-b border-white/[0.08]">{['Global', 'Following'].map((tab) => <button key={tab} onClick={() => setActiveTab(tab)} className={`border-b-2 px-4 pb-3 text-sm font-medium transition ${activeTab === tab ? 'border-[#b5f36d] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}>{tab}</button>)}</div>
              {wallet && profile && !profile.exists ? (
                <div className="mb-6 rounded-2xl border border-[#b5f36d]/30 bg-[#b5f36d]/[0.05] p-5 text-center">
                  <h3 className="mb-2 text-lg font-semibold">Claim your handle</h3>
                  <p className="mb-4 text-sm text-white/50">You must register a unique handle before posting on-chain.</p>
                  <div className="mx-auto flex max-w-sm gap-2"><input value={handleInput} onChange={e => setHandleInput(e.target.value.toLowerCase())} placeholder="e.g. satoshi" maxLength={20} className="h-10 flex-1 rounded-xl border border-white/[0.1] bg-black/40 px-3 text-sm outline-none placeholder:text-white/30 focus:border-[#b5f36d]/50" /><Button onClick={register} disabled={!handleInput.trim() || handleInput.length < 3} className="h-10 bg-[#b5f36d] text-[#11150e] hover:bg-[#c5fb81]">Register</Button></div>
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-4"><div className="flex gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#7a6cf0] font-semibold">{profile?.handle ? profile.handle[0].toUpperCase() : (wallet ? 'Y' : '?')}</div><textarea value={composer} onChange={(event) => setComposer(event.target.value)} maxLength={280} placeholder={wallet ? 'Share something worth owning...' : 'Connect your wallet to post'} className="min-h-[56px] flex-1 resize-none bg-transparent pt-1 text-[15px] outline-none placeholder:text-white/30" /><button onClick={publish} disabled={!composer.trim() || !profile?.exists} className="self-end rounded-xl bg-[#b5f36d] p-2.5 text-[#10130d] disabled:cursor-not-allowed disabled:opacity-40"><Send size={16} /></button></div><div className="mt-3 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs text-white/30"><span>On-chain post · max 280 characters</span><span>{composer.length}/280</span></div></div>
              )}
              {notice && <div className="mb-4 flex items-center justify-between rounded-xl border border-[#b5f36d]/20 bg-[#b5f36d]/[0.07] px-4 py-3 text-xs text-[#d8fbb3]">{notice}<button onClick={() => setNotice('')}><X size={15} /></button></div>}
              <div className="flex flex-col gap-3">{posts.map(renderPost)}</div>
              <button className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.09] py-3 text-sm text-white/55 hover:bg-white/[0.04] hover:text-white"><ArrowUpRight size={16} /> Load more posts</button>
            </>
          ) : activePage === 'Profile' ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8 text-center">
              <div className="mx-auto mb-4 grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#7a6cf0] to-[#bf8af8] text-3xl font-semibold">{profile?.handle ? profile.handle[0].toUpperCase() : (wallet ? 'Y' : '?')}</div>
              <h2 className="text-2xl font-semibold">{profile?.handle ? `@${profile.handle}` : 'Unregistered User'}</h2>
              <p className="mt-2 text-white/50">{wallet ? shortAddress(wallet) : 'Not connected'}</p>
              <div className="mt-8 flex justify-center gap-8 border-t border-white/[0.08] pt-8">
                <div><p className="text-xl font-semibold">0</p><p className="text-xs text-white/40">Followers</p></div>
                <div><p className="text-xl font-semibold">0</p><p className="text-xs text-white/40">Following</p></div>
                <div><p className="text-xl font-semibold">0</p><p className="text-xs text-white/40">Posts</p></div>
              </div>
            </div>
          ) : activePage === 'Rewards' ? (
            <div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-8">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em]">Creator Rewards</h2>
                  <p className="mt-1 text-sm text-white/50">Earn tBOT for posting and receiving engagement on BOT Chain.</p>
                </div>
                <div className="grid size-12 place-items-center rounded-xl bg-[#b5f36d]/10 text-[#b5f36d]">
                  <CircleDollarSign size={24} />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <p className="text-sm font-medium text-white/50">Available to Claim</p>
                  <p className="mt-2 text-4xl font-semibold text-[#b5f36d]">{rewards.pending} <span className="text-lg font-normal text-white/40">tBOT</span></p>
                  <Button onClick={async () => {
                    try {
                      const provider = new BrowserProvider((window as any).ethereum)
                      const contract = new Contract(CONTRACT_ADDRESS, ABI, await provider.getSigner())
                      setNotice('Claiming rewards...')
                      await (await contract.claimRewards()).wait()
                      setNotice('Rewards claimed successfully!')
                      loadRewards()
                    } catch { setNotice('Failed to claim rewards.') }
                  }} disabled={Number(rewards.pending) === 0} className="mt-6 w-full bg-[#b5f36d] font-semibold text-[#11150e] hover:bg-[#c5fb81]">Claim Rewards</Button>
                </div>
                
                <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
                  <p className="text-sm font-medium text-white/50">Total Earned</p>
                  <p className="mt-2 text-4xl font-semibold text-white">{rewards.total} <span className="text-lg font-normal text-white/40">tBOT</span></p>
                  <div className="mt-6 space-y-3 border-t border-white/[0.08] pt-4 text-sm text-white/60">
                    <div className="flex justify-between"><span>Per Post</span><span className="text-white">0.0001 tBOT</span></div>
                    <div className="flex justify-between"><span>Per Like Received</span><span className="text-white">0.00005 tBOT</span></div>
                  </div>
                </div>
              </div>
            </div>
          ) : activePage === 'Explore' ? (
            <div>
              <div className="mb-6 flex items-end justify-between">
                <div><p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#b5f36d]">Discover</p><h1 className="text-3xl font-semibold tracking-[-0.05em]">Explore Network</h1></div>
              </div>
              <div className="mb-8 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#7a6cf0]/20 to-transparent p-6 hover:border-[#7a6cf0]/50">
                  <h3 className="font-semibold text-white">Trending Posts</h3><p className="mt-1 text-sm text-white/50">Most engaged content</p>
                </div>
                <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-[#b5f36d]/20 to-transparent p-6 hover:border-[#b5f36d]/50">
                  <h3 className="font-semibold text-white">Top Creators</h3><p className="mt-1 text-sm text-white/50">Most tipped authors</p>
                </div>
              </div>
              <h3 className="mb-4 text-lg font-semibold">Trending Now</h3>
              <div className="flex flex-col gap-3">
                {posts.slice().sort((a,b) => b.likes - a.likes).slice(0, 5).map(renderPost)}
              </div>
            </div>
          ) : activePage === 'Saved' ? (
            <div>
              <div className="mb-6">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-[#b5f36d]">Archive</p>
                <h1 className="text-3xl font-semibold tracking-[-0.05em]">Saved Posts</h1>
              </div>
              {savedPosts.length === 0 ? (
                <div className="flex h-[300px] flex-col items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.025] text-center">
                  <Bookmark size={40} className="mb-4 text-white/20" />
                  <p className="text-lg font-semibold text-white/60">No saved posts</p>
                  <p className="mt-2 max-w-xs text-sm text-white/40">Posts you bookmark will appear here for easy reading later.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {posts.filter(p => savedPosts.includes(p.id)).map(renderPost)}
                </div>
              )}
            </div>
          ) : null}
        </section>
        <aside className="hidden lg:block"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><div className="flex items-center justify-between"><h2 className="font-semibold">Network pulse</h2><span className="size-2 rounded-full bg-[#b5f36d]" /></div><div className="mt-5 grid grid-cols-2 gap-4"><div><p className="text-2xl font-semibold tracking-[-0.05em]">{totals.creators}</p><p className="mt-1 text-[11px] text-white/35">creators</p></div><div><p className="text-2xl font-semibold tracking-[-0.05em]">{totals.volume}</p><p className="mt-1 text-[11px] text-white/35">tBOT tipped</p></div></div><div className="mt-5 border-t border-white/[0.07] pt-4 text-xs text-white/40"><div className="flex justify-between"><span>Chain</span><span className="text-white/70">BOT Chain Testnet</span></div><div className="mt-2 flex justify-between"><span>Rewards distributed</span><span className="text-[#b5f36d]">{totals.rewards}</span></div></div></div><div id="rewards" className="mt-4 rounded-2xl border border-[#b5f36d]/15 bg-[#b5f36d]/[0.06] p-5"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b5f36d]">Your rewards</p><p className="mt-3 text-2xl font-semibold">{rewards.pending} <span className="text-sm font-normal text-white/45">tBOT</span></p><p className="mt-1 text-xs leading-5 text-white/45">Post, participate, and earn from the network.</p><button onClick={() => setActivePage('Rewards')} className="mt-4 flex items-center gap-2 text-xs font-semibold text-[#b5f36d]">View rewards <ArrowUpRight size={14} /></button></div><div className="mt-6 px-2 text-xs leading-5 text-white/30"><p className="font-medium text-white/45">Built for ownership</p><p className="mt-2 mb-4">Posts are permanent, public, and stored directly on BOT Chain. Never share your seed phrase.</p><div className="flex flex-col gap-2 rounded-xl bg-white/[0.02] p-3 text-[11px]"><span className="font-medium text-white/50">Powered by BOT Chain</span><a href="https://botchain.ai" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#b5f36d] transition-colors"><Layers3 size={12} /> botchain.ai</a><a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-[#b5f36d] transition-colors"><Compass size={12} /> scan.botchain.ai</a></div></div></aside>
      </div>
      {showTip && <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"><div className="w-full max-w-sm rounded-2xl border border-white/[0.12] bg-[#15171d] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[0.15em] text-[#b5f36d]">Support creator</p><h2 className="mt-2 text-xl font-semibold">Tip @{showTip.handle}</h2></div><button onClick={() => setShowTip(null)} className="text-white/40 hover:text-white"><X size={18} /></button></div><p className="mt-5 text-sm leading-6 text-white/55">Send native tBOT directly to the author. SocialFi takes 0% platform fee.</p><div className="mt-5 flex gap-2"><Button onClick={() => setShowTip(null)} variant="outline" className="flex-1 border-white/10 bg-transparent">Cancel</Button><Button onClick={async () => { if (wallet && CONTRACT_ADDRESS) { const isOk = await ensureNetwork(); if (!isOk) { setNotice('Switch to BOT chain to tip.'); setShowTip(null); return; } try { const provider = new BrowserProvider((window as any).ethereum); const contract = new Contract(CONTRACT_ADDRESS, ABI, await provider.getSigner()); await (await contract.tip(showTip.id, { value: parseEther('0.001') })).wait(); setNotice('Tip sent successfully.'); } catch { setNotice('Tip failed or was cancelled.') } } else setNotice('Connect a wallet and configure the contract address first.'); setShowTip(null) }} className="flex-1 bg-[#b5f36d] text-[#11150e] hover:bg-[#c5fb81]">Tip 0.001 tBOT</Button></div></div></div>}
    </main>
  )
}
