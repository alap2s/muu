import admin from 'firebase-admin'

let app: admin.app.App | null = null

export function getAdminApp(): admin.app.App {
  if (app) return app
  if (admin.apps.length > 0) {
    app = admin.apps[0]!
    return app
  }

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  let privateKey = process.env.FIREBASE_PRIVATE_KEY
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials env vars')
  }
  // Handle escaped newlines for env files
  if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n')

  app = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
  return app
}

export function getAdminDb(): admin.firestore.Firestore {
  return getAdminApp().firestore()
}

export async function verifyIdToken(idToken?: string): Promise<admin.auth.DecodedIdToken | null> {
  if (!idToken) return null
  try {
    const auth = getAdminApp().auth()
    return await auth.verifyIdToken(idToken)
  } catch {
    return null
  }
}


