// src/components/Dashboard.js
import React, { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import {
  fetchJobs,
  createSubmission,
  listSubmissions,
  listArchivedSubmissions,
  getBalances,
  deleteJob,
  pushNotification,
  saveJob,
  unsaveJob,
  fetchSavedJobs,
} from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Icons from "./Icons";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const ctvId = useMemo(() => (user?.email || user?.id || "CTV"), [user]);

  const [jobs, setJobs] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [archived, setArchived] = useState([]);
  const [balances, setBalances] = useState({ adminCredit: 5000, ctvBonusById: {} });

  const refresh = async () => {
    const [js, subs, arch, bal] = await Promise.all([
      fetchJobs(),
      listSubmissions(),
      listArchivedSubmissions(),
      getBalances(),
    ]);

    setJobs(js);
    setCandidates(subs);
    setArchived(arch);
    setBalances(bal);

    if (user?.id || user?.email) {
      const savedJobsFiltered = js.filter((j) => {
        return Array.isArray(j.savedBy) && j.savedBy.includes(user.id || user.email);
      });
      setSavedJobs(savedJobsFiltered);
    }
  };

  useEffect(() => {
    const loadSavedJobs = async () => {
      try {
        const userId = user?.id || user?.email;
        if (userId) {
          const response = await fetchSavedJobs(userId);
          if (response?.items && Array.isArray(response.items)) {
            const backendSavedJobs = response.items.map((item) => {
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
            return backendSavedJobs; // Return saved jobs for chaining
          } else {
            return [];
          }
        } else {
          const localSavedJobs = JSON.parse(localStorage.getItem('savedJobs')) || [];
          setSavedJobs(localSavedJobs);
          return localSavedJobs; // Return saved jobs for chaining
        }
      } catch (error) {
        return [];
      }
    };

    const updateJobListWithSavedStatus = (savedJobsList) => {
      setJobs((prevJobs) => {
        const savedJobsIds = savedJobsList.map((job) => job.id);
        return prevJobs.map((job) => ({
          ...job,
          isSaved: savedJobsIds.includes(job.id),
        }));
      });
    };

    const loadJobs = async () => {
      try {
        const jobsData = await fetchJobs();
        setJobs(jobsData);
      } catch (error) {
      }
    };

    loadSavedJobs().then((savedJobsList) => {
      loadJobs().then(() => {
        updateJobListWithSavedStatus(savedJobsList);
      });
    });
  }, [user]);

  const closeModal = () => setSelectedJob(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form[0].value;
    const email = form[1].value;
    const phone = form[2].value;
    const cvFile = form[3].files?.[0] || null;
    const linkedin = form[4].value;
    const portfolio = form[5].value;
    const suitability = form[6].value;


    await createSubmission({
      candidateName: name,
      jobId: selectedJob.id,
      jobTitle: selectedJob.title,
      ctvId,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      cvFile,
      bonus: selectedJob.bonus,
    });

    await refresh();
    form.reset();
    closeModal();
    alert("Profile submitted successfully!");
  };

  const ctvBonus = useMemo(() => balances.ctvBonusById?.[ctvId] || 0, [balances, ctvId]);

  const handleDeleteJob = async (job) => {
    if (!window.confirm(`Are you sure you want to delete job "${job.title}"?`)) return;
    try {
      await deleteJob(job.id);
      await refresh();
      alert(`Job "${job.title}" deleted successfully!`);
      await pushNotification({
        role: "admin",
        message: `CTV ${ctvId} deleted job: ${job.title}`,
      });
    } catch (error) {
      alert("Failed to delete job. Please try again.");
    }
  };

  const handleSaveUnsaveJob = async (job, isSaved) => {
    try {
      const userId = user?.id || user?.email;
      if (!userId) return;

      if (isSaved) {
        const response = await unsaveJob(job.id, userId);
        if (response?.success) {
          setSavedJobs((prev) => {
            const updatedJobs = prev.filter((savedJob) => savedJob.id !== job.id);
            localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
            return updatedJobs;
          });
        } else {
        }
      } else {
        const response = await saveJob(job.id, userId);
        if (response?.success) {
          setSavedJobs((prev) => {
            const updatedJobs = prev.some((savedJob) => savedJob.id === job.id) ? prev : [...prev, job];
            localStorage.setItem('savedJobs', JSON.stringify(updatedJobs));
            return updatedJobs;
          });
        } else {
        }
      }
    } catch (err) {
      alert("Failed to save/unsave job");
    }
  };

  return (
    <div className="dashboard-container">
      
      <div className="dashboard-grid">
          <h2>Job List</h2>
          <div className="job-list">
            {jobs.map((job) => {
              const isSaved = savedJobs.some((savedJob) => savedJob.id === job.id);
              return (
                <div key={job.id} className="job-card" style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div
                      onClick={() => window.open(`${window.location.origin}/#/job/${job.id}`, "_blank")}
                      style={{ cursor: "pointer", flex: 1 }}
                    >
                      <h3 style={{ display: "inline-block", margin: 0 }}>{job.title}</h3>
                    </div>
                    <button
                      title={isSaved ? "Saved" : "Save job"}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.7em",
                        color: isSaved ? "#f60" : "#888",
                        marginRight: "10px",
                        marginLeft: "8px",
                        verticalAlign: "middle",
                        width: "fit-content",
                      }}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user?.id && !user?.email) return;

                        handleSaveUnsaveJob(job, isSaved);
                      }}
                    >
                      {isSaved ? "★" : "☆"}
                    </button>
                  </div>

                  <div onClick={() => window.open(`${window.location.origin}/#/job/${job.id}`, "_blank")} style={{ cursor: "pointer" }}>
                    <p>
                      <strong>Company:</strong> {job.company}
                    </p>
                    <p>
                      <strong>Location:</strong> {job.location}
                    </p>
                    <p>
                      <strong>Salary:</strong> {job.salary || "N/A"}
                    </p>
                    {job.deadline && (
                      <p>
                        <strong>Deadline:</strong> {job.deadline}
                      </p>
                    )}
                    <p style={{ fontSize: "12px", color: "#666", margin: 0 }}>
                      Vacancies: {job.vacancies} · Applicants: {job.applicants} · Online{" "}
                      {job.onlineDaysAgo} days ago
                    </p>

                    {Array.isArray(job.keywords) && job.keywords.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0 8px" }}>
                        {job.keywords.map((kw) => (
                          <span
                            key={kw}
                            style={{
                              background: "#eef2ff",
                              color: "#3730a3",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontSize: "12px",
                            }}
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="bonus">💰 Bonus: {job.bonus}</p>

                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    <button
                      disabled={job.status === "Inactive"}
                      title={
                        job.status === "Inactive"
                          ? "This job is Inactive. Submissions are closed."
                          : "Submit a candidate for this job"
                      }
                      onClick={(e) => {
                        e.stopPropagation();
                        if (job.status === "Inactive") return; // safeguard
                        setSelectedJob(job);
                      }}
                      style={{
                        padding: "8px",
                        background:
                          job.status === "Inactive"
                            ? "#ccc"
                            : "linear-gradient(135deg, #FFA500, #FF5E62)",
                        color: job.status === "Inactive" ? "#666" : "white",
                        border: "none",
                        borderRadius: "6px",
                        cursor: job.status === "Inactive" ? "not-allowed" : "pointer",
                      }}
                    >
                      {job.status === "Inactive" ? "Inactive Job" : "Submit candidate"}
                    </button>
                  </div>

                  </div>
                </div>
              );
            })}
          </div>
        
      </div>
      <Icons />
      {/* Modal for submitting candidate */}
      {selectedJob && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Submit candidate for {selectedJob.title}</h3>
            <form onSubmit={handleSubmit} className="candidate-form">
              <input type="text" placeholder="Candidate name" required />
              <input type="email" placeholder="Email" required />
              <input type="tel" placeholder="Phone number" required />
              <input type="file" name="cv" accept=".pdf" placeholder="Upload CV" required />
              <input type="url" placeholder="LinkedIn profile" />
              <input type="url" placeholder="Portfolio/Website link" />
              <textarea
                placeholder="Why is the candidate suitable for this position?"
                rows="3"
                style={{
                  width: "100%",
                  padding: "8px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  resize: "vertical",
                }}
              />
              <div className="modal-actions">
                <button type="button" onClick={closeModal} className="cancel">
                  Cancel
                </button>
                <button type="submit" className="submit">
                  Submit Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
