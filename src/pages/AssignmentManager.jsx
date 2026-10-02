import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../supabaseClient'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { generateBlockPatterns } from '../utils/blockPatterns'
import { useToast } from '../contexts/ToastContext'
import { useConfirm } from '../contexts/ConfirmContext'

const NEW_COURSE_VALUE = '__new__'

export default function AssignmentManager() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [teachers, setTeachers] = useState([])
  const [branches, setBranches] = useState([])
  const [courseId, setCourseId] = useState('')
  const [newCourseName, setNewCourseName] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [teacherId, setTeacherId] = useState('')
  const [weeklyHours, setWeeklyHours] = useState('')
  const [blockPattern, setBlockPattern] = useState('')
  const [selectedBranchIds, setSelectedBranchIds] = useState(new Set())
  const [query, setQuery] = useState('')
  const [branchFilter, setBranchFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const toast = useToast()
  const confirmDialog = useConfirm()

  const fetchAll = useCallback(async () => {
    setFetching(true)
    const [assignmentResult, courseResult, teacherResult, branchResult] = await Promise.all([
      supabase.from('course_assignments').select('*, courses(course_name), teachers(full_name), branches(name)').order('id'),
      supabase.from('courses').select('*').order('course_name'),
      supabase.from('teachers').select('*').order('full_name'),
      supabase.from('branches').select('*').order('name'),
    ])
    if (assignmentResult.error) toast.error('Atamalar alınamadı: ' + assignmentResult.error.message)
    setAssignments(assignmentResult.data || [])
    setCourses(courseResult.data || [])
    setTeachers(teacherResult.data || [])
    setBranches(branchResult.data || [])
    setFetching(false)
  }, [toast])

  useEffect(() => { void Promise.resolve().then(fetchAll) }, [fetchAll])

  function toggleBranch(id) {
    setSelectedBranchIds((previous) => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }

  function toggleAllBranches() { setSelectedBranchIds(selectedBranchIds.size === branches.length ? new Set() : new Set(branches.map((branch) => branch.id))) }

  async function handleAdd(event) {
    event.preventDefault()
    const isNewCourse = courseId === NEW_COURSE_VALUE
    if ((isNewCourse && !newCourseName.trim()) || (!isNewCourse && !courseId)) return toast.warning('Bir ders seç veya yeni ders bilgilerini gir.')
    if (!teacherId || !weeklyHours || selectedBranchIds.size === 0) return toast.warning('Öğretmen, haftalık saat ve en az bir şube seçmelisin.')
    const { data: existing } = await supabase.from('course_assignments').select('weekly_hours').eq('teacher_id', teacherId)
    const currentTotal = (existing || []).reduce((sum, assignment) => sum + Number(assignment.weekly_hours || 0), 0)
    if (currentTotal + Number(weeklyHours) > 30) {
      const proceed = await confirmDialog({ title: 'Öğretmen yükü uyarısı', message: `Bu atamayla öğretmenin toplamı ${currentTotal + Number(weeklyHours)} saate çıkacak. Yine de devam edilsin mi?`, confirmLabel: 'Devam et' })
      if (!proceed) return
    }
    setLoading(true)
    let finalCourseId = courseId
    if (isNewCourse) {
      const { data, error } = await supabase.from('courses').insert({ course_name: newCourseName.trim(), course_code: newCourseCode.trim() || null }).select().single()
      if (error) { toast.error('Ders oluşturulamadı: ' + error.message); setLoading(false); return }
      finalCourseId = data.id
    }
    const rows = Array.from(selectedBranchIds).map((branchId) => ({ course_id: finalCourseId, teacher_id: teacherId, branch_id: branchId, weekly_hours: Number(weeklyHours), block_pattern: blockPattern || null }))
    const { error } = await supabase.from('course_assignments').insert(rows)
    setLoading(false)
    if (error) toast.error('Atama eklenemedi: ' + error.message)
    else { toast.success(`${rows.length} şube için atama oluşturuldu.`); setCourseId(''); setNewCourseName(''); setNewCourseCode(''); setTeacherId(''); setWeeklyHours(''); setBlockPattern(''); setSelectedBranchIds(new Set()); void fetchAll() }
  }

  async function handleDelete(id) {
    const ok = await confirmDialog({ title: 'Atamayı sil', message: 'Bu atama ve ona bağlı planlama ilişkisi silinecek. Devam edilsin mi?', confirmLabel: 'Atamayı sil' })
    if (!ok) return
    const { error } = await supabase.from('course_assignments').delete().eq('id', id)
    if (error) toast.error('Silinemedi: ' + error.message)
    else { toast.success('Atama silindi.'); void fetchAll() }
  }

  const filteredAssignments = useMemo(() => assignments.filter((assignment) => {
    const haystack = `${assignment.courses?.course_name || ''} ${assignment.teachers?.full_name || ''} ${assignment.branches?.name || ''}`.toLocaleLowerCase('tr-TR')
    return haystack.includes(query.toLocaleLowerCase('tr-TR')) && (!branchFilter || String(assignment.branch_id) === branchFilter)
  }), [assignments, query, branchFilter])
  const groupedAssignments = useMemo(() => {
    const groups = new Map()
    filteredAssignments.forEach((assignment) => {
      const key = String(assignment.teacher_id)
      if (!groups.has(key)) groups.set(key, { teacher: assignment.teachers?.full_name || 'Atanmamış öğretmen', assignments: [] })
      groups.get(key).assignments.push(assignment)
    })
    return Array.from(groups.values())
  }, [filteredAssignments])
  const courseOptions = [{ value: NEW_COURSE_VALUE, label: '+ Yeni ders oluştur' }, ...courses.map((course) => ({ value: course.id, label: course.course_name }))]
  const blockOptions = generateBlockPatterns(weeklyHours).map((pattern) => ({ value: pattern, label: pattern }))
  const isNewCourse = courseId === NEW_COURSE_VALUE

  return (
    <div className="page-canvas assignment-page"><div className="page-width assignment-page-width">
      <PageHeader title="Ders atamaları" subtitle="Ders, öğretmen, şube ve haftalık blok yapısını tek akışta tanımla" eyebrow="Program dosyası" />
      <div className="assignment-stats"><div><span>Toplam atama</span><strong>{assignments.length}</strong></div><div><span>Tanımlı ders</span><strong>{courses.length}</strong></div><div><span>Aktif öğretmen</span><strong>{new Set(assignments.map((assignment) => assignment.teacher_id)).size}</strong></div><div><span>Haftalık saat</span><strong>{assignments.reduce((sum, assignment) => sum + Number(assignment.weekly_hours || 0), 0)}</strong></div></div>
      <PageCard title="Yeni atama" description="Bir dersi bir veya birden fazla şubeye aynı ayarlarla tanımla."><form onSubmit={handleAdd} className="assignment-form">
        <div className="assignment-form-grid"><SelectField label="Ders" value={courseId} onChange={(value) => { setCourseId(value); setBlockPattern('') }} placeholder="Ders seç" options={courseOptions} />{isNewCourse && <><label>Yeni ders adı<input value={newCourseName} onChange={(event) => setNewCourseName(event.target.value)} placeholder="Kimya" /></label><label>Ders kodu<input value={newCourseCode} onChange={(event) => setNewCourseCode(event.target.value)} placeholder="KIM101" /></label></>}<SelectField label="Öğretmen" value={teacherId} onChange={setTeacherId} placeholder="Öğretmen seç" options={teachers.map((teacher) => ({ value: teacher.id, label: teacher.full_name }))} /><label>Haftalık saat<input type="number" min="1" max="40" value={weeklyHours} onChange={(event) => { setWeeklyHours(event.target.value); setBlockPattern('') }} placeholder="5" /></label><SelectField label="Blok yapısı" value={blockPattern} onChange={setBlockPattern} placeholder={weeklyHours ? 'Blok seç' : 'Önce saat gir'} options={blockOptions} /></div>
        <div className="branch-picker"><div className="branch-picker-head"><div><strong>Şubeler</strong><span>Bu atamanın uygulanacağı sınıfları seç.</span></div><button type="button" className="text-button" onClick={toggleAllBranches}>{selectedBranchIds.size === branches.length ? 'Seçimi kaldır' : 'Tümünü seç'}</button></div><div className="branch-picker-list">{branches.map((branch) => { const checked = selectedBranchIds.has(branch.id); return <button type="button" key={branch.id} onClick={() => toggleBranch(branch.id)} className={'branch-option ' + (checked ? 'is-selected' : '')}><span>{checked ? '✓' : ''}</span>{branch.name}</button> })}</div></div>
        <div className="assignment-submit"><span>{selectedBranchIds.size ? `${selectedBranchIds.size} şube seçildi` : 'En az bir şube seç'}</span><button type="submit" className="primary-button" disabled={loading}>{loading ? 'Oluşturuluyor...' : selectedBranchIds.size > 1 ? `${selectedBranchIds.size} şubeye ata` : 'Atamayı oluştur'}</button></div>
      </form></PageCard>
      <PageCard title="Atama dizini" description={`${filteredAssignments.length} kayıt gösteriliyor`}><div className="assignment-filters"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ders, öğretmen veya şube ara" /><select value={branchFilter} onChange={(event) => setBranchFilter(event.target.value)}><option value="">Tüm şubeler</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</select></div><div className="assignment-directory">{fetching ? <div className="directory-loading" /> : groupedAssignments.map((group) => <section className="assignment-teacher-group" key={group.teacher}><div className="assignment-teacher-heading"><strong>{group.teacher}</strong><span>{group.assignments.length} atama</span></div>{group.assignments.map((assignment) => <div className="assignment-row" key={assignment.id}><div className="assignment-row-main"><strong>{assignment.courses?.course_name}</strong></div><div className="assignment-row-branch">{assignment.branches?.name}</div><div className="assignment-row-meta"><b>{assignment.weekly_hours} saat</b><span>{assignment.block_pattern || 'Tekli saatler'}</span></div><button type="button" className="row-delete" onClick={() => handleDelete(assignment.id)} aria-label="Atamayı sil">Sil</button></div>)}</section>)}{!fetching && groupedAssignments.length === 0 && <div className="directory-empty">Filtrelere uyan atama bulunamadı.</div>}</div></PageCard>
    </div></div>
  )
}
