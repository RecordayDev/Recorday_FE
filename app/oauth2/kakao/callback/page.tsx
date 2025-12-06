import { Suspense } from "react";
import KakaoCallbackClient from "./KakaoCallbackClient";

export default function Page() {
  return (
    <Suspense>
      <KakaoCallbackClient />
    </Suspense>
  );
}
