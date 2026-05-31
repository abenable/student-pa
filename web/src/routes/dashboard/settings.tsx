import { createFileRoute, Link } from '@tanstack/react-router'
import React, { useEffect, useState } from 'react'
import { authClient } from '#/lib/auth-client'
import { LogOut, Copy, Check, Gift, Users, Bot, AlertTriangle, Clock, Loader2, CheckCircle, ArrowRight } from 'lucide-react'

export const Route = createFileRoute('/dashboard/settings')({
  component: SettingsPage,
})

interface AgentData {
  id: string
  name: string
  status: string
  containerRunning: boolean
  createdAt: string
}

function SettingsPage() {
  const { data: session } = authClient.useSession()
  const [activeTab, setActiveTab] = useState<'agent' | 'account' | 'referral'>('agent')

  // Agent tab state
  const [agent, setAgent] = useState<AgentData | null>(null)
  const [agentLoading, setAgentLoading] = useState(true)
  const [agentName, setAgentName] = useState('My Agent')
  const [agentBio, setAgentBio] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  useEffect(() => {
    if (activeTab === 'agent') {
      fetch('/api/provision')
        .then((res) => res.json())
        .then((data) => {
          if (data.agent) {
            setAgent(data.agent)
            setAgentName(data.agent.name)
            setAgentBio(data.agent.bio || '')
          } else {
            setAgent(null)
          }
          setAgentLoading(false)
        })
        .catch(() => {
          setAgent(null)
          setAgentLoading(false)
        })
    }
  }, [activeTab])

  // Account tab state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  // Referral tab state
  const [referralData, setReferralData] = useState<{ referralCode: string; referralCount: number; freeWeeksEarned: number } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (activeTab === 'referral') {
      fetch('/api/referral')
        .then((res) => res.json())
        .then((data) => setReferralData(data))
        .catch(() => setReferralData(null))
    }
  }, [activeTab])

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const referralLink = referralData?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralData.referralCode}`
    : ''

  const handleChangePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setIsChangingPassword(true)
    const result = await authClient.changePassword({
      currentPassword,
      newPassword,
    })
    setIsChangingPassword(false)

    if (result.error) {
      setPasswordError(result.error.message || 'Failed to change password')
      return
    }

    setPasswordSuccess('Password updated successfully')
    setCurrentPassword('')
    setNewPassword('')
    setConfirmNewPassword('')
  }

  const handleSignOutAll = async () => {
    await authClient.revokeSessions()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#121314]">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-[35px] font-light leading-[1.25] font-['Roboto'] text-black dark:text-white mb-8">
          Settings
        </h1>

        {/* Tabs */}
        <div className="flex items-center gap-8 border-b border-[#f3f3f3] dark:border-white/10 mb-8">
          <button
            type="button"
            onClick={() => setActiveTab('agent')}
            className={`pb-2 text-base font-medium transition-colors ${
              activeTab === 'agent'
                ? 'text-black dark:text-white border-b-2 border-[#0070d1]'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            Agent
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-2 text-base font-medium transition-colors ${
              activeTab === 'account'
                ? 'text-black dark:text-white border-b-2 border-[#0070d1]'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            Account
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('referral')}
            className={`pb-2 text-base font-medium transition-colors ${
              activeTab === 'referral'
                ? 'text-black dark:text-white border-b-2 border-[#0070d1]'
                : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white'
            }`}
          >
            Referral
          </button>
        </div>

        {activeTab === 'agent' && (
          <div className="space-y-16">
            {/* Agent Status Overview */}
            {agentLoading ? (
              <section>
                <div className="flex items-center gap-3 py-6">
                  <Loader2 className="h-5 w-5 text-[#0070d1] animate-spin" />
                  <span className="text-sm text-foreground/60">Loading agent info...</span>
                </div>
              </section>
            ) : !agent ? (
              <section className="bg-[#f5f7fa] dark:bg-[#181818] rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-[#0070d1]/10 flex items-center justify-center shrink-0">
                    <Bot className="h-5 w-5 text-[#0070d1]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">No agent configured</h2>
                    <p className="text-sm text-foreground/60 mb-4 max-w-md">
                      You haven&apos;t created an agent yet. Set one up to start using AI-powered services.
                    </p>
                    <Link
                      to="/dashboard/onboarding"
                      className="inline-flex items-center gap-2 bg-[#0070d1] text-white rounded-full px-6 py-2.5 h-11 font-bold text-sm hover:bg-[#005bb5] transition-all hover:scale-105 active:scale-95"
                    >
                      Create Agent
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            ) : agent.status === 'PENDING_APPROVAL' ? (
              <section className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Agent pending approval
                    </h2>
                    <p className="text-sm text-foreground/60 mb-4 max-w-md">
                      Your agent <strong>{agent.name}</strong> has been submitted and is awaiting admin approval.
                      You will be notified once it is approved and provisioned.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-foreground/50">
                      <span>Submitted {new Date(agent.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </section>
            ) : agent.status === 'ERROR' || agent.status === 'STOPPED' ? (
              <section className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">
                      Agent is {agent.status === 'ERROR' ? 'in error' : 'stopped'}
                    </h2>
                    <p className="text-sm text-foreground/60 mb-4 max-w-md">
                      Your agent <strong>{agent.name}</strong> is not running. You can recreate it to start fresh.
                    </p>
                    <Link
                      to="/dashboard/onboarding"
                      className="inline-flex items-center gap-2 bg-[#0070d1] text-white rounded-full px-6 py-2.5 h-11 font-bold text-sm hover:bg-[#005bb5] transition-all hover:scale-105 active:scale-95"
                    >
                      Recreate Agent
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <>
                {/* Agent Information */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <h2 className="text-xl font-bold text-foreground">
                      Agent Information
                    </h2>
                  </div>
                  <div className="space-y-4" style={{ maxWidth: '512px' }}>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">
                        Agent name
                      </label>
                      <input
                        type="text"
                        value={agentName}
                        onChange={(e) => setAgentName(e.target.value)}
                        className="w-full h-12 border border-border rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-background text-foreground placeholder:text-foreground/30"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-foreground">
                        Bio
                      </label>
                      <textarea
                        value={agentBio}
                        onChange={(e) => setAgentBio(e.target.value)}
                        rows={3}
                        className="w-full border border-border rounded-sm px-4 py-3 text-base focus:outline-none focus:border-[#0070d1] bg-background text-foreground placeholder:text-foreground/30 resize-none"
                        placeholder="Describe your agent's role..."
                      />
                    </div>
                    <button
                      type="button"
                      className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </section>

                {/* Connection Status */}
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Connection Status
                  </h2>
                  <div className="space-y-3" style={{ maxWidth: '512px' }}>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-50" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                        </span>
                        <span className="text-sm text-foreground/70">Telegram Bot</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground/50">Not connected</span>
                        <button className="text-xs font-bold text-[#0070d1] hover:underline">Connect</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-50" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                        </span>
                        <span className="text-sm text-foreground/70">GWS Auth</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-foreground/50">Not authenticated</span>
                        <button className="text-xs font-bold text-[#0070d1] hover:underline">Authenticate</button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-50" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-sm text-foreground/70">LiteLLM Key</span>
                      </div>
                      <span className="text-sm text-foreground font-mono">sk-••••••••</span>
                    </div>
                  </div>
                </section>

                {/* Container Controls */}
                <section>
                  <h2 className="text-xl font-bold text-foreground mb-4">
                    Container Controls
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors"
                    >
                      Restart
                    </button>
                    <button
                      type="button"
                      className="border border-foreground/20 text-foreground rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-foreground/5 transition-colors"
                    >
                      Stop
                    </button>
                  </div>
                </section>
              </>
            )}

            {/* Danger Zone — always shown if agent exists (or previously had one) */}
            <section className="mt-16">
              <div className="h-px bg-border mb-16" />
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 rounded-lg p-6">
                <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Danger Zone
                </h2>
                <p className="text-sm text-foreground/60 mb-4">
                  Once you delete your agent, there is no going back. Please be
                  certain.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-red-700 transition-colors"
                >
                  Delete Agent
                </button>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'account' && (
          <div className="space-y-12">
            {/* User Info */}
            <section>
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                Account Information
              </h2>
              <div className="space-y-3" style={{ maxWidth: '512px' }}>
                <div className="flex items-center justify-between py-3 border-b border-[#f3f3f3] dark:border-white/10">
                  <span className="text-sm text-black/70 dark:text-white/70">Name</span>
                  <span className="text-sm font-medium text-black dark:text-white">
                    {session?.user?.name || '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-[#f3f3f3] dark:border-white/10">
                  <span className="text-sm text-black/70 dark:text-white/70">Email</span>
                  <span className="text-sm font-medium text-black dark:text-white">
                    {session?.user?.email || '—'}
                  </span>
                </div>
              </div>
            </section>

            {/* Change Password */}
            <section>
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                Change Password
              </h2>
              <form
                onSubmit={handleChangePassword}
                className="space-y-4" style={{ maxWidth: '512px' }}
              >
                {passwordError && (
                  <div className="p-3 rounded-sm bg-red-500/10 border border-red-500/20 text-red-600 text-sm">
                    {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 rounded-sm bg-green-500/10 border border-green-500/20 text-green-600 text-sm">
                    {passwordSuccess}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">
                    Current password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full h-12 border border-[#cccccc] rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">
                    New password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className="w-full h-12 border border-[#cccccc] rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-black dark:text-white">
                    Confirm new password
                  </label>
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    className="w-full h-12 border border-[#cccccc] rounded-sm px-4 text-base focus:outline-none focus:border-[#0070d1] bg-white dark:bg-[#121314] text-black dark:text-white placeholder:text-black/30 dark:placeholder:text-white/30"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-[#0070d1] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#005bb3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>

            {/* Sign Out All Sessions */}
            <section className="mt-12 border-t border-[#f3f3f3] dark:border-white/10 pt-8">
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">Sessions</h2>
              <button
                type="button"
                onClick={handleSignOutAll}
                className="border border-black/20 dark:border-white/20 text-black dark:text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out All Sessions
              </button>
            </section>
          </div>
        )}

        {activeTab === 'referral' && (
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-bold text-black dark:text-white mb-4">
                Referral Program
              </h2>
              <p className="text-sm text-black/60 dark:text-white/60 mb-6">
                Invite friends and earn free weeks. For every friend who signs up with your code, you both get rewarded.
              </p>

              {referralData ? (
                <div className="space-y-6" style={{ maxWidth: '512px' }}>
                  {/* Referral Code */}
                  <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6">
                    <label className="block text-sm font-medium mb-2 text-black dark:text-white">
                      Your Referral Code
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-white dark:bg-[#121314] border border-[#cccccc] dark:border-white/10 rounded-sm px-4 py-3 font-mono text-lg tracking-widest text-black dark:text-white">
                        {referralData.referralCode}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(referralData.referralCode)}
                        className="h-12 px-4 bg-[#0070d1] text-white rounded-full font-bold hover:bg-[#0064b7] transition-colors inline-flex items-center gap-2"
                      >
                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        {copied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className="mt-2 text-xs text-black/50 dark:text-white/50">
                      Share this code with friends. When they sign up, you get a free week.
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 text-center">
                      <Users className="h-6 w-6 text-[#0070d1] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {referralData.referralCount}
                      </p>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        Friends Referred
                      </p>
                    </div>
                    <div className="bg-[#f5f7fa] dark:bg-[#181818] rounded-lg p-6 text-center">
                      <Gift className="h-6 w-6 text-[#0070d1] mx-auto mb-2" />
                      <p className="text-2xl font-bold text-black dark:text-white">
                        {referralData.freeWeeksEarned}
                      </p>
                      <p className="text-sm text-black/60 dark:text-white/60">
                        Free Weeks Earned
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="h-8 w-8 border-4 border-neutral-200 border-t-[#0070d1] rounded-full animate-spin" />
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-[#121314] rounded-lg p-8 w-full shadow-xl" style={{ maxWidth: '448px' }}>
            <h3 className="text-xl font-bold text-black dark:text-white mb-2">
              Are you sure?
            </h3>
            <p className="text-black/60 dark:text-white/60 mb-6">
              This action cannot be undone. This will permanently delete your
              agent and all associated data.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="border border-black/20 dark:border-white/20 text-black dark:text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false)
                  // TODO: perform actual deletion
                }}
                className="bg-[#d53b00] text-white rounded-full px-7 py-3 h-12 font-bold inline-flex items-center hover:bg-[#b83200] transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
