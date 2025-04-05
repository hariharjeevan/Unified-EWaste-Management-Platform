const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const {VertexAI} = require("@google-cloud/vertexai");

admin.initializeApp();
const firestore = admin.firestore();

{/* Product Registration Function */}
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
          const [productSnap, consumerSnap] = await Promise.all([
            transaction.get(productRef),
            transaction.get(consumerRef),
          ]);

          if (!productSnap.exists) {
            throw new functions.https.HttpsError(
                "not-found",
                "Product not found.",
            );
          }

          if (consumerSnap.exists) {
            throw new functions.https.HttpsError(
                "already-exists",
                "Product already scanned by this user.",
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

{/* Product Deletion Handler */}
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

{/* Vertex AI Chatbot */}
const vertexAI = new VertexAI({
  project: "uemp-aadde",
  location: "us-central1",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

exports.askGemini = functions.https.onCall(async (data, context) => {
  const userMessage = (data.message || "").trim();

  if (!userMessage) {
    throw new functions.https.HttpsError(
        "invalid-argument",
        "Message is required.",
    );
  }

  try {
    const fetchAllFields = async (docPath) => {
      const docSnap = await firestore.doc(docPath).get();
      if (!docSnap.exists) return "";
      const fields = docSnap.data();
      return Object.keys(fields)
          .sort((a, b) => Number(a) - Number(b))
          .map((key) => fields[key])
          .join("\n\n");
    };

    const context1 = await
    fetchAllFields("chatbotKnowledge/overview/intro/intro");
    const context2 = await
    fetchAllFields("chatbotKnowledge/qr_code_use/qrcodeuse/qruse");

    const combinedContext = `${context1}\n\n${context2}`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `[CONTEXT START]\n${combinedContext}\n
              [CONTEXT END]\n\n[USER QUESTION]\n${userMessage}\n\n[ANSWER]`,
            },
          ],
        },
      ],
    });

    const responseText =
      result.response?.candidates?.[0]?.
          content?.parts?.[0]?.text || "No response.";
    return {response: responseText};
  } catch (error) {
    console.error("Gemini error (detailed):", error);
    throw new functions.https.
        HttpsError("internal", `Gemini Error: ${error.message}`);
  }
});
