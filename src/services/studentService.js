import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getCountFromServer,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { db, isFirebaseEnabled } from '../lib/firebase'
import { mockStudents } from './mockData'

/* ── In-memory store (demo mode) ── */

const localStore = new Map(
  Object.entries(mockStudents).map(([k, v]) => [k, v.map((s) => ({ ...s }))])
)

function getLocalList(scheduleId) {
  if (!localStore.has(scheduleId)) localStore.set(scheduleId, [])
  return localStore.get(scheduleId)
}

/* ── Normalize ── */

function normalizeStudent(id, data, scheduleId) {
  return {
    id,
    scheduleId,
    grade: String(data.grade ?? ''),
    classNum: String(data.classNum ?? ''),
    number: String(data.number ?? ''),
    name: data.name || '',
    gender: data.gender || '',
    notes: data.notes || '',
    createdAt: data.createdAt || null,
  }
}

/* ── Count ── */

export async function getStudentCountsBySchedules(scheduleIds) {
  const counts = {}

  if (!isFirebaseEnabled()) {
    for (const id of scheduleIds) {
      counts[id] = getLocalList(id).length
    }
    return counts
  }

  await Promise.all(
    scheduleIds.map(async (id) => {
      try {
        const studentsRef = collection(db, 'schedules', id, 'students')
        const snapshot = await getCountFromServer(query(studentsRef))
        counts[id] = snapshot.data().count
      } catch {
        counts[id] = 0
      }
    }),
  )
  return counts
}

/* ── CRUD ── */

export async function listStudentsBySchedule(scheduleId) {
  if (!isFirebaseEnabled()) {
    return [...getLocalList(scheduleId)]
  }

  const studentsRef = collection(db, 'schedules', scheduleId, 'students')
  const snapshot = await getDocs(query(studentsRef, orderBy('createdAt', 'asc')))
  return snapshot.docs.map((row) =>
    normalizeStudent(row.id, row.data(), scheduleId),
  )
}

export async function addStudent(scheduleId, payload) {
  const data = {
    grade: String(payload.grade ?? ''),
    classNum: String(payload.classNum ?? ''),
    number: String(payload.number ?? ''),
    name: payload.name || '',
    gender: payload.gender || '',
    notes: payload.notes || '',
  }

  if (!isFirebaseEnabled()) {
    const id = String(Date.now())
    const student = normalizeStudent(id, data, scheduleId)
    student.createdAt = new Date().toISOString()
    getLocalList(scheduleId).push(student)
    return student
  }

  const studentsRef = collection(db, 'schedules', scheduleId, 'students')
  const created = await addDoc(studentsRef, {
    ...data,
    createdAt: serverTimestamp(),
  })
  return normalizeStudent(created.id, data, scheduleId)
}

export async function addStudentsBatch(scheduleId, students) {
  if (!isFirebaseEnabled()) {
    const list = getLocalList(scheduleId)
    return students.map((s, i) => {
      const id = String(Date.now() + i)
      const student = normalizeStudent(id, s, scheduleId)
      student.createdAt = new Date().toISOString()
      list.push(student)
      return student
    })
  }

  // Firestore writeBatch supports max 500 operations
  const BATCH_SIZE = 500
  const results = []

  for (let i = 0; i < students.length; i += BATCH_SIZE) {
    const chunk = students.slice(i, i + BATCH_SIZE)
    const batch = writeBatch(db)
    const studentsRef = collection(db, 'schedules', scheduleId, 'students')

    for (const s of chunk) {
      const newRef = doc(studentsRef)
      batch.set(newRef, {
        grade: String(s.grade ?? ''),
        classNum: String(s.classNum ?? ''),
        number: String(s.number ?? ''),
        name: s.name || '',
        gender: s.gender || '',
        notes: s.notes || '',
        createdAt: serverTimestamp(),
      })
      results.push(normalizeStudent(newRef.id, s, scheduleId))
    }

    await batch.commit()
  }

  return results
}

export async function deleteStudent(scheduleId, studentId) {
  if (!isFirebaseEnabled()) {
    const list = getLocalList(scheduleId)
    const idx = list.findIndex((s) => s.id === studentId)
    if (idx !== -1) list.splice(idx, 1)
    return
  }

  await deleteDoc(doc(db, 'schedules', scheduleId, 'students', studentId))
}

export async function deleteAllStudents(scheduleId) {
  if (!isFirebaseEnabled()) {
    localStore.set(scheduleId, [])
    return
  }

  const studentsRef = collection(db, 'schedules', scheduleId, 'students')
  const snapshot = await getDocs(studentsRef)
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}

/* ── Excel 유틸리티 ── */

const HEADERS = ['학년', '반', '번호', '이름', '성별', '참고사항']
const HEADER_MAP = {
  '학년': 'grade',
  '반': 'classNum',
  '번호': 'number',
  '이름': 'name',
  '성별': 'gender',
  '참고사항': 'notes',
}

export function downloadStudentTemplate() {
  const exampleRow = ['3', '2', '15', '홍길동', '남', '']
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, exampleRow])
  ws['!cols'] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 8 },
    { wch: 20 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '학생목록')
  XLSX.writeFile(wb, '상담학생_양식.xlsx')
}

export function parseStudentExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })

        const students = rows
          .map((row) => {
            const mapped = {}
            for (const [korKey, engKey] of Object.entries(HEADER_MAP)) {
              mapped[engKey] = String(row[korKey] ?? '').trim()
            }
            return mapped
          })
          .filter((s) => s.name)

        resolve(students)
      } catch {
        reject(new Error('엑셀 파일을 읽는 데 실패했습니다.'))
      }
    }
    reader.onerror = () => reject(new Error('파일을 읽는 데 실패했습니다.'))
    reader.readAsArrayBuffer(file)
  })
}

export function exportStudentsToExcel(students, scheduleName) {
  const data = students.map((s) => [
    s.grade,
    s.classNum,
    s.number,
    s.name,
    s.gender,
    s.notes,
  ])
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...data])
  ws['!cols'] = [
    { wch: 8 },
    { wch: 8 },
    { wch: 8 },
    { wch: 12 },
    { wch: 8 },
    { wch: 20 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '학생목록')
  XLSX.writeFile(wb, `${scheduleName || '상담학생'}_목록.xlsx`)
}

export function resetStudentStore() {
  localStore.clear()
  for (const [k, v] of Object.entries(mockStudents)) {
    localStore.set(k, v.map((s) => ({ ...s })))
  }
}
