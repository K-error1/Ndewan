import { useState, useEffect } from 'react';
import { Product, ProductInput } from '@/lib/db';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { 
  Barcode, 
  MapPin, 
  TrendingUp, 
  AlertTriangle,
  Save,
  CheckCircle2,
  ChevronLeft
} from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Electronics', 'Stationery', 'Furniture', 'Hygiene',
  'Food & Beverage', 'Clothing', 'Tools', 'Software', 'Other',
];

interface ProductFormProps {
  initialData?:  Product | null;
  categories:    string[];
  onSave:        (data: ProductInput) => Promise<void>;
  onCancel:      () => void;
  saving?:       boolean;
}

function emptyForm(): ProductInput {
  return {
    name:                '',
    category:            'Electronics',
    price:               0,
    buying_price:        0,
    quantity:            0,
    low_stock_threshold: 10,
    max_stock_threshold: 100,
    barcode:             '',
    location:            '',
    description:         '',
    sku:                 '',
  };
}

export function ProductForm({ initialData, categories, onSave, onCancel, saving }: ProductFormProps) {
  const [form, setForm]     = useState<ProductInput>(emptyForm());
  const [errors, setErrors] = useState<Partial<Record<keyof ProductInput, string>>>({});
  const [customCat, setCustomCat] = useState(false);

  // Merge built-in + existing categories
  const allCats = [...new Set([...DEFAULT_CATEGORIES, ...categories])].sort();

  useEffect(() => {
    if (initialData) {
      setForm({
        name:                initialData.name,
        category:            initialData.category,
        price:               initialData.price,
        buying_price:        initialData.buying_price,
        quantity:            initialData.quantity,
        low_stock_threshold: initialData.low_stock_threshold,
        max_stock_threshold: initialData.max_stock_threshold ?? 100,
        barcode:             initialData.barcode ?? '',
        location:            initialData.location ?? '',
        description:         initialData.description ?? '',
        sku:                 initialData.sku ?? '',
      });
      if (!DEFAULT_CATEGORIES.includes(initialData.category)) setCustomCat(true);
    } else {
      setForm(emptyForm());
      setCustomCat(false);
    }
    setErrors({});
  }, [initialData]);

  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const errs: Partial<Record<keyof ProductInput, string>> = {};
    if (!form.name.trim())         errs.name     = 'Product name is required';
    if (!form.category.trim())     errs.category = 'Category is required';
    if (form.price < 0)            errs.price    = 'Price cannot be negative';
    if (form.buying_price < 0)     errs.buying_price = 'Buying price cannot be negative';
    if (form.quantity < 0)         errs.quantity = 'Quantity cannot be negative';
    if (form.low_stock_threshold < 0) errs.low_stock_threshold = 'Must be 0 or more';
    if (form.max_stock_threshold <= form.low_stock_threshold) errs.max_stock_threshold = 'Must be > low stock';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    await onSave({
      ...form,
      price:               Number(form.price),
      buying_price:        Number(form.buying_price),
      quantity:            Number(form.quantity),
      low_stock_threshold: Number(form.low_stock_threshold),
      max_stock_threshold: Number(form.max_stock_threshold),
    });
  }

  const catOptions = [
    ...allCats.map(c => ({ value: c, label: c })),
    { value: '__custom__', label: '+ Add custom category…' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name + SKU */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Product Name"
          required
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="e.g. Wireless Mouse"
          error={errors.name}
        />
        <Input
          label="SKU (Internal Code)"
          value={form.sku}
          onChange={e => set('sku', e.target.value)}
          placeholder="e.g. ELEC-001"
          error={errors.sku}
        />
      </div>

      {/* Barcode + Location */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="UPC / Barcode"
          value={form.barcode}
          onChange={e => set('barcode', e.target.value)}
          placeholder="Scan or enter code"
          icon={<Barcode size={14} />}
          error={errors.barcode}
        />
        <Input
          label="Warehouse Location"
          value={form.location}
          onChange={e => set('location', e.target.value)}
          placeholder="e.g. Aisle 12, Shelf B"
          icon={<MapPin size={14} />}
          error={errors.location}
        />
      </div>

      {/* Category */}
      {customCat ? (
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Custom Category"
              required
              value={form.category}
              onChange={e => set('category', e.target.value)}
              placeholder="e.g. Medical Supplies"
              error={errors.category}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="md"
            className="mb-0.5"
            onClick={() => { setCustomCat(false); set('category', DEFAULT_CATEGORIES[0]); }}
            icon={<ChevronLeft size={14} />}
          >
            List
          </Button>
        </div>
      ) : (
        <Select
          label="Category"
          required
          value={form.category}
          onChange={e => {
            if (e.target.value === '__custom__') { setCustomCat(true); set('category', ''); }
            else set('category', e.target.value);
          }}
          options={catOptions}
          error={errors.category}
        />
      )}

      {/* Buying Price + Selling Price */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Buying Price (Unit Cost)"
          type="number"
          min="0"
          step="1"
          required
          value={form.buying_price}
          onChange={e => set('buying_price', parseFloat(e.target.value) || 0)}
          placeholder="0"
          error={errors.buying_price}
        />
        <Input
          label="Selling Price (KSH)"
          type="number"
          min="0"
          step="1"
          required
          value={form.price}
          onChange={e => set('price', parseFloat(e.target.value) || 0)}
          placeholder="0"
          error={errors.price}
        />
      </div>

      {/* Quantity in Stock */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Quantity in Stock"
          type="number"
          min="0"
          step="1"
          required
          value={form.quantity}
          onChange={e => set('quantity', parseInt(e.target.value) || 0)}
          placeholder="0"
          error={errors.quantity}
        />
      </div>

      {/* Thresholds */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Input
          label="Minimum (Low Stock Alert)"
          type="number"
          min="0"
          step="1"
          value={form.low_stock_threshold}
          onChange={e => set('low_stock_threshold', parseInt(e.target.value) || 0)}
          error={errors.low_stock_threshold}
          icon={<AlertTriangle size={14} className="text-amber-400" />}
        />
        <Input
          label="Maximum (Overstock Alert)"
          type="number"
          min="1"
          step="1"
          value={form.max_stock_threshold}
          onChange={e => set('max_stock_threshold', parseInt(e.target.value) || 0)}
          error={errors.max_stock_threshold}
          icon={<TrendingUp size={14} className="text-emerald-400" />}
        />
      </div>

      {/* Description */}
      <Textarea
        label="Operational Notes / Description"
        value={form.description}
        onChange={e => set('description', e.target.value)}
        placeholder="Specifications, shelf handling instructions, etc."
      />

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} size="lg" className="rounded-xl">
          Discard Changes
        </Button>
        <Button 
          type="submit" 
          variant="primary" 
          loading={saving} 
          size="xl" 
          className="rounded-xl shadow-xl shadow-indigo-900/20"
          icon={initialData ? <Save size={18} /> : <CheckCircle2 size={18} />}
        >
          {initialData ? 'Update Record' : 'Commit to Catalog'}
        </Button>
      </div>
    </form>
  );
}
