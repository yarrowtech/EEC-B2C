import React, { useEffect, useState } from "react";
import axios from "axios";

export default function SubjectsList() {
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/subject`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("jwt")}`,
      },
    });
    setSubjects(res.data);
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4">All Subjects</h2>

      <table className="w-full border-collapse border text-sm">
        <thead>
          <tr className="bg-slate-100">
            <th className="border p-2">#</th>
            <th className="border p-2">Subject Name</th>
            <th className="border p-2">Created At</th>
          </tr>
        </thead>
        <tbody>
          {subjects.map((s, idx) => (
            <tr key={s._id}>
              <td className="border p-2">{idx + 1}</td>
              <td className="border p-2">{s.name}</td>
              <td className="border p-2">
                {new Date(s.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
