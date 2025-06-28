// Load environment variables from .env.local
if (process.env.VERCEL !== "1") {
  require("dotenv").config({ path: ".env.local" });
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const admin = require("firebase-admin");
const firebaseConfig = require("./firebase-config");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase Admin SDK
let db;
if (admin.apps.length === 0) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: firebaseConfig.projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin SDK:", error.message);
    console.error("Error details:", error);
    process.exit(1);
  }
}
db = admin.firestore();
console.log("✅ Firestore database initialized");

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("combined")); // HTTP request logger

// Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    console.log("API key validation failed: No X-API-Key header provided");
    return res.status(401).json({
      success: false,
      message: "API key is required. Please provide X-API-Key header.",
    });
  }

  console.log(`Validating API key: ${apiKey.substring(0, 8)}...`);

  try {
    console.log(
      "No user found with direct queries, checking subcollections..."
    );
    try {
      // Verify we're connected to the right project
      console.log(
        "🔍 Connected to Firebase project:",
        firebaseConfig.projectId
      );
      console.log("🔍 Collection path:", await db.listCollections());

      // Use listDocuments() instead of get() to get all user document references
      const userRefs = await db.collection("users").listDocuments();
      console.log(
        `🔍 Found ${userRefs.length} users in database using listDocuments()`
      );

      // Log details about each user found
      userRefs.forEach((ref, index) => {
        console.log(`  User ${index + 1}: ID=${ref.id}`);
      });

      // Try to get more users with different approaches
      console.log("🔍 Trying alternative approaches to get all users...");

      // Approach 1: Try with a limit
      try {
        const limitedSnapshot = await db.collection("users").limit(20).get();
        console.log(
          `🔍 With limit(20): Found ${limitedSnapshot.docs.length} users`
        );
      } catch (error) {
        console.log("❌ Error with limit query:", error.message);
      }

      // Approach 2: Try with orderBy
      try {
        const orderedSnapshot = await db
          .collection("users")
          .orderBy("__name__")
          .get();
        console.log(
          `🔍 With orderBy: Found ${orderedSnapshot.docs.length} users`
        );
      } catch (error) {
        console.log("❌ Error with orderBy query:", error.message);
      }

      // Approach 3: Check if we can access the first user's data
      if (userRefs.length > 0) {
        const firstUserRef = userRefs[0];
        try {
          const firstUserDoc = await firstUserRef.get();
          const userData = firstUserDoc.data();
          console.log("🔍 First user data keys:", Object.keys(userData || {}));
          console.log(
            "🔍 First user data preview:",
            JSON.stringify(userData, null, 2).substring(0, 200) + "..."
          );
        } catch (error) {
          console.log("❌ Error accessing first user data:", error.message);
        }
      }

      // Approach 4: Try to get users one by one to see if there's a pagination issue
      console.log("🔍 Checking if there are more users with pagination...");
      try {
        let allUsers = [];
        let lastDoc = null;
        let batchCount = 0;

        do {
          let query = db.collection("users");
          if (lastDoc) {
            query = query.startAfter(lastDoc);
          }
          query = query.limit(10);

          const batch = await query.get();
          console.log(
            `🔍 Batch ${batchCount + 1}: Found ${batch.docs.length} users`
          );

          if (batch.docs.length > 0) {
            allUsers = allUsers.concat(batch.docs);
            lastDoc = batch.docs[batch.docs.length - 1];
            batchCount++;
          } else {
            break;
          }
        } while (batch.docs.length === 10);

        console.log(`🔍 Total users found with pagination: ${allUsers.length}`);
      } catch (error) {
        console.log("❌ Error with pagination approach:", error.message);
      }

      // Check each user's profile subcollection using listDocuments approach
      for (const userRef of userRefs) {
        const userId = userRef.id;
        console.log(`🔍 Checking user: ${userId}`);

        // Check profile subcollection
        const profileRef = userRef.collection("profile");
        const profileSnapshot = await profileRef.get();
        console.log(
          `🔍 User ${userId} has ${profileSnapshot.docs.length} profile documents`
        );

        for (const profileDoc of profileSnapshot.docs) {
          const profileData = profileDoc.data();
          const foundApiKey = profileData.apiKey;
          console.log(
            `Checking user ${userId}, profile ${profileDoc.id}:`,
            foundApiKey ? `${foundApiKey.substring(0, 8)}...` : "null"
          );
          console.log(
            `  Comparing: Request API key "${apiKey.substring(
              0,
              8
            )}..." vs Found API key "${
              foundApiKey ? foundApiKey.substring(0, 8) + "..." : "null"
            }"`
          );

          if (foundApiKey === apiKey) {
            userDoc = await userRef.get();
            foundPath = `users/${userId}/profile/${profileDoc.id}.apiKey`;
            console.log(
              `✅ Found user ${userId} with API key in subcollection`
            );
            break;
          }
        }

        if (userDoc) break;
      }
    } catch (error) {
      console.log("❌ Error checking subcollections:", error.message);
      console.log("Error details:", error);
    }

    if (!userDoc) {
      console.log(
        `❌ No user found with API key: ${apiKey.substring(0, 8)}...`
      );
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    // Get the user document
    req.userId = userDoc.id;
    req.userData = userDoc.data();
    console.log(`✅ API key validation successful for user: ${userDoc.id}`);

    next();
  } catch (error) {
    console.error("❌ Error validating API key:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating API key",
    });
  }
};

