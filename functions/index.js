/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Create a nodemailer transporter with Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail?.email || "your-email@gmail.com",
    pass: functions.config().gmail?.password || "your-app-password",
  },
});

// This function runs daily to send reminders
exports.sendDailyReminders = functions.pubsub
  .schedule("0 8 * * *") // Run at 8am every day
  .timeZone("America/Los_Angeles") // Adjust timezone as needed
  .onRun(async (context) => {
    const now = new Date();
    console.log(`Running daily reminders job at ${now.toISOString()}`);

    try {
      // Get all user profiles that have reminders enabled
      const usersSnapshot = await admin
        .firestore()
        .collection("userProfiles")
        .where("enableEmailReminders", "==", true)
        .get();

      console.log(
        `Found ${usersSnapshot.docs.length} users with reminders enabled`
      );

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        try {
          // Get user's email
          const userRecord = await admin.auth().getUser(userId);
          const email = userRecord.email;

          if (!email) {
            console.log(`No email found for user ${userId}`);
            continue;
          }

          // Get user's treatments and completions for today
          const treatments = await getTreatmentsForUser(userId);
          const completions = await getTodayCompletionsForUser(userId);

          // Filter for treatments that should be due today
          const dueTreatments = filterDueTreatments(treatments, completions);

          console.log(
            `User ${userId} has ${dueTreatments.length} treatments due today`
          );

          // If no due treatments, skip this user
          if (
            dueTreatments.length === 0 &&
            userData.reminderFrequency === "missed-only"
          ) {
            console.log(
              `Skipping email for user ${userId} - no due treatments`
            );
            continue;
          }

          // Send the email reminder
          await sendReminderEmail(email, dueTreatments);
          console.log(`Reminder email sent to ${email}`);
        } catch (userError) {
          console.error(`Error processing user ${userId}:`, userError);
        }
      }

      return null;
    } catch (error) {
      console.error("Error in sendDailyReminders:", error);
      return null;
    }
  });

// Function to determine which treatments are due today
function filterDueTreatments(treatments, completions) {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday
  const dayOfMonth = today.getDate();

  return treatments.filter((treatment) => {
    // Check if treatment is already completed today
    const isCompleted = completions.some((c) => c.treatmentId === treatment.id);
    if (isCompleted) return false;

    // Daily treatments are always due
    if (treatment.frequency === "daily") return true;

    // Weekly treatments
    if (treatment.frequency === "weekly") {
      return true; // Show all weekly treatments
    }

    // Monthly treatments
    if (treatment.frequency === "monthly") {
      return true; // Show all monthly treatments
    }

    return false;
  });
}

// Helper functions
async function getTreatmentsForUser(userId) {
  const snapshot = await admin
    .firestore()
    .collection("treatments")
    .where("userId", "==", userId)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

async function getTodayCompletionsForUser(userId) {
  const today = new Date().toISOString().split("T")[0];

  const snapshot = await admin
    .firestore()
    .collection("completions")
    .where("userId", "==", userId)
    .where("date", "==", today)
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

// Updated sendReminderEmail function for Gmail
async function sendReminderEmail(email, dueTreatments) {
  const treatmentList = dueTreatments
    .map((t) => `<li>${t.name} (${t.frequency})</li>`)
    .join("");

  const mailOptions = {
    from: '"Health Tracker" <your-email@gmail.com>',
    to: email,
    subject: "Reminder: You have treatments due today",
    html: `
      <h1>Treatment Reminder</h1>
      <p>You have the following treatments due today:</p>
      <ul>${treatmentList}</ul>
      <p>Click <a href="https://holistic-health-tracker.web.app/dashboard">here</a> to mark them as complete.</p>
    `,
  };

  return transporter.sendMail(mailOptions);
}
