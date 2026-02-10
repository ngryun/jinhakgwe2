export const mockSchedules = [
  { id: '1', school: '서울 한빛초등학교', date: '2026-02-16', time: '09:00-12:00', needed: 3, waitlist: 1, applied: 1, region: '서울 강남구' },
  { id: '2', school: '부산 해운대중학교', date: '2026-02-17', time: '13:00-17:00', needed: 2, waitlist: 1, applied: 2, region: '부산 해운대구' },
  { id: '3', school: '대전 둔산고등학교', date: '2026-02-18', time: '10:00-15:00', needed: 4, waitlist: 2, applied: 0, region: '대전 서구' },
  { id: '4', school: '인천 송도초등학교', date: '2026-02-19', time: '09:00-12:00', needed: 2, waitlist: 1, applied: 1, region: '인천 연수구' },
  { id: '5', school: '광주 첨단중학교', date: '2026-02-20', time: '14:00-18:00', needed: 3, waitlist: 2, applied: 3, region: '광주 광산구' },
]

export const mockStudents = {
  '1': [
    { id: 'st1', grade: '3', classNum: '2', number: '15', name: '김민준', gender: '남', notes: '' },
    { id: 'st2', grade: '3', classNum: '2', number: '8', name: '이서연', gender: '여', notes: '학습 상담 필요' },
    { id: 'st3', grade: '4', classNum: '1', number: '22', name: '박지호', gender: '남', notes: '교우관계' },
  ],
  '2': [
    { id: 'st4', grade: '2', classNum: '3', number: '11', name: '최수아', gender: '여', notes: '' },
    { id: 'st5', grade: '1', classNum: '5', number: '7', name: '정예준', gender: '남', notes: '진로 상담' },
  ],
}
