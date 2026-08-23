import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({ message = 'We could not load this data.', onRetry }) => (
  <div className="state-box">
    <div className="state-icon danger">
      <AlertTriangle size={28} />
    </div>
    <div className="state-title">Something went wrong</div>
    <p className="state-desc">{message}</p>
    {onRetry && (
      <div className="state-actions">
        <Button icon={RefreshCw} onClick={onRetry}>
          Try Again
        </Button>
      </div>
    )}
  </div>
);

export default ErrorState;
