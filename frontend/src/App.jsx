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
  setDoc,
  getDoc,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import "./App.css";

function App() {

  const BACKEND_API_URL =
  "https://siva-job-dashboard-api-1015605186695.us-central1.run.app";
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [theme, setTheme] = useState("light");
 const [error, setError] = useState("");

const [appMessage, setAppMessage] = useState({
  type: "",
  text: "",
});

const [jobs, setJobs] = useState([]);
const [jobsLoading, setJobsLoading] = useState(false);
const [showResumeProfile, setShowResumeProfile] = useState(false);

const [providerQuotas, setProviderQuotas] = useState([]);
const [quotaLoading, setQuotaLoading] = useState(false);
const [importingJobs, setImportingJobs] = useState(false);
const [showProviderStatus, setShowProviderStatus] = useState(true);

const [selectedProviders, setSelectedProviders] = useState({
  Remotive: true,
  Arbeitnow: true,
  "The Muse": true,
});

const [onlyHighMatchJobs, setOnlyHighMatchJobs] = useState(true);


  const defaultResumeProfile = {
  summary:
    "Senior Software Engineer with around 8 years of experience designing, optimizing, and deploying scalable enterprise applications. Strong expertise in Java, Spring Boot, microservices, REST and GraphQL APIs, React, Angular, cloud-native architectures, event-driven systems, CI/CD, and data-driven solutions across banking, healthcare, fraud detection, and cloud modernization domains.",

  coreSkills:
    "Java, Java 11, Spring Boot, Spring MVC, Spring Security, Hibernate, Microservices, REST APIs, GraphQL, JAX-RS, Node.js, Express.js, Scala, Data Structures, Algorithms, Performance Optimization, Distributed Systems",

  frontendSkills:
    "React, React 18, Angular, Angular 17, Vue.js, JavaScript, TypeScript, HTML5, CSS3, Sass, Bootstrap, RxJS, jQuery, AJAX, WebGL, Three.js, Responsive UI, Dashboards",

  cloudSkills:
    "AWS, Azure, GCP, AWS EC2, S3, Lambda, RDS, DynamoDB, IAM, CloudWatch, API Gateway, EKS, Azure AKS, Azure Functions, API Management, Azure SQL, Blob Storage, Key Vault, GCP GKE, Google Cloud Memory Store",

  devOpsSkills:
    "Docker, Kubernetes, Helm, Terraform, CloudFormation, Jenkins, GitHub Actions, GitLab CI/CD, CI/CD Pipelines, AWS CLI, Infrastructure as Code, Zero-downtime Deployments",

  databaseSkills:
    "PostgreSQL, MySQL, Oracle, DB2, MongoDB, DynamoDB, Cassandra, SQLite, SQL, PL/SQL, Redis, Query Tuning, Indexing, Stored Procedures, Database Optimization",

  apiSecuritySkills:
    "RESTful APIs, GraphQL, SOAP, FHIR R4, FHIR R5, HL7, OAuth 2.0, JWT, OpenID Connect, Okta, API Gateway, Multi-Factor Authentication, RBAC, ABAC, OWASP, SonarQube, HIPAA, SOC 2, PCI DSS",

  messagingSkills:
    "Apache Kafka, Kafka Streams, RabbitMQ, ActiveMQ, Event-driven Architecture, Asynchronous Messaging, Real-time Streaming, WebSockets, Server-Sent Events",

  testingMonitoringSkills:
    "JUnit, Mockito, Jest, Cypress, Postman, Cucumber, TDD, BDD, Prometheus, Grafana, ELK Stack, Splunk, CloudWatch, Application Monitoring, Observability",

  domainSkills:
    "Banking, Financial Services, Credit Union Core Transformation, Fraud Detection, Real-time Transaction Monitoring, Healthcare, FHIR, HL7, EHR Integration, Claims Data, Care Coordination, IoT, Fleet Telematics, CAD Visualization",

  toolsSkills:
    "Git, Bitbucket, GitLab, Jira, Confluence, Maven, Swagger, Agile, Scrum, Kanban, SAFe, Sprint Planning, Technical Documentation, Mentoring, Leadership",

  certifications:
    "Oracle Java SE 11 Developer, Oracle Java SE 8 Programmer, AWS Certified Developer, Microsoft Certified Azure Fundamentals, JP Morgan Chase Software Engineering Job Simulation",

  yearsOfExperience: "8",

  targetTitles:
    "Senior Software Engineer, Sr Software Engineer, Java Developer, Java Backend Developer, Full Stack Developer, Backend Engineer, Spring Boot Developer, Microservices Developer, Cloud Engineer, AWS Developer, Azure Developer, React Developer, Angular Developer, Software Engineer III, Lead Software Engineer, Platform Engineer",

  searchKeywords:
    "Java Spring Boot, Microservices, React, Angular, AWS, Azure, Kubernetes, Docker, Kafka, REST API, GraphQL, Healthcare FHIR HL7, Banking, Fraud Detection, Cloud Modernization, Full Stack Java Developer",
};

const [resumeProfile, setResumeProfile] = useState(defaultResumeProfile);

  const [savingResumeProfile, setSavingResumeProfile] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [matchFilter, setMatchFilter] = useState("all");

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

  const matchesSource =
    sourceFilter === "All" || job.source === sourceFilter;

  const matchesScore =
    matchFilter === "all" || Number(job.matchScore || 0) >= 70;

  return matchesSearch && matchesStatus && matchesSource && matchesScore;
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
  jobDescription: "",
  requiredSkills: "",
  matchedSkills: "",
  missingSkills: "",
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
   jobDescription: "",
   requiredSkills: "",
   matchedSkills: "",
   missingSkills: "",
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
  loadProviderQuotas();
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

async function loadProviderQuotas() {
  setQuotaLoading(true);

  try {
    const response = await fetch(`${BACKEND_API_URL}/provider-quotas`);
    const data = await response.json();

    setProviderQuotas(data.providers || []);
  } catch (err) {
    console.error("Error loading provider quotas:", err);
  } finally {
    setQuotaLoading(false);
  }
}

function handleProviderToggle(providerName) {
  setSelectedProviders((currentProviders) => ({
    ...currentProviders,
    [providerName]: !currentProviders[providerName],
  }));
}

async function handleFetchNewJobs() {
  setImportingJobs(true);

  try {
    const activeProviders = Object.entries(selectedProviders)
  .filter(([, isSelected]) => isSelected)
  .map(([providerName]) => providerName)
  .join(",");

if (!activeProviders) {
  showAppMessage("error", "Select at least one job provider.");
  setImportingJobs(false);
  return;
}

const minimumScore = onlyHighMatchJobs ? 70 : 0;

const response = await fetch(
  `${BACKEND_API_URL}/fetch-all-jobs?providers=${encodeURIComponent(
    activeProviders
  )}&min_score=${minimumScore}`
);

if (!response.ok) {
  throw new Error(`Backend error ${response.status}`);
}

    const data = await response.json();

    await loadProviderQuotas();

showAppMessage(
  "success",
  `Job import complete: fetched ${data.totalFetched || 0}, saved ${
    data.totalSaved || 0
  }, updated ${data.totalUpdated || 0}, skipped low score ${
    data.totalSkippedLowScore || 0
  }.`
);

window.scrollTo({
  top: 0,
  behavior: "smooth",
});

  } catch (err) {
    console.error("Error fetching new jobs:", err);
    showAppMessage("error", `Could not fetch new jobs: ${err.message}`);
  } finally {
    setImportingJobs(false);
  }
}

function toggleTheme() {
  setTheme((currentTheme) =>
    currentTheme === "light" ? "dark" : "light"
  );
}

async function handleSaveResumeProfile(event) {
  event.preventDefault();

  if (!user) return;

  setSavingResumeProfile(true);

  try {
    await setDoc(
      doc(db, "users", user.uid),
      {
        ...resumeProfile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setShowResumeProfile(false);
    showAppMessage("success", "Resume profile saved successfully.");
  } catch (err) {
    console.error("Error saving resume profile:", err);
    showAppMessage("error", "Could not save resume profile. Please try again.");
  } finally {
    setSavingResumeProfile(false);
  }
}

async function handleLoadResumeProfile() {
  if (!user) return;

  try {
    const profileRef = doc(db, "users", user.uid);
    const profileSnapshot = await getDoc(profileRef);

    if (profileSnapshot.exists()) {
      const data = profileSnapshot.data();

     setResumeProfile({
  ...defaultResumeProfile,
  ...data,
});

      showAppMessage("success", "Resume profile loaded.");
    } else {
      showAppMessage("success", "Default resume profile loaded.");
    }

    setShowResumeProfile(true);
  } catch (err) {
    console.error("Error loading resume profile:", err);
    showAppMessage("error", "Could not load resume profile.");
  }
}

  function calculateMatchScore(requiredSkills, matchedSkills) {
  const requiredList = requiredSkills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  const matchedList = matchedSkills
    .split(",")
    .map((skill) => skill.trim())
    .filter(Boolean);

  if (requiredList.length === 0) return "";

  return Math.round((matchedList.length / requiredList.length) * 100);
}

function splitCommaList(text) {
  return text
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function calculateSkillCategoryScore(jobText, skillsText, maxPoints) {
  const skills = splitCommaList(skillsText);

  if (skills.length === 0) return 0;

  const matchedSkills = skills.filter((skill) => {
    const normalizedSkill = skill.toLowerCase();

    return (
      jobText.includes(normalizedSkill) ||
      normalizedSkill
        .split(" ")
        .some((word) => word.length > 2 && jobText.includes(word))
    );
  });

  return Math.round((matchedSkills.length / skills.length) * maxPoints);
}

function calculateTitleScore(title, targetTitlesText) {
  const targetTitles = splitCommaList(targetTitlesText);
  const lowerTitle = title.toLowerCase();

  if (targetTitles.length === 0) return 5;

  const matched = targetTitles.some((targetTitle) => {
    const titleWords = targetTitle
      .split(" ")
      .filter((word) => word.length > 2);

    return (
      lowerTitle.includes(targetTitle) ||
      titleWords.some((word) => lowerTitle.includes(word))
    );
  });

  return matched ? 20 : 5;
}

function calculateExperienceScore(jobText, yearsOfExperience) {
  const years = Number(yearsOfExperience);

  if (!years) return 5;

  if (
    jobText.includes(`${years}+ years`) ||
    jobText.includes(`${years} years`) ||
    jobText.includes("senior") ||
    jobText.includes("lead")
  ) {
    return 15;
  }

  if (
    jobText.includes("5+ years") ||
    jobText.includes("6+ years") ||
    jobText.includes("7+ years") ||
    jobText.includes("8+ years")
  ) {
    return years >= 5 ? 15 : 8;
  }

  if (
    jobText.includes("3+ years") ||
    jobText.includes("4+ years")
  ) {
    return 10;
  }

  if (
    jobText.includes("10+ years") ||
    jobText.includes("12+ years") ||
    jobText.includes("15+ years")
  ) {
    return years >= 10 ? 15 : 8;
  }

  return 5;
}

function calculateATSScore(job, profile) {
  const jobText = `
    ${job.title || ""}
    ${job.company || ""}
    ${job.location || ""}
    ${job.jobDescription || ""}
    ${job.requiredSkills || ""}
    ${job.description || ""}
  `.toLowerCase();

  const technicalScore = calculateSkillCategoryScore(
    jobText,
    `${profile.coreSkills || ""}, ${profile.frontendSkills || ""}, ${profile.databaseSkills || ""}`,
    35
  );

  const titleScore = calculateTitleScore(
    job.title || "",
    profile.targetTitles || ""
  );

  const experienceScore = calculateExperienceScore(
    jobText,
    profile.yearsOfExperience || ""
  );

  const cloudScore = calculateSkillCategoryScore(
    jobText,
    `${profile.cloudSkills || ""}, ${profile.devOpsSkills || ""}`,
    20
  );

  const domainScore = calculateSkillCategoryScore(
    jobText,
    profile.domainSkills || "",
    15
  );

  const securityApiScore = calculateSkillCategoryScore(
    jobText,
    profile.apiSecuritySkills || "",
    10
  );

  const messagingScore = calculateSkillCategoryScore(
    jobText,
    profile.messagingSkills || "",
    10
  );

  const totalScore =
    technicalScore +
    titleScore +
    experienceScore +
    cloudScore +
    domainScore +
    securityApiScore +
    messagingScore;

  return Math.min(Math.round(totalScore), 100);
}

function handleJobInputChange(event) {
  const { name, value } = event.target;

  setJobForm((currentForm) => {
    const updatedForm = {
      ...currentForm,
      [name]: value,
    };

    if (name === "requiredSkills" || name === "matchedSkills") {
      updatedForm.matchScore = calculateMatchScore(
        updatedForm.requiredSkills,
        updatedForm.matchedSkills
      );
    }

    return updatedForm;
  });
}

  async function handleAddJob(event) {
    event.preventDefault();

    if (!user) return;

    setSavingJob(true);

    try {
      const atsScore = calculateATSScore(jobForm, resumeProfile);

await addDoc(collection(db, "jobs"), {
  ...jobForm,
  matchScore: atsScore,
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
  jobDescription: "",
  requiredSkills: "",
  matchedSkills: "",
  missingSkills: "",
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
  jobDescription: job.jobDescription || "",
  requiredSkills: job.requiredSkills || "",
  matchedSkills: job.matchedSkills || "",
  missingSkills: job.missingSkills || "",
  notes: job.notes || "",
});
  }

  function handleEditInputChange(event) {
  const { name, value } = event.target;

  setEditForm((currentForm) => {
    const updatedForm = {
      ...currentForm,
      [name]: value,
    };

    if (name === "requiredSkills" || name === "matchedSkills") {
      updatedForm.matchScore = calculateMatchScore(
        updatedForm.requiredSkills,
        updatedForm.matchedSkills
      );
    }

    return updatedForm;
  });
}

async function handleUpdateJob(event) {
  event.preventDefault();

  if (!editingJobId) return;

  const atsScore = calculateATSScore(editForm, resumeProfile);

  try {
    await updateDoc(doc(db, "jobs", editingJobId), {
      ...editForm,
      matchScore: atsScore,
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
      jobDescription: "",
      requiredSkills: "",
      matchedSkills: "",
      missingSkills: "",
      notes: "",
    });

    showAppMessage("success", `Job updated. ATS score: ${atsScore}%`);
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
  jobDescription: "",
  requiredSkills: "",
  matchedSkills: "",
  missingSkills: "",
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
    <div className={`app ${theme === "dark" ? "dark-mode" : "light-mode"}`}>
      <header className="hero">
        <div>
          <p className="eyebrow">Siva Job Dashboard</p>
          <h1>Track, score, and manage your job applications</h1>
          <p className="subtitle">
            A personal dashboard for organizing job leads, application status,
            resume matching, and interview progress.
          </p>
        </div>

     <div className="header-actions">
  <div className="header-button-row">
    <button
      className="logout-button"
      onClick={() => setShowResumeProfile(true)}
    >
      Resume Profile
    </button>

    <button className="logout-button" onClick={handleLogout}>
      Logout
    </button>
  </div>

  <button
    type="button"
    className="theme-switch"
    onClick={toggleTheme}
    aria-label="Toggle dark mode"
  >
    <span className="theme-switch-track">
      <span className="theme-switch-icon theme-switch-sun" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      </span>

      <span className="theme-switch-icon theme-switch-moon" aria-hidden="true">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>

      <span className="theme-switch-thumb"></span>
    </span>
  </button>
</div>


      </header>

      <main className="dashboard">
        {appMessage.text && (
  <div className={`app-message ${appMessage.type}`}>
    {appMessage.text}
  </div>
)}

{showResumeProfile && (
  <section className="panel resume-profile-panel">
    <div className="panel-header">
      <div>
        <h2>Resume Profile</h2>
        <p>
          Store your skills and target roles here. The ATS scoring system will
          use this profile to rank jobs.
        </p>
      </div>

      <button
        type="button"
        className="secondary-button"
        onClick={() => setShowResumeProfile(false)}
      >
        Close
      </button>
    </div>

    <form className="job-form" onSubmit={handleSaveResumeProfile}>
      <label>
        Resume Summary
        <textarea
          name="summary"
          value={resumeProfile.summary}
          onChange={(event) =>
            setResumeProfile({
              ...resumeProfile,
              summary: event.target.value,
            })
          }
          placeholder="Example: Senior Software Engineer with 8 years of experience in Java, Spring Boot, React, AWS, microservices, and enterprise modernization."
        />
      </label>

      <div className="form-grid">
        <label>
          Core Skills
          <textarea
            name="coreSkills"
            value={resumeProfile.coreSkills}
            onChange={(event) =>
              setResumeProfile({
                ...resumeProfile,
                coreSkills: event.target.value,
              })
            }
          />
        </label>

        <label>
          Cloud Skills
          <textarea
            name="cloudSkills"
            value={resumeProfile.cloudSkills}
            onChange={(event) =>
              setResumeProfile({
                ...resumeProfile,
                cloudSkills: event.target.value,
              })
            }
          />
        </label>

        <label>
  Frontend Skills
  <textarea
    name="frontendSkills"
    value={resumeProfile.frontendSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        frontendSkills: event.target.value,
      })
    }
  />
</label>

<label>
  DevOps Skills
  <textarea
    name="devOpsSkills"
    value={resumeProfile.devOpsSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        devOpsSkills: event.target.value,
      })
    }
  />
</label>

<label>
  Database Skills
  <textarea
    name="databaseSkills"
    value={resumeProfile.databaseSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        databaseSkills: event.target.value,
      })
    }
  />
</label>

<label>
  API & Security Skills
  <textarea
    name="apiSecuritySkills"
    value={resumeProfile.apiSecuritySkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        apiSecuritySkills: event.target.value,
      })
    }
  />
</label>

<label>
  Messaging & Streaming Skills
  <textarea
    name="messagingSkills"
    value={resumeProfile.messagingSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        messagingSkills: event.target.value,
      })
    }
  />
