import { redirect } from "next/navigation";

export const metadata = {
  title: "Files | CloudRage",
  description: "Manage your cloud files and directories.",
};

export default function FileManagerPage() {
  redirect("/files");
}