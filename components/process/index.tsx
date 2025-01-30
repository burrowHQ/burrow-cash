import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import LoadingBar from "react-top-loading-bar";

export default function Process() {
  const [progress, setProgress] = useState(0);
  const router = useRouter();
  useEffect(() => {
    router.events.on("routeChangeStart", () => {
      setProgress(30);
    });
    router.events.on("routeChangeComplete", () => {
      setProgress(100);
    });
  }, []);
  return (
    <LoadingBar
      color="#D2FF3A"
      height={3}
      progress={progress}
      onLoaderFinished={() => setProgress(0)}
    />
  );
}
