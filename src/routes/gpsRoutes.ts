import { Router } from "express";
import { db } from "../db/index.ts";
import { gpsTrips, gpsUsers } from "../db/schema.ts";
import { eq, and, or, desc } from "drizzle-orm";

const router = Router();

// Helper to extract authenticated user from parent application context or request headers
const getUserContext = (req: any) => {
  if (req.user && (req.user.id || req.user.uid)) {
    return {
      id: String(req.user.id || req.user.uid),
      email: String(req.user.email || 'employee@paiequebec.ca')
    };
  }
  const id = req.headers['x-user-id'] || req.headers['user-id'] || 'employee-user';
  const email = req.headers['x-user-email'] || req.headers['user-email'] || 'employee@paiequebec.ca';
  return { id: String(id), email: String(email) };
};

// Helper to get or create a numeric user ID in gps_users matching user context
async function getOrCreateGpsUserId(req: any): Promise<number> {
  const user = getUserContext(req);
  const numericId = parseInt(user.id, 10);
  if (!isNaN(numericId) && numericId > 0) {
    return numericId;
  }

  const existing = await db.select().from(gpsUsers).where(eq(gpsUsers.email, user.email)).limit(1);
  if (existing.length > 0) {
    return existing[0].id;
  }

  const inserted = await db.insert(gpsUsers).values({
    username: user.email.split('@')[0],
    email: user.email,
    password: 'firebase_authenticated_sso',
  }).returning({ id: gpsUsers.id });

  return inserted[0].id;
}

// Trip Routes (Protected by global application authentication)
router.post("/api/trips", async (req: any, res) => {
  const { id, date, duration, distance, maxSpeed, avgSpeed, calories, score, overspeedSeconds, status, expenseId, route } = req.body;

  try {
    const userId = await getOrCreateGpsUserId(req);
    const candidateDate = date ? new Date(date) : new Date();
    const parsedDate = isNaN(candidateDate.getTime()) ? new Date() : candidateDate;

    if (id) {
      const existing = await db.select().from(gpsTrips).where(eq(gpsTrips.localId, id)).limit(1);
      if (existing.length > 0) {
        await db.update(gpsTrips)
          .set({
            date: parsedDate,
            duration,
            distance: String(distance ?? 0),
            maxSpeed: String(maxSpeed ?? 0),
            avgSpeed: String(avgSpeed ?? 0),
            calories: String(calories ?? 0),
            score,
            overspeedSeconds: overspeedSeconds !== undefined ? Number(overspeedSeconds) : 0,
            status: status || 'recorded',
            expenseId: expenseId || null,
            route,
          })
          .where(eq(gpsTrips.localId, id));

        return res.status(200).json({ message: "Trip updated successfully" });
      }
    }

    await db.insert(gpsTrips).values({
      userId,
      localId: id || null,
      date: parsedDate,
      duration,
      distance: String(distance ?? 0),
      maxSpeed: String(maxSpeed ?? 0),
      avgSpeed: String(avgSpeed ?? 0),
      calories: String(calories ?? 0),
      score,
      overspeedSeconds: overspeedSeconds !== undefined ? Number(overspeedSeconds) : 0,
      status: status || 'recorded',
      expenseId: expenseId || null,
      route,
    });

    res.status(201).json({ message: "Trip saved successfully" });
  } catch (error: any) {
    console.error("Error saving trip:", error);
    res.status(500).json({ error: "Failed to save trip" });
  }
});

router.get("/api/trips", async (req: any, res) => {
  try {
    const userId = await getOrCreateGpsUserId(req);
    const rows = await db.select()
      .from(gpsTrips)
      .where(eq(gpsTrips.userId, userId))
      .orderBy(desc(gpsTrips.date));

    const formattedTrips = rows.map((trip) => ({
      id: trip.localId || trip.id.toString(),
      date: trip.date ? new Date(trip.date).toISOString() : new Date().toISOString(),
      duration: trip.duration,
      distance: trip.distance ? parseFloat(String(trip.distance)) : 0,
      maxSpeed: trip.maxSpeed ? parseFloat(String(trip.maxSpeed)) : 0,
      avgSpeed: trip.avgSpeed ? parseFloat(String(trip.avgSpeed)) : 0,
      calories: trip.calories ? parseFloat(String(trip.calories)) : 0,
      score: trip.score,
      overspeedSeconds: trip.overspeedSeconds || 0,
      status: trip.status || 'recorded',
      expenseId: trip.expenseId || null,
      route: trip.route,
    }));

    res.json(formattedTrips);
  } catch (error: any) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: "Failed to fetch trips" });
  }
});

router.get("/api/trips/:id", async (req: any, res) => {
  const tripId = req.params.id;
  try {
    const userId = await getOrCreateGpsUserId(req);
    const numericId = parseInt(tripId, 10);

    const rows = !isNaN(numericId)
      ? await db.select().from(gpsTrips).where(and(eq(gpsTrips.userId, userId), or(eq(gpsTrips.localId, tripId), eq(gpsTrips.id, numericId)))).limit(1)
      : await db.select().from(gpsTrips).where(and(eq(gpsTrips.userId, userId), eq(gpsTrips.localId, tripId))).limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const trip = rows[0];
    return res.json({
      id: trip.localId || trip.id.toString(),
      date: trip.date ? new Date(trip.date).toISOString() : new Date().toISOString(),
      duration: trip.duration,
      distance: trip.distance ? parseFloat(String(trip.distance)) : 0,
      maxSpeed: trip.maxSpeed ? parseFloat(String(trip.maxSpeed)) : 0,
      avgSpeed: trip.avgSpeed ? parseFloat(String(trip.avgSpeed)) : 0,
      calories: trip.calories ? parseFloat(String(trip.calories)) : 0,
      score: trip.score,
      overspeedSeconds: trip.overspeedSeconds || 0,
      status: trip.status || 'recorded',
      expenseId: trip.expenseId || null,
      route: trip.route,
    });
  } catch (error: any) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ error: "Failed to fetch trip" });
  }
});

