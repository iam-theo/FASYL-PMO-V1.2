import { Fragment } from "react";

function ProjectBreadcrumb({ items = [] }) {
  return (
    <nav className="flex items-center gap-2">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <Fragment key={item.label}>
            <button
              type="button"
              onClick={item.onClick}
              disabled={isLast || !item.onClick}
              className={`font-medium text-[14px]/[20px] ${
                isLast
                  ? "text-[#1B3C4A] cursor-default"
                  : "text-[#949494] hover:text-[#1B3C4A] cursor-pointer"
              }`}
            >
              {item.label}
            </button>
            {!isLast && <span className="text-[#D0D5DD]">/</span>}
          </Fragment>
        );
      })}
    </nav>
  );
}

export default ProjectBreadcrumb;
