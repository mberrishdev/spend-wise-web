// Load environment variables from .env.local
if (process.env.VERCEL !== "1") {
  require("dotenv").config({ path: ".env.local" });
}

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
} = require("firebase/firestore");
const firebaseConfig = require("./firebase-config");

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("combined")); // HTTP request logger

// Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: "API key is required. Please provide X-API-Key header.",
    });
  }

  try {
    // Find user by API key - try multiple possible paths
    const usersRef = collection(db, "users");

    // Try different possible paths for the API key
    const queries = [
      query(usersRef, where("profile.main.apiKey", "==", apiKey)),
      query(usersRef, where("profile.apiKey", "==", apiKey)),
      query(usersRef, where("apiKey", "==", apiKey)),
    ];

    let userDoc = null;

    for (let i = 0; i < queries.length; i++) {
      try {
        const querySnapshot = await getDocs(queries[i]);

        if (!querySnapshot.empty) {
          userDoc = querySnapshot.docs[0];
          break;
        }
      } catch (queryError) {
        console.log(`Query ${i + 1} failed:`, queryError.message);
      }
    }

    // If no user found with direct queries, try checking subcollections
    if (!userDoc) {
      try {
        const allUsersSnapshot = await getDocs(usersRef);

        // Check each user's profile subcollection
        for (const userDocSnapshot of allUsersSnapshot.docs) {
          const userId = userDocSnapshot.id;

          // Check profile subcollection
          const profileRef = collection(db, "users", userId, "profile");
          const profileSnapshot = await getDocs(profileRef);

          profileSnapshot.forEach((profileDoc) => {
            const profileData = profileDoc.data();

            if (profileData.apiKey === apiKey) {
              userDoc = userDocSnapshot;
            }
          });

          if (userDoc) break;
        }
      } catch (error) {
        console.log("Error checking subcollections:", error.message);
      }
    }

    if (!userDoc) {
      return res.status(401).json({
        success: false,
        message: "Invalid API key",
      });
    }

    // Get the user document
    req.userId = userDoc.id;
    req.userData = userDoc.data();

    next();
  } catch (error) {
    console.error("Error validating API key:", error);
    return res.status(500).json({
      success: false,
      message: "Error validating API key",
    });
  }
};

// POST endpoint that logs something
app.post("/api/log", (req, res) => {
  const { message, data, timestamp } = req.body;

  // Log the received data
  console.log("=== POST /api/log received ===");
  console.log("Timestamp:", timestamp || new Date().toISOString());
  console.log("Message:", message);
  console.log("Data:", data);
  console.log("Request body:", req.body);
  console.log("================================");

  // You can also log to a file or database here
  // For example, you could write to a log file:
  // fs.appendFileSync('server.log', `${new Date().toISOString()} - ${JSON.stringify(req.body)}\n`);

  res.status(200).json({
    success: true,
    message: "Data logged successfully",
    receivedAt: new Date().toISOString(),
    loggedData: {
      message,
      data,
      timestamp: timestamp || new Date().toISOString(),
    },
  });
});

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
        const transactionRef = doc(
          db,
          "users",
          userId,
          "expenses",
          transaction.id
        );
        const transactionDoc = await getDoc(transactionRef);

        if (transactionDoc.exists()) {
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
        await setDoc(transactionRef, expense);

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
      "POST /api/log": "Log data to server console",
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
      `📝 POST endpoint available at: http://localhost:${PORT}/api/log`
    );
    console.log(
      `💳 Transactions endpoint at: http://localhost:${PORT}/api/transactions`
    );
    console.log(`🏥 Health check at: http://localhost:${PORT}/api/health`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
