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
  const [appMessage, setAppMessage] = useState({
  type: "",
  text: "",
});

  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const filteredJobs = jobs.filter((job) => {
  const searchText = searchTerm.toLowerCase();

  const matchesSearch =
  job.company?.toLowerCase().includes(searchText) ||
  job.title?.toLowerCase().includes(searchText) ||
  job.notes?.toLowerCase().includes(searchText) ||
  job.source?.toLowerCase().includes(searchText) ||
  job.location?.toLowerCase().includes(searchText) ||
  job.jobType?.toLowerCase().includes(searchText) ||
  job.salaryRange?.toLowerCase().includes(searchText) ||
  job.recruiterName?.toLowerCase().includes(searchText) ||
  job.recruiterEmail?.toLowerCase().includes(searchText) ||
  job.nextAction?.toLowerCase().includes(searchText);

  const matchesStatus =
    statusFilter === "All" || job.status === statusFilter;

  return matchesSearch && matchesStatus;
});
  const sortedJobs = [...filteredJobs].sort((a, b) => {
  if (sortOption === "company") {
    return (a.company || "").localeCompare(b.company || "");
  }

  if (sortOption === "status") {
    return (a.status || "").localeCompare(b.status || "");
  }

  if (sortOption === "dateApplied") {
    return (b.dateApplied || "").localeCompare(a.dateApplied || "");
  }

  if (sortOption === "salary") {
    return (b.salaryRange || "").localeCompare(a.salaryRange || "");
  }

  return 0;
});
  const totalJobs = jobs.length;
  const savedJobs = jobs.filter((job) => job.status === "Saved").length;
  const appliedJobs = jobs.filter((job) => job.status === "Applied").length;
  const interviewJobs = jobs.filter((job) => job.status === "Interview").length;
  const offerJobs = jobs.filter((job) => job.status === "Offer").length;
  const rejectedJobs = jobs.filter((job) => job.status === "Rejected").length;

  const responseRate =
  appliedJobs > 0 ? Math.round((interviewJobs / appliedJobs) * 100) : 0;
  const jobsWithMatchScore = jobs.filter((job) => job.matchScore);

const averageMatchScore =
  jobsWithMatchScore.length > 0
    ? Math.round(
        jobsWithMatchScore.reduce(
          (total, job) => total + Number(job.matchScore),
          0
        ) / jobsWithMatchScore.length
      )
    : 0;
const today = new Date().toISOString().split("T")[0];

const upcomingInterviews = jobs.filter(
  (job) => job.interviewDate && job.interviewDate >= today
).length;

const followUpsDue = jobs.filter(
  (job) => job.followUpDate && job.followUpDate <= today
).length;

  const [editingJobId, setEditingJobId] = useState(null);
  const [editForm, setEditForm] = useState({
  company: "",
  title: "",
  link: "",
  status: "Saved",
  source: "LinkedIn",
  location: "",
  jobType: "Full-time",
  salaryRange: "",
  dateApplied: "",
  matchScore: "",
  recruiterName: "",
  recruiterEmail: "",
  interviewDate: "",
  followUpDate: "",
  nextAction: "",
  notes: "",
});
  const [jobForm, setJobForm] = useState({
    company: "",
    title: "",
    link: "",
    status: "Saved",
    source: "LinkedIn",
    location: "",
    jobType: "Full-time",
    salaryRange: "",
    dateApplied: "",
    matchScore: "",
    recruiterName: "",
   recruiterEmail: "",
   interviewDate: "",
   followUpDate: "",
   nextAction: "",
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
    setJobsLoading(false);
    return;
  }

  setJobsLoading(true);

  const jobsQuery = query(
    collection(db, "jobs"),
    where("userId", "==", user.uid),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    jobsQuery,
    (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setJobs(jobsData);
      setJobsLoading(false);
    },
    (err) => {
      console.error("Error loading jobs:", err);
      setJobsLoading(false);
    }
  );

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

  function showAppMessage(type, text) {
  setAppMessage({ type, text });

  setTimeout(() => {
    setAppMessage({ type: "", text: "" });
  }, 3000);
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
  source: "LinkedIn",
  location: "",
  jobType: "Full-time",
  salaryRange: "",
  dateApplied: "",
  matchScore: "",
  recruiterName: "",
  recruiterEmail: "",
  interviewDate: "",
  followUpDate: "",
  nextAction: "",
  notes: "",
});

      setShowJobForm(false);
      showAppMessage("success", "Job saved successfully.");
    } catch (err) {
      console.error("Error adding job:", err);
      showAppMessage("error", "Could not save job. Please try again.");
    } finally {
      setSavingJob(false);
    }
  }
