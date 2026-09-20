import { useEffect, useState } from 'react'
import { Button, Input } from '@heroui/react'
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
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    const toast = useToast()
    const confirmDialog = useConfirm()

    useEffect(() => {
        fetchAll()
    }, [])

    async function fetchAll() {
        setFetching(true)
        const results = await Promise.all([
            supabase.from('course_assignments').select('*, courses(course_name), teachers(full_name), branches(name)').order('id'),
            supabase.from('courses').select('*').order('course_name'),
            supabase.from('teachers').select('*').order('full_name'),
            supabase.from('branches').select('*').order('name'),
        ])

        if (results[0].error) console.error('Atamalar alinamadi:', results[0].error)
        else setAssignments(results[0].data)

        setCourses(results[1].data || [])
        setTeachers(results[2].data || [])
        setBranches(results[3].data || [])
        setFetching(false)
    }

    function toggleBranch(id) {
        setSelectedBranchIds((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    function toggleAllBranches() {
        if (selectedBranchIds.size === branches.length) {
            setSelectedBranchIds(new Set())
        } else {
            setSelectedBranchIds(new Set(branches.map((b) => b.id)))
        }
    }

    async function handleAdd(e) {
        e.preventDefault()

        const isNewCourse = courseId === NEW_COURSE_VALUE
        if (isNewCourse && !newCourseName.trim()) {
            toast.warning('Yeni ders adi gir.')
            return
        }
        if (!isNewCourse && !courseId) {
            toast.warning('Bir ders sec veya yeni ders adi gir.')
            return
        }
        if (!teacherId || !weeklyHours || selectedBranchIds.size === 0) {
            toast.warning('Ogretmen, haftalik saat ve en az bir sube secmelisin.')
            return
        }

        // Bu ogretmenin mevcut toplam haftalik saatini kontrol et, asiri yuklenmeyi uyar
        const { data: existingForTeacher } = await supabase
            .from('course_assignments')
            .select('weekly_hours')
            .eq('teacher_id', teacherId)

        const currentTotal = (existingForTeacher || []).reduce((sum, a) => sum + (a.weekly_hours || 0), 0)
        const newTotal = currentTotal + Number(weeklyHours)

        if (newTotal > 30) {
            const proceed = await confirmDialog({
                title: 'Öğretmen yükü uyarısı',
                message: 'Bu öğretmenin toplam haftalık saati bu atamayla birlikte ' + newTotal + ' saate çıkacak. Bu normalin üzerinde bir yük. Yine de devam edilsin mi?',
                confirmLabel: 'Devam Et',
            })
            if (!proceed) return
        }

        setLoading(true)

        let finalCourseId = courseId

        if (isNewCourse) {
            const { data: newCourse, error: courseError } = await supabase
                .from('courses')
                .insert({ course_name: newCourseName, course_code: newCourseCode || null })
                .select()
                .single()

            if (courseError) {
                toast.error('Ders olusturulamadi: ' + courseError.message)
                setLoading(false)
                return
            }
            finalCourseId = newCourse.id
        }

        const rows = Array.from(selectedBranchIds).map((branchId) => ({
            course_id: finalCourseId,
            teacher_id: teacherId,
            branch_id: branchId,
            weekly_hours: Number(weeklyHours),
            block_pattern: blockPattern || null,
        }))

        const { error: insertError } = await supabase.from('course_assignments').insert(rows)

        setLoading(false)

        if (insertError) {
            toast.error('Atama eklenemedi: ' + insertError.message)
        } else {
            toast.success(rows.length + ' sube icin atama olusturuldu.')
            setCourseId('')
            setNewCourseName('')
            setNewCourseCode('')
            setTeacherId('')
            setWeeklyHours('')
            setBlockPattern('')
            setSelectedBranchIds(new Set())
            fetchAll()
        }
    }

    async function handleDelete(id) {
        const ok = await confirmDialog('Bu atamayi silmek istedigine emin misin? Bu islem geri alinamaz.')
        if (!ok) return

        const { error } = await supabase.from('course_assignments').delete().eq('id', id)
        if (error) toast.error('Silinemedi: ' + error.message)
        else {
            toast.success('Atama silindi.')
            fetchAll()
        }
    }

    const blockOptions = generateBlockPatterns(weeklyHours).map((p) => ({ value: p, label: p }))
    const isNewCourse = courseId === NEW_COURSE_VALUE

    const courseOptions = [
        { value: NEW_COURSE_VALUE, label: '+ Yeni Ders Olustur' },
        ...courses.map((c) => ({ value: c.id, label: c.course_name })),
    ]

    return (
        <div className="p-4 md:p-8">
            <PageHeader title="Ders Atamalari" subtitle="Bir dersi ogretmen ve blok yapisiyla birlikte birden fazla subeye tek seferde ata" />

            <PageCard title="Yeni Atama" className="mb-6">
                <form onSubmit={handleAdd} className="flex flex-col gap-4">
                    <div className="flex gap-3 items-end flex-wrap">
                        <SelectField
                            label="Ders"
                            value={courseId}
                            onChange={setCourseId}
                            placeholder="-- Ders Sec --"
                            className="min-w-[200px]"
                            options={courseOptions}
                        />

                        {isNewCourse && (
                            <>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-500">Yeni Ders Adi</label>
                                    <Input
                                        placeholder="orn: Kimya"
                                        value={newCourseName}
                                        onChange={(e) => setNewCourseName(e.target.value)}
                                        className="w-40"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-xs font-medium text-slate-500">Ders Kodu</label>
                                    <Input
                                        placeholder="orn: KIM101"
                                        value={newCourseCode}
                                        onChange={(e) => setNewCourseCode(e.target.value)}
                                        className="w-32"
                                    />
                                </div>
                            </>
                        )}

                        <SelectField
                            label="Ogretmen"
                            value={teacherId}
                            onChange={setTeacherId}
                            placeholder="-- Ogretmen Sec --"
                            className="min-w-[160px]"
                            options={teachers.map((t) => ({ value: t.id, label: t.full_name }))}
                        />

                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-medium text-slate-500">Haftalik Saat</label>
                            <Input
                                type="number"
                                placeholder="orn: 5"
                                value={weeklyHours}
                                onChange={(e) => {
                                    setWeeklyHours(e.target.value)
                                    setBlockPattern('')
                                }}
                                className="w-24"
                            />
                        </div>

                        <SelectField
                            label="Blok Yapisi"
                            value={blockPattern}
                            onChange={setBlockPattern}
                            placeholder={weeklyHours ? '-- Sec --' : 'Once saat gir'}
                            className="min-w-[150px]"
                            options={blockOptions}
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-slate-500">Subeler</label>
                            <button
                                type="button"
                                onClick={toggleAllBranches}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                {selectedBranchIds.size === branches.length ? 'Tumunu kaldir' : 'Tumunu sec'}
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {branches.map((b) => {
                                const checked = selectedBranchIds.has(b.id)
                                return (
                                    <button
                                        type="button"
                                        key={b.id}
                                        onClick={() => toggleBranch(b.id)}
                                        className={
                                            'flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors duration-150 ' +
                                            (checked
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300')
                                        }
                                    >
                                        <span
                                            className={
                                                'w-4 h-4 rounded flex items-center justify-center border ' +
                                                (checked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300')
                                            }
                                        >
                                            {checked && '✓'}
                                        </span>
                                        {b.name}
                                    </button>
                                )
                            })}
                            {branches.length === 0 && (
                                <p className="text-xs text-slate-400">Once Subeler sayfasindan sube ekle.</p>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button color="primary" type="submit" isLoading={loading} className="rounded font-medium">
                            {selectedBranchIds.size > 1
                                ? selectedBranchIds.size + ' Sube Icin Ata'
                                : 'Ata'}
                        </Button>
                    </div>
                </form>
            </PageCard>

            <PageCard title="Tum Atamalar" description={assignments.length + ' atama kayitli'}>
                <div className="flex flex-col gap-2">
                    {fetching && (
                        <div className="flex flex-col gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-slate-50 rounded animate-pulse"></div>
                            ))}
                        </div>
                    )}

                    {!fetching && assignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3.5 rounded bg-slate-50 hover:bg-slate-100 transition-colors duration-150">
                            <div>
                                <p className="font-medium text-slate-700 text-sm">
                                    {a.courses?.course_name}
                                    <span className="text-slate-300 mx-1.5">•</span>
                                    <span className="text-slate-500 font-normal">{a.teachers?.full_name}</span>
                                </p>
                                <p className="text-xs text-slate-400">
                                    {a.branches?.name} · {a.weekly_hours} saat{a.block_pattern ? ', ' + a.block_pattern : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(a.id)}
                                className="w-8 h-8 rounded flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    {!fetching && assignments.length === 0 && (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-sm">Henuz atama yapilmadi</p>
                        </div>
                    )}
                </div>
            </PageCard>
        </div>
    )
}