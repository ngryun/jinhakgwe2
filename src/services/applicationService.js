import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db, isFirebaseEnabled } from '../lib/firebase'
import { getScheduleById } from './scheduleService'

const SCHEDULES = 'schedules'
const APPLICATIONS = 'applications'
let localApplications = []

function toApplicationId(scheduleId, teacherUid) {
  return `${scheduleId}_${teacherUid}`
}

function normalizeApplication(id, data) {
  return {
    id,
    scheduleId: data.scheduleId,
    teacherUid: data.teacherUid,
    teacherEmail: data.teacherEmail || '',
    teacherName: data.teacherName || '',
    status: data.status || 'applied',
    createdAt: data.createdAt || null,
  }
}

export async function listApplicationsByTeacher(teacherUid) {
  if (!isFirebaseEnabled()) {
    return localApplications.filter((item) => item.teacherUid === teacherUid)
  }

  const appsRef = collection(db, APPLICATIONS)
  const snapshot = await getDocs(query(appsRef, where('teacherUid', '==', teacherUid)))
  return snapshot.docs.map((row) => normalizeApplication(row.id, row.data()))
}

export async function listAppliedSchedulesByTeacher(teacherUid) {
  const applications = await listApplicationsByTeacher(teacherUid)
  const schedules = await Promise.all(applications.map((app) => getScheduleById(app.scheduleId)))

  return applications
    .map((app, index) => ({ ...app, schedule: schedules[index] }))
    .filter((item) => !!item.schedule)
}

export async function applyToSchedule({ scheduleId, teacherUid, teacherEmail, teacherName }) {
  const applicationId = toApplicationId(scheduleId, teacherUid)

  if (!isFirebaseEnabled()) {
    if (localApplications.some((item) => item.id === applicationId)) {
      throw new Error('이미 지원한 일정입니다.')
    }

    localApplications = [
      ...localApplications,
      {
        id: applicationId,
        scheduleId,
        teacherUid,
        teacherEmail: teacherEmail || '',
        teacherName: teacherName || '',
        status: 'applied',
        createdAt: new Date().toISOString(),
      },
    ]
    return
  }

  const scheduleRef = doc(db, SCHEDULES, scheduleId)
  const appRef = doc(db, APPLICATIONS, applicationId)

  await runTransaction(db, async (tx) => {
    const scheduleSnap = await tx.get(scheduleRef)
    if (!scheduleSnap.exists()) {
      throw new Error('일정을 찾을 수 없습니다.')
    }

    const appSnap = await tx.get(appRef)
    if (appSnap.exists()) {
      throw new Error('이미 지원한 일정입니다.')
    }

    const schedule = scheduleSnap.data()
    const needed = Number(schedule.needed || 0)
    const applied = Number(schedule.applied || 0)

    if (applied >= needed) {
      throw new Error('이미 모집이 완료된 일정입니다.')
    }

    tx.set(appRef, {
      scheduleId,
      teacherUid,
      teacherEmail: teacherEmail || '',
      teacherName: teacherName || '',
      status: 'applied',
      createdAt: serverTimestamp(),
    })

    tx.update(scheduleRef, {
      applied: applied + 1,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function cancelApplication({ scheduleId, teacherUid }) {
  const applicationId = toApplicationId(scheduleId, teacherUid)

  if (!isFirebaseEnabled()) {
    localApplications = localApplications.filter((item) => item.id !== applicationId)
    return
  }

  const scheduleRef = doc(db, SCHEDULES, scheduleId)
  const appRef = doc(db, APPLICATIONS, applicationId)

  await runTransaction(db, async (tx) => {
    const scheduleSnap = await tx.get(scheduleRef)
    const appSnap = await tx.get(appRef)

    if (!scheduleSnap.exists() || !appSnap.exists()) {
      return
    }

    const schedule = scheduleSnap.data()
    const applied = Number(schedule.applied || 0)

    tx.delete(appRef)
    tx.update(scheduleRef, {
      applied: Math.max(0, applied - 1),
      updatedAt: serverTimestamp(),
    })
  })
}
