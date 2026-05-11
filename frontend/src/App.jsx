import './App.css'

function App() {
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
  )
}

export default App