const AVATAR_GRADIENTS = [
  "from-[#1B3C4A] to-[#2E6B7E]",
  "from-[#4338CA] to-[#7C3AED]",
  "from-[#0E7490] to-[#06B6D4]",
  "from-[#B45309] to-[#F59E0B]",
  "from-[#047857] to-[#10B981]",
  "from-[#9D174D] to-[#DB2777]",
  "from-[#334155] to-[#64748B]",
  "from-[#C2410C] to-[#F97316]",
];

export const avatarGradientFor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length];
};

export const initialsFor = (name = "", fallback = "?") => {
  const parts = String(name).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};
