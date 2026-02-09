import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db, isFirebaseEnabled } from '../lib/firebase'

const COLLECTION = 'users'
const localUsers = new Map()

export async function upsertUserProfile(profile) {
  const payload = {
    uid: profile.uid,
    email: profile.email || '',
    name: profile.name || '',
    school: profile.school || '',
    subject: profile.subject || '',
    role: profile.role || 'teacher',
  }

  if (!isFirebaseEnabled()) {
    localUsers.set(payload.uid, payload)
    return payload
  }

  const ref = doc(db, COLLECTION, payload.uid)
  await setDoc(
    ref,
    {
      ...payload,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  )

  return payload
}

export async function getUserProfile(uid) {
  if (!isFirebaseEnabled()) {
    return localUsers.get(uid) || null
  }

  const ref = doc(db, COLLECTION, uid)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    return null
  }

  const data = snapshot.data()
  return {
    uid: snapshot.id,
    email: data.email || '',
    name: data.name || '',
    school: data.school || '',
    subject: data.subject || '',
    role: data.role || 'teacher',
  }
}

export async function listUsers() {
  if (!isFirebaseEnabled()) {
    return Array.from(localUsers.values())
  }

  const usersRef = collection(db, COLLECTION)
  const snapshot = await getDocs(usersRef)
  const rows = snapshot.docs.map((item) => {
    const data = item.data()
    return {
      uid: item.id,
      email: data.email || '',
      name: data.name || '',
      school: data.school || '',
      subject: data.subject || '',
      role: data.role || 'teacher',
    }
  })
  return rows.sort((a, b) => a.email.localeCompare(b.email))
}

export async function updateUserRole(uid, role) {
  if (!isFirebaseEnabled()) {
    const existing = localUsers.get(uid) || { uid, email: '', name: '' }
    const next = { ...existing, role }
    localUsers.set(uid, next)
    return next
  }

  const ref = doc(db, COLLECTION, uid)
  await updateDoc(ref, {
    role,
    updatedAt: serverTimestamp(),
  })

  return getUserProfile(uid)
}

export async function updateMyProfile(uid, profile) {
  const patch = {
    name: profile.name || '',
    school: profile.school || '',
    subject: profile.subject || '',
  }

  if (!isFirebaseEnabled()) {
    const existing = localUsers.get(uid) || { uid, email: '', role: 'teacher' }
    const next = { ...existing, ...patch }
    localUsers.set(uid, next)
    return next
  }

  const ref = doc(db, COLLECTION, uid)
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  })

  return getUserProfile(uid)
}
