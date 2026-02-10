import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, isFirebaseEnabled } from '../lib/firebase'
import { mockSchedules } from './mockData'

const COLLECTION_NAME = 'schedules'
let scheduleStore = [...mockSchedules]

function normalizeSchedule(id, data) {
  return {
    id,
    school: data.school || '',
    region: data.region || '',
    date: data.date || '',
    time: data.time || '',
    needed: Number(data.needed || 0),
    waitlist: Number(data.waitlist || 0),
    applied: Number(data.applied || 0),
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  }
}

export async function listSchedules() {
  if (!isFirebaseEnabled()) {
    return [...scheduleStore]
  }

  const schedulesRef = collection(db, COLLECTION_NAME)
  const snapshot = await getDocs(query(schedulesRef, orderBy('date', 'asc')))
  return snapshot.docs.map((row) => normalizeSchedule(row.id, row.data()))
}

export async function getScheduleById(scheduleId) {
  if (!isFirebaseEnabled()) {
    return scheduleStore.find((item) => item.id === scheduleId) || null
  }

  const ref = doc(db, COLLECTION_NAME, scheduleId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) {
    return null
  }
  return normalizeSchedule(snapshot.id, snapshot.data())
}

export async function createSchedule(payload) {
  const data = {
    school: payload.school,
    region: payload.region || '',
    date: payload.date,
    time: payload.time,
    needed: Number(payload.needed || 0),
    waitlist: Number(payload.waitlist || 0),
    applied: 0,
  }

  if (!isFirebaseEnabled()) {
    const next = {
      id: String(Date.now()),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    scheduleStore = [...scheduleStore, next]
    return next
  }

  const schedulesRef = collection(db, COLLECTION_NAME)
  const created = await addDoc(schedulesRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: created.id,
    ...data,
    createdAt: null,
    updatedAt: null,
  }
}

export async function updateSchedule(scheduleId, payload) {
  if (!isFirebaseEnabled()) {
    scheduleStore = scheduleStore.map((item) => {
      if (item.id !== scheduleId) return item
      return {
        ...item,
        ...payload,
        needed: payload.needed != null ? Number(payload.needed) : item.needed,
        waitlist: payload.waitlist != null ? Number(payload.waitlist) : item.waitlist,
        updatedAt: new Date().toISOString(),
      }
    })
    return scheduleStore.find((item) => item.id === scheduleId) || null
  }

  const ref = doc(db, COLLECTION_NAME, scheduleId)
  await updateDoc(ref, {
    ...payload,
    ...(payload.needed != null ? { needed: Number(payload.needed) } : {}),
    ...(payload.waitlist != null ? { waitlist: Number(payload.waitlist) } : {}),
    updatedAt: serverTimestamp(),
  })

  return getScheduleById(scheduleId)
}

export async function deleteSchedule(scheduleId) {
  if (!isFirebaseEnabled()) {
    scheduleStore = scheduleStore.filter((item) => item.id !== scheduleId)
    return
  }

  await deleteDoc(doc(db, COLLECTION_NAME, scheduleId))
}

export async function resetScheduleStore() {
  scheduleStore = [...mockSchedules]
  return [...scheduleStore]
}
