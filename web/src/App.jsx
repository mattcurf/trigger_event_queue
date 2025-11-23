import { useState } from 'react'
import './App.css'
import { JobSubmissionForm } from './components/JobSubmissionForm'
import { JobList } from './components/JobList'

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleJobSubmitted = () => {
    // Trigger a re-mount of JobList to refresh
    setRefreshTrigger((prev) => prev + 1)
  }

  return (
    <div className="container">
      <header className="header">
        <h1>Job Queue</h1>
        <p className="subtitle">Submit jobs and track their progress in real-time</p>
      </header>

      <main className="main-content">
        <section className="submission-section">
          <h2>Submit a New Job</h2>
          <JobSubmissionForm onJobSubmitted={handleJobSubmitted} />
        </section>

        <section className="list-section">
          <JobList key={refreshTrigger} />
        </section>
      </main>

      <footer className="footer">
        <p>&copy; 2025 Job Queue. All rights reserved.</p>
      </footer>
    </div>
  )
}

export default App
