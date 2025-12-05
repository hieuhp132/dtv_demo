// src/components/AdminDashboard.js
import React, { useEffect, useState } from "react";
import "./Dashboard.css";
import { fetchJobs, listSubmissions, listArchivedSubmissions, updateSubmissionStatus, getBalances, finalizeSubmission, createJob, updateJob, deleteJob, API_BASE, saveJob, unsaveJob, fetchSavedJobs } from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { NavLink } from "react-router-dom";


const STATUS_OPTIONS = ["Submitted", "Interviewing", "Offer", "Hired", "Rejected", "Onboard"];

export default function AdminDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [archived, setArchived] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const { user } = useAuth();
  const [balances, setBalancesState] = useState({ adminCredit: 5000, ctvBonusById: {} });
  const [editedRows, setEditedRows] = useState({}); // { [id]: { status, bonus } }
  const navigate = useNavigate();

  // job form modal state
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: "",
    company: "",
    location: "",
    bonus: "",
    rewardCandidateUSD: 500,
    rewardInterviewUSD: 2,
    vacancies: 1,
    applicants: 0,
    deadline: "",
    status: "Active",
    description: "",
    keywords: "", // ✅ Add this
    requirements: "",
    benefits: "",
    other: "",
  });

  const openAddJob = () => {
    setEditingJob(null);
    setJobForm({ title: "", company: "", location: "", salary: "", bonus: "", rewardCandidateUSD: 500, rewardInterviewUSD: 2, vacancies: 1, applicants: 0, deadline: "", status: "Active", description: "", requirements: "", benefits: "", other:"" });
    setShowJobModal(true);
  };
  const openEditJob = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || "",
      company: job.company || "",
      location: job.location || "",
      salary: job.salary || "",
      bonus: job.bonus || "",
      rewardCandidateUSD: job.rewardCandidateUSD || 0,
      rewardInterviewUSD: job.rewardInterviewUSD || 0,
      vacancies: job.vacancies || 0,
      applicants: job.applicants || 0,
      deadline: job.deadline || "",
      status: job.status || "Active",
      description: job.description || "",
      requirements: job.requirements || "",
      benefits: job.benefits || "",
      other: job.other || "",
      keywords: Array.isArray(job.keywords) ? job.keywords.join(", ") : "",
    });
    setShowJobModal(true);
  };
  const closeJobModal = () => setShowJobModal(false);

  const onChangeJobField = (e) => {
    const { name, value } = e.target;
    console.log(`Field changed: ${name}, Value: ${value}`); // Debugging log for field changes
    setJobForm((prev) => ({
      ...prev,
      [name]: name.includes("reward") || name === "vacancies" || name === "applicants" ? Number(value) : value,
    }));
  };

  const submitJobForm = async (e) => {
    e.preventDefault();
    console.log('Submitting job form:', jobForm); // Debugging log for job form submission
    const formattedJobForm = {
      ...jobForm,
      salary: jobForm.salary.trim() || "N/A", // Ensure salary is properly formatted,
      keywords: typeof jobForm.keywords === "string"
        ? jobForm.keywords.split(",").map(k => k.trim()).filter(Boolean)
        : [],
      };
    console.log('Formatted job data to submit:', formattedJobForm); // Debugging log for formatted job data
    console.log('Editing job:', editingJob); // Debugging log for editing job
    if (editingJob) {
      await updateJob({ ...editingJob, ...formattedJobForm });
    } else {
      await createJob(formattedJobForm);
    }
    closeJobModal();
    await refresh();
  };

  const refresh = async () => {
    const [subs, arch, js, bal] = await Promise.all([listSubmissions(), listArchivedSubmissions(), fetchJobs(), getBalances()]);
    console.log('Jobs fetched from server:', js); // Debugging log for server response
    setSubmissions(subs);
    setArchived(arch);
    setJobs(js);
    setBalancesState(bal);
    if (user?.id || user?.email) {
      setSavedJobs(js.filter(j => Array.isArray(j.savedBy) && j.savedBy.includes(user.id || user.email)));
    }
  };

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const jobsData = await fetchJobs();
        console.log("Jobs fetched from server:", jobsData); // Debugging log for jobs
        setJobs(jobsData);

        const userId = user?.id || user?.email;
        if (userId) {
          const response = await fetchSavedJobs(userId);
          if (response?.items && Array.isArray(response.items)) {
            const backendSavedJobs = response.items.map((item) => {
              console.log("Debugging saved job item:", item); // Log the item for debugging
              return {
                id: item.jobId || item.id || item._id || item.jobLink || "undefined-id", // Use alternative fields for ID
                title: item.title,
                company: item.company,
                location: item.location,
                salary: item.salary,
                deadline: item.deadline,
                bonus: item.bonus,
              };
            });
            setSavedJobs(backendSavedJobs);
            localStorage.setItem('savedJobs', JSON.stringify(backendSavedJobs));
            console.log("Saved jobs loaded from backend:", backendSavedJobs);
          } else {
            console.error("Unexpected response structure for saved jobs:", response);
          }
        }
      } catch (error) {
        console.error("Error loading jobs or saved jobs:", error);
      }
    };

    loadJobs();
  }, [user]);

  const handleStatusChange = (id, newStatus) => {
    setEditedRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], status: newStatus }
    }));
  };

  const handleBonusChange = (id, newBonus) => {
    setEditedRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], bonus: newBonus }
    }));
  };

  const handleSave = async (sub) => {
    const pending = editedRows[sub.id] || {};
    const nextStatus = pending.status ?? sub.status;
    const nextBonus = pending.bonus ?? sub.bonus;

    if (nextStatus === "Onboard") {
      const amount = Number(String(nextBonus).toString().replace(/[^0-9.-]/g, ""));
      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please set a valid bonus amount before hiring this candidate.");
        return;
      }
      if (amount > Number(balances.adminCredit || 0)) {
        alert(`Insufficient admin balance. Current balance: ${balances.adminCredit}. Bonus required: ${amount}.`);
        return;
      }
      const ok = window.confirm(`Confirm hiring ${sub.candidate} with bonus ${amount}? This action will complete the profile.`);
      if (!ok) return;
      // persist latest status/bonus first
      await updateSubmissionStatus({ id: sub.id, status: nextStatus, bonus: amount });
      await finalizeSubmission({ id: sub.id });
      await refresh();
      alert(`Saved and completed profile for ${sub.candidate}`);
      setEditedRows((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
      return;
    }
    if (nextStatus === "Rejected") {
      const ok = window.confirm(`Confirm rejecting ${sub.candidate}?`);
      if (!ok) return;
      await updateSubmissionStatus({ id: sub.id, status: nextStatus, bonus: nextBonus });
      await finalizeSubmission({ id: sub.id });
      await refresh();
      alert(`Saved and completed profile for ${sub.candidate}`);
      setEditedRows((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
      return;
    }
    // Non-final statuses: just persist edits
    await updateSubmissionStatus({ id: sub.id, status: nextStatus, bonus: nextBonus });
    await refresh();
    alert(`Saved profile update for ${sub.candidate}`);
    setEditedRows((prev) => { const n = { ...prev }; delete n[sub.id]; return n; });
  };

  const removeJob = async (job) => {
    if (!window.confirm(`Delete job ${job.title}?`)) return;
    await deleteJob(job.id);
    await refresh();
  };

  return (
    <div className="admin-dashboard">
      <div className="tasks" style={{ display: 'flex', gap: 20 }}>
        <NavLink
          to="/admin-dashboard"
          className={({ isActive }) =>
            isActive ? "nav-tab active-tab" : "nav-tab"
          }
        >
          Beta
        </NavLink>
        <NavLink
          to="/user-management"
          className={({ isActive }) =>
            isActive ? "nav-tab active-tab" : "nav-tab"
          }
        >
          Users List
        </NavLink>
      </div>

      <div className="jobs-header" style={{ marginTop: 24 }}>
        <h3>Open Job</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="jobs-count">{jobs.length} jobs</span>
          <button onClick={openAddJob}>+ Add job</button>
        </div>
      </div>
      <div className="jobs-grid">
        {jobs.map((job) => {
          let isPastDeadline = false;
          if (job.deadline) {
            const today = new Date();
            const deadlineDate = new Date(job.deadline);
            isPastDeadline = today > deadlineDate;
          }
          const effectiveStatus = isPastDeadline ? 'Inactive' : job.status;
          const isInactive = effectiveStatus !== 'Active';
          return (
            <div
              key={job.id}
              className="job-card"
              style={{
                position: 'relative',
                cursor: isInactive ? 'not-allowed' : 'pointer',
                filter: isInactive ? 'blur(2px) grayscale(0.5) opacity(0.7)' : 'none',
                pointerEvents: isInactive ? 'auto' : 'auto',
                transition: 'filter 0.2s',
              }}
              onClick={() => window.open(`${window.location.origin}/#/job/${job.id}`, "_blank")}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="job-title" style={{ fontWeight: 600, fontSize: '1.1em' }}>{job.title}</div>
                <button
                  title={savedJobs.some(j => j.id === job.id) ? "Saved" : "Save job"}
                  style={{
                    background: 'none', border: 'none', cursor: isInactive ? 'not-allowed' : 'pointer', fontSize: '1.5em', color: savedJobs.some(j => j.id === job.id) ? '#f60' : '#888', marginRight: '10px', marginLeft: '8px', verticalAlign: 'middle', width:'fit-content', pointerEvents: isInactive ? 'none' : 'auto'
                  }}
                  onClick={isInactive ? undefined : async (e) => {
                    e.stopPropagation();
                    if (!user?.id && !user?.email) return;
                    try {
                      const isSaved = savedJobs.some(j => j.id === job.id);
                      if (isSaved) {
                        await unsaveJob(job.id, user.id || user.email);
                      } else {
                        await saveJob(job.id, user.id || user.email);
                      }
                      refresh();
                    } catch (err) {
                      alert("Failed to save/unsave job");
                    }
                  }}
                  disabled={isInactive}
                >
                  {savedJobs.some(j => j.id === job.id) ? "★" : "☆"}
                </button>
              </div>
            <div style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
              <strong>Company:</strong> {job.company}
            </div>
            <div className="job-location-line" style={{ fontSize: "13px", color: "#555", marginBottom: "6px" }}>
                <strong>Location:</strong> {job.location}
            </div>
            <div className="job-meta">  
              <div style={{}}>
                <strong>Salary:</strong> {job.salary || 'N/A'}
              </div>
              {job.bonus && <span className="job-bonus">Bonus: {job.bonus}</span>}
              {job.deadline && <span className="job-deadline">Deadline: {job.deadline}</span>}
              {(() => {
                let isPastDeadline = false;
                if (job.deadline) {
                  const today = new Date();
                  const deadlineDate = new Date(job.deadline);
                  isPastDeadline = today > deadlineDate;
                }
                const effectiveStatus = isPastDeadline ? 'Inactive' : job.status;
                return (
                  <span style={{marginLeft:8, fontWeight:'bold', color: effectiveStatus === 'Active' ? 'green' : 'red'}}>
                    Status: {effectiveStatus}
                    {isPastDeadline && <span style={{marginLeft:4, color:'#b00', fontWeight:'normal', fontSize:'12px'}}>(auto-inactive: deadline passed)</span>}
                  </span>
                );
              })()}
            </div>
            <div style={{ fontSize: "12px", color: "#666", marginBottom: "6px" }}>
              <span>Vacancies: {job.vacancies}</span>
              <span style={{ marginLeft: 8 }}>Applicants: {job.applicants}</span>
              <span style={{ marginLeft: 8 }}>Online {job.onlineDaysAgo} days ago</span>
            </div>
            <div className="reward-line">
              <span className="reward-badge">USD {job.rewardCandidateUSD} /Candidate</span>
              <span className="reward-badge secondary">+USD {job.rewardInterviewUSD} /Interview</span>
            </div>
            <div className="job-actions">
              <button
                onClick={(e) => { e.stopPropagation(); openEditJob(job); }}
                disabled={isInactive}
                style={{ pointerEvents: isInactive ? 'none' : 'auto', opacity: isInactive ? 0.5 : 1 }}
              >Edit</button>
              <button
                className="danger"
                onClick={(e) => { e.stopPropagation(); removeJob(job); }}
                style={{ pointerEvents: 'auto', opacity: 1 }}
              >Delete</button>
              <div style={{ display: 'inline-block', pointerEvents: 'auto', opacity: 1, filter: 'none' }}>
                <button
                  style={{
                    marginLeft: 8,
                    background: job.status === 'Active' ? '#ffc107' : '#28a745',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    visibility: 'visible',
                    position: 'relative',
                    zIndex: 10,
                  }}
                  onClick={async (e) => {
                    e.stopPropagation();
                    try {
                      await updateJob({ ...job, status: job.status === 'Active' ? 'Inactive' : 'Active' });
                      await refresh();
                    } catch (err) {
                      alert('Failed to update job status');
                    }
                  }}
                >
                  {job.status === 'Active' ? 'Pause' : 'Resume'}
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {showJobModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 16, width: 600, maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginTop: 0 }}>{editingJob ? 'Edit job' : 'Add job'}</h3>
            <form onSubmit={submitJobForm} className="candidate-form">
              <div style={{ display: 'grid', gap: 8 }}>
                <input name="title" placeholder="Title" value={jobForm.title} onChange={onChangeJobField} required />
                <input name="company" placeholder="Company" value={jobForm.company} onChange={onChangeJobField} required />
                <input name="location" placeholder="Location" value={jobForm.location} onChange={onChangeJobField} required />
                <input
                  name="keywords"
                  placeholder="e.g. JavaScript, React, Remote, Full-time"
                  value={jobForm.keywords}
                  onChange={onChangeJobField}
                />

                <input
                  name="salary"
                  placeholder="Salary (e.g.: 1000 USD)"
                  value={jobForm.salary || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setJobForm((prev) => ({ ...prev, salary: value.trim() }));
                  }}
                  required
                />
                <input name="bonus" placeholder="Bonus (e.g.: 500 USD)" value={jobForm.bonus || ""} onChange={onChangeJobField} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input name="rewardCandidateUSD" type="number" placeholder="Reward/Candidate" value={jobForm.rewardCandidateUSD || ""} onChange={onChangeJobField} />
                  <input name="rewardInterviewUSD" type="number" placeholder="Reward/Interview" value={jobForm.rewardInterviewUSD || ""} onChange={onChangeJobField} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <input name="vacancies" type="number" placeholder="Vacancies" value={jobForm.vacancies || ""} onChange={onChangeJobField} />
                  <input name="applicants" type="number" placeholder="Applicants" value={jobForm.applicants || ""} onChange={onChangeJobField} />
                </div>
                <input name="deadline" placeholder="Deadline (YYYY-MM-DD)" value={jobForm.deadline} onChange={onChangeJobField} />
                
                {/* New fields for job details */}
                <div style={{ marginTop: '12px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>Job Details</h4>
                  <textarea 
                    name="description" 
                    placeholder="Job Description" 
                    value={jobForm.description} 
                    onChange={onChangeJobField}
                    rows="4"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                  />
                  <textarea 
                    name="requirements" 
                    placeholder="Job Requirements" 
                    value={jobForm.requirements} 
                    onChange={onChangeJobField}
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
                  />
                  <textarea 
                    name="benefits" 
                    placeholder="Benefits & Perks" 
                    value={jobForm.benefits} 
                    onChange={onChangeJobField}
                    rows="3"
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
                  />
                </div>
                
                {/*Other */}
                <div>
                  <textarea 
                      name="other" 
                      placeholder="Other" 
                      value={jobForm.other} 
                      onChange={onChangeJobField}
                      rows="3"
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', marginTop: '8px' }}
                    />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                <button type="button" onClick={closeJobModal}>Cancel</button>
                <button type="submit" style={{ background: 'linear-gradient(135deg,#FFA500,#FF5E62)', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: 6 }}>
                  {editingJob ? 'Save' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
