import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function JobList() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial jobs
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        setError(null)
        const { data, error: fetchError } = await supabase
          .from('job_results')
          .select('*')
          .order('created_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        setJobs(data || [])
      } catch (err) {
        setError(err.message)
        console.error('Error fetching jobs:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchJobs()
  }, [])

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel('job_results_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_results'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs((prev) => [payload.new, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setJobs((prev) =>
              prev.map((job) => (job.id === payload.new.id ? payload.new : job))
            )
          } else if (payload.eventType === 'DELETE') {
            setJobs((prev) => prev.filter((job) => job.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  if (loading) {
    return <div className="loading">Loading jobs...</div>
  }

  if (error) {
    return <div className="error-message">Error loading jobs: {error}</div>
  }

  return (
    <div className="job-list">
      <h2>Jobs</h2>
      {jobs.length === 0 ? (
        <p className="no-jobs">No jobs yet. Submit one above!</p>
      ) : (
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Status</th>
              <th>Result</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="job-id">{job.id}</td>
                <td className={`status status-${job.status}`}>{job.status}</td>
                <td className="result">{job.result || '-'}</td>
                <td className="timestamp">
                  {new Date(job.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
