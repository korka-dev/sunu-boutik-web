export function LogoMark({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className}>
      <rect x="2" y="13" width="28" height="16" rx="2" fill="#2563eb" />
      <path d="M4 13 7 4h18l3 9" stroke="#2563eb" strokeWidth="2.2" strokeLinejoin="round" fill="none" />
      <path d="M11 13v3a3 3 0 0 0 6 0v-3" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <rect x="2" y="27.4" width="28" height="1.6" rx="0.8" fill="#16a34a" />
    </svg>
  );
}

export default function Logo({ className = "", markClassName = "w-8 h-8" }: { className?: string; markClassName?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={markClassName} />
      <span className="font-bold text-blue-700">Sunu Boutik</span>
    </span>
  );
}