// POST endpoint for transactions with API key validation
app.post("/api/transactions", validateApiKey, async (req, res) => {
  console.log("=== POST /api/transactions received ===");

  // Handle both formats: direct array or { transactions: [...] }
  let transactions;
  if (Array.isArray(req.body)) {
    // Direct array format
    transactions = req.body;
  } else if (req.body.transactions && Array.isArray(req.body.transactions)) {
    // Object with transactions property
    transactions = req.body.transactions;
  } else {
    return res.status(400).json({
      success: false,
      message:
        "transactions must be an array or an object with transactions property",
    });
  }

  const userId = req.userId;

  // Validate required fields
  if (!transactions || transactions.length === 0) {
    return res.status(400).json({
      success: false,
      message: "transactions array cannot be empty",
    });
  }

  try {
    // Log the received data
    console.log("Timestamp:", new Date().toISOString());
    console.log("UserId:", userId);
    console.log("Number of transactions:", transactions.length);

    let savedCount = 0;
    let skippedCount = 0;
    const savedTransactions = [];
    const skippedTransactions = [];

    // Process each transaction
    for (const transaction of transactions) {
      try {
        // Check if transaction already exists
        const transactionRef = db
          .collection("users")
          .doc(userId)
          .collection("expenses")
          .doc(transaction.id);
        const transactionDoc = await transactionRef.get();

        if (transactionDoc.exists) {
          console.log(`  Skipping existing transaction: ${transaction.id}`);
          skippedCount++;
          skippedTransactions.push(transaction.id);
          continue;
        }

        // Convert bank transaction to expense format
        const expense = {
          id: transaction.id,
          date: transaction.date,
          category: "", // Empty category for manual categorization
          amount: parseFloat(transaction.amount.replace(/[^\d.-]/g, "")), // Extract numeric value
          note: transaction.description,
          currency: transaction.currency,
          entryType: transaction.entryType,
          status: transaction.status,
          importedAt: new Date().toISOString(),
          source: "bank_import",
        };

        // Save to Firebase
        await transactionRef.set(expense);

        console.log(
          `  Saved transaction: ${transaction.id} - ${transaction.description}`
        );
        savedCount++;
        savedTransactions.push(transaction.id);
      } catch (error) {
        console.error(
          `  Error processing transaction ${transaction.id}:`,
          error
        );
      }
    }

    console.log("Summary:");
    console.log(`  Saved: ${savedCount} transactions`);
    console.log(`  Skipped: ${skippedCount} transactions (already exist)`);
    console.log("================================");

    res.status(200).json({
      success: true,
      message: "Transactions processed successfully",
      receivedAt: new Date().toISOString(),
      processedData: {
        userId,
        totalReceived: transactions.length,
        savedCount,
        skippedCount,
        savedTransactions,
        skippedTransactions,
      },
    });
  } catch (error) {
    console.error("Error processing transactions:", error);
    res.status(500).json({
      success: false,
      message: "Error processing transactions",
      error: error.message,
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Spend Wise Express.js Server",
    endpoints: {
      "POST /api/transactions":
        "Import transactions (requires X-API-Key header)",
      "GET /api/health": "Health check endpoint",
    },
  });
});

// Only start the server if we're not in a serverless environment
if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
  app.listen(PORT, () => {
    console.log(`🚀 Express.js server running on port ${PORT}`);
    console.log(
      `💳 Transactions endpoint at: http://localhost:${PORT}/api/transactions`
    );
    console.log(`🏥 Health check at: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
