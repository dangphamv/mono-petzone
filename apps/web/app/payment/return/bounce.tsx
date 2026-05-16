'use client'

import { useEffect, useState } from 'react'

type Props = {
  orderId: string
  status: 'success' | 'failed'
  resultCode: string
}

export function PaymentReturnBounce({ orderId, status, resultCode }: Props) {
  const [showFallback, setShowFallback] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setShowFallback(true)
      return
    }
    // If a universal/app link is registered for this exact HTTPS URL, iOS/Android
    // intercept before the browser ever runs this script. We only get here if
    // (a) the app isn't installed, (b) the user is on desktop, or (c) the
    // universal link verification hasn't propagated yet — fall back to custom
    // scheme, then to a static page.
    //
    // Use the app team's standard deeplink: petzone://orders/{id}.
    // App's OrderDetail screen will re-fetch state from API to decide
    // success vs failed UI — we DON'T pass status in the URL (untrusted).
    const scheme = `petzone://orders/${encodeURIComponent(orderId)}`
    window.location.href = scheme
    const t = setTimeout(() => setShowFallback(true), 1500)
    return () => clearTimeout(t)
  }, [orderId, status])

  if (!showFallback) {
    return (
      <main style={pageStyle}>
        <p style={muted}>Đang mở ứng dụng PetZone…</p>
      </main>
    )
  }

  return (
    <main style={pageStyle}>
      <div style={card}>
        {status === 'success' ? (
          <>
            <h1 style={heading}>Đã nhận thanh toán</h1>
            <p style={body}>Mở ứng dụng PetZone để xem chi tiết đơn hàng.</p>
          </>
        ) : (
          <>
            <h1 style={heading}>Thanh toán chưa thành công</h1>
            <p style={body}>
              Mã lỗi: <code>{resultCode || 'unknown'}</code>. Hãy quay lại ứng dụng để thử lại.
            </p>
          </>
        )}
        <a href="/" style={link}>
          Về trang chủ
        </a>
      </div>
    </main>
  )
}

const pageStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: '#FFF8F0',
  fontFamily: 'DM Sans, system-ui, sans-serif',
  padding: 24,
}

const card: React.CSSProperties = {
  maxWidth: 420,
  padding: '32px 28px',
  background: '#fff',
  borderRadius: 12,
  boxShadow: '0 4px 20px rgba(0,0,0,.06)',
  textAlign: 'center',
}

const heading: React.CSSProperties = {
  fontFamily: 'Quicksand, system-ui, sans-serif',
  fontSize: 24,
  fontWeight: 700,
  margin: 0,
  color: '#0f172a',
}

const body: React.CSSProperties = {
  fontSize: 15,
  color: '#475569',
  marginTop: 8,
  marginBottom: 24,
  lineHeight: 1.5,
}

const muted: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: 14,
}

const link: React.CSSProperties = {
  display: 'inline-block',
  padding: '10px 20px',
  borderRadius: 12,
  background: '#2DD4BF',
  color: '#fff',
  textDecoration: 'none',
  fontWeight: 600,
}
