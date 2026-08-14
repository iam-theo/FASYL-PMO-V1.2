import { useEffect, useState } from "react";
import { subscribeToLoading } from "../../api";
import FasylLogo from "../../assets/FasylLogo.svg";

function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => subscribeToLoading(setLoading), []);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-3000 flex items-center justify-center bg-[#0B1B24]/40 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-6 shadow-lg">
        <img
          src={FasylLogo}
          alt="FASYL PMO"
          className="h-16 w-16 animate-spin"
        />
        <p className="text-[14px] font-medium text-[#090909]">Loading...</p>
      </div>
    </div>
  );
}

export default GlobalLoader;
