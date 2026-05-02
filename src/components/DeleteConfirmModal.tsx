import { Product } from '@/lib/db';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

interface DeleteConfirmModalProps {
  product:   Product | null;
  onConfirm: () => Promise<void>;
  onCancel:  () => void;
  deleting?: boolean;
}

export function DeleteConfirmModal({ product, onConfirm, onCancel, deleting }: DeleteConfirmModalProps) {
  return (
    <Modal
      open={!!product}
      onClose={onCancel}
      title="⚠️ Confirm Delete"
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm} loading={deleting} size="lg">
            🗑️ Delete Product
          </Button>
        </div>
      }
    >
      <div className="text-center space-y-3 py-2">
        <div className="text-5xl">🗑️</div>
        <p className="text-slate-200 font-semibold text-lg">
          Delete "{product?.name}"?
        </p>
        <p className="text-slate-400 text-sm">
          This will permanently remove the product and all its price history.
          <br />
          <strong className="text-red-400">This action cannot be undone.</strong>
        </p>
      </div>
    </Modal>
  );
}
