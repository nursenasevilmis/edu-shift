import { useEffect, useState } from 'react'
import { Button, Input } from '@heroui/react'
import { supabase } from '../supabaseClient'
import SelectField from '../components/SelectField'
import PageHeader from '../components/PageHeader'
import PageCard from '../components/PageCard'
import { generateBlockPatterns } from '../utils/blockPatterns'

export default function AssignmentManager() {
    const [assignments, setAssignments] = useState([])
    const [courses, setCourses] = useState([])
    const [teachers, setTeachers] = useState([])
    const [branches, setBranches] = useState([])

    const [courseId, setCourseId] = useState('')
    const [teacherId, setTeacherId] = useState('')
    const [branchId, setBranchId] = useState('')
    const [weeklyHours, setWeeklyHours] = useState('')
    const [blockPattern, setBlockPattern] = useState('')
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(true)

    useEffect(() => {
        fetchAll()
    }, [])

    // Haftalik saat degistikce blok secimini sifirla (eski secim yeni saatle uyumsuz olabilir)
    useEffect(() => {
        setBlockPattern('')
    }, [weeklyHours])

    async function fetchAll() {
        setFetching(true)
        const results = await Promise.all([
            supabase.from('course_assignments').select('*, courses(course_name), teachers(full_name), branches(name)').order('id'),
            supabase.from('courses').select('*').order('id'),
            supabase.from('teachers').select('*').order('id'),
            supabase.from('branches').select('*').order('id'),
        ])

        const a = results[0]
        if (a.error) console.error('Atamalar alinamadi:', a.error)
        else setAssignments(a.data)

        setCourses(results[1].data || [])
        setTeachers(results[2].data || [])
        setBranches(results[3].data || [])
        setFetching(false)
    }

    async function handleAdd(e) {
        e.preventDefault()
        if (!courseId || !teacherId || !branchId || !weeklyHours) {
            alert('Lutfen tum alanlari doldur.')
            return
        }

        setLoading(true)
        const { error } = await supabase.from('course_assignments').insert({
            course_id: courseId,
            teacher_id: teacherId,
            branch_id: branchId,
            weekly_hours: Number(weeklyHours),
            block_pattern: blockPattern || null,
        })
        setLoading(false)

        if (error) {
            alert('Hata: ' + error.message)
        } else {
            setCourseId('')
            setTeacherId('')
            setBranchId('')
            setWeeklyHours('')
            setBlockPattern('')
            fetchAll()
        }
    }

    async function handleDelete(id) {
        if (!confirm('Bu atamayi silmek istedigine emin misin?')) return
        const { error } = await supabase.from('course_assignments').delete().eq('id', id)
        if (error) alert('Hata: ' + error.message)
        else fetchAll()
    }

    const blockOptions = generateBlockPatterns(weeklyHours).map((p) => ({ value: p, label: p }))

    return (
        <div className="p-4 md:p-8">
            <PageHeader title="Ders Atamalari" subtitle="Hangi ogretmenin hangi dersi hangi subede okutacagini tanimla" />

            <PageCard title="Yeni Atama" className="mb-6">
                <form onSubmit={handleAdd} className="flex gap-3 items-end flex-wrap">
                    <SelectField
                        label="Ders"
                        value={courseId}
                        onChange={setCourseId}
                        placeholder="-- Ders Sec --"
                        className="min-w-[160px]"
                        options={courses.map((c) => ({ value: c.id, label: c.course_name }))}
                    />

                    <SelectField
                        label="Ogretmen"
                        value={teacherId}
                        onChange={setTeacherId}
                        placeholder="-- Ogretmen Sec --"
                        className="min-w-[160px]"
                        options={teachers.map((t) => ({ value: t.id, label: t.full_name }))}
                    />

                    <SelectField
                        label="Sube"
                        value={branchId}
                        onChange={setBranchId}
                        placeholder="-- Sube Sec --"
                        className="min-w-[140px]"
                        options={branches.map((b) => ({ value: b.id, label: b.name }))}
                    />

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-medium text-slate-500">Haftalik Saat</label>
                        <Input
                            type="number"
                            placeholder="orn: 5"
                            value={weeklyHours}
                            onChange={(e) => setWeeklyHours(e.target.value)}
                            className="w-28"
                        />
                    </div>

                    <SelectField
                        label="Blok Yapisi"
                        value={blockPattern}
                        onChange={setBlockPattern}
                        placeholder={weeklyHours ? '-- Sec --' : 'Once saat gir'}
                        className="min-w-[160px]"
                        options={blockOptions}
                    />

                    <Button color="primary" type="submit" isLoading={loading} className="rounded-xl font-medium">
                        Ekle
                    </Button>
                </form>
            </PageCard>

            <PageCard title="Tum Atamalar" description={assignments.length + ' atama kayitli'}>
                <div className="flex flex-col gap-2">
                    {fetching && (
                        <div className="flex flex-col gap-2">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse"></div>
                            ))}
                        </div>
                    )}

                    {!fetching && assignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors duration-150">
                            <div>
                                <p className="font-medium text-slate-700 text-sm">
                                    {a.courses?.course_name}
                                    <span className="text-slate-300 mx-1.5">•</span>
                                    <span className="text-slate-500 font-normal">{a.teachers?.full_name}</span>
                                </p>
                                <p className="text-xs text-slate-400">
                                    {a.branches?.name} — {a.weekly_hours} saat{a.block_pattern ? ', ' + a.block_pattern : ''}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(a.id)}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors duration-150"
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