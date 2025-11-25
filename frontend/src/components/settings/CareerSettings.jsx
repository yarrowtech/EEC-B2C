import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Settings, BriefcaseBusiness } from "lucide-react";
import { ToastContainer } from "react-toastify";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const emptyWhyItem = { title: "", description: "", icon: "" };
const emptyJob = {
  title: "",
  tag: "Opening",
  shortDescription: "",
  points: ["", "", ""],
  experience: "",
  buttonLabel: "Apply Now",
  isActive: true,
  order: 0,
};

const CareerSettings = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [whyJoinTitle, setWhyJoinTitle] = useState("Why Join EEC?");
  const [whyJoinItems, setWhyJoinItems] = useState([emptyWhyItem]);
  const [introText, setIntroText] = useState("");
  const [jobSectionTitle, setJobSectionTitle] =
    useState("Current Job Openings");
  const [jobOpenings, setJobOpenings] = useState([emptyJob]);

  // fetch existing data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(
          `${API_BASE}/api/settings/career-page`
        );

        setWhyJoinTitle(data.whyJoinTitle || "Why Join EEC?");
        setWhyJoinItems(
          data.whyJoinItems?.length ? data.whyJoinItems : [emptyWhyItem]
        );
        setIntroText(data.introText || "");
        setJobSectionTitle(
          data.jobSectionTitle || "Current Job Openings"
        );
        setJobOpenings(
          data.jobOpenings?.length ? data.jobOpenings : [emptyJob]
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load career page data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const token = localStorage.getItem("admin_token"); // or wherever you store
      await axios.put(
        `${API_BASE}/api/settings/career-page`,
        {
          whyJoinTitle,
          whyJoinItems,
          introText,
          jobSectionTitle,
          jobOpenings,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      toast.success("Career page updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update career page");
    } finally {
      setSaving(false);
    }
  };

  const updateWhyItem = (index, key, value) => {
    setWhyJoinItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const addWhyItem = () => {
    setWhyJoinItems((prev) => [...prev, { ...emptyWhyItem }]);
  };

  const removeWhyItem = (index) => {
    setWhyJoinItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateJob = (index, key, value) => {
    setJobOpenings((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: value };
      return copy;
    });
  };

  const updateJobPoint = (jobIndex, pointIndex, value) => {
    setJobOpenings((prev) => {
      const copy = [...prev];
      const points = copy[jobIndex].points || [];
      points[pointIndex] = value;
      copy[jobIndex].points = points;
      return copy;
    });
  };

  const addJob = () => {
    setJobOpenings((prev) => [...prev, { ...emptyJob }]);
  };

  const removeJob = (index) => {
    setJobOpenings((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <ToastContainer />

      {/* HEADER */}
      <div className="flex items-center gap-4 mt-4">
        <div className="size-11 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md">
          <BriefcaseBusiness size={22} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Career Page Settings
          </h1>
          <p className="text-sm text-slate-500">
            Manage “Why Join EEC?”, intro text and current job openings
          </p>
        </div>
        {loading && (
          <span className="ml-auto text-xs text-slate-400">
            Loading...
          </span>
        )}
      </div>

      <form
        onSubmit={handleSave}
        className="space-y-8 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-xl p-5 md:p-7 shadow-xl"
      >
        {/* Why Join Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Why Join EEC Section
            </h2>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-slate-700">
              Section Title
              <input
                type="text"
                className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 shadow-sm"
                value={whyJoinTitle}
                onChange={(e) => setWhyJoinTitle(e.target.value)}
              />
            </label>

            <div className="grid gap-4 md:grid-cols-3">
              {whyJoinItems.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-slate-200 bg-white/80 p-3 space-y-2 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-800">
                      Card {index + 1}
                    </p>
                    {whyJoinItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWhyItem(index)}
                        className="text-xs text-rose-500 hover:text-rose-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Title"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={item.title}
                    onChange={(e) =>
                      updateWhyItem(index, "title", e.target.value)
                    }
                  />

                  <textarea
                    rows={3}
                    placeholder="Description"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs resize-none focus:ring-1 focus:ring-indigo-500/60"
                    value={item.description}
                    onChange={(e) =>
                      updateWhyItem(index, "description", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Icon (optional)"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={item.icon || ""}
                    onChange={(e) =>
                      updateWhyItem(index, "icon", e.target.value)
                    }
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addWhyItem}
              className="text-xs mt-1 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100"
            >
              + Add Card
            </button>
          </div>
        </section>

        {/* Intro Paragraph */}
        <section className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-800">
            Intro Paragraph
          </h2>
          <textarea
            rows={5}
            className="w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-indigo-500/70 shadow-sm"
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
            placeholder="Welcome to EEC, where innovation meets education! ..."
          />
        </section>

        {/* Job Openings */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-800">
              Current Job Openings
            </h2>
          </div>

          <label className="block text-sm text-slate-700">
            Section Title
            <input
              type="text"
              className="mt-1 w-full rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/70 shadow-sm"
              value={jobSectionTitle}
              onChange={(e) => setJobSectionTitle(e.target.value)}
            />
          </label>

          <div className="space-y-4">
            {jobOpenings.map((job, index) => (
              <div
                key={job._id || index}
                className="rounded-2xl border border-slate-200 bg-white/80 p-4 space-y-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-800">
                    Job {index + 1}
                  </p>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs text-slate-700">
                      <span>Active</span>
                      <input
                        type="checkbox"
                        checked={job.isActive}
                        onChange={(e) =>
                          updateJob(index, "isActive", e.target.checked)
                        }
                      />
                    </label>
                    {jobOpenings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeJob(index)}
                        className="text-xs text-rose-500 hover:text-rose-400"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Job Title"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={job.title}
                    onChange={(e) =>
                      updateJob(index, "title", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Badge Text (Opening)"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={job.tag}
                    onChange={(e) =>
                      updateJob(index, "tag", e.target.value)
                    }
                  />
                </div>

                <textarea
                  rows={3}
                  placeholder="Short description"
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs resize-none focus:ring-1 focus:ring-indigo-500/60"
                  value={job.shortDescription}
                  onChange={(e) =>
                    updateJob(index, "shortDescription", e.target.value)
                  }
                />

                <div className="grid md:grid-cols-3 gap-3">
                  {(job.points || ["", "", ""]).map((p, pIndex) => (
                    <input
                      key={pIndex}
                      type="text"
                      placeholder={`Bullet ${pIndex + 1}`}
                      className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                      value={p}
                      onChange={(e) =>
                        updateJobPoint(index, pIndex, e.target.value)
                      }
                    />
                  ))}
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Experience text"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={job.experience}
                    onChange={(e) =>
                      updateJob(index, "experience", e.target.value)
                    }
                  />

                  <input
                    type="text"
                    placeholder="Button label"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={job.buttonLabel}
                    onChange={(e) =>
                      updateJob(index, "buttonLabel", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Order"
                    className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                    value={job.order}
                    onChange={(e) =>
                      updateJob(index, "order", Number(e.target.value))
                    }
                  />
                </div>
                <input
                  type="text"
                  placeholder="Enter Google Form Link"
                  className="w-full rounded-md bg-white border border-slate-200 px-2 py-1.5 text-xs focus:ring-1 focus:ring-indigo-500/60"
                  value={job.formUrl || ""}
                  onChange={(e) => updateJob(index, "formUrl", e.target.value)}
                />

              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addJob}
            className="text-xs mt-1 rounded-full border border-slate-300 px-3 py-1 hover:bg-slate-100"
          >
            + Add Job
          </button>
        </section>

        {/* SAVE BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-sm font-medium text-white shadow disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CareerSettings;
