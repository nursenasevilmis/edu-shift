import { useState } from 'react'
import { Button, Input, Card } from '@heroui/react'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { signIn } = useAuth()
    const navigate = useNavigate()

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        setLoading(false)

        if (error) {
            setError('Email veya şifre hatalı.')
        } else {
            navigate('/')
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <Card className="w-full max-w-sm p-6">
                <h1 className="text-2xl font-bold mb-4 text-center">Giriş Yap</h1>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <Input
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <Input
                        label="Şifre"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    <Button color="primary" type="submit" isLoading={loading}>
                        Giriş Yap
                    </Button>
                </form>
            </Card>
        </div>
    )
}