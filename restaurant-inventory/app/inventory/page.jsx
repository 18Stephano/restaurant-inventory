'use client'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { ALL_ITEMS, CATEGORIES } from '../../lib/items'

function initState() {
  const s = {}
  ALL_ITEMS.forEach(({ name }) => { s[name] = { status: null, comment: '' } })
  return s
}

export default function Inventory() {
  const router = useRouter()
  const [employee, setEmployee] = useState('')
  const [itemState, setItemState] = useState(initState)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  useEffect(() => {
    const name = sessionStorage.getItem('employee')
    if (!name) { router.push('/'); return }
    setEmployee(name)
  }, [router])

  const total = ALL_ITEMS.length
  const checked = ALL_ITEMS.filter(({ name }) => itemState[name].status !== null).length
  const pct = Math.round((checked / total) * 100)

  function setStatus(name, val) {
    setItemState(prev => ({
      ...prev,
      [name]: { ...prev[name], status: prev[name].status === val ? null : val },
    }))
  }

  function setComment(name, val) {
    setItemState(prev => ({ ...prev, [name]: { ...prev[name], comment: val } }))
  }

  async function submit() {
    setSubmitting(true)
    try {
      const { data: sub, error: subErr } = await supabase
        .from('submissions')
        .insert({ employee_name: employee, check_date: new Date().toISOString().split('T')[0] })
        .select('id')
        .single()

      if (subErr) throw subErr

      const checks = ALL_ITEMS.map(({ name, category }) => ({
        submission_id: sub.id,
        item_name: name,
        category,
        status: itemState[name].status === 'ok'
          ? 'ok'
          : itemState[name].status === 'issue'
          ? 'issue'
          : 'skipped',
        comment: itemState[name].comment || '',
      }))

      const { error: checksErr } = await supabase.from('item_checks').insert(checks)
      if (checksErr) throw checksErr

      setSubmitted(true)
      setShowSummary(false)
    } catch (err) {
      alert('Error submitting: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) return <ThankYou employee={employee} onBack={() => router.push('/')} />

  const ok = ALL_ITEMS.filter(({ name }) => itemState[name].status === 'ok')
  const issues = ALL_ITEMS.filter(({ name }) => itemState[name].status === 'issue')
  const skipped = ALL_ITEMS.filter(({ name }) => itemState[name].status === null)

  if (showSummary) {
    return (
      <SummaryScreen
        ok={ok} issues={issues} skipped={skipped}
        itemState={itemState}
        submitting={submitting}
        onBack={() => setShowSummary(false)}
        onSubmit={submit}
      />
    )
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <div>
            <p style={styles.employeeLabel}>{employee}</p>
            <p style={styles.dateLabel}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button style={styles.backBtn} onClick={() => router.push('/')}>← Back</button>
        </div>
        <div style={styles.progressWrap}>
          <div style={styles.progressMeta}>
            <span style={styles.progressText}>{checked} of {total}</span>
            <span style={styles.progressPct}>{pct}%</span>
          </div>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: pct + '%' }} />
          </div>
        </div>
      </div>

      {/* Items */}
      <div style={styles.scrollArea}>
        {CATEGORIES.map(cat => (
          <div key={cat.label}>
            <p style={styles.catLabel}>{cat.label}</p>
            {cat.items.map(name => {
              const s = itemState[name].status
              return (
                <div
                  key={name}
                  style={{
                    ...styles.itemCard,
                    ...(s === 'ok' ? styles.cardOk : s === 'issue' ? styles.cardIssue : {}),
                  }}
                >
                  <div style={styles.itemRow}>
                    <span style={styles.itemName}>{name}</span>
                    <div style={styles.btnGroup}>
                      <button
                        style={{ ...styles.btn, ...styles.btnCheck, ...(s === 'ok' ? styles.btnCheckActive : {}) }}
                        onClick={() => setStatus(name, 'ok')}
                        aria-label="In stock"
                      >✓</button>
                      <button
                        style={{ ...styles.btn, ...styles.btnX, ...(s === 'issue' ? styles.btnXActive : {}) }}
                        onClick={() => setStatus(name, 'issue')}
                        aria-label="Issue"
                      >✕</button>
                    </div>
                  </div>
                  <textarea
                    style={styles.textarea}
                    placeholder="Add a note…"
                    value={itemState[name].comment}
                    onChange={e => setComment(name, e.target.value)}
                    rows={2}
                  />
                </div>
              )
            })}
          </div>
        ))}
        <div style={{ height: 90 }} />
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <button style={styles.reviewBtn} onClick={() => setShowSummary(true)}>
          Review & Submit ({pct}% done)
        </button>
      </div>
    </div>
  )
}

function SummaryScreen({ ok, issues, skipped, itemState, submitting, onBack, onSubmit }) {
  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <button style={styles.backBtn} onClick={onBack}>← Back to checklist</button>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginTop: 12 }}>Review</h2>
      </div>
      <div style={styles.scrollArea}>
        {/* Stats */}
        <div style={styles.statsGrid}>
          <StatCard num={ok.length} label="In stock" color="var(--green)" />
          <StatCard num={issues.length} label="Issues" color="var(--red)" />
          <StatCard num={skipped.length} label="Skipped" color="var(--text-tertiary)" />
        </div>

        {issues.length > 0 && (
          <Section title={`Issues (${issues.length})`} items={issues} itemState={itemState} dotColor="var(--red)" />
        )}
        {skipped.length > 0 && (
          <Section title={`Skipped (${skipped.length})`} items={skipped} itemState={itemState} dotColor="var(--text-tertiary)" />
        )}
        {ok.length > 0 && (
          <Section title={`In stock (${ok.length})`} items={ok} itemState={itemState} dotColor="var(--green)" />
        )}
        <div style={{ height: 90 }} />
      </div>
      <div style={styles.footer}>
        <button
          style={{ ...styles.reviewBtn, ...(submitting ? { opacity: 0.5 } : {}) }}
          onClick={onSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting…' : 'Confirm & Submit'}
        </button>
      </div>
    </div>
  )
}

