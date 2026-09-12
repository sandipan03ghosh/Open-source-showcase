import Link from "next/link";

const Logo = ({ className }: { className?: string }) => {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className ?? ""}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <rect width="28" height="28" rx="8" className="fill-primary" />
        <path
          d="M9.5 8.5 6 14l3.5 5.5M18.5 8.5 22 14l-3.5 5.5M15.5 7.5l-3 13"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="font-work-sans font-extrabold text-[18px] text-foreground tracking-tight">
        Open Source Showcase
      </span>
    </Link>
  );
};

export default Logo;
