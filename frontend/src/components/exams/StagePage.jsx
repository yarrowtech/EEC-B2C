export default function StagePage({ stage }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Stage {stage}</h1>
      <p className="mt-2 text-slate-600">Your exam will start soon.</p>
    </div>
  );
}
