import './ClaimResultModal.css';

interface ClaimResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: any | null;
}

export default function ClaimResultModal({ isOpen, onClose, result }: ClaimResultModalProps) {
  if (!isOpen || !result) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>领券结果</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="claim-notice">
            <p>领取完成，请前往「已领取」中查看。</p>
            <p className="notice-hint">注意：重复领取无效。</p>
          </div>
        </div>
        <div className="modal-footer">
          <button className="modal-confirm-btn" onClick={onClose}>知道了</button>
        </div>
      </div>
    </div>
  );
}
