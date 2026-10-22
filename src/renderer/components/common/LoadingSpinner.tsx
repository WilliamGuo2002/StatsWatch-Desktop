export default function LoadingSpinner({ text }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-2 border-ow-orange border-t-transparent rounded-full animate-spin" />
      {text && <p className="text-ow-text-secondary text-sm">{text}</p>}
    </div>
  );
}
