const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const {VertexAI} = require("@google-cloud/vertexai");

admin.initializeApp();

exports.verifyAndRegisterConsumer = functions.https.onCall(
    async (data, context) => {
      if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "User must be logged in.",
        );
      }

      const consumerUid = context.auth.uid;
      const {
        manufacturerId,
        productId,
        serialNumber,
        modelNumber,
        secretKey,
      } = data;

      if (
        !manufacturerId ||
      !productId ||
      !serialNumber ||
      !modelNumber ||
      !secretKey
      ) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "Missing required fields.",
        );
      }

      try {
        console.log("Starting product registration for consumer:", consumerUid);

        const firestore = admin.firestore();
        const productRef = firestore
            .collection("manufacturers")
            .doc(manufacturerId)
            .collection("products")
            .doc(productId);

        const consumerRef = firestore
            .collection("consumers")
            .doc(consumerUid)
            .collection("scannedProducts")
            .doc(productId);

        await firestore.runTransaction(async (transaction) => {
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists) {
            throw new functions.https.HttpsError(
                "not-found",
                "Product not found.",
            );
          }

          const productData = productSnap.data();

          if (!productData) {
            throw new functions.https.HttpsError(
                "data-loss",
                "Product data is missing or corrupted.",
            );
          }

          if (productData.registeredBy) {
            throw new functions.https.HttpsError(
                "already-exists",
                "This product is already registered.",
            );
          }

          if (productData.secretKey !== secretKey) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Incorrect secret key.",
            );
          }

          transaction.set(consumerRef, {
            serialNumber,
            modelNumber,
            manufacturerId,
            productId,
            registeredAt: admin.firestore.FieldValue.serverTimestamp(),
          });

          transaction.update(productRef, {
            registeredBy: consumerUid,
            registeredUsers: admin.firestore.FieldValue.arrayUnion(consumerUid),
            userCount: admin.firestore.FieldValue.increment(1),
          });
        });

        console.log(
            "Product registered successfully for consumer:", consumerUid,
        );
        return {success: true, message: "Product registered successfully!"};
      } catch (error) {
        console.error("Error during product registration:", error);
        throw new functions.https.HttpsError(
            "internal",
            error.message || "An unknown error occurred.",
        );
      }
    },
);

exports.onProductDeletion = functions.firestore
    .document("consumers/{consumerUid}/scannedProducts/{productId}")
    .onDelete(async (snap, context) => {
      const {consumerUid, productId} = context.params;

      try {
        console.log(`Product ${productId} deleted by consumer ${consumerUid}`);

        const firestore = admin.firestore();
        const productData = snap.data();

        if (!productData || !productData.manufacturerId) {
          console.warn(
              `Missing or invalid product data for product ${productId}.`,
          );
          return;
        }

        const productRef = firestore
            .collection("manufacturers")
            .doc(productData.manufacturerId)
            .collection("products")
            .doc(productId);

        await firestore.runTransaction(async (transaction) => {
          const productSnap = await transaction.get(productRef);

          if (!productSnap.exists) {
            console.warn(
                `Product ${productId} not found in ` +
            "manufacturers collection.",
            );
            return;
          }

          const productData = productSnap.data();

          if (!productData) {
            console.warn(
                "Product data is missing or corrupted for product " +
            `${productId}.`,
            );
            return;
          }

          // Remove the consumer from the registeredUsers array,
          // decrement userCount, and update registered/registeredBy fields
          transaction.update(productRef, {
            registeredUsers: admin.firestore.FieldValue.arrayRemove(
                consumerUid),
            userCount: admin.firestore.FieldValue.increment(-1),
            registered: false,
            registeredBy: admin.firestore.FieldValue.delete(),
          });

          console.log(`Manufacturer database updated for product ${productId}`);
        });
      } catch (error) {
        console.error(
            "Error updating manufacturer database on product deletion:", error,
        );
      }
    });

{/* ChatBot functionality: Vertex AI */}
const vertexAI = new VertexAI({
  project: "uemp-aadde",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

exports.askGemini = functions.https.onCall(async (data, context) => {
  const userMessage = data.message;

  if (!userMessage) {
    throw new functions.https.HttpsError(
        "invalid-argument", "Message is required.",
    );
  }

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `You are a helpful assistant for the 
              Unified E-Waste Management Platform (UEMP). 
              Answer the user's question based on the
               platform's features.\n\nUser: ${userMessage}`,
            },
          ],
        },
      ],
    });

    const responseText =
          (result.response &&
           result.response.candidates &&
           result.response.candidates[0] &&
           result.response.candidates[0].content &&
           result.response.candidates[0].content.parts &&
           result.response.candidates[0].content.parts[0] &&
           result.response.candidates[0].content.parts[0].text) ||
           "No response.";
    return {response: responseText};
  } catch (error) {
    console.error("Gemini error:", error);
    throw new functions.https.HttpsError("internal",
        "Failed to get Gemini response.");
  }
});
