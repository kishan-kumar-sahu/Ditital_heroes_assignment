import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Home,
  CalendarDays,
  BarChart3,
  Heart,
  Ticket,
  Trophy,
  ReceiptText,
  UserCircle,
  Settings,
  Users,
  Gift,
  LineChart,
  LogOut,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  Save,
  Menu,
  X,
} from 'lucide-react';

import { api } from './api';
import './styles.css';

/* =========================================================
   HELPERS
========================================================= */

const money = (n) => `₹ ${Number(199 || 0).toFixed(2)}`;

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeString = (value) => String(value ?? '');

async function loadRazorpayCheckout() {
  if (window.Razorpay) return true;

  await new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', resolve, { once: true });
      existing.addEventListener('error', reject, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Unable to load the payment checkout.'));
    document.body.appendChild(script);
  });

  return Boolean(window.Razorpay);
}

/* =========================================================
   ROOT APP
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const handleLogout = () => {
      if (mounted) setUser(null);
    };

    window.addEventListener('dh:logout', handleLogout);

    api('/auth/me')
      .then((data) => {
        if (mounted) {
          setUser(data.user);
        }
      })
      .catch(() => {
        if (mounted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
      window.removeEventListener('dh:logout', handleLogout);
    };
  }, []);

  if (loading) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  return <AppShell user={user} setUser={setUser} />;
}

/* =========================================================
   APP SHELL
========================================================= */

