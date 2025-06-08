const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const { VertexAI } = require("@google-cloud/vertexai");

admin.initializeApp();
const firestore = admin.firestore();
const { v4: uuidv4 } = require("uuid");
const region = "asia-east2";

const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(functions.config().sendgrid.key);

exports.adminCreateUser = functions.region(region).https.onCall(async (data, context) => {
  if (context.auth?.token?.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied",
      "Only admins can create users.");
  }

  const { email, role, name } = data;
  if (!email || !role) {
    throw new functions.https.HttpsError("invalid-argument",
      "Missing email or role.");
  }

  // Get admin's orgID from Firestore
  const adminUserDoc = await firestore.collection("users").
    doc(context.auth.uid).get();
  if (!adminUserDoc.exists) {
    throw new functions.https.HttpsError("permission-denied",
      "Admin user data not found.");
  }
  const orgID = adminUserDoc.data().orgID;

  try {
    const tempPassword = Math.random().toString(36).slice(-10);

    const userRecord = await admin.auth().createUser({
      email,
      password: tempPassword,
      emailVerified: false,
    });

    // Set role and orgID in custom claims
    await admin.auth().setCustomUserClaims(userRecord.uid, { role, orgID });

    const orgDoc = await firestore.collection("organizations").doc(orgID).get();
    const organization = orgDoc.exists && orgDoc.data().name ? orgDoc.data().
      name : "your organization";

    // Store user profile in Firestore with orgID
    await firestore.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name,
      role,
      orgID,
      organization,
      userType: "Manufacturer",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await firestore.collection("organizations").doc(orgID).update({
      employeeIds: admin.firestore.FieldValue.arrayUnion(userRecord.uid),
    });

    // Send invite email with SendGrid

    const msg = {
      to: email,
      from: "genesislive@proton.me",
      subject: `You're invited to join ${organization} on UEMP`,
      text: `Hello,

You've been invited to join ${organization} on UEMP as an employee.

Login Email: ${email}
Temporary Password: ${tempPassword}

Please log in at https://unified-e-waste-management-platform.vercel.app/login 
and change your password after logging in.

If you did not expect this invitation, you can ignore this email.

Best regards,
${organization} Team
`,
      html: `
  <div style="font-family: Arial, sans-serif; 
  background: #f9f9f9; padding: 32px;">
    <div style="max-width: 480px; margin: auto; 
    background: #fff; border-radius: 12px; box-shadow: 0 2px 8px #e0e0e0; 
    padding: 32px;">
      <h2 style="color: #16a34a; margin-bottom: 16px;">
      Welcome to ${organization} on UEMP!</h2>
      <p style="font-size: 16px; color: #222;">
        Hello,<br><br>
        You've been invited to join 
        <b>${organization}</b> on UEMP as an employee.<br><br>
        <b>Login Email:</b> ${email}<br>
        <b>Temporary Password:</b> 
        <span style="font-family: monospace; 
        background: #f3f3f3; padding: 2px 6px; border-radius: 4px;">
        ${tempPassword}</span>
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://unified-e-waste-management-platform.vercel.app/login"
           style="background: #16a34a; color: #fff; 
           text-decoration: none; padding: 14px 32px; 
           border-radius: 6px; font-size: 18px; font-weight: 
           bold; display: inline-block;">
          Log In to UEMP
        </a>
      </div>
      <p style="font-size: 15px; color: #555;">
        Please log in and change your password after logging in.<br><br>
        If you did not expect this invitation, 
        you can ignore this email.<br><br>
        Best regards,<br>
        <b>${organization} Team</b>
      </p>
    </div>
  </div>
  `,
    };

    await sgMail.send(msg);

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    throw new functions.https.HttpsError("internal", error.message);
  }
});

exports.setUserOrgAdmin = functions.region(region).https.onCall(async (data, context) => {
  // Only allow the user to set their own admin claim at signup
  if (!context.auth || context.auth.uid !== data.uid) {
    throw new functions.https.HttpsError("permission-denied", "Not allowed.");
  }

  const { orgID } = data;
  if (!orgID) {
    throw new functions.https.HttpsError("invalid-argument", "Missing orgID.");
  }

  // Set custom claims: admin for this org
  await admin.auth().setCustomUserClaims(context.auth.uid, {
    role: "admin",
    orgID,
  });

  return { success: true };
});

