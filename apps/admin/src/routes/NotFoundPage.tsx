import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="centered-page">
      <Card title="Not Found">
        <p>The requested page does not exist.</p>
        <Button label="Go to Dashboard" onClick={() => navigate('/')} />
      </Card>
    </main>
  );
}