function AppShell({ user, setUser }) {
  const [view, setView] = useState(
    user?.role === 'admin' ? 'admin-dashboard' : 'dashboard'
  );

  const [mobile, setMobile] = useState(false);

  // Keep the active screen in sync after login/register and role changes.
  useEffect(() => {
    if (user) {
      setView(user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } else {
      setView('login');
    }
  }, [user?.id, user?.role]);

  const logout = async () => {
    try {
      if (localStorage.getItem('dh_token')) {
        await api('/auth/logout', { method: 'POST' });
      }
    } catch {
      // Local logout must still work if the API is unavailable.
    } finally {
      localStorage.removeItem('dh_token');
      setUser(null);
      setView('login');
      setMobile(false);
    }
  };

  if (!user || view === 'login' || view === 'register') {
    return (
      <Auth
        mode={view === 'register' ? 'register' : 'login'}
        setUser={setUser}
        setView={setView}
      />
    );
  }

  const admin = user.role === 'admin';

  const nav = admin
    ? [
        ['admin-dashboard', 'Dashboard', Home],
        ['users', 'Users Management', Users],
        ['draw', 'Draw Management', Gift],
        ['charity', 'Charity Management', Heart],
        ['winners', 'Winner Management', Trophy],
        ['reports', 'Reports & Analytics', LineChart],
        ['settings', 'Settings', Settings],
      ]
    : [
        ['dashboard', 'Dashboard', Home],
        ['subscription', 'My Subscription', CalendarDays],
        ['scores', 'My Scores', BarChart3],
        ['charity', 'Charity', Heart],
        ['draws', 'Draws', Ticket],
        ['winnings', 'Winnings', Trophy],
        ['payments', 'Payment History', ReceiptText],
        ['profile', 'Profile', UserCircle],
        ['settings', 'Settings', Settings],
      ];

  return (
    <div className="app">
      <aside className={mobile ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">♥</div>

          <div>
            <b>Digital Heroes</b>
            <small>Play Golf. Create Impact.</small>
          </div>

          <button
            className="icon-btn mobile-close"
            onClick={() => setMobile(false)}
            type="button"
          >
            <X />
          </button>
        </div>

        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              className={view === key ? 'active' : ''}
              onClick={() => {
                setView(key);
                setMobile(false);
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>

        <div className="support">
          <Heart size={20} />
          <b>Your support changes lives</b>
          <span>Together we make a difference.</span>
        </div>

        <button className="logout" onClick={logout} type="button">
          <LogOut size={17} />
          Sign out
        </button>
      </aside>

      <main>
        <header>
          <button
            className="icon-btn menu"
            onClick={() => setMobile(true)}
            type="button"
          >
            <Menu />
          </button>

          <div>
            <span className="muted">Welcome back,</span>
            <h1>{user.name}</h1>
          </div>

          <div className="header-user">
            <UserCircle size={30} />
            <span>{user.role === 'admin' ? 'Admin' : user.name}</span>
          </div>
        </header>

        <Content view={view} user={user} />
      </main>
    </div>
  );
}

/* =========================================================
   AUTH
========================================================= */

function Auth({ mode, setUser, setView }) {
  const [form, setForm] = useState({
    // demo@digitalheroes.co.in   and  Demo@12345
    name: '',
    email: mode === 'login' ? '' : '',
    password: mode === 'login' ? '' : '',
  });

  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint =
        mode === 'login' ? '/auth/login' : '/auth/register';

      const data = await api(endpoint, {
        method: 'POST',
        body: JSON.stringify(form),
      });

      if (!data?.token || !data?.user) {
        throw new Error('Login succeeded but the server returned an invalid session.');
      }

      localStorage.setItem('dh_token', data.token);
      setUser(data.user);
      setView(data.user.role === 'admin' ? 'admin-dashboard' : 'dashboard');
    } catch (error) {
      setError(error.message || 'Something went wrong.');
    }
  };

  return (
    <div className="auth-page  ">
      <div className="auth-card">
        <div className="brand center-brand">
          <div className="brand-mark">♥</div>

          <div>
            <b>Digital Heroes</b>
            <small>Play Golf. Create Impact.</small>
          </div>
        </div>

        <h2>
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h2>

        <p className="muted">
          Golf performance, rewards and charitable impact.
        </p>

        <form onSubmit={submit}>
          {mode === 'register' && (
            <input
              placeholder="Full name"
              value={form.name}
              onChange={(e) =>
                setForm({
                  ...form,
                  name: e.target.value,
                })
              }
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) =>
              setForm({
                ...form,
                password: e.target.value,
              })
            }
            required
          />

          <button className="btn primary full" type="submit">
            {mode === 'login' ? 'Sign in' : 'Create account'}
          </button>

          {error && <div className="error">{error}</div>}
        </form>

        <button
          className="link-btn"
          type="button"
          onClick={() =>
            setView(mode === 'login' ? 'register' : 'login')
          }
        >
          {mode === 'login'
            ? 'Create a new account'
            : 'Already have an account? Sign in'}
        </button>

        <p className="demo">
          Demo user: demo@digitalheroes.co.in / Demo@12345
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   CONTENT ROUTER
========================================================= */

function Content({ view, user }) {
  if (user.role === 'admin') {
    return <AdminView view={view} />;
  }

  return <UserView view={view} user={user} />;
}

/* =========================================================
   COMMON COMPONENTS
========================================================= */

function Layout({ title, subtitle, children, actions }) {
  return (
    <section className="content">
      <div className="section-title">
        <div>
          <h2>{title}</h2>
          {subtitle && <span>{subtitle}</span>}
        </div>

        <div>{actions}</div>
      </div>

      {children}
    </section>
  );
}

function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

/* =========================================================
   USER VIEW
========================================================= */

function UserView({ view }) {
  const [data, setData] = useState(null);
  const [charities, setCharities] = useState([]);
  const [refresh, setRefresh] = useState(0);
  const [modal, setModal] = useState(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    setMsg('');

    Promise.all([
      api('/dashboard'),
      api('/charities'),
    ])
      .then(([dashboardData, charityData]) => {
        if (!mounted) return;

        setData(dashboardData);
        setCharities(safeArray(charityData?.charities));
      })
      .catch((error) => {
        if (mounted) {
          setMsg(error.message || 'Unable to load dashboard.');
        }
      });

    return () => {
      mounted = false;
    };
  }, [refresh]);

  const run = async (fn) => {
    try {
      await fn();
      setRefresh((x) => x + 1);
      setModal(null);
      return null;
    } catch (error) {
      setMsg(error.message || 'Something went wrong.');
      return error;
    }
  };

  const modalNode =
    modal?.type === 'score' || modal?.type === 'edit' ? (
      <ScoreModal
        open
        score={modal.score}
        existingScores={safeArray(data?.scores)}
        onClose={() => setModal(null)}
        onSave={async (form) => {
          await api(
            modal.type === 'edit'
              ? `/scores/${modal.score._id}`
              : '/scores',
            {
              method: modal.type === 'edit' ? 'PUT' : 'POST',
              body: JSON.stringify(form),
            }
          );
          setRefresh((x) => x + 1);
          setModal(null);
        }}
      />
    ) : null;

  if (msg && !data) {
    return (
      <Layout title="Dashboard">
        <Card className="panel">
          <div className="error">{msg}</div>
        </Card>
      </Layout>
    );
  }

  if (!data) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  if (view === 'dashboard') {
    return (
      <>
        <Dashboard
          data={data}
          setModal={setModal}
          run={run}
        />
        {modalNode}
      </>
    );
  }

  if (view === 'subscription') {
    return (
      <Subscription
        data={data}
        charities={charities}
        run={run}
      />
    );
  }

  if (view === 'scores') {
    return (
      <>
        <Scores
          data={data}
          run={run}
          setModal={setModal}
        />
        {modalNode}
      </>
    );
  }

  if (view === 'charity') {
    return (
      <Charity
        data={data}
        charities={charities}
        run={run}
      />
    );
  }

  if (view === 'draws') {
    return <Draws data={data} />;
  }

  if (view === 'winnings') {
    return <Winnings data={data} run={run} />;
  }

  if (view === 'payments') {
    return <Payments />;
  }

  if (view === 'profile' || view === 'settings') {
    return (
      <Layout
        title={view === 'profile' ? 'Profile' : 'Settings'}
        subtitle="Manage your Digital Heroes account"
      >
        <Card className="panel">
          <h3>{data.user?.name || 'User'}</h3>
          <p>{data.user?.email || ''}</p>
          <p>Role: {data.user?.role || 'user'}</p>
        </Card>
      </Layout>
    );
  }

  return null;
}

/* =========================================================
   USER DASHBOARD
========================================================= */

function Dashboard({ data, setModal, run }) {
  const subscription = data.subscription;
  const scores = safeArray(data.scores);
  const draws = safeArray(data.draws);
  const winnings = data.winnings || {};

  return (
    <Layout
      title="Your Golf Scores. Create Real Change"
      subtitle="Play, win, and support amazing charities."
    >
      <div className="hero">
        <div>
          <h2>Play. Win. Give back.</h2>
          <p>Every score makes a difference.</p>

          <button
            className="btn primary"
            type="button"
            onClick={() => setModal({ type: 'score' })}
          >
            <Plus size={17} />
            Add New Score
          </button>
        </div>

        <div className="hero-stats">
          <div>
            <span>Total Winnings</span>
            <b>{money(winnings.total)}</b>
          </div>

          <div>
            <span>Charity Contribution</span>
            <b>{subscription?.contributionPercent || 0}%</b>
          </div>

          <div>
            <span>Draws Entered</span>
            <b>{draws.length}</b>
          </div>
        </div>
      </div>

      <div className="grid g4">
        <Card className="metric">
          <span>Latest Score</span>
          <b>{scores[0]?.score || '—'}</b>
          <small>{scores[0]?.date || 'No score yet'}</small>
        </Card>

        <Card className="metric">
          <span>Next Draw</span>
          <b>{draws[0]?.drawDate || '—'}</b>
          <small>Monthly draw</small>
        </Card>

        <Card className="metric">
          <span>Selected Charity</span>
          <b>{data.charity?.name || '—'}</b>
          <small>
            {subscription?.contributionPercent || 10}% contribution
          </small>
        </Card>

        <Card className="metric">
          <span>Total Winnings</span>
          <b>{money(winnings.total)}</b>
          <small>{winnings.status || 'No winnings'}</small>
        </Card>
      </div>

      <div className="grid g2">
        <Card className="panel">
          <h3>My Recent Golf Scores</h3>

          <ScoreTable
            scores={scores.slice(0, 5)}
            onEdit={(score) =>
              setModal({
                type: 'edit',
                score,
              })
            }
            onDelete={(id) =>
              run(() =>
                api(`/scores/${id}`, {
                  method: 'DELETE',
                })
              )
            }
          />
        </Card>

        <Card className="panel">
          <h3>Upcoming Draws</h3>

          {draws.slice(0, 3).map((draw) => (
            <div className="list-row" key={draw._id}>
              <Ticket size={20} />

              <div>
                <b>{draw.drawDate}</b>
                <small>{draw.status}</small>
              </div>
            </div>
          ))}

          {!draws.length && (
            <p className="empty">No upcoming draws.</p>
          )}
        </Card>
      </div>
    </Layout>
  );
}

/* =========================================================
   SCORES
========================================================= */

function Scores({ data, run, setModal }) {
  const scores = safeArray(data.scores);

  return (
    <Layout
      title="My Golf Scores"
      subtitle="Only your latest 5 Stableford scores are retained."
      actions={
        <button
          className="btn primary"
          type="button"
          onClick={() => setModal({ type: 'score' })}
        >
          <Plus size={17} />
          Add score
        </button>
      }
    >
      <Card className="panel">
        <ScoreTable
          scores={scores}
          onEdit={(score) =>
            setModal({
              type: 'edit',
              score,
            })
          }
          onDelete={(id) =>
            run(() =>
              api(`/scores/${id}`, {
                method: 'DELETE',
              })
            )
          }
        />

        <p className="hint">
          Score range: 1–45. Only one score per date. A new sixth
          score automatically removes the oldest.
        </p>
      </Card>
    </Layout>
  );
}

function ScoreTable({ scores, onEdit, onDelete }) {
  const list = safeArray(scores);

  return (
    <table className="table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Score</th>
          <th>Format</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {list.map((score) => (
          <tr key={score._id}>
            <td>{score.date}</td>

            <td>
              <span className="score-pill">{score.score}</span>
            </td>

            <td>Stableford</td>

            <td>
              {onEdit && (
                <button
                  className="icon-btn"
                  type="button"
                  onClick={() => onEdit(score)}
                >
                  <Edit3 size={14} />
                </button>
              )}

              {onDelete && (
                <button
                  className="icon-btn danger-icon"
                  type="button"
                  onClick={() => onDelete(score._id)}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </td>
          </tr>
        ))}

        {!list.length && (
          <tr>
            <td colSpan="4" className="empty">
              No scores yet.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

/* =========================================================
   SUBSCRIPTION
========================================================= */

function Subscription({ data, charities, run }) {
  const subscription = data.subscription;

  const [plan, setPlan] = useState(
    subscription?.plan || 'monthly'
  );

  const [pct, setPct] = useState(
    subscription?.contributionPercent || 10
  );

  const [cid, setCid] = useState(
    subscription?.charityId?._id ||
      data.charity?._id ||
      charities[0]?._id ||
      ''
  );

  const [paymentError, setPaymentError] = useState('');

  useEffect(() => {
    setPlan(subscription?.plan || 'monthly');
    setPct(subscription?.contributionPercent || 10);
    setPaymentError('');

    setCid(
      subscription?.charityId?._id ||
        data.charity?._id ||
        charities[0]?._id ||
        ''
    );
  }, [
    subscription?.plan,
    subscription?.contributionPercent,
    subscription?.charityId?._id,
    data.charity?._id,
    charities,
  ]);

  return (
    <Layout
      title="My Subscription"
      subtitle="Manage plan, charity and contribution"
    >
      <div className="grid g2">
        <Card className="panel">
          <span className="badge">
            {subscription?.status || 'inactive'}
          </span>

          <h2>
            {subscription?.plan === 'yearly'
              ? 'Yearly'
              : 'Monthly'}{' '}
            plan
          </h2>

          <p>
            {money(subscription?.amount || 0)} /{' '}
            {subscription?.plan || 'month'}
          </p>

          <p>
            Next renewal:{' '}
            <b>{subscription?.nextRenewal || '—'}</b>
          </p>

          <div className="plan-row">
            <button
              type="button"
              className={
                plan === 'monthly' ? 'selected' : ''
              }
              onClick={() => setPlan('monthly')}
            >
              {/* Monthly · $ 20 */}
                 Monthly · ₹ 199
            </button>

            <button
              type="button"
              className={
                plan === 'yearly' ? 'selected' : ''
              }
              onClick={() => setPlan('yearly')}
            >
              Yearly · ₹ 2000
            </button>
          </div>

          <button
            className="btn primary"
            type="button"
            onClick={async () => {
              try {
                if (!cid) throw new Error('Please select a charity.');

                await loadRazorpayCheckout();

                const order = await api('/payments/create-order', {
                  method: 'POST',
                  body: JSON.stringify({
                    plan,
                    charityId: cid,
                    contributionPercent: Number(pct),
                  }),
                });

                const checkout = new window.Razorpay({
                  key: order.keyId,
                  amount: order.amount,
                  currency: order.currency,
                  name: order.name,
                  description: order.description,
                  order_id: order.orderId,
                  prefill: order.prefill,
                  theme: { color: '#0db57d' },
                  handler: async (response) => {
                    const error = await run(() =>
                      api('/payments/verify', {
                        method: 'POST',
                        body: JSON.stringify(response),
                      })
                    );

                    if (error) {
                      setPaymentError(
                        error.message || 'Payment verification failed.'
                      );
                    } else {
                      setPaymentError('Payment successful. Your subscription is now active.');
                    }
                  },
                  modal: {
                    ondismiss: () => {},
                  },
                });

                checkout.on('payment.failed', (response) => {
                  setPaymentError(
                    response?.error?.description ||
                      'Payment failed. Please try again.'
                  );
                });

                checkout.open();
              } catch (error) {
                setPaymentError(error.message || 'Unable to start payment.');
              }
            }}
          >
            Pay & activate subscription
          </button>

          {paymentError && <div className="error">{paymentError}</div>}

          {subscription?.status === 'active' && (
            <button
              className="btn danger"
              type="button"
              onClick={() =>
                run(() =>
                  api('/subscription/cancel', {
                    method: 'POST',
                  })
                )
              }
            >
              Cancel subscription
            </button>
          )}
        </Card>

        <Card className="panel">
          <h3>Charity contribution</h3>

          <p>
            Minimum contribution is 10% of your subscription
            fee.
          </p>

          <input
            type="range"
            min="10"
            max="100"
            value={pct}
            onChange={(e) => setPct(e.target.value)}
          />

          <h2>{pct}%</h2>

          <select
            value={cid}
            onChange={(e) => setCid(e.target.value)}
          >
            <option value="">Select charity</option>

            {charities.map((charity) => (
              <option
                key={charity._id}
                value={charity._id}
              >
                {charity.name}
              </option>
            ))}
          </select>
        </Card>
      </div>
    </Layout>
  );
}

/* =========================================================
   CHARITY
========================================================= */

function Charity({ data, charities, run }) {
  const subscription = data.subscription;

  const [pct, setPct] = useState(
    subscription?.contributionPercent || 10
  );

  const [cid, setCid] = useState(
    data.charity?._id || ''
  );

  useEffect(() => {
    setPct(subscription?.contributionPercent || 10);
    setCid(data.charity?._id || '');
  }, [
    subscription?.contributionPercent,
    data.charity?._id,
  ]);

  return (
    <Layout
      title="Charity"
      subtitle="Choose where your contribution goes"
    >
      <div className="grid g3">
        {charities.map((charity) => (
          <Card
            key={charity._id}
            className={
              cid === charity._id
                ? 'charity-card selected'
                : 'charity-card'
            }
          >
            <img
              src={charity.image}
              alt={charity.name}
            />

            <h3>{charity.name}</h3>

            <p>{charity.description}</p>

            <button
              className="btn outline"
              type="button"
              onClick={() => setCid(charity._id)}
            >
              {cid === charity._id ? 'Selected' : 'Select'}
            </button>
          </Card>
        ))}
      </div>

      <Card className="panel charity-settings">
        <h3>Contribution percentage</h3>

        <input
          type="range"
          min="10"
          max="100"
          value={pct}
          onChange={(e) => setPct(e.target.value)}
        />

        <b>{pct}%</b>

        <p className="hint">
          Charity changes are saved together with the next subscription payment.
        </p>
      </Card>
    </Layout>
  );
}

/* =========================================================
   DRAWS
========================================================= */

function Draws({ data }) {
  const draws = safeArray(data.draws);

  return (
    <Layout
      title="Draws"
      subtitle="Monthly draw participation and results"
    >
      <div className="grid g2">
        {draws.map((draw) => (
          <Card className="panel" key={draw._id}>
            <div className="section-title">
              <h3>{draw.drawDate}</h3>

              <span className="badge">
                {draw.status}
              </span>
            </div>

            <p>
              Winning numbers:{' '}
              {draw.winningNumbers?.join(' · ') ||
                'Pending'}
            </p>

            <p>
              Prize pool: {money(draw.pool)}
            </p>
          </Card>
        ))}

        {!draws.length && (
          <Card className="panel">
            <p className="empty">No draws available.</p>
          </Card>
        )}
      </div>
    </Layout>
  );
}

/* =========================================================
   PAYMENTS
========================================================= */

function Payments() {
  const [payments, setPayments] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    api('/payments')
      .then((result) => mounted && setPayments(safeArray(result?.payments)))
      .catch((err) => mounted && setError(err.message || 'Unable to load payments.'));
    return () => { mounted = false; };
  }, []);

  if (!payments && !error) return <div className="center"><div className="spinner" /></div>;

  return (
    <Layout title="Payment History" subtitle="Subscription and prize payment records">
      <Card className="panel">
        {error && <div className="error">{error}</div>}
        <table className="table">
          <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Status</th><th>Note</th></tr></thead>
          <tbody>
            {safeArray(payments).map((p) => (
              <tr key={p._id}>
                <td>{p.createdAt ? new Date(p.createdAt).toLocaleString() : '—'}</td>
                <td>{p.type || '—'}</td>
                <td>{money(p.amount)}</td>
                <td><span className="badge">{p.status || '—'}</span></td>
                <td>{p.note || '—'}</td>
              </tr>
            ))}
            {!safeArray(payments).length && !error && <tr><td colSpan="5" className="empty">No payments yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}

/* =========================================================
   WINNINGS
========================================================= */

function Winnings({ data, run }) {
  const [proof, setProof] = useState({});

  const winnings = data.winnings || {};
  const items = safeArray(winnings.items);

  return (
    <Layout
      title="Winnings"
      subtitle="Track verification and payout status"
    >
      <Card className="panel">
        <h3>Total winnings: {money(winnings.total)}</h3>

        <table className="table">
          <thead>
            <tr>
              <th>Match</th>
              <th>Prize</th>
              <th>Verification</th>
              <th>Payout</th>
              <th>Proof</th>
            </tr>
          </thead>

          <tbody>
            {items.map((winning) => (
              <tr key={winning._id}>
                <td>{winning.matches}-match</td>

                <td>{money(winning.prize)}</td>

                <td>{winning.verification}</td>

                <td>{winning.payoutStatus}</td>

                <td>
                  <input
                    placeholder="Proof URL"
                    value={proof[winning._id] || ''}
                    onChange={(e) =>
                      setProof({
                        ...proof,
                        [winning._id]: e.target.value,
                      })
                    }
                  />

                  <button
                    className="btn outline small"
                    type="button"
                    onClick={() =>
                      run(() =>
                        api(
                          `/winners/${winning._id}/proof`,
                          {
                            method: 'POST',
                            body: JSON.stringify({
                              proofUrl:
                                proof[winning._id],
                            }),
                          }
                        )
                      )
                    }
                  >
                    <Upload size={14} />
                  </button>
                </td>
              </tr>
            ))}

            {!items.length && (
              <tr>
                <td colSpan="5" className="empty">
                  No winnings yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}

/* =========================================================
   ADMIN VIEW
========================================================= */

function AdminView({ view }) {
  const [data, setData] = useState(null);
  const [refresh, setRefresh] = useState(0);
  const [charities, setCharities] = useState([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    setMsg('');

    Promise.all([
      api('/admin/metrics'),
      api('/charities'),
    ])
      .then(([metricsData, charityData]) => {
        if (!mounted) return;

        setData(metricsData);
        setCharities(
          safeArray(charityData?.charities)
        );
      })
      .catch((error) => {
        if (mounted) {
          setMsg(
            error.message ||
              'Unable to load admin dashboard.'
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [refresh]);

  const reload = () => {
    setRefresh((x) => x + 1);
  };

  if (msg) {
    return (
      <Layout title="Admin">
        <Card className="panel">
          <div className="error">{msg}</div>
        </Card>
      </Layout>
    );
  }

  if (!data) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  if (
    view === 'admin-dashboard' ||
    view === 'reports'
  ) {
    return <AdminDashboard data={data} />;
  }

  if (view === 'users') {
    return <AdminUsers reload={reload} />;
  }

  if (view === 'draw') {
    return <AdminDraw reload={reload} />;
  }

  if (view === 'charity') {
    return (
      <AdminCharity
        charities={charities}
        reload={reload}
      />
    );
  }

  if (view === 'winners') {
    return <AdminWinners reload={reload} />;
  }

  return (
    <Layout title="Admin Settings">
      <Card className="panel">
        Environment and account settings.
      </Card>
    </Layout>
  );
}

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard({ data }) {
  const metrics = data.metrics || {};
  const topCharities = safeArray(data.topCharities);
  const recentWinners = safeArray(data.recentWinners);

  return (
    <Layout
      title="Admin Dashboard"
      subtitle="Overview of platform activity and key metrics"
    >
      <div className="grid g4">
        <Card className="metric">
          <span>Total users</span>
          <b>{metrics.totalUsers || 0}</b>
          <small>Registered subscribers</small>
        </Card>

        <Card className="metric">
          <span>Active subscriptions</span>
          <b>{metrics.activeSubscriptions || 0}</b>
        </Card>

        <Card className="metric">
          <span>Total prize pool</span>
          <b>{money(metrics.totalPrizePool)}</b>
        </Card>

        <Card className="metric">
          <span>Charity contribution</span>
          <b>{money(metrics.charityContribution)}</b>
        </Card>
      </div>

      <div className="grid g2">
        <Card className="panel">
          <h3>Top charities</h3>

          {topCharities.map((charity) => {
            const percentage =
              metrics.charityContribution
                ? Math.min(
                    100,
                    (charity.amount /
                      metrics.charityContribution) *
                      100
                  )
                : 0;

            return (
              <div
                className="progress-row"
                key={charity.name}
              >
                <div>
                  <b>{charity.name}</b>
                  <span>{money(charity.amount)}</span>
                </div>

                <div className="progress">
                  <i
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </Card>

        <Card className="panel">
          <h3>Recent winners</h3>

          {recentWinners.map((winner) => (
            <div
              className="list-row"
              key={winner._id}
            >
              <Trophy size={18} />

              <div>
                <b>{winner.matches}-match</b>

                <small>
                  {money(winner.prize)} ·{' '}
                  {winner.verification}
                </small>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </Layout>
  );
}

/* =========================================================
   ADMIN USERS
========================================================= */

function AdminUsers({ reload }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;

    api('/admin/users')
      .then((result) => {
        if (mounted) {
          setData(result);
        }
      })
      .catch(() => {
        if (mounted) {
          setData({ users: [] });
        }
      });

    return () => {
      mounted = false;
    };
  }, [reload]);

  if (!data) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  const users = safeArray(data.users);

  return (
    <Layout
      title="User Management"
      subtitle="View profiles, subscriptions and status"
    >
      <Card className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Subscription</th>
              <th>Renewal</th>
            </tr>
          </thead>

          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>

                <td>
                  {user.subscription?.plan || '—'} /{' '}
                  {user.subscription?.status ||
                    'inactive'}
                </td>

                <td>
                  {user.subscription?.nextRenewal ||
                    '—'}
                </td>
              </tr>
            ))}

            {!users.length && (
              <tr>
                <td colSpan="4" className="empty">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}

/* =========================================================
   ADMIN DRAW
========================================================= */

function AdminDraw() {
  const [simulation, setSimulation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState('');

  const go = async (mode) => {
    setLoading(true);
    setMessage('');

    try {
      const result = await api(
        '/admin/draws/simulate',
        {
          method: 'POST',
          body: JSON.stringify({ mode }),
        }
      );

      setSimulation(result.simulation);
    } catch (error) {
      setMessage(
        error.message || 'Simulation failed.'
      );
    } finally {
      setLoading(false);
    }
  };

  const publish = async () => {
    setPublishing(true);
    setMessage('');

    try {
      await api('/admin/draws/publish', {
        method: 'POST',
        body: JSON.stringify({
          mode: 'random',
        }),
      });

      setMessage('Draw published successfully.');
    } catch (error) {
      setMessage(
        error.message || 'Unable to publish draw.'
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <Layout
      title="Draw Management"
      subtitle="Simulate before publishing"
    >
      <div className="actions">
        <button
          className="btn outline"
          type="button"
          onClick={() => go('random')}
          disabled={loading}
        >
          Simulate random
        </button>

        <button
          className="btn purple"
          type="button"
          onClick={() => go('algorithmic')}
          disabled={loading}
        >
          Simulate weighted
        </button>

        <button
          className="btn primary"
          type="button"
          onClick={publish}
          disabled={publishing}
        >
          {publishing
            ? 'Publishing...'
            : 'Publish draw'}
        </button>
      </div>

      {message && (
        <div className="success">{message}</div>
      )}

      <Card className="panel">
        {loading ? (
          <p>Running simulation...</p>
        ) : simulation ? (
          <>
            <h3>
              Winning numbers:{' '}
              {safeArray(
                simulation.winningNumbers
              ).join(' · ')}
            </h3>

            <div className="grid g3">
              {[5, 4, 3].map((matches) => {
                const tier =
                  simulation.tiers?.[matches] || {};

                return (
                  <div key={matches}>
                    <b>{matches}-match</b>

                    <h2>
                      {money(tier.pool)}
                    </h2>

                    <small>
                      {tier.winnerCount || 0}{' '}
                      winner(s) ·{' '}
                      {money(tier.perWinner)} each
                    </small>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p>
            Run a simulation to inspect prize tiers.
          </p>
        )}
      </Card>
    </Layout>
  );
}

/* =========================================================
   ADMIN CHARITY
========================================================= */

function AdminCharity({ charities, reload }) {
  const [editing, setEditing] = useState(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '/assets/charity-default.svg',
  });

  const open = (charity = null) => {
    setEditing(charity?._id || '');

    setForm(
      charity
        ? {
            name: charity.name || '',
            description:
              charity.description || '',
            image:
              charity.image ||
              '/assets/charity-default.svg',
          }
        : {
            name: '',
            description: '',
            image: '/assets/charity-default.svg',
          }
    );
  };

  const save = async (e) => {
    e.preventDefault();

    try {
      await api(
        editing
          ? `/admin/charities/${editing}`
          : '/admin/charities',
        {
          method: editing ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        }
      );

      setEditing(null);
      reload();
    } catch (error) {
      alert(error.message || 'Unable to save charity.');
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this charity?')) {
      return;
    }

    try {
      await api(`/admin/charities/${id}`, {
        method: 'DELETE',
      });

      reload();
    } catch (error) {
      alert(
        error.message || 'Unable to delete charity.'
      );
    }
  };

  return (
    <Layout
      title="Charity Management"
      subtitle="Add, edit and delete charity directory entries"
      actions={
        <button
          className="btn primary"
          type="button"
          onClick={() => open()}
        >
          <Plus size={15} />
          Add charity
        </button>
      }
    >
      <div className="grid g2">
        {charities.map((charity) => (
          <Card
            className="panel"
            key={charity._id}
          >
            <div className="charity">
              <img
                src={charity.image}
                alt={charity.name}
              />

              <div>
                <h3>{charity.name}</h3>
                <p>{charity.description}</p>
              </div>
            </div>

            <button
              className="btn outline"
              type="button"
              onClick={() => open(charity)}
            >
              <Edit3 size={14} />
              Edit
            </button>

            <button
              className="btn danger"
              type="button"
              onClick={() => del(charity._id)}
            >
              <Trash2 size={14} />
              Delete
            </button>
          </Card>
        ))}
      </div>

      {editing !== null && (
        <div className="modal">
          <div className="modal-box">
            <h3>
              {editing ? 'Edit' : 'Add'} charity
            </h3>

            <form onSubmit={save}>
              <input
                placeholder="Name"
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                  })
                }
                required
              />

              <textarea
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
              />

              <input
                placeholder="Image URL"
                value={form.image}
                onChange={(e) =>
                  setForm({
                    ...form,
                    image: e.target.value,
                  })
                }
              />

              <button
                className="btn primary"
                type="submit"
              >
                Save
              </button>

              <button
                type="button"
                className="btn outline"
                onClick={() => setEditing(null)}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

/* =========================================================
   ADMIN WINNERS
========================================================= */

function AdminWinners() {
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const result = await api('/admin/winners');
      setData(result);
    } catch {
      setData({ winners: [] });
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!data) {
    return (
      <div className="center">
        <div className="spinner" />
      </div>
    );
  }

  const winners = safeArray(data.winners);

  const act = async (id, approved) => {
    try {
      await api(`/admin/winners/${id}/verify`, {
        method: 'POST',
        body: JSON.stringify({ approved }),
      });

      await load();
    } catch (error) {
      alert(
        error.message ||
          'Unable to update winner verification.'
      );
    }
  };

  const pay = async (id) => {
    try {
      await api(`/admin/winners/${id}/payout`, {
        method: 'POST',
      });

      await load();
    } catch (error) {
      alert(
        error.message ||
          'Unable to mark payout as completed.'
      );
    }
  };

  return (
    <Layout
      title="Winner Management"
      subtitle="Verify proof and mark payouts"
    >
      <Card className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Match</th>
              <th>Prize</th>
              <th>Verification</th>
              <th>Payout</th>
            </tr>
          </thead>

          <tbody>
            {winners.map((winner) => (
              <tr key={winner._id}>
                <td>{winner.user?.name}</td>

                <td>{winner.matches}</td>

                <td>{money(winner.prize)}</td>

                <td>
                  {winner.verification}

                  <div>
                    <button
                      className="btn outline small"
                      type="button"
                      onClick={() =>
                        act(winner._id, true)
                      }
                    >
                      <CheckCircle2 size={13} />
                    </button>

                    <button
                      className="btn danger small"
                      type="button"
                      onClick={() =>
                        act(winner._id, false)
                      }
                    >
                      <XCircle size={13} />
                    </button>
                  </div>
                </td>

                <td>
                  <button
                    className="btn primary small"
                    type="button"
                    disabled={
                      winner.verification !==
                      'approved'
                    }
                    onClick={() =>
                      pay(winner._id)
                    }
                  >
                    Mark paid
                  </button>
                </td>
              </tr>
            ))}

            {!winners.length && (
              <tr>
                <td colSpan="5" className="empty">
                  No winners found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </Layout>
  );
}

/* =========================================================
   SCORE MODAL
========================================================= */

function ScoreModal({
  open,
  onClose,
  score,
  existingScores = [],
  onSave,
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(score?.date || today);
  const [value, setValue] = useState(score?.score || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [scoresLoaded, setScoresLoaded] = useState(false);
  const [duplicatePopup, setDuplicatePopup] = useState(false);

  const normalizeDate = (value) => String(value || '').slice(0, 10);

  const isDuplicate = (selectedDate, scores) => {
    const wanted = normalizeDate(selectedDate);
    return safeArray(scores).some((item) =>
      normalizeDate(item?.date) === wanted &&
      String(item?._id || '') !== String(score?._id || '')
    );
  };

  const openDuplicatePopup = () => {
    setDuplicatePopup(true);
    setError('A score already exists for this date. Please choose another date.');
  };

  const checkDate = async (selectedDate) => {
    const wanted = normalizeDate(selectedDate);
    setDate(wanted);
    setError('');
    if (!wanted) return false;

    try {
      // Dedicated server-side check. This checks the database directly and
      // does not depend on the dashboard's limited five-score list.
      const result = await api(`/scores/check-date?date=${encodeURIComponent(wanted)}`);
      const duplicate = Boolean(result?.exists) &&
        String(result?.score?._id || '') !== String(score?._id || '');
      if (duplicate) openDuplicatePopup();
      return duplicate;
    } catch {
      // Fall back to scores already loaded in the dashboard if the check
      // endpoint cannot be reached. The POST/PUT endpoint remains authoritative.
      const duplicate = isDuplicate(wanted, existingScores);
      if (duplicate) openDuplicatePopup();
      return duplicate;
    }
  };

  useEffect(() => {
    let mounted = true;
    if (!open) return undefined;

    setDate(score?.date || today);
    setValue(score?.score || '');
    setError('');
    setSaving(false);
    setScoresLoaded(false);
    setDuplicatePopup(false);

    // Only use this request to enable Save. Duplicate validation is performed
    // again against the database at submit time.
    api('/scores')
      .then(() => {
        if (mounted) setScoresLoaded(true);
      })
      .catch(() => {
        if (mounted) setScoresLoaded(true);
      });

    return () => { mounted = false; };
  }, [score, open]);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    const numericScore = Number(value);
    const wanted = normalizeDate(date);

    if (!Number.isInteger(numericScore) || numericScore < 1 || numericScore > 45) {
      setError('Stableford score must be an integer between 1 and 45.');
      return;
    }

    if (!wanted) {
      setError('Please select a date.');
      return;
    }

    setSaving(true);
    try {
      // This is the important part: on every Save, ask the database whether
      // this exact user/date combination already exists.
      const result = await api(`/scores/check-date?date=${encodeURIComponent(wanted)}`);
      const duplicate = Boolean(result?.exists) &&
        String(result?.score?._id || '') !== String(score?._id || '');

      if (duplicate) {
        openDuplicatePopup();
        return;
      }

      await onSave({ date: wanted, score: numericScore });
    } catch (err) {
      const message = err?.message || 'Unable to save score.';
      if (/already.*date|date.*already|another score/i.test(message)) {
        openDuplicatePopup();
      } else {
        setError(message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="modal">
        <div className="modal-box">
          <div className="section-title">
            <h3>{score ? 'Edit' : 'Add'} score</h3>
            <button className="icon-btn" type="button" onClick={onClose}>
              <X />
            </button>
          </div>

          <form onSubmit={submit}>
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => checkDate(e.target.value)}
              required
            />

            <label>Stableford score</label>
            <input
              type="number"
              min="1"
              max="45"
              step="1"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />

            <p className="hint">Score must be between 1 and 45.</p>
            {error && <div className="error">{error}</div>}

            <button className="btn primary" type="submit" disabled={saving || !scoresLoaded}>
              <Save size={15} />
              {saving ? 'Checking date…' : !scoresLoaded ? 'Checking date…' : 'Save score'}
            </button>
          </form>
        </div>
      </div>

      {duplicatePopup && (
        <div className="modal" style={{ zIndex: 9999 }}>
          <div className="modal-box" style={{ maxWidth: 440 }}>
            <div className="section-title">
              <h3>Date already exists</h3>
              <button className="icon-btn" type="button" onClick={() => setDuplicatePopup(false)}>
                <X />
              </button>
            </div>
            <p style={{ margin: '12px 0 20px', lineHeight: 1.6 }}>
              A score already exists for <strong>{date}</strong>.
              <br />Please choose another date.
            </p>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                setDuplicatePopup(false);
                setError('');
              }}
            >
              Choose another date
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* =========================================================
   MOUNT
========================================================= */

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element #root was not found in index.html'
  );
}

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);