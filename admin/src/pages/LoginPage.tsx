import { FormEvent, useState } from 'react';
import { ApiError, API_BASE_URL } from '../lib/apiClient';
import { useAuth } from '../auth/AuthContext';

type LoginPageProps = {
  onLoginSuccess: () => void;
};

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      onLoginSuccess();
    } catch (err) {
      if (err instanceof ApiError) {
        const requestIdHint = import.meta.env.DEV && err.requestId ? `（requestId: ${err.requestId}）` : '';
        setError(`${err.message || '登入失敗，請確認帳號或密碼。'}${requestIdHint}`);
      } else {
        setError('登入失敗，請稍後再試。');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <section className="login-panel" aria-label="後台登入">
        <div className="login-copy">
          <p className="eyebrow">Admin Login</p>
          <h1>到府服務系統後台</h1>
          <p>請使用後台帳號登入，進入案件、派工、帳務與稽核管理工作台。</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="email"
              data-testid="login-email"
              inputMode="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="admin@example.com"
            />
          </label>

          <label>
            密碼
            <input
              autoComplete="current-password"
              data-testid="login-password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="請輸入密碼"
            />
          </label>

          {error ? <div className="form-error" role="alert">{error}</div> : null}

          <button type="submit" className="primary-button" data-testid="login-submit" disabled={submitting || isLoading}>
            {submitting ? '登入中...' : '登入'}
          </button>

          <p className="form-hint">API：{API_BASE_URL || 'same-origin'}</p>
        </form>
      </section>
    </div>
  );
}
