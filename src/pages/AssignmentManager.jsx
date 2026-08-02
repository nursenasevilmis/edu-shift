import { useEffect, useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { supabase } from '../supabaseClient'

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

    useEffect(() => {
        fetchAll()
    }, [])

    async function fetchAll() {
        const [a, c, t, b] = await Promise.all([
            supabase
                .from('course_assignments')
                .select('*, courses(course_name), teachers(full_name), branches(name)')
                .order('id'),
            supabase.from('courses').select('*').order('id'),
            supabase.from('teachers').select('*').order('id'),
            supabase.from('branches').select('*').order('id'),
        ])

        if (a.error) console.error('Atamalar alınamadı:', a.error)
        else setAssignments(a.data)

        setCourses(c.data || [])
        setTeachers(t.data || [])
        setBranches(b.data || [])
    }

    async function handleAdd(e) {
        e.preventDefault()
        if (!courseId || !teacherId || !branchId || !weeklyHours) {
            alert('Lütfen tüm alanları doldur.')
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
        if (!confirm('Bu atamayı silmek istediğine emin misin?')) return

        const { error } = await supabase.from('course_assignments').delete().eq('id', id)

        if (error) alert('Hata: ' + error.message)
        else fetchAll()
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Ders Atamaları</h1>
            <p className="text-gray-500 text-sm mb-4">
                Hangi öğretmenin hangi dersi hangi şubede okutacağını burada tanımla.
            </p>

            <Card className="p-4 mb-6">
                <form onSubmit={handleAdd} className="flex gap-2 items-end flex-wrap">
                    <select
                        value={courseId}
                        onChange={(e) => setCourseId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                        <option value="">-- Ders Seç --</option>
                        {courses.map((c) => (
                            <option key={c.id} value={c.id}>{c.course_name}</option>
                        ))}
                    </select>

                    <select
                        value={teacherId}
                        onChange={(e) => setTeacherId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                        <option value="">-- Öğretmen Seç --</option>
                        {teachers.map((t) => (
                            <option key={t.id} value={t.id}>{t.full_name}</option>
                        ))}
                    </select>

                    <select
                        value={branchId}
                        onChange={(e) => setBranchId(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2"
                    >
                        <option value="">-- Şube Seç --</option>
                        {branches.map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>

                    <Input
                        label="Haftalık Saat"
                        type="number"
                        placeholder="örn: 5"
                        value={weeklyHours}
                        onChange={(e) => setWeeklyHours(e.target.value)}
                        className="w-32"
                    />

                    <Input
                        label="Blok Yapısı"
                        placeholder="örn: 2+3"
                        value={blockPattern}
                        onChange={(e) => setBlockPattern(e.target.value)}
                        className="w-40"
                    />

                    <Button color="primary" type="submit" isLoading={loading}>
                        Ekle
                    </Button>
                </form>
            </Card>

            <div className="flex flex-col gap-2">
                {assignments.map((a) => (
                    <Card key={a.id} className="p-3 flex flex-row justify-between items-center">
                        <span>
                            <strong>{a.courses?.course_name}</strong> — {a.teachers?.full_name} — {a.branches?.name}
                            {' '}({a.weekly_hours} saat{a.block_pattern ? `, ${a.block_pattern}` : ''})
                        </span>
                        <Button color="danger" size="sm" onClick={() => handleDelete(a.id)}>
                            Sil
                        </Button>
                    </Card>
                ))}
                {assignments.length === 0 && (
                    <p className="text-gray-500 text-center">Henüz atama yapılmadı.</p>
                )}
            </div>
        </div>
    )
}