function StatCard({ num, label, color }) {
  return (
    <div style={styles.statCard}>
      <p style={{ ...styles.statNum, color }}>{num}</p>
      <p style={styles.statLabel}>{label}</p>
    </div>
  )
}

function Section({ title, items, itemState, dotColor }) {
  return (
    <div style={styles.section}>
      <p style={styles.sectionLabel}>{title}</p>
      {items.map(({ name }) => (
        <div key={name} style={styles.summaryItem}>
          <div style={{ ...styles.dot, background: dotColor }} />
          <div>
            <p style={styles.summaryName}>{name}</p>
            {itemState[name].comment && (
              <p style={styles.summaryNote}>{itemState[name].comment}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function ThankYou({ employee, onBack }) {
  return (
    <div style={{ ...styles.page, alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 16, padding: 40 }}>
      <div style={{ fontSize: 48 }}>✓</div>
      <h2 style={{ fontSize: 22, fontWeight: 600 }}>Submitted!</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
        Thanks {employee}, inventory saved.
      </p>
      <button style={{ ...styles.reviewBtn, marginTop: 24, width: '100%' }} onClick={onBack}>
        Back to home
      </button>
    </div>
  )
}

const styles = {
  page: { display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' },
  header: { padding: '16px 16px 12px', borderBottom: '0.5px solid var(--border)', flexShrink: 0 },
  headerTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  employeeLabel: { fontSize: 15, fontWeight: 600, color: 'var(--text)' },
  dateLabel: { fontSize: 13, color: 'var(--text-tertiary)', marginTop: 2 },
  backBtn: { background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 14, padding: 0 },
  progressWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  progressMeta: { display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-secondary)' },
  progressText: {},
  progressPct: { fontWeight: 500 },
  progressTrack: { height: 4, background: 'var(--border)', borderRadius: 2 },
  progressFill: { height: 4, background: 'var(--green)', borderRadius: 2, transition: 'width 0.3s ease' },
  scrollArea: { flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' },
  catLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    padding: '14px 16px 6px',
  },
  itemCard: {
    padding: '12px 16px',
    borderBottom: '0.5px solid var(--border)',
    transition: 'background 0.1s',
  },
  cardOk: { background: 'rgba(29,158,117,0.06)' },
  cardIssue: { background: 'rgba(226,75,74,0.06)' },
  itemRow: { display: 'flex', alignItems: 'center', gap: 10 },
  itemName: { flex: 1, fontSize: 15, color: 'var(--text)', lineHeight: 1.3 },
  btnGroup: { display: 'flex', gap: 6, flexShrink: 0 },
  btn: {
    width: 46, height: 46, borderRadius: 8,
    border: '1.5px solid var(--border)',
    background: 'var(--bg-secondary)',
    fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.1s',
    WebkitTapHighlightColor: 'transparent',
  },
  btnCheck: { color: 'var(--green)' },
  btnCheckActive: { background: 'var(--green)', border: '1.5px solid var(--green)', color: '#fff' },
  btnX: { color: 'var(--red)' },
  btnXActive: { background: 'var(--red)', border: '1.5px solid var(--red)', color: '#fff' },
  textarea: {
    marginTop: 10, width: '100%',
    border: '0.5px solid var(--border)', borderRadius: 6,
    padding: '8px 10px', fontSize: 13,
    color: 'var(--text)', background: 'var(--bg-secondary)',
    resize: 'none', fontFamily: 'inherit', lineHeight: 1.4,
    outline: 'none',
  },
  footer: {
    padding: '12px 16px',
    borderTop: '0.5px solid var(--border)',
    background: 'var(--bg)',
    flexShrink: 0,
  },
  reviewBtn: {
    width: '100%', padding: '16px', borderRadius: 'var(--radius-lg)',
    border: 'none', background: 'var(--text)', color: 'var(--bg)',
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, padding: '16px 16px 8px' },
  statCard: { background: 'var(--bg-secondary)', borderRadius: 8, padding: '12px 8px', textAlign: 'center' },
  statNum: { fontSize: 24, fontWeight: 600 },
  statLabel: { fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 },
  section: { padding: '8px 16px' },
  sectionLabel: {
    fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    marginBottom: 8, marginTop: 12,
  },
  summaryItem: { display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: 10, borderBottom: '0.5px solid var(--border)', marginBottom: 10 },
  dot: { width: 8, height: 8, borderRadius: '50%', marginTop: 5, flexShrink: 0 },
  summaryName: { fontSize: 14, color: 'var(--text)' },
  summaryNote: { fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 },
}
