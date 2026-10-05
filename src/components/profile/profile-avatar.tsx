type ProfileAvatarProps = {
  initials: string;
  className?: string;
};

export function ProfileAvatar({ initials, className = "" }: ProfileAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-xs font-semibold text-secondary-foreground ${className}`}
    >
      {initials}
    </span>
  );
}