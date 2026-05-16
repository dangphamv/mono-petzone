import { Suspense } from 'react'
import { PaymentReturnBounce } from './bounce'

export const dynamic = 'force-dynamic'

export default function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  // MoMo gateway sends back: orderId (= our payment.id), extraData (= our order.id we set),
  // resultCode. Prefer extraData for the deeplink because that's the actual order_id
  // the app expects in petzone://orders/{id}.
  const orderId = typeof searchParams.extraData === 'string' && searchParams.extraData
    ? searchParams.extraData
    : typeof searchParams.orderId === 'string'
      ? searchParams.orderId
      : ''
  const resultCode = typeof searchParams.resultCode === 'string' ? searchParams.resultCode : ''
  const status = resultCode === '0' ? 'success' : 'failed'

  return (
    <Suspense fallback={null}>
      <PaymentReturnBounce orderId={orderId} status={status} resultCode={resultCode} />
    </Suspense>
  )
}
