import { MessagesPage } from "@/components/messages";

export const metadata = {
  title: "Messages",
  description: "Internal messaging between admins and agents",
};

export default function MessagesRoute() {
  return <MessagesPage />;
}
