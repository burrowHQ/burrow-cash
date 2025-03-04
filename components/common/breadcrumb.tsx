import { useRouter } from "next/router";
import { ArrowLeft } from "../Icons/IconsV2";

export default function Breadcrumb({ path, title }: { path: string; title: string }) {
  const router = useRouter();
  return (
    <div
      className="inline-flex items-center cursor-pointer mb-4"
      onClick={() => {
        router.push(path);
      }}
    >
      <ArrowLeft />
      <span className="text-sm text-gray-300 ml-3">{title}</span>
    </div>
  );
}
