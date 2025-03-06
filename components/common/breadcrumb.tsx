import { twMerge } from "tailwind-merge";
import { useRouter } from "next/router";
import { ArrowLeft } from "../Icons/IconsV2";

export default function Breadcrumb({
  path,
  title,
  customCss,
}: {
  path: string;
  title: string;
  customCss?: string;
}) {
  const router = useRouter();
  return (
    <div
      className={twMerge("inline-flex items-center cursor-pointer mb-4", customCss || "")}
      onClick={() => {
        router.push(path);
      }}
    >
      <ArrowLeft />
      <span className="text-sm text-gray-300 ml-3">{title}</span>
    </div>
  );
}
