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
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useRegister, useVerifyOtp } from '~/generated'
import { useLocalStorage } from '~/hooks/use-local-storage'
import { AUTH_TOKEN_LS, REDIRECT_URL_LS } from '~/constants'
import { errorNotification } from '~/reusable-functions'
import { useSearchParams, useRouter } from 'next/navigation'

const otpFormSchema = z.object({
	otp: z.string().length(6, { message: 'OTP must be 6 characters' })
})

const confirmEmailFormSchema = z.object({
	email: z.string().email({ message: 'Enter a valid email address' })
})
const resetPasswordFormSchema = z.object({
	password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
	confirmPassword: z.string().min(6, { message: 'Password must be at least 6 characters' })
})
type confirmEmailValue = z.infer<typeof confirmEmailFormSchema>
type resetPasswordFormValue = z.infer<typeof resetPasswordFormSchema>
type OtpFormValue = z.infer<typeof otpFormSchema>

export default function UserResetPasswordForm() {
	const setAuthToken = useLocalStorage<string | undefined>(AUTH_TOKEN_LS, undefined)[1]
	const [redirectUrl, setRedirectUrl] = useLocalStorage<string | undefined>(
		REDIRECT_URL_LS,
		undefined
	)
	const searchParams = useSearchParams()
	const router = useRouter()

	useEffect(() => {
		const redirectUrl = searchParams.get('redirectUri')
		if (redirectUrl) {
			setRedirectUrl(redirectUrl)
		}
	}, [searchParams, setRedirectUrl])

	const [isBusy, setIsBusy] = useState(false)
	const [activeForm, setActiveForm] = useState<
		'confirmEmailForm' | 'otpForm' | 'resetpasswordForm'
	>('confirmEmailForm')

	const defaultValues = {
		email: ''
	}

	const confirmEmailForm = useForm<confirmEmailValue>({
		resolver: zodResolver(confirmEmailFormSchema),
		defaultValues
	})

	const otpForm = useForm<OtpFormValue>({
		resolver: zodResolver(otpFormSchema),
		defaultValues: {
			otp: ''
		}
	})

	const resetPasswordForm = useForm<resetPasswordFormValue>({
		resolver: zodResolver(otpFormSchema),
		defaultValues: {
			password: '',
			confirmPassword: ''
		}
	})

	const sendEmailConfirmationOtpMutation = useRegister()
	const createAccountMutation = useVerifyOtp()

	async function ConfirmEmail(data: confirmEmailValue) {
		try {
			if (isBusy) {
				return
			}
			setIsBusy(true)

			if (data.password !== data.confirmPassword) {
				errorNotification({
					message: 'Passwords do not match'
				})
				return
			}

			const response = await sendEmailConfirmationOtpMutation.mutateAsync({
				data: {
					email: data.email
				}
			})

			if (response.isOtpSent) {
				// open the otp form
				setActiveForm(() => 'otpForm')
			} else {
				// something went wrong show error token not found
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong'
			})
		} finally {
			setIsBusy(false)
		}
	}

	async function submitOtp(data: OtpFormValue) {
		try {
			if (isBusy) {
				return
			}
			setIsBusy(true)

			const userData = confirmEmailForm.getValues()

			const response = await createAccountMutation.mutateAsync({
				data: {
					// password: userData.password,
					// username: userData.username,
					email: userData.email,
					otp: data.otp
				}
			})

			if (response.token) {
				setAuthToken(response.token)

				if (redirectUrl) {
					router.push(redirectUrl)
					return
				} else {
					window.location.href = '/signin'
				}
			} else {
				// something went wrong show error token not found
				errorNotification({
					message: 'Something went wrong'
				})
			}
		} catch (error) {
			console.error(error)
			errorNotification({
				message: 'Something went wrong'
			})
		} finally {
			setIsBusy(false)
		}
	}

	async function resetPassword(data: resetPasswordFormValue) {}

	return (
		<>
			{activeForm === 'confirmEmailForm' ? (
				<Form {...confirmEmailForm}>
					<div className="flex flex-col justify-center space-y-6">
						<p className="text-sm font-normal text-muted-foreground">
							We will send an email with verification code.
						</p>
						<form
							onSubmit={confirmEmailForm.handleSubmit(ConfirmEmail)}
							className="flex w-full flex-col gap-1"
							id="registration-details-form"
						>
							<FormField
								control={confirmEmailForm.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												type="email"
												placeholder="you@youremail.com"
												disabled={isBusy}
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<Button disabled={isBusy} className="ml-auto mt-2 w-full" type="submit">
								Next
							</Button>
							<Button
								onClick={e => {
									e.preventDefault()
									router.push('/signin')
								}}
								variant={'link'}
							>
								Go Back
							</Button>
						</form>
					</div>
				</Form>
			) : activeForm === 'otpForm' ? (
				<Form {...otpForm}>
					<p className="text-sm font-normal text-muted-foreground">
						We send an email with verification code. Please check
						your spam folder as well.
					</p>
					<form
						onSubmit={otpForm.handleSubmit(submitOtp)}
						className="flex w-full flex-col gap-2 space-y-2"
						id="otp-form"
					>
						<FormField
							control={otpForm.control}
							name="otp"
							key={'otp_field'}
							render={({ field }) => (
								<FormItem>
									<FormLabel>Otp</FormLabel>
									<FormControl>
										<Input
											id="otp"
											placeholder="enter otp"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={isBusy} className="ml-auto w-full" type="submit">
							Next
						</Button>
					</form>
				</Form>
			) : (
				<Form {...resetPasswordForm}>
					<p className="text-sm font-normal text-muted-foreground">
						Set New password.
					</p>
					<form
						onSubmit={resetPasswordForm.handleSubmit(resetPassword)}
						className="flex w-full flex-col gap-1"
						id="registration-details-form"
					>
						<FormField
							control={resetPasswordForm.control}
							name="password"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="at least 6 characters"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={resetPasswordForm.control}
							name="confirmPassword"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Confirm Password</FormLabel>
									<FormControl>
										<Input
											type="password"
											placeholder="confirm your password"
											disabled={isBusy}
											{...field}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button disabled={isBusy} className="ml-auto mt-2 w-full" type="submit">
							Set New Password
						</Button>
					</form>
				</Form>
			)}
		</>
	)
}
