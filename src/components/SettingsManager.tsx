import { useState, useEffect } from 'react';
import { db, User, UserInput } from '@/lib/db';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { 
  Settings, 
  Store, 
  Users, 
  ShieldCheck, 
  Save, 
  Trash2, 
  Plus, 
  Lock,
  Smartphone,
  MapPin,
  FileText
} from 'lucide-react';
import { cn } from '@/utils/cn';

export function SettingsManager() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User form state
  const [newUser, setNewUser] = useState<UserInput>({
    username: '',
    full_name: '',
    role: 'cashier',
    password: ''
  });

  const loadData = async () => {
    try {
      const [s, u] = await Promise.all([
        db.settings.getAll(),
        db.users.getAll()
      ]);
      setSettings(s);
      setUsers(u);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleUpdateSetting = async (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    try {
      await db.settings.update(key, value);
    } catch (err) {
      toast('Failed to save setting', 'error');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.password) { toast('Password is required', 'error'); return; }
    if (!newUser.username) { toast('Username is required', 'error'); return; }

    try {
      const result = await db.users.create(newUser);
      if (result.success) {
        toast('✅ User account created', 'success');
        setNewUser({ username: '', full_name: '', role: 'cashier', password: '' });
        await loadData();
      }
    } catch (err: any) {
      toast(err.message || 'Failed to create user', 'error');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await db.users.delete(id);
      toast('User deleted', 'warning');
      await loadData();
    } catch (err) {
      toast('Delete failed', 'error');
    }
  };

  if (loading) return <div className="p-20 text-center animate-spin text-indigo-500"><Settings /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in">
      
      {/* Shop Profile Settings */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-2">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Store size={18} />
          </div>
          <h2 className="text-xl font-bold text-white">Business Profile</h2>
        </div>

        <div className="glass-panel rounded-3xl p-8 border border-white/5 space-y-6">
          <Input
            label="Business Name"
            value={settings.shop_name || ''}
            onChange={e => handleUpdateSetting('shop_name', e.target.value)}
            icon={<Store size={14} />}
          />
          <Input
            label="Physical Address"
            value={settings.shop_address || ''}
            onChange={e => handleUpdateSetting('shop_address', e.target.value)}
            icon={<MapPin size={14} />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Input
              label="Contact Phone"
              value={settings.shop_phone || ''}
              onChange={e => handleUpdateSetting('shop_phone', e.target.value)}
              icon={<Smartphone size={14} />}
            />
            <Input
              label="M-Pesa Till Number"
              value={settings.mpesa_till || ''}
              onChange={e => handleUpdateSetting('mpesa_till', e.target.value)}
              icon={<Lock size={14} />}
            />
          </div>
          <Input
            label="Receipt Footer Message"
            value={settings.receipt_footer || ''}
            onChange={e => handleUpdateSetting('receipt_footer', e.target.value)}
            icon={<FileText size={14} />}
          />
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest px-1">
            Settings are saved automatically as you type.
          </p>
        </div>

        {/* Dynamic Pricing Settings */}
        <div className="flex items-center gap-3 mb-2 px-2 pt-4">
          <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
            <Lock size={18} />
          </div>
          <h2 className="text-xl font-bold text-white">Pricing & Services</h2>
        </div>
        <div className="glass-panel rounded-3xl p-8 border border-white/5 space-y-6">
          <p className="text-xs text-slate-400">Update the default selling prices for all your services here.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(settings).filter(k => k.startsWith('price_')).map(key => (
              <Input
                key={key}
                label={key.replace('price_', '').replace(/_/g, ' ').toUpperCase()}
                type="number"
                value={settings[key]}
                onChange={e => handleUpdateSetting(key, e.target.value)}
                icon={<Lock size={12} />}
              />
            ))}
          </div>
        </div>
      </div>

      {/* User Management */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2 px-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
            <Users size={18} />
          </div>
          <h2 className="text-xl font-bold text-white">Access Control</h2>
        </div>

        {/* Existing Users List */}
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/[0.01]">
            <h3 className="text-sm font-bold text-white">Staff Accounts</h3>
          </div>
          <div className="divide-y divide-white/5">
            {users.map(u => (
              <div key={u.id} className="p-4 flex items-center justify-between group hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center",
                    u.role === 'admin' ? "bg-indigo-500/10 text-indigo-400" : "bg-slate-800 text-slate-500"
                  )}>
                    {u.role === 'admin' ? <ShieldCheck size={14} /> : <Users size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{u.full_name || u.username}</p>
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter">{u.role}</p>
                  </div>
                </div>
                {u.username !== 'admin' && (
                  <button 
                    onClick={() => handleDeleteUser(u.id)}
                    className="h-8 w-8 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-500 hover:text-white"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add New User Form */}
        <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-white/[0.01]">
          <h3 className="text-sm font-bold text-white mb-4">Add New Account</h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Jane Doe"
                value={newUser.full_name}
                onChange={e => setNewUser({ ...newUser, full_name: e.target.value })}
              />
              <Input
                label="Username"
                required
                placeholder="janedoe"
                value={newUser.username}
                onChange={e => setNewUser({ ...newUser, username: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Role"
                options={[{ value: 'cashier', label: 'Cashier' }, { value: 'admin', label: 'Admin' }]}
                value={newUser.role}
                onChange={e => setNewUser({ ...newUser, role: e.target.value as any })}
              />
              <Input
                label="Login Password"
                type="password"
                required
                placeholder="Set a password"
                value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
              />
            </div>
            <Button type="submit" variant="primary" fullWidth icon={<Plus size={16} />} className="mt-2">
              Create Account
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