async function handleStatusChange(jobId, newStatus) {
  try {
    await updateDoc(doc(db, "jobs", jobId), {
      status: newStatus,
    });

    showAppMessage("success", "Job status updated.");
  } catch (err) {
    console.error("Error updating job status:", err);
    showAppMessage("error", "Could not update job status. Please try again.");
  }
}

async function handleDeleteJob(jobId) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this job?"
  );

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "jobs", jobId));
    showAppMessage("success", "Job deleted successfully.");
  } catch (err) {
    console.error("Error deleting job:", err);
    showAppMessage("error", "Could not delete job. Please try again.");
  }
}
  async function handleDeleteJob(jobId) {
  const confirmDelete = window.confirm(
    "Are you sure you want to delete this job?"
  );

  if (!confirmDelete) return;

  try {
    await deleteDoc(doc(db, "jobs", jobId));
    showAppMessage("success", "Job deleted successfully.");
  } catch (err) {
    console.error("Error deleting job:", err);
    showAppMessage("error", "Could not delete job. Please try again.");
  }
}

  function handleStartEdit(job) {
    setEditingJobId(job.id);

    setEditForm({
  company: job.company || "",
  title: job.title || "",
  link: job.link || "",
  status: job.status || "Saved",
  source: job.source || "LinkedIn",
  location: job.location || "",
  jobType: job.jobType || "Full-time",
  salaryRange: job.salaryRange || "",
  dateApplied: job.dateApplied || "",
  matchScore: job.matchScore || "",
  recruiterName: job.recruiterName || "",
  recruiterEmail: job.recruiterEmail || "",
  interviewDate: job.interviewDate || "",
  followUpDate: job.followUpDate || "",
  nextAction: job.nextAction || "",
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
      source: "LinkedIn",
      location: "",
      jobType: "Full-time",
      salaryRange: "",
      dateApplied: "",
      matchScore: "",
      recruiterName: "",
      recruiterEmail: "",
      interviewDate: "",
      followUpDate: "",
      nextAction: "",
      notes: "",
    });

    showAppMessage("success", "Job updated successfully.");
  } catch (err) {
    console.error("Error updating job:", err);
    showAppMessage("error", "Could not update job. Please try again.");
  }
}

  function handleCancelEdit() {
    setEditingJobId(null);

    setEditForm({
  company: "",
  title: "",
  link: "",
  status: "Saved",
  source: "LinkedIn",
  location: "",
  jobType: "Full-time",
  salaryRange: "",
  dateApplied: "",
  recruiterName: "",
  recruiterEmail: "",
  interviewDate: "",
  followUpDate: "",
  nextAction: "",
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
        {appMessage.text && (
  <div className={`app-message ${appMessage.type}`}>
    {appMessage.text}
  </div>
)}
        <section className="stats-grid metrics-grid">
  <div className="card metric-card">
    <p>Total Jobs</p>
    <h2>{totalJobs}</h2>
  </div>

  <div className="card metric-card">
    <p>Saved</p>
    <h2>{savedJobs}</h2>
  </div>

  <div className="card metric-card">
    <p>Applied</p>
    <h2>{appliedJobs}</h2>
  </div>

  <div className="card metric-card">
    <p>Interviews</p>
    <h2>{interviewJobs}</h2>
  </div>

  <div className="card metric-card">
    <p>Offers</p>
    <h2>{offerJobs}</h2>
  </div>

  <div className="card metric-card">
    <p>Rejected</p>
    <h2>{rejectedJobs}</h2>
  </div>

  <div className="card metric-card highlight-metric">
    <p>Response Rate</p>
    <h2>{responseRate}%</h2>
  </div>
  <div className="card metric-card highlight-metric">
  <p>Avg Match</p>
  <h2>{averageMatchScore}%</h2>
</div>
<div className="card metric-card">
  <p>Upcoming Interviews</p>
  <h2>{upcomingInterviews}</h2>
</div>

<div className="card metric-card">
  <p>Follow-ups Due</p>
  <h2>{followUpsDue}</h2>
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

          <div className="filters-row">
  <input
    className="search-input"
    type="text"
    placeholder="Search by company, title, notes, source, location..."
    value={searchTerm}
    onChange={(event) => setSearchTerm(event.target.value)}
  />

  <select
    className="filter-select"
    value={statusFilter}
    onChange={(event) => setStatusFilter(event.target.value)}
  >
    <option value="All">All Statuses</option>
    <option value="Saved">Saved</option>
    <option value="Applied">Applied</option>
    <option value="Interview">Interview</option>
    <option value="Offer">Offer</option>
    <option value="Rejected">Rejected</option>
  </select>

  <select
    className="filter-select"
    value={sortOption}
    onChange={(event) => setSortOption(event.target.value)}
  >
    <option value="newest">Newest First</option>
    <option value="company">Company A-Z</option>
    <option value="status">Status</option>
    <option value="dateApplied">Date Applied</option>
    <option value="salary">Salary Range</option>
  </select>

  <button
    type="button"
    className="secondary-button"
    onClick={() => {
      setSearchTerm("");
      setStatusFilter("All");
      setSortOption("newest");
    }}
  >
    Clear
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
  Source
  <select
    name="source"
    value={jobForm.source}
    onChange={handleJobInputChange}
  >
    <option>LinkedIn</option>
    <option>Indeed</option>
    <option>Company Site</option>
    <option>Referral</option>
    <option>Recruiter</option>
    <option>Other</option>
  </select>
</label>

<label>
  Location
  <input
    name="location"
    value={jobForm.location}
    onChange={handleJobInputChange}
    placeholder="Example: Dallas, TX or Remote"
  />
</label>

<label>
  Job Type
  <select
    name="jobType"
    value={jobForm.jobType}
    onChange={handleJobInputChange}
  >
    <option>Full-time</option>
    <option>Contract</option>
    <option>Part-time</option>
    <option>Internship</option>
    <option>Remote</option>
    <option>Hybrid</option>
  </select>
</label>

<label>
  Salary Range
  <input
    name="salaryRange"
    value={jobForm.salaryRange}
    onChange={handleJobInputChange}
    placeholder="Example: $120k - $150k"
  />
</label>

<label>
  Date Applied
  <input
    type="date"
    name="dateApplied"
    value={jobForm.dateApplied}
    onChange={handleJobInputChange}
  />
</label>      
<label>
  Match Score %
  <input
    type="number"
    name="matchScore"
    value={jobForm.matchScore}
    onChange={handleJobInputChange}
    placeholder="Example: 85"
    min="0"
    max="100"
  />
</label>    

<label>
  Recruiter Name
  <input
    name="recruiterName"
    value={jobForm.recruiterName}
    onChange={handleJobInputChange}
    placeholder="Example: Priya Sharma"
  />
</label>

<label>
  Recruiter Email
  <input
    type="email"
    name="recruiterEmail"
    value={jobForm.recruiterEmail}
    onChange={handleJobInputChange}
    placeholder="Example: recruiter@company.com"
  />
</label>

<label>
  Interview Date
  <input
    type="date"
    name="interviewDate"
    value={jobForm.interviewDate}
    onChange={handleJobInputChange}
  />
</label>

<label>
  Follow-up Date
  <input
    type="date"
    name="followUpDate"
    value={jobForm.followUpDate}
    onChange={handleJobInputChange}
  />
</label>

<label>
  Next Action
  <input
    name="nextAction"
    value={jobForm.nextAction}
    onChange={handleJobInputChange}
    placeholder="Example: Send follow-up email"
  />
</label>

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

          {jobsLoading ? (
  <div className="empty-state">
    <h3>Loading jobs...</h3>
    <p>Please wait while your dashboard data loads.</p>
  </div>
) : sortedJobs.length === 0 ? (
            <div className="empty-state enhanced-empty-state">
  <div className="empty-icon">
    {jobs.length === 0 ? "📋" : "🔎"}
  </div>

  <h3>{jobs.length === 0 ? "No jobs tracked yet" : "No matching jobs found"}</h3>

  <p>
    {jobs.length === 0
      ? "Start by adding your first job opportunity. Your applications, interviews, follow-ups, and match scores will appear here."
      : "Try adjusting your search keyword, status filter, or sorting option to find the jobs you are looking for."}
  </p>

  {jobs.length === 0 ? (
    <button onClick={() => setShowJobForm(true)}>Add Your First Job</button>
  ) : (
    <button
      type="button"
      className="secondary-button"
      onClick={() => {
        setSearchTerm("");
        setStatusFilter("All");
        setSortOption("newest");
      }}
    >
      Clear Filters
    </button>
  )}
</div>
          ) : (
            <div className="jobs-list">
              {sortedJobs.map((job) => (
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
  Source
  <select
    name="source"
    value={editForm.source}
    onChange={handleEditInputChange}
  >
    <option>LinkedIn</option>
    <option>Indeed</option>
    <option>Company Site</option>
    <option>Referral</option>
    <option>Recruiter</option>
    <option>Other</option>
  </select>
</label>

<label>
  Location
  <input
    name="location"
    value={editForm.location}
    onChange={handleEditInputChange}
    placeholder="Example: Dallas, TX or Remote"
  />
</label>

<label>
  Job Type
  <select
    name="jobType"
    value={editForm.jobType}
    onChange={handleEditInputChange}
  >
    <option>Full-time</option>
    <option>Contract</option>
    <option>Part-time</option>
    <option>Internship</option>
    <option>Remote</option>
    <option>Hybrid</option>
  </select>
</label>

<label>
  Salary Range
  <input
    name="salaryRange"
    value={editForm.salaryRange}
    onChange={handleEditInputChange}
    placeholder="Example: $120k - $150k"
  />
</label>

<label>
  Date Applied
  <input
    type="date"
    name="dateApplied"
    value={editForm.dateApplied}
    onChange={handleEditInputChange}
  />
</label>
<label>
  Match Score %
  <input
    type="number"
    name="matchScore"
    value={editForm.matchScore}
    onChange={handleEditInputChange}
    placeholder="Example: 85"
    min="0"
    max="100"
  />
</label>

<label>
  Recruiter Name
  <input
    name="recruiterName"
    value={editForm.recruiterName}
    onChange={handleEditInputChange}
    placeholder="Example: Priya Sharma"
  />
</label>

<label>
  Recruiter Email
  <input
    type="email"
    name="recruiterEmail"
    value={editForm.recruiterEmail}
    onChange={handleEditInputChange}
    placeholder="Example: recruiter@company.com"
  />
</label>

<label>
  Interview Date
  <input
    type="date"
    name="interviewDate"
    value={editForm.interviewDate}
    onChange={handleEditInputChange}
  />
</label>

<label>
  Follow-up Date
  <input
    type="date"
    name="followUpDate"
    value={editForm.followUpDate}
    onChange={handleEditInputChange}
  />
</label>

<label>
  Next Action
  <input
    name="nextAction"
    value={editForm.nextAction}
    onChange={handleEditInputChange}
    placeholder="Example: Send follow-up email"
  />
</label>

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
                         <div className="job-meta">
                           {job.source && <span>Source: {job.source}</span>}
                           {job.location && <span>Location: {job.location}</span>}
                           {job.jobType && <span>Type: {job.jobType}</span>}
                           {job.salaryRange && <span>Salary: {job.salaryRange}</span>}
                           {job.dateApplied && <span>Applied: {job.dateApplied}</span>}
                           {job.matchScore && <span>Match: {job.matchScore}%</span>}
                           {job.recruiterName && <span>Recruiter: {job.recruiterName}</span>}
                           {job.recruiterEmail && <span>Email: {job.recruiterEmail}</span>}
                           {job.interviewDate && <span>Interview: {job.interviewDate}</span>}
                           {job.followUpDate && <span>Follow-up: {job.followUpDate}</span>}
                           {job.nextAction && <span>Next: {job.nextAction}</span>}
                         </div>
                        {job.notes && <p className="job-notes">{job.notes}</p>}
                      </div>

                      <div className="job-actions">
                        <select
                          className={`status-select status-${job.status?.toLowerCase()}`}
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