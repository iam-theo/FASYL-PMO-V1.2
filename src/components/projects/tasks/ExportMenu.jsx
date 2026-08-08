import { useEffect, useRef, useState } from "react";
import { exportData } from "../../../utils/export";

const EXPORT_FORMATS = [
  { value: "pdf", label: "PDF" },
  { value: "excel", label: "Excel" },
  { value: "csv", label: "CSV" },
];

function ExportMenu({ filename, columns, rows, title }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleExport = (format) => {
    setOpen(false);
    exportData(format, { filename, columns, rows, title });
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="px-4 py-2.5 rounded-lg border border-[#0000000D] bg-[#E8E8E8] flex items-center gap-2 cursor-pointer"
      >
        <i className="fa-solid fa-file-export text-[#090909]"></i>
        <span className="font-medium text-[14px]/[20px] text-[#1B3C4A]">
          Export
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-20 w-36 rounded-lg border border-[#0000000D] bg-[#FFFFFF] shadow-[0_4px_6px_-2px_rgba(16,24,40,0.03),0_12px_16px_-4px_rgba(16,24,40,0.08)] overflow-hidden">
          {EXPORT_FORMATS.map((format) => (
            <button
              key={format.value}
              type="button"
              onClick={() => handleExport(format.value)}
              className="w-full px-4 py-2.5 text-left font-medium text-[14px]/[20px] text-[#1B3C4A] hover:bg-[#E8E8E8] cursor-pointer"
            >
              {format.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExportMenu;
