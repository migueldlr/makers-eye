import { redirect } from "next/navigation";
import {
  getCatalogAdminEventSummaries,
  getCatalogEventDetail,
} from "@/lib/catalog/queries";
import { createClient } from "@/utils/supabase/server";
import { AdminCatalogClient } from "./AdminCatalogClient";

export const dynamic = "force-dynamic";

export default async function CatalogAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const events = await getCatalogAdminEventSummaries();
  const { event } = await searchParams;
  const eventId = Number(event ?? events[0]?.id);
  const selectedEvent = Number.isInteger(eventId)
    ? await getCatalogEventDetail(eventId, true, false)
    : null;

  return (
    <AdminCatalogClient
      key={selectedEvent?.id ?? "none"}
      events={events}
      selectedEvent={selectedEvent}
    />
  );
}
