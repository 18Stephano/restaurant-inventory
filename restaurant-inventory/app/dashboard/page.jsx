'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

const DASHBOARD_PIN = process.env.NEXT_PUBLIC_DASHBOARD_PIN || '1234'

export default function Dashboard() {
  const router = useRouter()
  const [unlocked, setUnlocked] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState(false)

  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [submissions, setSubmissions] = useState([])
  const [flagged, setFlagged] = useState([])
  const [loading, setLoading] = useState(false)

  function tryPin() {
    if (pin === DASHBOARD_PIN) { setUnlocked(true) }
    else { setPinError(true); setPin('') }
  }

  useEffect(() => {
    if (!unlocked) return
    loadData()
  }, [unlocked, date])

  async function loadData() {
    setLoading(true)
    const { data: subs } = await supabase
      .from('submissions')
      .select('*, item_checks(*)')
      .eq('check_date', date)
      .order('submitted_at', { ascending: false })

    const { data: issues } = await supabase
      .from('item_checks')
      .select('*, submissions(check_date, employee_name)')
      .eq('status', 'issue')
      .gte('submissions.check_date', new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0])
      .order('id', { ascending: false })
      .limit(30)

    setSubmissions(subs || [])
    setFlagged(issues || [])
    setLoading(false)
  }

  if (!unlocked) {
    return (
      <div style={styles.pinPage}>
        <h2 style={styles.pinTitle}>Manager Access</h2>
        <p style={styles.pinSub}>Enter PIN to continue</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setPinError(false) }}
          onKeyDown={e => e.key === 'Enter' && tryPin()}
          style={{ ...styles.pinInput, ...(pinError ? styles.pinInputError : {}) }}
          placeholder="••••"
          autoFocus
        />
        {pinError && <p style={styles.pinErrMsg}>Wrong PIN</p>}
        <button style={styles.pinBtn} onClick={tryPin}>Unlock</button>
        <button style={styles.backLink} onClick={() => router.push('/')}>← Back</button>
      </div>
    )
  }

  const flagCounts = {}
  flagged.forEach(f => {
    flagCounts[f.item_name] = (flagCounts[f.item_name] || 0) + 1
  })
  const topFlags = Object.entries(flagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.sub}>Manager view</p>
          </div>
          <button style={styles.backBtn} onClick={() => router.push('/')}>← Home</button>
        </div>
        <input
          type="date"
          value={date}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setDate(e.target.value)}
          style={styles.dateInput}
        />
      </div>

      <div style={styles.scrollArea}>
        {loading ? (
          <p style={styles.loading}>Loading…</p>
        ) : (
          <>
            {/* Today's submissions */}
            <p style={styles.sectionLabel}>Submissions for {date} ({submissions.length})</p>
            {submissions.length === 0 && (
              <p style={styles.empty}>No submissions yet for this date.</p>
            )}
            {submissions.map(sub => {
              const issueCount = sub.item_checks?.filter(c => c.status === 'issue').length || 0
              const okCount = sub.item_checks?.filter(c => c.status === 'ok').length || 0
              return (
                <div key={sub.id} style={styles.subCard}>
                  <div style={styles.subTop}>
                    <span style={styles.subEmployee}>{sub.employee_name}</span>
                    <span style={styles.subTime}>
                      {new Date(sub.submitted_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={styles.subStats}>
                    <span style={styles.badge}>✓ {okCount} ok</span>
                    {issueCount > 0 && <span style={{ ...styles.badge, ...styles.badgeRed }}>⚠ {issueCount} issues</span>}
                  </div>
                  {sub.item_checks?.filter(c => c.status === 'issue').map(c => (
                    <div key={c.id} style={styles.issueRow}>
                      <span style={styles.issueDot} />
                      <div>
                        <span style={styles.issueName}>{c.item_name}</span>
                        {c.comment && <span style={styles.issueNote}> — {c.comment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}

            {/* Most flagged items (last 7 days) */}
            {topFlags.length > 0 && (
              <>
                <p style={{ ...styles.sectionLabel, marginTop: 24 }}>Most flagged (last 7 days)</p>
                {topFlags.map(([name, count]) => (
                  <div key={name} style={styles.flagRow}>
                    <span style={styles.flagName}>{name}</span>
                    <div style={styles.flagBarWrap}>
                      <div style={{ ...styles.flagBar, width: (count / topFlags[0][1] * 100) + '%' }} />
                    </div>
                    <span style={styles.flagCount}>{count}x</span>
                  </div>
                ))}
              </>
            )}
            <div style={{ height: 40 }} />
          </>
        )}
      </div>
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' },
  header: { padding: '16px 16px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title: { fontSize: 22, fontWeight: 600 },
  sub: { fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 },
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14 },
  dateInput: {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '0.5px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text)', fontSize: 14, fontFamily: 'inherit',
  },
  scrollArea: { flex: 1, overflowY: 'auto', padding: '0 16px' },
  loading: { color: 'var(--text-tertiary)', textAlign: 'center', marginTop: 40, fontSize: 14 },
  empty: { color: 'var(--text-tertiary)', fontSize: 14, padding: '16px 0' },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    padding: '16px 0 8px',
  },
  subCard: {
    border: '0.5px solid var(--border)', borderRadius: 10,
    padding: '12px 14px', marginBottom: 10,
    background: 'var(--bg-secondary)',
  },
  subTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 8 },
  subEmployee: { fontWeight: 600, fontSize: 15 },
  subTime: { fontSize: 13, color: 'var(--text-tertiary)' },
  subStats: { display: 'flex', gap: 8, marginBottom: 8 },
  badge: {
    fontSize: 12, padding: '3px 8px', borderRadius: 6,
    background: 'rgba(29,158,117,0.1)', color: 'var(--green)',
  },
  badgeRed: { background: 'rgba(226,75,74,0.1)', color: 'var(--red)' },
  issueRow: { display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 6 },
  issueDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', marginTop: 5, flexShrink: 0 },
  issueName: { fontSize: 13, color: 'var(--text)' },
  issueNote: { fontSize: 13, color: 'var(--text-secondary)' },
  flagRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 },
  flagName: { width: 130, fontSize: 13, color: 'var(--text)', flexShrink: 0 },
  flagBarWrap: { flex: 1, height: 8, background: 'var(--bg-secondary)', borderRadius: 4, overflow: 'hidden' },
  flagBar: { height: '100%', background: 'var(--red)', borderRadius: 4, transition: 'width 0.4s ease' },
  flagCount: { fontSize: 13, color: 'var(--text-secondary)', width: 24, textAlign: 'right' },
  pinPage: {
    height: '100dvh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12,
  },
  pinTitle: { fontSize: 22, fontWeight: 600 },
  pinSub: { color: 'var(--text-secondary)', fontSize: 15, marginBottom: 8 },
  pinInput: {
    width: '100%', padding: '14px', textAlign: 'center',
    fontSize: 24, letterSpacing: '0.2em',
    border: '0.5px solid var(--border)', borderRadius: 10,
    background: 'var(--bg-secondary)', color: 'var(--text)',
    outline: 'none', fontFamily: 'inherit',
  },
  pinInputError: { border: '1.5px solid var(--red)' },
  pinErrMsg: { color: 'var(--red)', fontSize: 13 },
  pinBtn: {
    width: '100%', padding: 14, borderRadius: 10, border: 'none',
    background: 'var(--text)', color: 'var(--bg)', fontSize: 16, fontWeight: 600, marginTop: 4,
  },
  backLink: { background: 'none', border: 'none', color: 'var(--text-tertiary)', fontSize: 14, textDecoration: 'underline' },
}