</label>

<label>
  Testing & Monitoring Skills
  <textarea
    name="testingMonitoringSkills"
    value={resumeProfile.testingMonitoringSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        testingMonitoringSkills: event.target.value,
      })
    }
  />
</label>

<label>
  Tools & Methodologies
  <textarea
    name="toolsSkills"
    value={resumeProfile.toolsSkills}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        toolsSkills: event.target.value,
      })
    }
  />
</label>

<label>
  Certifications
  <textarea
    name="certifications"
    value={resumeProfile.certifications}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        certifications: event.target.value,
      })
    }
  />
</label>

<label>
  Search Keywords
  <textarea
    name="searchKeywords"
    value={resumeProfile.searchKeywords}
    onChange={(event) =>
      setResumeProfile({
        ...resumeProfile,
        searchKeywords: event.target.value,
      })
    }
  />
</label>

        <label>
          Domain Skills
          <textarea
            name="domainSkills"
            value={resumeProfile.domainSkills}
            onChange={(event) =>
              setResumeProfile({
                ...resumeProfile,
                domainSkills: event.target.value,
              })
            }
          />
        </label>

        <label>
          Target Job Titles
          <textarea
            name="targetTitles"
            value={resumeProfile.targetTitles}
            onChange={(event) =>
              setResumeProfile({
                ...resumeProfile,
                targetTitles: event.target.value,
              })
            }
          />
        </label>

        <label>
          Years of Experience
          <input
            name="yearsOfExperience"
            value={resumeProfile.yearsOfExperience}
            onChange={(event) =>
              setResumeProfile({
                ...resumeProfile,
                yearsOfExperience: event.target.value,
              })
            }
            placeholder="Example: 8"
          />
        </label>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowResumeProfile(false)}
        >
          Cancel
        </button>

        <button type="submit" disabled={savingResumeProfile}>
            {savingResumeProfile ? "Saving..." : "Save Resume Profile"}
       </button>

      </div>
    </form>
  </section>
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
<section className="panel provider-status-panel">
  <div className="panel-header">
    <div>
      <h2>Provider Status</h2>
      <p>Quota usage for connected job boards.</p>
    </div>

    <div className="provider-actions">
      <button
        type="button"
        className="collapse-button"
        onClick={() => setShowProviderStatus(!showProviderStatus)}
        aria-label={
          showProviderStatus
            ? "Collapse provider status"
            : "Expand provider status"
        }
      >
        {showProviderStatus ? "▲" : "▼"}
      </button>

      <button
        type="button"
        className="secondary-button"
        onClick={loadProviderQuotas}
        disabled={quotaLoading}
      >
        {quotaLoading ? "Refreshing..." : "Refresh"}
      </button>

      <button
        type="button"
        onClick={handleFetchNewJobs}
        disabled={importingJobs}
      >
        {importingJobs ? "Fetching..." : "Fetch New Jobs"}
      </button>
    </div>
  </div>

