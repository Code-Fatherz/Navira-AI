import logoImage from "@/assets/mediroute-logo.png";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-20 h-20",
  md: "w-28 h-28",
  lg: "w-36 h-36",
};

const textSizeClasses = {
  sm: "text-2xl",
  md: "text-3xl",
  lg: "text-4xl",
};

export const Logo = ({ size = "md", showText = true, className = "" }: LogoProps) => {
  return (
    <div className={`flex items-center gap-2 -mt-16 ${className}`}>
      <img
        src={logoImage}
        alt="MediRoute AI Logo"
        className={`${sizeClasses[size]} object-contain`}
      />
      {showText && (
        <span className={`font-bold text-foreground ${textSizeClasses[size]}`}>
          MediRoute AI
        </span>
      )}
    </div>
  );
};

export default Logo;
