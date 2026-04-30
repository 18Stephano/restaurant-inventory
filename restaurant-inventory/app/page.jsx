'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EMPLOYEES } from '../lib/items'

export default function Home() {
  const router = useRouter()
  const [selected, setSelected] = useState(null)

  function start() {
    if (!selected) return
    sessionStorage.setItem('employee', selected)
    router.push('/inventory')
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  })

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <p style={styles.date}>{today}</p>
        <h1 style={styles.title}>Daily Inventory</h1>
        <p style={styles.sub}>Who's checking today?</p>
      </div>

      <div style={styles.list}>
        {EMPLOYEES.map(name => (
          <button
            key={name}
            style={{ ...styles.employeeBtn, ...(selected === name ? styles.employeeBtnActive : {}) }}
            onClick={() => setSelected(name)}
          >
            <span style={styles.avatar}>{name[0]}</span>
            <span style={styles.empName}>{name}</span>
            {selected === name && <span style={styles.check}>✓</span>}
          </button>
        ))}
      </div>

      <div style={styles.footer}>
        <button
          style={{ ...styles.startBtn, ...(selected ? {} : styles.startBtnDisabled) }}
          onClick={start}
          disabled={!selected}
        >
          Start checklist →
        </button>
        <button style={styles.dashLink} onClick={() => router.push('/dashboard')}>
          Manager dashboard
        </button>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    padding: '0 0 32px',
  },
  header: {
    padding: '40px 24px 24px',
    borderBottom: '0.5px solid var(--border)',
  },
  date: {
    fontSize: 13,
    color: 'var(--text-tertiary)',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    color: 'var(--text)',
    marginBottom: 6,
  },
  sub: {
    fontSize: 15,
    color: 'var(--text-secondary)',
  },
  list: {
    flex: 1,
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  employeeBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    borderRadius: 'var(--radius-lg)',
    border: '0.5px solid var(--border)',
    background: 'var(--bg-secondary)',
    color: 'var(--text)',
    fontSize: 16,
    textAlign: 'left',
    transition: 'all 0.1s',
  },
  employeeBtnActive: {
    border: '1.5px solid var(--green)',
    background: 'rgba(29,158,117,0.07)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    background: 'var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 15,
    fontWeight: 600,
    flexShrink: 0,
    lineHeight: '36px',
    textAlign: 'center',
  },
  empName: { flex: 1 },
  check: {
    color: 'var(--green)',
    fontWeight: 700,
    fontSize: 18,
  },
  footer: {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  startBtn: {
    width: '100%',
    padding: '16px',
    borderRadius: 'var(--radius-lg)',
    border: 'none',
    background: 'var(--text)',
    color: 'var(--bg)',
    fontSize: 16,
    fontWeight: 600,
    transition: 'opacity 0.1s',
  },
  startBtnDisabled: {
    opacity: 0.3,
  },
  dashLink: {
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    fontSize: 14,
    textAlign: 'center',
    padding: '8px',
    textDecoration: 'underline',
  },
}
