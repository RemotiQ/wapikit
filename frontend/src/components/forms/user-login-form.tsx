'use client'
import { Button } from '~/components/ui/button'
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage
} from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useLogin } from '~/generated'
import { useLocalStorage } from '~/hooks/use-local-storage'
import { AUTH_TOKEN_LS } from '~/constants'

const formSchema = z.object({
	email: z.string().email({ message: 'Enter a valid email address' }),
	password: z.string().min(6, { message: 'Password must be at least 6 characters' })
})

type UserFormValue = z.infer<typeof formSchema>

export default function UserLoginForm() {
	const setAuthToken = useLocalStorage<string | undefined>(AUTH_TOKEN_LS, undefined)[1]

	const [isBusy, setIsBusy] = useState(false)

	const defaultValues = {
		email: '',
		password: ''
	}
	const form = useForm<UserFormValue>({
		resolver: zodResolver(formSchema),
		defaultValues
	})

	const mutation = useLogin()

	const onSubmit = async (data: UserFormValue) => {
		try {
			setIsBusy(true)
			await mutation.mutateAsync(
				{
					data: {
						password: data.password,
						username: data.email
					}
				},
				{
					onSuccess: data => {
						if (data.token) {
							setAuthToken(data.token)
							window.location.href = '/dashboard'
						} else {
							// something went wrong show error token not found
						}
					}
				}
			)
		} catch (error) {
			console.error({ error })
		} finally {
			setIsBusy(false)
		}
	}

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full flex-col gap-2 space-y-2"
				>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Email</FormLabel>
								<FormControl>
									<Input
										type="email"
										placeholder="Enter your email"
										disabled={isBusy}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="password"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Password</FormLabel>
								<FormControl>
									<Input
										type="password"
										placeholder="Enter your password"
										disabled={isBusy}
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<Button disabled={isBusy} className="ml-auto w-full" type="submit">
						Sign in
					</Button>
				</form>
			</Form>
		</>
	)
}