{showProviderStatus && (
  <div className="ats-import-control">
    <label>
      <input
        type="checkbox"
        checked={onlyHighMatchJobs}
        onChange={() => setOnlyHighMatchJobs(!onlyHighMatchJobs)}
      />
      Only import jobs with 70%+ ATS match
    </label>
  </div>
)}


{showProviderStatus && (
  <div className="provider-toggle-row">
    <label>
      <input
        type="checkbox"
        checked={selectedProviders.Remotive}
        onChange={() => handleProviderToggle("Remotive")}
      />
      Remotive
    </label>

    <label>
      <input
        type="checkbox"
        checked={selectedProviders.Arbeitnow}
        onChange={() => handleProviderToggle("Arbeitnow")}
      />
      Arbeitnow
    </label>

    <label>
  <input
    type="checkbox"
    checked={selectedProviders["The Muse"]}
    onChange={() => handleProviderToggle("The Muse")}
  />
  The Muse
</label>

  </div>
)}
  {showProviderStatus && (
    <div className="provider-status-list">
      {providerQuotas.length === 0 ? (
        <p className="provider-empty">No provider quota data loaded yet.</p>
      ) : (
        providerQuotas.map((provider) => {
          const used = provider.usedCalls || 0;
          const max = provider.maxCalls || 1;
          const percentage = Math.min(Math.round((used / max) * 100), 100);

          return (
            <div className="provider-status-item" key={provider.provider}>
              <div className="provider-status-top">
                <strong>{provider.provider}</strong>
                <span>
                  {used} / {max} calls used
                </span>
              </div>

              <div className="provider-progress-track">
                <div
                  className="provider-progress-fill"
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>

              <p>
                {provider.pausedUntil
                  ? "Paused until reset"
                  : "Active and available"}
              </p>
            </div>
          );
        })
      )}
    </div>
  )}