{/* Assign user roles*/ }
exports.setUserRole = functions.region(region).https.onCall(async (data, context) => {
  // Only allow admins to call this
  if (context.auth.token.role !== "admin") {
    throw new functions.https.HttpsError("permission-denied",
      "Only admins can assign roles.");
  }

  const { uid, role } = data;

  await admin.auth().setCustomUserClaims(uid, { role });
  await admin.firestore().collection("users").doc(uid).update({ role });

  return { message: `Role ${role} assigned to user ${uid}` };
});

{/* Product Registration Function */ }
exports.verifyAndRegisterConsumer = functions.region(region).https.onCall(
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
        .collection(productId)
        .doc(serialNumber);

      const consumerRef = firestore
        .collection("consumers")
        .doc(consumerUid)
        .collection("scannedProducts")
        .doc(serialNumber);

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
          registered: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      return { success: true, message: "Product registered successfully!" };
    } catch (error) {
      throw new functions.https.HttpsError(
        "internal",
        error.message || "An unknown error occurred.",
      );
    }
  },
);

{/* Product Deletion Handler */ }
exports.onProductDeletion = functions.region(region).firestore
  .document("consumers/{consumerUid}/scannedProducts/{productId}")
  .onDelete(async (snap, context) => {
    const { consumerUid, productId } = context.params;

    try {

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
        .collection(productData.productId)
        .doc(productData.serialNumber);

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

        const currentUserCount = typeof productData.userCount === "number" ?
          productData.userCount : 0;
        transaction.update(productRef, {
          registeredUsers: admin.firestore.FieldValue.arrayRemove(
            consumerUid),
          userCount: currentUserCount > 0 ?
            admin.firestore.FieldValue.increment(-1) :
            0,
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

{/* Query Handling function*/ }
exports.sendRecyclerRequest = functions.region(region).https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be logged in.",
    );
  }

  const consumerId = context.auth.uid;
  const {
    recyclerId,
    serialNumber,
    productId,
    details,
    productName,
  } = data;

  if (
    !recyclerId ||
    !serialNumber ||
    !productId ||
    !details?.name ||
    !details?.phone ||
    !details?.address ||
    !productName
  ) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required fields.",
    );
  }

  try {
    const recyclerDocRef = firestore.collection("Queries").doc(recyclerId);
    const recyclerDocSnap = await recyclerDocRef.get();
    const existingData = recyclerDocSnap.exists ? recyclerDocSnap.data() : {};
    const queries = existingData.queries || {};

    // Check if request already exists for this product by this user
    const alreadySent = Object.values(queries).some(
      (query) =>
        query.serialNumber === serialNumber && query.consumerId === consumerId,
    );

    if (alreadySent) {
      throw new functions.https.HttpsError(
        "already-exists",
        "You’ve already sent a request for this product.",
      );
    }

    const queryId = uuidv4();

    const newQuery = {
      serialNumber,
      productId,
      productName,
      status: "pending",
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      consumerId,
      consumerName: details.name,
      consumerPhone: details.phone,
      consumerAddress: details.address,
    };

    const updatedQueries = {
      ...queries,
      [queryId]: newQuery,
    };

    await recyclerDocRef.set({ queries: updatedQueries }, { merge: true });

    const consumerProductRef = firestore
      .collection("consumers")
      .doc(consumerId)
      .collection("scannedProducts")
      .doc(serialNumber);

    await consumerProductRef.set(
      {
        recyclingRequest: {
          recyclerId,
          queryId,
          status: "pending",
          serialNumber,
          productId,
          productName,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
        },
      },
      { merge: true }
    );

    return { success: true, message: "Request sent successfully" };
  } catch (error) {
    throw new functions.https.HttpsError(
      "internal",
      error.message || "Failed to send request.",
    );
  }
});

{/* Vertex AI Chatbot */ }
const vertexAI = new VertexAI({
  project: "uemp-aadde",
  location: "europe-central2",
});

const model = vertexAI.getGenerativeModel({
  model: "gemini-2.0-flash-001",
});

exports.askGemini = functions.region(region).https.onCall(async (data) => {
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

    const prompt = `
You are an expert assistant for the Unified E-Waste Management Platform (UEMP).
Answer the user's question below as clearly and directly as possible, using the information provided if relevant, but do not mention "context" or "provided context" in your answer.

${combinedContext}

User Question: ${userMessage}

Answer:
`;

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    });

    const responseText =
      result.response?.candidates?.[0]?.
        content?.parts?.[0]?.text || "No response.";
    return { response: responseText };
  } catch (error) {
    throw new functions.https.
      HttpsError("internal", `Gemini Error: ${error.message}`);
  }
});