import { Button, Card, TextInput, Password } from '../ui/atoms';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../app/AuthContext';
import { createSdk } from '@contenthead/sdk';
import { getApiGraphqlUrl } from '../lib/api';

export function LoginPage() {
  const { login } = useAuth();
  // Use the raw SDK (no error-reporting wrapper) — this is a best-effort
  // unauthenticated call to discover external auth providers. Failures are
  // expected when the endpoint requires auth and must not trigger global toasts.
  const sdk = useMemo(() => createSdk({ endpoint: getApiGraphqlUrl() }), []);
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123!');
  const [error, setError] = useState('');
  const [externalProviders, setExternalProviders] = useState<Array<{ id: number; name: string; type: string }>>([]);

  const from = (location.state as { from?: string } | undefined)?.from ?? '/';

  useEffect(() => {
    sdk
      .listConnectors({ domain: 'auth' })
      .then((res) =>
        setExternalProviders(
          (res.listConnectors ?? [])
            .filter((entry) => entry.enabled && entry.type !== 'internal')
            .filter(
              (entry): entry is { id: number; name: string; type: string } =>
                typeof entry.id === 'number' && typeof entry.name === 'string' && typeof entry.type === 'string'
            )
            .map((entry) => ({ id: entry.id, name: entry.name, type: entry.type }))
        )
      )
      .catch(() => setExternalProviders([]));
  }, [sdk]);

  return (
    <main className="centered-page">
      <Card title="ContentHead Studio Login" subTitle="Sign in to the admin backend">
        <div className="form-row">
          <label>Username</label>
          <TextInput value={username} onChange={(next) => setUsername(next)} />
        </div>
        <div className="form-row">
          <label>Password</label>
          <Password value={password} toggleMask onChange={(next) => setPassword(next)} />
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
        {externalProviders.length > 0 ? (
          <div className="form-row mt-3">
            <label>External providers</label>
            <div className="inline-actions">
              {externalProviders.map((provider) => (
                <Button
                  key={provider.id}
                  text
                  label={`Continue with ${provider.name}`}
                  onClick={() => setError(`${provider.type} connector is configured. External login flow is stubbed in this build.`)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </Card>
    </main>
  );
}