</section>

        <section className="panel jobs-panel">
          <div className="panel-header">
            <div>
              <h2>Job Applications</h2>
              <p>Your tracked jobs will appear here.</p>
            </div>

           <button
  onClick={() => setShowJobForm(true)}
>
  Add Job
</button>
          </div>
<div className="quick-filters">
  <span>Quick Filters:</span>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("Java Spring Boot Microservices");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Java Backend
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("React Angular Java Full Stack");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Full Stack
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("AWS Azure Docker Kubernetes Cloud DevOps");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Cloud / DevOps
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("Healthcare FHIR HL7");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Healthcare
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("Banking Financial Fraud");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Banking
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("Remote");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("all");
      setSortOption("newest");
    }}
  >
    Remote
  </button>

  <button
    type="button"
    className="quick-filter-button"
    onClick={() => {
      setSearchTerm("");
      setStatusFilter("All");
      setSourceFilter("All");
      setMatchFilter("70plus");
      setSortOption("newest");
    }}
  >
    High Match
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
  value={sourceFilter}
  onChange={(event) => setSourceFilter(event.target.value)}
>
  <option value="All">All Sources</option>
  <option value="Remotive">Remotive</option>
  <option value="Arbeitnow">Arbeitnow</option>
  <option value="The Muse">The Muse</option>
  <option value="LinkedIn">LinkedIn</option>
  <option value="Indeed">Indeed</option>
  <option value="Company Site">Company Site</option>
  <option value="Referral">Referral</option>
  <option value="Recruiter">Recruiter</option>
  <option value="Other">Other</option>
