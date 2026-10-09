'use client'

import { ArrowRight, Check, CircleDollarSign, Compass, Layers3, Sparkles, Wallet, Zap } from 'lucide-react'

export function LandingPage({ onEnter }: { onEnter: () => void }) {
  return (
    <main className="min-h-screen overflow-hidden bg-[#0b0c10] text-[#f3f1ed]">
      <header className="relative z-10 mx-auto flex h-20 max-w-[1240px] items-center justify-between px-6 lg:px-8">
        <a href="#top" className="flex items-center gap-3" aria-label="Socialfi home">
          <img src="/logo.jpg" alt="SocialFi Logo" className="size-9 rounded-xl object-cover" />
          <span className="text-[17px] font-semibold tracking-[-0.04em]">social<span className="text-[#b5f36d]">fi</span></span>
        </a>
        <nav className="hidden items-center gap-7 text-sm text-white/50 md:flex">
          <a href="#why" className="transition hover:text-white">Why Socialfi</a>
          <a href="#how" className="transition hover:text-white">How it works</a>
          <a href="#network" className="transition hover:text-white">Network</a>
        </nav>
        <button onClick={onEnter} className="flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold transition hover:border-white/25 hover:bg-white/[0.06]">Open app <ArrowRight size={15} /></button>
      </header>

      <section id="top" className="relative mx-auto max-w-[1240px] px-6 pb-24 pt-20 lg:px-8 lg:pb-32 lg:pt-28">
        <div className="pointer-events-none absolute -right-20 top-0 size-[520px] rounded-full bg-[#7a6cf0]/10 blur-[120px]" />
        <div className="relative grid items-center gap-16 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#b5f36d]"><span className="size-1.5 rounded-full bg-[#b5f36d]" /> The open social graph</p>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-6xl lg:text-[76px]">Your ideas.<br /><span className="text-[#b5f36d]">Your upside.</span></h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/52">Socialfi is the social network where your posts, reputation, and community value belong to you. Create, connect, and earn on-chain.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row"><button onClick={onEnter} className="flex items-center justify-center gap-2 rounded-xl bg-[#b5f36d] px-5 py-3.5 text-sm font-bold text-[#10130d] transition hover:bg-[#c7fb82]">Enter the network <ArrowRight size={16} /></button><a href="#how" className="flex items-center justify-center rounded-xl border border-white/10 px-5 py-3.5 text-sm font-semibold text-white/70 transition hover:border-white/25 hover:text-white">See how it works</a></div>
            <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-xs text-white/40"><span className="flex items-center gap-2"><Check size={14} className="text-[#b5f36d]" /> No platform fees</span><span className="flex items-center gap-2"><Check size={14} className="text-[#b5f36d]" /> Wallet-native identity</span><span className="flex items-center gap-2"><Check size={14} className="text-[#b5f36d]" /> Built on BOT Chain</span></div>
          </div>
          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="absolute -inset-6 rounded-[40px] bg-[#7a6cf0]/10 blur-3xl" />
            <div className="relative rotate-1 rounded-[28px] border border-white/10 bg-[#15171d] p-4 shadow-2xl shadow-black/40">
              <div className="flex items-center justify-between border-b border-white/[0.08] px-3 pb-4"><div className="flex items-center gap-2"><img src="/logo.jpg" alt="SocialFi Logo" className="size-7 rounded-lg object-cover" /><span className="text-sm font-semibold">socialfi</span></div><span className="rounded-full bg-[#b5f36d]/10 px-2 py-1 text-[10px] text-[#b5f36d]">LIVE NETWORK</span></div>
              <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><div className="flex gap-3"><span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[#7a6cf0] to-[#bf8af8] text-xs font-bold">M</span><div><p className="text-sm font-semibold">mira <span className="ml-1 text-[10px] text-white/30">@mira · 8 min</span></p><p className="mt-2 text-sm leading-6 text-white/70">The best protocols make ownership feel invisible. Ship the experience first, then let the rails quietly do their job.</p><div className="mt-4 flex gap-5 text-[11px] text-white/35"><span>♡ 248</span><span>◌ 34</span><span className="text-[#b5f36d]">◎ 0.18 tBOT</span></div></div></div></div>
              <div className="mt-3 grid grid-cols-2 gap-3"><div className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4"><p className="text-2xl font-semibold">2,481</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">Creators</p></div><div className="rounded-2xl border border-[#b5f36d]/15 bg-[#b5f36d]/[0.06] p-4"><p className="text-2xl font-semibold text-[#b5f36d]">18.42</p><p className="mt-1 text-[10px] uppercase tracking-wider text-white/35">tBOT tipped</p></div></div>
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-3 text-xs text-white/45"><Wallet size={15} className="text-[#b5f36d]" /> Connect wallet to join the network <ArrowRight size={14} className="ml-auto" /></div>
            </div>
          </div>
        </div>
      </section>

      <section id="network" className="border-y border-white/[0.07] bg-white/[0.02]"><div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-8 px-6 py-9 sm:grid-cols-4 lg:px-8"><div><p className="text-3xl font-semibold tracking-[-0.05em]">2,481</p><p className="mt-1 text-xs text-white/35">active creators</p></div><div><p className="text-3xl font-semibold tracking-[-0.05em]">18.42</p><p className="mt-1 text-xs text-white/35">tBOT tipped</p></div><div><p className="text-3xl font-semibold tracking-[-0.05em]">4.8K</p><p className="mt-1 text-xs text-white/35">rewards distributed</p></div><div><p className="text-3xl font-semibold tracking-[-0.05em]">0%</p><p className="mt-1 text-xs text-white/35">platform fees</p></div></div></section>

      <section id="why" className="mx-auto max-w-[1240px] px-6 py-24 lg:px-8"><div className="max-w-xl"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b5f36d]">A better social layer</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">The network works for the people who make it.</h2></div><div className="mt-14 grid gap-4 md:grid-cols-3"><Feature icon={Layers3} title="Own your identity" text="Your wallet is your profile. Take your reputation and relationships with you wherever you go." /><Feature icon={CircleDollarSign} title="Value flows directly" text="Tip the people who move you. Creators keep what their work earns, without hidden platform cuts." /><Feature icon={Compass} title="Find your people" text="Discover thoughtful conversations and build communities around ideas, not algorithms." /></div></section>

      <section id="how" className="mx-auto max-w-[1240px] border-t border-white/[0.07] px-6 py-24 lg:px-8"><div className="grid gap-14 lg:grid-cols-[.8fr_1.2fr]"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b5f36d]">Simple by design</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.06em] sm:text-5xl">Start in three moves.</h2><p className="mt-5 max-w-sm text-base leading-7 text-white/45">No forms, no gatekeepers. Bring your wallet and start building your social capital.</p></div><div className="flex flex-col gap-3"><Step number="01" title="Connect your wallet" text="Use your wallet as your portable identity. No passwords or data silos." /><Step number="02" title="Share what matters" text="Publish posts directly to the network and start meaningful conversations." /><Step number="03" title="Earn your upside" text="Receive tips from your community and participate in the rewards layer." /></div></div></section>
      <footer className="border-t border-white/[0.07]"><div className="mx-auto flex max-w-[1240px] flex-col gap-4 px-6 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex flex-col gap-2"><span>© 2026 socialfi. Built for ownership.</span><span className="flex items-center gap-2">Powered by <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="font-semibold text-[#b5f36d] hover:underline">BOT Chain</a> | <a href="https://botchain.ai" target="_blank" rel="noreferrer" className="hover:underline hover:text-white">botchain.ai</a> | <a href="https://scan.botchain.ai" target="_blank" rel="noreferrer" className="hover:underline hover:text-white">scan.botchain.ai</a></span></div></div></footer>
    </main>
  )
}

function Feature({ icon: Icon, title, text }: { icon: typeof Layers3; title: string; text: string }) { return <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-6"><Icon size={21} className="text-[#b5f36d]" /><h3 className="mt-8 text-lg font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-white/45">{text}</p></article> }
function Step({ number, title, text }: { number: string; title: string; text: string }) { return <div className="flex gap-5 rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5"><span className="pt-0.5 text-xs font-semibold text-[#b5f36d]">{number}</span><div><h3 className="font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-white/45">{text}</p></div><Zap size={17} className="ml-auto shrink-0 text-white/20" /></div> }

export default LandingPage
