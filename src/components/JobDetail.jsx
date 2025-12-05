// src/components/JobDetail.js
import React, { useEffect, useMemo, useState } from "react";
import {
  getJobById,
  createSubmission,
  listSubmissions,
  listArchivedSubmissions,
  updateJobJD,
  getListFiles, // <-- import your API to list files with public URLs
} from "../api";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import FilesView from "./FilesView";
import FileUploader from "./FileUploader";

export default function JobDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const isCTV = user?.role === "recruiter";
  const isAdmin = user?.role === "admin";
  const ctvId = useMemo(() => user?.email || user?.id || "CTV", [user]);

  const [job, setJob] = useState(null);
  const [open, setOpen] = useState(false);
  const [groupedOffers, setGroupedOffers] = useState({});
  const [jdPublicUrl, setJdPublicUrl] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [file, setFile] = useState(null);

   // Load job data lần đầu và khi id thay đổi
  useEffect(() => {
    async function fetchJob() {
      // Giả sử bạn có hàm lấy chi tiết job
      const jobData = await getJobById(id);
      setJob(jobData);
    }
    fetchJob();
  }, [id]);

  // Load danh sách file và tìm file phù hợp khi job hoặc job.jdFileName thay đổi
  useEffect(() => {
    if (!job) {
      console.log("[fetch jd file]: no job found!")
      setJdPublicUrl(null);
      return;
    }

    async function fetchAndMatchedFileByJdLink() {
      console.log("upload file debug.");
      try {
        const files = await getListFiles();
        if (!files || files.length === 0) {
          setJdPublicUrl(null);
          return;
        }
        console.log(files, job);
        // Find the file that matches the jdLink
        const matched = files.find(file => decodeURIComponent(file.publicUrl.split("/").pop()) === decodeURIComponent(job.jdLink?.split("/").pop() || ""));
        console.log(matched);
        if (matched) {
          setJdPublicUrl(matched.publicUrl);
          setFile(matched.name);
        } else {
          setJdPublicUrl(null);
          setFile(null);
          console.warn("No matching file found for jdLink:", job.jdLink);
        }
      } catch (err) {
        console.error("Error fetching files:", err);
        setJdPublicUrl(null);
      }
    }    
    
    fetchAndMatchedFileByJdLink();
  }, [job?.jdLink]);
  
  console.log("JD Public URL set to:", jdPublicUrl);

  // Hàm gọi khi upload file thành công
  const handleFileUploadSuccess = (fileData) => {
    console.log(fileData)
    setUploadedFile(fileData.publicUrl);
    setJdPublicUrl(fileData.publicUrl);

    // ✅ Only update jdLink (using public URL)
    updateJobJD(id, { jdLink: fileData.publicUrl }).then((updatedJob) => {
      setJob(updatedJob); // Cập nhật lại state job để trigger effect lấy file
    });
    console.log(job);
  };



  // Admin: fetch grouped submissions and archived submissions
  useEffect(() => {
    if (!isAdmin) return;

    Promise.all([listSubmissions(), listArchivedSubmissions()]).then(
      ([subs, arch]) => {
        const all = [...subs, ...arch].filter(
          (s) => String(s.jobId) === String(id)
        );
        const grouped = all.reduce((acc, s) => {
          const key = s.ctv || "CTV";
          if (!acc[key]) acc[key] = [];
          acc[key].push(s);
          return acc;
        }, {});
        setGroupedOffers(grouped);
      }
    );
  }, [id, isAdmin]);

  if (!job) return <p>Loading...</p>;

  // Candidate submission form handler
  const submit = async (e) => {
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
      jobId: id,
      jobTitle: job.title,
      ctvId,
      email,
      phone,
      linkedin,
      portfolio,
      suitability,
      cvFile,
      bonus: job.bonus,
    });

    alert("Profile submitted successfully!");
    setOpen(false);
    form.reset();
  };

  // Helper for sections
  const section = (title, children) => (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
      <div style={{ lineHeight: 1.6, color: "#222" }}>{children}</div>
    </div>
  );

  // Responsive / mobile styles (simple)
  const isMobile = window.innerWidth <= 768;

  const mobileStyles = {
    container: { padding: 16, fontSize: 14 },
    title: { fontSize: 20, fontWeight: 700, marginBottom: 8 },
    detailsGrid: { display: "grid", gridTemplateColumns: "1fr", gap: 12 },
    section: { marginBottom: 24 },
    sectionTitle: { fontWeight: 600, marginBottom: 8 },
    sectionContent: { lineHeight: 1.6, color: "#222" },
  };

  const styles = isMobile ? mobileStyles : {};

  const jobDescriptionStyles = {
    container: {
      padding: "16px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
      marginBottom: "24px",
    },
    title: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "12px",
    },
    content: { fontSize: "16px", lineHeight: "1.6", color: "#555" },
  };

  return (
    <div style={styles.container || { padding: 16 }}>
      <div
        style={styles.title || { fontSize: 26, fontWeight: 700, marginBottom: 8 }}
      >
        {job.title}
      </div>

      {job.keywords && Array.isArray(job.keywords) && job.keywords.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          {job.keywords.map((keyword, index) => (
            <span
              key={index}
              style={{
                background: "#eef2ff",
                color: "#3730a3",
                padding: "3px 10px",
                borderRadius: 999,
                fontSize: 12,
                marginBottom: 4,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}

      <div
        style={
          styles.detailsGrid || { display: "grid", gridTemplateColumns: "1fr 320px", gap: 24 }
        }
      >
        {/* Left: Job details */}
        <div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Salary</div>
              <div style={{ fontWeight: 600 }}>{job.salary ?? "N/A"}</div>
            </div>
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Location</div>
              <div style={{ fontWeight: 600 }}>{job.location || "-"}</div>
            </div>
            <div
              style={{
                background: "#fafafa",
                border: "1px solid #eee",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>Reward</div>
              <div style={{ fontWeight: 600 }}>
                Candidate: {job.rewardCandidateUSD || 0} USD
              </div>
            </div>
          </div>

          <div style={jobDescriptionStyles.container}>
            <div style={jobDescriptionStyles.title}>Job Overview And Responsibility</div>
            <div style={jobDescriptionStyles.content}>
              {job.description ? (
                <div style={{ whiteSpace: "pre-line" }}>{job.description}</div>
              ) : (
                <ul style={{ paddingLeft: "18px", margin: "0" }}>
                  <li>Design and implement core operational processes for company scalability.</li>
                  <li>Build and run customer support operations and documentation.</li>
                  <li>Collaborate across product, engineering, and leadership teams.</li>
                  <li>Monitor business metrics and ensure compliance.</li>
                  <li>Recruit, train, and lead the Customer Support team.</li>
                  <li>Identify operational bottlenecks and propose scalable solutions.</li>
                </ul>
              )}
            </div>
          </div>

          {section(
            "Required Skills and Experience",
            job.requirements ? (
              <div style={{ whiteSpace: "pre-line" }}>{job.requirements}</div>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>4-5 years of experience in operations/business/customer support.</li>
                <li>Experience setting up processes and scaling teams.</li>
                <li>Strong writing and documentation skills.</li>
                <li>Proficiency in productivity tools (Google Workspace, Notion).</li>
                <li>Comfortable with ambiguity and rapid change.</li>
                <li>English reading/writing proficiency.</li>
              </ul>
            )
          )}

          {section(
            "Why Candidate should apply this position",
            job.benefits ? (
              <div style={{ whiteSpace: "pre-line" }}>{job.benefits}</div>
            ) : (
              <ul style={{ paddingLeft: 18, margin: 0 }}>
                <li>Growth mindset and ownership culture.</li>
                <li>Healthy debates and transparent communication.</li>
                <li>Document everything for clarity and speed.</li>
                <li>Startup environment with bold vision and rapid learning.</li>
              </ul>
            )
          )}

          {section("Other", job.other ? <div>{job.other}</div> : <div>No any specific notice</div>)}
        </div>

        {/* Right: actions and file views */}
        <aside style={{ alignSelf: "start" }}>
          {isCTV && (
            <>
              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 14,
                  background: "#fff",
                  marginBottom: 16,
                }}
              >
                <div style={{ fontWeight: 700, marginBottom: 10 }}>Actions</div>
                <button
                  onClick={() => setOpen(true)}
                  style={{ width: "100%", marginBottom: 8 }}
                >
                  Submit candidate
                </button>
              </div>

              <div
                style={{
                  border: "1px solid #eee",
                  borderRadius: 10,
                  padding: 14,
                  background: "#fff",
                }}
              >
                <FilesView publicUrl={jdPublicUrl} name={file}/>
              </div>
            </>
          )}

          {isAdmin && (
            <div
              style={{
                border: "2px solid #ddd",
                borderRadius: "12px",
                padding: "20px",
                background: "#f7f7f7",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                marginTop: 24,
              }}
            >
              <h3 style={{ marginBottom: 12 }}>Admin: Manage JD File</h3>
              

              <FilesView publicUrl={jdPublicUrl} name={file}/>
              <div style={{borderRadius:5, border: "2px solid black", height:2, marginBottom: 10, marginTop: 5}}></div>
              <FileUploader onUploadSuccess={handleFileUploadSuccess} />
              
            </div>
          )}
        </aside>
      </div>


      {/* Submit candidate modal */}
      {open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={submit}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 12,
              padding: 24,
              width: "90vw",
              maxWidth: 400,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <h3>Submit Candidate</h3>
            <input type="text" name="name" placeholder="Candidate Name" required />
            <input type="email" name="email" placeholder="Candidate Email" required />
            <input type="tel" name="phone" placeholder="Candidate Phone" required />
            <input type="file" name="cvFile" accept=".pdf,.doc,.docx" required />
            <input type="url" name="linkedin" placeholder="LinkedIn URL" />
            <input type="url" name="portfolio" placeholder="Portfolio URL" />
            <textarea
              name="suitability"
              placeholder="Why is candidate suitable?"
              rows={3}
              required
            />
            <button type="submit">Submit</button>
            <button type="button" onClick={() => setOpen(false)} style={{ marginTop: 8 }}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

