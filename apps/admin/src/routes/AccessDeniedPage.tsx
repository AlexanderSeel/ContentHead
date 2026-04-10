import { Button, Card } from '../ui/atoms';
import { useNavigate } from 'react-router-dom';

export function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <main className="centered-page">
      <Card title="Access Denied">
        <p>You are not allowed to view this section.</p>
        <Button label="Go to Dashboard" onClick={() => navigate('/')} />
      </Card>
    </main>
  );
}
