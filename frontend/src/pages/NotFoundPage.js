import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
      <div className="relative mb-8 select-none">
        <span className="text-[120px] font-display font-black text-teal-400 leading-none tracking-tight">
          404
        </span>
        {/* <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-20 h-20 rounded-2xl bg-teal-50 flex items-center justify-center shadow-sm">
            <i className="ti ti-map-off text-4xl text-teal-400" />
          </span>
        </div> */}
      </div>

      <h1 className="text-2xl font-bold text-gray-800 mb-2">Page Not Found</h1>
      <p className="text-gray-400 text-sm max-w-xs mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600"
        >
          <i className="ti ti-arrow-left text-base" />
          Go Back
        </button>
        <button
          onClick={() => navigate("/dashboard", { replace: true })}
          className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 text-sm"
        >
          <i className="ti ti-home text-base" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
