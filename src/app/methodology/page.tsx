import { permanentRedirect } from "next/navigation";

export default function MethodologyRedirectPage() {
  permanentRedirect("/guide#methodology");
}
