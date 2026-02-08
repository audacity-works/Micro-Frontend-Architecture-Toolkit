import { lazy, Suspense } from 'react';

// @ts-ignore
const RemoteSignIn = lazy(() => import('authMfe/SignIn'));

const AuthPage = () => {
  return (
    <div className="auth-page">
      <Suspense fallback={
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      }>
        <RemoteSignIn />
      </Suspense>
    </div>
  );
};

export default AuthPage;