</select>

<select
  className="filter-select"
  value={matchFilter}
  onChange={(event) => setMatchFilter(event.target.value)}
>
  <option value="all">All Scores</option>
  <option value="70plus">70%+ Matches</option>
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
  setSourceFilter("All");
  setMatchFilter("all");
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
  Job Description
  <textarea
    name="jobDescription"
    value={jobForm.jobDescription}
    onChange={handleJobInputChange}
    placeholder="Paste the job description here..."
  />
</label>

<label>
  Required Skills
  <textarea
    name="requiredSkills"
    value={jobForm.requiredSkills}
    onChange={handleJobInputChange}
    placeholder="Example: Java, Spring Boot, React, AWS, Kubernetes"
  />
</label>

<label>
  Matched Skills
  <textarea
    name="matchedSkills"
    value={jobForm.matchedSkills}
    onChange={handleJobInputChange}
    placeholder="Example: Java, Spring Boot, React, AWS"
  />
</label>

<label>
  Missing Skills
  <textarea
    name="missingSkills"
    value={jobForm.missingSkills}
    onChange={handleJobInputChange}
    placeholder="Example: Kubernetes, GraphQL"
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
  Job Description
  <textarea
    name="jobDescription"
    value={editForm.jobDescription}
    onChange={handleEditInputChange}
    placeholder="Paste the job description here..."
  />
