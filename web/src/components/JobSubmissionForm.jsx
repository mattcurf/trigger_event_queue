import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export function JobSubmissionForm({ onJobSubmitted }) {
  const [jobName, setJobName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: rpcError } = await supabase.rpc('submit_job', {
        task_name: jobName
      })

      if (rpcError) {
        throw rpcError
      }

      setJobName('')
      if (onJobSubmitted) {
        onJobSubmitted(data)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error submitting job:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="job-form">
      <div className="form-group">
        <label htmlFor="jobName">Job Name:</label>
        <input
          id="jobName"
          type="text"
          value={jobName}
          onChange={(e) => setJobName(e.target.value)}
          placeholder="Enter job name"
          required
          disabled={loading}
        />
      </div>
      <button type="submit" disabled={loading || !jobName.trim()}>
        {loading ? 'Submitting...' : 'Submit Job'}
      </button>
      {error && <div className="error-message">{error}</div>}
    </form>
  )
}
