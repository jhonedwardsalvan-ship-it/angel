// Templates remount on navigation, so each page replays its fade-in.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
