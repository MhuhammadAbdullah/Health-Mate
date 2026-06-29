export function Spinner({ size = "md", color = "teal" }) {
  const s = { sm:"w-5 h-5 border-2", md:"w-8 h-8 border-2", lg:"w-12 h-12 border-3" }[size];
  const c = { teal:"border-teal-100 border-t-teal-400", white:"border-white/30 border-t-white", gray:"border-gray-100 border-t-gray-400" }[color];
  return <div className={`${s} ${c} rounded-full animate-spin`}></div>;
}
