// Next.js server startup hook — runs once when the Node.js server initialises.
// Schedules automatic daily notifications for overdue and due-soon loans.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = (await import("node-cron")).default;
    const { processScheduledNotifications } = await import("./lib/cron");

    // Run every day at 8:00 AM server time
    cron.schedule("0 8 * * *", () => {
      processScheduledNotifications().catch((err) =>
        console.error("[cron] Scheduled notification error:", err)
      );
    });

    console.log("[cron] Daily reminder scheduler registered (runs at 08:00 every day)");
  }
}
