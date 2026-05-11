'use client'

import { useState, useMemo } from 'react'
import { ShieldCheck, Plus, Trash2 } from 'lucide-react'
import {
  Button, Badge, Checkbox,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@petzone/ui'
import { useI18n } from '@/lib/i18n'

/* ─── Types ─── */
type StaffRole = 'staff' | 'admin' | 'super_admin'

interface StaffMember {
  id: string
  email: string
  role: StaffRole
  permissions: {
    scanner: boolean
    master_table: boolean
    hotels: boolean
    flights: boolean
    events: boolean
  }
}

/* ─── Mock Data ─── */
const INITIAL_STAFF: StaffMember[] = [
  { id: '1', email: 'alex@demo.com', role: 'staff', permissions: { scanner: true, master_table: false, hotels: false, flights: false, events: false } },
  { id: '2', email: 'admin@demo.com', role: 'admin', permissions: { scanner: true, master_table: true, hotels: true, flights: true, events: true } },
  { id: '3', email: 'superadmin@demo.com', role: 'super_admin', permissions: { scanner: true, master_table: true, hotels: true, flights: true, events: true } },
]

const PERMISSION_KEYS = ['scanner', 'master_table', 'hotels', 'flights', 'events'] as const
type PermissionKey = (typeof PERMISSION_KEYS)[number]

const ROLE_BADGE: Record<StaffRole, string> = {
  staff: 'bg-blue-50 text-blue-700 border-blue-200',
  admin: 'bg-orange-50 text-orange-700 border-orange-200',
  super_admin: 'bg-green-50 text-green-700 border-green-200',
}

/* ─── PetZone permission keys (adapted from reference) ─── */
const PETZONE_PERMISSION_KEYS = ['providers', 'orders', 'disputes', 'users', 'reviews', 'analytics', 'config'] as const
type PetZonePermissionKey = (typeof PETZONE_PERMISSION_KEYS)[number]

interface PetZoneStaffMember {
  id: string
  email: string
  name: string
  role: StaffRole
  permissions: Record<PetZonePermissionKey, boolean>
  created_at: string
}

const MOCK_STAFF: PetZoneStaffMember[] = [
  {
    id: '1',
    email: 'admin@petzone.vn',
    name: 'Adam',
    role: 'super_admin',
    permissions: { providers: true, orders: true, disputes: true, users: true, reviews: true, analytics: true, config: true },
    created_at: '2026-03-01',
  },
  {
    id: '2',
    email: 'hao@petzone.vn',
    name: 'Hào',
    role: 'admin',
    permissions: { providers: true, orders: true, disputes: true, users: true, reviews: true, analytics: true, config: false },
    created_at: '2026-03-01',
  },
  {
    id: '3',
    email: 'dang@petzone.vn',
    name: 'Đặng',
    role: 'admin',
    permissions: { providers: true, orders: true, disputes: true, users: true, reviews: true, analytics: true, config: true },
    created_at: '2026-03-01',
  },
  {
    id: '4',
    email: 'nghia@petzone.vn',
    name: 'Nghĩa',
    role: 'admin',
    permissions: { providers: true, orders: true, disputes: true, users: true, reviews: true, analytics: true, config: false },
    created_at: '2026-03-01',
  },
  {
    id: '5',
    email: 'cs_staff@petzone.vn',
    name: 'CS Staff',
    role: 'staff',
    permissions: { providers: false, orders: true, disputes: true, users: true, reviews: true, analytics: false, config: false },
    created_at: '2026-04-15',
  },
]

export default function StaffPage() {
  const { t } = useI18n()
  const [staff, setStaff] = useState<PetZoneStaffMember[]>(MOCK_STAFF)
  const [showAdd, setShowAdd] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<StaffRole>('staff')
  const [deleteTarget, setDeleteTarget] = useState<PetZoneStaffMember | null>(null)

  const currentUserRole: StaffRole = 'super_admin' // TODO: get from auth context

  const togglePermission = (staffId: string, perm: PetZonePermissionKey) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId ? { ...s, permissions: { ...s.permissions, [perm]: !s.permissions[perm] } } : s,
      ),
    )
  }

  const handleAddStaff = () => {
    if (!newEmail || !newName) return
    const newMember: PetZoneStaffMember = {
      id: String(Date.now()),
      email: newEmail,
      name: newName,
      role: newRole,
      permissions: PETZONE_PERMISSION_KEYS.reduce(
        (acc, key) => ({ ...acc, [key]: newRole === 'super_admin' || newRole === 'admin' }),
        {} as Record<PetZonePermissionKey, boolean>,
      ),
      created_at: new Date().toISOString().split('T')[0]!,
    }
    setStaff((prev) => [...prev, newMember])
    setShowAdd(false)
    setNewEmail('')
    setNewName('')
    setNewRole('staff')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setStaff((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  return (
    <div className="animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="stat-icon bg-indigo-50 text-indigo-600"><ShieldCheck size={20} /></div>
          <div>
            <h1 className="page-header">{t('staff.title')}</h1>
            <p className="page-description">{t('staff.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {currentUserRole === 'super_admin' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 px-3 py-1">
              Super Admin
            </Badge>
          )}
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus size={16} />
            {t('staff.add')}
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('staff.email')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('staff.name')}</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('users.role')}</th>
                {PETZONE_PERMISSION_KEYS.map((perm) => (
                  <th key={perm} className="px-3 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t(`staff.perm_${perm}` as any)}
                  </th>
                ))}
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {staff.map((member) => (
                <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm">{member.email}</td>
                  <td className="px-4 py-3 text-sm font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline" className={ROLE_BADGE[member.role]}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </td>
                  {PETZONE_PERMISSION_KEYS.map((perm) => (
                    <td key={perm} className="px-3 py-3 text-center">
                      <Checkbox
                        checked={member.permissions[perm]}
                        onCheckedChange={() => togglePermission(member.id, perm)}
                        disabled={member.role === 'super_admin' || currentUserRole !== 'super_admin'}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    {member.role !== 'super_admin' && currentUserRole === 'super_admin' && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeleteTarget(member)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info note */}
      <p className="mt-4 text-xs text-muted-foreground">
        {t('staff.note')}
      </p>

      {/* Add Staff Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('staff.add_title')}</DialogTitle>
            <DialogDescription>{t('staff.add_desc')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>{t('staff.name')} *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Nguyễn Văn A" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('staff.email')} *</Label>
              <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="e.g. staff@petzone.vn" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('users.role')}</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as StaffRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleAddStaff} disabled={!newEmail || !newName}>{t('staff.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteTarget !== null} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('staff.remove_title')}</DialogTitle>
            <DialogDescription>{t('staff.remove_desc')} <strong>{deleteTarget?.name}</strong> ({deleteTarget?.email})?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{t('common.confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
