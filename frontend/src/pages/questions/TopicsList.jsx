import React, { useEffect, useState } from "react";
import axios from "axios";

export default function TopicsList() {
  const [data, setData] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    // 1️⃣ Load all subjects
    const subRes = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/subject`,
      {
        headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
      }
    );

    const subjects = subRes.data;

    // 2️⃣ For each subject, load its topics
    const final = [];
    for (const s of subjects) {
      const tRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/topic/${s._id}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        }
      );

      final.push({
        subjectName: s.name,
        topics: tRes.data,
      });
    }

    setData(final);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">Subjects & Topics</h2>

      {data.map((row, idx) => (
        <div key={idx} className="mb-6 border rounded p-4 bg-white">
          {/* Subject Title */}
          <h3 className="font-semibold text-lg mb-2 text-blue-700">
            {row.subjectName}
          </h3>

          {/* Topics Table */}
          <table className="w-full border-collapse border text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="border p-2 w-10">#</th>
                <th className="border p-2">Topic Name</th>
                <th className="border p-2">Created At</th>
              </tr>
            </thead>

            <tbody>
              {row.topics.length === 0 && (
                <tr>
                  <td colSpan={3} className="border p-2 text-center text-slate-500">
                    No topics added yet
                  </td>
                </tr>
              )}

              {row.topics.map((topic, i) => (
                <tr key={topic._id}>
                  <td className="border p-2">{i + 1}</td>
                  <td className="border p-2">{topic.name}</td>
                  <td className="border p-2">
                    {new Date(topic.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
