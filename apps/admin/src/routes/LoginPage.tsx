import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../app/AuthContext';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState('');

  const from = (location.state as { from?: string } | undefined)?.from ?? '/';

  return (
    <main className="centered-page">
      <Card title="ContentHead Studio Login" subTitle="Sign in to the admin backend">
        <div className="form-row">
          <label>Username</label>
          <InputText value={username} onChange={(event) => setUsername(event.target.value)} />
        </div>
        <div className="form-row">
          <label>Password</label>
          <Password value={password} feedback={false} toggleMask onChange={(event) => setPassword(event.target.value)} />
        </div>
        {error ? <p className="error-text">{error}</p> : null}
        <Button
          label="Login"
          onClick={() =>
            login(username, password)
              .then((ok) => {
                if (ok) {
                  navigate(from, { replace: true });
                } else {
                  setError('Invalid username or password');
                }
              })
              .catch((err: unknown) => setError(String(err)))
          }
        />
      </Card>
    </main>
  );
}
