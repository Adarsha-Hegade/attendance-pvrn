'use client'

import { signout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'

export function LogoutButton() {
    return (
        <Button variant="ghost" onClick={() => signout()}>Sign Out</Button>
    )
}
