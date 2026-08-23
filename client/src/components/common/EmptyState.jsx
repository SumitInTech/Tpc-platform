import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, actions }) => (
  <div className="state-box">
    <div className="state-icon">
      <Icon size={28} />
    </div>
    <div className="state-title">{title}</div>
    {description && <p className="state-desc">{description}</p>}
    {actions && <div className="state-actions">{actions}</div>}
  </div>
);

export default EmptyState;
