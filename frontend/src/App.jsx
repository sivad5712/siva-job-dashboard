import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [editForm, setEditForm] = useState({
  company: "",
  title: "",
  link: "",
  status: "Saved",
  notes: "",
});
  const [jobForm, setJobForm] = useState({
    company: "",
    title: "",
    link: "",
    status: "Saved",
    notes: "",
  });
  const [savingJob, setSavingJob] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setJobs([]);
      return;
    }

    const jobsQuery = query(
  collection(db, "jobs"),
  where("userId", "==", user.uid),
  orderBy("createdAt", "desc")
     );

    const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setJobs(jobsData);
    });

    return () => unsubscribe();
  }, [user]);

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

  function handleJobInputChange(event) {
    const { name, value } = event.target;

    setJobForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleAddJob(event) {
    event.preventDefault();

    if (!user) return;

    setSavingJob(true);

    try {
      await addDoc(collection(db, "jobs"), {
        ...jobForm,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });

      setJobForm({
        company: "",
        title: "",
        link: "",
        status: "Saved",
        notes: "",
      });

      setShowJobForm(false);
    } catch (err) {
      console.error("Error adding job:", err);
      alert("Could not save job. Please try again.");
    } finally {
      setSavingJob(false);
    }
  }

  async function handleDeleteJob(jobId) {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this job?"
    );

    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "jobs", jobId));
    } catch (err) {
      console.error("Error deleting job:", err);
      alert("Could not delete job. Please try again.");
    }
  }

  function handleStartEdit(job) {
    setEditingJobId(job.id);

    setEditForm({
      company: job.company || "",
      title: job.title || "",
      link: job.link || "",
      status: job.status || "Saved",
      notes: job.notes || "",
    });
  }

  function handleEditInputChange(event) {
    const { name, value } = event.target;

    setEditForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleUpdateJob(event) {
    event.preventDefault();

    if (!editingJobId) return;

    try {
      await updateDoc(doc(db, "jobs", editingJobId), {
        ...editForm,
      });

      setEditingJobId(null);

      setEditForm({
        company: "",
        title: "",
        link: "",
        status: "Saved",
        notes: "",
      });
    } catch (err) {
      console.error("Error updating job:", err);
      alert("Could not update job. Please try again.");
    }
  }

  function handleCancelEdit() {
    setEditingJobId(null);

    setEditForm({
      company: "",
      title: "",
      link: "",
      status: "Saved",
      notes: "",
    });
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
            <h2>{jobs.length}</h2>
          </div>

          <div className="card">
            <p>Applied</p>
            <h2>{jobs.filter((job) => job.status === "Applied").length}</h2>
          </div>

          <div className="card">
            <p>Interviews</p>
            <h2>{jobs.filter((job) => job.status === "Interview").length}</h2>
          </div>

          <div className="card">
            <p>Offers</p>
            <h2>{jobs.filter((job) => job.status === "Offer").length}</h2>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Job Applications</h2>
              <p>Your tracked jobs will appear here.</p>
            </div>

            <button
              onClick={() => {
                alert("Add Job button clicked");
                setShowJobForm(true);
              }}
            >
              Add Job
            </button>
          </div>

          {showJobForm && (
            <form className="job-form" onSubmit={handleAddJob}>
              <div className="form-grid">
                <label>
                  Company
                  <input
                    name="company"
                    value={jobForm.company}
                    onChange={handleJobInputChange}
                    placeholder="Example: Amazon"
                    required
                  />
                </label>

                <label>
                  Job Title
                  <input
                    name="title"
                    value={jobForm.title}
                    onChange={handleJobInputChange}
                    placeholder="Example: Senior Software Engineer"
                    required
                  />
                </label>

                <label>
                  Job Link
                  <input
                    name="link"
                    value={jobForm.link}
                    onChange={handleJobInputChange}
                    placeholder="https://..."
                  />
                </label>

                <label>
                  Status
                  <select
                    name="status"
                    value={jobForm.status}
                    onChange={handleJobInputChange}
                  >
                    <option>Saved</option>
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                </label>
              </div>

              <label>
                Notes
                <textarea
                  name="notes"
                  value={jobForm.notes}
                  onChange={handleJobInputChange}
                  placeholder="Add notes about recruiter, job requirements, salary, or next steps."
                />
              </label>

              <div className="form-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowJobForm(false)}
                >
                  Cancel
                </button>

                <button type="submit" disabled={savingJob}>
                  {savingJob ? "Saving..." : "Save Job"}
                </button>
              </div>
            </form>
          )}

          {jobs.length === 0 ? (
            <div className="empty-state">
              <h3>No jobs added yet</h3>
              <p>Click Add Job to save your first job application to Firestore.</p>
            </div>
          ) : (
            <div className="jobs-list">
              {jobs.map((job) => (
                <article className="job-item" key={job.id}>
                  {editingJobId === job.id ? (
                    <form className="edit-job-form" onSubmit={handleUpdateJob}>
                      <div className="form-grid">
                        <label>
                          Company
                          <input
                            name="company"
                            value={editForm.company}
                            onChange={handleEditInputChange}
                            required
                          />
                        </label>

                        <label>
                          Job Title
                          <input
                            name="title"
                            value={editForm.title}
                            onChange={handleEditInputChange}
                            required
                          />
                        </label>

                        <label>
                          Job Link
                          <input
                            name="link"
                            value={editForm.link}
                            onChange={handleEditInputChange}
                          />
                        </label>

                        <label>
                          Status
                          <select
                            name="status"
                            value={editForm.status}
                            onChange={handleEditInputChange}
                          >
                            <option>Saved</option>
                            <option>Applied</option>
                            <option>Interview</option>
                            <option>Offer</option>
                            <option>Rejected</option>
                          </select>
                        </label>
                      </div>

                      <label>
                        Notes
                        <textarea
                          name="notes"
                          value={editForm.notes}
                          onChange={handleEditInputChange}
                        />
                      </label>

                      <div className="form-actions">
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </button>

                        <button type="submit">Save Changes</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="job-main">
                        <p className="job-company">{job.company}</p>
                        <h3>{job.title}</h3>

                        {job.link && (
                          <a href={job.link} target="_blank" rel="noreferrer">
                            View job posting
                          </a>
                        )}

                        {job.notes && <p className="job-notes">{job.notes}</p>}
                      </div>

                      <div className="job-actions">
                        <select
                          className="status-select"
                          value={job.status}
                          onChange={(event) =>
                            handleStatusChange(job.id, event.target.value)
                          }
                        >
                          <option>Saved</option>
                          <option>Applied</option>
                          <option>Interview</option>
                          <option>Offer</option>
                          <option>Rejected</option>
                        </select>

                        <button
                          className="secondary-button"
                          onClick={() => handleStartEdit(job)}
                        >
                          Edit
                        </button>

                        <button
                          className="delete-button"
                          onClick={() => handleDeleteJob(job.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;