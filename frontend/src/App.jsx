import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setError("");
    setLoginLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setEmail("");
      setPassword("");
    } catch (err) {
      setError("Login failed. Please check your email and password.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogout() {
    await signOut(auth);
  }

  if (authLoading) {
    return (
      <div className="loading-page">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="login-page">
        <div className="login-card">
          <p className="eyebrow">Siva Job Dashboard</p>
          <h1>Welcome back</h1>
          <p className="login-subtitle">
            Sign in to access your private job search dashboard.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <label>
              Email
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>

            {error && <p className="error-message">{error}</p>}

            <button type="submit" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">Siva Job Dashboard</p>
          <h1>Track, score, and manage your job applications</h1>
          <p className="subtitle">
            A personal dashboard for organizing job leads, application status,
            resume matching, and interview progress.
          </p>
        </div>

        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </header>

      <main className="dashboard">
        <section className="stats-grid">
          <div className="card">
            <p>Total Jobs</p>
            <h2>0</h2>
          </div>

          <div className="card">
            <p>Applied</p>
            <h2>0</h2>
          </div>

          <div className="card">
            <p>Interviews</p>
            <h2>0</h2>
          </div>

          <div className="card">
            <p>Offers</p>
            <h2>0</h2>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Job Applications</h2>
              <p>Your tracked jobs will appear here.</p>
            </div>
            <button>Add Job</button>
          </div>

          <div className="empty-state">
            <h3>No jobs added yet</h3>
            <p>
              In the next phase, we will connect this page to Firebase Firestore
              and start saving real job application data.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;