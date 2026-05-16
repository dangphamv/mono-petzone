'use client'

import { useState } from 'react'
import { Banknote, AlertCircle, Link as LinkIcon } from 'lucide-react'
import {
  Button, Input, Label,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Skeleton, Badge,
} from '@petzone/ui'
import { useUnmatchedBankTransactions, useMatchBankTransaction, type BankTransactionRow } from '@/lib/hooks/use-admin'

export default function BankTransactionsPage() {
  const [page, setPage] = useState(1)
  const { data, isLoading } = useUnmatchedBankTransactions(page, 20)
  const [active, setActive] = useState<BankTransactionRow | null>(null)
  const [paymentId, setPaymentId] = useState('')
  const match = useMatchBankTransaction()

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      <div className="flex items-center gap-3">
        <div className="stat-icon bg-amber-100 text-amber-700"><Banknote size={20} /></div>
        <div>
          <h1 className="page-header">Đối soát ngân hàng</h1>
          <p className="page-description">
            Giao dịch SePay đã ghi nhận nhưng chưa khớp với payment nào. Thường do owner ghi sai nội dung chuyển khoản
            hoặc số tiền lệch.
          </p>
        </div>
      </div>

      <Card className="card-elevated mt-8">
        <CardHeader>
          <CardTitle>Giao dịch chưa khớp</CardTitle>
          <CardDescription>
            {data ? `${data.pagination.total} giao dịch chưa khớp` : 'Đang tải...'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : !data?.data.length ? (
            <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
              <AlertCircle size={32} className="text-green-500" />
              <p>Không có giao dịch nào chờ đối soát thủ công 🎉</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 text-left font-medium">Thời gian</th>
                    <th className="py-2 text-left font-medium">Ngân hàng</th>
                    <th className="py-2 text-left font-medium">STK nhận</th>
                    <th className="py-2 text-right font-medium">Số tiền</th>
                    <th className="py-2 text-left font-medium">Nội dung</th>
                    <th className="py-2 text-left font-medium">Mã tham chiếu</th>
                    <th className="py-2 text-right font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.data.map((row) => (
                    <tr key={row.id} className="text-sm">
                      <td className="py-3 text-muted-foreground">{fmtDate(row.occurred_at)}</td>
                      <td className="py-3">
                        <Badge variant="secondary">{row.bank_brand ?? '?'}</Badge>
                      </td>
                      <td className="py-3 font-mono text-xs">{row.account_number}</td>
                      <td className="py-3 text-right font-semibold">{fmtVND(Number(row.amount))}</td>
                      <td className="py-3 max-w-[280px] truncate" title={row.content}>{row.content}</td>
                      <td className="py-3 font-mono text-xs text-muted-foreground">{row.reference_code ?? '—'}</td>
                      <td className="py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => { setActive(row); setPaymentId('') }}>
                          <LinkIcon size={14} className="mr-1" /> Match
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data && data.pagination.total_pages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Trang {page} / {data.pagination.total_pages}
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Trước</Button>
                <Button size="sm" variant="outline" disabled={page >= data.pagination.total_pages} onClick={() => setPage(page + 1)}>Sau</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Match dialog */}
      <Dialog open={!!active} onOpenChange={(o) => { if (!o) setActive(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Match giao dịch</DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/30 p-3 text-sm space-y-1">
                <div><span className="text-muted-foreground">STK nhận:</span> <span className="font-mono">{active.account_number}</span></div>
                <div><span className="text-muted-foreground">Số tiền:</span> <strong>{fmtVND(Number(active.amount))}</strong></div>
                <div><span className="text-muted-foreground">Nội dung:</span> {active.content}</div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_id">Payment ID (UUID)</Label>
                <Input
                  id="payment_id"
                  placeholder="vd: 550e8400-e29b-41d4-a716-446655440000"
                  value={paymentId}
                  onChange={(e) => setPaymentId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Tìm Payment ID qua trang Orders — chọn order tương ứng, copy payment.id.
                  Chỉ payments với <code>method=vietqr</code> và <code>status=pending</code> match được.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setActive(null)}>Hủy</Button>
            <Button
              disabled={!paymentId || match.isPending}
              onClick={() => {
                if (!active) return
                match.mutate(
                  { bankTxId: active.id, paymentId },
                  { onSuccess: () => setActive(null) },
                )
              }}
            >
              {match.isPending ? 'Đang match...' : 'Match'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function fmtVND(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}