// Direct Trip-to-Expense Conversion Route
router.post("/api/trips/:id/convert-expense", async (req: any, res) => {
  const tripId = req.params.id;
  try {
    const userId = await getOrCreateGpsUserId(req);
    const numericId = parseInt(tripId, 10);

    const rows = !isNaN(numericId)
      ? await db.select().from(gpsTrips).where(and(eq(gpsTrips.userId, userId), or(eq(gpsTrips.localId, tripId), eq(gpsTrips.id, numericId)))).limit(1)
      : await db.select().from(gpsTrips).where(and(eq(gpsTrips.userId, userId), eq(gpsTrips.localId, tripId))).limit(1);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const trip = rows[0];
    const userContext = getUserContext(req);
    const km = Number(parseFloat(String(trip.distance || 0)).toFixed(2));
    const ratePerKm = 0.70; // CRA / Revenu Québec 2026 standard vehicle allowance rate
    const amount = Number((km * ratePerKm).toFixed(2));
    const expenseId = `exp_gps_${trip.localId || trip.id}_${Date.now()}`;

    const { businessExpenses, expenses } = await import("../db/schema.ts");

    // Insert into business_expenses
    await db.insert(businessExpenses).values({
      id: expenseId,
      date: trip.date ? new Date(trip.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      category: 'Kilométrage & Déplacements',
      description: `Indemnité kilométrique GPS - Trajet ${km} km (${trip.duration ? Math.floor(trip.duration / 60) + 'm' : ''})`,
      amount: String(amount),
      deductibleAmount: String(amount),
      receiptUrl: null,
      notes: `Trajet GPS vérifié. Distance: ${km} km. Taux kilométrique: 0,70 $/km. Vitesse moy: ${trip.avgSpeed} km/h, Score sécurité: ${trip.score}/100.`,
      employeeId: String(userId),
      employeeName: userContext.email.split('@')[0],
      employeeEmail: userContext.email,
      source: 'gps_triplog',
      sourceId: trip.localId || String(trip.id),
      status: 'pending_approval',
      createdAt: new Date(),
    });

    // Also mirror to canonical expenses table
    try {
      await db.insert(expenses).values({
        id: expenseId,
        source: 'gps_triplog',
        sourceId: trip.localId || String(trip.id),
        idempotencyKey: `idemp_${expenseId}`,
        amount: String(amount),
        currency: 'CAD',
        status: 'pending_approval',
        description: `Indemnité kilométrique GPS - Trajet ${km} km`,
        userId: String(userId),
        metadata: JSON.stringify({ km, ratePerKm, duration: trip.duration, score: trip.score }),
        createdAt: new Date(),
      });
    } catch (e) {
      console.warn("Expense canonical insert notice:", e);
    }

    // Update trip with expense reference and reimbursed status
    await db.update(gpsTrips)
      .set({
        status: 'converted_to_expense',
        expenseId,
      })
      .where(eq(gpsTrips.id, trip.id));

    res.status(201).json({
      success: true,
      expenseId,
      amount,
      km,
      ratePerKm,
      message: `Trajet converti en dépense de ${amount.toFixed(2)} $ avec succès !`
    });
  } catch (error: any) {
    console.error("Error converting trip to expense:", error);
    res.status(500).json({ error: "Failed to convert trip to expense", details: error.message });
  }
});

router.delete("/api/trips/:id", async (req: any, res) => {
  const tripId = req.params.id;

  try {
    const userId = await getOrCreateGpsUserId(req);
    const numericId = parseInt(tripId, 10);

    if (!isNaN(numericId)) {
      await db.delete(gpsTrips).where(
        and(
          eq(gpsTrips.userId, userId),
          or(eq(gpsTrips.localId, tripId), eq(gpsTrips.id, numericId))
        )
      );
    } else {
      await db.delete(gpsTrips).where(
        and(eq(gpsTrips.userId, userId), eq(gpsTrips.localId, tripId))
      );
    }

    res.json({ message: "Trip deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: "Failed to delete trip" });
  }
});

router.delete("/api/trips", async (req: any, res) => {
  try {
    const userId = await getOrCreateGpsUserId(req);
    await db.delete(gpsTrips).where(eq(gpsTrips.userId, userId));
    res.json({ message: "All trips deleted successfully" });
  } catch (error: any) {
    console.error("Error clearing trips:", error);
    res.status(500).json({ error: "Failed to clear trips" });
  }
});

// Database Status Route
router.get("/api/gps-db-status", async (req, res) => {
  try {
    const check = await db.select().from(gpsTrips).limit(1);
    res.json({ status: "Connected to PostgreSQL (triplog-gps)", active: true, count: check.length });
  } catch (error: any) {
    res.status(500).json({ status: "PostgreSQL connection failed", error: error.message });
  }
});

export default router;