</label>

<label>
  Required Skills
  <textarea
    name="requiredSkills"
    value={editForm.requiredSkills}
    onChange={handleEditInputChange}
    placeholder="Example: Java, Spring Boot, React, AWS, Kubernetes"
  />
</label>

<label>
  Matched Skills
  <textarea
    name="matchedSkills"
    value={editForm.matchedSkills}
    onChange={handleEditInputChange}
    placeholder="Example: Java, Spring Boot, React, AWS"
  />
</label>

<label>
  Missing Skills
  <textarea
    name="missingSkills"
    value={editForm.missingSkills}
    onChange={handleEditInputChange}
    placeholder="Example: Kubernetes, GraphQL"
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

                       {(job.link || job.url) && (
  <a
    className="apply-button"
    href={job.link || job.url}
    target="_blank"
    rel="noreferrer"
  >
    Apply
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
                        
                        {(job.requiredSkills || job.matchedSkills || job.missingSkills) && (
  <div className="skills-section">
    {job.requiredSkills && (
      <div>
        <h4>Required Skills</h4>
        <p>{job.requiredSkills}</p>
      </div>
    )}

    {job.matchedSkills && (
      <div>
        <h4>Matched Skills</h4>
        <p>{job.matchedSkills}</p>
      </div>
    )}

    {job.missingSkills && (
      <div>
        <h4>Missing Skills</h4>
        <p>{job.missingSkills}</p>
      </div>
    )}
  </div>
)}

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
      <footer className="app-footer">
  <p>Siva Job Dashboard · Portfolio Build · v1.0</p>
</footer>
    </div>
  );
}


export default App;