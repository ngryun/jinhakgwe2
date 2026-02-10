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
import { getUserProfile } from './userService'

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

export async function listApplicationsBySchedule(scheduleId) {
  let applications = []

  if (!isFirebaseEnabled()) {
    applications = localApplications.filter((item) => item.scheduleId === scheduleId)
  } else {
    const appsRef = collection(db, APPLICATIONS)
    const snapshot = await getDocs(query(appsRef, where('scheduleId', '==', scheduleId)))
    applications = snapshot.docs.map((row) => normalizeApplication(row.id, row.data()))
  }

  const withProfile = await Promise.all(
    applications.map(async (app) => {
      const profile = await getUserProfile(app.teacherUid)
      return {
        ...app,
        school: profile?.school || '',
        phone: profile?.phone || '',
        email: profile?.email || app.teacherEmail || '',
        name: profile?.name || app.teacherName || app.teacherEmail || app.teacherUid,
      }
    }),
  )

  return withProfile.sort((a, b) => {
    const toEpoch = (value) => {
      if (!value) return 0
      if (typeof value?.toDate === 'function') return value.toDate().getTime()
      if (typeof value === 'string' || value instanceof Date) {
        const parsed = new Date(value).getTime()
        return Number.isNaN(parsed) ? 0 : parsed
      }
      if (typeof value?.seconds === 'number') return value.seconds * 1000
      return 0
    }
    return toEpoch(b.createdAt) - toEpoch(a.createdAt)
  })
}

export async function applyToSchedule({ scheduleId, teacherUid, teacherEmail, teacherName }) {
  const applicationId = toApplicationId(scheduleId, teacherUid)

  if (!isFirebaseEnabled()) {
    if (localApplications.some((item) => item.id === applicationId)) {
      throw new Error('이미 지원한 일정입니다.')
    }

    const schedule = await getScheduleById(scheduleId)
    if (schedule) {
      const totalCapacity = Number(schedule.needed || 0) + Number(schedule.waitlist || 0)
      if (Number(schedule.applied || 0) >= totalCapacity) {
        throw new Error('이미 모집이 완료된 일정입니다.')
      }
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
    const waitlist = Number(schedule.waitlist || 0)
    const applied = Number(schedule.applied || 0)
    const totalCapacity = needed + waitlist

    if (applied >= totalCapacity) {
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
